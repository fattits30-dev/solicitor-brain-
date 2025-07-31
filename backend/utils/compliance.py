import hashlib
import json
import logging
import time
from datetime import UTC, datetime
from typing import Any

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from backend.config import settings
from backend.services.monitoring import (
    record_citation_check,
    record_request_duration,
    record_sign_off,
)

logger = logging.getLogger(__name__)


class ComplianceMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start_time = time.time()

        # Add compliance banner to all responses
        response = await call_next(request)
        response.headers["X-Compliance-Banner"] = settings.compliance_banner

        # Log request for audit trail
        duration = time.time() - start_time
        await self._log_request(request, response, duration)

        # Record metrics
        record_request_duration(
            method=request.method,
            endpoint=request.url.path,
            status=response.status_code,
            duration=duration,
        )

        return response

    async def _log_request(self, request: Request, response: Response, duration: float) -> None:
        # Create immutable audit log entry
        log_entry: dict[str, Any] = {
            "timestamp": datetime.now(UTC).isoformat(),
            "method": request.method,
            "path": request.url.path,
            "status": response.status_code,
            "duration": duration,
            "client": request.client.host if request.client else "unknown",
            "user_agent": request.headers.get("user-agent", ""),
        }

        # Hash for integrity
        log_hash = hashlib.sha256(json.dumps(log_entry, sort_keys=True).encode()).hexdigest()
        log_entry["hash"] = log_hash

        logger.info(f"AUDIT: {json.dumps(log_entry)}")


def check_citation(text: str, citations: list[dict[str, Any]]) -> bool:
    if not settings.citation_required:
        return True

    if not citations:
        logger.warning(f"No citations provided for text: {text[:100]}...")
        record_citation_check(success=False)
        return False

    # Verify citation confidence
    for citation in citations:
        if citation.get("confidence", 0) < settings.min_citation_confidence:
            logger.warning(f"Low confidence citation: {citation}")
            record_citation_check(success=False)
            return False

    # Verify citation domains
    for citation in citations:
        source = citation.get("source", "")
        valid_domain = any(domain in source for domain in settings.allowed_citation_domains)
        if not valid_domain:
            logger.warning(f"Invalid citation domain: {source}")
            record_citation_check(success=False)
            return False

    record_citation_check(success=True)
    return True


def validate_sign_off(document_id: str, status: str, user_id: str) -> bool:
    valid_statuses: list[Any] = ["suggested", "accepted", "amended", "rejected"]

    if status not in valid_statuses:
        logger.error(f"Invalid sign-off status: {status}")
        return False

    # Record sign-off for compliance tracking
    record_sign_off(document_id=document_id, status=status, user_id=user_id)

    logger.info(f"Document {document_id} signed off as {status} by {user_id}")
    return True
