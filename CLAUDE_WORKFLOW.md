# Claude Workflow Reference

## Project Overview
**Solicitor Brain** - On-premises UK law AI clerk for small firms
- Stack: Ubuntu 24.04 LTS, Python 3.11, FastAPI, Next.js 15, PostgreSQL 15
- Optional GPU: RX 6600 XT (ROCm 6.x)

## Pre-Commit Checklist
Before committing any changes, run ALL of these checks:

```bash
# Backend checks
cd /media/mine/AI-DEV/solicitor-brain
python -m mypy backend/
cd backend && ruff check .
cd ..

# Frontend checks  
cd frontend && npm run build
cd ..

# Run tests if available
pytest tests/
```

## Common Development Tasks

### 1. Fixing Type Errors
When user reports "X problems" in VS Code:
1. First check with `mcp__ide__getDiagnostics` to see actual errors
2. Use mypy to verify: `python -m mypy backend/[file].py`
3. Common fixes:
   - Add type annotations: `variable: Type = value`
   - Use type guards: `if isinstance(var, ExpectedType):`
   - Avoid mixed-type dictionaries
   - Use individual typed attributes instead of generic containers

### 2. Script/File Updates
When user asks for "full script rewrite" or updates:
1. Read the file first with Read tool
2. Identify:
   - TODO comments to remove
   - Commented-out code to remove
   - Deprecated patterns (e.g., `datetime.utcnow()` → `datetime.now(timezone.utc)`)
   - Method calls that don't exist on services
3. Use MultiEdit for multiple changes to same file
4. Always verify changes with type checking and linting

### 3. Service Integration (electron_bridge.py)
Key services and their actual methods:
- **AIService**: `generate_response()`, `analyze_document()`, `search_legal_knowledge()`, `analyze_text()`
- **AuthService**: `create_access_token()`, `decode_token()` 
- **FactService**: Requires db session in `__init__`
- **TemplatesService**: Available methods vary
- **OCRService**: `extract_text_from_image()`, `extract_text_from_pdf()`
- **VoiceService**: `transcribe_audio()`, `text_to_speech()`
- **CaseAnalyzer**: Methods require db session
- **DocumentScanner**: `analyze_document()` (not scan_document)
- **EvidenceScanner**: Available methods vary

### 4. Database Patterns
```python
# Correct async database usage
from backend.utils.database import get_db

async with get_db() as session:
    # Use session here
    pass

# For services requiring db session
fact_service = FactService(session)  # Pass session to constructor
```

### 5. Error Response Patterns
```python
# Standardized responses
def _error_response(self, error: str, request_id: str = '') -> Dict[str, Any]:
    return {
        'error': error,
        'success': False,
        'id': request_id,
        'timestamp': datetime.now(timezone.utc).isoformat()
    }

def _success_response(self, data: Any = None, request_id: str = '') -> Dict[str, Any]:
    return {
        'data': data,
        'success': True,
        'id': request_id,
        'timestamp': datetime.now(timezone.utc).isoformat()
    }
```

## Problem Resolution Workflow

### When "still X problems" after fixes:
1. **Get current diagnostics**: Use `mcp__ide__getDiagnostics` 
2. **Categorize errors**:
   - Type inference issues (Pylance-specific)
   - Actual type errors (mypy will catch)
   - Unused variables/imports
   - Missing imports
3. **Fix priority**:
   - Fix actual errors first (mypy errors)
   - Then address Pylance-specific issues
   - Finally clean up hints/warnings
4. **Verify each fix**:
   - Run mypy after changes
   - Check specific file with Pylance
   - Ensure no new errors introduced

## Key Commands Reference

```bash
# Type checking
python -m mypy backend/                    # Check all backend
python -m mypy backend/specific_file.py    # Check specific file

# Linting
cd backend && ruff check .                 # Lint backend
cd backend && ruff check --fix .           # Auto-fix issues

# Frontend
cd frontend && npm run build              # Build and type-check
cd frontend && npm run dev                # Development server

# Testing
pytest tests/                             # Run all tests
pytest tests/test_specific.py            # Run specific test

# Database
python scripts/init_db.py                 # Initialize database
```

## Common Gotchas

1. **Import paths**: Always use absolute imports from `backend.`
2. **Async context managers**: Don't use `async with get_db()` directly
3. **Type annotations**: Prefer explicit over Any
4. **Service initialization**: Some services need db session
5. **Method names**: Verify actual method names exist on services
6. **Datetime**: Use `timezone.utc` not deprecated `utcnow()`

## Debugging Workflow

When encountering issues:
1. Check VS Code Problems panel count
2. Use `mcp__ide__getDiagnostics` for details
3. Run mypy for actual type errors
4. Run ruff for style issues
5. Check frontend build for TypeScript errors
6. Look for patterns in similar files
7. Test specific functionality if needed

## File Organization

- `/backend` - FastAPI services
- `/frontend` - Next.js SPA  
- `/scripts` - Helper scripts
- `/docs` - Documentation
- `/tests` - Test suites

## Remember

- **NEVER** create files unless necessary
- **ALWAYS** prefer editing existing files
- **NEVER** commit unless explicitly asked
- **ALWAYS** run all checks before saying "done"
- **DO** use TodoWrite for complex multi-step tasks
- **DO** read files before editing them