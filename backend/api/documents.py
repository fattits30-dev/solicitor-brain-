from fastapi import APIRouter


router = APIRouter()


@router.get("/")
async def list_documents():
    """List documents - placeholder"""
    return {"message": "Documents API", "user": "user@localhost"}