#!/usr/bin/env python
"""Initialize database with all tables"""
import asyncio
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

import logging

# Import all models to ensure they're registered with SQLAlchemy
# These imports are necessary for SQLAlchemy to register the models
import backend.models.case  # noqa: F401  # type: ignore[import]
import backend.models.case_facts  # noqa: F401  # type: ignore[import]
import backend.models.document  # noqa: F401  # type: ignore[import]
import backend.models.folder  # noqa: F401  # type: ignore[import]
import backend.models.user  # noqa: F401  # type: ignore[import]
from backend.utils.database import Base, engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def init_database():
    """Initialize database with all tables"""
    try:
        logger.info("Creating database tables...")

        # Create all tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        logger.info("Database tables created successfully!")

        # Note: The application now uses in-memory demo data
        # instead of seeding the database
        logger.info("Database initialization complete!")
        logger.info("Demo data will be loaded in-memory when the application starts.")

    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(init_database())
