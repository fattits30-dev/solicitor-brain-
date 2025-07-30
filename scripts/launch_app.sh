#!/bin/bash
# Desktop launcher script for Solicitor Brain

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
APP_DIR="$(dirname "$SCRIPT_DIR")"

# Check if services are running
check_service() {
    local url=$1
    curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|404"
}

# Start services if not running
if ! check_service "http://localhost:8000/health"; then
    notify-send "Solicitor Brain" "Starting services..." -i dialog-information
    cd "$APP_DIR"
    ./scripts/start_services.sh &
    
    # Wait for services to start
    for i in {1..30}; do
        if check_service "http://localhost:8000/health"; then
            break
        fi
        sleep 2
    done
fi

# Open in default browser
xdg-open http://localhost:3000

# Show compliance reminder
notify-send "Solicitor Brain" "AI outputs are organisational assistance only – verify before use." -i dialog-warning -t 10000