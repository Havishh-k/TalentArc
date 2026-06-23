import uuid
import time
import io
import pandas as pd
import json
import os
import hashlib
import re
from fastapi import HTTPException

from app.services.embedding_service import build_embed_text, embed_batch
from app.db.chroma_client import upsert_candidates, get_collection

MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024   # 5 MB hard limit
MAX_ROWS = 500
MOCK_DATA_PATH = os.getenv("MOCK_DATA_PATH", "./app/data/mock_candidates.json")

REQUIRED_COLUMNS = {
    "full_name", "current_title", "current_company",
    "years_experience", "skills", "project_1_title", "project_1_description",
    "avg_tenure_months", "num_companies_last_3yr",
    "promotion_speed_months", "title_progression_score"
}

OPTIONAL_COLUMNS_DEFAULTS = {
    "github_handle": "",
    "location": "India",
    "institution": "N/A",
    "graduation_year": None,
    "num_companies_total": 2,
    "project_2_title": None,
    "project_2_description": None,
    "project_1_technologies": "",
    "project_2_technologies": "",
}


def parse_upload_file(file_bytes: bytes, filename: str) -> pd.DataFrame:
    """Parse raw bytes into a DataFrame. Raises HTTPException on failure."""
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail={
                "detail": f"File exceeds 5 MB limit ({len(file_bytes) / 1024 / 1024:.1f} MB received).",
                "error_code": "FILE_TOO_LARGE"
            }
        )

    ext = filename.rsplit(".", 1)[-1].lower()
    if ext not in ("xlsx", "csv"):
        raise HTTPException(
            status_code=422,
            detail={"detail": f"Unsupported file type: .{ext}. Upload .xlsx or .csv only.", "error_code": "INVALID_FILE_TYPE"}
        )

    try:
        buf = io.BytesIO(file_bytes)
        if ext == "xlsx":
            df = pd.read_excel(buf, engine="openpyxl", dtype=str)
        else:
            df = pd.read_csv(buf, dtype=str)
    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail={"detail": f"File could not be parsed: {str(e)}", "error_code": "PARSE_ERROR"}
        )

    if df.empty:
        raise HTTPException(
            status_code=422,
            detail={"detail": "Uploaded file contains no data rows.", "error_code": "EMPTY_FILE"}
        )

    # Normalize column names: lowercase + strip whitespace
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    
    # Fill NaN with empty string to prevent text encoding errors
    df.fillna('', inplace=True)
    return df


