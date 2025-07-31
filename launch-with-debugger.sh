#!/bin/bash

# Solicitor Brain - Full Application Launcher with Debugger
# This script launches all services with debugging enabled

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

echo -e "${PURPLE}=====================================${NC}"
echo -e "${PURPLE}   Solicitor Brain - Debug Launcher  ${NC}"
echo -e "${PURPLE}=====================================${NC}"
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Function to kill process on port
kill_port() {
    if port_in_use $1; then
        echo -e "${YELLOW}Port $1 is in use. Killing process...${NC}"
        fuser -k $1/tcp 2>/dev/null || true
        sleep 1
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${BLUE}Waiting for $service_name to be ready...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|404"; then
            echo -e "${GREEN}✓ $service_name is ready!${NC}"
            return 0
        fi
        echo -n "."
        sleep 1
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}✗ $service_name failed to start${NC}"
    return 1
}

# Check dependencies
echo -e "${BLUE}Checking dependencies...${NC}"

if ! command_exists python3; then
    echo -e "${RED}Python 3 is not installed${NC}"
    exit 1
fi

if ! command_exists node; then
    echo -e "${RED}Node.js is not installed${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All dependencies found${NC}"
echo ""

# Clean up any existing processes
echo -e "${BLUE}Cleaning up existing processes...${NC}"
kill_port 8000  # Backend
kill_port 3000  # Frontend
kill_port 5678  # Debugger

# Activate Python virtual environment
echo -e "${BLUE}Activating Python virtual environment...${NC}"
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
    echo -e "${GREEN}✓ Virtual environment activated${NC}"
else
    echo -e "${YELLOW}Virtual environment not found. Creating...${NC}"
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    echo -e "${GREEN}✓ Virtual environment created and activated${NC}"
fi

# Install frontend dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}Frontend dependencies not found. Installing...${NC}"
    cd frontend
    npm install
    cd ..
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
fi

# Create log directory
mkdir -p logs

# Function to launch backend with debugger
launch_backend() {
    echo -e "${BLUE}Starting Backend API with debugger...${NC}"
    
    # Export debug environment variables
    export PYTHONPATH="${SCRIPT_DIR}:${SCRIPT_DIR}/backend"
    export DEBUG=True
    export DEBUGGER_ENABLED=True
    export LOG_LEVEL=DEBUG
    
    # Start backend with debugpy
    cd backend
    python -m debugpy --listen 0.0.0.0:5678 --wait-for-client -m uvicorn main:app \
        --host 0.0.0.0 \
        --port 8000 \
        --reload \
        --log-level debug \
        > ../logs/backend-debug.log 2>&1 &
    
    BACKEND_PID=$!
    cd ..
    echo -e "${GREEN}✓ Backend started with PID: $BACKEND_PID (debugger on port 5678)${NC}"
    
    # Save PID for cleanup
    echo $BACKEND_PID > .backend.pid
}

# Function to launch frontend in debug mode
launch_frontend() {
    echo -e "${BLUE}Starting Frontend with debug mode...${NC}"
    
    cd frontend
    
    # Set debug environment variables
    export NODE_ENV=development
    export NEXT_TELEMETRY_DISABLED=1
    export NODE_OPTIONS='--inspect=9229'
    
    # Start frontend with Node.js debugging
    npm run dev > ../logs/frontend-debug.log 2>&1 &
    
    FRONTEND_PID=$!
    cd ..
    echo -e "${GREEN}✓ Frontend started with PID: $FRONTEND_PID (debugger on port 9229)${NC}"
    
    # Save PID for cleanup
    echo $FRONTEND_PID > .frontend.pid
}

# Function to launch VS Code with debug configuration
launch_vscode() {
    if command_exists code; then
        echo -e "${BLUE}Launching VS Code with debug configuration...${NC}"
        
        # Create VS Code debug configuration if it doesn't exist
        mkdir -p .vscode
        
        cat > .vscode/launch.json << 'EOF'
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Python: Backend Debug",
            "type": "python",
            "request": "attach",
            "connect": {
                "host": "localhost",
                "port": 5678
            },
            "pathMappings": [
                {
                    "localRoot": "${workspaceFolder}/backend",
                    "remoteRoot": "${workspaceFolder}/backend"
                }
            ],
            "justMyCode": false
        },
        {
            "name": "Frontend: Next.js Debug",
            "type": "node",
            "request": "attach",
            "port": 9229,
            "skipFiles": ["<node_internals>/**"],
            "cwd": "${workspaceFolder}/frontend"
        }
    ],
    "compounds": [
        {
            "name": "Full Stack Debug",
            "configurations": ["Python: Backend Debug", "Frontend: Next.js Debug"]
        }
    ]
}
EOF
        
        # Launch VS Code
        code . &
        echo -e "${GREEN}✓ VS Code launched${NC}"
    else
        echo -e "${YELLOW}VS Code not found. Install it for integrated debugging.${NC}"
    fi
}

# Launch services
echo ""
echo -e "${PURPLE}Launching services...${NC}"
echo ""

# Start backend
launch_backend

# Wait a bit for backend to initialize
sleep 3

# Start frontend
launch_frontend

# Wait for services to be ready
echo ""
wait_for_service "http://localhost:8000/health" "Backend API"
wait_for_service "http://localhost:3000" "Frontend"

# Launch VS Code
echo ""
launch_vscode

# Show debug information
echo ""
echo -e "${PURPLE}=====================================${NC}"
echo -e "${GREEN}All services started successfully!${NC}"
echo -e "${PURPLE}=====================================${NC}"
echo ""
echo -e "${BLUE}Service URLs:${NC}"
echo -e "  Frontend:      ${GREEN}http://localhost:3000${NC}"
echo -e "  Backend API:   ${GREEN}http://localhost:8000${NC}"
echo -e "  API Docs:      ${GREEN}http://localhost:8000/docs${NC}"
echo ""
echo -e "${BLUE}Debug Ports:${NC}"
echo -e "  Python Debug:  ${YELLOW}localhost:5678${NC}"
echo -e "  Node.js Debug: ${YELLOW}localhost:9229${NC}"
echo ""
echo -e "${BLUE}Logs:${NC}"
echo -e "  Backend:  ${YELLOW}logs/backend-debug.log${NC}"
echo -e "  Frontend: ${YELLOW}logs/frontend-debug.log${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down services...${NC}"
    
    # Kill backend
    if [ -f .backend.pid ]; then
        kill $(cat .backend.pid) 2>/dev/null || true
        rm .backend.pid
    fi
    
    # Kill frontend
    if [ -f .frontend.pid ]; then
        kill $(cat .frontend.pid) 2>/dev/null || true
        rm .frontend.pid
    fi
    
    # Additional cleanup
    kill_port 8000
    kill_port 3000
    kill_port 5678
    kill_port 9229
    
    echo -e "${GREEN}✓ All services stopped${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Keep script running and show logs
tail -f logs/backend-debug.log logs/frontend-debug.log 2>/dev/null || \
while true; do
    sleep 1
done