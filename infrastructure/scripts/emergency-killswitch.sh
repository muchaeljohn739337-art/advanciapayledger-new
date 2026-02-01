#!/bin/bash

# Emergency Kill Switch Script
# This script provides manual emergency shutdown capabilities

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/emergency-killswitch.log"
CONFIG_FILE="${SCRIPT_DIR}/killswitch-config.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$LOG_FILE"
}

# Load configuration
load_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        log "INFO" "Loading configuration from $CONFIG_FILE"
        # Source configuration (would contain Azure credentials, etc.)
        # source "$CONFIG_FILE"
    else
        log "WARN" "Configuration file not found: $CONFIG_FILE"
        log "WARN" "Please create configuration file with Azure credentials"
    fi
}

# Check prerequisites
check_prerequisites() {
    log "INFO" "Checking prerequisites..."
    
    # Check if Azure CLI is installed
    if ! command -v az &> /dev/null; then
        log "ERROR" "Azure CLI is not installed"
        exit 1
    fi
    
    # Check if user is logged in to Azure
    if ! az account show &> /dev/null; then
        log "ERROR" "Not logged in to Azure. Run 'az login' first."
        exit 1
    fi
    
    # Check if jq is installed
    if ! command -v jq &> /dev/null; then
        log "ERROR" "jq is not installed"
        exit 1
    fi
    
    log "INFO" "Prerequisites check passed"
}

# Block all inbound traffic
block_traffic() {
    local resource_group=${1:-"rg-prod-advancia"}
    local nsg_name=${2:-"nsg-gateway-prod"}
    
    log "WARN" "🚨 BLOCKING ALL INBOUND TRAFFIC 🚨"
    log "WARN" "Resource Group: $resource_group"
    log "WARN" "NSG: $nsg_name"
    
    # Create emergency deny rule
    az network nsg rule create \
        --resource-group "$resource_group" \
        --nsg-name "$nsg_name" \
        --name "Emergency-Deny-All-Inbound" \
        --access Deny \
        --protocol "*" \
        --direction Inbound \
        --priority 100 \
        --source-address-prefix "*" \
        --source-port-range "*" \
        --destination-address-prefix "*" \
        --destination-port-range "*" \
        --description "Emergency rule to deny all inbound traffic"
    
    if [[ $? -eq 0 ]]; then
        log "SUCCESS" "✓ All inbound traffic blocked"
        return 0
    else
        log "ERROR" "✗ Failed to block traffic"
        return 1
    fi
}

# Restore normal traffic
restore_traffic() {
    local resource_group=${1:-"rg-prod-advancia"}
    local nsg_name=${2:-"nsg-gateway-prod"}
    
    log "INFO" "Restoring normal traffic patterns"
    log "INFO" "Resource Group: $resource_group"
    log "INFO" "NSG: $nsg_name"
    
    # Remove emergency deny rule
    az network nsg rule delete \
        --resource-group "$resource_group" \
        --nsg-name "$nsg_name" \
        --name "Emergency-Deny-All-Inbound" \
        --yes
    
    if [[ $? -eq 0 ]]; then
        log "SUCCESS" "✓ Normal traffic restored"
        return 0
    else
        log "ERROR" "✗ Failed to restore traffic"
        return 1
    fi
}

# Stop all VMs
stop_vms() {
    local resource_group=${1:-"rg-prod-advancia"}
    
    log "WARN" "Stopping all VMs in resource group: $resource_group"
    
    # Get all VMs and stop them
    az vm list --resource-group "$resource_group" --query "[].name" -o tsv | while read -r vm_name; do
        log "INFO" "Stopping VM: $vm_name"
        az vm stop --resource-group "$resource_group" --name "$vm_name" --yes
        if [[ $? -eq 0 ]]; then
            log "SUCCESS" "✓ VM $vm_name stopped"
        else
            log "ERROR" "✗ Failed to stop VM $vm_name"
        fi
    done
}

