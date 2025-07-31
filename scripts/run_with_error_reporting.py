#!/usr/bin/env python3
"""
Run the backend with error reporting enabled for VS Code
"""

import sys
import os
import subprocess

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Import bug reporter to ensure it's initialized
from backend.utils.bug_reporter import bug_reporter  # noqa: F401

# Run uvicorn with error reporting enabled
if __name__ == "__main__":
    subprocess.run([
        sys.executable, "-m", "uvicorn",
        "backend.main:app",
        "--host", "0.0.0.0",
        "--port", "8000",
        "--reload",
        "--log-level", "info"
    ])