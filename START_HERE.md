# 🚀 Zero Trust Stack - Start Here

## Execute These Commands in Order

### **Step 1: Install Azure CLI**
```powershell
winget install -e --id Microsoft.AzureCLI
```
Then **restart PowerShell**.

---

### **Step 2: Login to Azure**
```powershell
az login
```
A browser window will open. Login with your Azure credentials.

---

### **Step 3: Navigate to Project**
```powershell
cd C:\Users\mucha.DESKTOP-H7T9NPM\Downloads\productution
```

---

### **Step 4: Run Interactive Setup**
```powershell
.\infrastructure\scripts\prepare-deployment.ps1
```

The script will ask you for:
- **GitHub Owner** (your organization/username)
- **GitHub Repo** (press Enter for default: advancia-payledger)
- **SSH Key** (auto-generated if you don't have one)
- **Developer Emails** (optional - press Enter to skip)
- **Alert Email** (optional - press Enter to skip)
- **Teams Webhook** (optional - press Enter to skip)
- **Environment** (press Enter for default: prod)
- **Azure Region** (press Enter for default: eastus)

---

### **Step 5: Run Generated OIDC Setup**
```powershell
.\setup-github-oidc-YYYYMMDD-HHMMSS.ps1
```
*(Replace with actual filename from Step 4)*

**Copy the three values it outputs:**
- AZURE_CLIENT_ID
- AZURE_TENANT_ID
- AZURE_SUBSCRIPTION_ID

---

### **Step 6: Add GitHub Secrets**
1. Go to: https://github.com/YOUR_ORG/YOUR_REPO/settings/secrets/actions
2. Click **"New repository secret"**
3. Add all three secrets from Step 5

---

### **Step 7: Deploy Infrastructure**
```powershell
.\deploy-command-YYYYMMDD-HHMMSS.ps1
```
*(Replace with actual filename from Step 4)*

**Wait 30-45 minutes** for deployment to complete.

---

### **Step 8: Verify Deployment**
```powershell
# Check if everything was created
az resource list --resource-group rg-prod-advancia --output table

# Check VM status
az vm list --resource-group rg-prod-advancia --query "[].{Name:name,Status:powerState}" --output table
```

---

## ✅ That's It!

Your zero-trust infrastructure is now deployed.

### **Next Steps:**
- Review `DEPLOYMENT_CHECKLIST.md` for post-deployment tasks
- Configure monitoring alerts in Azure Portal
- Test emergency kill switch procedures
- Deploy your application code

### **Documentation:**
- **Full Guide:** `ZERO_TRUST_IMPLEMENTATION_COMPLETE.md`
- **Windows Guide:** `WINDOWS_DEPLOYMENT_GUIDE.md`
- **Checklist:** `DEPLOYMENT_CHECKLIST.md`

### **Need Help?**
Check the troubleshooting section in `WINDOWS_DEPLOYMENT_GUIDE.md`

---

## 🚨 Emergency Commands

### Block All Traffic (Emergency)
```powershell
az network nsg rule create `
  --resource-group rg-prod-advancia `
  --nsg-name nsg-gateway-prod `
  --name Emergency-Deny-All-Inbound `
  --access Deny --protocol "*" --direction Inbound --priority 100 `
  --source-address-prefix "*" --source-port-range "*" `
  --destination-address-prefix "*" --destination-port-range "*"
```

### Restore Traffic
```powershell
az network nsg rule delete `
  --resource-group rg-prod-advancia `
  --nsg-name nsg-gateway-prod `
  --name Emergency-Deny-All-Inbound
```

---

**Ready?** Open PowerShell and start with Step 1! 🎯
