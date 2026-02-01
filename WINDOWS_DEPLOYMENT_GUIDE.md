# Zero Trust Stack - Windows Deployment Guide

## 🪟 Windows-Specific Deployment Instructions

This guide provides Windows-specific instructions for deploying the zero-trust infrastructure stack.

## Prerequisites for Windows

1. **Windows 10/11** or **Windows Server 2019+**
2. **PowerShell 5.1+** (included with Windows)
3. **Azure CLI** for Windows
4. **Git for Windows** (optional, for SSH key generation)

## Step 1: Install Azure CLI

### Option A: Using winget (Recommended)

```powershell
winget install -e --id Microsoft.AzureCLI
```

### Option B: Using MSI Installer

1. Download from: https://aka.ms/installazurecliwindows
2. Run the installer
3. Restart PowerShell after installation

### Verify Installation

```powershell
az --version
```

## Step 2: Install SSH Client (if needed)

Windows 10/11 includes OpenSSH by default. To verify:

```powershell
# Check if OpenSSH is installed
Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH*'

# Install if needed
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
```

## Step 3: Run Interactive Setup

Open **PowerShell as Administrator** and run:

```powershell
# Navigate to project directory
cd C:\Users\mucha.DESKTOP-H7T9NPM\Downloads\productution

# Run the preparation script
.\infrastructure\scripts\prepare-deployment.ps1
```

