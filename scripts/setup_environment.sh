#!/bin/bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Solicitor Brain Setup Script${NC}"
echo "================================"

# Check if running on Ubuntu 24.04
if ! lsb_release -d | grep -q "Ubuntu 24.04"; then
    echo -e "${YELLOW}Warning: This script is designed for Ubuntu 24.04 LTS${NC}"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check for AMD GPU
echo "Checking for AMD GPU..."
if ! lspci | grep -q "AMD.*\[Radeon\|AMD\]"; then
    echo -e "${YELLOW}Warning: No AMD GPU detected. ROCm features will be disabled.${NC}"
    GPU_AVAILABLE=false
else
    echo -e "${GREEN}AMD GPU detected${NC}"
    GPU_AVAILABLE=true
fi

# Create necessary directories
echo "Creating directory structure..."
sudo mkdir -p /data/{cases,chromadb,models}
sudo mkdir -p /quarantine
sudo mkdir -p /logs
sudo chown -R $USER:$USER /data /quarantine /logs

# Check for Python 3.11
echo "Checking Python installation..."
if ! command -v python3.11 &> /dev/null; then
    echo -e "${RED}Python 3.11 not found. Please install it first.${NC}"
    exit 1
fi

# Check for Node.js
echo "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js not found. Please install it first.${NC}"
    exit 1
fi

# Install Ollama
echo "Installing Ollama..."
if ! command -v ollama &> /dev/null; then
    curl -fsSL https://ollama.ai/install.sh | sh
else
    echo "Ollama already installed"
fi

# Create Ollama service
echo "Setting up Ollama service..."
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
sudo systemctl start ollama

# Setup PostgreSQL
echo "Setting up PostgreSQL..."
if ! systemctl is-active --quiet postgresql; then
    echo -e "${RED}PostgreSQL is not running. Please install and start it first.${NC}"
    exit 1
fi

# Create database and user
sudo -u postgres psql <<EOF || true
CREATE USER solicitor WITH PASSWORD 'password';
CREATE DATABASE solicitor_brain OWNER solicitor;
GRANT ALL PRIVILEGES ON DATABASE solicitor_brain TO solicitor;
EOF

# Setup Redis
echo "Checking Redis..."
if ! command -v redis-server &> /dev/null; then
    echo -e "${YELLOW}Redis not found. Installing...${NC}"
    sudo apt-get update && sudo apt-get install -y redis-server
fi

# Configure UFW firewall
echo "Configuring firewall..."
sudo ufw allow from 127.0.0.1 to any port 3000 comment 'Frontend'
sudo ufw allow from 127.0.0.1 to any port 8000 comment 'Backend API'
sudo ufw allow from 127.0.0.1 to any port 11434 comment 'Ollama'
sudo ufw allow from 127.0.0.1 to any port 8001 comment 'ChromaDB'
sudo ufw allow from 127.0.0.1 to any port 9090 comment 'Prometheus'
sudo ufw allow from 127.0.0.1 to any port 3001 comment 'Grafana'

# Setup environment file
echo "Creating environment configuration..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${YELLOW}Please edit .env file with your configuration${NC}"
fi

# Create log rotation config
echo "Setting up log rotation..."
sudo tee /etc/logrotate.d/solicitor-brain > /dev/null <<EOF
/logs/*.log {
    monthly
    rotate 84
    compress
    delaycompress
    notifempty
    create 0640 $USER $USER
    sharedscripts
    postrotate
        # Make logs immutable after rotation
        chattr +i /logs/*.log.1
    endscript
}
EOF

# GPU-specific setup
if [ "$GPU_AVAILABLE" = true ]; then
    echo "Setting up GPU monitoring..."
    # Check if rocm-smi is available
    if command -v rocm-smi &> /dev/null; then
        echo -e "${GREEN}ROCm tools detected${NC}"
    else
        echo -e "${YELLOW}ROCm tools not found. GPU monitoring will be limited.${NC}"
    fi
fi

echo -e "${GREEN}Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Edit the .env file with your configuration"
echo "2. Run ./scripts/download_models.sh to download AI models"
echo "3. Run ./scripts/start_services.sh to start all services"
echo ""
echo -e "${YELLOW}Remember to configure your email settings and encryption keys in .env${NC}"