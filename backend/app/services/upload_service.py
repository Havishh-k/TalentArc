import io
import json
import uuid
import pandas as pd
from typing import List, Dict, Any

from app.services.embedding_service import embed_text
from app.db.chroma_client import get_collection

REQUIRED_COLUMNS = [
    "Full Name",
    "Current Title",
    "Current Company",
    "Years Experience",
    "Location",
    "Skills",
    "Key Project Summary",
    "Total Companies Worked For",
    "Months in Current Role"
]

MOCK_DATA_PATH = "app/data/mock_candidates.json"

def import_candidates(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Parses an uploaded file (Excel, CSV, or JSON), transforms it to candidate schema,
    generates embeddings, and injects into ChromaDB.
    """
    try:
        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(file_bytes))
        elif filename.endswith('.json'):
            df = pd.read_json(io.BytesIO(file_bytes))
        else:
            df = pd.read_excel(io.BytesIO(file_bytes))
    except Exception as e:
        raise ValueError(f"Could not parse file {filename}: {str(e)}")

    # Check for required columns
    missing_cols = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing_cols:
        raise KeyError(f"Missing required columns: {', '.join(missing_cols)}")

    # Drop rows where 'Full Name' is missing
    df = df.dropna(subset=["Full Name"])
    
    # Fill NaNs for safety
    df = df.fillna({
        "Skills": "",
        "Key Project Summary": "",
        "Current Title": "Unknown Role",
        "Current Company": "Unknown Company",
        "Location": "Unknown Location",
        "Years Experience": 1.0,
        "Total Companies Worked For": 1,
        "Months in Current Role": 12
    })

    # Load existing to find ID collisions
    try:
        with open(MOCK_DATA_PATH, "r", encoding="utf-8") as f:
            existing_candidates = json.load(f)
    except FileNotFoundError:
        existing_candidates = []

    # Calculate max existing cXXX id
    max_id_num = 0
    for c in existing_candidates:
        cid = c.get("candidate_id", "")
        if cid.startswith("c") and cid[1:].isdigit():
            max_id_num = max(max_id_num, int(cid[1:]))

    new_candidates = []
    ids = []
    embeddings = []
    documents = []
    metadatas = []

    for index, row in df.iterrows():
        max_id_num += 1
        new_c_id = f"c{max_id_num:03d}"
        
        full_name = str(row["Full Name"])
        title = str(row["Current Title"])
        company = str(row["Current Company"])
        years_exp = float(row["Years Experience"])
        location = str(row["Location"])
        skills_str = str(row["Skills"])
        project_summary = str(row["Key Project Summary"])
        
        total_companies = max(1, int(row["Total Companies Worked For"]))
        months_current_role = max(1, int(row["Months in Current Role"]))

        # Parse skills
        skills_list = [s.strip() for s in skills_str.split(",") if s.strip()]
        
        # Heuristics
        avg_tenure = (years_exp * 12.0) / total_companies
        promotion_speed = max(6, int(months_current_role * 0.8))  # basic heuristic
        title_progression = min(9.5, max(4.0, years_exp / 1.5))
        
        # Build embedding document - dense semantic text
        embed_doc = f"Title: {title}. Company: {company}. Skills: {', '.join(skills_list)}. Project: {project_summary}"
        
        candidate_dict = {
            "candidate_id": new_c_id,
            "personal": {
                "full_name": full_name,
                "display_photo_url": f"/avatars/{new_c_id}.png",
                "current_title": title,
                "current_company": company,
                "location": location,
                "years_experience": years_exp
            },
            "education": [], # Excel import doesn't mandate education right now to keep flat structure simple
            "career_history": [
                {
                    "company": company,
                    "title": title,
                    "start_month": "2020-01", # Placeholder
                    "end_month": None,
                    "tenure_months": months_current_role
                }
            ],
            "skills": skills_list,
            "projects": [
                {
                    "title": "Key Project",
                    "description": project_summary,
                    "technologies": skills_list[:3]
                }
            ],
            "behavioral_metadata": {
                "avg_tenure_months": round(avg_tenure, 1),
                "num_companies_total": total_companies,
                "num_companies_last_3yr": min(total_companies, 3),
                "promotion_speed_months": promotion_speed,
                "title_progression_score": round(title_progression, 1)
            },
            "computed_at_seed": {
                "embedding_model": "all-MiniLM-L6-v2",
                "embedded_text_preview": embed_doc[:100] + "..."
            }
        }
        
        new_candidates.append(candidate_dict)
        
        # Prepare for ChromaDB
        embed_vec = embed_text(embed_doc)
        ids.append(new_c_id)
        embeddings.append(embed_vec)
        documents.append(embed_doc)
        metadatas.append({"candidate_id": new_c_id, "source": "excel_import"})

    # Insert to Chroma
    if new_candidates:
        collection = get_collection()
        collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas
        )

        # Persist to JSON
        existing_candidates.extend(new_candidates)
        with open(MOCK_DATA_PATH, "w", encoding="utf-8") as f:
            json.dump(existing_candidates, f, indent=2)

    return {
        "status": "success",
        "imported_count": len(new_candidates)
    }
