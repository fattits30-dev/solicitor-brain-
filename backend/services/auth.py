from datetime import timedelta
from typing import Any

# Authentication disabled - always return default user


class AuthService:
    """Disabled auth service - always returns default user"""

    @staticmethod
    def create_access_token(_data: dict[str, Any], _expires_delta: timedelta | None = None) -> str:  # For future use
        return "no-auth-token"

    @staticmethod
    def decode_token(_token: str) -> dict[str, Any]:  # For future use
        return get_default_user()


async def get_current_user() -> dict[str, Any]:
    """Always return default user - no authentication"""
    return get_default_user()


def get_default_user() -> dict[str, Any]:
    """Get default user for no-auth mode"""
    return {
        "id": "default-user",
        "email": "user@localhost",
        "name": "Default User",
        "role": "solicitor",
    }
