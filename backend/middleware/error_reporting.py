"""
Error reporting middleware for VS Code integration
"""

import time
from collections.abc import Awaitable, Callable

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from starlette.middleware.base import BaseHTTPMiddleware

from backend.utils.bug_reporter import bug_reporter


class ErrorReportingMiddleware(BaseHTTPMiddleware):
    """Middleware to catch and report errors to VS Code"""

    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        start_time = time.time()

        try:
            response = await call_next(request)

            # Log slow requests as warnings
            process_time = time.time() - start_time
            if process_time > 1.0:  # Requests taking more than 1 second
                bug_reporter.report_warning(
                    f"Slow request: {request.method} {request.url.path} took {process_time:.2f}s",
                    context={
                        "method": request.method,
                        "path": str(request.url.path),
                        "duration": process_time
                    }
                )

            return response

        except ValidationError as exc:
            # Report validation errors
            for error in exc.errors():
                field = ".".join(str(loc) for loc in error["loc"])
                bug_reporter.report_validation_error(
                    field=field,
                    value=error.get("input", "unknown"),
                    expected=error["type"]
                )

            return JSONResponse(
                status_code=422,
                content={
                    "detail": exc.errors(),
                    "body": str(exc)
                }
            )

        except Exception as exc:
            # Report unexpected errors
            error_report = bug_reporter.report_error(
                exc,
                context={
                    "endpoint": str(request.url),
                    "method": request.method,
                    "path": str(request.url.path),
                    "query_params": dict(request.query_params),
                }
            )

            return JSONResponse(
                status_code=500,
                content={
                    "detail": "Internal server error",
                    "error_id": error_report["id"]
                }
            )
