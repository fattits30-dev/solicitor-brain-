import glob
import os
from datetime import datetime
from pathlib import Path
from typing import Any

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from backend.services.ai_service import AIService

router = APIRouter()

# Simulated case database
CASES_DIR = Path("./data/cases")
CASES_DIR.mkdir(exist_ok=True, parents=True)


class ChatMessage(BaseModel):
    message: str
    case_id: str | None = None
    attachments: list[str] | None = []


class ChatResponse(BaseModel):
    response: str
    user: str
    banner: str
    actions: list[dict[str, Any]] | None = []
    suggestions: list[str] | None = []


class DocumentAnalysis(BaseModel):
    filename: str
    content_type: str
    analysis: str
    extracted_data: dict[str, Any]


@router.post("/", response_model=ChatResponse)
async def chat(message: ChatMessage) -> ChatResponse:
    """Process chat messages and determine actions"""
    response_text = ""
    actions: list[dict[str, Any]] = []
    suggestions: list[str] = []

    # Initialize AI service
    ai_service = AIService()

    # Analyze the message to determine intent
    message_lower = message.message.lower()

    if any(word in message_lower for word in ["search", "find", "look for"]) and "case" in message_lower:
        # Search for cases
        cases = search_cases(message.message)
        if cases:
            response_text = f"I found {len(cases)} cases matching your search:\n\n"
            for case in cases[:5]:  # Limit to 5 results
                response_text += f"• {case['name']} - {case['path']}\n"
            actions.append(
                {
                    "type": "search",
                    "status": "complete",
                    "result": f"Found {len(cases)} cases",
                }
            )
        else:
            response_text = "No cases found matching your search criteria."
            suggestions = [
                "Try different search terms",
                "Upload a new case document",
            ]

    elif any(word in message_lower for word in ["analyze", "review", "extract", "scan"]):
        response_text = (
            "Please upload the document you'd like me to analyze. I can process PDFs, images, and text documents."
        )
        suggestions = [
            "Upload a PDF contract",
            "Upload a scanned document image",
            "Paste text to analyze",
        ]

    elif any(word in message_lower for word in ["draft", "create", "write"]):
        response_text = "I can help you draft legal documents. What type of document would you like to create?"
        suggestions = [
            "Contract",
            "Letter of advice",
            "Court filing",
            "Legal memo",
        ]

    else:
        # Use AI for general legal queries
        response_text = await ai_service.search_legal_knowledge(message.message)
        suggestions = [
            "Ask about specific legislation",
            "Search for case law",
            "Request document analysis",
        ]

    return ChatResponse(
        response=response_text,
        user="user@localhost",
        banner="AI outputs are organisational assistance only – verify before use.",
        actions=actions,
        suggestions=suggestions,
    )


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    case_id: str | None = Form(None),  # For future use
    action: str = Form("analyze"),
) -> dict[str, Any]:
    """Handle document uploads for analysis"""
    # Validate file type
    allowed_types = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "text/plain",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]

    if not file.content_type or file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    # Save file temporarily
    temp_path = Path(f"./temp/{file.filename}")
    temp_path.parent.mkdir(exist_ok=True)

    with open(temp_path, "wb") as f:
        content = await file.read()
        f.write(content)

    # Analyze based on action
    if action == "analyze":
        analysis = analyze_document(temp_path, file.content_type or "application/octet-stream")

        # Clean up
        temp_path.unlink()

        return {
            "status": "success",
            "analysis": analysis,
            "suggestions": [
                "Extract key clauses",
                "Check for compliance issues",
                "Compare with templates",
            ],
        }

    return {"status": "success", "message": "Document processed"}


def search_cases(query: str) -> list[dict[str, str]]:
    """Search for cases in the file system"""
    results: list[dict[str, str]] = []
    search_terms = query.lower().split()

    # Search in common document locations
    search_paths: list[Any] = [
        os.path.expanduser("~/Documents"),
        os.path.expanduser("~/Desktop"),
        "./data/cases",
    ]

    for base_path in search_paths:
        if not os.path.exists(base_path):
            continue

        # Search for files
        for ext in ["*.pdf", "*.doc", "*.docx", "*.txt"]:
            pattern = os.path.join(base_path, "**", ext)
            for filepath in glob.glob(pattern, recursive=True):
                filename = os.path.basename(filepath).lower()

                # Check if any search term is in the filename
                if any(term in filename for term in search_terms):
                    results.append(
                        {
                            "name": os.path.basename(filepath),
                            "path": filepath,
                            "modified": datetime.fromtimestamp(os.path.getmtime(filepath)).isoformat(),
                        }
                    )

                    if len(results) >= 20:  # Limit results
                        return results

    return results


def analyze_document(filepath: Path, content_type: str) -> DocumentAnalysis:
    """Analyze a document and extract information"""
    # This is a simplified version - in production, you'd use proper OCR/NLP

    analysis: dict[str, Any] = {
        "filename": filepath.name,
        "content_type": content_type,
        "analysis": "",
        "extracted_data": {},
    }

    if "image" in content_type:
        analysis["analysis"] = "Image document detected. In a production system, this would use OCR to extract text."
        analysis["extracted_data"] = {
            "type": "scanned_document",
            "pages": 1,
            "quality": "good",
            "suggested_actions": [
                "OCR processing",
                "Text extraction",
                "Entity recognition",
            ],
        }
    elif "pdf" in content_type:
        analysis["analysis"] = "PDF document detected. Would extract text and analyze structure."
        analysis["extracted_data"] = {
            "type": "pdf_document",
            "pages": "unknown",
            "has_text": True,
            "suggested_actions": ["Extract clauses", "Identify parties", "Check dates"],
        }
    else:
        analysis["analysis"] = "Text document detected. Ready for analysis."
        analysis["extracted_data"] = {
            "type": "text_document",
            "encoding": "utf-8",
            "suggested_actions": [
                "Parse content",
                "Extract entities",
                "Classify document type",
            ],
        }

    return DocumentAnalysis(**analysis)