This script will:
- ✅ Check Azure CLI installation
- ✅ Log you into Azure
- ✅ Gather all required information
- ✅ Generate SSH key if needed (in `%USERPROFILE%\.ssh\`)
- ✅ Create deployment scripts with your actual values
- ✅ Save OIDC setup script

## Step 4: Login to Azure

If not already logged in:

```powershell
az login

# If you have multiple subscriptions, set the active one
az account list --output table
az account set --subscription "Your Subscription Name"
```

## Step 5: Generate SSH Key (if needed)

```powershell
# Create .ssh directory if it doesn't exist
New-Item -ItemType Directory -Path "$env:USERPROFILE\.ssh" -Force

# Generate SSH key
ssh-keygen -t ed25519 -C "azure-vm-access" -f "$env:USERPROFILE\.ssh\azure_vm_key"

# View your public key
Get-Content "$env:USERPROFILE\.ssh\azure_vm_key.pub"
```

## Step 6: Set Up GitHub OIDC

After running the preparation script, you'll have a file named `setup-github-oidc-YYYYMMDD-HHMMSS.ps1`.

Run it:

```powershell
.\setup-github-oidc-YYYYMMDD-HHMMSS.ps1
```

This will output three values. Add them to your GitHub repository:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add:
   - `AZURE_CLIENT_ID`
   - `AZURE_TENANT_ID`
   - `AZURE_SUBSCRIPTION_ID`

## Step 7: Deploy Infrastructure

### Option A: Using Generated Script

```powershell
.\deploy-command-YYYYMMDD-HHMMSS.ps1
```

### Option B: Manual Deployment

```powershell
# Set environment variables
$env:GITHUB_OWNER = "your-github-org"
$env:GITHUB_REPO = "advancia-payledger"
$env:ADMIN_SSH_KEY = Get-Content "$env:USERPROFILE\.ssh\azure_vm_key.pub" -Raw
$env:ENVIRONMENT = "prod"
$env:LOCATION = "eastus"

# Create resource group
$resourceGroup = "rg-$env:ENVIRONMENT-advancia"
az group create --name $resourceGroup --location $env:LOCATION

# Deploy infrastructure
az deployment group create `
  --resource-group $resourceGroup `
  --template-file infrastructure\azure\main.bicep `
  --parameters environment=$env:ENVIRONMENT `
  --parameters githubOwner=$env:GITHUB_OWNER `
  --parameters githubRepo=$env:GITHUB_REPO `
  --parameters adminSshPublicKey=$env:ADMIN_SSH_KEY `
  --verbose
```

## Step 8: Verify Deployment

```powershell
# Check resource group
az group show --name rg-prod-advancia

# List all resources
az resource list --resource-group rg-prod-advancia --output table

# Check VM status
az vm list --resource-group rg-prod-advancia --query "[].{Name:name,Status:powerState}" --output table

# Check Key Vault
az keyvault list --resource-group rg-prod-advancia --output table
```

## Windows-Specific Commands

### SSH into Azure VM from Windows

```powershell
# Using the generated key
ssh -i "$env:USERPROFILE\.ssh\azure_vm_key" azureuser@<VM_PUBLIC_IP>

# Or if using default key
ssh azureuser@<VM_PUBLIC_IP>
```

### Emergency Kill Switch (Windows)

```powershell
# Block all traffic
az network nsg rule create `
  --resource-group rg-prod-advancia `
  --nsg-name nsg-gateway-prod `
  --name Emergency-Deny-All-Inbound `
  --access Deny `
  --protocol "*" `
  --direction Inbound `
  --priority 100 `
  --source-address-prefix "*" `
  --source-port-range "*" `
  --destination-address-prefix "*" `
  --destination-port-range "*"

# Restore traffic
az network nsg rule delete `
  --resource-group rg-prod-advancia `
  --nsg-name nsg-gateway-prod `
  --name Emergency-Deny-All-Inbound
```

### Check System Status

```powershell
# VM status
az vm list `
  --resource-group rg-prod-advancia `
  --query "[].{Name:name,PowerState:powerState,Location:location}" `
  --output table

# NSG rules
az network nsg show `
  --resource-group rg-prod-advancia `
  --name nsg-gateway-prod `
  --query "securityRules[?name=='Emergency-Deny-All-Inbound']" `
  --output table

# Key Vault secrets
az keyvault secret list `
  --vault-name kv-prod-advancia `
  --query "[].{Name:name,Enabled:attributes.enabled,Expires:attributes.expires}" `
  --output table
```

## Troubleshooting Windows-Specific Issues

### Issue: PowerShell Execution Policy

```powershell
# Check current policy
Get-ExecutionPolicy

# Set to allow scripts (run as Administrator)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue: SSH Command Not Found

```powershell
# Install OpenSSH Client
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0

# Verify installation
ssh -V
```

### Issue: Azure CLI Not Found After Installation

```powershell
# Close and reopen PowerShell
# Or add to PATH manually
$env:Path += ";C:\Program Files (x86)\Microsoft SDKs\Azure\CLI2\wbin"

# Verify
az --version
```

### Issue: Git Bash vs PowerShell

If you have Git Bash installed and prefer it:

```bash
# In Git Bash, you can use the Linux-style commands
cd /c/Users/mucha.DESKTOP-H7T9NPM/Downloads/productution
./infrastructure/scripts/deploy-zero-trust.sh \
  --github-owner "your-org" \
  --github-repo "advancia-payledger" \
  --admin-ssh-key "$(cat ~/.ssh/id_ed25519.pub)"
```

### Issue: Line Ending Problems

If you get script errors related to line endings:

```powershell
# Convert line endings using PowerShell
$content = Get-Content .\script.sh -Raw
$content = $content -replace "`r`n", "`n"
$content | Set-Content .\script.sh -NoNewline
```

## Windows Subsystem for Linux (WSL) Alternative

If you have WSL installed, you can use the Linux scripts:

```powershell
# Open WSL
wsl

# Navigate to project (Windows drives are mounted at /mnt/)
cd /mnt/c/Users/mucha.DESKTOP-H7T9NPM/Downloads/productution

# Run Linux scripts
./infrastructure/scripts/prepare-deployment.sh
```

## Monitoring with Windows

### View Logs

```powershell
# Azure Activity Logs
az monitor activity-log list `
  --resource-group rg-prod-advancia `
  --start-time (Get-Date).AddHours(-1).ToString("yyyy-MM-ddTHH:mm:ssZ") `
  --output table

# VM Boot Diagnostics
az vm boot-diagnostics get-boot-log `
  --resource-group rg-prod-advancia `
  --name vm-prod-prod
```

### Create Scheduled Tasks for Monitoring

```powershell
# Create a scheduled task to check system health daily
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
  -Argument "-File C:\path\to\health-check.ps1"

$trigger = New-ScheduledTaskTrigger -Daily -At 6am

Register-ScheduledTask -TaskName "Azure Health Check" `
  -Action $action `
  -Trigger $trigger `
  -Description "Daily Azure infrastructure health check"
```

## File Paths in Windows

When working with the deployment files:

```powershell
# Project root
$projectRoot = "C:\Users\mucha.DESKTOP-H7T9NPM\Downloads\productution"

# Infrastructure files
$infraDir = "$projectRoot\infrastructure"
$scriptsDir = "$infraDir\scripts"
$bicepDir = "$infraDir\azure"

# Navigate
Set-Location $projectRoot
```

## Cost Management

```powershell
# View current costs
az consumption usage list `
  --start-date (Get-Date).AddDays(-30).ToString("yyyy-MM-dd") `
  --end-date (Get-Date).ToString("yyyy-MM-dd") `
  --output table

# Set budget alert
az consumption budget create `
  --budget-name "advancia-monthly-budget" `
  --amount 200 `
  --time-grain Monthly `
  --start-date (Get-Date).ToString("yyyy-MM-01") `
  --end-date (Get-Date).AddYears(1).ToString("yyyy-MM-01")
```

## Quick Reference Commands

```powershell
# Login to Azure
az login

# Set subscription
az account set --subscription "Your Subscription"

# Create resource group
az group create --name rg-prod-advancia --location eastus

# Deploy infrastructure
az deployment group create `
  --resource-group rg-prod-advancia `
  --template-file infrastructure\azure\main.bicep `
  --parameters @parameters.json

# Check deployment status
az deployment group show `
  --resource-group rg-prod-advancia `
  --name main

# Delete everything (careful!)
az group delete --name rg-prod-advancia --yes --no-wait
```

## Next Steps

1. ✅ Run `prepare-deployment.ps1` to gather information
2. ✅ Run the generated OIDC setup script
3. ✅ Add GitHub secrets
4. ✅ Run the deployment script
5. ✅ Verify deployment
6. ✅ Configure monitoring
7. ✅ Test emergency procedures

## Additional Resources

- [Azure CLI for Windows](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli-windows)
- [PowerShell Documentation](https://docs.microsoft.com/en-us/powershell/)
- [OpenSSH for Windows](https://docs.microsoft.com/en-us/windows-server/administration/openssh/openssh_install_firstuse)
- [WSL Installation](https://docs.microsoft.com/en-us/windows/wsl/install)

---

**Ready to Deploy?** Run the PowerShell preparation script to get started!
