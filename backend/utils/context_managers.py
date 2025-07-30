"""
Context managers for Solicitor Brain
Provides proper resource management throughout the application
"""

import asyncio
import contextlib
import subprocess
import time
from pathlib import Path
from typing import AsyncGenerator, Generator, Optional, Dict, Any, List, Type
try:
    import aiofiles
except ImportError:
    aiofiles = None  # type: ignore[assignment]
# import asyncpg  # Not used, removed to fix import warning
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, AsyncEngine
from sqlalchemy.orm import sessionmaker
import psutil
import signal
import os


class ProcessManager:
    """Context manager for subprocess management with proper cleanup"""
    
    def __init__(self, name: str, cmd: List[str], cwd: Optional[Path] = None, 
                 env: Optional[Dict[str, str]] = None):
        self.name = name
        self.cmd = cmd
        self.cwd = cwd
        self.env = env or {}
        self.process: Optional[subprocess.Popen[str]] = None
        
    def __enter__(self) -> subprocess.Popen[str]:
        """Start the process"""
        process_env = os.environ.copy()
        process_env.update(self.env)
        
        self.process = subprocess.Popen(
            self.cmd,
            cwd=self.cwd,
            env=process_env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            preexec_fn=os.setsid if os.name != 'nt' else None
        )
        return self.process
    
    def __exit__(self, exc_type: Optional[Type[BaseException]], exc_val: Optional[BaseException], exc_tb: Optional[Any]) -> None:
        """Ensure process is properly terminated"""
        if self.process and self.process.poll() is None:
            try:
                # Try graceful shutdown first
                if os.name != 'nt':
                    os.killpg(os.getpgid(self.process.pid), signal.SIGTERM)
                else:
                    self.process.terminate()
                    
                # Wait for graceful shutdown
                try:
                    self.process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    # Force kill if needed
                    if os.name != 'nt':
                        os.killpg(os.getpgid(self.process.pid), signal.SIGKILL)
                    else:
                        self.process.kill()
                    self.process.wait()
            except ProcessLookupError:
                pass  # Process already dead


@contextlib.contextmanager
def managed_process(name: str, cmd: List[str], **kwargs: Any) -> Generator[subprocess.Popen[str], None, None]:
    """Convenience function for process management"""
    with ProcessManager(name, cmd, **kwargs) as process:
        yield process


class DatabaseManager:
    """Async context manager for database connections"""
    
    def __init__(self, database_url: str):
        self.database_url = database_url
        self.engine: Optional[AsyncEngine] = None
        self.async_session_maker = None
        
    async def __aenter__(self) -> 'DatabaseManager':
        """Create engine and session maker"""
        self.engine = create_async_engine(
            self.database_url,
            echo=False,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20
        )
        
        self.async_session_maker = sessionmaker(
            self.engine,  # type: ignore[arg-type]
            class_=AsyncSession,
            expire_on_commit=False
        )  # type: ignore[call-overload]
        return self
        
    async def __aexit__(self, exc_type: Optional[Type[BaseException]], exc_val: Optional[BaseException], exc_tb: Optional[Any]) -> None:  # noqa: ARG002
        """Close all connections"""
        if self.engine:
            await self.engine.dispose()
            
    @contextlib.asynccontextmanager
    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """Get a database session"""
        async with self.async_session_maker() as session:  # type: ignore[misc]
            try:
                yield session
                await session.commit()  # type: ignore[attr-defined]
            except Exception:
                await session.rollback()  # type: ignore[attr-defined]
                raise
            finally:
                await session.close()  # type: ignore[attr-defined]


@contextlib.asynccontextmanager
async def database_transaction(session: AsyncSession) -> AsyncGenerator[AsyncSession, None]:
    """Manage database transactions with automatic rollback on error"""
    async with session.begin():
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


@contextlib.asynccontextmanager
async def managed_file(filepath: Path, mode: str = 'r', **kwargs: Any) -> AsyncGenerator[Any, None]:
    """Async context manager for file operations"""
    if aiofiles is None:
        raise ImportError("aiofiles is required for async file operations. Install with: pip install aiofiles")
    async with aiofiles.open(filepath, mode, **kwargs) as file:  # type: ignore[call-overload]
        yield file


@contextlib.contextmanager
def port_manager(port: int) -> Generator[None, None, None]:
    """Context manager to ensure a port is free before and after use"""
    
    def kill_port(port_num: int):
        """Kill any process using the specified port"""
        try:
            for conn in psutil.net_connections():
                if hasattr(conn, 'laddr') and conn.laddr and conn.laddr.port == port_num and conn.pid:
                    try:
                        proc = psutil.Process(conn.pid)
                        proc.terminate()
                        try:
                            proc.wait(timeout=5)
                        except psutil.TimeoutExpired:
                            proc.kill()
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        pass
        except Exception:
            pass
    
    # Kill any existing process on the port
    kill_port(port)
    time.sleep(0.5)
    
    try:
        yield
    finally:
        # Clean up on exit
        kill_port(port)


