import hashlib
import os
import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

router = APIRouter()

# Create upload directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# TODO: Replace with proper database models and file storage
# In-memory storage with caching
documents_storage: dict[str, dict[str, Any]] = {}
folders_storage = [
    {"id": "contracts", "name": "Contracts", "count": 0, "icon": "FileText", "color": "blue"},
    {"id": "court", "name": "Court Documents", "count": 0, "icon": "FileText", "color": "purple"},
    {"id": "correspondence", "name": "Correspondence", "count": 0, "icon": "FileText", "color": "green"},
    {"id": "evidence", "name": "Evidence", "count": 0, "icon": "Image", "color": "yellow"},
    {"id": "templates", "name": "Templates", "count": 0, "icon": "FileCode", "color": "pink"},
    {"id": "general", "name": "General", "count": 0, "icon": "File", "color": "gray"},
]

# Cache for folder counts to avoid recalculation
folder_counts_cache: dict[str, int] = {}

# Initialize with demo documents
demo_docs = [
    {
        "id": str(uuid.uuid4()),
        "name": "Contract_Smith_2025.pdf",
        "type": "pdf",
        "size": 245678,
        "folder": "contracts",
        "caseId": "2025-001",
        "uploadedBy": "Admin",
        "uploadedAt": datetime.now(UTC).isoformat(),
        "lastModified": datetime.now(UTC).strftime("%Y-%m-%d"),
        "tags": ["contract", "smith", "2025"],
        "status": "ready",
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Court_Order_Williams.pdf",
        "type": "pdf",
        "size": 189234,
        "folder": "court",
        "caseId": "2025-003",
        "uploadedBy": "Admin",
        "uploadedAt": datetime.now(UTC).isoformat(),
        "lastModified": datetime.now(UTC).strftime("%Y-%m-%d"),
        "tags": ["court", "order", "williams"],
        "status": "ready",
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Email_Correspondence_Green.docx",
        "type": "docx",
        "size": 67890,
        "folder": "correspondence",
        "caseId": "2025-002",
        "uploadedBy": "Admin",
        "uploadedAt": datetime.now(UTC).isoformat(),
        "lastModified": datetime.now(UTC).strftime("%Y-%m-%d"),
        "tags": ["email", "green", "correspondence"],
        "status": "ready",
    },
]

# Initialize storage
for doc in demo_docs:
    doc_id = str(doc["id"])
    documents_storage[doc_id] = doc


def update_folder_counts():
    """Update folder counts based on documents - optimized with caching"""
    global folder_counts_cache
    folder_counts_cache.clear()

    for doc in documents_storage.values():
        folder = doc.get("folder", "general")
        folder_counts_cache[folder] = folder_counts_cache.get(folder, 0) + 1

    for folder in folders_storage:
        folder_id = str(folder["id"])
        folder["count"] = folder_counts_cache.get(folder_id, 0)


# Update initial counts
update_folder_counts()


@router.get("/folders/list", response_model=list[dict[str, Any]])
async def list_folders() -> list[dict[str, Any]]:
    """List all document folders"""
    # TODO: Implement dynamic folder management
    # - Allow users to create custom folders
    # - Track folder permissions
    # - Show folder sizes and last modified dates
    return folders_storage


@router.get("/", response_model=list[dict[str, Any]])
async def list_documents(
    folder: str | None = None,
    case_id: str | None = None,
    search: str | None = None,
) -> list[dict[str, Any]]:
    """List all documents with optional filtering"""

    documents = list(documents_storage.values())

    # Apply filters
    if folder:
        documents = [d for d in documents if d.get("folder") == folder]

    if case_id:
        documents = [d for d in documents if d.get("caseId") == case_id]

    if search:
        search_lower = search.lower()
        documents = [
            d for d in documents
            if search_lower in d.get("name", "").lower()
            or any(search_lower in tag.lower() for tag in d.get("tags", []))
            or search_lower in d.get("caseId", "").lower()
        ]

    # Sort by upload date descending
    documents.sort(key=lambda x: x.get("uploadedAt", ""), reverse=True)

    return documents


@router.post("/upload", response_model=dict[str, Any])
async def upload_document(
    file: UploadFile = File(...),
    folder: str = Form("general"),
    case_id: str | None = Form(None),
    tags: str | None = Form(None),
) -> dict[str, Any]:
    """Upload a new document"""
    # TODO: Implement comprehensive document upload
    # - Virus scanning with ClamAV or similar
    # - File type validation (check magic bytes, not just extension)
    # - Maximum file size limits per file type
    # - OCR processing for scanned documents (Tesseract)
    # - AI-powered auto-categorization
    # - Duplicate detection based on content hash
    # - Extract metadata (author, creation date, etc.)
    # - Generate document preview/thumbnail
    # - Full-text indexing for search
    # - Encrypt files at rest
    # - Create audit log entry

    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Get file extension
    file_ext = file.filename.split(".")[-1].lower() if "." in file.filename else "unknown"

    # Generate unique filename
    file_id = str(uuid.uuid4())
    safe_filename = f"{file_id}_{file.filename}"
    file_path = UPLOAD_DIR / safe_filename

    # Save file
    try:
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)

        # Calculate file hash
        file_hash = hashlib.sha256(contents).hexdigest()

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Create document record
    document = {
        "id": file_id,
        "name": file.filename,
        "type": file_ext,
        "size": len(contents),
        "folder": folder,
        "caseId": case_id or "",
        "uploadedBy": "Current User",  # TODO: Get from auth
        "uploadedAt": datetime.now(UTC).isoformat(),
        "lastModified": datetime.now(UTC).strftime("%Y-%m-%d"),
        "tags": tags.split(",") if tags else [],
        "status": "processing",
        "path": str(file_path),
        "hash": file_hash,
    }

    # Store document
    documents_storage[file_id] = document

    # Update folder counts
    update_folder_counts()

    # Simulate processing
    document["status"] = "ready"

    return document


@router.get("/{document_id}", response_model=dict[str, Any])
async def get_document(document_id: str) -> dict[str, Any]:
    """Get a specific document"""

    document = documents_storage.get(document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    return document


@router.delete("/{document_id}")
async def delete_document(document_id: str) -> dict[str, str]:
    """Delete a document"""

    document = documents_storage.get(document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete file from disk
    file_path = document.get("path")
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception:
            pass

    # Remove from storage
    del documents_storage[document_id]

    # Update folder counts
    update_folder_counts()

    return {"message": "Document deleted successfully"}


@router.post("/{document_id}/download")
async def download_document(document_id: str) -> dict[str, Any]:
    """Get document download URL"""

    document = documents_storage.get(document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # In a real app, this would return a signed URL or stream the file
    return {
        "download_url": f"/api/documents/{document_id}/file",
        "filename": document["name"],
        "size": document["size"],
    }


@router.patch("/{document_id}", response_model=dict[str, Any])
async def update_document(
    document_id: str,
    updates: dict[str, Any]
) -> dict[str, Any]:
    """Update document metadata"""

    document = documents_storage.get(document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Update allowed fields
    allowed_fields = ["name", "folder", "caseId", "tags"]
    for field in allowed_fields:
        if field in updates:
            document[field] = updates[field]

    document["lastModified"] = datetime.now(UTC).strftime("%Y-%m-%d")

    # Update folder counts if folder changed
    if "folder" in updates:
        update_folder_counts()

    return document
