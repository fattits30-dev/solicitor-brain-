#!/usr/bin/env python3
"""
Seed data script for Solicitor Brain
Creates sample data files for testing
"""

import json
import os
import random
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import uuid4

# Sample data directory
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "sample_data")


def create_sample_cases() -> list[dict[str, Any]]:
    """Create sample cases"""

    sample_cases: list[dict[str, Any]] = [
        {
            "id": str(uuid4()),
            "title": "Smith v. Johnson Property Dispute",
            "caseNumber": f"CV-2025-{random.randint(1000, 9999)}",
            "clientName": "John Smith",
            "caseType": "civil",
            "status": "active",
            "priority": "high",
            "description": "Property boundary dispute between neighbors regarding fence placement",
            "nextHearing": (datetime.now(UTC) + timedelta(days=30)).isoformat(),
            "createdAt": (datetime.now(UTC) - timedelta(days=60)).isoformat(),
            "updatedAt": (datetime.now(UTC) - timedelta(days=5)).isoformat(),
        },
        {
            "id": str(uuid4()),
            "title": "R v. Williams (Theft)",
            "caseNumber": f"CR-2025-{random.randint(1000, 9999)}",
            "clientName": "David Williams",
            "caseType": "criminal",
            "status": "active",
            "priority": "urgent",
            "description": "Alleged theft from retail store, client maintains innocence",
            "nextHearing": (datetime.now(UTC) + timedelta(days=7)).isoformat(),
            "createdAt": (datetime.now(UTC) - timedelta(days=30)).isoformat(),
            "updatedAt": (datetime.now(UTC) - timedelta(days=1)).isoformat(),
        },
        {
            "id": str(uuid4()),
            "title": "Brown Divorce Proceedings",
            "caseNumber": f"FM-2025-{random.randint(1000, 9999)}",
            "clientName": "Sarah Brown",
            "caseType": "family",
            "status": "pending",
            "priority": "medium",
            "description": "Divorce proceedings with child custody arrangements",
            "nextHearing": (datetime.now(UTC) + timedelta(days=14)).isoformat(),
            "createdAt": (datetime.now(UTC) - timedelta(days=90)).isoformat(),
            "updatedAt": (datetime.now(UTC) - timedelta(days=3)).isoformat(),
        },
        {
            "id": str(uuid4()),
            "title": "TechCorp Ltd Contract Review",
            "caseNumber": f"CO-2025-{random.randint(1000, 9999)}",
            "clientName": "TechCorp Ltd",
            "caseType": "corporate",
            "status": "active",
            "priority": "medium",
            "description": "Review and negotiation of software licensing agreement",
            "nextHearing": None,
            "createdAt": (datetime.now(UTC) - timedelta(days=15)).isoformat(),
            "updatedAt": (datetime.now(UTC) - timedelta(days=2)).isoformat(),
        },
        {
            "id": str(uuid4()),
            "title": "Estate of Margaret Thompson",
            "caseNumber": f"PR-2025-{random.randint(1000, 9999)}",
            "clientName": "Thompson Family",
            "caseType": "other",
            "status": "active",
            "priority": "low",
            "description": "Probate and estate administration",
            "nextHearing": (datetime.now(UTC) + timedelta(days=45)).isoformat(),
            "createdAt": (datetime.now(UTC) - timedelta(days=45)).isoformat(),
            "updatedAt": (datetime.now(UTC) - timedelta(days=10)).isoformat(),
        },
    ]

    return sample_cases


