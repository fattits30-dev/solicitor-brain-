"""Simplified backend for testing without database"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Solicitor Brain API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Solicitor Brain API is running"}


@app.get("/health")
async def health():
    return {"status": "healthy", "database": "not connected (test mode)", "version": "1.0.0"}


@app.post("/api/auth/login")
async def login():
    """Mock login for testing"""
    return {"access_token": "test-token-123", "token_type": "bearer"}


@app.get("/api/cases")
async def get_cases():
    """Mock cases for testing"""
    return [
        {
            "id": "1",
            "case_number": "2024-001",
            "title": "Smith v Jones",
            "client_name": "John Smith",
            "status": "active",
        },
        {
            "id": "2",
            "case_number": "2024-002",
            "title": "Estate of Brown",
            "client_name": "Mary Brown",
            "status": "active",
        },
    ]


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)  # type: ignore[attr-defined]
