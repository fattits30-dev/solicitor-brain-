import asyncio
import json
import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, EmailStr

router = APIRouter()

# In-memory storage for demo
emails_storage: dict[str, dict[str, Any]] = {}
email_folders = ["inbox", "sent", "drafts", "trash", "archive"]

# Email settings file
EMAIL_SETTINGS_FILE = Path("email_settings.json")
DEFAULT_EMAIL_SETTINGS = {
    "smtp_server": "smtp.gmail.com",
    "smtp_port": 587,
    "imap_server": "imap.gmail.com",
    "imap_port": 993,
    "email_address": "solicitor@lawfirm.com",
    "sync_enabled": False,
    "sync_interval": 300,  # 5 minutes
    "last_sync": None,
}


class EmailSettings(BaseModel):
    smtp_server: str
    smtp_port: int
    imap_server: str
    imap_port: int
    email_address: EmailStr
    sync_enabled: bool
    sync_interval: int
    last_sync: str | None = None


class EmailCreate(BaseModel):
    to: list[EmailStr]
    cc: list[EmailStr] | None = []
    bcc: list[EmailStr] | None = []
    subject: str
    body: str
    case_id: str | None = None
    is_draft: bool = False


class EmailUpdate(BaseModel):
    folder: str | None = None
    is_read: bool | None = None
    is_flagged: bool | None = None
    tags: list[str] | None = None


def load_email_settings() -> dict[str, Any]:
    """Load email settings from file"""
    if EMAIL_SETTINGS_FILE.exists():
        with open(EMAIL_SETTINGS_FILE) as f:
            return json.load(f)
    return DEFAULT_EMAIL_SETTINGS.copy()


def save_email_settings(settings: dict[str, Any]) -> None:
    """Save email settings to file"""
    with open(EMAIL_SETTINGS_FILE, 'w') as f:
        json.dump(settings, f, indent=2)


# Initialize with demo emails
def init_demo_emails():
    """Initialize demo emails if storage is empty"""
    if not emails_storage:
        demo_emails = [
            {
                "id": str(uuid.uuid4()),
                "folder": "inbox",
                "from": "client@example.com",
                "to": ["solicitor@lawfirm.com"],
                "subject": "Re: Contract Review - Smith Holdings Ltd",
                "body": "Dear Solicitor,\n\nI've reviewed the amendments you suggested. Could we schedule a call to discuss sections 4.2 and 7.1? I have some concerns about the liability clauses.\n\nBest regards,\nJohn Smith",
                "date": "2024-01-30T10:30:00Z",
                "is_read": True,
                "is_flagged": True,
                "has_attachments": True,
                "attachments": ["Contract_v2_tracked_changes.docx"],
                "case_id": "32e89899-6d15-4846-bb31-b5d04cf5866a",
                "tags": ["urgent", "contract-review"],
            },
            {
                "id": str(uuid.uuid4()),
                "folder": "inbox",
                "from": "court@justice.gov.uk",
                "to": ["solicitor@lawfirm.com"],
                "subject": "Court Date Confirmation - Case #2024-HC-0142",
                "body": "This email confirms the hearing date for Case #2024-HC-0142:\n\nDate: 15th February 2024\nTime: 10:00 AM\nCourt: High Court, London\nJudge: Hon. Justice Thompson\n\nPlease ensure all documents are filed by 8th February 2024.",
                "date": "2024-01-29T14:15:00Z",
                "is_read": True,
                "is_flagged": False,
                "has_attachments": False,
                "attachments": [],
                "case_id": None,
                "tags": ["court", "deadline"],
            },
            {
                "id": str(uuid.uuid4()),
                "folder": "inbox",
                "from": "newclient@business.com",
                "to": ["solicitor@lawfirm.com"],
                "subject": "Legal Representation Inquiry - Employment Dispute",
                "body": "Hello,\n\nI was referred to your firm by a colleague. I'm facing an employment dispute with my former employer regarding wrongful termination. Could we arrange an initial consultation?\n\nThank you,\nSarah Johnson",
                "date": "2024-01-30T08:45:00Z",
                "is_read": False,
                "is_flagged": False,
                "has_attachments": False,
                "attachments": [],
                "case_id": None,
                "tags": ["new-client", "employment"],
            },
            {
                "id": str(uuid.uuid4()),
                "folder": "sent",
                "from": "solicitor@lawfirm.com",
                "to": ["client@example.com"],
                "subject": "Re: Contract Review - Smith Holdings Ltd",
                "body": "Dear John,\n\nThank you for your email. I'm available for a call tomorrow at 2 PM or Thursday at 10 AM. Please let me know which works better for you.\n\nRegarding sections 4.2 and 7.1, I understand your concerns and have some alternative proposals we can discuss.\n\nBest regards,\nSolicitor",
                "date": "2024-01-30T11:00:00Z",
                "is_read": True,
                "is_flagged": False,
                "has_attachments": False,
                "attachments": [],
                "case_id": "32e89899-6d15-4846-bb31-b5d04cf5866a",
                "tags": ["contract-review"],
            },
            {
                "id": str(uuid.uuid4()),
                "folder": "drafts",
                "from": "solicitor@lawfirm.com",
                "to": ["opposing.counsel@lawfirm2.com"],
                "subject": "Settlement Proposal - Johnson v. ABC Corp",
                "body": "Dear Counsel,\n\nFollowing our recent discussions, I am writing to propose the following settlement terms:\n\n1. [TO BE COMPLETED]\n2. [TO BE COMPLETED]\n\nI look forward to your response.\n\nRegards,",
                "date": "2024-01-30T09:00:00Z",
                "is_read": True,
                "is_flagged": True,
                "has_attachments": False,
                "attachments": [],
                "case_id": None,
                "tags": ["settlement", "draft"],
            },
        ]

        for email in demo_emails:
            email_id = str(email["id"])
            emails_storage[email_id] = email


