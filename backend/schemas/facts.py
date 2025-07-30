from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID


class CitationSchema(BaseModel):
    source: str = Field(..., description="Source URL or reference")
    confidence: float = Field(..., ge=0.0, le=1.0)
    snippet_id: Optional[str] = None
    text: Optional[str] = None


class FactCreate(BaseModel):
    fact_text: str = Field(..., min_length=1, max_length=5000)
    fact_type: str = Field(..., pattern="^(date|party|claim|evidence|legal_point|general)$")
    source_document_id: Optional[UUID] = None
    source_page: Optional[str] = Field(None, max_length=50)
    source_text: Optional[str] = None
    citations: Optional[List[CitationSchema]] = None
    extracted_by_ai: bool = False
    importance: str = Field("medium", pattern="^(critical|high|medium|low)$")
    category: Optional[str] = Field(None, max_length=100)
    tags: Optional[List[str]] = None

    @field_validator("citations")
    @classmethod
    def validate_citations(cls, v: Optional[List[CitationSchema]], info: Any) -> Optional[List[CitationSchema]]:
        if info.data.get("extracted_by_ai") and not v:
            raise ValueError("AI-extracted facts must include citations")
        return v


class FactUpdate(BaseModel):
    fact_text: Optional[str] = Field(None, min_length=1, max_length=5000)
    importance: Optional[str] = Field(None, pattern="^(critical|high|medium|low)$")
    category: Optional[str] = Field(None, max_length=100)
    tags: Optional[List[str]] = None


class FactVerification(BaseModel):
    status: str = Field(..., pattern="^(verified|disputed)$")
    reason: Optional[str] = Field(None, max_length=1000)


class FactSignOff(BaseModel):
    status: str = Field(..., pattern="^(accepted|amended|rejected)$")
    reason: Optional[str] = Field(None, max_length=1000)


class FactResponse(BaseModel):
    id: UUID
    case_id: UUID
    fact_type: str
    fact_text: str
    fact_date: Optional[datetime] = None
    source_document_id: Optional[UUID] = None
    source_page: Optional[str] = None
    source_text: Optional[str] = None
    verification_status: str
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    confidence_score: float
    extracted_by_ai: bool
    extraction_model: Optional[str] = None
    extraction_timestamp: Optional[datetime] = None
    citations: Optional[List[Dict[str, Any]]] = None
    importance: str
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    sign_off_status: str
    sign_off_by: Optional[str] = None
    sign_off_at: Optional[datetime] = None
    amendment_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FactBulkExtract(BaseModel):
    facts: List[Dict[str, Any]] = Field(..., min_length=1, max_length=100)

    @field_validator("facts")
    @classmethod
    def validate_facts(cls, v: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        required_fields = {"text", "type", "citations"}
        for fact in v:
            if not all(field in fact for field in required_fields):
                raise ValueError(f"Each fact must have: {required_fields}")
        return v
