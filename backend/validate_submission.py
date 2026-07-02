import os
import sys
import pandas as pd
import json

def validate_submission(raw_csv_path: str = ".submission_raw.csv", 
                       audit_json_path: str = "compliance_audit.json", 
                       final_csv_path: str = "submission.csv"):
    
    print("[Validator] Starting TRD validations...")
    
    if not os.path.exists(raw_csv_path):
        print(f"[Validator] ERROR: {raw_csv_path} not found. Run rank.py first.")
        sys.exit(1)
        
    if not os.path.exists(audit_json_path):
        print(f"[Validator] ERROR: {audit_json_path} not found.")
        sys.exit(1)
        
    df = pd.read_csv(raw_csv_path)
    
    # 1. 100 Rows
    if len(df) != 100:
        print(f"[Validator] ERROR: Expected exactly 100 rows, found {len(df)}")
        sys.exit(1)
        
    # 2. Columns match
    expected_cols = ["candidate_id", "rank", "score", "reasoning"]
    if list(df.columns) != expected_cols:
        print(f"[Validator] ERROR: Expected columns {expected_cols}, got {list(df.columns)}")
        sys.exit(1)
        
    # 3. Ranks are strictly 1 to 100
    if not (df['rank'] == range(1, 101)).all():
        print("[Validator] ERROR: Ranks are not strictly 1 to 100.")
        sys.exit(1)
        
    # 4. Monotonically non-increasing scores
    if not df['score'].is_monotonic_decreasing:
        print("[Validator] ERROR: Scores are not monotonically decreasing/non-increasing as rank increases.")
        sys.exit(1)
        
    # 5. Tie-breaking check
    # For any rows with the exact same score, candidate_id must be sorted ascending alphabetically
    duplicates = df[df.duplicated(subset=['score'], keep=False)]
    for score, group in duplicates.groupby('score'):
        if not group['candidate_id'].is_monotonic_increasing:
            print(f"[Validator] ERROR: Tie-break failed for score {score}. Candidate IDs must be alphabetical.")
            sys.exit(1)
            
    # 6. Audit JSON check
    with open(audit_json_path, 'r') as f:
        audit = json.load(f)
        
    summary = audit.get("summary", {})
    if summary.get("candidates_tested", 0) < 100:
        print(f"[Validator] ERROR: Audit tested fewer than 100 candidates: {summary.get('candidates_tested')}")
        sys.exit(1)
        
    if summary.get("max_observed_delta", 1.0) >= 1e-9:
        print(f"[Validator] ERROR: Max observed delta {summary.get('max_observed_delta')} exceeds 1e-9 tolerance. Leakage detected!")
        sys.exit(1)
        
    # Success! Rename to the final legitimate file
    if os.path.exists(final_csv_path):
        os.remove(final_csv_path)
        
    os.rename(raw_csv_path, final_csv_path)
    print(f"[Validator] ALL CHECKS PASSED. Generated {final_csv_path}.")
    print("[Validator] Submission is valid and ready.")

if __name__ == "__main__":
    validate_submission()
