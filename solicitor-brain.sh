#!/bin/bash
set -euo pipefail

# Solicitor Brain Management Script
# Unified script for managing the entire application

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly MAGENTA='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$SCRIPT_DIR"
readonly FRONTEND_DIR="$PROJECT_ROOT/frontend"
readonly BACKEND_DIR="$PROJECT_ROOT/backend"
readonly SCRIPTS_DIR="$PROJECT_ROOT/scripts"
readonly DATA_DIR="$PROJECT_ROOT/data"
readonly LOGS_DIR="$PROJECT_ROOT/logs"
readonly VENV_DIR="$PROJECT_ROOT/venv"

# PID files
readonly PID_DIR="/tmp/solicitor-brain"
readonly BACKEND_PID="$PID_DIR/backend.pid"
readonly FRONTEND_PID="$PID_DIR/frontend.pid"
readonly CHROMADB_PID="$PID_DIR/chromadb.pid"

# Function to display usage
show_usage() {
    cat << EOF
${GREEN}Solicitor Brain Management Tool${NC}
================================

Usage: $0 <command> [options]

Commands:
  ${CYAN}setup${NC}      - Initial environment setup (install dependencies, create directories)
  ${CYAN}start${NC}      - Start all services
  ${CYAN}stop${NC}       - Stop all services
  ${CYAN}restart${NC}    - Restart all services
  ${CYAN}status${NC}     - Check service status
  ${CYAN}logs${NC}       - Show logs (use -f to follow)
  ${CYAN}dev${NC}        - Start in development mode with hot reload
  ${CYAN}prod${NC}       - Start in production mode
  ${CYAN}test${NC}       - Run all tests
  ${CYAN}update${NC}     - Update system and dependencies
  ${CYAN}backup${NC}     - Backup data and configuration
  ${CYAN}restore${NC}    - Restore from backup
  ${CYAN}clean${NC}      - Clean temporary files and caches
  ${CYAN}doctor${NC}     - Diagnose system issues
  ${CYAN}models${NC}     - Download/update AI models
  ${CYAN}api-test${NC}   - Test API endpoints
  ${CYAN}init-db${NC}    - Initialize database tables
  ${CYAN}debug${NC}      - Advanced debug manager (replaces all debug scripts)

Options:
  -h, --help     Show this help message
  -v, --verbose  Enable verbose output
  -q, --quiet    Suppress output

Examples:
  $0 setup              # Initial setup
  $0 start              # Start all services
  $0 logs -f            # Follow logs
  $0 test               # Run tests
  $0 backup             # Create backup

EOF
}

# Function to print colored messages
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to create necessary directories
create_directories() {
    log_info "Creating directory structure..."
    mkdir -p "$LOGS_DIR"
    mkdir -p "$DATA_DIR"/{cases,chromadb,models,uploads,temp}
    mkdir -p "$PID_DIR"
    mkdir -p "$PROJECT_ROOT"/{quarantine,backups}
}

# Function to check system requirements
check_requirements() {
    local missing_deps=()
    
    log_info "Checking system requirements..."
    
    # Check Python
    if ! command_exists python3.11; then
        missing_deps+=("Python 3.11")
    fi
    
    # Check Node.js
    if ! command_exists node; then
        missing_deps+=("Node.js")
    fi
    
    # Check PostgreSQL
    if ! systemctl is-active --quiet postgresql; then
        log_warning "PostgreSQL is not running"
    fi
    
    # Check Redis
    if ! command_exists redis-server; then
        missing_deps+=("Redis")
    fi
    
    # Check Ollama
    if ! command_exists ollama; then
        missing_deps+=("Ollama")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_error "Missing dependencies: ${missing_deps[*]}"
        log_info "Please install missing dependencies before continuing"
        return 1
    fi
    
    log_success "All requirements satisfied"
    return 0
}

