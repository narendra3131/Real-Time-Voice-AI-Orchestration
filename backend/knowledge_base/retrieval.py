"""Vector search and retrieval for RAG."""

from typing import List, Dict, Any
from . import vector_store


def search_documents(query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Search the knowledge base for relevant document chunks.
    Returns a list of results with text, metadata, and distance scores.
    """
    collection = vector_store.get_collection()

    # Check if collection has any documents
    if collection.count() == 0:
        return []

    # Perform similarity search
    results = collection.query(
        query_texts=[query],
        n_results=min(top_k, collection.count()),
        include=["documents", "metadatas", "distances"],
    )

    if not results["documents"] or not results["documents"][0]:
        return []

    # Format results
    formatted = []
    for i, (doc, meta, dist) in enumerate(
        zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
        )
    ):
        # ChromaDB returns cosine distance (0 = identical, 2 = opposite)
        # Convert to similarity score (1 = identical, 0 = orthogonal)
        similarity = 1 - (dist / 2)

        # Filter out low-relevance results (higher threshold = faster responses)
        if similarity < 0.45:
            continue

        formatted.append(
            {
                "text": doc,
                "metadata": meta,
                "score": round(similarity, 3),
                "rank": i + 1,
            }
        )

    return formatted