# Initialize demo emails on startup
init_demo_emails()


@router.get("/settings", response_model=EmailSettings)
async def get_email_settings():
    """Get email configuration settings"""
    settings = load_email_settings()
    return EmailSettings(**settings)


@router.put("/settings")
async def update_email_settings(settings: EmailSettings):
    """Update email configuration settings"""
    settings_dict = settings.model_dump()
    settings_dict["last_sync"] = datetime.now(UTC).isoformat() if settings.sync_enabled else None
    save_email_settings(settings_dict)

    return {
        "message": "Email settings updated successfully",
        "settings": settings_dict,
    }


@router.get("/folders")
async def get_email_folders():
    """Get list of email folders with counts"""
    folder_counts = dict.fromkeys(email_folders, 0)

    for email in emails_storage.values():
        folder = email.get("folder", "inbox")
        if folder in folder_counts:
            folder_counts[folder] += 1

    return {
        "folders": [
            {
                "name": folder,
                "count": count,
                "unread": sum(1 for e in emails_storage.values()
                            if e.get("folder") == folder and not e.get("is_read", True))
            }
            for folder, count in folder_counts.items()
        ]
    }


@router.get("/")
async def list_emails(
    folder: str = "inbox",
    is_read: bool | None = None,
    is_flagged: bool | None = None,
    case_id: str | None = None,
    search: str | None = None,
    limit: int = 50,
    offset: int = 0,
):
    """List emails with filtering options"""
    # Filter emails
    filtered_emails: list[dict[str, Any]] = []

    for email in emails_storage.values():
        # Folder filter
        if email.get("folder") != folder:
            continue

        # Read status filter
        if is_read is not None and email.get("is_read", True) != is_read:
            continue

        # Flagged filter
        if is_flagged is not None and email.get("is_flagged", False) != is_flagged:
            continue

        # Case ID filter
        if case_id is not None and email.get("case_id") != case_id:
            continue

        # Search filter
        if search:
            search_lower = search.lower()
            if not any(
                search_lower in str(email.get(field, "")).lower()
                for field in ["subject", "body", "from", "to"]
            ):
                continue

        filtered_emails.append(email)

    # Sort by date (newest first)
    filtered_emails.sort(key=lambda e: str(e.get("date", "")), reverse=True)

    # Pagination
    total = len(filtered_emails)
    emails: list[dict[str, Any]] = filtered_emails[offset:offset + limit]

    return {
        "emails": emails,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/{email_id}")
async def get_email(email_id: str):
    """Get email by ID"""
    if email_id not in emails_storage:
        raise HTTPException(status_code=404, detail="Email not found")

    email = emails_storage[email_id]

    # Mark as read
    email["is_read"] = True

    return email


@router.post("/", status_code=201)
async def create_email(email_data: EmailCreate, background_tasks: BackgroundTasks):
    """Create a new email (send or save as draft)"""
    email_id = str(uuid.uuid4())

    email = {
        "id": email_id,
        "folder": "drafts" if email_data.is_draft else "sent",
        "from": load_email_settings()["email_address"],
        "to": email_data.to,
        "cc": email_data.cc or [],
        "bcc": email_data.bcc or [],
        "subject": email_data.subject,
        "body": email_data.body,
        "date": datetime.now(UTC).isoformat(),
        "is_read": True,
        "is_flagged": False,
        "has_attachments": False,
        "attachments": [],
        "case_id": email_data.case_id,
        "tags": [],
    }

    emails_storage[email_id] = email

    if not email_data.is_draft:
        # Simulate sending email in background
        background_tasks.add_task(simulate_send_email, email)

    return {
        "message": "Email saved as draft" if email_data.is_draft else "Email sent successfully",
        "email": email,
    }


@router.patch("/{email_id}")
async def update_email(email_id: str, update_data: EmailUpdate):
    """Update email properties"""
    if email_id not in emails_storage:
        raise HTTPException(status_code=404, detail="Email not found")

    email = emails_storage[email_id]

    if update_data.folder is not None:
        if update_data.folder not in email_folders:
            raise HTTPException(status_code=400, detail="Invalid folder")
        email["folder"] = update_data.folder

    if update_data.is_read is not None:
        email["is_read"] = update_data.is_read

    if update_data.is_flagged is not None:
        email["is_flagged"] = update_data.is_flagged

    if update_data.tags is not None:
        email["tags"] = update_data.tags

    return {
        "message": "Email updated successfully",
        "email": email,
    }


@router.delete("/{email_id}")
async def delete_email(email_id: str):
    """Move email to trash or permanently delete"""
    if email_id not in emails_storage:
        raise HTTPException(status_code=404, detail="Email not found")

    email = emails_storage[email_id]

    if email.get("folder") == "trash":
        # Permanently delete
        del emails_storage[email_id]
        return {"message": "Email permanently deleted"}
    # Move to trash
    email["folder"] = "trash"
    return {"message": "Email moved to trash"}


@router.post("/sync")
async def sync_emails(background_tasks: BackgroundTasks):
    """Manually trigger email synchronization"""
    settings = load_email_settings()

    if not settings.get("sync_enabled"):
        raise HTTPException(status_code=400, detail="Email sync is disabled")

    # Simulate email sync in background
    background_tasks.add_task(simulate_email_sync)

    return {
        "message": "Email synchronization started",
        "last_sync": settings.get("last_sync"),
    }


async def simulate_send_email(email: dict[str, Any]):
    """Simulate sending an email (for demo purposes)"""
    # In a real implementation, this would use SMTP
    await asyncio.sleep(1)  # Simulate network delay


async def simulate_email_sync():
    """Simulate email synchronization (for demo purposes)"""
    # In a real implementation, this would use IMAP
    await asyncio.sleep(2)  # Simulate sync delay

    # Update last sync time
    settings = load_email_settings()
    settings["last_sync"] = datetime.now(UTC).isoformat()
    save_email_settings(settings)

