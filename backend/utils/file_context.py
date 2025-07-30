"""
File operation context managers for Solicitor Brain
Provides safe file handling with automatic cleanup
"""

import os
import shutil
import tempfile
import hashlib
import asyncio
from pathlib import Path
from contextlib import contextmanager, asynccontextmanager
from typing import Optional, Union, TextIO, AsyncGenerator, Generator, Type, Any
import aiofiles
import aiofiles.os
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


@contextmanager
def safe_file_write(filepath: Union[str, Path], mode: str = 'w', 
                   backup: bool = True, encoding: str = 'utf-8') -> Generator[TextIO, None, None]:
    """
    Safely write to a file with automatic backup and atomic operations
    
    Args:
        filepath: Path to the file
        mode: Write mode ('w' or 'wb')
        backup: Whether to create a backup before writing
        encoding: Text encoding (ignored for binary mode)
    """
    filepath = Path(filepath)
    temp_file = None
    backup_file = None
    
    try:
        # Create backup if requested and file exists
        if backup and filepath.exists():
            backup_file = filepath.with_suffix(f'{filepath.suffix}.backup')
            shutil.copy2(filepath, backup_file)
            
        # Write to temporary file first
        temp_fd, temp_path = tempfile.mkstemp(
            dir=filepath.parent,
            prefix=f'.{filepath.name}.',
            suffix='.tmp'
        )
        os.close(temp_fd)
        
        temp_file = Path(temp_path)
        
        # Open and yield the temporary file
        if 'b' not in mode:
            with open(temp_file, mode, encoding=encoding) as f:
                yield f  # type: ignore[misc]
        else:
            with open(temp_file, mode) as f:
                yield f  # type: ignore[misc]
            
        # Atomic rename
        temp_file.replace(filepath)
        temp_file = None
        
        # Remove backup on success
        if backup_file and backup_file.exists():
            backup_file.unlink()
            
    except Exception:
        # Restore from backup on failure
        if backup_file and backup_file.exists():
            backup_file.replace(filepath)
        raise
        
    finally:
        # Clean up temp file if it still exists
        if temp_file and temp_file.exists():
            temp_file.unlink()


@asynccontextmanager
async def async_safe_file_write(filepath: Union[str, Path], mode: str = 'w',
                               encoding: str = 'utf-8') -> AsyncGenerator[Any, None]:
    """Async version of safe file write"""
    filepath = Path(filepath)
    temp_file = None
    
    try:
        # Create temporary file
        temp_fd, temp_path = tempfile.mkstemp(
            dir=filepath.parent,
            prefix=f'.{filepath.name}.',
            suffix='.tmp'
        )
        os.close(temp_fd)
        temp_file = Path(temp_path)
        
        # Open and yield
        if 'b' not in mode:
            async with aiofiles.open(str(temp_file), mode, encoding=encoding) as f:  # type: ignore[call-overload]
                yield f
        else:
            async with aiofiles.open(str(temp_file), mode) as f:  # type: ignore[call-overload]
                yield f
            
        # Atomic rename
        await aiofiles.os.rename(temp_file, filepath)
        temp_file = None
        
    finally:
        if temp_file and temp_file.exists():
            await aiofiles.os.remove(temp_file)


@contextmanager
def locked_file(filepath: Union[str, Path], mode: str = 'r+',
                timeout: float = 10.0) -> Generator[TextIO, None, None]:
    """
    Open a file with advisory locking (Unix only)
    
    Args:
        filepath: Path to file
        mode: File mode
        timeout: Lock timeout in seconds
    """
    import fcntl
    import signal
    
    filepath = Path(filepath)
    
    class TimeoutError(Exception):
        pass
    
    def timeout_handler(signum, frame):
        raise TimeoutError(f"Could not acquire lock on {filepath}")
    
    # Set timeout alarm
    old_handler = signal.signal(signal.SIGALRM, timeout_handler)
    signal.alarm(int(timeout))
    
    try:
        with open(filepath, mode) as f:
            # Acquire exclusive lock
            fcntl.flock(f.fileno(), fcntl.LOCK_EX)
            
            # Cancel alarm
            signal.alarm(0)
            
            yield f  # type: ignore[misc]
            
    finally:
        # Restore old handler
        signal.signal(signal.SIGALRM, old_handler)
        signal.alarm(0)


@contextmanager
def temp_directory(prefix: str = 'solicitor_brain_', cleanup: bool = True) -> Generator[Path, None, None]:
    """
    Create a temporary directory with automatic cleanup
    
    Args:
        prefix: Directory prefix
        cleanup: Whether to remove directory on exit
    """
    temp_dir = Path(tempfile.mkdtemp(prefix=prefix))
    
    try:
        yield temp_dir
    finally:
        if cleanup and temp_dir.exists():
            shutil.rmtree(temp_dir)


