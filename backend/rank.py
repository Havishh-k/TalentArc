import os
import sys
import json
import time
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

# Import talentarc_core modules
sys.path.append(os.path.dirname(__file__))

from talentarc_core.data.loader import ingest_candidates
from talentarc_core.compliance.pii_mask import apply_pii_masking
from talentarc_core.compliance.honeypot_detector import flag_honeypots
from talentarc_core.scoring.career_velocity import calculate_velocity
from talentarc_core.scoring.composite import calculate_composite_scores
from talentarc_core.compliance.counterfactual_auditor import run_auditor
from chromadb.utils.embedding_functions import DefaultEmbeddingFunction

def build_candidate_strings(df: pd.DataFrame) -> pd.Series:
    """
    Builds the text string for semantic embedding for each candidate.
    Must be efficient.
    """
    def _build_str(group):
        skills = " ".join(group['technologies'].dropna().explode().astype(str).unique())
        roles = " ".join(group['role_title'].dropna().astype(str).unique())
        return f"{roles} {skills}"
        
    # Group by candidate_id
    strings = df.groupby('candidate_id', observed=True).apply(_build_str)
    return strings

def main():
    start_time = time.time()
    print("[Rank] Starting Phase 3 Offline Ranking...")
    
    # Check for network usage block (simulated by unsetting keys)
    os.environ.pop("ANTHROPIC_API_KEY", None)
    
    candidates_file = "data/sample_candidates.jsonl"
    llm_cache_file = "data/llm_features.parquet"
    job_description = "We need a Senior Python Developer with FastAPI and Docker experience."
    
    print("[Rank] 1. Ingesting and validating data...")
    df = ingest_candidates(candidates_file)
    
    if df.empty:
        print("[Rank] No valid candidates found.")
        sys.exit(1)
        
    print("[Rank] 2. Applying PII masking...")
    df = apply_pii_masking(df)
    
    print("[Rank] 3. Detecting and purging honeypots...")
    df = flag_honeypots(df)
    
    # We need a base unique dataframe for candidates to track scores
    unique_candidates = pd.DataFrame({'candidate_id': df['candidate_id'].unique()})
    
    print("[Rank] 4. Calculating Career Velocity (Vectorized)...")
    velocity_df = calculate_velocity(df)
    
    print("[Rank] 5. Loading Phase 2 LLM Feature Cache...")
    if os.path.exists(llm_cache_file):
        llm_features_df = pd.read_parquet(llm_cache_file)
    else:
        print("[Rank] WARNING: llm_features.parquet not found. Falling back to 0.5 multipliers.")
        llm_features_df = pd.DataFrame(columns=['candidate_id', 'verb_strength_score'])
        
    print("[Rank] 6. Building semantic embeddings (ONNX CPU)...")
    cand_strings = build_candidate_strings(df)
    
    # Embed JD
    ef = DefaultEmbeddingFunction()
    jd_embedding = ef([job_description])[0]
    
    # Embed candidates (batching for performance if large)
    # Using small batch for mock
    texts = cand_strings.tolist()
    cand_embeddings = ef(texts)
    
    # Cosine Similarity
    sim_scores = cosine_similarity([jd_embedding], cand_embeddings)[0]
    
    # Create aligned series
    semantic_scores = pd.Series(sim_scores, index=cand_strings.index)
    
    # We need df_base for the composite scorer (1 row per candidate)
    # Get the latest profile data
    df_base = df.drop_duplicates(subset=['candidate_id'], keep='last').copy()
    
    print("[Rank] 7. Calculating Composite Scores...")
    scored_df = calculate_composite_scores(
        df_base, 
        velocity_df, 
        semantic_scores, 
        llm_features_df
    )
    
    top_100 = scored_df.head(100).copy()
    
    print("[Rank] 8. Running Counterfactual Twin Auditor...")
    audit_json = run_auditor(
        top_100,
        df_base,
        velocity_df,
        semantic_scores,
        llm_features_df,
        calculate_composite_scores
    )
    
    # Write outputs
    print("[Rank] 9. Generating Output Files...")
    with open("compliance_audit.json", "w") as f:
        json.dump(audit_json, f, indent=2)
        
    # submission.csv requires: candidate_id,rank,score,reasoning
    # Mocking reasoning for offline ranking since we can't call LLM here
    top_100['reasoning'] = "Offline fallback reasoning based on composite score."
    top_100 = top_100.rename(columns={'composite_score': 'score'})
    
    submission_df = top_100[['candidate_id', 'rank', 'score', 'reasoning']]
    submission_df.to_csv("submission.csv", index=False)
    
    elapsed = time.time() - start_time
    print(f"[Rank] Finished successfully in {elapsed:.2f} seconds.")
    print("Files created: submission.csv, compliance_audit.json")

if __name__ == "__main__":
    main()
