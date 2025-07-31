#!/usr/bin/env python
"""Quick database initialization"""
import asyncio
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

import logging

from backend.utils.database import Base, engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def init_database():
    """Initialize database with all tables"""
    try:
        logger.info("Creating database tables...")

        # Import all models to ensure they're registered

        # Create all tables
        async with engine.begin() as conn:
            # Just create tables, don't drop
            await conn.run_sync(Base.metadata.create_all)

        logger.info("Database tables created successfully!")

    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(init_database())
