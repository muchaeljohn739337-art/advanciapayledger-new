#!/bin/bash

# Zero Trust Stack Deployment Script
# This script deploys the complete hardened zero-trust infrastructure

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="/var/log/zero-trust-deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="prod"
LOCATION="eastus"
GITHUB_OWNER=""
GITHUB_REPO=""
ADMIN_SSH_PUBLIC_KEY=""
DEVELOPERS=()
ALERT_EMAIL=""
TEAMS_WEBHOOK=""

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$LOG_FILE"
}

# Usage information
show_usage() {
    cat << EOF
Zero Trust Stack Deployment Script

Usage: $0 [options]

Required Parameters:
  --github-owner TEXT        GitHub repository owner
  --github-repo TEXT         GitHub repository name
  --admin-ssh-key TEXT       Admin SSH public key

Optional Parameters:
  --environment TEXT          Environment name (default: prod)
  --location TEXT            Azure region (default: eastus)
  --developers TEXT           Comma-separated list of developer object IDs
  --alert-email TEXT         Email for alerts
  --teams-webhook TEXT       Teams webhook URL for alerts
  --help                     Show this help message

Examples:
  $0 --github-owner myorg --github-repo advancia-payledger \\
    --admin-ssh-key "ssh-rsa AAAAB3NzaC1yc2E..." \\
    --developers "user1@tenant.com,user2@tenant.com" \\
    --alert-email security@company.com

This script will deploy:
1. Azure Entra ID identity and RBAC configuration
2. Virtual network with 3 security zones
3. Hardened Linux VMs with security hardening
4. Azure Key Vault with RBAC and secret management
5. NGINX gateway with TLS and JWT validation
6. GitHub Actions CI/CD with OIDC authentication
7. Backup strategy and retention policies
8. Emergency kill-switch capabilities
9. Monitoring, logging, and alerting
10. Complete security documentation

WARNING: This will create production infrastructure with associated costs.
EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --github-owner)
                GITHUB_OWNER="$2"
                shift 2
                ;;
            --github-repo)
                GITHUB_REPO="$2"
                shift 2
                ;;
            --admin-ssh-key)
                ADMIN_SSH_PUBLIC_KEY="$2"
                shift 2
                ;;
            --environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --location)
                LOCATION="$2"
                shift 2
                ;;
            --developers)
                IFS=',' read -ra DEVELOPERS <<< "$2"
                shift 2
                ;;
            --alert-email)
                ALERT_EMAIL="$2"
                shift 2
                ;;
            --teams-webhook)
                TEAMS_WEBHOOK="$2"
                shift 2
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                echo -e "${RED}Error: Unknown option $1${NC}"
                show_usage
                exit 1
                ;;
        esac
    done
}

