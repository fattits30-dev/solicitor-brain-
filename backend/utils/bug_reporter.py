"""
Bug reporting system for Solicitor Brain
Integrates with VS Code problem matcher and logs
"""

import json
import logging
import traceback
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

# Configure logger
logger = logging.getLogger("bug_reporter")


class BugReporter:
    """Centralized bug reporting for the application"""

    def __init__(self):
        self.log_dir = Path("logs")
        self.log_dir.mkdir(exist_ok=True)

        # VS Code problem matcher format
        self.setup_vscode_logger()

        # Create a dedicated logger for VS Code output
        self.vscode_logger = logging.getLogger("vscode_problems")

    def setup_vscode_logger(self):
        """Setup logger to output VS Code problem matcher format"""
        # File handler for detailed logs
        file_handler = logging.FileHandler(
            self.log_dir / f"bugs_{datetime.now(UTC).strftime('%Y%m%d')}.log"
        )
        file_handler.setFormatter(
            logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(pathname)s:%(lineno)d - %(message)s'
            )
        )

        # Add handlers to root logger
        root_logger = logging.getLogger()
        root_logger.addHandler(file_handler)

    def report_error(
        self,
        error: Exception,
        context: dict[str, Any] | None = None,
        user_message: str | None = None
    ) -> dict[str, Any]:
        """
        Report an error with context

        Args:
            error: The exception that occurred
            context: Additional context about the error
            user_message: User-friendly error message

        Returns:
            Error report dict
        """
        # Get the current frame info
        tb = traceback.extract_tb(error.__traceback__)
        if tb:
            tb[-1]

            # Log in VS Code format to stderr

        # Create error report
        error_report = {
            "id": datetime.now(UTC).isoformat(),
            "type": error.__class__.__name__,
            "message": str(error),
            "user_message": user_message or "An unexpected error occurred",
            "traceback": traceback.format_exc(),
            "context": context or {},
            "timestamp": datetime.now(UTC).isoformat()
        }

        # Save to error log
        self.save_error_report(error_report)

        return error_report

    def save_error_report(self, report: dict[str, Any]):
        """Save error report to file"""
        error_file = self.log_dir / f"error_{report['id'].replace(':', '-')}.json"
        with open(error_file, 'w') as f:
            json.dump(report, f, indent=2)

    def report_warning(self, message: str, context: dict[str, Any] | None = None):  # noqa: ARG002
        """Report a warning"""
        # Get caller info using traceback
        tb = traceback.extract_stack()
        if len(tb) >= 2:
            tb[-2]
        else:
            pass

        # Log to file
        logger.warning(message)

        # Output in VS Code format to stderr

    def report_validation_error(
        self,
        field: str,
        value: Any,
        expected: str,
        line_number: int | None = None
    ):
        """Report validation errors in VS Code format"""
        # Get caller info using traceback
        tb = traceback.extract_stack()
        if len(tb) >= 2:
            caller = tb[-2]
            if line_number is None:
                line_number = caller.lineno
        else:
            if line_number is None:
                line_number = 0

        message = f"Validation error in '{field}': expected {expected}, got {type(value).__name__}"

        # Log to file
        logger.error(message)

        # Output in VS Code format to stderr


# Global instance
bug_reporter = BugReporter()
