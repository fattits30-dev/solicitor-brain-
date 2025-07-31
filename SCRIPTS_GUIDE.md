# Solicitor Brain - Scripts Guide

## Main Launch Scripts

### 1. `start.sh` - Quick Start (Recommended)
- Starts both backend and frontend services
- Automatically checks dependencies
- Shows real-time logs
- Use: `./start.sh`

### 2. `launch-with-debugger.sh` - Development with Debugger
- Launches services with debugging enabled
- Python debugger on port 5678
- Node.js debugger on port 9229
- Creates VS Code debug configuration
- Use: `./launch-with-debugger.sh`

### 3. `run_electron.sh` - Desktop App
- Launches as an Electron desktop application
- Starts all services automatically
- Opens in a native window
- Use: `./run_electron.sh`

### 4. `solicitor-brain.sh` - System Management
- Full system management script
- Install, setup, start, stop, status commands
- Database management
- Use: `./solicitor-brain.sh [command]`

## Scripts Directory

Located in `/scripts/`:

- `setup_environment.sh` - Initial environment setup
- `dev.sh` - Development helper script
- `run_with_error_reporting.py` - Backend with error reporting
- `start_ollama_gpu.sh` - Start Ollama with GPU support
- `download_models.sh` - Download AI models
- `install_desktop.sh` - Install desktop launcher
- `setup_cron.sh` - Setup cron jobs
- `idle_worker.sh` - Background worker script
- `quick_fact.py` - Quick fact extraction utility

## Quick Commands

```bash
# Start development server
./start.sh

# Start with debugging
./launch-with-debugger.sh

# Run as desktop app
./run_electron.sh

# Check system status
./solicitor-brain.sh status

# Stop all services
./solicitor-brain.sh stop
```

## Service URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs