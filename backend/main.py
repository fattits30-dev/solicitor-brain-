from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
from prometheus_client import make_asgi_app  # type: ignore[import-untyped]
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor  # type: ignore[import-untyped]

from backend.api import cases, documents, emails, chat, auth, health, facts
from backend.config import settings
from backend.utils.database import init_db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Solicitor Brain API...")
    await init_db()
    yield
    # Shutdown
    logger.info("Shutting down...")


app = FastAPI(title="Solicitor Brain API", version="0.1.0", lifespan=lifespan)

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

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(cases.router, prefix="/api/cases", tags=["cases"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(emails.router, prefix="/api/emails", tags=["emails"])
app.include_router(facts.router, prefix="/api/facts", tags=["facts"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(health.router, prefix="/health", tags=["health"])


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):  # type: ignore[misc]
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500, content={"detail": "Internal server error", "banner": settings.compliance_banner}
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
