# 🚀 Manual gcloud CLI Installation Guide

## ⚠️ Winget Installation Failed

The automated installation was canceled. Follow these steps to install manually.

---

## 📥 Option 1: Direct Download (Easiest)

### **Step 1: Download Installer**
Go to: https://cloud.google.com/sdk/docs/install

Or direct link:
https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe

### **Step 2: Run Installer**
1. Double-click the downloaded `.exe` file
2. Click "Yes" when UAC prompts
3. Follow installation wizard:
   - Accept license
   - Choose install location (default is fine)
   - Check "Run gcloud init" (optional)
   - Click "Install"

### **Step 3: Restart Terminal**
Close and reopen PowerShell to refresh PATH

### **Step 4: Verify**
```powershell
gcloud --version
```

**Expected output:**
```
Google Cloud SDK 554.0.0
bq 2.1.3
core 2024.01.19
gcloud-crc32c 1.0.0
gsutil 5.27
```

---

## 📥 Option 2: PowerShell Script

### **Run this in PowerShell (as Administrator):**

```powershell
# Download installer
$url = "https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe"
$output = "$env:TEMP\GoogleCloudSDKInstaller.exe"
Invoke-WebRequest -Uri $url -OutFile $output

# Run installer
Start-Process -FilePath $output -Wait

# Refresh PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Verify
gcloud --version
```

---

## 📥 Option 3: Chocolatey (Alternative)

### **If you have Chocolatey:**

```powershell
# Open PowerShell as Administrator
choco install gcloudsdk -y

# Restart PowerShell
# Verify
gcloud --version
```

---

## 🎯 After Installation

### **Step 1: Authenticate**
```bash
gcloud auth login
```
This will open your browser - login with your Google account.

### **Step 2: Set Project**
```bash
gcloud config set project boreal-augury-484505-n3
```

### **Step 3: Verify Configuration**
```bash
gcloud config list
```

**Expected output:**
```
[core]
account = your-email@gmail.com
project = boreal-augury-484505-n3
```

### **Step 4: Enable APIs**
```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

### **Step 5: Deploy Backend**
```bash
cd backend
gcloud run deploy advancia-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

---

## 🔧 Troubleshooting

### **"gcloud not found" after installation:**
1. Restart PowerShell completely
2. Check if gcloud is in PATH:
   ```powershell
   $env:Path -split ';' | Select-String -Pattern 'Google'
   ```
3. If not found, add manually:
   ```powershell
   $gcloudPath = "C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin"
   [Environment]::SetEnvironmentVariable("Path", $env:Path + ";$gcloudPath", "User")
   ```

### **Installation hangs:**
- Close installer
- Download from direct link above
- Run installer again

### **Permission denied:**
- Right-click installer
- Select "Run as administrator"

---

## ✅ Quick Verification Checklist

After installation:
- [ ] `gcloud --version` works
- [ ] `gcloud auth login` opens browser
- [ ] Logged in with Google account
- [ ] `gcloud config set project boreal-augury-484505-n3` succeeds
- [ ] `gcloud config list` shows correct project
- [ ] Ready to deploy

---

## 🚀 Full Deployment Commands

Once gcloud is installed and configured:

```bash
# 1. Authenticate
gcloud auth login

# 2. Set project
gcloud config set project boreal-augury-484505-n3

# 3. Enable APIs
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

# 4. Deploy backend
cd c:\Users\mucha.DESKTOP-H7T9NPM\Downloads\productution\backend
gcloud run deploy advancia-backend --source . --region us-central1 --allow-unauthenticated
```

---

**Download and install gcloud CLI, then run the deployment commands!** 🚀
