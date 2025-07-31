#!/bin/bash
# Start Ollama with AMD GPU support

echo "Setting up environment for AMD GPU support..."

# Set ROCm environment variables
export HSA_OVERRIDE_GFX_VERSION=10.3.0  # For RX 6600 XT
export ROCM_PATH=/opt/rocm
export HIP_VISIBLE_DEVICES=0
export GPU_DEVICE_ORDINAL=0
export OLLAMA_ROCM=1

# Add ROCm to library path
export LD_LIBRARY_PATH=/opt/rocm/lib:$LD_LIBRARY_PATH

echo "Starting Ollama with GPU support..."
echo "GPU: AMD RX 6600 XT"
echo "Model: Mixtral 8x7B"

# Kill any existing Ollama process
pkill ollama 2>/dev/null
sleep 2

# Start Ollama with GPU support
ollama serve &
OLLAMA_PID=$!

echo "Ollama started with PID: $OLLAMA_PID"
echo "Waiting for Ollama to initialize..."
sleep 5

# Test GPU detection
echo "Testing GPU detection..."
rocm-smi --showtemp --showuse

echo ""
echo "To test the model, run:"
echo "ollama run mixtral:8x7b-instruct-v0.1-q4_0"