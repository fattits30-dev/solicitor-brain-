#!/bin/bash
# Setup cron jobs for idle worker tasks

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
IDLE_WORKER="$SCRIPT_DIR/idle_worker.sh"

echo "Setting up cron jobs for Solicitor Brain idle worker..."

# Create cron entries
CRON_JOBS="
# Solicitor Brain Idle Worker Tasks
0 22 * * * $IDLE_WORKER  # Deep fact-check at 22:00
30 0 * * * $IDLE_WORKER  # Vector re-index at 00:30
0 2 * * * $IDLE_WORKER   # ClamAV scan at 02:00
0 3 * * * $IDLE_WORKER   # Off-site backup at 03:00
0 4 * * * $IDLE_WORKER   # Metrics and reports at 04:00
"

# Add to current user's crontab
(crontab -l 2>/dev/null | grep -v "solicitor-brain/scripts/idle_worker.sh" ; echo "$CRON_JOBS") | crontab -

echo "Cron jobs installed. Current crontab:"
crontab -l | grep idle_worker.sh

echo ""
echo "To monitor cron execution:"
echo "  tail -f /logs/idle_worker_*.log"
echo ""
echo "To disable cron jobs:"
echo "  crontab -e  # and remove the Solicitor Brain entries"