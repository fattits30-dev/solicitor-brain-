#!/bin/bash
# Idle Worker Script - Runs nightly background tasks
# Called by cron at scheduled times

set -euo pipefail

LOG_DIR="/logs"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
LOG_FILE="$LOG_DIR/idle_worker_$TIMESTAMP.log"

# Redirect all output to log file
exec > >(tee -a "$LOG_FILE")
exec 2>&1

echo "=== Idle Worker Started at $(date) ==="

# Function to log with timestamp
log() {
    echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1"
}

# Function to limit GPU usage
limit_gpu() {
    local max_percent=$1
    export CUDA_FRACTION=$(echo "scale=2; $max_percent/100" | bc)
    export ROCM_VISIBLE_DEVICES=0
    log "GPU usage limited to $max_percent%"
}

# Get current hour
HOUR=$(date +"%H")

case "$HOUR" in
    "22")
        log "Starting deep fact-check task"
        limit_gpu 60
        cd /media/mine/AI-DEV/solicitor-brain
        source .venv/bin/activate
        python -m backend.services.fact_checker --deep-scan --all-cases
        ;;
    
    "00")
        log "Starting vector re-indexing"
        limit_gpu 60
        cd /media/mine/AI-DEV/solicitor-brain
        source .venv/bin/activate
        python -m backend.services.vector_index --rebuild
        ;;
    
    "02")
        log "Starting ClamAV scan"
        # Update virus definitions
        freshclam
        
        # Scan uploads directory
        clamscan -r --move=/quarantine /data/uploads/ --log="$LOG_DIR/clamav_$TIMESTAMP.log"
        
        # Scan case documents
        clamscan -r --move=/quarantine /data/cases/ --exclude-dir=/data/cases/*/vectors/ --log="$LOG_DIR/clamav_cases_$TIMESTAMP.log"
        ;;
    
    "03")
        log "Starting off-site backup"
        # Ensure backup destination is mounted
        if ! mountpoint -q /mnt/backup; then
            log "ERROR: Backup destination not mounted"
            exit 1
        fi
        
        # Encrypted rsync to off-site location
        rsync -avz --delete \
            --exclude='*.tmp' \
            --exclude='*.log' \
            --exclude='/data/chromadb/wal/*' \
            -e "ssh -i /home/$USER/.ssh/backup_key" \
            /data/ backup@uk-datacenter.example.com:/backups/solicitor-brain/
        
        # Verify backup integrity
        log "Verifying backup integrity"
        ssh -i /home/$USER/.ssh/backup_key backup@uk-datacenter.example.com \
            "cd /backups/solicitor-brain && sha256sum -c checksums.txt"
        ;;
    
    "04")
        log "Starting metrics collection and report"
        cd /media/mine/AI-DEV/solicitor-brain
        source .venv/bin/activate
        
        # Collect KPI metrics
        python -m backend.services.metrics_collector --generate-report
        
        # Update compliance matrix
        python -m backend.services.compliance_updater
        
        # Clean old logs (keep 7 years as per requirement)
        find $LOG_DIR -name "*.log" -mtime +2555 -delete
        ;;
    
    *)
        log "No tasks scheduled for hour $HOUR"
        ;;
esac

# Common tasks run every time

# Update model hash ledger
log "Updating model hash ledger"
cd /media/mine/AI-DEV/solicitor-brain
for model in $(ollama list | tail -n +2 | awk '{print $1}'); do
    hash=$(ollama show $model --modelfile | sha256sum | cut -d' ' -f1)
    if ! grep -q "$model.*$hash" /models/ledger.csv; then
        echo "$(date -Iseconds),$model,$hash" >> /models/ledger.csv
        log "Updated hash for model: $model"
    fi
done

# Check disk space
DISK_USAGE=$(df -h /data | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    log "WARNING: Disk usage is $DISK_USAGE%"
    # Send alert (implement your notification method)
fi

# Make today's logs immutable (yesterday's logs)
YESTERDAY=$(date -d "yesterday" +"%Y-%m-%d")
find $LOG_DIR -name "*$YESTERDAY*.log" -exec chattr +i {} \;
log "Made yesterday's logs immutable"

log "=== Idle Worker Completed at $(date) ==="