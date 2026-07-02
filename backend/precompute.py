import sys
import json
import asyncio
import pandas as pd
from typing import List, Dict

# Make sure we can import from talentarc_core
import os
sys.path.append(os.path.dirname(__file__))

from talentarc_core.llm.agents import batch_extract_skills

def load_raw_candidates(jsonl_path: str) -> List[Dict]:
    """
    For precomputation, we just need the raw career_history strings to send to the LLM.
    We don't need the strict jsonschema loader here, because this is just text extraction.
    However, using the core loader would be fine too. 
    We'll do a simple read here to grab the JSON objects directly.
    """
    candidates = []
    with open(jsonl_path, "r") as f:
        for line in f:
            if line.strip():
                candidates.append(json.loads(line))
    return candidates

async def main():
    print("[Precompute] Starting Agentic LLM Extraction Phase...")
    
    input_file = "data/sample_candidates.jsonl"
    output_file = "data/llm_features.parquet"
    
    if not os.path.exists(input_file):
        print(f"[Error] Could not find {input_file}")
        sys.exit(1)
        
    candidates = load_raw_candidates(input_file)
    print(f"[Precompute] Loaded {len(candidates)} candidates for extraction.")
    
    # In a real funnel, we would pre-filter this to 3,000-5,000 candidates.
    # For this mock, we process all of them.
    
    extracted_features = await batch_extract_skills(candidates, concurrency=5)
    print(f"[Precompute] Extracted {len(extracted_features)} skill-verb pairs.")
    
    if not extracted_features:
        print("[Precompute] No features extracted. Exiting.")
        sys.exit(0)
        
    # Convert to DataFrame and apply categorical types to save massive amounts of RAM/Disk
    df = pd.DataFrame(extracted_features)
    
    # Enforce expected schema
    for col in ['candidate_id', 'skill_name', 'action_verb']:
        if col in df.columns:
            df[col] = df[col].astype('category')
            
    if 'verified_boolean' in df.columns:
        df['verified_boolean'] = df['verified_boolean'].astype(bool)
        
    if 'verb_strength_score' in df.columns:
        df['verb_strength_score'] = df['verb_strength_score'].astype('float32')
        
    # Write to parquet
    # Ensure data directory exists for the output
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    df.to_parquet(output_file, engine='pyarrow', index=False)
    
    print(f"[Precompute] Successfully wrote highly compressed features to {output_file}")
    
    # Print a sample
    print(df.head())

if __name__ == "__main__":
    asyncio.run(main())
