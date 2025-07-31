import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, HTTPException

router = APIRouter()

# TODO: Replace with proper database models and queries
# In-memory storage for demo
cases_storage: dict[str, dict[str, Any]] = {}

# Initialize with some demo data
demo_cases = [
    {
        "id": str(uuid.uuid4()),
        "case_number": "2025-001",
        "title": "Smith vs. Johnson Contract Dispute",
        "client_name": "John Smith",
        "client_email": "john.smith@email.com",
        "client_phone": "+44 20 7123 4567",
        "status": "active",
        "priority": "high",
        "case_type": "Contract Law",
        "description": "Commercial contract dispute regarding delivery terms",
        "created_at": datetime.now(UTC).isoformat(),
        "updated_at": datetime.now(UTC).isoformat(),
    },
    {
        "id": str(uuid.uuid4()),
        "case_number": "2025-002",
        "title": "Green Ltd Property Purchase",
        "client_name": "Green Ltd",
        "client_email": "legal@greenltd.com",
        "client_phone": "+44 20 7234 5678",
        "status": "active",
        "priority": "medium",
        "case_type": "Property Law",
        "description": "Commercial property acquisition",
        "created_at": datetime.now(UTC).isoformat(),
        "updated_at": datetime.now(UTC).isoformat(),
    },
    {
        "id": str(uuid.uuid4()),
        "case_number": "2025-003",
        "title": "Williams Employment Tribunal",
        "client_name": "Sarah Williams",
        "client_email": "s.williams@email.com",
        "status": "pending",
        "priority": "high",
        "case_type": "Employment Law",
        "description": "Unfair dismissal claim",
        "created_at": datetime.now(UTC).isoformat(),
        "updated_at": datetime.now(UTC).isoformat(),
    },
]

# Initialize storage with demo data
for case in demo_cases:
    cases_storage[case["id"]] = case


@router.get("/", response_model=dict[str, Any])
async def list_cases(
    status: str | None = None,
    search: str | None = None,
    page: int = 1,
    per_page: int = 20,
) -> dict[str, Any]:
    """List all cases with filtering"""
    # TODO: Implement database queries
    # - Use SQLAlchemy ORM with Case model
    # - Add filters for status, priority, date ranges
    # - Implement full-text search on title, description, client_name
    # - Add sorting options (created_at, updated_at, priority)
    # - Include aggregated data (document count, last activity)

    # Filter cases
    filtered_cases = list(cases_storage.values())

    if status and status != "all":
        filtered_cases = [c for c in filtered_cases if c.get("status") == status]

    if search:
        search_lower = search.lower()
        filtered_cases = [
            c for c in filtered_cases
            if search_lower in c.get("title", "").lower()
            or search_lower in c.get("client_name", "").lower()
            or search_lower in c.get("case_number", "").lower()
        ]

    # Sort by updated_at descending
    filtered_cases.sort(key=lambda x: x.get("updated_at", ""), reverse=True)

    # Paginate
    total = len(filtered_cases)
    start = (page - 1) * per_page
    end = start + per_page
    items = filtered_cases[start:end]

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page if total > 0 else 0,
    }


@router.post("/", response_model=dict[str, Any])
async def create_case(case_data: dict[str, Any]) -> dict[str, Any]:
    """Create a new case"""
    # TODO: Implement proper case creation
    # - Validate required fields (title, client_name, case_type)
    # - Auto-generate case number with configurable format
    # - Create audit log entry
    # - Send notification to assigned solicitor
    # - Create default folders for case documents
    # - Initialize case timeline

    # Generate ID and timestamps
    case_id = str(uuid.uuid4())
    now = datetime.now(UTC).isoformat()

    # Create case
    new_case = {
        "id": case_id,
        "created_at": now,
        "updated_at": now,
        **case_data
    }

    # Generate case number if not provided
    if not new_case.get("case_number"):
        case_count = len(cases_storage) + 1
        new_case["case_number"] = f"{datetime.now().year}-{case_count:03d}"

    # Store case
    cases_storage[case_id] = new_case

    return new_case


@router.get("/{case_id}", response_model=dict[str, Any])
async def get_case(case_id: str) -> dict[str, Any]:
    """Get a specific case"""
    # TODO: Implement comprehensive case retrieval
    # - Include related documents count and recent documents
    # - Add case timeline/history
    # - Include AI-generated insights
    # - Add related emails
    # - Include upcoming deadlines and tasks
    # - Add access control checks

    case = cases_storage.get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    return case


@router.patch("/{case_id}", response_model=dict[str, Any])
async def update_case(case_id: str, updates: dict[str, Any]) -> dict[str, Any]:
    """Update a case"""

    case = cases_storage.get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Update fields
    case.update(updates)
    case["updated_at"] = datetime.now(UTC).isoformat()

    return case


@router.delete("/{case_id}")
async def delete_case(case_id: str) -> dict[str, str]:
    """Delete a case (archive it)"""

    case = cases_storage.get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Archive instead of delete
    case["status"] = "archived"
    case["updated_at"] = datetime.now(UTC).isoformat()

    return {"message": "Case archived successfully"}
