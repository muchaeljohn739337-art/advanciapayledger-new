#!/bin/bash

# Deployment Preparation Script
# This script helps you gather the required information for zero-trust deployment

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Zero Trust Stack - Deployment Preparation${NC}"
echo "=========================================="
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Error: Azure CLI is not installed${NC}"
    echo "Please install it from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}You need to log in to Azure first${NC}"
    echo "Running: az login"
    az login
fi

# Get current subscription
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
SUBSCRIPTION_NAME=$(az account show --query name -o tsv)
TENANT_ID=$(az account show --query tenantId -o tsv)

echo -e "${GREEN}✓ Azure Login Successful${NC}"
echo "  Subscription: $SUBSCRIPTION_NAME"
echo "  Subscription ID: $SUBSCRIPTION_ID"
echo "  Tenant ID: $TENANT_ID"
echo ""

# Gather GitHub information
echo -e "${BLUE}GitHub Repository Information${NC}"
echo "----------------------------"
read -p "GitHub Owner/Organization: " GITHUB_OWNER
read -p "GitHub Repository Name: " GITHUB_REPO
echo ""

# SSH Key
echo -e "${BLUE}SSH Public Key for VM Access${NC}"
echo "----------------------------"
echo "You need an SSH public key for VM access."
echo ""

# Check for existing SSH keys
if [ -f "$HOME/.ssh/id_rsa.pub" ]; then
    echo -e "${GREEN}Found existing SSH key: $HOME/.ssh/id_rsa.pub${NC}"
    read -p "Use this key? (y/n): " use_existing
    if [[ "$use_existing" == "y" ]]; then
        SSH_PUBLIC_KEY=$(cat "$HOME/.ssh/id_rsa.pub")
    else
        read -p "Enter your SSH public key: " SSH_PUBLIC_KEY
    fi
elif [ -f "$HOME/.ssh/id_ed25519.pub" ]; then
    echo -e "${GREEN}Found existing SSH key: $HOME/.ssh/id_ed25519.pub${NC}"
    read -p "Use this key? (y/n): " use_existing
    if [[ "$use_existing" == "y" ]]; then
        SSH_PUBLIC_KEY=$(cat "$HOME/.ssh/id_ed25519.pub")
    else
        read -p "Enter your SSH public key: " SSH_PUBLIC_KEY
    fi
else
    echo -e "${YELLOW}No SSH key found. Generating new key...${NC}"
    ssh-keygen -t ed25519 -C "azure-vm-access" -f "$HOME/.ssh/azure_vm_key" -N ""
    SSH_PUBLIC_KEY=$(cat "$HOME/.ssh/azure_vm_key.pub")
    echo -e "${GREEN}✓ New SSH key generated: $HOME/.ssh/azure_vm_key${NC}"
fi
echo ""

# Developer access
echo -e "${BLUE}Developer Access (Optional)${NC}"
echo "----------------------------"
echo "Enter developer email addresses (Azure AD users) for Key Vault access."
echo "Press Enter without input when done."
DEVELOPERS=()
while true; do
    read -p "Developer email (or Enter to skip): " dev_email
    if [[ -z "$dev_email" ]]; then
        break
    fi
    DEVELOPERS+=("$dev_email")
done
echo ""

# Alert configuration
echo -e "${BLUE}Alert Configuration (Optional)${NC}"
echo "----------------------------"
read -p "Alert email address (or Enter to skip): " ALERT_EMAIL
read -p "Teams webhook URL (or Enter to skip): " TEAMS_WEBHOOK
echo ""

# Environment selection
echo -e "${BLUE}Environment Configuration${NC}"
echo "----------------------------"
read -p "Environment name (default: prod): " ENVIRONMENT
ENVIRONMENT=${ENVIRONMENT:-prod}

read -p "Azure region (default: eastus): " LOCATION
LOCATION=${LOCATION:-eastus}
echo ""

