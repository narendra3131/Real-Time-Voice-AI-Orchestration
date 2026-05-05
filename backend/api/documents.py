"""Document upload and management API routes."""

import os
import uuid
from typing import List

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from config import UPLOAD_DIR
from knowledge_base.ingestion import ingest_document, list_documents, delete_document

router = APIRouter(prefix="/api/documents", tags=["documents"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md", ".csv"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB


class DocumentResponse(BaseModel):
    id: str
    filename: str
    chunks: int
    characters: int


class DocumentListResponse(BaseModel):
    documents: List[dict]
    total: int


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(file: UploadFile = File(...)):
    """Upload a document for knowledge base ingestion."""
    # Validate file extension
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ext}. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Read file content
    content = await file.read()

    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB.",
        )

    # Save file to disk
    file_id = str(uuid.uuid4())[:8]
    safe_filename = f"{file_id}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    with open(file_path, "wb") as f:
        f.write(content)

    # Ingest document
    try:
        doc_info = ingest_document(file_path, file.filename)
        return DocumentResponse(
            id=doc_info["id"],
            filename=doc_info["filename"],
            chunks=doc_info["chunks"],
            characters=doc_info["characters"],
        )
    except ValueError as e:
        # Clean up file on error
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")


@router.get("", response_model=DocumentListResponse)
async def get_documents():
    """List all uploaded documents."""
    docs = list_documents()
    return DocumentListResponse(documents=docs, total=len(docs))


@router.delete("/{doc_id}")
async def remove_document(doc_id: str):
    """Delete a document from the knowledge base."""
    success = delete_document(doc_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found.")
    return {"message": "Document deleted successfully.", "id": doc_id}
