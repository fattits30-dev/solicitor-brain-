import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from opentelemetry.instrumentation.fastapi import (
    FastAPIInstrumentor,  # type: ignore[import-untyped]
)
from prometheus_client import make_asgi_app  # type: ignore[import-untyped]

from backend.api import (
    ai_monitor,
    auth,
    case_analysis,
    cases,
    chat,
    dashboard,
    documents,
    emails,
    facts,
    health,
    mock_data,
    ocr,
    real_cases,
    settings_api,
    voice,
    websocket,
)
from backend.config import settings
from backend.middleware.error_reporting import ErrorReportingMiddleware
from backend.utils.app_mode import get_database_module
from backend.utils.bug_reporter import bug_reporter

# Get the appropriate database module based on environment
db = get_database_module()
init_db = db.init_db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Startup
    logger.info("Starting Solicitor Brain API...")
    await init_db()
    yield
    # Shutdown
    logger.info("Shutting down...")


app = FastAPI(title="Solicitor Brain API", version="0.1.0", lifespan=lifespan)

# Error reporting middleware (must be added first to catch all errors)
app.add_middleware(ErrorReportingMiddleware)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Monitoring
FastAPIInstrumentor.instrument_app(app)  # type: ignore[no-untyped-call]
metrics_app = make_asgi_app()  # type: ignore[no-untyped-call]
app.mount("/metrics", metrics_app)  # type: ignore[arg-type]

# Check if we should use mock data
USE_MOCK_DATA = os.getenv("USE_MOCK_DATA", "true").lower() == "true"

if USE_MOCK_DATA:
    # Use mock data endpoints
    logger.info("Using mock data endpoints")
    app.include_router(mock_data.router, prefix="/api", tags=["mock"])
    # Still include some essential routers
    app.include_router(health.router, prefix="/health", tags=["health"])
    app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
    app.include_router(websocket.router, tags=["websocket"])
else:
    # Include real routers
    app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
    app.include_router(cases.router, prefix="/api/cases", tags=["cases"])
    app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
    app.include_router(emails.router, prefix="/api/emails", tags=["emails"])
    app.include_router(facts.router, prefix="/api/facts", tags=["facts"])
    app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
    app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
    app.include_router(case_analysis.router, prefix="/api/analysis", tags=["analysis"])
    app.include_router(websocket.router, tags=["websocket"])  # WebSocket routes don't need prefix
    app.include_router(health.router, prefix="/health", tags=["health"])
    app.include_router(settings_api.router, prefix="/api/settings", tags=["settings"])
    app.include_router(ai_monitor.router, prefix="/api/ai-monitor", tags=["ai-monitor"])
    app.include_router(ocr.router, prefix="/api/ocr", tags=["ocr"])
    app.include_router(voice.router, prefix="/api/voice", tags=["voice"])
    app.include_router(real_cases.router, prefix="/api/real-cases", tags=["real-cases"])


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):  # type: ignore[misc]
    logger.error(f"Unhandled exception: {exc}", exc_info=True)

    # Report error to bug reporter
    error_report = bug_reporter.report_error(
        exc,
        context={
            "endpoint": str(request.url),
            "method": request.method,
            "headers": dict(request.headers),
        },
        user_message="An unexpected error occurred while processing your request"
    )

    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "banner": settings.compliance_banner,
            "error_id": error_report["id"],
        },
    )


@app.get("/")
async def root():
    return {
        "message": "Solicitor Brain API",
        "version": "0.1.0",
        "banner": settings.compliance_banner,
        "docs": "/docs",
        "health": "/health",
    }