# Validate required parameters
validate_params() {
    local errors=()
    
    if [[ -z "$GITHUB_OWNER" ]]; then
        errors+=("GitHub owner is required (--github-owner)")
    fi
    
    if [[ -z "$GITHUB_REPO" ]]; then
        errors+=("GitHub repository is required (--github-repo)")
    fi
    
    if [[ -z "$ADMIN_SSH_PUBLIC_KEY" ]]; then
        errors+=("Admin SSH public key is required (--admin-ssh-key)")
    fi
    
    if [[ ${#errors[@]} -gt 0 ]]; then
        echo -e "${RED}Validation errors:${NC}"
        for error in "${errors[@]}"; do
            echo -e "${RED}  - $error${NC}"
        done
        echo ""
        show_usage
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log "INFO" "Checking prerequisites..."
    
    # Check Azure CLI
    if ! command -v az &> /dev/null; then
        log "ERROR" "Azure CLI is not installed"
        exit 1
    fi
    
    # Check Bicep
    if ! command -v az bicep &> /dev/null; then
        log "ERROR" "Bicep CLI is not installed"
        exit 1
    fi
    
    # Check Azure login
    if ! az account show &> /dev/null; then
        log "ERROR" "Not logged in to Azure. Run 'az login' first."
        exit 1
    fi
    
    # Check jq
    if ! command -v jq &> /dev/null; then
        log "ERROR" "jq is not installed"
        exit 1
    fi
    
    log "INFO" "Prerequisites check passed"
}

# Create resource group
create_resource_group() {
    local rg_name="rg-${ENVIRONMENT}-advancia"
    
    log "INFO" "Creating resource group: $rg_name"
    
    az group create \
        --name "$rg_name" \
        --location "$LOCATION" \
        --tags \
        Environment="$ENVIRONMENT" \
        Project="Advancia-PayLedger" \
        Stack="Zero-Trust" \
        CreatedBy="$(whoami)" \
        CreatedAt="$(date -Iseconds)"
    
    log "SUCCESS" "Resource group created: $rg_name"
    echo "$rg_name"
}

# Deploy infrastructure
deploy_infrastructure() {
    local rg_name="$1"
    local main_template="$INFRA_DIR/azure/main.bicep"
    
    log "INFO" "Deploying zero-trust infrastructure..."
    log "INFO" "Template: $main_template"
    log "INFO" "Resource Group: $rg_name"
    
    # Prepare deployment parameters
    local params_file="/tmp/deployment-params-$(date +%s).json"
    cat > "$params_file" << EOF
{
  "location": {
    "value": "$LOCATION"
  },
  "environment": {
    "value": "$ENVIRONMENT"
  },
  "githubOwner": {
    "value": "$GITHUB_OWNER"
  },
  "githubRepo": {
    "value": "$GITHUB_REPO"
  },
  "adminSshPublicKey": {
    "value": "$ADMIN_SSH_PUBLIC_KEY"
  },
  "developers": {
    "value": [$(printf '"%s",' "${DEVELOPERS[@]}" | sed 's/,$//')]
  },
  "alertEmail": {
    "value": "$ALERT_EMAIL"
  },
  "teamsWebhook": {
    "value": "$TEAMS_WEBHOOK"
  }
}
EOF
    
    log "INFO" "Starting deployment (this may take 30-45 minutes)..."
    
    # Deploy infrastructure
    local deployment_name="zero-trust-deploy-$(date +%Y%m%d-%H%M%S)"
    az deployment group create \
        --resource-group "$rg_name" \
        --name "$deployment_name" \
        --template-file "$main_template" \
        --parameters "@$params_file" \
        --verbose
    
    local deployment_result=$?
    
    # Clean up parameters file
    rm -f "$params_file"
    
    if [[ $deployment_result -eq 0 ]]; then
        log "SUCCESS" "Infrastructure deployment completed"
    else
        log "ERROR" "Infrastructure deployment failed"
        exit 1
    fi
}

# Verify deployment
verify_deployment() {
    local rg_name="$1"
    
    log "INFO" "Verifying deployment..."
    
    # Check resource group
    if ! az group show --name "$rg_name" &> /dev/null; then
        log "ERROR" "Resource group not found: $rg_name"
        return 1
    fi
    
    # Check key resources
    local resources=(
        "Microsoft.KeyVault/vaults"
        "Microsoft.Network/virtualNetworks"
        "Microsoft.Compute/virtualMachines"
        "Microsoft.Insights/components"
        "Microsoft.OperationalInsights/workspaces"
    )
    
    for resource_type in "${resources[@]}"; do
        local count=$(az resource list --resource-group "$rg_name" --query "[?type=='$resource_type'] | length" -o tsv)
        log "INFO" "$resource_type: $count resources"
    done
    
    log "SUCCESS" "Deployment verification completed"
}

# Generate deployment report
generate_report() {
    local rg_name="$1"
    local report_file="zero-trust-deployment-report-$(date +%Y%m%d-%H%M%S).json"
    
    log "INFO" "Generating deployment report: $report_file"
    
    # Collect deployment information
    local report=$(cat << EOF
{
  "deployment": {
    "timestamp": "$(date -Iseconds)",
    "environment": "$ENVIRONMENT",
    "location": "$LOCATION",
    "resourceGroup": "$rg_name",
    "githubOwner": "$GITHUB_OWNER",
    "githubRepo": "$GITHUB_REPO"
  },
  "resources": {
    "keyVaults": $(az resource list --resource-group "$rg_name" --query "[?type=='Microsoft.KeyVault/vaults'].name" -o tsv | jq -R . | jq -s .),
    "virtualNetworks": $(az resource list --resource-group "$rg_name" --query "[?type=='Microsoft.Network/virtualNetworks'].name" -o tsv | jq -R . | jq -s .),
    "virtualMachines": $(az resource list --resource-group "$rg_name" --query "[?type=='Microsoft.Compute/virtualMachines'].name" -o tsv | jq -R . | jq -s .),
    "applicationInsights": $(az resource list --resource-group "$rg_name" --query "[?type=='Microsoft.Insights/components'].name" -o tsv | jq -R . | jq -s .),
    "logAnalyticsWorkspaces": $(az resource list --resource-group "$rg_name" --query "[?type=='Microsoft.OperationalInsights/workspaces'].name" -o tsv | jq -R . | jq -s .)
  },
  "nextSteps": [
    "Configure monitoring alerts and notifications",
    "Test emergency kill-switch procedures",
    "Conduct security validation testing",
    "Train operations team on procedures",
    "Establish regular security review schedule"
  ]
}
EOF
    )
    
    echo "$report" > "$report_file"
    log "SUCCESS" "Deployment report generated: $report_file"
}

# Show post-deployment information
show_post_deployment_info() {
    local rg_name="$1"
    
    echo ""
    echo -e "${GREEN}🎉 Zero Trust Stack Deployment Complete!${NC}"
    echo ""
    echo -e "${BLUE}Resource Group:${NC} $rg_name"
    echo -e "${BLUE}Environment:${NC} $ENVIRONMENT"
    echo -e "${BLUE}Location:${NC} $LOCATION"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "1. Configure monitoring alerts in Azure Portal"
    echo "2. Test emergency kill-switch procedures"
    echo "3. Validate security controls and access"
    echo "4. Update DNS records for gateway URL"
    echo "5. Configure SSL certificates if using custom domains"
    echo ""
    echo -e "${YELLOW}Important URLs:${NC}"
    echo "Azure Portal: https://portal.azure.com"
    echo "Resource Group: https://portal.azure.com/#resource/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$rg_name/overview"
    echo ""
    echo -e "${YELLOW}Emergency Procedures:${NC}"
    echo "Kill Switch: ./infrastructure/scripts/emergency-killswitch.sh emergency-shutdown"
    echo "Status Check: ./infrastructure/scripts/emergency-killswitch.sh check-status"
    echo ""
    echo -e "${GREEN}Documentation:${NC}"
    echo "Complete Guide: ZERO_TRUST_IMPLEMENTATION_COMPLETE.md"
    echo "Security Policies: infrastructure/docs/security-policies.md"
    echo ""
}

# Main deployment function
main() {
    echo -e "${BLUE}Zero Trust Stack Deployment${NC}"
    echo "====================================="
    
    # Parse arguments
    parse_args "$@"
    
    # Validate parameters
    validate_params
    
    # Check prerequisites
    check_prerequisites
    
    # Create log directory
    mkdir -p "$(dirname "$LOG_FILE")"
    touch "$LOG_FILE"
    
    log "INFO" "Starting zero-trust stack deployment"
    log "INFO" "Environment: $ENVIRONMENT"
    log "INFO" "Location: $LOCATION"
    log "INFO" "GitHub: $GITHUB_OWNER/$GITHUB_REPO"
    
    # Create resource group
    local rg_name=$(create_resource_group)
    
    # Deploy infrastructure
    deploy_infrastructure "$rg_name"
    
    # Verify deployment
    verify_deployment "$rg_name"
    
    # Generate report
    generate_report "$rg_name"
    
    # Show post-deployment information
    show_post_deployment_info "$rg_name"
    
    log "SUCCESS" "Zero-trust stack deployment completed successfully"
}

# Execute main function
main "$@"
