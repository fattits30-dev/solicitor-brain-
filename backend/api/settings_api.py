import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException

router = APIRouter()

# Settings file path
SETTINGS_FILE = Path("settings.json")

# Default settings
DEFAULT_SETTINGS = {
    "profile": {
        "full_name": "John Solicitor",
        "email": "john@solicitor.co.uk",
        "role": "Senior Partner",
        "firm": "Solicitor & Associates",
    },
    "notifications": {
        "email_new_cases": True,
        "desktop_deadlines": True,
        "weekly_reports": False,
        "client_alerts": True,
        "maintenance_notices": False,
    },
    "security": {
        "two_factor_enabled": False,
        "session_timeout": 30,
        "password_expiry_days": 90,
    },
    "database": {
        "backup_enabled": True,
        "backup_frequency": "daily",
        "retention_days": 30,
    },
    "ai": {
        "model": "mixtral:8x7b-instruct-v0.1-q4_0",
        "temperature": 0.1,
        "max_response_length": 1024,
        "citation_required": True,
        "ollama_host": "http://localhost:11434",
    },
    "email": {
        "email_address": "solicitor@lawfirm.com",
        "smtp_server": "smtp.gmail.com",
        "smtp_port": 587,
        "imap_server": "imap.gmail.com",
        "imap_port": 993,
        "sync_enabled": False,
        "sync_interval": 300,
        "last_sync": None,
    },
}


def load_settings() -> dict[str, Any]:
    """Load settings from file or return defaults"""
    if SETTINGS_FILE.exists():
        try:
            with open(SETTINGS_FILE) as f:
                return json.load(f)
        except Exception:
            pass
    return DEFAULT_SETTINGS.copy()


def save_settings(settings: dict[str, Any]) -> None:
    """Save settings to file"""
    try:
        with open(SETTINGS_FILE, "w") as f:
            json.dump(settings, f, indent=2)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save settings: {str(e)}")


@router.get("/", response_model=dict[str, Any])
async def get_settings() -> dict[str, Any]:
    """Get all settings"""
    return load_settings()


@router.get("/{category}", response_model=dict[str, Any])
async def get_settings_category(category: str) -> dict[str, Any]:
    """Get settings for a specific category"""
    settings = load_settings()

    if category not in settings:
        raise HTTPException(status_code=404, detail=f"Settings category '{category}' not found")

    return {category: settings[category]}


@router.put("/{category}", response_model=dict[str, Any])
async def update_settings_category(
    category: str,
    updates: dict[str, Any]
) -> dict[str, Any]:
    """Update settings for a specific category"""
    settings = load_settings()

    if category not in settings:
        raise HTTPException(status_code=404, detail=f"Settings category '{category}' not found")

    # Update category settings
    settings[category].update(updates)

    # Save settings
    save_settings(settings)

    return {
        "message": f"Settings for '{category}' updated successfully",
        "updated_at": datetime.now(UTC).isoformat(),
        category: settings[category],
    }


@router.post("/reset", response_model=dict[str, Any])
async def reset_settings() -> dict[str, Any]:
    """Reset all settings to defaults"""
    save_settings(DEFAULT_SETTINGS)

    return {
        "message": "Settings reset to defaults",
        "reset_at": datetime.now(UTC).isoformat(),
    }


@router.post("/backup", response_model=dict[str, Any])
async def backup_settings() -> dict[str, Any]:
    """Create a backup of current settings"""
    settings = load_settings()
    backup_file = Path(f"settings_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")

    try:
        with open(backup_file, "w") as f:
            json.dump(settings, f, indent=2)

        return {
            "message": "Settings backed up successfully",
            "backup_file": str(backup_file),
            "backed_up_at": datetime.now(UTC).isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to backup settings: {str(e)}")


@router.get("/ai/models", response_model=dict[str, Any])
async def get_available_models() -> dict[str, Any]:
    """Get available AI models"""
    # This would normally query Ollama for available models
    return {
        "models": [
            {"name": "mixtral:8x7b-instruct-v0.1-q4_0", "size": "26GB", "recommended": True},
            {"name": "llama2:13b", "size": "13GB", "recommended": False},
            {"name": "codellama:7b", "size": "7GB", "recommended": False},
        ],
        "current_model": load_settings()["ai"]["model"],
    }
