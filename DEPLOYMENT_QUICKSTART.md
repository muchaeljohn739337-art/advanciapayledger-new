# Zero Trust Stack - Deployment Quick Start

## 🚀 Quick Deployment Guide

This guide will help you deploy the complete zero-trust infrastructure stack to Azure.

## Prerequisites

1. **Azure CLI** - Install from [here](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
2. **Azure Subscription** - Active Azure subscription with Owner or Contributor access
3. **GitHub Repository** - Repository where the code is hosted
4. **SSH Key** - For VM access (can be generated during setup)

## Step 1: Prepare Your Environment

### Option A: Interactive Setup (Recommended)

Run the interactive preparation script:

```bash
cd infrastructure/scripts
chmod +x prepare-deployment.sh
./prepare-deployment.sh
```

This script will:
- Check Azure CLI installation
- Log you into Azure
- Gather all required information interactively
- Generate the deployment command
- Optionally run the deployment

### Option B: Manual Setup

If you prefer to gather information manually, you'll need:

1. **GitHub Information:**
   - GitHub Owner/Organization name
   - Repository name

2. **SSH Public Key:**
   ```bash
   # Generate new key if needed
   ssh-keygen -t ed25519 -C "azure-vm-access" -f ~/.ssh/azure_vm_key
   
   # View your public key
   cat ~/.ssh/azure_vm_key.pub
   ```

3. **Azure Information:**
   ```bash
   # Get your subscription ID
   az account show --query id -o tsv
   
   # Get your tenant ID
   az account show --query tenantId -o tsv
   ```

4. **Developer Access (Optional):**
   - List of Azure AD user email addresses for Key Vault access

5. **Alert Configuration (Optional):**
   - Email address for security alerts
   - Teams webhook URL for notifications

## Step 2: Set Up GitHub OIDC Authentication

Before deployment, configure GitHub OIDC for secure CI/CD:

```bash
# Set your variables
GITHUB_OWNER="your-github-org"
GITHUB_REPO="advancia-payledger"
ENVIRONMENT="prod"

# Create Azure AD application
APP_NAME="github-oidc-advancia-${ENVIRONMENT}"
APP_ID=$(az ad app create --display-name "$APP_NAME" --query appId -o tsv)

# Create service principal
az ad sp create --id "$APP_ID"

# Add federated credential for GitHub
az ad app federated-credential create \
  --id "$APP_ID" \
  --parameters "{
    \"name\":\"github-deploy\",
    \"issuer\":\"https://token.actions.githubusercontent.com\",
    \"subject\":\"repo:${GITHUB_OWNER}/${GITHUB_REPO}:ref:refs/heads/main\",
    \"audiences\":[\"api://AzureADTokenExchange\"]
  }"

# Get subscription and tenant IDs
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
TENANT_ID=$(az account show --query tenantId -o tsv)

# Assign Contributor role
az role assignment create \
  --assignee "$APP_ID" \
  --role Contributor \
  --scope "/subscriptions/$SUBSCRIPTION_ID"

# Display the values for GitHub secrets
echo "Add these secrets to your GitHub repository:"
echo "AZURE_CLIENT_ID: $APP_ID"
echo "AZURE_TENANT_ID: $TENANT_ID"
echo "AZURE_SUBSCRIPTION_ID: $SUBSCRIPTION_ID"
```

### Add Secrets to GitHub

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add the following secrets:
   - `AZURE_CLIENT_ID`: The APP_ID from above
   - `AZURE_TENANT_ID`: Your Azure tenant ID
   - `AZURE_SUBSCRIPTION_ID`: Your Azure subscription ID

## Step 3: Deploy the Infrastructure

### Using the Deployment Script

```bash
cd infrastructure/scripts
chmod +x deploy-zero-trust.sh

./deploy-zero-trust.sh \
  --github-owner "your-github-org" \
  --github-repo "advancia-payledger" \
  --admin-ssh-key "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  --environment "prod" \
  --location "eastus" \
  --developers "dev1@company.com,dev2@company.com" \
  --alert-email "security@company.com" \
  --teams-webhook "https://outlook.office.com/webhook/..."
```

### Deployment Parameters

| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `--github-owner` | ✅ Yes | GitHub organization/owner | `mycompany` |
| `--github-repo` | ✅ Yes | Repository name | `advancia-payledger` |
| `--admin-ssh-key` | ✅ Yes | SSH public key for VM access | `ssh-ed25519 AAAAC3...` |
| `--environment` | No | Environment name | `prod` (default) |
| `--location` | No | Azure region | `eastus` (default) |
| `--developers` | No | Comma-separated developer emails | `user1@company.com,user2@company.com` |
| `--alert-email` | No | Email for security alerts | `security@company.com` |
| `--teams-webhook` | No | Teams webhook for notifications | `https://outlook.office.com/webhook/...` |

### Deployment Time

The deployment typically takes **30-45 minutes** and includes:
- Identity and RBAC setup (5 min)
- Network infrastructure (5 min)
- Compute resources (10 min)
- Security configuration (10 min)
- Monitoring setup (5 min)
- Validation and testing (5 min)

## Step 4: Verify Deployment

After deployment completes, verify the infrastructure:

```bash
# Check resource group
az group show --name rg-prod-advancia

# List all resources
az resource list --resource-group rg-prod-advancia --output table

# Check VM status
az vm list --resource-group rg-prod-advancia --query "[].{Name:name,Status:powerState}" --output table

# Check Key Vault
az keyvault list --resource-group rg-prod-advancia --output table

# Check Network Security Groups
az network nsg list --resource-group rg-prod-advancia --output table
```

## Step 5: Post-Deployment Configuration

### 1. Configure Monitoring Alerts

```bash
# Navigate to Azure Portal
# Go to Monitor → Alerts
# Review and configure alert rules
```

### 2. Test Emergency Kill Switch

```bash
# Test kill switch (dry run - won't actually execute)
./infrastructure/scripts/emergency-killswitch.sh check-status
```

### 3. Update DNS Records

If using custom domains, update your DNS records to point to the gateway:

```bash
# Get gateway public IP
az network public-ip show \
  --resource-group rg-prod-advancia \
  --name pip-gateway-prod \
  --query ipAddress -o tsv
```

### 4. Configure SSL Certificates

For production domains, configure SSL certificates:

```bash
# Option 1: Use Let's Encrypt (automated)
# SSH into gateway VM and run:
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Option 2: Upload custom certificate to Key Vault
az keyvault certificate import \
  --vault-name kv-prod-advancia \
  --name custom-ssl-cert \
  --file /path/to/certificate.pfx
```

## Step 6: Deploy Application

Once infrastructure is ready, deploy your application:

```bash
# Push to main branch to trigger deployment
git push origin main

# Or manually trigger via GitHub Actions
# Go to Actions → Zero Trust Deployment Pipeline → Run workflow
```

## Troubleshooting

### Common Issues

**Issue: Azure CLI not found**
```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

**Issue: Not logged into Azure**
```bash
az login
az account set --subscription "Your Subscription Name"
```

**Issue: Insufficient permissions**
```bash
# Check your role
az role assignment list --assignee $(az account show --query user.name -o tsv) --output table

# You need Owner or Contributor role on the subscription
```

**Issue: Deployment fails**
```bash
# Check deployment logs
az deployment group show \
  --resource-group rg-prod-advancia \
  --name zero-trust-deploy-YYYYMMDD-HHMMSS \
  --query properties.error

# View detailed logs
az monitor activity-log list \
  --resource-group rg-prod-advancia \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ)
