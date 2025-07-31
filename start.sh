#!/bin/bash
# Solicitor Brain - Quick Start Script
# For debugging use: ./launch-with-debugger.sh
# For Electron app use: ./run_electron.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}   Solicitor Brain - Quick Start     ${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Check dependencies
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

# Activate virtual environment
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
else
    echo -e "${YELLOW}Virtual environment not found. Creating...${NC}"
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    cd frontend
    npm install
    cd ..
fi

# Kill any existing processes
echo -e "${BLUE}Cleaning up existing processes...${NC}"
pkill -f "uvicorn.*8000" 2>/dev/null || true
pkill -f "next.*3000" 2>/dev/null || true

# Function to wait for service
wait_for_service() {
    local url=$1
    local service=$2
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|404"; then
            echo -e "${GREEN}✓ $service is ready!${NC}"
            return 0
        fi
        echo -n "."
        sleep 1
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}✗ $service failed to start${NC}"
    return 1
}

# Start backend
echo -e "${BLUE}Starting Backend API...${NC}"
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Start frontend
echo -e "${BLUE}Starting Frontend...${NC}"
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for services
echo ""
echo -e "${BLUE}Waiting for services to start...${NC}"
wait_for_service "http://localhost:8000/health" "Backend API"
wait_for_service "http://localhost:3000" "Frontend"

# Show status
echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}✓ All services started successfully!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo -e "${BLUE}Service URLs:${NC}"
echo -e "  Frontend:   ${GREEN}http://localhost:3000${NC}"
echo -e "  Backend:    ${GREEN}http://localhost:8000${NC}"
echo -e "  API Docs:   ${GREEN}http://localhost:8000/docs${NC}"
echo ""
echo -e "${BLUE}Logs:${NC}"
echo -e "  Backend:    logs/backend.log"
echo -e "  Frontend:   logs/frontend.log"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down services...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    pkill -f "uvicorn.*8000" 2>/dev/null || true
    pkill -f "next.*3000" 2>/dev/null || true
    echo -e "${GREEN}✓ All services stopped${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Keep script running and show logs
tail -f logs/backend.log logs/frontend.log 2>/dev/null || \
while true; do
    sleep 1
done