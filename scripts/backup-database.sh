#!/bin/bash

###############################################################################
# Advancia Pay Ledger - Automated PostgreSQL Backup Script
# 
# This script:
# - Creates encrypted PostgreSQL backups
# - Uploads to DigitalOcean Spaces (S3-compatible)
# - Maintains retention policy (30 daily, 12 monthly backups)
# - Verifies backup integrity
# - Sends notifications on success/failure
###############################################################################

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/advancia}"
LOG_FILE="/var/log/advancia-backup.log"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATE=$(date +"%Y-%m-%d")
BACKUP_NAME="advancia_backup_${TIMESTAMP}"

# Database configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-advancia}"
DB_USER="${DB_USER:-advancia}"

# S3/Spaces configuration
S3_BUCKET="${S3_BUCKET:-advancia-backups}"
S3_REGION="${S3_REGION:-nyc3}"
S3_ENDPOINT="${S3_ENDPOINT:-https://nyc3.digitaloceanspaces.com}"

# Encryption
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY}"

# Retention
DAILY_RETENTION=30
MONTHLY_RETENTION=12

# Notification
SLACK_WEBHOOK="${SLACK_WEBHOOK_URL:-}"

###############################################################################
# Functions
###############################################################################

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

error() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $*" | tee -a "$LOG_FILE" >&2
}

notify_slack() {
    local message="$1"
    local status="${2:-info}"
    local emoji="ℹ️"
    
    case "$status" in
        success) emoji="✅" ;;
        error) emoji="❌" ;;
        warning) emoji="⚠️" ;;
    esac
    
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -s -X POST "$SLACK_WEBHOOK" \
            -H 'Content-Type: application/json' \
            -d "{\"text\":\"${emoji} ${message}\"}" || true
    fi
}

