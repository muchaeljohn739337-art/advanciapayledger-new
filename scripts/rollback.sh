#!/bin/bash

###############################################################################
# Advancia Pay Ledger - Production Rollback Script
# 
# This script safely rolls back to the previous deployment
###############################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="/opt/advancia-production"
BACKUP_DIR="/var/backups/advancia/deployments"
LOG_FILE="/var/log/advancia-rollback.log"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

error() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $*" | tee -a "$LOG_FILE" >&2
}

# Get current version
get_current_version() {
    if [ -f "${APP_DIR}/.version" ]; then
        cat "${APP_DIR}/.version"
    else
        echo "unknown"
    fi
}

# Get previous version
get_previous_version() {
    if [ -f "${BACKUP_DIR}/latest-backup/.version" ]; then
        cat "${BACKUP_DIR}/latest-backup/.version"
    else
        error "No previous version found"
        exit 1
    fi
}

# Confirm rollback
confirm_rollback() {
    local current=$(get_current_version)
    local previous=$(get_previous_version)
    
    log "Current version: $current"
    log "Rolling back to: $previous"
    
    read -p "Are you sure you want to rollback? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        log "Rollback cancelled"
        exit 0
    fi
}

# Stop current services
stop_services() {
    log "Stopping current services..."
    cd "$APP_DIR"
    docker-compose down
    log "Services stopped"
}

# Restore previous version
restore_previous_version() {
    log "Restoring previous version..."
    
    # Backup current version (in case we need to roll forward)
    local timestamp=$(date +%Y%m%d_%H%M%S)
    mkdir -p "${BACKUP_DIR}/failed-${timestamp}"
    cp -r "${APP_DIR}"/* "${BACKUP_DIR}/failed-${timestamp}/"
    
    # Restore previous version
    rm -rf "${APP_DIR}"/*
    cp -r "${BACKUP_DIR}/latest-backup"/* "${APP_DIR}/"
    
    log "Previous version restored"
}

# Restore database to previous state
restore_database() {
    log "WARNING: Database rollback is complex and risky"
    log "Skipping database rollback. Manual intervention may be required."
    
    # Option 1: If you have a pre-deployment backup
    # Uncomment and modify as needed:
    # local backup_file="${BACKUP_DIR}/db-before-deploy.sql.enc.gz"
    # if [ -f "$backup_file" ]; then
    #     log "Found database backup, consider manual restore if needed"
    #     log "Backup location: $backup_file"
    # fi
    
    # Option 2: Rollback migrations
    # cd "$APP_DIR"
    # docker-compose exec -T backend npm run migrate:rollback
}

# Start services with previous version
start_services() {
    log "Starting services with previous version..."
    cd "$APP_DIR"
    docker-compose pull
    docker-compose up -d
    log "Services started"
}

# Health check
verify_rollback() {
    log "Waiting for services to be ready..."
    sleep 30
    
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log "Health check attempt $attempt/$max_attempts"
        
        if curl -f -s https://app.advanciapayledger.com/health > /dev/null; then
            log "✅ Rollback successful - services are healthy"
            return 0
        fi
        
        sleep 5
        attempt=$((attempt + 1))
    done
    
    error "❌ Rollback verification failed - services not responding"
    return 1
}

# Notify team
notify_slack() {
    local status="$1"
    local emoji="${2:-⚠️}"
    
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        curl -s -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{
                \"text\": \"${emoji} Production Rollback: ${status}\",
                \"blocks\": [{
                    \"type\": \"section\",
                    \"text\": {
                        \"type\": \"mrkdwn\",
                        \"text\": \"*Production Rollback*\n*Status:* ${status}\n*Time:* $(date)\n*Server:* $(hostname)\"
                    }
                }]
            }" || true
    fi
}

# Main rollback process
main() {
    log "========================================="
    log "Starting Production Rollback Process"
    log "========================================="
    
    # Confirm
    confirm_rollback
    
    # Notify start
    notify_slack "Rollback initiated" "⚠️"
    
    # Stop services
    stop_services
    
    # Restore code
    restore_previous_version
    
    # Note about database
    restore_database
    
    # Start services
    start_services
    
    # Verify
    if verify_rollback; then
        log "========================================="
        log "Rollback Completed Successfully"
        log "========================================="
        notify_slack "Rollback completed successfully" "✅"
        exit 0
    else
        error "========================================="
        error "Rollback Failed - Manual Intervention Required"
        error "========================================="
        notify_slack "Rollback FAILED - manual intervention required" "❌"
        exit 1
    fi
}

# Run main
main "$@"