# Start all VMs
start_vms() {
    local resource_group=${1:-"rg-prod-advancia"}
    
    log "INFO" "Starting all VMs in resource group: $resource_group"
    
    # Get all VMs and start them
    az vm list --resource-group "$resource_group" --query "[].name" -o tsv | while read -r vm_name; do
        log "INFO" "Starting VM: $vm_name"
        az vm start --resource-group "$resource_group" --name "$vm_name"
        if [[ $? -eq 0 ]]; then
            log "SUCCESS" "✓ VM $vm_name started"
        else
            log "ERROR" "✗ Failed to start VM $vm_name"
        fi
    done
}

# Rotate all Key Vault secrets
rotate_secrets() {
    local keyvault_name=${1:-"kv-prod-advancia"}
    
    log "WARN" "🔄 ROTATING ALL KEY VAULT SECRETS 🔄"
    log "WARN" "Key Vault: $keyvault_name"
    
    # Get all secrets
    az keyvault secret list --vault-name "$keyvault_name" --query "[].name" -o tsv | while read -r secret_name; do
        # Skip certificate secrets
        content_type=$(az keyvault secret show --vault-name "$keyvault_name" --name "$secret_name" --query "contentType" -o tsv 2>/dev/null || echo "")
        if [[ "$content_type" == "application/x-pkcs12" ]]; then
            log "INFO" "Skipping certificate secret: $secret_name"
            continue
        fi
        
        # Generate new secret value
        new_secret=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
        
        # Update secret
        az keyvault secret set --vault-name "$keyvault_name" --name "$secret_name" --value "$new_secret"
        
        if [[ $? -eq 0 ]]; then
            log "SUCCESS" "✓ Rotated secret: $secret_name"
        else
            log "ERROR" "✗ Failed to rotate secret: $secret_name"
        fi
    done
}

# Complete emergency shutdown
emergency_shutdown() {
    local resource_group=${1:-"rg-prod-advancia"}
    local nsg_name=${2:-"nsg-gateway-prod"}
    local keyvault_name=${3:-"kv-prod-advancia"}
    
    log "CRITICAL" "🚨🚨 COMPLETE EMERGENCY SHUTDOWN 🚨🚨"
    log "CRITICAL" "This will execute ALL emergency procedures"
    
    echo -e "${RED}WARNING: This will:${NC}"
    echo -e "${RED}1. Block all inbound traffic${NC}"
    echo -e "${RED}2. Stop all VMs${NC}"
    echo -e "${RED}3. Rotate all secrets${NC}"
    echo -e "${RED}4. Create emergency audit log${NC}"
    echo ""
    read -p "Are you absolutely sure? Type 'EMERGENCY' to continue: " confirmation
    
    if [[ "$confirmation" != "EMERGENCY" ]]; then
        log "INFO" "Emergency shutdown cancelled"
        return 1
    fi
    
    # Step 1: Block traffic
    log "INFO" "Step 1: Blocking all inbound traffic..."
    block_traffic "$resource_group" "$nsg_name"
    
    # Step 2: Stop VMs
    log "INFO" "Step 2: Stopping all VMs..."
    stop_vms "$resource_group"
    
    # Step 3: Rotate secrets
    log "INFO" "Step 3: Rotating all secrets..."
    rotate_secrets "$keyvault_name"
    
    # Step 4: Create audit log
    local audit_file="emergency-shutdown-$(date +%Y%m%d-%H%M%S).json"
    cat > "$audit_file" << EOF
{
    "timestamp": "$(date -Iseconds)",
    "action": "COMPLETE_EMERGENCY_SHUTDOWN",
    "resource_group": "$resource_group",
    "nsg_name": "$nsg_name",
    "keyvault_name": "$keyvault_name",
    "initiated_by": "$(whoami)",
    "initiated_from": "$(hostname)",
    "steps_completed": [
        "Blocked all inbound traffic",
        "Stopped all VMs",
        "Rotated all secrets"
    ]
}
EOF
    
    log "CRITICAL" "🚨 COMPLETE EMERGENCY SHUTDOWN COMPLETED 🚨"
    log "INFO" "Audit log created: $audit_file"
}