# Function to setup environment
setup_environment() {
    log_info "Setting up Solicitor Brain environment..."
    
    # Check requirements first
    check_requirements || return 1
    
    # Create directories
    create_directories
    
    # Setup Python virtual environment
    if [ ! -d "$VENV_DIR" ]; then
        log_info "Creating Python virtual environment..."
        python3.11 -m venv "$VENV_DIR"
    fi
    
    # Activate venv and install dependencies
    log_info "Installing Python dependencies..."
    source "$VENV_DIR/bin/activate"
    pip install --upgrade pip
    pip install -r "$PROJECT_ROOT/requirements.txt"
    
    # Install frontend dependencies
    log_info "Installing frontend dependencies..."
    cd "$FRONTEND_DIR"
    if command_exists pnpm; then
        pnpm install
    else
        npm install
    fi
    cd "$PROJECT_ROOT"
    
    # Setup database
    setup_database
    
    # Setup configuration
    if [ ! -f "$PROJECT_ROOT/.env" ]; then
        log_info "Creating .env file from template..."
        cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
        log_warning "Please edit .env file with your configuration"
    fi
    
    # Setup systemd services
    setup_systemd_services
    
    log_success "Setup complete!"
}

# Function to setup database
setup_database() {
    log_info "Setting up database..."
    
    # Check if PostgreSQL is running
    if ! systemctl is-active --quiet postgresql; then
        log_error "PostgreSQL is not running. Please start it first."
        return 1
    fi
    
    # Create database and user
    sudo -u postgres psql <<EOF || true
CREATE USER solicitor WITH PASSWORD 'password';
CREATE DATABASE solicitor_brain OWNER solicitor;
GRANT ALL PRIVILEGES ON DATABASE solicitor_brain TO solicitor;
EOF
    
    log_success "Database setup complete"
}

# Function to setup systemd services
setup_systemd_services() {
    log_info "Setting up systemd services..."
    
    # Ollama service
    if [ ! -f /etc/systemd/system/ollama.service ]; then
        sudo tee /etc/systemd/system/ollama.service > /dev/null <<EOF
[Unit]
Description=Ollama Service
After=network-online.target

[Service]
Type=simple
User=$USER
ExecStart=/usr/local/bin/ollama serve
Restart=always
RestartSec=3
Environment="OLLAMA_HOST=0.0.0.0:11434"

[Install]
WantedBy=default.target
EOF
        sudo systemctl daemon-reload
        sudo systemctl enable ollama
    fi
}

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

# Function to start services
start_services() {
    log_info "Starting Solicitor Brain services..."
    
    # Create directories if needed
    create_directories
    
    # Start system services
    log_info "Starting system services..."
    
    # PostgreSQL
    if ! systemctl is-active --quiet postgresql; then
        log_info "Starting PostgreSQL..."
        sudo systemctl start postgresql
    fi
    
    # Redis
    if ! systemctl is-active --quiet redis-server; then
        log_info "Starting Redis..."
        sudo systemctl start redis-server
    fi
    
    # Ollama
    if ! systemctl is-active --quiet ollama; then
        log_info "Starting Ollama..."
        sudo systemctl start ollama
    fi
    
    # ChromaDB
    if [ ! -f "$CHROMADB_PID" ] || ! kill -0 $(cat "$CHROMADB_PID" 2>/dev/null) 2>/dev/null; then
        log_info "Starting ChromaDB..."
        cd "$PROJECT_ROOT"
        nohup chroma run --path "$DATA_DIR/chromadb" --host 127.0.0.1 --port 8001 > "$LOGS_DIR/chromadb.log" 2>&1 &
        echo $! > "$CHROMADB_PID"
    fi
    
    # Backend API
    if [ ! -f "$BACKEND_PID" ] || ! kill -0 $(cat "$BACKEND_PID" 2>/dev/null) 2>/dev/null; then
        log_info "Starting Backend API..."
        cd "$PROJECT_ROOT"
        source "$VENV_DIR/bin/activate"
        nohup uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload > "$LOGS_DIR/backend.log" 2>&1 &
        echo $! > "$BACKEND_PID"
    fi
    
    # Frontend
    if [ ! -f "$FRONTEND_PID" ] || ! kill -0 $(cat "$FRONTEND_PID" 2>/dev/null) 2>/dev/null; then
        log_info "Starting Frontend..."
        cd "$FRONTEND_DIR"
        nohup npm run dev > "$LOGS_DIR/frontend.log" 2>&1 &
        echo $! > "$FRONTEND_PID"
    fi
    
    # Wait for services to start
    log_info "Waiting for services to be ready..."
    sleep 5
    
    # Check service health
    log_info "Checking service health..."
    check_service "Backend API" "http://localhost:8000/health"
    check_service "Frontend" "http://localhost:3000"
    check_service "Ollama" "http://localhost:11434/api/tags"
    
    display_status
}

