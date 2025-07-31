import logging
from pathlib import Path
from typing import Any

import aiofiles
from fastapi import APIRouter, File, HTTPException, UploadFile

from backend.services.ocr_service import ocr_service

router = APIRouter()
logger = logging.getLogger(__name__)

# Temporary directory for uploaded files
TEMP_DIR = Path("temp_ocr")
TEMP_DIR.mkdir(exist_ok=True)


@router.post("/extract-text")
async def extract_text_from_image(file: UploadFile = File(...)) -> dict[str, Any]:
    """Extract text from uploaded image using OCR"""
    temp_path = None
    try:
        # Validate file type
        allowed_types = ["image/jpeg", "image/png", "image/gif", "image/bmp", "image/tiff"]
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image.")

        # Save uploaded file temporarily
        filename = file.filename if file.filename else "unnamed_file"
        temp_path = TEMP_DIR / filename
        async with aiofiles.open(temp_path, 'wb') as f:
            content = await file.read()
            await f.write(content)

        # Perform OCR
        result = await ocr_service.extract_text_from_image(str(temp_path))

        return {
            "filename": file.filename,
            "content_type": file.content_type,
            **result
        }

    except Exception as e:
        logger.error(f"OCR extraction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # Clean up temporary file
        if temp_path and temp_path.exists():
            temp_path.unlink()


@router.post("/extract-pdf")
async def extract_text_from_pdf(file: UploadFile = File(...)) -> dict[str, Any]:
    """Extract text from PDF file, including scanned PDFs"""
    temp_path = None
    try:
        # Validate file type
        if file.content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Invalid file type. Please upload a PDF.")

        # Save uploaded file temporarily
        filename = file.filename if file.filename else "unnamed_file.pdf"
        temp_path = TEMP_DIR / filename
        async with aiofiles.open(temp_path, 'wb') as f:
            content = await file.read()
            await f.write(content)

        # Extract text from PDF
        result = await ocr_service.extract_text_from_pdf(str(temp_path))

        return {
            "filename": file.filename,
            **result
        }

    except Exception as e:
        logger.error(f"PDF extraction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # Clean up temporary file
        if temp_path and temp_path.exists():
            temp_path.unlink()


@router.post("/analyze-layout")
async def analyze_document_layout(file: UploadFile = File(...)) -> dict[str, Any]:
    """Analyze document layout and structure"""
    temp_path = None
    try:
        # Validate file type
        allowed_types = ["image/jpeg", "image/png", "image/gif", "image/bmp", "image/tiff"]
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image.")

        # Save uploaded file temporarily
        filename = file.filename if file.filename else "unnamed_image"
        temp_path = TEMP_DIR / filename
        async with aiofiles.open(temp_path, 'wb') as f:
            content = await file.read()
            await f.write(content)

        # Analyze layout
        result = await ocr_service.analyze_document_layout(str(temp_path))

        return {
            "filename": file.filename,
            **result
        }

    except Exception as e:
        logger.error(f"Layout analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # Clean up temporary file
        if temp_path and temp_path.exists():
            temp_path.unlink()


@router.post("/extract-base64")
async def extract_text_from_base64(data: dict[str, str]) -> dict[str, Any]:
    """Extract text from base64 encoded image"""
    try:
        if "image" not in data:
            raise HTTPException(status_code=400, detail="Missing 'image' field in request")

        return await ocr_service.extract_text_from_base64(data["image"])


    except Exception as e:
        logger.error(f"Base64 OCR error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
