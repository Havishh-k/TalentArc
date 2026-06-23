import json
import os
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, UploadFile, File

from app.db.chroma_client import get_collection, reset_collection
from app.models.request_models import SearchRequest
from app.models.response_models import (
    CandidatesResponse,
    HealthResponse,
    SearchResponse,
    SeedResponse,
)
from app.services.embedding_service import build_embed_text, embed_texts

router = APIRouter(prefix="/api")

MOCK_DATA_PATH = os.getenv("MOCK_DATA_PATH", "./app/data/mock_candidates.json")


def _load_mock_candidates() -> list[dict]:
    with open(MOCK_DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


# ── GET /api/health ──────────────────────────────────────────────────────────

@router.get("/health", response_model=HealthResponse)
def health_check():
    try:
        collection = get_collection()
        count = collection.count()
        return HealthResponse(
            status="healthy",
            chromadb="connected",
            candidates_indexed=count,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"vector store unavailable: {e}")


# ── POST /api/seed ───────────────────────────────────────────────────────────

@router.post("/seed", response_model=SeedResponse)
def seed_candidates():
    """Reads mock JSON, embeds project/skill text, and loads into ChromaDB.
    Idempotent — clears and re-seeds the collection on every call.
    """
    candidates = _load_mock_candidates()

    # Build the text to embed for each candidate
    texts = [build_embed_text(c) for c in candidates]

    # Batch-embed all candidate texts
    embeddings = embed_texts(texts)

    # Reset and populate ChromaDB collection
    collection = reset_collection()

    ids = [c["candidate_id"] for c in candidates]
    metadatas = [
        {
            "full_name": c["personal"]["full_name"],
            "current_title": c["personal"]["current_title"],
            "current_company": c["personal"]["current_company"],
            "years_experience": c["personal"]["years_experience"],
            "location": c["personal"]["location"],
        }
        for c in candidates
    ]
    documents = texts

    collection.add(
        ids=ids,
        embeddings=embeddings,
        metadatas=metadatas,
        documents=documents,
    )

    return SeedResponse(
        seeded_count=len(candidates),
        collection_name="candidates",
        status="success",
    )


# ── POST /api/search (placeholder) ──────────────────────────────────────────

@router.post("/search", response_model=SearchResponse)
async def search_candidates(request: SearchRequest):
    """Run the full search pipeline."""
    # Validate weights sum to 1.0
    weight_sum = request.weights.semantic + request.weights.career + request.weights.velocity
    if abs(weight_sum - 1.0) > 0.01:
        raise HTTPException(status_code=422, detail="weights must sum to 1.0")

    # Validate top_n
    if request.top_n not in (5, 10, 20):
        raise HTTPException(status_code=422, detail="top_n must be 5, 10, or 20")

    # Check collection has data
    collection = get_collection()
    count = collection.count()
    if count == 0:
        raise HTTPException(status_code=503, detail="vector store unavailable — run POST /api/seed first")

    # Run the orchestrator
    all_candidates = _load_mock_candidates()
    
    # Pass weights as a dict to orchestrator
    weights_dict = {
        "semantic": request.weights.semantic,
        "career": request.weights.career,
        "velocity": request.weights.velocity
    }
    
    try:
        from app.services.search_service import orchestrate_search
        return await orchestrate_search(
            job_description=request.job_description,
            weights=weights_dict,
            top_n=request.top_n,
            blind_mode=request.blind_mode,
            all_candidates=all_candidates
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search pipeline failed: {str(e)}")


# ── POST /api/import ──────────────────────────────────────────────────────────

from app.models.response_models import ImportResponse
from app.services.import_service import run_import_pipeline

@router.post("/import", response_model=ImportResponse)
async def import_candidates(file: UploadFile = File(...)):
    """
    Accepts a .xlsx or .csv file upload.
    Parses, validates, embeds, and upserts candidates into ChromaDB.
    Synchronous pipeline — no background workers.
    """
    ALLOWED_CONTENT_TYPES = {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/csv",
        "application/csv",
        "application/octet-stream",  # some OS/browsers send this for .xlsx
    }
    if file.content_type not in ALLOWED_CONTENT_TYPES and \
       not file.filename.endswith((".xlsx", ".csv")):
        raise HTTPException(
            status_code=422,
            detail={"detail": "Upload a .xlsx or .csv file.", "error_code": "INVALID_FILE_TYPE"}
        )

    file_bytes = await file.read()
    result = run_import_pipeline(file_bytes, file.filename)
    
    # Reload mock candidates in memory after successful upload
    global all_candidates
    all_candidates = _load_mock_candidates()
    
    return result

# ── GET /api/candidates ─────────────────────────────────────────────────────

@router.get("/candidates", response_model=CandidatesResponse)
def list_candidates(limit: int = 50, offset: int = 0):
    candidates = _load_mock_candidates()
    total = len(candidates)
    page = candidates[offset : offset + min(limit, 200)]
    return CandidatesResponse(total=total, candidates=page)
