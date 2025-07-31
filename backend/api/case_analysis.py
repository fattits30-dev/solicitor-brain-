import asyncio
from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import APIRouter, BackgroundTasks, HTTPException

# from backend.services.ai_service import AIService  # Commented out for now

router = APIRouter()

# In-memory storage for analyses
analyses_storage: dict[str, dict[str, Any]] = {}

# Demo analysis template
def generate_demo_analysis(case_id: str, case_data: dict[str, Any]) -> dict[str, Any]:
    """Generate a demo analysis for a case"""
    return {
        "case_id": case_id,
        "case_number": case_data.get("case_number", "Unknown"),
        "analysis_date": datetime.now(UTC).isoformat(),
        "status": "completed",
        "risk_assessment": {
            "risk_score": 45,
            "risk_level": "Medium Risk",
            "recommendation": "Proceed with caution. Strong evidence required for key claims.",
        },
        "evidence_analysis": {
            "total_documents": 5,
            "document_types": {
                "contracts": 2,
                "correspondence": 2,
                "evidence": 1,
            },
            "evidence_strength": "Good",
            "key_evidence": [
                {
                    "document": "Contract_Smith_2025.pdf",
                    "type": "Contract",
                    "relevance": "High",
                    "key_points": {
                        "parties": ["John Smith", "Johnson Construction"],
                        "date": "2025-01-15",
                        "value": "£125,000",
                    },
                },
                {
                    "document": "Email_Correspondence_Breach.pdf",
                    "type": "Correspondence",
                    "relevance": "High",
                    "key_points": {
                        "breach_acknowledged": True,
                        "delay_admitted": "3 months",
                    },
                },
            ],
            "missing_evidence": [
                "Proof of damages",
                "Expert witness report",
            ],
        },
        "legal_issues": [
            {
                "issue_type": "Breach of Contract",
                "description": "Failure to complete construction work within agreed timeframe",
                "severity": "high",
                "applicable_laws": [
                    "Consumer Rights Act 2015",
                    "Supply of Goods and Services Act 1982",
                ],
                "evidence_refs": ["Contract_Smith_2025.pdf", "Email_Correspondence_Breach.pdf"],
                "remedies": [
                    "Damages for breach",
                    "Specific performance",
                    "Termination of contract",
                ],
                "time_limits": "6 years from breach date",
            },
            {
                "issue_type": "Negligent Workmanship",
                "description": "Substandard quality of work performed",
                "severity": "medium",
                "applicable_laws": [
                    "Defective Premises Act 1972",
                    "Building Regulations 2010",
                ],
                "evidence_refs": ["Site_Inspection_Report.pdf"],
                "remedies": [
                    "Cost of remedial work",
                    "Diminution in value",
                ],
                "time_limits": "6 years from discovery",
            },
        ],
        "legal_framework": {
            "statutes": [
                {
                    "act_name": "Consumer Rights Act",
                    "year": "2015",
                    "section": "49",
                    "description": "Right to services performed with reasonable care and skill",
                },
                {
                    "act_name": "Limitation Act",
                    "year": "1980",
                    "section": "5",
                    "description": "Time limit for bringing contract claims",
                },
            ],
            "case_law": [
                {
                    "case_name": "Hadley v Baxendale",
                    "citation": "[1854] EWHC J70",
                    "principle": "Remoteness of damages in contract",
                },
                {
                    "case_name": "Robinson v Harman",
                    "citation": "(1848) 1 Ex Rep 850",
                    "principle": "Expectation loss principle",
                },
            ],
        },
        "violations": [
            {
                "type": "Contractual Breach",
                "severity": "high",
                "description": "Failed to complete work by agreed deadline",
                "laws_breached": ["Contract terms clause 5.2"],
                "remedies_available": ["Damages", "Contract termination"],
            },
        ],
        "recommendations": {
            "immediate_actions": [
                {
                    "action": "Send formal letter before action",
                    "deadline": (datetime.now() + timedelta(days=7)).isoformat(),
                    "priority": "URGENT",
                },
                {
                    "action": "Obtain independent surveyor report",
                    "deadline": (datetime.now() + timedelta(days=14)).isoformat(),
                    "priority": "High",
                },
            ],
            "legal_strategy": [
                "Attempt negotiation with clear settlement parameters",
                "Prepare for County Court proceedings if negotiation fails",
                "Consider mediation as cost-effective alternative",
                "Gather additional evidence on financial losses",
            ],
            "timeline": [
                {"week": 1, "action": "Letter before action", "responsible": "Solicitor"},
                {"week": 2, "action": "Response deadline", "responsible": "Defendant"},
                {"week": 3, "action": "Pre-action meeting", "responsible": "Both parties"},
                {"week": 4, "action": "File claim if unresolved", "responsible": "Solicitor"},
            ],
        },
        "next_steps": [
            {
                "action": "Draft and send letter before action",
                "deadline": (datetime.now() + timedelta(days=7)).isoformat(),
                "priority": "URGENT",
                "days_remaining": 7,
            },
            {
                "action": "Commission expert surveyor report",
                "deadline": (datetime.now() + timedelta(days=14)).isoformat(),
                "priority": "High",
                "days_remaining": 14,
            },
            {
                "action": "Calculate full extent of damages",
                "deadline": (datetime.now() + timedelta(days=21)).isoformat(),
                "priority": "Medium",
                "days_remaining": 21,
            },
        ],
        "compliance_status": {
            "sra_compliance": True,
            "client_care_letter": True,
            "conflict_check": True,
            "money_laundering_check": True,
            "data_protection": True,
        },
    }


