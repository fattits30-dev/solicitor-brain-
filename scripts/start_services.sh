#!/bin/bash
set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Starting Solicitor Brain Services${NC}"
echo "================================="

# Function to check service health
check_service() {
    local name=$1
    local url=$2
    local max_attempts=30
    local attempt=1
    
    echo -n "Checking $name..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|404"; then
            echo -e " ${GREEN}OK${NC}"
            return 0
        fi
        
        echo -n "."
        sleep 2
        ((attempt++))
    done
    
    echo -e " ${RED}FAILED${NC}"
    return 1
}

# Start system services
echo "Starting system services..."

# PostgreSQL
if ! systemctl is-active --quiet postgresql; then
    echo "Starting PostgreSQL..."
    sudo systemctl start postgresql
fi

# Redis
if ! systemctl is-active --quiet redis-server; then
    echo "Starting Redis..."
    sudo systemctl start redis-server
fi

# Ollama
if ! systemctl is-active --quiet ollama; then
    echo "Starting Ollama..."
    sudo systemctl start ollama
fi

# ChromaDB
echo "Starting ChromaDB..."
cd /media/mine/AI-DEV/solicitor-brain
if ! pgrep -f "chroma run" > /dev/null; then
    nohup chroma run --path /data/chromadb --host 127.0.0.1 --port 8001 > /logs/chromadb.log 2>&1 &
    echo $! > /tmp/chromadb.pid
fi

# Backend API
echo "Starting Backend API..."
cd /media/mine/AI-DEV/solicitor-brain
if [ -f .venv/bin/activate ]; then
    source .venv/bin/activate
else
    echo -e "${YELLOW}Virtual environment not found. Creating...${NC}"
    python3.11 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
fi

if ! pgrep -f "uvicorn backend.main:app" > /dev/null; then
    nohup uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload > /logs/backend.log 2>&1 &
    echo $! > /tmp/backend.pid
fi

# Frontend
echo "Starting Frontend..."
cd /media/mine/AI-DEV/solicitor-brain/frontend
if [ ! -d node_modules ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    pnpm install
fi

if ! pgrep -f "next dev" > /dev/null; then
    nohup pnpm dev > /logs/frontend.log 2>&1 &
    echo $! > /tmp/frontend.pid
fi

# Wait for services to start
echo -e "\nWaiting for services to be ready..."
sleep 5

# Check service health
echo -e "\nChecking service health..."
check_service "Backend API" "http://localhost:8000/health"
check_service "Frontend" "http://localhost:3000"
check_service "Ollama" "http://localhost:11434/api/tags"

# Start monitoring stack in background
echo -e "\n${YELLOW}To start monitoring stack, run: ./scripts/start_monitoring.sh${NC}"

# Display status
echo -e "\n${GREEN}Services Status:${NC}"
echo "=================="
echo "Frontend:    http://localhost:3000"
echo "Backend API: http://localhost:8000"
echo "API Docs:    http://localhost:8000/docs"
echo "Ollama:      http://localhost:11434"
echo "ChromaDB:    http://localhost:8001"
echo ""
echo "Logs available in /logs/"
echo ""
echo -e "${YELLOW}Banner: AI outputs are organisational assistance only – verify before use.${NC}"