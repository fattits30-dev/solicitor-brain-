from fastapi import APIRouter


router = APIRouter()


@router.get("/")
async def list_emails():
    """List emails - placeholder"""
    return {"message": "Emails API", "user": "user@localhost"}