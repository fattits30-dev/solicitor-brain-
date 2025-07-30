from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/login", response_model=TokenResponse)
async def login():
    """Mock login - always succeeds"""
    return TokenResponse(access_token="no-auth-token")


@router.post("/token", response_model=TokenResponse)
async def get_token():
    """Mock token - always succeeds"""
    return TokenResponse(access_token="no-auth-token")