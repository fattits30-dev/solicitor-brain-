from typing import Optional, Dict, Any
from datetime import timedelta

# Authentication disabled - always return default user


class AuthService:
    """Disabled auth service - always returns default user"""
    
    @staticmethod
    def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        return "no-auth-token"
    
    @staticmethod
    def decode_token(token: str) -> Dict[str, Any]:
        return get_default_user()


async def get_current_user() -> Dict[str, Any]:
    """Always return default user - no authentication"""
    return get_default_user()


def get_default_user() -> Dict[str, Any]:
    """Get default user for no-auth mode"""
    return {
        "id": "default-user",
        "email": "user@localhost", 
        "name": "Default User",
        "role": "solicitor"
    }