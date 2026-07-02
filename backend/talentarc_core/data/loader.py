import json
import os
from typing import Iterator, List, Dict
import pandas as pd
import jsonschema
from jsonschema import validate

def load_schema(schema_path: str = "data/candidate_schema.json") -> dict:
    with open(schema_path, "r") as f:
        return json.load(f)

def iter_valid_candidates(jsonl_path: str, schema: dict) -> Iterator[Dict]:
    """Yields valid candidate dicts, quarantining malformed ones."""
    with open(jsonl_path, "r") as f:
        for line in f:
            if not line.strip():
                continue
            record = json.loads(line)
            try:
                validate(instance=record, schema=schema)
                yield record
            except jsonschema.ValidationError as e:
                # Log quarantine instead of silent imputation
                print(f"[Quarantine] Invalid schema for {record.get('candidate_id', 'UNKNOWN')}: {e.message}")

def ingest_candidates(jsonl_path: str, schema_path: str = "data/candidate_schema.json") -> pd.DataFrame:
    """
    Ingests JSONL, validates strictly, flattens career_history, and applies categorical dtypes.
    """
    schema = load_schema(schema_path)
    
    # We collect valid records (can be batched for extremely large datasets)
    records = list(iter_valid_candidates(jsonl_path, schema))
    
    if not records:
        return pd.DataFrame()

    # Convert to pandas. PyArrow backend can be specified in newer Pandas versions, 
    # but json_normalize handles the nested arrays well.
    # We use json_normalize to explode career_history.
    
    # First, separate the base candidate info from the career history
    df_base = pd.json_normalize(
        records, 
        max_level=1
    )
    
    # We need to deeply explode the career_history
    df_career = pd.json_normalize(
        records,
        record_path=['career_history'],
        meta=['candidate_id'],
        errors='ignore'
    )
    
    # Optimize types
    df_base['candidate_id'] = df_base['candidate_id'].astype('category')
    if 'profile.current_company_size' in df_base.columns:
        df_base['profile.current_company_size'] = df_base['profile.current_company_size'].astype('category')
    if 'education.tier' in df_base.columns:
        df_base['education.tier'] = df_base['education.tier'].astype('category')
        
    df_career['candidate_id'] = df_career['candidate_id'].astype('category')
    
    # Merge base and career
    df_merged = pd.merge(df_base, df_career, on='candidate_id', how='left')
    
    # Parse dates explicitly to avoid Pandas row-by-row bottlenecks
    if 'start_date' in df_merged.columns:
        df_merged['start_date'] = pd.to_datetime(df_merged['start_date'], format='%Y-%m-%d', errors='coerce')
    if 'end_date' in df_merged.columns:
        df_merged['end_date'] = pd.to_datetime(df_merged['end_date'], format='%Y-%m-%d', errors='coerce')
        
    return df_merged

if __name__ == "__main__":
    # Test script
    df = ingest_candidates("data/sample_candidates.jsonl")
    print(df.dtypes)
    print(df.head())