# Function to stop services
stop_services() {
    log_info "Stopping Solicitor Brain services..."
    
    # Stop frontend
    if [ -f "$FRONTEND_PID" ]; then
        if kill -0 $(cat "$FRONTEND_PID") 2>/dev/null; then
            log_info "Stopping Frontend..."
            kill $(cat "$FRONTEND_PID")
        fi
        rm -f "$FRONTEND_PID"
    fi
    
    # Stop backend
    if [ -f "$BACKEND_PID" ]; then
        if kill -0 $(cat "$BACKEND_PID") 2>/dev/null; then
            log_info "Stopping Backend..."
            kill $(cat "$BACKEND_PID")
        fi
        rm -f "$BACKEND_PID"
    fi
    
    # Stop ChromaDB
    if [ -f "$CHROMADB_PID" ]; then
        if kill -0 $(cat "$CHROMADB_PID") 2>/dev/null; then
            log_info "Stopping ChromaDB..."
            kill $(cat "$CHROMADB_PID")
        fi
        rm -f "$CHROMADB_PID"
    fi
    
    # Kill any remaining processes
    pkill -f "uvicorn backend.main:app" || true
    pkill -f "next dev" || true
    pkill -f "chroma run" || true
    
    log_success "All services stopped"
}

# Function to display status
display_status() {
    echo -e "\n${GREEN}Service Status:${NC}"
    echo "=================="
    
    # Check each service
    if [ -f "$BACKEND_PID" ] && kill -0 $(cat "$BACKEND_PID") 2>/dev/null; then
        echo -e "Backend API:  ${GREEN}●${NC} Running (http://localhost:8000)"
    else
        echo -e "Backend API:  ${RED}●${NC} Stopped"
    fi
    
    if [ -f "$FRONTEND_PID" ] && kill -0 $(cat "$FRONTEND_PID") 2>/dev/null; then
        echo -e "Frontend:     ${GREEN}●${NC} Running (http://localhost:3000)"
    else
        echo -e "Frontend:     ${RED}●${NC} Stopped"
    fi
    
    if systemctl is-active --quiet ollama; then
        echo -e "Ollama:       ${GREEN}●${NC} Running (http://localhost:11434)"
    else
        echo -e "Ollama:       ${RED}●${NC} Stopped"
    fi
    
    if [ -f "$CHROMADB_PID" ] && kill -0 $(cat "$CHROMADB_PID") 2>/dev/null; then
        echo -e "ChromaDB:     ${GREEN}●${NC} Running (http://localhost:8001)"
    else
        echo -e "ChromaDB:     ${RED}●${NC} Stopped"
    fi
    
    if systemctl is-active --quiet postgresql; then
        echo -e "PostgreSQL:   ${GREEN}●${NC} Running"
    else
        echo -e "PostgreSQL:   ${RED}●${NC} Stopped"
    fi
    
    if systemctl is-active --quiet redis-server; then
        echo -e "Redis:        ${GREEN}●${NC} Running"
    else
        echo -e "Redis:        ${RED}●${NC} Stopped"
    fi
    
    echo ""
    echo "Logs available in: $LOGS_DIR/"
    echo ""
    echo -e "${YELLOW}Banner: AI outputs are organisational assistance only – verify before use.${NC}"
}

