"""
Database context managers for Solicitor Brain
Provides async context managers for database operations
"""

import logging
from collections.abc import AsyncGenerator, Awaitable, Callable
from contextlib import asynccontextmanager
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool

from backend.config import settings

logger = logging.getLogger(__name__)


class DatabaseSessionManager:
    """Manages database sessions with proper lifecycle"""

    def __init__(self, database_url: str | None = None):
        self.database_url = database_url or settings.database_url
        self._engine: AsyncEngine | None = None
        self._sessionmaker: async_sessionmaker[AsyncSession] | None = None

    async def __aenter__(self):
        """Initialize database engine and session factory"""
        self._engine = create_async_engine(
            self.database_url,
            echo=settings.debug,
            pool_pre_ping=True,
            pool_size=settings.db_pool_size,
            max_overflow=settings.db_max_overflow,
            pool_recycle=3600,  # Recycle connections after 1 hour
        )

        self._sessionmaker = async_sessionmaker(
            bind=self._engine, expire_on_commit=False, autoflush=False, autocommit=False
        )

        logger.info("Database session manager initialized")
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: Any | None,
    ) -> None:  # noqa: ARG002
        """Cleanup database connections"""
        if self._engine:
            await self._engine.dispose()
            logger.info("Database connections closed")

    @asynccontextmanager
    async def session(self) -> AsyncGenerator[AsyncSession, None]:
        """Get a database session with automatic transaction management"""
        if not self._sessionmaker:
            raise RuntimeError("Database manager not initialized. Use 'async with' context.")

        async with self._sessionmaker() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()

    @asynccontextmanager
    async def transaction(self) -> AsyncGenerator[AsyncSession, None]:
        """Explicit transaction context for complex operations"""
        async with self.session() as session, session.begin():
            yield session


# Global database manager instance
db_manager = DatabaseSessionManager()


@asynccontextmanager
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency for FastAPI routes to get database session

    Usage:
        @router.get("/items")
        async def get_items(db: AsyncSession = Depends(get_db_session)):
            result = await db.execute(select(Item))
            return result.scalars().all()
    """
    async with db_manager.session() as session:
        yield session


@asynccontextmanager
async def transactional_session() -> AsyncGenerator[AsyncSession, None]:
    """Get a session with explicit transaction control"""
    async with db_manager.transaction() as session:
        yield session


# Utility context managers for common patterns


@asynccontextmanager
async def bulk_insert_context(
    session: AsyncSession, batch_size: int = 1000
) -> AsyncGenerator[Callable[[Any], Awaitable[None]], None]:
    """Context manager for efficient bulk inserts"""
    items: list[Any] = []

    async def add_item(item: Any) -> None:
        items.append(item)
        if len(items) >= batch_size:
            session.add_all(items)
            await session.flush()
            items.clear()

    try:
        yield add_item
    finally:
        # Insert remaining items
        if items:
            session.add_all(items)
            await session.flush()


@asynccontextmanager
async def read_only_session() -> AsyncGenerator[AsyncSession, None]:
    """Get a read-only database session (useful for reports/analytics)"""
    engine = create_async_engine(
        settings.database_url,
        echo=False,
        poolclass=NullPool,  # No connection pooling for read-only
        connect_args={
            "server_settings": {"jit": "off"},
            "command_timeout": 60,
        },
    )

    factory = async_sessionmaker(bind=engine, expire_on_commit=False, autoflush=False, autocommit=False)

    async with factory() as session:
        try:
            yield session
        finally:
            await session.close()
            await engine.dispose()


@asynccontextmanager
async def database_lock(session: AsyncSession, lock_id: int, timeout: int = 10):
    """
    PostgreSQL advisory lock context manager
    Useful for preventing concurrent operations
    """
    # Try to acquire lock
    result = await session.execute(text(f"SELECT pg_try_advisory_lock({lock_id})"))
    locked = result.scalar()

    if not locked:
        # Wait for lock with timeout
        await session.execute(text(f"SET lock_timeout = '{timeout}s'"))
        try:
            await session.execute(text(f"SELECT pg_advisory_lock({lock_id})"))
            locked = True
        except Exception as e:
            raise TimeoutError(f"Could not acquire lock {lock_id}: {e}")

    try:
        yield
    finally:
        if locked:
            await session.execute(text(f"SELECT pg_advisory_unlock({lock_id})"))


# Example usage patterns:
"""
# Basic usage in FastAPI
@router.post("/cases")
async def create_case(
    case_data: CaseCreate,
    db: AsyncSession = Depends(get_db_session)
):
    case = Case(**case_data.dict())
    db.add(case)
    await db.commit()
    return case

# Bulk operations
async def import_documents(documents: List[dict]):
    async with transactional_session() as session:
        async with bulk_insert_context(session) as add_doc:
            for doc_data in documents:
                doc = Document(**doc_data)
                await add_doc(doc)

# Complex transactions
async def transfer_case(case_id: int, new_solicitor_id: int):
    async with db_manager.transaction() as session:
        # All operations in same transaction
        case = await session.get(Case, case_id)
        old_solicitor = case.solicitor_id
        case.solicitor_id = new_solicitor_id

        # Create audit log
        audit = AuditLog(
            action="case_transfer",
            case_id=case_id,
            from_solicitor=old_solicitor,
            to_solicitor=new_solicitor_id
        )
        session.add(audit)
        # Automatically commits or rolls back

# With locking
async def process_unique_operation(resource_id: int):
    async with get_db_session() as session:
        async with database_lock(session, resource_id):
            # Only one process can execute this at a time
            await perform_operation(session, resource_id)
"""
