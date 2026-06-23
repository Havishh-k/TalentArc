import chromadb
from chromadb.config import Settings
import os
from dotenv import load_dotenv

load_dotenv()

CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_data")
COLLECTION_NAME = "candidates"

_client = None
_collection = None


def get_chroma_client() -> chromadb.ClientAPI:
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
    return _client


def get_collection() -> chromadb.Collection:
    global _collection
    if _collection is None:
        client = get_chroma_client()
        _collection = client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def reset_collection() -> chromadb.Collection:
    """Delete and recreate the collection (used by /api/seed)."""
    global _collection
    client = get_chroma_client()
    try:
        client.delete_collection(name=COLLECTION_NAME)
    except Exception:
        pass
    _collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )
    return _collection


def upsert_candidates(
    candidate_ids: list[str],
    embeddings: list[list[float]],
    metadatas: list[dict],
    documents: list[str]
) -> list[str]:
    """
    Upserts candidates into ChromaDB.
    Existing IDs are overwritten; new IDs are inserted.
    Returns the list of upserted IDs.
    """
    collection = get_collection()
    collection.upsert(
        ids=candidate_ids,
        embeddings=embeddings,
        metadatas=metadatas,
        documents=documents
    )
    return candidate_ids
