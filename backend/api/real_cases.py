"""API endpoints for real case file management"""
from typing import Any

from fastapi import APIRouter, HTTPException

from backend.services.real_case_loader import RealCaseLoaderService

router = APIRouter()
case_loader = RealCaseLoaderService()


@router.get("/scan")
async def scan_for_documents() -> dict[str, Any]:
    """Scan filesystem for legal documents"""
    try:
        documents = await case_loader.scan_for_documents()
        return {
            "success": True,
            "count": len(documents),
            "documents": documents
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/document/{document_id}")
async def get_document_preview(document_id: str) -> dict[str, Any]:
    """Get preview of a document"""
    try:
        return await case_loader.get_document_preview(document_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create-case")
async def create_case_from_documents(document_ids: list[str]) -> dict[str, Any]:
    """Create a case from selected documents"""
    try:
        case = await case_loader.create_case_from_documents(document_ids)
        if not case:
            raise HTTPException(status_code=400, detail="No valid documents selected")
        return {
            "success": True,
            "case": case
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/prepare-for-ai")
async def prepare_documents_for_ai(document_ids: list[str]) -> dict[str, Any]:
    """Prepare documents for AI analysis"""
    try:
        prepared = await case_loader.prepare_for_ai_analysis(document_ids)
        return {
            "success": True,
            "documents": prepared,
            "count": len(prepared)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