async def perform_ai_analysis(case_id: str, case_data: dict[str, Any]) -> None:
    """Perform AI analysis in the background"""
    # Mark as processing
    analyses_storage[case_id] = {
        "case_id": case_id,
        "status": "processing",
        "started_at": datetime.now(UTC).isoformat(),
    }

    # Simulate processing time
    await asyncio.sleep(5)

    try:
        # Try to use AI service
        # ai_service = AIService()  # Unused variable
        # prompt = f"""
        # Analyze the following case for legal issues:
        # Case Number: {case_data.get('case_number')}
        # Title: {case_data.get('title')}
        # Description: {case_data.get('description')}
        # Case Type: {case_data.get('case_type')}
        #
        # Provide:
        # 1. Risk assessment
        # 2. Key legal issues
        # 3. Applicable UK laws
        # 4. Recommended next steps
        # """

        # For now, just use demo data
        # In production, this would process the AI response
        analysis = generate_demo_analysis(case_id, case_data)

    except Exception:
        # If AI fails, use demo analysis
        analysis = generate_demo_analysis(case_id, case_data)

    # Store completed analysis
    analyses_storage[case_id] = analysis


@router.post("/analyze/{case_id}")
async def start_analysis(
    case_id: str,
    background_tasks: BackgroundTasks,
) -> dict[str, Any]:
    """Start AI analysis for a case"""

    # Check if analysis already exists
    if case_id in analyses_storage and analyses_storage[case_id].get("status") == "completed":
        return {"message": "Analysis already exists", "status": "completed"}

    # Get case data (in real app, fetch from database)
    # For demo, use mock data
    case_data = {
        "case_number": "2025-001",
        "title": "Smith vs. Johnson Contract Dispute",
        "description": "Contract dispute regarding construction delays",
        "case_type": "Contract Law",
    }

    # Start background analysis
    background_tasks.add_task(perform_ai_analysis, case_id, case_data)

    return {
        "message": "Analysis started",
        "status": "processing",
        "case_id": case_id,
    }


@router.get("/analysis/{case_id}", response_model=dict[str, Any])
async def get_analysis(case_id: str) -> dict[str, Any]:
    """Get analysis results for a case"""

    # Check if analysis exists
    if case_id not in analyses_storage:
        # Return pending status
        return {
            "case_id": case_id,
            "status": "pending",
            "message": "No analysis found. Start analysis first.",
        }

    return analyses_storage[case_id]


@router.delete("/analysis/{case_id}")
async def delete_analysis(case_id: str) -> dict[str, str]:
    """Delete analysis for a case"""

    if case_id not in analyses_storage:
        raise HTTPException(status_code=404, detail="Analysis not found")

    del analyses_storage[case_id]

    return {"message": "Analysis deleted successfully"}


@router.get("/analyses", response_model=dict[str, Any])
async def list_analyses() -> dict[str, Any]:
    """List all available analyses"""

    analyses: list[dict[str, Any]] = []
    for case_id, analysis in analyses_storage.items():
        analyses.append({
            "case_id": case_id,
            "case_number": analysis.get("case_number", "Unknown"),
            "status": analysis.get("status", "unknown"),
            "analysis_date": analysis.get("analysis_date"),
            "risk_level": analysis.get("risk_assessment", {}).get("risk_level", "Unknown"),
        })

    return {
        "total": len(analyses),
        "analyses": analyses,
    }
