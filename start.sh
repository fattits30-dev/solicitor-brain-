#!/bin/bash
# Master startup script for Solicitor Brain
# Consolidated from start.sh, start_dev.sh, and start_all.sh

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default options
SKIP_CHECKS=false
SKIP_DEPS=false
PRODUCTION=false
VERBOSE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-checks)
            SKIP_CHECKS=true
            shift
            ;;
        --skip-deps)
            SKIP_DEPS=true
            shift
            ;;
        --production)
            PRODUCTION=true
            shift
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --skip-checks    Skip system requirement checks"
            echo "  --skip-deps      Skip dependency installation"
            echo "  --production     Run in production mode"
            echo "  --verbose, -v    Enable verbose output"
            echo "  --help, -h       Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Functions
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

service_running() {
    systemctl is-active --quiet "$1"
}

kill_port() {
    local port=$1
    if [ "$VERBOSE" = true ]; then
        echo "Checking port $port..."
    fi
    lsof -ti:$port 2>/dev/null | xargs -r kill -9 2>/dev/null || true
}

log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Header
echo ""
echo "🚀 Solicitor Brain Startup Script"
echo "=================================="
echo ""

# System checks
if [ "$SKIP_CHECKS" = false ]; then
    log "${YELLOW}Running system checks...${NC}"
    
    # Check Python version
    python_version=$(python3 --version 2>&1 | awk '{print $2}')
    required_version="3.11"
    if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
        echo -e "${RED}❌ Python 3.11+ required. Current version: $python_version${NC}"
        exit 1
    fi
    log "${GREEN}✅ Python $python_version${NC}"
    
    # Check required commands
    missing_deps=()
    for cmd in git psql redis-cli; do
        if command_exists $cmd; then
            [ "$VERBOSE" = true ] && log "${GREEN}✓ $cmd found${NC}"
        else
            missing_deps+=($cmd)
        fi
    done
    
    # Check Node.js package manager (pnpm or npm)
    if command_exists pnpm; then
        NPM_CMD="pnpm"
    elif command_exists npm; then
        NPM_CMD="npm"
    else
        missing_deps+=("pnpm/npm")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        echo -e "${RED}❌ Missing dependencies: ${missing_deps[*]}${NC}"
        echo ""
        echo "Install missing dependencies:"
        [[ " ${missing_deps[@]} " =~ " psql " ]] && echo "  sudo apt install postgresql-client"
        [[ " ${missing_deps[@]} " =~ " redis-cli " ]] && echo "  sudo apt install redis-tools"
        [[ " ${missing_deps[@]} " =~ " pnpm/npm " ]] && echo "  sudo apt install nodejs npm && npm install -g pnpm"
        exit 1
    fi
    
    # Check services
    log "${YELLOW}Checking services...${NC}"
    
    if service_running postgresql; then
        log "${GREEN}✅ PostgreSQL is running${NC}"
    else
        echo -e "${RED}❌ PostgreSQL is not running${NC}"
        echo "  Start with: sudo systemctl start postgresql"
        exit 1
    fi
    
    if service_running redis-server || service_running redis; then
        log "${GREEN}✅ Redis is running${NC}"
    else
        echo -e "${RED}❌ Redis is not running${NC}"
        echo "  Start with: sudo systemctl start redis-server"
        exit 1
    fi
else
    log "${YELLOW}Skipping system checks (--skip-checks)${NC}"
fi

# Virtual environment setup
VENV_DIR=".venv"
if [ -d "venv" ]; then
    VENV_DIR="venv"
fi

if [ ! -d "$VENV_DIR" ]; then
    log "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv "$VENV_DIR"
fi

# Activate virtual environment
log "${YELLOW}Activating virtual environment...${NC}"
source "$VENV_DIR/bin/activate"

# Install dependencies
if [ "$SKIP_DEPS" = false ]; then
    # Python dependencies
    if [ -f "requirements.txt" ]; then
        log "${YELLOW}Checking Python dependencies...${NC}"
        if [ "$VERBOSE" = true ]; then
            pip install --upgrade pip
            pip install -r requirements.txt
        else
            pip install -q --upgrade pip
            pip install -q -r requirements.txt
        fi
        log "${GREEN}✅ Python dependencies ready${NC}"
    fi
    
    # Frontend dependencies
    if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
        if [ ! -d "frontend/node_modules" ] || [ "$PRODUCTION" = true ]; then
            log "${YELLOW}Installing frontend dependencies...${NC}"
            cd frontend
            if [ "$VERBOSE" = true ]; then
                $NPM_CMD install
            else
                $NPM_CMD install --silent
            fi
            cd ..
            log "${GREEN}✅ Frontend dependencies ready${NC}"
        fi
    fi
else
    log "${YELLOW}Skipping dependency installation (--skip-deps)${NC}"
fi

# Clean up existing processes
log "${YELLOW}Cleaning up existing processes...${NC}"
kill_port 8000
kill_port 3000
[ "$VERBOSE" = true ] && kill_port 11434
sleep 1

# Check Ollama (development mode only)
if [ "$PRODUCTION" = false ]; then
    if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
        [ "$VERBOSE" = true ] && log "${GREEN}✓ Ollama is running${NC}"
    else
        log "${YELLOW}Starting Ollama...${NC}"
        ollama serve >/dev/null 2>&1 &
        sleep 3
    fi
fi

# Launch services
if [ "$PRODUCTION" = true ]; then
    log "${YELLOW}Starting in PRODUCTION mode...${NC}"
    # Production startup logic here
    echo -e "${YELLOW}Production mode not yet implemented. Use development mode.${NC}"
    exit 1
else
    log "${YELLOW}Starting development environment...${NC}"
    
    # Use Python runner if available, otherwise fall back to bash
    if [ -f "run_dev.py" ]; then
        python run_dev.py
    else
        # Fallback bash startup
        log "${YELLOW}Starting services manually...${NC}"
        
        # Start backend
        cd backend
        uvicorn main:app --reload --host 127.0.0.1 --port 8000 &
        BACKEND_PID=$!
        cd ..
        
        # Wait for backend
        sleep 5
        
        # Start frontend
        cd frontend
        $NPM_CMD run dev &
        FRONTEND_PID=$!
        cd ..
        
        echo ""
        log "${GREEN}✅ All services started!${NC}"
        echo ""
        echo "Backend:  http://localhost:8000"
        echo "Frontend: http://localhost:3000"
        echo "API Docs: http://localhost:8000/docs"
        echo ""
        echo "Press Ctrl+C to stop all services"
        
        # Trap and wait
        trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
        wait
    fi
fi