class ServiceOrchestrator:
    """Orchestrate multiple services with proper lifecycle management"""
    
    def __init__(self):
        self.services: Dict[str, ProcessManager] = {}
        
    def add_service(self, name: str, cmd: List[str], **kwargs: Any) -> None:
        """Add a service to manage"""
        self.services[name] = ProcessManager(name, cmd, **kwargs)
        
    def __enter__(self):
        """Start all services"""
        for svc_name, service in self.services.items():
            print(f"🚀 Starting {svc_name}...")
            service.__enter__()
        return self
        
    def __exit__(self, exc_type: Optional[Type[BaseException]], exc_val: Optional[BaseException], exc_tb: Optional[Any]) -> None:
        """Stop all services in reverse order"""
        for svc_name, service in reversed(list(self.services.items())):
            print(f"🛑 Stopping {svc_name}...")
            service.__exit__(exc_type, exc_val, exc_tb)
            
    def is_healthy(self) -> bool:
        """Check if all services are running"""
        for _, service in self.services.items():
            if service.process and service.process.poll() is not None:
                return False
        return True


@contextlib.asynccontextmanager
async def redis_pool(redis_url: str = "redis://localhost:6379") -> AsyncGenerator[Any, None]:
    """Async context manager for Redis connection pool"""
    try:
        import redis.asyncio as aioredis
        pool = await aioredis.Redis.from_url(redis_url, max_connections=10)  # type: ignore[arg-type]
        try:
            yield pool
        finally:
            await pool.close()
    except ImportError:
        # Fallback to old aioredis if available
        import aioredis as old_aioredis  # type: ignore[import]
        pool = await old_aioredis.create_redis_pool(redis_url, minsize=5, maxsize=10)  # type: ignore[attr-defined]
        try:
            yield pool
        finally:
            pool.close()  # type: ignore[attr-defined]
            await pool.wait_closed()  # type: ignore[attr-defined]


@contextlib.asynccontextmanager
async def http_client_session() -> AsyncGenerator[Any, None]:
    """Async context manager for HTTP client sessions"""
    import aiohttp
    
    timeout = aiohttp.ClientTimeout(total=30, connect=10)
    connector = aiohttp.TCPConnector(limit=100, limit_per_host=30)
    
    async with aiohttp.ClientSession(
        timeout=timeout,
        connector=connector,
        headers={"User-Agent": "SolicitorBrain/1.0"}
    ) as session:
        yield session


class TaskManager:
    """Context manager for background task management"""
    
    def __init__(self):
        self.tasks: List[asyncio.Task[Any]] = []
        
    async def __aenter__(self):
        return self
        
    async def __aexit__(self, exc_type: Optional[Type[BaseException]], exc_val: Optional[BaseException], exc_tb: Optional[Any]) -> None:  # noqa: ARG002
        """Cancel all tasks on exit"""
        for task in self.tasks:
            if not task.done():
                task.cancel()
                
        # Wait for all tasks to complete cancellation
        await asyncio.gather(*self.tasks, return_exceptions=True)
        
    def create_task(self, coro: Any) -> asyncio.Task[Any]:
        """Create and track a task"""
        task: asyncio.Task[Any] = asyncio.create_task(coro)
        self.tasks.append(task)
        return task


@contextlib.contextmanager
def timed_operation(operation_name: str, log_func: Any = print) -> Generator[None, None, None]:
    """Context manager to time operations"""
    start_time = time.time()
    log_func(f"⏱️  Starting {operation_name}...")
    
    try:
        yield
    finally:
        elapsed = time.time() - start_time
        log_func(f"✅ {operation_name} completed in {elapsed:.2f}s")


# Example usage patterns:
"""
# Process management
with managed_process("Backend", ["python", "-m", "uvicorn", "main:app"]) as proc:
    # Process is running
    pass
# Process is automatically cleaned up

# Database operations
async with DatabaseManager("postgresql://...") as db:
    async with db.get_session() as session:
        # Perform database operations
        pass

# Service orchestration
with ServiceOrchestrator() as orchestrator:
    orchestrator.add_service("Backend", ["uvicorn", "main:app"])
    orchestrator.add_service("Frontend", ["npm", "run", "dev"])
    # All services running
    while orchestrator.is_healthy():
        time.sleep(1)

# Timed operations
with timed_operation("Database migration"):
    # Perform migration
    pass
"""