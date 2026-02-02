# 🚀 Install gcloud CLI - Quick Guide

## ⚠️ Required: Administrator Privileges

You need to run PowerShell as Administrator to install gcloud CLI.

---

## 📋 Installation Steps

### **Step 1: Open PowerShell as Administrator**

**Method 1: Windows Search**
1. Press `Windows` key
2. Type "PowerShell"
3. Right-click "Windows PowerShell"
4. Click "Run as administrator"
5. Click "Yes" when prompted

**Method 2: Quick Menu**
1. Press `Windows + X`
2. Click "Windows PowerShell (Admin)" or "Terminal (Admin)"
3. Click "Yes" when prompted

---

### **Step 2: Install gcloud CLI**

In the Administrator PowerShell window, run:

```powershell
choco install gcloudsdk -y
```

**Wait for installation to complete** (~5 minutes)

---

### **Step 3: Restart PowerShell**

Close and reopen PowerShell (can be normal, not admin) to refresh PATH.

---

### **Step 4: Verify Installation**

```powershell
gcloud --version
```

**Expected output:**
```
Google Cloud SDK 456.0.0
bq 2.0.101
core 2024.01.12
gcloud-crc32c 1.0.0
gsutil 5.27
```

---

## 🎯 After Installation - Run These Commands

Once gcloud is installed, run:

```bash
# 1. Login to Google Cloud
gcloud auth login

# 2. Set your project
gcloud config set project boreal-augury-484505-n3

# 3. Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# 4. Verify configuration
gcloud config list
```

---

## 🚀 Then Deploy Backend

```bash
cd backend
gcloud run deploy advancia-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

---

## 🔧 Alternative: Manual Installation

If Chocolatey doesn't work:

**Download Installer:**
1. Go to: https://cloud.google.com/sdk/docs/install
2. Download "Google Cloud CLI Installer for Windows"
3. Run the `.exe` file
4. Follow installation wizard
5. Check "Run gcloud init" at the end

---

## ✅ Quick Checklist

- [ ] Opened PowerShell as Administrator
- [ ] Ran `choco install gcloudsdk -y`
- [ ] Waited for installation to complete
- [ ] Restarted PowerShell
- [ ] Verified with `gcloud --version`
- [ ] Ready to run deployment commands

---

**Once installed, let me know and I'll help you deploy!** 🚀
