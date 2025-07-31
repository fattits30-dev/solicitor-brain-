from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class CitationSchema(BaseModel):
    source: str = Field(..., description="Source URL or reference")
    confidence: float = Field(..., ge=0.0, le=1.0)
    snippet_id: str | None = None
    text: str | None = None


class FactCreate(BaseModel):
    fact_text: str = Field(..., min_length=1, max_length=5000)
    fact_type: str = Field(..., pattern="^(date|party|claim|evidence|legal_point|general)$")
    source_document_id: UUID | None = None
    source_page: str | None = Field(None, max_length=50)
    source_text: str | None = None
    citations: list[CitationSchema] | None = None
    extracted_by_ai: bool = False
    importance: str = Field("medium", pattern="^(critical|high|medium|low)$")
    category: str | None = Field(None, max_length=100)
    tags: list[str] | None = None

    @field_validator("citations")
    @classmethod
    def validate_citations(cls, v: list[CitationSchema] | None, info: Any) -> list[CitationSchema] | None:
        if info.data.get("extracted_by_ai") and not v:
            raise ValueError("AI-extracted facts must include citations")
        return v


class FactUpdate(BaseModel):
    fact_text: str | None = Field(None, min_length=1, max_length=5000)
    importance: str | None = Field(None, pattern="^(critical|high|medium|low)$")
    category: str | None = Field(None, max_length=100)
    tags: list[str] | None = None


class FactVerification(BaseModel):
    status: str = Field(..., pattern="^(verified|disputed)$")
    reason: str | None = Field(None, max_length=1000)


class FactSignOff(BaseModel):
    status: str = Field(..., pattern="^(accepted|amended|rejected)$")
    reason: str | None = Field(None, max_length=1000)


class FactResponse(BaseModel):
    id: UUID
    case_id: UUID
    fact_type: str
    fact_text: str
    fact_date: datetime | None = None
    source_document_id: UUID | None = None
    source_page: str | None = None
    source_text: str | None = None
    verification_status: str
    verified_by: str | None = None
    verified_at: datetime | None = None
    confidence_score: float
    extracted_by_ai: bool
    extraction_model: str | None = None
    extraction_timestamp: datetime | None = None
    citations: list[dict[str, Any]] | None = None
    importance: str
    category: str | None = None
    tags: list[str] | None = None
    sign_off_status: str
    sign_off_by: str | None = None
    sign_off_at: datetime | None = None
    amendment_reason: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FactBulkExtract(BaseModel):
    facts: list[dict[str, Any]] = Field(..., min_length=1, max_length=100)

    @field_validator("facts")
    @classmethod
    def validate_facts(cls, v: list[dict[str, Any]]) -> list[dict[str, Any]]:
        required_fields = {"text", "type", "citations"}
        for fact in v:
            if not all(field in fact for field in required_fields):
                raise ValueError(f"Each fact must have: {required_fields}")
        return v
