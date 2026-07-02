import pandas as pd
import numpy as np

def calculate_velocity(df: pd.DataFrame) -> pd.DataFrame:
    """
    Calculates career velocity based purely on date-arithmetic and role counting.
    Input `df` is the exploded long-format career_history DataFrame.
    Returns a DataFrame with candidate_id and a single velocity_score (0.0 to 1.0).
    """
    if df.empty:
        return pd.DataFrame(columns=['candidate_id', 'velocity_score'])
        
    # We only operate on rows that have a valid start_date
    valid_roles = df.dropna(subset=['start_date']).copy()
    
    # Fill missing end_dates with today's date to calculate current tenure
    today = pd.Timestamp.now().normalize()
    valid_roles['end_date'] = valid_roles['end_date'].fillna(today)
    
    # Calculate tenure in days for each role
    valid_roles['tenure_days'] = (valid_roles['end_date'] - valid_roles['start_date']).dt.days
    
    # Negative tenures imply malformed data. Clip to 0.
    valid_roles['tenure_days'] = valid_roles['tenure_days'].clip(lower=0)
    
    # Group by candidate
    grouped = valid_roles.groupby('candidate_id', observed=True)
    
    # 1. Total roles held
    role_counts = grouped.size()
    
    # 2. Total career duration (max end_date - min start_date)
    career_start = grouped['start_date'].min()
    career_end = grouped['end_date'].max()
    career_duration_days = (career_end - career_start).dt.days.clip(lower=1)
    
    # 3. Average promotion cadence (roles per year)
    roles_per_year = role_counts / (career_duration_days / 365.25)
    
    # 4. Scope expansion heuristic
    # A candidate who held 4 roles in 5 years has high velocity.
    # Normalize this to a 0.0 - 1.0 score. Max cap at ~1.5 roles per year.
    velocity_score = (roles_per_year / 1.5).clip(upper=1.0)
    
    # 5. Stability penalty for extreme job hopping
    # If they average less than 6 months (180 days) per role across their career, penalize.
    avg_tenure = grouped['tenure_days'].mean()
    penalty_mask = avg_tenure < 180
    
    # Apply penalty
    velocity_score = np.where(penalty_mask, velocity_score * 0.5, velocity_score)
    
    # Convert to DataFrame
    velocity_df = pd.DataFrame({
        'candidate_id': role_counts.index,
        'velocity_score': velocity_score
    }).reset_index(drop=True)
    
    # For candidates with no valid roles, score is 0
    all_candidates = pd.DataFrame({'candidate_id': df['candidate_id'].unique()})
    result = all_candidates.merge(velocity_df, on='candidate_id', how='left')
    result['velocity_score'] = result['velocity_score'].fillna(0.0).astype('float32')
    
    return result

if __name__ == "__main__":
    from backend.talentarc_core.data.loader import ingest_candidates
    df = ingest_candidates("data/sample_candidates.jsonl")
    vel_df = calculate_velocity(df)
    print(vel_df)