```

**Issue: SSH key format error**
```bash
# Ensure your SSH key is in the correct format
# Should start with: ssh-rsa, ssh-ed25519, or ecdsa-sha2-nistp256
cat ~/.ssh/id_ed25519.pub

# If needed, regenerate
ssh-keygen -t ed25519 -C "azure-vm-access" -f ~/.ssh/azure_vm_key
```

## Emergency Procedures

### Kill Switch Activation

In case of security incident:

```bash
# Block all traffic immediately
./infrastructure/scripts/emergency-killswitch.sh block-traffic

# Complete emergency shutdown
./infrastructure/scripts/emergency-killswitch.sh emergency-shutdown

# Check system status
./infrastructure/scripts/emergency-killswitch.sh check-status
```

### Restore Normal Operations

After incident resolution:

```bash
# Restore traffic
./infrastructure/scripts/emergency-killswitch.sh restore-traffic

# Start VMs
./infrastructure/scripts/emergency-killswitch.sh start-vms

# Verify health
./infrastructure/scripts/emergency-killswitch.sh check-status
```

## Monitoring & Maintenance

### Daily Tasks
- Review security alerts in Azure Portal
- Check application health dashboard
- Monitor resource utilization

### Weekly Tasks
- Review access logs
- Verify backup completion
- Check for security updates

### Monthly Tasks
- Security assessment
- Cost optimization review
- Disaster recovery test

## Cost Estimation

Approximate monthly costs for production environment:

| Resource | Estimated Cost |
|----------|---------------|
| Virtual Machines (2x B2s) | $60-80 |
| Key Vault | $5-10 |
| Log Analytics | $20-50 |
| Application Insights | $10-30 |
| Storage (backups) | $10-20 |
| Network (bandwidth) | $5-15 |
| **Total** | **$110-205/month** |

*Costs vary by region and usage. Use [Azure Pricing Calculator](https://azure.microsoft.com/en-us/pricing/calculator/) for accurate estimates.*

## Next Steps

1. ✅ Complete infrastructure deployment
2. ✅ Configure monitoring and alerts
3. ✅ Test emergency procedures
4. ✅ Deploy application code
5. ✅ Conduct security validation
6. ✅ Train operations team
7. ✅ Document runbooks
8. ✅ Schedule regular reviews

## Support & Documentation

- **Full Documentation**: `ZERO_TRUST_IMPLEMENTATION_COMPLETE.md`
- **Security Policies**: `infrastructure/docs/security-policies.md`
- **Architecture Diagrams**: `infrastructure/docs/architecture/`
- **Runbooks**: `infrastructure/docs/runbooks/`

## Additional Resources

- [Azure Security Best Practices](https://docs.microsoft.com/en-us/azure/security/fundamentals/best-practices-and-patterns)
- [Zero Trust Architecture](https://www.microsoft.com/en-us/security/business/zero-trust)
- [GitHub OIDC Documentation](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [Azure Key Vault Best Practices](https://docs.microsoft.com/en-us/azure/key-vault/general/best-practices)

---

**Need Help?** Review the troubleshooting section or check the detailed implementation guide.
