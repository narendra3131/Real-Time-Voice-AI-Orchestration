"""ChromaDB vector store wrapper."""

import chromadb
from chromadb.config import Settings
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from config import CHROMA_PERSIST_DIR, OPENAI_API_KEY

# Singleton client
_client = None
_collection = None

COLLECTION_NAME = "knowledge_base"


def get_client() -> chromadb.ClientAPI:
    """Get or create the ChromaDB persistent client."""
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
    return _client


def get_collection():
    """Get or create the knowledge base collection with OpenAI embeddings."""
    global _collection
    if _collection is None:
        from chromadb.utils.embedding_functions import OpenAIEmbeddingFunction

        embedding_fn = OpenAIEmbeddingFunction(
            api_key=OPENAI_API_KEY,
            model_name="text-embedding-3-small",
        )
        client = get_client()
        _collection = client.get_or_create_collection(
            name=COLLECTION_NAME,
            embedding_function=embedding_fn,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def reset_collection():
    """Delete and recreate the collection (used when clearing KB)."""
    global _collection
    client = get_client()
    try:
        client.delete_collection(COLLECTION_NAME)
    except Exception:
        pass
    _collection = None
    return get_collection()
