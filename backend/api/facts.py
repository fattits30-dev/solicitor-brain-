from typing import Any
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.schemas.facts import (
    FactBulkExtract,
    FactCreate,
    FactResponse,
    FactSignOff,
    FactVerification,
)
from backend.services.auth import get_default_user
from backend.services.fact_service import FactService
from backend.utils.compliance import validate_sign_off
from backend.utils.database import get_db

router = APIRouter()


@router.post("/cases/{case_id}/facts", response_model=FactResponse)
async def create_fact(case_id: UUID, fact_data: FactCreate, db: AsyncSession = Depends(get_db)) -> FactResponse:
    """Create a new fact for a case with compliance checks"""
    service = FactService(db)

    try:
        fact = await service.save_fact(
            case_id=case_id,
            fact_text=fact_data.fact_text,
            fact_type=fact_data.fact_type,
            source_document_id=fact_data.source_document_id,
            source_page=fact_data.source_page,
            source_text=fact_data.source_text,
            citations=[citation.model_dump() for citation in fact_data.citations] if fact_data.citations else None,
            extracted_by_ai=fact_data.extracted_by_ai,
            importance=fact_data.importance,
            category=fact_data.category,
            tags=fact_data.tags,
            user_id=get_default_user()["id"],
        )
        return FactResponse.model_validate(fact)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/cases/{case_id}/facts", response_model=list[FactResponse])
async def get_case_facts(
    case_id: UUID,
    fact_type: str | None = None,
    verification_status: str | None = None,
    importance: str | None = None,
    include_rejected: bool = False,
    db: AsyncSession = Depends(get_db),
) -> list[FactResponse]:
    """Get all facts for a case with filtering"""
    service = FactService(db)

    facts = await service.get_case_facts(
        case_id=case_id,
        fact_type=fact_type,
        verification_status=verification_status,
        importance=importance,
        include_rejected=include_rejected,
    )

    return [FactResponse.model_validate(fact) for fact in facts]


@router.post("/facts/{fact_id}/verify", response_model=FactResponse)
async def verify_fact(
    fact_id: UUID, verification: FactVerification, db: AsyncSession = Depends(get_db)
) -> FactResponse:
    """Verify or dispute a fact"""
    service = FactService(db)

    try:
        fact = await service.verify_fact(
            fact_id=fact_id,
            verification_status=verification.status,
            user_id=get_default_user()["id"],
            amendment_reason=verification.reason,
        )
        return FactResponse.model_validate(fact)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/facts/{fact_id}/sign-off", response_model=FactResponse)
async def sign_off_fact(fact_id: UUID, sign_off: FactSignOff, db: AsyncSession = Depends(get_db)) -> FactResponse:
    """Sign off on a fact (accept/amend/reject)"""
    service = FactService(db)

    # Validate sign-off status
    if not validate_sign_off(str(fact_id), sign_off.status, "default-user"):
        raise HTTPException(status_code=400, detail="Invalid sign-off status")

    try:
        fact = await service.sign_off_fact(
            fact_id=fact_id,
            sign_off_status=sign_off.status,
            user_id=get_default_user()["id"],
            amendment_reason=sign_off.reason,
        )
        return FactResponse.model_validate(fact)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/cases/{case_id}/facts/critical-dates", response_model=list[FactResponse])
async def get_critical_dates(case_id: UUID, db: AsyncSession = Depends(get_db)) -> list[FactResponse]:
    """Get all critical dates for a case"""
    service = FactService(db)
    dates = await service.get_critical_dates(case_id)
    return [FactResponse.model_validate(date) for date in dates]


@router.get("/cases/{case_id}/facts/conflicts")
async def find_conflicting_facts(case_id: UUID, db: AsyncSession = Depends(get_db)) -> list[dict[str, dict[str, Any]]]:
    """Find potentially conflicting facts in a case"""
    service = FactService(db)
    conflicts = await service.find_conflicting_facts(case_id)

    return [
        {
            "fact1": {
                "id": f1.id,
                "text": f1.fact_text,
                "type": f1.fact_type,
                "source": f1.source_page,
            },
            "fact2": {
                "id": f2.id,
                "text": f2.fact_text,
                "type": f2.fact_type,
                "source": f2.source_page,
            },
        }
        for f1, f2 in conflicts
    ]


@router.post("/cases/{case_id}/facts/bulk-extract")
async def bulk_extract_facts(
    case_id: UUID,
    document_id: UUID,
    extraction_data: FactBulkExtract,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Extract multiple facts from a document"""
    service = FactService(db)

    # Process in background for large extractions
    if len(extraction_data.facts) > 10:
        background_tasks.add_task(service.bulk_extract_facts, case_id, document_id, extraction_data.facts)
        return {"message": f"Extracting {len(extraction_data.facts)} facts in background"}

    # Process immediately for small batches
    facts = await service.bulk_extract_facts(case_id, document_id, extraction_data.facts)

    return {
        "extracted": len(facts),
        "failed": len(extraction_data.facts) - len(facts),
        "facts": [FactResponse.model_validate(fact) for fact in facts],
    }
