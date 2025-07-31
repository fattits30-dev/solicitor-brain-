from datetime import datetime
from enum import Enum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class CaseStatus(str, Enum):
    ACTIVE = "active"
    PENDING = "pending"
    CLOSED = "closed"
    ARCHIVED = "archived"


class CaseBase(BaseModel):
    case_number: str = Field(..., min_length=1, max_length=50)
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    client_name: str = Field(..., min_length=1, max_length=255)
    client_email: EmailStr | None = None
    client_phone: str | None = Field(None, max_length=50)

    jurisdiction: str = Field(default="UK", max_length=50)
    court: str | None = Field(None, max_length=255)
    judge: str | None = Field(None, max_length=255)
    opposing_counsel: str | None = Field(None, max_length=255)
    case_type: str | None = Field(None, max_length=100)

    filing_date: datetime | None = None
    next_hearing_date: datetime | None = None
    statute_of_limitations: datetime | None = None

    estimated_value: float | None = None
    fees_quoted: float | None = None
    fees_collected: float | None = None

    tags: list[str] = Field(default_factory=list)
    custom_fields: dict[str, Any] = Field(default_factory=dict)


class CaseCreate(CaseBase):
    pass


class CaseUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    client_name: str | None = Field(None, min_length=1, max_length=255)
    client_email: EmailStr | None = None
    client_phone: str | None = Field(None, max_length=50)

    status: CaseStatus | None = None
    court: str | None = Field(None, max_length=255)
    judge: str | None = Field(None, max_length=255)
    opposing_counsel: str | None = Field(None, max_length=255)
    case_type: str | None = Field(None, max_length=100)

    filing_date: datetime | None = None
    next_hearing_date: datetime | None = None
    statute_of_limitations: datetime | None = None

    estimated_value: float | None = None
    fees_quoted: float | None = None
    fees_collected: float | None = None

    tags: list[str] | None = None
    custom_fields: dict[str, Any] | None = None


class CaseResponse(CaseBase):
    id: UUID
    status: CaseStatus
    created_at: datetime
    updated_at: datetime
    created_by: str
    updated_by: str

    class Config:
        from_attributes = True


class CaseListResponse(BaseModel):
    items: list[CaseResponse]
    total: int
    page: int
    per_page: int
    pages: int
