"""
Mock data API endpoints for testing
Serves data from JSON files
"""

import json
import os
from datetime import UTC
from typing import Any

from fastapi import APIRouter, HTTPException, Query

router = APIRouter()

# Sample data directory
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "sample_data")


def load_json_data(filename: str) -> Any:
    """Load data from JSON file"""
    filepath = os.path.join(DATA_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail=f"Data file {filename} not found")

    with open(filepath) as f:
        return json.load(f)


@router.get("/cases")
async def get_mock_cases(
    status: str | None = None,
    case_type: str | None = None,
    priority: str | None = None,
) -> list[dict[str, Any]]:
    """Get mock cases with optional filtering"""
    cases = load_json_data("cases.json")

    # Apply filters
    if status:
        cases = [c for c in cases if c.get("status") == status]
    if case_type:
        cases = [c for c in cases if c.get("caseType") == case_type]
    if priority:
        cases = [c for c in cases if c.get("priority") == priority]

    return cases


@router.get("/documents")
async def get_mock_documents(
    folder: str | None = None,
    case_id: str | None = None,
) -> list[dict[str, Any]]:
    """Get mock documents with optional filtering"""
    documents = load_json_data("documents.json")

    # Apply filters
    if folder and folder != "all":
        documents = [d for d in documents if d.get("folder") == folder]
    if case_id:
        documents = [d for d in documents if d.get("caseId") == case_id]

    return documents


@router.get("/emails")
async def get_mock_emails(
    folder: str | None = Query(default="inbox"),
    search: str | None = None,
) -> dict[str, Any]:
    """Get mock emails with folder data"""
    data = load_json_data("emails.json")
    emails = data["emails"]
    folders = data["folders"]

    # Filter by folder
    if folder:
        emails = [e for e in emails if e.get("folder") == folder]

    # Search filter
    if search:
        search_lower = search.lower()
        emails = [
            e for e in emails
            if search_lower in e.get("subject", "").lower()
            or search_lower in e.get("from", "").lower()
            or search_lower in e.get("body", "").lower()
        ]

    return {"emails": emails, "folders": folders}


@router.get("/email-folders")
async def get_mock_email_folders() -> dict[str, Any]:
    """Get email folder statistics"""
    data = load_json_data("emails.json")
    return {"folders": data["folders"]}


@router.get("/dashboard/metrics")
async def get_mock_dashboard_metrics() -> dict[str, Any]:
    """Get dashboard metrics"""
    return load_json_data("metrics.json")


@router.post("/real-cases/scan")
async def scan_mock_documents() -> dict[str, Any]:
    """Mock endpoint for document scanning"""
    documents = load_json_data("documents.json")

    # Convert to the format expected by the frontend
    real_docs: list[dict[str, Any]] = []
    for doc in documents:
        real_docs.append({
            "id": doc["id"],
            "name": doc["name"],
            "type": doc["type"],
            "size": doc["size"],
            "category": doc["category"],
            "created": doc["uploadedAt"],
            "modified": doc["lastModified"],
        })

    return {
        "success": True,
        "documents": real_docs,
        "count": len(real_docs)
    }


@router.post("/cases")
async def create_mock_case(case_data: dict[str, Any]) -> dict[str, Any]:
    """Mock endpoint for creating a case"""
    # In a real implementation, this would save to the database
    # For now, just return the case with an ID
    from datetime import datetime
    from uuid import uuid4

    case_data["id"] = str(uuid4())
    case_data["createdAt"] = datetime.now(UTC).isoformat()
    case_data["updatedAt"] = datetime.now(UTC).isoformat()

    return case_data


@router.post("/emails/send")
async def send_mock_email(_email_data: dict[str, Any]) -> dict[str, Any]:  # Data for future use
    """Mock endpoint for sending email"""
    from datetime import datetime
    from uuid import uuid4

    return {
        "id": str(uuid4()),
        "status": "sent",
        "timestamp": datetime.now(UTC).isoformat(),
        "message": "Email sent successfully"
    }


@router.put("/emails/{email_id}")
async def update_mock_email(email_id: str, _update_data: dict[str, Any]) -> dict[str, Any]:  # Data for future use
    """Mock endpoint for updating email"""
    return {
        "id": email_id,
        "status": "updated",
        "message": "Email updated successfully"
    }