def create_sample_documents(cases: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Create sample documents"""

    document_types = {
        "contract": ["PDF", "DOCX"],
        "court_filing": ["PDF"],
        "correspondence": ["PDF", "DOCX", "MSG"],
        "evidence": ["PDF", "JPG", "PNG"],
        "general": ["PDF", "DOCX", "XLSX"]
    }

    doc_names = {
        "contract": ["Service Agreement", "Terms and Conditions", "NDA", "License Agreement"],
        "court_filing": ["Motion to Dismiss", "Complaint", "Answer", "Court Order"],
        "correspondence": ["Client Letter", "Opposing Counsel Email", "Court Notice"],
        "evidence": ["Exhibit A", "Photo Evidence", "Document Scan", "Screenshot"],
        "general": ["Meeting Notes", "Case Summary", "Research Notes", "Timeline"]
    }

    sample_documents: list[dict[str, Any]] = []

    for case in cases:
        # Create 3-5 documents per case
        num_docs = random.randint(3, 5)

        for _ in range(num_docs):
            doc_category = random.choice(list(document_types.keys()))
            doc_type = random.choice(document_types[doc_category])
            doc_name = f"{random.choice(doc_names[doc_category])} - {case['caseNumber']}.{doc_type.lower()}"

            document = {
                "id": str(uuid4()),
                "name": doc_name,
                "type": doc_type,
                "size": random.randint(100_000, 5_000_000),  # 100KB to 5MB
                "category": doc_category,
                "folder": doc_category,
                "caseId": case["id"],
                "uploadedBy": "System",
                "uploadedAt": (datetime.now(UTC) - timedelta(days=random.randint(0, 30))).isoformat(),
                "lastModified": (datetime.now(UTC) - timedelta(days=random.randint(0, 7))).isoformat(),
                "tags": [doc_category],
                "status": "ready"
            }

            sample_documents.append(document)

    return sample_documents


def create_sample_emails(cases: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Create sample emails"""

    email_domains = ["@lawfirm.co.uk", "@client.com", "@opposingcounsel.com", "@court.gov.uk"]
    folders = ["inbox", "sent", "drafts", "trash", "archive"]

    sample_emails: list[dict[str, Any]] = []
    folder_counts = {folder: {"count": 0, "unread": 0} for folder in folders}

    for case in cases:
        # Create 2-4 emails per case
        num_emails = random.randint(2, 4)

        for _ in range(num_emails):
            folder = random.choice(["inbox", "sent", "drafts"])
            is_read = random.choice([True, False]) if folder != "sent" else True

            email = {
                "id": str(uuid4()),
                "folder": folder,
                "from": f"{case['clientName'].lower().replace(' ', '.')}{random.choice(email_domains)}",
                "to": ["solicitor@lawfirm.co.uk"],
                "subject": f"Re: {case['title']} - Update",
                "body": f"Dear Solicitor,\n\nI wanted to update you on the {case['title']} matter.\n\nPlease let me know if you need any additional information.\n\nBest regards,\n{case['clientName']}",
                "date": (datetime.now(UTC) - timedelta(days=random.randint(0, 14))).isoformat(),
                "is_read": is_read,
                "is_flagged": random.choice([True, False, False]),  # Less likely to be flagged
                "has_attachments": random.choice([True, False]),
                "attachments": ["document.pdf"] if random.choice([True, False]) else [],
                "case_id": case["id"],
                "tags": [case["caseType"]]
            }

            sample_emails.append(email)
            folder_counts[folder]["count"] += 1
            if not is_read:
                folder_counts[folder]["unread"] += 1

    # Create folder data
    folders_data = [
        {"name": folder, "count": data["count"], "unread": data["unread"]}
        for folder, data in folder_counts.items()
    ]

    return sample_emails, folders_data


def create_sample_metrics(cases: list[dict[str, Any]], documents: list[dict[str, Any]], _emails: list[dict[str, Any]]) -> dict[str, Any]:  # Emails for future use
    """Create dashboard metrics"""

    active_cases = len([c for c in cases if c["status"] == "active"])
    pending_deadlines = len([c for c in cases if c.get("nextHearing")])

    return {
        "total_cases": len(cases),
        "active_cases": active_cases,
        "pending_deadlines": pending_deadlines,
        "documents_processed": len(documents),
        "ai_tasks_completed": random.randint(50, 200),
        "client_satisfaction": random.randint(85, 98),
        "generated_at": datetime.now(UTC).isoformat()
    }



def main():
    """Main function to create seed data"""

    # Create sample data directory
    os.makedirs(DATA_DIR, exist_ok=True)

    try:
        # Generate sample data
        cases = create_sample_cases()
        documents = create_sample_documents(cases)
        emails, folders = create_sample_emails(cases)
        metrics = create_sample_metrics(cases, documents, emails)

        # Save to JSON files

        with open(os.path.join(DATA_DIR, "cases.json"), "w") as f:
            json.dump(cases, f, indent=2)

        with open(os.path.join(DATA_DIR, "documents.json"), "w") as f:
            json.dump(documents, f, indent=2)

        with open(os.path.join(DATA_DIR, "emails.json"), "w") as f:
            json.dump({"emails": emails, "folders": folders}, f, indent=2)

        with open(os.path.join(DATA_DIR, "metrics.json"), "w") as f:
            json.dump(metrics, f, indent=2)

        # Summary

    except Exception:
        raise


if __name__ == "__main__":
    main()