# Function to show logs
show_logs() {
    local follow=false
    if [ "${1:-}" = "-f" ]; then
        follow=true
    fi
    
    if [ "$follow" = true ]; then
        log_info "Following logs (Ctrl+C to exit)..."
        tail -f "$LOGS_DIR"/*.log
    else
        log_info "Recent logs:"
        tail -n 50 "$LOGS_DIR"/*.log
    fi
}

# Function to run tests
run_tests() {
    log_info "Running tests..."
    
    # Activate virtual environment
    source "$VENV_DIR/bin/activate"
    
    # Backend tests
    log_info "Running backend tests..."
    cd "$PROJECT_ROOT"
    pytest tests/
    
    # Frontend tests
    log_info "Running frontend tests..."
    cd "$FRONTEND_DIR"
    npm test
    
    # Security tests
    log_info "Running security tests..."
    cd "$PROJECT_ROOT"
    python scripts/red_team_test.py
    
    # Compliance checks
    log_info "Running compliance checks..."
    ./scripts/compliance_checker.sh
    
    log_success "All tests completed"
}

# Function to backup data
backup_data() {
    local backup_name="solicitor-brain-backup-$(date +%Y%m%d-%H%M%S)"
    local backup_dir="$PROJECT_ROOT/backups/$backup_name"
    
    log_info "Creating backup: $backup_name"
    
    # Create backup directory
    mkdir -p "$backup_dir"
    
    # Backup database
    log_info "Backing up database..."
    pg_dump -U solicitor solicitor_brain > "$backup_dir/database.sql"
    
    # Backup data files
    log_info "Backing up data files..."
    tar -czf "$backup_dir/data.tar.gz" -C "$PROJECT_ROOT" data/
    
    # Backup configuration
    log_info "Backing up configuration..."
    cp "$PROJECT_ROOT/.env" "$backup_dir/.env.backup"
    
    # Create backup manifest
    cat > "$backup_dir/manifest.json" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": "1.0.0",
  "files": [
    "database.sql",
    "data.tar.gz",
    ".env.backup"
  ]
}
EOF
    
    log_success "Backup completed: $backup_dir"
}

# Function to restore from backup
restore_backup() {
    local backup_dir="${1:-}"
    
    if [ -z "$backup_dir" ]; then
        log_error "Please specify backup directory"
        return 1
    fi
    
    if [ ! -d "$backup_dir" ]; then
        log_error "Backup directory not found: $backup_dir"
        return 1
    fi
    
    log_warning "This will restore from backup and overwrite current data!"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Restore cancelled"
        return 0
    fi
    
    # Stop services
    stop_services
    
    # Restore database
    log_info "Restoring database..."
    psql -U solicitor solicitor_brain < "$backup_dir/database.sql"
    
    # Restore data files
    log_info "Restoring data files..."
    tar -xzf "$backup_dir/data.tar.gz" -C "$PROJECT_ROOT"
    
    # Restore configuration
    log_info "Restoring configuration..."
    cp "$backup_dir/.env.backup" "$PROJECT_ROOT/.env"
    
    log_success "Restore completed"
    
    # Restart services
    start_services
}

# Function to clean temporary files
clean_temp() {
    log_info "Cleaning temporary files..."
    
    # Clean Python cache
    find "$PROJECT_ROOT" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
    find "$PROJECT_ROOT" -type f -name "*.pyc" -delete 2>/dev/null || true
    
    # Clean Next.js cache
    rm -rf "$FRONTEND_DIR/.next"
    
    # Clean temp directory
    rm -rf "$DATA_DIR/temp/*"
    
    # Clean old logs (keep last 7 days)
    find "$LOGS_DIR" -name "*.log" -type f -mtime +7 -delete
    
    log_success "Cleanup completed"
}

# Function to diagnose issues
doctor() {
    log_info "Running system diagnostics..."
    
    echo -e "\n${CYAN}System Information:${NC}"
    echo "OS: $(lsb_release -d | cut -f2)"
    echo "Python: $(python3.11 --version 2>/dev/null || echo 'Not found')"
    echo "Node: $(node --version 2>/dev/null || echo 'Not found')"
    echo "NPM: $(npm --version 2>/dev/null || echo 'Not found')"
    
    echo -e "\n${CYAN}Service Status:${NC}"
    display_status
    
    echo -e "\n${CYAN}Disk Usage:${NC}"
    df -h "$PROJECT_ROOT"
    
    echo -e "\n${CYAN}Memory Usage:${NC}"
    free -h
    
    echo -e "\n${CYAN}GPU Status:${NC}"
    if command_exists rocm-smi; then
        rocm-smi --showtemp --showuse || echo "ROCm tools not available"
    else
        echo "No GPU monitoring tools found"
    fi
    
    echo -e "\n${CYAN}Port Status:${NC}"
    for port in 3000 8000 11434 8001 5432 6379; do
        if nc -z localhost $port 2>/dev/null; then
            echo "Port $port: ${GREEN}Open${NC}"
        else
            echo "Port $port: ${RED}Closed${NC}"
        fi
    done
    
    echo -e "\n${CYAN}Recent Errors:${NC}"
    grep -i error "$LOGS_DIR"/*.log 2>/dev/null | tail -n 10 || echo "No recent errors found"
}

# Function to download/update AI models
manage_models() {
    log_info "Managing AI models..."
    
    # Check if Ollama is running
    if ! systemctl is-active --quiet ollama; then
        log_info "Starting Ollama..."
        sudo systemctl start ollama
        sleep 5
    fi
    
    # Download models
    log_info "Downloading/updating models..."
    
    # Primary model
    ollama pull mistral:7b-instruct-q4_0
    
    # Specialized models (if configured)
    # ollama pull law-model:latest
    
    log_success "Models updated"
}

# Function to start in development mode
start_dev() {
    export NODE_ENV=development
    export DEBUG=true
    start_services
}

# Function to start in production mode
start_prod() {
    export NODE_ENV=production
    export DEBUG=false
    
    # Build frontend
    log_info "Building frontend for production..."
    cd "$FRONTEND_DIR"
    npm run build
    
    # Start services
    start_services
}

# Function to test API endpoints
test_api() {
    log_info "Testing API endpoints..."
    
    local base_url="http://localhost:8000"
    local all_passed=true
    
    # Function to test individual endpoint
    test_endpoint() {
        local method=$1
        local endpoint=$2
        local expected=$3
        local data=${4:-}
        
        echo -n "Testing $method $endpoint... "
        
        local response
        if [ -z "$data" ]; then
            response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$base_url$endpoint" 2>/dev/null)
        else
            response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" \
                -H "Content-Type: application/json" \
                -d "$data" \
                "$base_url$endpoint" 2>/dev/null)
        fi
        
        if [ "$response" = "$expected" ]; then
            echo -e "${GREEN}✓${NC} ($response)"
        else
            echo -e "${RED}✗${NC} (got $response, expected $expected)"
            all_passed=false
        fi
    }
    
    # Test health endpoint
    test_endpoint "GET" "/health" "200"
    
    # Test API endpoints
    test_endpoint "GET" "/api/cases" "200"
    test_endpoint "GET" "/api/documents" "200"
    test_endpoint "GET" "/api/dashboard" "200"
    test_endpoint "GET" "/api/emails" "200"
    test_endpoint "GET" "/api/facts" "200"
    
    # Test WebSocket
    echo -n "Testing WebSocket connection... "
    if timeout 2 curl -s -o /dev/null http://localhost:8000/ws 2>/dev/null; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${YELLOW}WebSocket test requires manual verification${NC}"
    fi
    
    if [ "$all_passed" = true ]; then
        log_success "All API tests passed!"
    else
        log_warning "Some API tests failed"
    fi
}

# Function to initialize database
init_database() {
    log_info "Initializing database tables..."
    
    # Activate virtual environment
    source "$VENV_DIR/bin/activate"
    
    # Run database initialization
    cd "$PROJECT_ROOT"
    python -m backend.scripts.init_db
    
    log_success "Database initialized"
}

# Main script logic
main() {
    cd "$PROJECT_ROOT"
    
    # Parse command
    case "${1:-}" in
        setup)
            setup_environment
            ;;
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            stop_services
            sleep 2
            start_services
            ;;
        status)
            display_status
            ;;
        logs)
            show_logs "${2:-}"
            ;;
        dev)
            start_dev
            ;;
        prod)
            start_prod
            ;;
        test)
            run_tests
            ;;
        update)
            log_info "Updating system..."
            git pull
            setup_environment
            ;;
        backup)
            backup_data
            ;;
        restore)
            restore_backup "${2:-}"
            ;;
        clean)
            clean_temp
            ;;
        doctor)
            doctor
            ;;
        models)
            manage_models
            ;;
        api-test)
            test_api
            ;;
        init-db)
            init_database
            ;;
        debug)
            # Debug command removed - debug.py doesn't exist
            log_error "Debug manager not available"
            log_info "Use 'doctor' command for diagnostics"
            ;;
        -h|--help|help)
            show_usage
            ;;
        *)
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"