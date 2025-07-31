from datetime import datetime
from enum import Enum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class DocumentStatus(str, Enum):
    UPLOADING = "uploading"
    PROCESSING = "processing"
    READY = "ready"
    ERROR = "error"
    QUARANTINED = "quarantined"


class DocumentType(str, Enum):
    CONTRACT = "contract"
    COURT_FILING = "court_filing"
    CORRESPONDENCE = "correspondence"
    EVIDENCE = "evidence"
    LEGAL_MEMO = "legal_memo"
    TEMPLATE = "template"
    OTHER = "other"


class DocumentBase(BaseModel):
    title: str | None = Field(None, max_length=255)
    description: str | None = None
    document_type: DocumentType = DocumentType.OTHER

    case_id: UUID | None = None
    folder_id: UUID | None = None

    document_date: datetime | None = None
    expiry_date: datetime | None = None
    is_privileged: bool = False
    is_confidential: bool = False

    tags: list[str] = Field(default_factory=list)
    custom_fields: dict[str, Any] = Field(default_factory=dict)


class DocumentCreate(DocumentBase):
    """Used when creating a document via upload"""



class DocumentUpdate(BaseModel):
    title: str | None = Field(None, max_length=255)
    description: str | None = None
    document_type: DocumentType | None = None

    case_id: UUID | None = None
    folder_id: UUID | None = None

    document_date: datetime | None = None
    expiry_date: datetime | None = None
    is_privileged: bool | None = None
    is_confidential: bool | None = None

    tags: list[str] | None = None
    custom_fields: dict[str, Any] | None = None


class DocumentResponse(DocumentBase):
    id: UUID
    filename: str
    original_filename: str
    file_size: int
    mime_type: str
    status: DocumentStatus

    extracted_text: str | None = None
    ocr_confidence: float | None = None
    page_count: int | None = None

    ai_summary: str | None = None
    ai_tags: list[str] = Field(default_factory=list)
    ai_entities: dict[str, Any] = Field(default_factory=dict)
    ai_key_dates: list[dict[str, Any]] = Field(default_factory=list)
    ai_risk_score: float | None = None

    version: int
    parent_document_id: UUID | None = None

    scanned_at: datetime | None = None
    scan_status: str | None = None

    created_at: datetime
    updated_at: datetime
    created_by: str
    updated_by: str

    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    items: list[DocumentResponse]
    total: int
    page: int
    per_page: int
    pages: int


class DocumentUploadResponse(BaseModel):
    id: UUID
    filename: str
    status: DocumentStatus
    message: str
    upload_url: str | None = None  # For resumable uploads


class DocumentAnalysisRequest(BaseModel):
    analysis_type: str = Field(default="general", pattern="^(general|contract|compliance|risk)$")
    extract_entities: bool = True
    extract_dates: bool = True
    extract_clauses: bool = False
    generate_summary: bool = True


class DocumentAnalysisResponse(BaseModel):
    document_id: UUID
    status: str
    summary: str | None = None
    entities: dict[str, list[str]] = Field(default_factory=dict)
    key_dates: list[dict[str, Any]] = Field(default_factory=list)
    clauses: list[dict[str, Any]] = Field(default_factory=list)
    risk_assessment: dict[str, Any] | None = None
    compliance_check: dict[str, Any] | None = None
    processing_time: float