def sanitize_profile_prose(text: str) -> str:
    """Redacts PII such as phone numbers, emails, and physical addresses."""
    if not text:
        return ""
    # Naive phone number format
    text = re.sub(r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', '[REDACTED_CONTACT]', text)
    # Email addresses
    text = re.sub(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', '[REDACTED_CONTACT]', text)
    # Basic physical address structures (starts with numbers, contains street/ave/blvd)
    text = re.sub(r'\b\d+\s+[a-zA-Z\s]+(?:street|st|avenue|ave|boulevard|blvd|road|rd|lane|ln)\b', '[REDACTED_CONTACT]', text, flags=re.IGNORECASE)
    return text


def _fetch_github_metrics(candidate_id: str, handle: str) -> float:
    """
    Simulated GitHub open-source signal scraper.
    Uses a deterministic mock generator based on candidate_id/handle to prevent scores from jumping.
    """
    if not handle or handle.lower() == "n/a":
        return 0.0
    seed_str = f"{candidate_id}_{handle.lower()}"
    hash_val = int(hashlib.md5(seed_str.encode()).hexdigest(), 16)
    # Map hash_val to a float between 0 and 100 deterministically
    return float(hash_val % 100)


def validate_columns(df: pd.DataFrame) -> None:
    """Raises HTTPException 422 if any required column is absent."""
    present = set(df.columns)
    missing = REQUIRED_COLUMNS - present
    if missing:
        raise HTTPException(
            status_code=422,
            detail={
                "detail": f"Missing required columns: {', '.join(sorted(missing))}",
                "error_code": "MISSING_REQUIRED_COLUMNS",
                "missing_columns": sorted(list(missing))
            }
        )


def map_row_to_candidate(row: pd.Series, row_index: int) -> tuple[dict | None, dict | None]:
    """
    Maps a DataFrame row to a CandidateProfile dict.
    Returns (candidate_dict, None) on success.
    Returns (None, skip_reason_dict) if the row cannot be mapped.
    """
    def get(col, default=None):
        val = row.get(col, default)
        return default if pd.isna(val) or val == '' else str(val).strip()

    full_name = get("full_name", "Unknown")
    candidate_id = get("candidate_id")
    
    if not candidate_id:
        # Generate hash if missing
        hash_str = f"{full_name}_{time.time()}_{row_index}"
        candidate_id = "c_" + hashlib.md5(hash_str.encode()).hexdigest()[:8]

    current_title = get("current_title")
    if not current_title:
        return None, {"row": row_index, "candidate_id": candidate_id, "reason": "Missing required field: current_title"}

    try:
        years_exp = float(get("years_experience", "0"))
        if years_exp < 0:
            raise ValueError()
    except (ValueError, TypeError):
        return None, {"row": row_index, "candidate_id": candidate_id, "reason": "years_experience must be a positive number"}

    raw_skills = get("skills", "")
    skills = [s.strip() for s in raw_skills.split(",") if s.strip()]
    if not skills:
        return None, {"row": row_index, "candidate_id": candidate_id, "reason": "skills field is empty or unparseable"}
        
    skills = [sanitize_profile_prose(s) for s in skills]

    projects = []
    for i in (1, 2):
        title = get(f"project_{i}_title")
        desc = get(f"project_{i}_description", "")
        if title:
            desc = sanitize_profile_prose(desc)
            techs_raw = get(f"project_{i}_technologies", "")
            techs = [sanitize_profile_prose(t.strip()) for t in techs_raw.split(",") if t.strip()]
            projects.append({"title": title, "description": desc, "technologies": techs})
            
    if not projects:
        return None, {"row": row_index, "candidate_id": candidate_id, "reason": "At least one project (project_1_title) is required"}

    try:
        avg_tenure = int(float(get("avg_tenure_months", "18")))
        num_cos_3yr = int(float(get("num_companies_last_3yr", "2")))
        promo_speed = int(float(get("promotion_speed_months", "24")))
        title_prog = float(get("title_progression_score", "5.0"))
        num_cos_total = int(float(get("num_companies_total",
                                      str(OPTIONAL_COLUMNS_DEFAULTS["num_companies_total"]))))
    except (ValueError, TypeError) as e:
        return None, {"row": row_index, "candidate_id": candidate_id, "reason": f"Numeric field parse error: {str(e)}"}

    github_handle = get("github_handle", OPTIONAL_COLUMNS_DEFAULTS["github_handle"])
    github_velocity = _fetch_github_metrics(candidate_id, github_handle)

    candidate = {
        "candidate_id": candidate_id,
        "personal": {
            "full_name": full_name,
            "display_photo_url": f"/avatars/{candidate_id}.png",
            "current_title": current_title,
            "current_company": get("current_company", "Unknown"),
            "location": get("location", OPTIONAL_COLUMNS_DEFAULTS["location"]),
            "years_experience": years_exp,
            "github_handle": github_handle,
        },
        "education": [{
            "institution": get("institution", OPTIONAL_COLUMNS_DEFAULTS["institution"]),
            "degree": "N/A",
            "graduation_year": get("graduation_year"),
        }],
        "skills": skills,
        "projects": projects,
        "behavioral_metadata": {
            "avg_tenure_months": avg_tenure,
            "num_companies_total": num_cos_total,
            "num_companies_last_3yr": num_cos_3yr,
            "promotion_speed_months": promo_speed,
            "title_progression_score": title_prog,
            "github_velocity_index": github_velocity,
        }
    }
    return candidate, None


def _append_to_mock_json(valid_candidates: list[dict]):
    """Appends newly imported candidate structures to mock_candidates.json"""
    try:
        with open(MOCK_DATA_PATH, "r", encoding="utf-8") as f:
            candidates = json.load(f)
    except FileNotFoundError:
        candidates = []
        
    # Append or overwrite by candidate_id
    existing_ids = {c["candidate_id"]: i for i, c in enumerate(candidates)}
    for vc in valid_candidates:
        if vc["candidate_id"] in existing_ids:
            candidates[existing_ids[vc["candidate_id"]]] = vc
        else:
            candidates.append(vc)
            
    with open(MOCK_DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(candidates, f, indent=2)


def run_import_pipeline(file_bytes: bytes, filename: str) -> dict:
    """
    Full synchronous import pipeline.
    Parses -> validates -> maps -> embeds -> upserts.
    Returns an ImportResponse-compatible dict.
    """
    start_time = time.monotonic()
    import_id = str(uuid.uuid4())

    # --- Parse & validate structure ---
    df = parse_upload_file(file_bytes, filename)
    validate_columns(df)

    # --- Enforce row limit ---
    if len(df) > MAX_ROWS:
        raise HTTPException(
            status_code=422,
            detail={
                "detail": f"File contains {len(df)} rows; maximum is {MAX_ROWS}.",
                "error_code": "FILE_TOO_LARGE"
            }
        )

    rows_received = len(df)

    # --- Row-level mapping (tolerant: bad rows are skipped) ---
    valid_candidates = []
    skip_reasons = []

    for idx, row in df.iterrows():
        candidate, skip = map_row_to_candidate(row, row_index=idx + 2)  # +2: 1-indexed + header row
        if candidate:
            valid_candidates.append(candidate)
        else:
            skip_reasons.append(skip)

    rows_imported = len(valid_candidates)

    if rows_imported == 0:
        raise HTTPException(
            status_code=422,
            detail={
                "detail": "No valid rows could be imported. Check skip_reasons for details.",
                "error_code": "PARSE_ERROR",
                "skip_reasons": skip_reasons
            }
        )

    # --- Snapshot pool size before upsert ---
    collection = get_collection()
    pool_size_before = collection.count()

    # --- Build embed texts and batch-encode ---
    embed_texts = [build_embed_text(c) for c in valid_candidates]
    embeddings = embed_batch(embed_texts)   # single model.encode() call for all rows

    # --- Prepare ChromaDB payload ---
    candidate_ids = [c["candidate_id"] for c in valid_candidates]

    # Metadatas: flat dict only (ChromaDB requirement)
    metadatas = [{
        "full_name":              c["personal"]["full_name"],
        "current_title":          c["personal"]["current_title"],
        "current_company":        c["personal"]["current_company"],
        "location":               c["personal"]["location"],
        "years_experience":       c["personal"]["years_experience"],
        "institution":            c["education"][0]["institution"],
        "skills":                 ", ".join(c["skills"]),
        "avg_tenure_months":      c["behavioral_metadata"]["avg_tenure_months"],
        "num_companies_last_3yr": c["behavioral_metadata"]["num_companies_last_3yr"],
        "promotion_speed_months": c["behavioral_metadata"]["promotion_speed_months"],
        "title_progression_score":c["behavioral_metadata"]["title_progression_score"],
    } for c in valid_candidates]

    documents = embed_texts

    # --- Update Persistent Storage (mock_candidates.json) ---
    _append_to_mock_json(valid_candidates)

    # --- Upsert into ChromaDB ---
    upserted_ids = upsert_candidates(candidate_ids, embeddings, metadatas, documents)

    pool_size_after = collection.count()
    elapsed_ms = int((time.monotonic() - start_time) * 1000)

    return {
        "import_id": import_id,
        "status": "success",
        "rows_received": rows_received,
        "rows_imported": rows_imported,
        "rows_skipped": len(skip_reasons),
        "skip_reasons": skip_reasons,
        "pool_size_before": pool_size_before,
        "pool_size_after": pool_size_after,
        "upserted_ids": upserted_ids,
        "processing_time_ms": elapsed_ms,
    }
