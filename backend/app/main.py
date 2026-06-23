from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.router import router
from app.db.chroma_client import get_collection


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Auto-seed ChromaDB on startup if the collection is empty."""
    try:
        collection = get_collection()
        if collection.count() == 0:
            print("[startup] ChromaDB collection empty — auto-seeding...")
            from app.router import seed_candidates
            seed_candidates()
            print("[startup] Auto-seeded mock candidates.")
        else:
            print(f"[startup] ChromaDB ready — {collection.count()} candidates indexed.")
    except Exception as e:
        print(f"[startup] ChromaDB check failed: {e}")
    yield


app = FastAPI(
    title="CandidateIQ — AI Sourcing Engine",
    description="Intelligent Candidate Discovery Engine for India Runs Hackathon",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routes
app.include_router(router)
