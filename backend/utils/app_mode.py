"""
Application Mode Detection

Detects whether the app is running as:
- Electron desktop app (standalone)
- Development mode (separate frontend/backend)
- Docker container
"""
import os


def is_electron() -> bool:
    """Check if running inside Electron"""
    return bool(os.environ.get('ELECTRON_APP_DATA'))


def is_docker() -> bool:
    """Check if running inside Docker"""
    return os.path.exists('/.dockerenv')


def is_development() -> bool:
    """Check if running in development mode"""
    return os.environ.get('NODE_ENV') == 'development' or os.environ.get('DEV_MODE') == 'true'


def get_database_module():
    """Get the appropriate database module based on environment"""
    if is_electron() or os.environ.get('USE_SQLITE') == 'true':
        from backend.utils import database_sqlite as db_module
    else:
        from backend.utils import database as db_module

    return db_module


# Usage in other files:
# from backend.utils.app_mode import get_database_module
# db = get_database_module()
# engine = db.engine
# SessionLocal = db.SessionLocal
# etc.
