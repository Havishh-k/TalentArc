from sentence_transformers import SentenceTransformer
import os
from dotenv import load_dotenv

load_dotenv()

EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")

_model = None


def get_model() -> SentenceTransformer:
    """Lazy-load the SentenceTransformer model (one-time ~80MB download)."""
    global _model
    if _model is None:
        _model = SentenceTransformer(EMBEDDING_MODEL)
    return _model


def build_embed_text(candidate: dict) -> str:
    """Constructs the string passed to the embedding model for a candidate."""
    skills = " ".join(candidate.get("skills", []))
    projects = " ".join([
        f"{p.get('title', '')} {p.get('description', '')} {' '.join(p.get('technologies', []))}"
        for p in candidate.get("projects", [])
    ])
    title = candidate.get("personal", {}).get("current_title", "")
    return f"{title} {skills} {projects}".strip()


def embed_text(text: str) -> list[float]:
    """Encode a single text string into a 384-dimensional vector."""
    model = get_model()
    return model.encode(text).tolist()


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Batch-encode multiple text strings (legacy)."""
    model = get_model()
    embeddings = model.encode(texts)
    return [e.tolist() for e in embeddings]


def embed_batch(texts: list[str]) -> list[list[float]]:
    """
    Encodes a list of strings in a single SentenceTransformer call.
    Far more efficient than calling model.encode() in a loop.
    Returns a list of 384-dim float vectors.
    """
    if not texts:
        return []
    model = get_model()
    embeddings = model.encode(texts, batch_size=32, show_progress_bar=False)
    return embeddings.tolist()
