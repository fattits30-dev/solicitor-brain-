# Unified Debug System

The Solicitor Brain project now uses a unified debug management system that consolidates all debugging functionality into a single Python module.

## Overview

The new debug system replaces multiple shell scripts with a comprehensive Python-based solution:
- `backend/utils/debug_manager.py` - Core debug management module
- `debug.py` - CLI interface
- Integration with `solicitor-brain.sh`

## Usage

### Via Main Script
```bash
# Launch all services with database reset
./solicitor-brain.sh debug launch

# Quick start (no database reset)
./solicitor-brain.sh debug quick

# Stop all services
./solicitor-brain.sh debug stop

# Check service status
./solicitor-brain.sh debug status

# View logs
./solicitor-brain.sh debug logs
./solicitor-brain.sh debug logs -s backend  # Specific service
./solicitor-brain.sh debug logs -f         # Follow mode

# Run diagnostics
./solicitor-brain.sh debug diagnose

# Fix code issues automatically
./solicitor-brain.sh debug fix

# Run tests
./solicitor-brain.sh debug test

# Create VS Code debug config
./solicitor-brain.sh debug vscode
```

### Direct Usage
```bash
# You can also use the debug.py directly
python3 debug.py launch
python3 debug.py status
python3 debug.py diagnose --json  # JSON output
```

## Features

### Service Management
- Start/stop backend, frontend, and ChromaDB services
- Health checks for all services
- PID tracking and process management
- Automatic port cleanup

### Code Quality
- Automatic code formatting (black, prettier)
- Linting fixes (ruff, eslint)
- Type checking (mypy, typescript)
- Integrated test runner

### Diagnostics
- System resource monitoring
- Service health checks
- Dependency verification
- Recent error analysis
- Port usage tracking

### Development Support
- VS Code debug configuration generation
- Hot reload support
- Environment variable management
- Log aggregation and tailing

## Migration from Old Scripts

The following scripts have been deprecated and replaced:
- `debugger.sh` → `debug.py launch`
- `debug-helper.sh` → `debug.py diagnose`
- `debug-quick.sh` → `debug.py quick`
- `fix-issues.sh` → `debug.py fix`
- Multiple fix-*.py scripts → `debug.py fix`

Old scripts have been moved to `scripts/deprecated/` for reference.

## VS Code Integration

Run `./solicitor-brain.sh debug vscode` to generate a `.vscode/launch.json` with configurations for:
- Backend FastAPI debugging
- Frontend Next.js debugging
- Full stack debugging
- Python file debugging
- Test debugging

## Benefits

1. **Unified Interface**: Single entry point for all debug operations
2. **Better Error Handling**: Python provides more robust error handling
3. **Extensibility**: Easy to add new debug features
4. **Cross-platform**: Works consistently across different systems
5. **Integration**: Better integration with the main application code
6. **Performance**: Faster execution and better resource management