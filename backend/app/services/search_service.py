"""Search service — orchestrates the full search pipeline.

Flow: embed JD → vector search → score → retention risk → radar → assemble response.
LLM justification is a placeholder until Day 5.
"""

import json
import time
import uuid

from app.db.chroma_client import get_collection
from app.services.embedding_service import embed_text
from app.services.scoring_service import (
    compute_career_score,
    compute_composite,
    compute_velocity_score,
)
from app.services.retention_service import compute_retention_risk
from app.services.radar_service import build_radar_data


def distance_to_score(distance: float) -> float:
    """Convert ChromaDB cosine distance (0=identical, 2=opposite) to 0-100 similarity score."""
    similarity = 1 - (distance / 2)  # normalize to 0-1
    return round(similarity * 100, 1)


def _load_candidate_by_id(candidate_id: str, all_candidates: list[dict]) -> dict | None:
    """Look up a candidate by ID from the full candidate list."""
    for c in all_candidates:
        if c["candidate_id"] == candidate_id:
            return c
    return None


import asyncio
from app.services.llm_service import extract_jd_skills, generate_justification

async def orchestrate_search(
    job_description: str,
    weights: dict,
    top_n: int,
    blind_mode: bool,
    all_candidates: list[dict],
) -> dict:
    """Run the full search pipeline and return a SearchResponse-shaped dict.

    Steps:
    [3a] Embed JD text
    [3b] Vector search in ChromaDB
    [3c] Score each candidate (career, velocity, composite, retention, radar)
    [3d] LLM Justification extraction (Day 5)
    [3e] LLM JD skill extraction (Day 5)
    [3f] Sort by composite_score DESC, apply blind mode masking
    """
    start_time = time.time()
    search_id = str(uuid.uuid4())

    # [3a] Embed the job description
    jd_embedding = embed_text(job_description)

    # [3b] Query ChromaDB for top-N candidates by cosine similarity
    collection = get_collection()
    chroma_results = collection.query(
        query_embeddings=[jd_embedding],
        n_results=top_n,
        include=["documents", "metadatas", "distances"],
    )

    candidate_ids = chroma_results["ids"][0]
    distances = chroma_results["distances"][0]

    # [3e] JD skills extraction via LLM (Day 5)
    jd_skills_extracted = await extract_jd_skills(job_description)

    # [3c] Score each returned candidate
    results_pre_justification = []
    justification_tasks = []
    
    for i, cid in enumerate(candidate_ids):
        candidate = _load_candidate_by_id(cid, all_candidates)
        if candidate is None:
            continue

        # Semantic score from vector distance
        semantic_score = distance_to_score(distances[i])

        # RELEVANCE VALIDATION:
        # If the semantic similarity is too low (e.g., orthogonal/unrelated),
        # skip this candidate completely. This prevents high Career/Velocity
        # scores from masking a completely irrelevant Job Description.
        if semantic_score < 60.0:
            continue

        # Career and velocity scores
        career_score = compute_career_score(candidate)
        velocity_score = compute_velocity_score(candidate)

        # Composite score
        composite = compute_composite(
            semantic_score,
            career_score,
            velocity_score,
            weights,
        )

        # Retention risk
        retention = compute_retention_risk(candidate)

        # Radar data
        radar = build_radar_data(candidate, jd_skills_extracted)
        
        scores_dict = {
            "semantic": semantic_score,
            "career": career_score,
            "velocity": velocity_score,
            "composite": composite
        }

        # Queue justification generation for parallel execution
        # Wait, the prompt needs the actual rank. 
        # Rank is determined after sorting by composite score!
        # So we must sort first, THEN assign rank, THEN generate justifications.
        
        result = {
            "candidate_id": cid,
            "display_name": candidate["personal"]["full_name"],
            "display_title": candidate["personal"]["current_title"],
            "display_institution": (
                candidate["education"][0]["institution"]
                if candidate.get("education")
                else "N/A"
            ),
            "composite_score": composite,
            "score_breakdown": {
                "semantic_score": semantic_score,
                "career_score": career_score,
                "velocity_score": velocity_score,
            },
            "justification": "", # Placeholder, will be filled
            "retention_risk": retention,
            "radar_data": radar,
            "blind_mode_applied": blind_mode,
            "_raw_candidate": candidate, # Temporary reference for justification
            "_scores_dict": scores_dict  # Temporary reference for justification
        }
        results_pre_justification.append(result)

    # [3f] Sort by composite_score DESC and assign ranks
    results_pre_justification.sort(key=lambda r: r["composite_score"], reverse=True)
    for idx, r in enumerate(results_pre_justification):
        r["rank"] = idx + 1

    # [3d] Parallel LLM justification generation
    for r in results_pre_justification:
        task = generate_justification(
            candidate=r["_raw_candidate"],
            jd_summary=job_description[:300],
            scores=r["_scores_dict"],
            rank=r["rank"],
            blind_mode=blind_mode
        )
        justification_tasks.append(task)
        
    justifications = await asyncio.gather(*justification_tasks)
    
    for idx, r in enumerate(results_pre_justification):
        r["justification"] = justifications[idx]
        del r["_raw_candidate"]
        del r["_scores_dict"]

    results = results_pre_justification

    # Apply blind mode masking if requested
    if blind_mode:
        for r in results:
            r["display_name"] = f"Candidate #{r['rank']}"
            r["display_institution"] = f"Institution {chr(64 + r['rank'])}"

    latency_ms = int((time.time() - start_time) * 1000)

    return {
        "search_id": search_id,
        "jd_skills_extracted": jd_skills_extracted,
        "total_candidates_scanned": collection.count(),
        "results": results,
        "latency_ms": latency_ms,
    }


def _extract_jd_skills_heuristic(jd_text: str) -> list[str]:
    """Simple keyword-based JD skill extraction as a Day 2 placeholder.

    Will be replaced by LLM-based extraction (Claude Haiku) on Day 5.
    """
    known_skills = [
        "Python", "Java", "JavaScript", "TypeScript", "Go", "C++", "SQL",
        "PyTorch", "TensorFlow", "MLOps", "MLflow", "Kubernetes", "Docker",
        "Spark", "Kafka", "Airflow", "FastAPI", "React", "Node.js",
        "System Design", "Microservices", "AWS", "GCP", "Azure",
        "NLP", "Computer Vision", "Transformers", "Redis", "PostgreSQL",
        "Communication", "Leadership", "Distributed Systems",
        "Machine Learning", "Deep Learning", "Data Engineering",
        "Spring Boot", "Terraform", "Figma", "Tableau", "Power BI",
        "A/B Testing", "Product Thinking",
    ]
    jd_lower = jd_text.lower()
    extracted = [s for s in known_skills if s.lower() in jd_lower]
    return extracted[:8]  # Cap at 8 per TRD spec
