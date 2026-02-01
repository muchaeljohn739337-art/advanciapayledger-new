# Zero Trust Stack Deployment Checklist

## ✅ Pre-Deployment Checklist

### Step 1: Install Azure CLI
```powershell
# Install Azure CLI using winget
winget install -e --id Microsoft.AzureCLI

# Restart PowerShell after installation
# Verify installation
az --version
```
**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

---

### Step 2: Login to Azure
```powershell
# Login to Azure
az login

# Verify login and view subscriptions
az account list --output table

# Set active subscription (if you have multiple)
az account set --subscription "Your Subscription Name"

# Verify current subscription
az account show
```
**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

**Notes:**
- Subscription ID: _________________
- Tenant ID: _________________

---

### Step 3: Verify SSH Client
```powershell
# Check if SSH is available (should be included in Windows 10/11)
ssh -V

# If not installed, install OpenSSH Client
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
```
**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

---

## 🚀 Deployment Steps

### Step 4: Run Preparation Script
```powershell
# Navigate to project directory
cd C:\Users\mucha.DESKTOP-H7T9NPM\Downloads\productution

# Run the interactive preparation script
.\infrastructure\scripts\prepare-deployment.ps1
```

**Information to Provide:**
- [ ] GitHub Owner/Organization: _________________
- [ ] GitHub Repository Name: advancia-payledger (or custom)
- [ ] SSH Key: (auto-generated or existing)
- [ ] Developer Emails: _________________ (optional)
- [ ] Alert Email: _________________ (optional)
- [ ] Teams Webhook: _________________ (optional)
- [ ] Environment: prod (or custom)
- [ ] Azure Region: eastus (or custom)

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

**Generated Files:**
- [ ] `setup-github-oidc-YYYYMMDD-HHMMSS.ps1`
- [ ] `deploy-command-YYYYMMDD-HHMMSS.ps1`

---

### Step 5: Set Up GitHub OIDC
```powershell
# Run the generated OIDC setup script
.\setup-github-oidc-YYYYMMDD-HHMMSS.ps1
```

**This will output three values. Copy them:**
- AZURE_CLIENT_ID: _________________
- AZURE_TENANT_ID: _________________
- AZURE_SUBSCRIPTION_ID: _________________

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

---

### Step 6: Add GitHub Secrets
1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these three secrets:
   - [ ] `AZURE_CLIENT_ID`
   - [ ] `AZURE_TENANT_ID`
   - [ ] `AZURE_SUBSCRIPTION_ID`

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

---

### Step 7: Deploy Infrastructure
```powershell
# Run the generated deployment command
.\deploy-command-YYYYMMDD-HHMMSS.ps1
```

**Deployment Progress:**
- [ ] Resource group creation
- [ ] Identity and RBAC setup (5 min)
- [ ] Network infrastructure (5 min)
- [ ] Compute resources (10 min)
- [ ] Security configuration (10 min)
- [ ] Monitoring setup (5 min)
- [ ] Validation and testing (5 min)

**Estimated Time:** 30-45 minutes

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

**Deployment Name:** _________________
**Resource Group:** rg-prod-advancia (or custom)

---

## 🔍 Post-Deployment Verification

### Step 8: Verify Deployment
```powershell
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

**Verification Checklist:**
- [ ] Resource group exists
- [ ] Virtual Network created
- [ ] VMs are running
- [ ] Key Vault accessible
- [ ] NSGs configured
- [ ] Monitoring enabled

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

---

### Step 9: Test Emergency Kill Switch
```powershell
# Check current status (safe - read-only)
az network nsg show `
  --resource-group rg-prod-advancia `
  --name nsg-gateway-prod `
  --query "securityRules[?name=='Emergency-Deny-All-Inbound']"
```

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

---

### Step 10: Configure Monitoring Alerts
1. Navigate to Azure Portal: https://portal.azure.com
2. Go to your resource group: rg-prod-advancia
3. Navigate to **Monitor** → **Alerts**
4. Review configured alert rules
5. Test alert notifications

**Alert Configuration:**
- [ ] VM CPU alerts
- [ ] VM memory alerts
- [ ] NSG deny traffic alerts
- [ ] Key Vault access alerts
- [ ] Application error alerts

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

---

## 📊 Deployment Summary

### Resource Information
- **Resource Group:** _________________
- **Environment:** _________________
- **Location:** _________________
- **Deployment Date:** _________________
- **Deployed By:** _________________

### Key Resources Created
- [ ] Virtual Network (VNet)
- [ ] 3 Subnets (Gateway, Sandbox, Production)
- [ ] Network Security Groups (NSGs)
- [ ] Virtual Machines (VMs)
- [ ] Azure Key Vault
- [ ] Log Analytics Workspace
- [ ] Application Insights
- [ ] Recovery Services Vault
- [ ] Automation Accounts
- [ ] Monitoring Dashboards

### Access Information
- **Gateway Public IP:** _________________
- **Key Vault Name:** _________________
- **Log Analytics Workspace:** _________________
- **SSH Key Location:** `%USERPROFILE%\.ssh\azure_vm_key`

---

## 🚨 Emergency Contacts & Procedures

### Emergency Kill Switch
```powershell
# EMERGENCY: Block all traffic immediately
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
```

### Restore Normal Operations
```powershell
# Remove emergency rule
az network nsg rule delete `
  --resource-group rg-prod-advancia `
  --nsg-name nsg-gateway-prod `
  --name Emergency-Deny-All-Inbound
```

### Emergency Contacts
- **Security Team:** _________________
- **DevOps Lead:** _________________
- **Azure Support:** _________________

---

## 📚 Documentation References

- **Complete Implementation Guide:** `ZERO_TRUST_IMPLEMENTATION_COMPLETE.md`
- **Windows Deployment Guide:** `WINDOWS_DEPLOYMENT_GUIDE.md`
- **Deployment Quick Start:** `DEPLOYMENT_QUICKSTART.md`
- **Security Checklist:** `DEPLOYMENT_SECURITY_CHECKLIST.md`

---

## ✅ Final Checklist

- [ ] All pre-deployment steps completed
- [ ] Infrastructure deployed successfully
- [ ] Post-deployment verification passed
- [ ] Monitoring and alerts configured
- [ ] Emergency procedures tested
- [ ] Documentation reviewed
- [ ] Team trained on procedures
- [ ] Backup strategy verified
- [ ] Security audit completed
- [ ] Production ready sign-off

**Deployment Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

**Sign-off:**
- Deployed By: _________________ Date: _________________
- Verified By: _________________ Date: _________________
- Approved By: _________________ Date: _________________

---

## 📝 Notes & Issues

### Deployment Notes
_Record any important notes, decisions, or observations during deployment_

---

### Issues Encountered
_Document any issues and their resolutions_

---

### Next Steps
_List any follow-up actions or improvements_

---

**Deployment Complete!** 🎉

Review the `ZERO_TRUST_IMPLEMENTATION_COMPLETE.md` for comprehensive documentation.
