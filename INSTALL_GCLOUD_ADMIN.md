# 🚀 Install gcloud CLI - Administrator Required

## ❌ Installation Failed

**Error:** "Unable to obtain lock file access" - This means admin rights are required.

---

## ✅ Solution: Run as Administrator

### **Method 1: PowerShell as Admin (Recommended)**

**Step 1: Open PowerShell as Administrator**
1. Press `Windows + X`
2. Click "**Windows PowerShell (Admin)**" or "**Terminal (Admin)**"
3. Click "**Yes**" when UAC prompt appears

**Step 2: Install gcloud CLI**
```powershell
choco install gcloudsdk -y
```

**Step 3: Wait for installation** (~5 minutes)

**Step 4: Close and reopen PowerShell** (normal, not admin)

**Step 5: Verify**
```powershell
gcloud --version
```

---

### **Method 2: Direct Download (Alternative)**

If Chocolatey continues to have issues:

**Step 1: Download Installer**
- Go to: https://cloud.google.com/sdk/docs/install
- Click "Download the Cloud SDK installer"
- Download for Windows (x86_64)

**Step 2: Run Installer**
- Double-click the downloaded `.exe` file
- Follow installation wizard
- Check "Run gcloud init" at the end
- Complete setup

**Step 3: Verify**
```powershell
gcloud --version
```

---

## 🎯 After Installation - Deploy to GCP

Once gcloud is installed, run these commands:

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

# 5. Deploy backend to Cloud Run
cd backend
gcloud run deploy advancia-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

---

## 📊 What You'll Get

After deployment:
- ✅ Backend URL: `https://advancia-backend-xxxxx-uc.a.run.app`
- ✅ HTTPS automatic
- ✅ Auto-scaling
- ✅ Monitoring included
- ✅ FREE for 6 months ($300 credits)

---

## 🔧 Quick Links

**Download gcloud CLI:**
https://cloud.google.com/sdk/docs/install

**GCP Console:**
https://console.cloud.google.com/

**Your Project:**
https://console.cloud.google.com/home/dashboard?project=boreal-augury-484505-n3

---

**Install with admin rights, then run the deployment commands!** 🚀
