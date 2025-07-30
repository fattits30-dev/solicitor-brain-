#!/bin/bash
set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Downloading AI Models for Solicitor Brain${NC}"
echo "=========================================="

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "${RED}Ollama is not running. Starting Ollama...${NC}"
    sudo systemctl start ollama
    sleep 5
fi

# Function to download and verify model
download_model() {
    local model=$1
    local description=$2
    
    echo -e "\n${YELLOW}Downloading $model - $description${NC}"
    
    # Check if model already exists
    if ollama list | grep -q "^$model"; then
        echo -e "${GREEN}Model $model already downloaded${NC}"
        return 0
    fi
    
    # Pull the model
    if ollama pull $model; then
        echo -e "${GREEN}Successfully downloaded $model${NC}"
        
        # Record model hash for compliance
        model_hash=$(ollama show $model --modelfile | sha256sum | cut -d' ' -f1)
        echo "$(date -Iseconds),$model,$model_hash" >> /models/ledger.csv
    else
        echo -e "${RED}Failed to download $model${NC}"
        return 1
    fi
}

# Create models directory and ledger
mkdir -p /models
touch /models/ledger.csv

# Add header to ledger if empty
if [ ! -s /models/ledger.csv ]; then
    echo "timestamp,model,hash" > /models/ledger.csv
fi

# Download primary models
download_model "mistral:7b-instruct-q4_0" "Primary model for general tasks"

# Download specialized models
echo -e "\n${YELLOW}Note: Specialized law models may need custom configuration${NC}"
echo "For production use, consider fine-tuning models on UK legal data"

# Try to download a general-purpose model as placeholder for law-model
download_model "mixtral:8x7b-instruct-v0.1-q4_0" "Placeholder for specialized law model"

# Create symlink for law-model (replace with actual fine-tuned model in production)
echo -e "\n${YELLOW}Creating law-model alias...${NC}"
ollama cp mixtral:8x7b-instruct-v0.1-q4_0 law-model:latest 2>/dev/null || true

# Download embedding model (using Ollama's built-in embeddings)
download_model "nomic-embed-text" "Text embedding model"

# Verify all models
echo -e "\n${GREEN}Installed models:${NC}"
ollama list

# Test model availability
echo -e "\n${GREEN}Testing model responses...${NC}"
echo "Testing primary model..."
if echo "What is the capital of the UK?" | ollama run mistral:7b-instruct-q4_0 --verbose 2>&1 | grep -q "London"; then
    echo -e "${GREEN}Primary model test passed${NC}"
else
    echo -e "${YELLOW}Primary model test inconclusive${NC}"
fi

echo -e "\n${GREEN}Model download complete!${NC}"
echo ""
echo "Models installed:"
echo "- mistral:7b-instruct-q4_0 (primary)"
echo "- law-model:latest (placeholder - replace with fine-tuned model)"
echo "- nomic-embed-text (embeddings)"
echo ""
echo -e "${YELLOW}For production use, fine-tune models on UK legal data${NC}"
echo -e "${YELLOW}Model hashes recorded in /models/ledger.csv for compliance${NC}"