check_dependencies() {
    local missing=()
    
    for cmd in pg_dump aws openssl gzip; do
        if ! command -v "$cmd" &> /dev/null; then
            missing+=("$cmd")
        fi
    done
    
    if [ ${#missing[@]} -gt 0 ]; then
        error "Missing required commands: ${missing[*]}"
        exit 1
    fi
}

create_backup_dir() {
    mkdir -p "$BACKUP_DIR"
    chmod 700 "$BACKUP_DIR"
}

create_database_backup() {
    log "Starting database backup: $BACKUP_NAME"
    
    local backup_file="${BACKUP_DIR}/${BACKUP_NAME}.sql"
    
    # Create backup with custom format for faster restore
    PGPASSWORD="$DB_PASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --format=custom \
        --compress=9 \
        --verbose \
        --file="$backup_file" 2>&1 | tee -a "$LOG_FILE"
    
    if [ $? -ne 0 ]; then
        error "Database backup failed"
        notify_slack "Database backup failed for $DB_NAME" "error"
        exit 1
    fi
    
    log "Database backup created: $backup_file"
    echo "$backup_file"
}

encrypt_backup() {
    local input_file="$1"
    local output_file="${input_file}.enc"
    
    log "Encrypting backup..."
    
    openssl enc -aes-256-cbc \
        -salt \
        -in "$input_file" \
        -out "$output_file" \
        -k "$ENCRYPTION_KEY" \
        -pbkdf2
    
    if [ $? -ne 0 ]; then
        error "Backup encryption failed"
        notify_slack "Backup encryption failed" "error"
        exit 1
    fi
    
    # Remove unencrypted file
    rm -f "$input_file"
    
    log "Backup encrypted: $output_file"
    echo "$output_file"
}

compress_backup() {
    local input_file="$1"
    local output_file="${input_file}.gz"
    
    log "Compressing backup..."
    
    gzip -9 "$input_file"
    
    if [ $? -ne 0 ]; then
        error "Backup compression failed"
        exit 1
    fi
    
    log "Backup compressed: ${input_file}.gz"
    echo "${input_file}.gz"
}

verify_backup() {
    local backup_file="$1"
    
    log "Verifying backup integrity..."
    
    # Check file size
    local size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file")
    
    if [ "$size" -lt 1000 ]; then
        error "Backup file too small (${size} bytes). Backup likely corrupted."
        return 1
    fi
    
    # Verify it's a valid encrypted file
    if ! file "$backup_file" | grep -q "openssl enc'd data"; then
        error "Backup file does not appear to be encrypted"
        return 1
    fi
    
    log "Backup verification passed (${size} bytes)"
    return 0
}

upload_to_s3() {
    local backup_file="$1"
    local s3_path="s3://${S3_BUCKET}/daily/${DATE}/${BACKUP_NAME}.sql.enc.gz"
    
    log "Uploading to S3: $s3_path"
    
    aws s3 cp "$backup_file" "$s3_path" \
        --endpoint-url "$S3_ENDPOINT" \
        --region "$S3_REGION" \
        --storage-class STANDARD \
        --metadata "created=$(date -u +%Y-%m-%dT%H:%M:%SZ),database=$DB_NAME" \
        2>&1 | tee -a "$LOG_FILE"
    
    if [ $? -ne 0 ]; then
        error "S3 upload failed"
        notify_slack "Backup upload to S3 failed" "error"
        exit 1
    fi
    
    log "Backup uploaded successfully"
}

create_monthly_backup() {
    # On the first day of each month, create a monthly backup
    if [ "$(date +%d)" = "01" ]; then
        local backup_file="$1"
        local month=$(date +"%Y-%m")
        local s3_path="s3://${S3_BUCKET}/monthly/${month}/${BACKUP_NAME}.sql.enc.gz"
        
        log "Creating monthly backup: $s3_path"
        
        aws s3 cp "$backup_file" "$s3_path" \
            --endpoint-url "$S3_ENDPOINT" \
            --region "$S3_REGION" \
            --storage-class GLACIER 2>&1 | tee -a "$LOG_FILE"
    fi
}

cleanup_old_backups() {
    log "Cleaning up old backups..."
    
    # Clean up daily backups older than retention period
    find "$BACKUP_DIR" -name "advancia_backup_*.sql.enc.gz" -mtime +$DAILY_RETENTION -delete
    
    # Clean up S3 daily backups
    local cutoff_date=$(date -d "$DAILY_RETENTION days ago" +%Y-%m-%d 2>/dev/null || date -v-${DAILY_RETENTION}d +%Y-%m-%d)
    
    aws s3 ls "s3://${S3_BUCKET}/daily/" --endpoint-url "$S3_ENDPOINT" --recursive | \
        while read -r line; do
            local s3_file=$(echo "$line" | awk '{print $4}')
            local file_date=$(echo "$s3_file" | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}' | head -1)
            
            if [[ "$file_date" < "$cutoff_date" ]]; then
                log "Deleting old backup: $s3_file"
                aws s3 rm "s3://${S3_BUCKET}/${s3_file}" --endpoint-url "$S3_ENDPOINT"
            fi
        done
    
    log "Cleanup complete"
}

###############################################################################
# Main execution
###############################################################################

main() {
    log "=== Starting Advancia Backup Process ==="
    
    # Pre-flight checks
    check_dependencies
    create_backup_dir
    
    # Create backup
    backup_file=$(create_database_backup)
    
    # Encrypt backup
    encrypted_file=$(encrypt_backup "$backup_file")
    
    # Compress backup
    compressed_file=$(compress_backup "$encrypted_file")
    
    # Verify backup
    if ! verify_backup "$compressed_file"; then
        error "Backup verification failed"
        notify_slack "Backup verification failed" "error"
        exit 1
    fi
    
    # Upload to S3
    upload_to_s3 "$compressed_file"
    
    # Create monthly backup if needed
    create_monthly_backup "$compressed_file"
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Calculate backup size
    backup_size=$(du -h "$compressed_file" | cut -f1)
    
    log "=== Backup Process Completed Successfully ==="
    log "Backup size: $backup_size"
    
    notify_slack "Database backup completed successfully (${backup_size})" "success"
    
    # Optional: Remove local backup after successful upload
    # Uncomment if you want to save disk space
    # rm -f "$compressed_file"
}

# Run main function
main "$@"
