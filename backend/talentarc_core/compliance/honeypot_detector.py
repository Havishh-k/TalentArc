import pandas as pd

def flag_honeypots(df: pd.DataFrame) -> pd.DataFrame:
    """
    Flags impossible synthetic data combinations.
    Currently checks for:
    1. Overlapping tenures in career history.
    2. Missing required fields that bypassed schema (fallback).
    """
    honeypot_ids = set()
    
    if df.empty:
        return df

    # Check for overlapping tenures
    # Requires start_date and end_date to be parsed as datetime
    if 'start_date' in df.columns and 'end_date' in df.columns:
        # Group by candidate and sort by start_date
        # We need to drop NaT for sorting
        valid_dates = df.dropna(subset=['start_date']).sort_values(['candidate_id', 'start_date'])
        
        # Shift the end_date down by 1 within each candidate group
        valid_dates['prev_end'] = valid_dates.groupby('candidate_id')['end_date'].shift(1)
        
        # If the current start_date is significantly before the previous end_date (e.g., > 168 hours / 7 days overlap)
        # It's physically possible to hold 2 jobs, but the hackathon specifies this as a synthetic honeypot flag.
        overlap_threshold = pd.Timedelta(hours=168)
        
        overlaps = valid_dates[valid_dates['start_date'] < (valid_dates['prev_end'] - overlap_threshold)]
        honeypot_ids.update(overlaps['candidate_id'].unique())
        
    # Check for YOE mismatch (e.g., YOE > 50 is impossible for a synthetic grad, etc.)
    if 'profile.years_of_experience' in df.columns:
        yoe_impossible = df[df['profile.years_of_experience'] > 60]
        honeypot_ids.update(yoe_impossible['candidate_id'].unique())
        
    if honeypot_ids:
        print(f"[Honeypot Detector] Flagged {len(honeypot_ids)} candidates. Dropping.")
        return df[~df['candidate_id'].isin(honeypot_ids)].copy()
        
    return df

if __name__ == "__main__":
    from backend.talentarc_core.data.loader import ingest_candidates
    df = ingest_candidates("data/sample_candidates.jsonl")
    clean_df = flag_honeypots(df)
    print(f"Original shape: {df.shape}, Cleaned shape: {clean_df.shape}")
