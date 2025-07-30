from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional


router = APIRouter()


class ChatMessage(BaseModel):
    message: str
    case_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    user: str
    banner: str


@router.post("/", response_model=ChatResponse)
async def chat(message: ChatMessage) -> ChatResponse:
    """Chat endpoint - placeholder"""
    return ChatResponse(
        response=f"I understand you said: '{message.message}'. This is a placeholder response.",
        user="user@localhost",
        banner="AI outputs are organisational assistance only – verify before use.",
    )
