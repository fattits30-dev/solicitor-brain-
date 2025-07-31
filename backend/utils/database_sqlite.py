"""
SQLite Database Configuration for Standalone App
"""
import os
from pathlib import Path
from typing import Any

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Get app data directory
if os.environ.get('ELECTRON_APP_DATA'):
    # Running in Electron
    app_data_dir = Path(os.environ['ELECTRON_APP_DATA'])
else:
    # Running standalone
    app_data_dir = Path.home() / '.solicitor-brain'

APP_DATA_DIR = app_data_dir

# Create app data directory
APP_DATA_DIR.mkdir(exist_ok=True)
DB_DIR = APP_DATA_DIR / 'data'
DB_DIR.mkdir(exist_ok=True)

# SQLite database path
DATABASE_URL = f"sqlite:///{DB_DIR / 'solicitor_brain.db'}"

# Create engine with proper settings for SQLite
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Needed for SQLite
    poolclass=StaticPool,  # Better for desktop apps
    echo=False
)

# Enable foreign keys for SQLite
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection: Any, connection_record: Any) -> None:
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.execute("PRAGMA journal_mode=WAL")  # Better performance
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

async def init_db() -> None:
    """Initialize database tables"""
    # TODO: Import models here once they are implemented
    # import backend.models

    # SQLite doesn't need async, but we maintain the same interface
    Base.metadata.create_all(bind=engine)

def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# File storage paths
UPLOAD_DIR = APP_DATA_DIR / 'uploads'
UPLOAD_DIR.mkdir(exist_ok=True)

DOCUMENTS_DIR = UPLOAD_DIR / 'documents'
DOCUMENTS_DIR.mkdir(exist_ok=True)

TEMPLATES_DIR = APP_DATA_DIR / 'templates'
TEMPLATES_DIR.mkdir(exist_ok=True)

# Export paths for use in other modules
__all__ = [
    'engine',
    'SessionLocal',
    'Base',
    'get_db',
    'init_db',
    'APP_DATA_DIR',
    'UPLOAD_DIR',
    'DOCUMENTS_DIR',
    'TEMPLATES_DIR'
]