# Generate deployment command
echo -e "${GREEN}=== Deployment Command ===${NC}"
echo ""

DEPLOY_CMD="./infrastructure/scripts/deploy-zero-trust.sh \\"
DEPLOY_CMD+="\n  --github-owner \"$GITHUB_OWNER\" \\"
DEPLOY_CMD+="\n  --github-repo \"$GITHUB_REPO\" \\"
DEPLOY_CMD+="\n  --admin-ssh-key \"$SSH_PUBLIC_KEY\" \\"
DEPLOY_CMD+="\n  --environment \"$ENVIRONMENT\" \\"
DEPLOY_CMD+="\n  --location \"$LOCATION\""

if [[ ${#DEVELOPERS[@]} -gt 0 ]]; then
    DEV_LIST=$(IFS=,; echo "${DEVELOPERS[*]}")
    DEPLOY_CMD+="\n  --developers \"$DEV_LIST\""
fi

if [[ -n "$ALERT_EMAIL" ]]; then
    DEPLOY_CMD+="\n  --alert-email \"$ALERT_EMAIL\""
fi

if [[ -n "$TEAMS_WEBHOOK" ]]; then
    DEPLOY_CMD+="\n  --teams-webhook \"$TEAMS_WEBHOOK\""
fi

echo -e "$DEPLOY_CMD"
echo ""

# Save to file
DEPLOY_FILE="deploy-command-$(date +%Y%m%d-%H%M%S).sh"
echo -e "$DEPLOY_CMD" > "$DEPLOY_FILE"
chmod +x "$DEPLOY_FILE"

echo -e "${GREEN}✓ Deployment command saved to: $DEPLOY_FILE${NC}"
echo ""

# GitHub OIDC setup reminder
echo -e "${YELLOW}⚠️  Important: GitHub OIDC Setup Required${NC}"
echo "Before deployment, you need to set up GitHub OIDC authentication."
echo ""
echo "Run these commands to create the Azure AD application:"
echo ""
echo -e "${BLUE}# Create Azure AD application for GitHub OIDC${NC}"
echo "APP_NAME=\"github-oidc-advancia-\$ENVIRONMENT\""
echo "APP_ID=\$(az ad app create --display-name \"\$APP_NAME\" --query appId -o tsv)"
echo ""
echo -e "${BLUE}# Create service principal${NC}"
echo "az ad sp create --id \"\$APP_ID\""
echo ""
echo -e "${BLUE}# Add federated credential for GitHub${NC}"
echo "az ad app federated-credential create \\"
echo "  --id \"\$APP_ID\" \\"
echo "  --parameters '{\"name\":\"github-deploy\",\"issuer\":\"https://token.actions.githubusercontent.com\",\"subject\":\"repo:$GITHUB_OWNER/$GITHUB_REPO:ref:refs/heads/main\",\"audiences\":[\"api://AzureADTokenExchange\"]}'"
echo ""
echo -e "${BLUE}# Assign Contributor role${NC}"
echo "az role assignment create \\"
echo "  --assignee \"\$APP_ID\" \\"
echo "  --role Contributor \\"
echo "  --scope \"/subscriptions/$SUBSCRIPTION_ID\""
echo ""
echo "Then add these secrets to your GitHub repository:"
echo "  AZURE_CLIENT_ID: \$APP_ID"
echo "  AZURE_TENANT_ID: $TENANT_ID"
echo "  AZURE_SUBSCRIPTION_ID: $SUBSCRIPTION_ID"
echo ""

# Confirmation
echo -e "${YELLOW}Ready to deploy?${NC}"
read -p "Run deployment now? (y/n): " run_now

if [[ "$run_now" == "y" ]]; then
    echo ""
    echo -e "${GREEN}Starting deployment...${NC}"
    bash -c "$DEPLOY_CMD"
else
    echo ""
    echo -e "${YELLOW}Deployment command saved. Run it when ready:${NC}"
    echo "  ./$DEPLOY_FILE"
fi
