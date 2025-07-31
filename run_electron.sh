#!/bin/bash
# Solicitor Brain Electron App Launcher

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if running in development or production
if [ "$NODE_ENV" = "development" ]; then
    echo "Starting in development mode..."
    
    # Start backend in background
    source venv/bin/activate
    cd backend
    uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    cd ..
    
    # Start frontend dev server
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    
    # Wait a bit for servers to start
    sleep 5
    
    # Start Electron in dev mode
    ELECTRON_START_URL=http://localhost:3000 npm run electron
    
    # Cleanup on exit
    kill $BACKEND_PID $FRONTEND_PID
else
    echo "Starting Solicitor Brain..."
    
    # Build frontend if needed
    if [ ! -d "frontend/out" ]; then
        echo "Building frontend..."
        cd frontend
        npm run build
        cd ..
    fi
    
    # Start Electron app
    cd frontend
    npm run electron
fi