@asynccontextmanager
async def file_lock(lockfile: Union[str, Path], timeout: float = 30.0) -> AsyncGenerator[None, None]:
    """
    Async file-based lock for coordinating between processes
    
    Args:
        lockfile: Path to lock file
        timeout: Maximum time to wait for lock
    """
    lockfile = Path(lockfile)
    start_time = asyncio.get_event_loop().time()
    
    # Try to create lock file
    while True:
        try:
            # Try to create file exclusively
            fd = os.open(lockfile, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            os.close(fd)
            break
        except FileExistsError:
            # Check timeout
            if asyncio.get_event_loop().time() - start_time > timeout:
                raise TimeoutError(f"Could not acquire lock: {lockfile}")
            
            # Wait and retry
            await asyncio.sleep(0.1)
    
    try:
        yield
    finally:
        # Remove lock file
        lockfile.unlink(missing_ok=True)


class FileWatcher:
    """Context manager for watching file changes"""
    
    def __init__(self, filepath: Union[str, Path]):
        self.filepath = Path(filepath)
        self.initial_mtime = None
        self.initial_size = None
        self.initial_hash = None
        
    def __enter__(self):
        if self.filepath.exists():
            stat = self.filepath.stat()
            self.initial_mtime = stat.st_mtime
            self.initial_size = stat.st_size
            
            # Calculate hash for content verification
            with open(self.filepath, 'rb') as f:
                self.initial_hash = hashlib.sha256(f.read()).hexdigest()
                
        return self
        
    def __exit__(self, exc_type: Optional[Type[BaseException]], exc_val: Optional[BaseException], exc_tb: Optional[Any]) -> None:  # noqa: ARG002
        if self.has_changed():
            logger.info(f"File {self.filepath} was modified")
            
    def has_changed(self) -> bool:
        """Check if file has been modified"""
        if not self.filepath.exists():
            return self.initial_mtime is not None
            
        stat = self.filepath.stat()
        
        # Quick checks
        if stat.st_mtime != self.initial_mtime:
            return True
        if stat.st_size != self.initial_size:
            return True
            
        # Content check
        with open(self.filepath, 'rb') as f:
            current_hash = hashlib.sha256(f.read()).hexdigest()
            
        return current_hash != self.initial_hash


@contextmanager
def atomic_write(filepath: Union[str, Path], mode: str = 'w', **kwargs) -> Generator[TextIO, None, None]:
    """
    Write file atomically - file appears all at once or not at all
    
    Args:
        filepath: Target file path
        mode: Write mode
        **kwargs: Additional arguments for open()
    """
    filepath = Path(filepath)
    
    # Ensure directory exists
    filepath.parent.mkdir(parents=True, exist_ok=True)
    
    # Create temporary file in same directory (for same filesystem)
    with tempfile.NamedTemporaryFile(
        mode=mode,
        dir=filepath.parent,
        prefix=f'.{filepath.name}.',
        suffix='.tmp',
        delete=False,
        **kwargs
    ) as tmp_file:
        temp_path = Path(tmp_file.name)
        
        try:
            yield tmp_file  # type: ignore[misc]
            
            # Ensure all data is written
            tmp_file.flush()
            os.fsync(tmp_file.fileno())
            
        except Exception:
            # Clean up on error
            temp_path.unlink(missing_ok=True)
            raise
            
    # Atomic rename
    temp_path.replace(filepath)


@asynccontextmanager
async def document_processor(filepath: Union[str, Path], 
                           output_dir: Optional[Path] = None) -> AsyncGenerator[dict[str, Any], None]:
    """
    Process documents with automatic format detection and conversion
    
    Args:
        filepath: Input document path
        output_dir: Output directory for processed files
    """
    filepath = Path(filepath)
    output_dir = output_dir or filepath.parent / 'processed'
    output_dir.mkdir(exist_ok=True)
    
    # Create processing context
    context = {
        'input': filepath,
        'output_dir': output_dir,
        'timestamp': datetime.now(),
        'metadata': {}
    }
    
    try:
        # Detect file type
        suffix = filepath.suffix.lower()
        context['type'] = suffix
        
        # Read file info
        stat = filepath.stat()
        context['metadata'] = {
            'size': stat.st_size,
            'modified': datetime.fromtimestamp(stat.st_mtime),
            'name': filepath.name
        }
        
        yield context
        
    except Exception as e:
        logger.error(f"Error processing {filepath}: {e}")
        raise
        
    finally:
        # Log processing complete
        logger.info(f"Processed {filepath} -> {output_dir}")


# Example usage patterns:
"""
# Safe file writing
with safe_file_write('config.json') as f:
    json.dump(config, f)
    
# Atomic writes
with atomic_write('important.txt') as f:
    f.write("Critical data")
    # File only appears after successful completion
    
# File locking
with locked_file('shared_resource.txt', 'r+') as f:
    data = f.read()
    # Process data
    f.seek(0)
    f.write(new_data)
    
# Temporary directories
with temp_directory() as temp_dir:
    # Do work in temp_dir
    process_files(temp_dir)
    # Automatically cleaned up
    
# File watching
with FileWatcher('config.yaml') as watcher:
    reload_config()
    if watcher.has_changed():
        print("Config was modified during reload!")
        
# Async file operations
async with async_safe_file_write('output.txt') as f:
    await f.write("Async content")
    
# Document processing
async with document_processor('document.pdf') as ctx:
    print(f"Processing {ctx['type']} file")
    output_path = ctx['output_dir'] / 'processed.txt'
    # Process document
"""