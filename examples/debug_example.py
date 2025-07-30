#!/usr/bin/env python3
"""
Example file demonstrating debugging with VS Code
Set breakpoints and use watch expressions to understand the flow
"""

import asyncio
import sys
from pathlib import Path
from typing import Any

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.utils.context_managers import (
    DatabaseManager
)
from backend.utils.file_context import (
    safe_file_write,
    FileWatcher,
    atomic_write
)


def debug_basic_variables() -> tuple[dict[str, Any], int, bool]:
    """Demonstrates basic variable inspection"""
    # Set breakpoint on next line (F9)
    user_data: dict[str, Any] = {
        "id": 123,
        "name": "John Doe",
        "email": "john@example.com",
        "permissions": ["read", "write", "admin"]
    }
    
    # Watch expressions to try:
    # - user_data["name"]
    # - len(user_data["permissions"])
    # - "admin" in user_data["permissions"]
    
    total_permissions = len(user_data["permissions"])
    is_admin = "admin" in user_data["permissions"]
    
    # Hover over variables to see values
    return user_data, total_permissions, is_admin


def debug_call_stack() -> int:
    """Demonstrates call stack inspection"""
    def level_3(value: int) -> int:
        # Set breakpoint here to see full call stack
        result = value * 2
        return result
    
    def level_2(value: int) -> int:
        # Each level adds to call stack
        modified = value + 10
        return level_3(modified)
    
    def level_1(value: int) -> int:
        # Start of call chain
        processed = value ** 2
        return level_2(processed)
    
    # Run the chain
    final_result = level_1(5)
    return final_result


async def debug_async_context_managers() -> None:
    """Demonstrates debugging async context managers"""
    # Example with database context
    async with DatabaseManager("postgresql://localhost/solicitor_brain") as db:
        # Set breakpoint here
        # Watch: db._engine, db._sessionmaker
        
        async with db.get_session() as session:
            # Watch: session.is_active, session.bind
            
            # Simulate query
            print(f"Session active: {session.is_active}")
            
            # You can execute in debug console:
            # >>> await session.execute("SELECT 1")
            
    print("Database context closed")


def debug_file_operations() -> None:
    """Demonstrates file operation debugging"""
    test_file = Path("debug_test.txt")
    
    # Safe file write with automatic backup
    with safe_file_write(test_file) as f:
        # Set breakpoint here
        # Watch: f.name, test_file.exists()
        f.write("Debug test content\n")
        f.write("Line 2\n")
    
    # File watcher
    with FileWatcher(test_file) as watcher:
        # Modify file
        with open(test_file, 'a') as f:
            f.write("Additional line\n")
        
        # Check if changed
        # Watch: watcher.has_changed()
        changed = watcher.has_changed()
        print(f"File changed: {changed}")
    
    # Atomic write
    with atomic_write(test_file) as f:
        # File doesn't exist yet at original location
        # Watch: test_file.exists(), f.name
        f.write("Atomic content")
    # File appears atomically here
    
    # Cleanup
    test_file.unlink(missing_ok=True)


def debug_exception_handling() -> None:
    """Demonstrates exception debugging"""
    try:
        # Enable "Raised Exceptions" in breakpoints panel
        data = {"key": "value"}
        
        # This will raise KeyError
        value = data["missing_key"]  # noqa: F841
        
    except KeyError as e:
        # Breakpoint here to inspect exception
        # Watch: e, e.args, type(e)
        print(f"Caught exception: {e}")
        
        # In debug console:
        # >>> import traceback
        # >>> traceback.print_exc()


def debug_complex_data() -> tuple[list[dict[str, Any]], int]:
    """Demonstrates debugging complex data structures"""
    # Complex nested structure
    cases: list[dict[str, Any]] = [
        {
            "id": 1,
            "title": "Smith vs Jones",
            "documents": [
                {"name": "contract.pdf", "size": 1024},
                {"name": "evidence.pdf", "size": 2048}
            ],
            "metadata": {
                "created": "2024-01-01",
                "status": "active"
            }
        },
        {
            "id": 2,
            "title": "Doe vs State",
            "documents": [],
            "metadata": {
                "created": "2024-01-02",
                "status": "pending"
            }
        }
    ]
    
    # Set breakpoint here
    # Watch expressions:
    # - len(cases)
    # - cases[0]["title"]
    # - sum(len(c["documents"]) for c in cases)
    # - [c["metadata"]["status"] for c in cases]
    
    # In debug console, try:
    # >>> import json
    # >>> print(json.dumps(cases[0], indent=2))
    # >>> [doc["name"] for case in cases for doc in case["documents"]]
    
    active_cases = [c for c in cases if c["metadata"]["status"] == "active"]
    total_documents = sum(len(c["documents"]) for c in cases)
    
    return active_cases, total_documents


class DebugableService:
    """Example class for debugging object state"""
    
    def __init__(self, name: str):
        self.name = name
        self.status = "initialized"
        self.operations: list[str] = []
        
    def process(self, data: str):
        # Set breakpoint to inspect self
        # Watch: self.__dict__, self.status, len(self.operations)
        
        self.status = "processing"
        self.operations.append(f"Process: {data}")
        
        result = data.upper()
        
        self.status = "completed"
        self.operations.append(f"Result: {result}")
        
        return result


def main() -> None:
    """Main entry point for debugging examples"""
    print("VS Code Debugging Examples")
    print("Set breakpoints and use F5 to start debugging")
    print("-" * 50)
    
    # 1. Basic variables
    print("\n1. Basic Variables:")
    user, perms, admin = debug_basic_variables()
    print(f"User: {user['name']}, Permissions: {perms}, Admin: {admin}")
    
    # 2. Call stack
    print("\n2. Call Stack:")
    result = debug_call_stack()
    print(f"Result: {result}")
    
    # 3. File operations
    print("\n3. File Operations:")
    debug_file_operations()
    
    # 4. Exception handling
    print("\n4. Exception Handling:")
    debug_exception_handling()
    
    # 5. Complex data
    print("\n5. Complex Data:")
    active, total = debug_complex_data()
    print(f"Active cases: {len(active)}, Total documents: {total}")
    
    # 6. Object debugging
    print("\n6. Object State:")
    service = DebugableService("DocumentProcessor")
    result = service.process("debug test")
    print(f"Service result: {result}")
    
    # 7. Async debugging
    print("\n7. Async Context Managers:")
    # Uncomment to test (requires database)
    # asyncio.run(debug_async_context_managers())


if __name__ == "__main__":
    # Start here with F5 or set breakpoint on next line
    main()
    print("\nDebugging session complete!")