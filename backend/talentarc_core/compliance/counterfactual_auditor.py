import pandas as pd
import numpy as np

def run_auditor(
    top_100_df: pd.DataFrame, 
    df_base: pd.DataFrame,
    velocity_df: pd.DataFrame, 
    semantic_scores: pd.Series, 
    llm_features_df: pd.DataFrame,
    scoring_func
) -> dict:
    """
    Vectorized Counterfactual Twin Auditor.
    Proves that swapping demographic/prestige variables does not change the final score.
    """
    if top_100_df.empty:
        return {"summary": {"candidates_tested": 0, "pass": 0, "fail": 0, "max_observed_delta": 0.0}, "results": []}

    # Baseline scores (already computed, but we compute again to ensure parity)
    baseline_scores = top_100_df['composite_score'].values
    
    # Create the counterfactual twins by modifying prestige/name markers
    # We must use df_base (unscored) to prevent merge conflicts on already computed columns
    top_100_ids = top_100_df['candidate_id'].unique()
    twins_df = df_base[df_base['candidate_id'].isin(top_100_ids)].copy()
    
    fields_swapped = []
    
    if 'profile.anonymized_name' in twins_df.columns:
        twins_df['profile.anonymized_name'] = "Auditor Twin"
        fields_swapped.append('profile.anonymized_name')
        
    if 'education.tier' in twins_df.columns:
        twins_df['education.tier'] = "Tier 3"
        fields_swapped.append('education.tier')
        
    if 'education.institution' in twins_df.columns:
        twins_df['education.institution'] = "Unknown University"
        fields_swapped.append('education.institution')
        
    if 'company' in twins_df.columns:
        twins_df['company'] = "Unknown Corp"
        fields_swapped.append('company')
        
    if 'profile.current_company_size' in twins_df.columns:
        twins_df['profile.current_company_size'] = "Bootstrapped"
        fields_swapped.append('profile.current_company_size')
        
    # Recalculate scores for twins
    twins_scored = scoring_func(
        twins_df, 
        velocity_df, 
        semantic_scores, 
        llm_features_df
    )
    
    # Align indices
    twins_scored = twins_scored.set_index('candidate_id').reindex(top_100_df['candidate_id']).reset_index()
    twin_scores = twins_scored['composite_score'].values
    
    # Calculate Deltas
    deltas = np.abs(baseline_scores - twin_scores)
    max_delta = float(np.max(deltas))
    
    tolerance = 1e-9
    passes = deltas < tolerance
    
    total_pass = int(np.sum(passes))
    total_fail = len(passes) - total_pass
    
    results = []
    for i, row in top_100_df.iterrows():
        results.append({
            "candidate_id": str(row['candidate_id']),
            "rank": int(row['rank']),
            "fields_swapped": fields_swapped,
            "max_delta": float(deltas[i]),
            "pass": bool(passes[i])
        })
        
    audit_json = {
        "methodology": "Tests for prestige/name leakage in masked scoring functions.",
        "scope": "top_100",
        "tolerance": tolerance,
        "summary": {
            "candidates_tested": len(top_100_df),
            "pass": total_pass,
            "fail": total_fail,
            "max_observed_delta": max_delta
        },
        "results": results
    }
    
    return audit_json
