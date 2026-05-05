"""Document ingestion pipeline: parse → chunk → embed → store."""

import os
import uuid
import json
from pathlib import Path
from typing import List, Dict, Any

from . import vector_store

# Document registry file
DOCS_REGISTRY = os.path.join(
    Path(__file__).parent.parent.parent, "config", "documents.json"
)


def _load_registry() -> List[Dict[str, Any]]:
    """Load the document registry."""
    try:
        with open(DOCS_REGISTRY, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def _save_registry(docs: List[Dict[str, Any]]) -> None:
    """Save the document registry."""
    os.makedirs(os.path.dirname(DOCS_REGISTRY), exist_ok=True)
    with open(DOCS_REGISTRY, "w", encoding="utf-8") as f:
        json.dump(docs, f, indent=2)


def _chunk_text(text: str, chunk_size: int = 500, chunk_overlap: int = 50) -> List[str]:
    """
    Simple recursive text chunker that splits on paragraph, sentence,
    and word boundaries. No heavy dependencies needed.
    """
    separators = ["\n\n", "\n", ". ", " ", ""]
    chunks = []

    def _split(text: str, sep_idx: int = 0):
        if len(text) <= chunk_size:
            if text.strip():
                chunks.append(text.strip())
            return

        sep = separators[sep_idx] if sep_idx < len(separators) else ""
        if not sep:
            # Hard split at chunk_size
            for i in range(0, len(text), chunk_size - chunk_overlap):
                chunk = text[i : i + chunk_size].strip()
                if chunk:
                    chunks.append(chunk)
            return

        parts = text.split(sep)
        current = ""

        for part in parts:
            candidate = (current + sep + part) if current else part
            if len(candidate) <= chunk_size:
                current = candidate
            else:
                if current.strip():
                    chunks.append(current.strip())
                if len(part) > chunk_size:
                    _split(part, sep_idx + 1)
                    current = ""
                else:
                    current = part

        if current.strip():
            chunks.append(current.strip())

    _split(text)
    return chunks


def parse_document(file_path: str) -> str:
    """Extract text from a document file."""
    ext = Path(file_path).suffix.lower()

    if ext == ".pdf":
        from PyPDF2 import PdfReader

        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text

    elif ext == ".docx":
        from docx import Document

        doc = Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs if para.text])

    elif ext in (".txt", ".md", ".csv"):
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()

    else:
        raise ValueError(f"Unsupported file type: {ext}")


def ingest_document(file_path: str, original_filename: str) -> Dict[str, Any]:
    """
    Full ingestion pipeline for a single document.
    Returns metadata about the ingested document.
    """
    # 1. Parse text from file
    text = parse_document(file_path)

    if not text.strip():
        raise ValueError("Document contains no extractable text.")

    # 2. Chunk the text
    chunks = _chunk_text(text)

    if not chunks:
        raise ValueError("Document produced no chunks after splitting.")

    # 3. Generate unique IDs for chunks
    doc_id = str(uuid.uuid4())[:8]
    chunk_ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]

    # 4. Prepare metadata for each chunk
    metadatas = [
        {
            "doc_id": doc_id,
            "source": original_filename,
            "chunk_index": i,
            "total_chunks": len(chunks),
        }
        for i in range(len(chunks))
    ]

    # 5. Add to vector store (embeddings generated automatically by ChromaDB)
    collection = vector_store.get_collection()
    collection.add(
        ids=chunk_ids,
        documents=chunks,
        metadatas=metadatas,
    )

    # 6. Update registry
    doc_info = {
        "id": doc_id,
        "filename": original_filename,
        "file_path": file_path,
        "chunks": len(chunks),
        "characters": len(text),
    }
    registry = _load_registry()
    registry.append(doc_info)
    _save_registry(registry)

    return doc_info


def list_documents() -> List[Dict[str, Any]]:
    """List all ingested documents."""
    return _load_registry()


def delete_document(doc_id: str) -> bool:
    """Delete a document and its chunks from the vector store."""
    registry = _load_registry()
    doc = next((d for d in registry if d["id"] == doc_id), None)

    if not doc:
        return False

    # Remove chunks from vector store
    collection = vector_store.get_collection()
    try:
        results = collection.get(where={"doc_id": doc_id})
        if results["ids"]:
            collection.delete(ids=results["ids"])
    except Exception:
        pass

    # Remove file
    try:
        if os.path.exists(doc["file_path"]):
            os.remove(doc["file_path"])
    except Exception:
        pass

    # Update registry
    registry = [d for d in registry if d["id"] != doc_id]
    _save_registry(registry)

    return True
