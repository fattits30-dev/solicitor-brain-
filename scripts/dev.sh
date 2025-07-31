#!/bin/bash
# Simplified development script for Solicitor Brain
# Combines database setup, service startup, and testing

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Change to project root
cd "$PROJECT_ROOT"

# Function to show usage
show_usage() {
    echo -e "${CYAN}Solicitor Brain Development Helper${NC}"
    echo "==================================="
    echo
    echo "Usage: $0 <command>"
    echo
    echo "Commands:"
    echo "  setup    - Quick setup (db, venv, deps)"
    echo "  start    - Start all services for development"
    echo "  db       - Initialize/reset database"
    echo "  test     - Run quick tests"
    echo "  api      - Test API endpoints"
    echo "  clean    - Clean and restart"
    echo
}

# Function to kill existing processes
kill_existing() {
    echo "Cleaning up old processes..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    pkill -f "uvicorn backend.main:app" 2>/dev/null || true
    pkill -f "npm run dev" 2>/dev/null || true
}

# Function to ensure database exists
ensure_db() {
    echo -e "${CYAN}Checking PostgreSQL database...${NC}"
    
    # Start PostgreSQL if not running
    if ! systemctl is-active --quiet postgresql; then
        echo "Starting PostgreSQL..."
        echo "0" | sudo -S systemctl start postgresql
        sleep 2
    fi
    
    # Check if database exists
    if echo "0" | sudo -S -u postgres psql -lqt | cut -d \| -f 1 | grep -qw solicitor_brain; then
        echo -e "${GREEN}✓ Database 'solicitor_brain' exists${NC}"
    else
        echo "Creating database 'solicitor_brain'..."
        echo "0" | sudo -S -u postgres createdb solicitor_brain
        echo "0" | sudo -S -u postgres psql -c "CREATE USER solicitor_user WITH PASSWORD 'your_password';" 2>/dev/null || true
        echo -e "${GREEN}✓ Database created${NC}"
    fi
    
    # Grant privileges
    echo "0" | sudo -S -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE solicitor_brain TO solicitor_user;" 2>/dev/null || true
    
    # Initialize tables
    if [ -f venv/bin/activate ]; then
        source venv/bin/activate
        echo "Initializing database tables..."
        python -m backend.scripts.init_db
        echo -e "${GREEN}✓ Database ready${NC}"
    fi
}

# Function to setup environment
setup_env() {
    echo -e "${CYAN}Setting up development environment...${NC}"
    
    # Create virtual environment if needed
    if [ ! -d venv ]; then
        echo "Creating virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate and install dependencies
    source venv/bin/activate
    echo "Installing Python dependencies..."
    pip install -q --upgrade pip
    pip install -q -r requirements.txt
    
    # Install frontend dependencies if needed
    if [ ! -d frontend/node_modules ]; then
        echo "Installing frontend dependencies..."
        cd frontend && npm install && cd ..
    fi
    
    # Setup database
    ensure_db
    
    echo -e "${GREEN}✅ Environment ready!${NC}"
}

# Function to start services
start_services() {
    echo -e "${CYAN}Starting development services...${NC}"
    
    # Kill existing processes
    kill_existing
    
    # Ensure database is ready
    ensure_db
    
    # Start Redis if not running
    if ! pgrep -x redis-server > /dev/null; then
        echo "Starting Redis..."
        redis-server --daemonize yes
    fi
    
    # Start Ollama if not running
    if ! pgrep ollama > /dev/null; then
        echo "Starting Ollama..."
        ollama serve > /dev/null 2>&1 &
        sleep 2
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Start backend
    echo -e "${CYAN}Starting backend on http://localhost:8000${NC}"
    cd "$PROJECT_ROOT"
    uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000 > logs/backend.log 2>&1 &
    BACKEND_PID=$!
    
    # Start frontend
    echo -e "${CYAN}Starting frontend on http://localhost:3000${NC}"
    cd frontend
    npm run dev > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..
    
    # Wait for services to start
    echo -n "Waiting for services"
    for i in {1..10}; do
        if curl -s http://localhost:8000/health > /dev/null 2>&1; then
            echo -e " ${GREEN}✓${NC}"
            break
        fi
        echo -n "."
        sleep 2
    done
    
    echo
    echo -e "${GREEN}✅ All services running!${NC}"
    echo
    echo "  Backend:  http://localhost:8000"
    echo "  API Docs: http://localhost:8000/docs"
    echo "  Frontend: http://localhost:3000"
    echo
    echo "Logs: tail -f logs/*.log"
    echo "Stop: Ctrl+C or kill PIDs: $BACKEND_PID $FRONTEND_PID"
    echo
    echo -e "${YELLOW}AI outputs are organisational assistance only – verify before use.${NC}"
}

# Function to test API
test_api() {
    echo -e "${CYAN}Testing API endpoints...${NC}"
    
    # Simple endpoint tests
    for endpoint in health api/cases api/documents api/dashboard; do
        echo -n "Testing /$endpoint... "
        status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/$endpoint)
        if [ "$status" = "200" ]; then
            echo -e "${GREEN}✓${NC} ($status)"
        else
            echo -e "${RED}✗${NC} ($status)"
        fi
    done
}

# Function to run quick tests
run_tests() {
    echo -e "${CYAN}Running quick tests...${NC}"
    
    source venv/bin/activate
    
    # Check Python syntax
    echo "Checking Python syntax..."
    python -m py_compile backend/**/*.py
    
    # Run basic tests
    if [ -d tests ]; then
        echo "Running pytest..."
        pytest tests/ -v --tb=short || true
    fi
    
    # Check frontend build
    echo "Checking frontend build..."
    cd frontend && npm run build --quiet && cd ..
    
    echo -e "${GREEN}✓ Tests complete${NC}"
}

# Function to clean and restart
clean_restart() {
    echo -e "${CYAN}Cleaning and restarting...${NC}"
    
    # Kill processes
    kill_existing
    
    # Clean Python cache
    find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
    find . -type f -name "*.pyc" -delete 2>/dev/null || true
    
    # Clean frontend cache
    rm -rf frontend/.next
    
    # Restart services
    start_services
}

# Main logic
case "${1:-help}" in
    setup)
        setup_env
        ;;
    start)
        start_services
        # Keep script running
        wait
        ;;
    db)
        ensure_db
        ;;
    test)
        run_tests
        ;;
    api)
        test_api
        ;;
    clean)
        clean_restart
        wait
        ;;
    help|*)
        show_usage
        ;;
esac