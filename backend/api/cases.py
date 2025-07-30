from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime, timezone
from pydantic import BaseModel


router = APIRouter()


class CaseCreate(BaseModel):
    case_number: str
    title: str
    client_name: str
    jurisdiction: str = "UK"


class CaseResponse(BaseModel):
    id: UUID
    case_number: str
    title: str
    client_name: str
    status: str
    jurisdiction: str
    created_at: datetime
    updated_at: datetime


# In-memory storage for development
CASES_DB: Dict[UUID, Dict[str, Any]] = {}


@router.post("/", response_model=CaseResponse)
async def create_case(case_data: CaseCreate) -> CaseResponse:
    """Create a new case"""
    case_id = uuid4()
    now = datetime.now(timezone.utc)

    case: Dict[str, Any] = {
        "id": case_id,
        "case_number": case_data.case_number,
        "title": case_data.title,
        "client_name": case_data.client_name,
        "status": "active",
        "jurisdiction": case_data.jurisdiction,
        "created_at": now,
        "updated_at": now,
        "created_by": "default-user",
    }

    CASES_DB[case_id] = case
    return CaseResponse(**case)


@router.get("/", response_model=List[CaseResponse])
async def list_cases() -> List[CaseResponse]:
    """List all cases"""
    return [CaseResponse(**case) for case in CASES_DB.values()]


@router.get("/{case_id}", response_model=CaseResponse)
async def get_case(case_id: UUID) -> CaseResponse:
    """Get a specific case"""
    if case_id not in CASES_DB:
        raise HTTPException(status_code=404, detail="Case not found")

    return CaseResponse(**CASES_DB[case_id])
