import pandas as pd
import numpy as np

def calculate_composite_scores(
    df_base: pd.DataFrame, 
    velocity_df: pd.DataFrame, 
    semantic_scores: pd.Series, 
    llm_features_df: pd.DataFrame,
    weights: dict = None
) -> pd.DataFrame:
    """
    Combines all 4 scoring pillars into a final rankable DataFrame.
    """
    if weights is None:
        weights = {
            "semantic": 0.4,
            "career": 0.2,
            "velocity": 0.2,
            "github": 0.2
        }
        
    # Merge velocity scores
    scores_df = pd.merge(df_base, velocity_df, on='candidate_id', how='left')
    scores_df['velocity_score'] = scores_df['velocity_score'].fillna(0.0)
    
    # Merge semantic scores (Series aligned with df_base index)
    scores_df['semantic_score'] = semantic_scores.values
    
    # Process career metadata score
    # Based on YOE (normalized to 15 years max for scoring purposes)
    yoe = scores_df.get('profile.years_of_experience', pd.Series(np.zeros(len(scores_df))))
    scores_df['career_metadata_score'] = (yoe / 15.0).clip(upper=1.0).astype('float32')
    
    # Process GitHub score (from redrob_signals)
    github_score = scores_df.get('redrob_signals.github_activity_score', pd.Series(np.zeros(len(scores_df))))
    # Handle -1 (no github) by treating as 0
    scores_df['github_score'] = np.where(github_score < 0, 0.0, github_score).astype('float32')
    
    # Process LLM Action-Verb extraction multiplier
    if llm_features_df is not None and not llm_features_df.empty:
        # Average verb strength per candidate
        avg_verb_strength = llm_features_df.groupby('candidate_id', observed=True)['verb_strength_score'].mean()
        scores_df = pd.merge(scores_df, avg_verb_strength.rename('llm_multiplier'), on='candidate_id', how='left')
        
        # Fallback to the population median instead of a flat 0.5 to avoid systematically 
        # penalizing hidden-gem candidates who didn't pass through the LLM funnel phase.
        fallback_val = float(avg_verb_strength.median()) if not avg_verb_strength.empty else 0.5
        scores_df['llm_multiplier'] = scores_df['llm_multiplier'].fillna(fallback_val)
    else:
        scores_df['llm_multiplier'] = 0.5
        
    # We apply the LLM multiplier to the semantic score
    # A strong narrative boosts semantic fit, weak narrative reduces it.
    scores_df['adjusted_semantic_score'] = (scores_df['semantic_score'] * (0.5 + scores_df['llm_multiplier'])).clip(upper=1.0)
    
    # Calculate final composite
    scores_df['composite_score'] = (
        (scores_df['adjusted_semantic_score'] * weights["semantic"]) +
        (scores_df['career_metadata_score'] * weights["career"]) +
        (scores_df['velocity_score'] * weights["velocity"]) +
        (scores_df['github_score'] * weights["github"])
    )
    
    # Sort and rank
    scores_df = scores_df.sort_values(['composite_score', 'candidate_id'], ascending=[False, True])
    scores_df['rank'] = np.arange(1, len(scores_df) + 1)
    
    return scores_df