# System status check
check_status() {
    local resource_group=${1:-"rg-prod-advancia"}
    local nsg_name=${2:-"nsg-gateway-prod"}
    local keyvault_name=${3:-"kv-prod-advancia"}
    
    log "INFO" "Checking system status..."
    
    echo -e "${BLUE}=== Network Security Group Status ===${NC}"
    az network nsg show --resource-group "$resource_group" --name "$nsg_name" --query "securityRules[?name=='Emergency-Deny-All-Inbound']" -o tsv 2>/dev/null || echo "No emergency rule found"
    
    echo -e "${BLUE}=== VM Status ===${NC}"
    az vm list --resource-group "$resource_group" --query "[].{Name:name,PowerState:powerState}" -o table
    
    echo -e "${BLUE}=== Key Vault Status ===${NC}"
    az keyvault show --name "$keyvault_name" --query "{Name:name,Enabled:properties.enabled}" -o table
    
    echo -e "${BLUE}=== Recent Emergency Actions ===${NC}"
    if [[ -f "$LOG_FILE" ]]; then
        tail -20 "$LOG_FILE"
    else
        echo "No emergency log found"
    fi
}

# Send notification
send_notification() {
    local message=${1:-"Emergency action completed"}
    local webhook_url=${2:-""}
    
    if [[ -z "$webhook_url" ]]; then
        log "WARN" "No webhook URL configured for notifications"
        return 1
    fi
    
    local payload=$(cat << EOF
{
    "text": "$message",
    "attachments": [
        {
            "color": "danger",
            "fields": [
                {
                    "title": "Initiated By",
                    "value": "$(whoami)@$(hostname)",
                    "short": true
                },
                {
                    "title": "Timestamp",
                    "value": "$(date -Iseconds)",
                    "short": true
                }
            ]
        }
    ]
}
EOF
    )
    
    curl -X POST -H 'Content-Type: application/json' -d "$payload" "$webhook_url"
    
    if [[ $? -eq 0 ]]; then
        log "INFO" "✓ Notification sent"
    else
        log "ERROR" "✗ Failed to send notification"
    fi
}

# Show help
show_help() {
    cat << EOF
Emergency Kill Switch Script

Usage: $0 <command> [options]

Commands:
    block-traffic [resource-group] [nsg-name]
        Block all inbound traffic to the gateway
    
    restore-traffic [resource-group] [nsg-name]
        Restore normal traffic patterns
    
    stop-vms [resource-group]
        Stop all VMs in the resource group
    
    start-vms [resource-group]
        Start all VMs in the resource group
    
    rotate-secrets [keyvault-name]
        Rotate all secrets in the Key Vault
    
    emergency-shutdown [resource-group] [nsg-name] [keyvault-name]
        Execute complete emergency shutdown
    
    check-status [resource-group] [nsg-name] [keyvault-name]
        Check current system status
    
    notify [message] [webhook-url]
        Send emergency notification

Examples:
    $0 block-traffic rg-prod-advancia nsg-gateway-prod
    $0 emergency-shutdown rg-prod-advancia nsg-gateway-prod kv-prod-advancia
    $0 check-status

WARNING: These actions are irreversible and should only be used in emergency situations.
EOF
}

# Main script logic
main() {
    # Create log file
    mkdir -p "$(dirname "$LOG_FILE")"
    touch "$LOG_FILE"
    
    # Check command
    case "${1:-}" in
        "block-traffic")
            load_config
            check_prerequisites
            block_traffic "${2:-}" "${3:-}"
            ;;
        "restore-traffic")
            load_config
            check_prerequisites
            restore_traffic "${2:-}" "${3:-}"
            ;;
        "stop-vms")
            load_config
            check_prerequisites
            stop_vms "${2:-}"
            ;;
        "start-vms")
            load_config
            check_prerequisites
            start_vms "${2:-}"
            ;;
        "rotate-secrets")
            load_config
            check_prerequisites
            rotate_secrets "${2:-}"
            ;;
        "emergency-shutdown")
            load_config
            check_prerequisites
            emergency_shutdown "${2:-}" "${3:-}" "${4:-}"
            ;;
        "check-status")
            check_status "${2:-}" "${3:-}" "${4:-}"
            ;;
        "notify")
            send_notification "${2:-}" "${3:-}"
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            echo -e "${RED}Error: Unknown command '${1:-}'${NC}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Execute main function
main "$@"
