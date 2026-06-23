from pydantic import BaseModel, Field
from typing import Optional


class SearchWeights(BaseModel):
    semantic: float = Field(0.50, ge=0.0, le=1.0)
    career: float = Field(0.30, ge=0.0, le=1.0)
    velocity: float = Field(0.20, ge=0.0, le=1.0)


class SearchRequest(BaseModel):
    job_description: str = Field(..., min_length=50, max_length=2000)
    weights: SearchWeights = SearchWeights()
    top_n: int = Field(10, description="Number of results to return")
    blind_mode: bool = False


class SeedRequest(BaseModel):
    """Empty body — seeds from internal mock_candidates.json."""
    pass
