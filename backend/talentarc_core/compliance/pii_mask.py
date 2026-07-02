import pandas as pd

def apply_pii_masking(df: pd.DataFrame) -> pd.DataFrame:
    """
    Masks PII elements like institution, current_company, and education.tier
    before any embedding or LLM interaction occurs.
    """
    # Clone to avoid setting with copy warnings
    masked_df = df.copy()
    
    # Mask Education Tier
    if 'education.tier' in masked_df.columns:
        masked_df['education.tier'] = "Tier [MASKED]"
        
    # Mask Institution
    if 'education.institution' in masked_df.columns:
        masked_df['education.institution'] = "Institution [MASKED]"
        
    # Mask Company (if the candidate's company is currently a well-known entity)
    if 'company' in masked_df.columns:
        # For twin auditor, we might want to mask these sequentially or categorically
        # For pure DPDP compliance in scoring, we replace actual names
        masked_df['company'] = masked_df['company'].apply(
            lambda x: f"Company [{hash(str(x)) % 1000}]" if pd.notnull(x) else x
        )
        
    # Mask Name
    if 'profile.anonymized_name' in masked_df.columns:
        # The TRD mentions names are already anonymized, but to be sure for the Sandbox:
        masked_df['profile.anonymized_name'] = "Candidate [MASKED]"
        
    return masked_df

if __name__ == "__main__":
    from backend.talentarc_core.data.loader import ingest_candidates
    df = ingest_candidates("data/sample_candidates.jsonl")
    masked_df = apply_pii_masking(df)
    print(masked_df[['candidate_id', 'profile.anonymized_name', 'education.institution', 'company']].head())
