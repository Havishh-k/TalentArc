from chromadb.utils.embedding_functions import DefaultEmbeddingFunction

_model = None

def get_model() -> DefaultEmbeddingFunction:
    """Lazy-load the ONNX-based SentenceTransformer model."""
    global _model
    if _model is None:
        _model = DefaultEmbeddingFunction()
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
    return model([text])[0]

def embed_texts(texts: list[str]) -> list[list[float]]:
    """Batch-encode multiple text strings."""
    if not texts:
        return []
    model = get_model()
    return model(texts)

def embed_batch(texts: list[str]) -> list[list[float]]:
    """Alias for embed_texts."""
    return embed_texts(texts)
