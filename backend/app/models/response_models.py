from pydantic import BaseModel
from typing import Optional


class ScoreBreakdown(BaseModel):
    semantic_score: float
    career_score: float
    velocity_score: float
    github_velocity_score: float = 0.0


class RetentionRisk(BaseModel):
    tier: str
    score: float
    signals_triggered: list[str]


class RadarDataPoint(BaseModel):
    skill: str
    candidate_score: int
    jd_required: int


class CandidateResult(BaseModel):
    rank: int
    candidate_id: str
    display_name: str
    display_title: str
    display_institution: str
    composite_score: float
    score_breakdown: ScoreBreakdown
    justification: str
    retention_risk: RetentionRisk
    radar_data: list[RadarDataPoint]
    blind_mode_applied: bool


class SearchResponse(BaseModel):
    search_id: str
    jd_skills_extracted: list[str]
    total_candidates_scanned: int
    pool_density_percentage: float = 100.0
    results: list[CandidateResult]
    latency_ms: int


class SeedResponse(BaseModel):
    seeded_count: int
    collection_name: str
    status: str


class HealthResponse(BaseModel):
    status: str
    chromadb: str
    candidates_indexed: int
    timestamp: str


class CandidatesResponse(BaseModel):
    total: int
    candidates: list[dict]


class SkipReason(BaseModel):
    row: int
    candidate_id: Optional[str]
    reason: str


class ImportResponse(BaseModel):
    import_id: str
    status: str
    rows_received: int
    rows_imported: int
    rows_skipped: int
    skip_reasons: list[SkipReason]
    pool_size_before: int
    pool_size_after: int
    upserted_ids: list[str]
    processing_time_ms: int
