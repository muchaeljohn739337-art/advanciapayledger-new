# 🚀 GCP Deployment Instructions - Manual Steps

## ⚠️ Installation Requires Admin Rights

The gcloud CLI installation needs administrator privileges. Here's how to proceed:

---

## 📋 Step-by-Step Installation

### **Option 1: Install with Admin Rights (Recommended)**

**Step 1: Open PowerShell as Administrator**
1. Press `Windows + X`
2. Select "Windows PowerShell (Admin)" or "Terminal (Admin)"
3. Click "Yes" when prompted

**Step 2: Install gcloud CLI**
```powershell
choco install gcloudsdk -y
```

**Step 3: Restart PowerShell**
Close and reopen PowerShell (as admin) to refresh PATH

**Step 4: Verify Installation**
```powershell
gcloud --version
```

---

### **Option 2: Download Installer (Alternative)**

If Chocolatey doesn't work:

**Step 1: Download Installer**
- Go to: https://cloud.google.com/sdk/docs/install
- Download "Google Cloud CLI Installer for Windows"
- Run the `.exe` file

**Step 2: Follow Installation Wizard**
- Accept defaults
- Check "Run gcloud init"
- Complete installation

**Step 3: Verify**
```powershell
gcloud --version
```

---

## 🔐 After Installation - Authentication

### **Step 1: Login to Google Cloud**
```bash
gcloud auth login
```
This will open your browser - login with your Google account

### **Step 2: Set Your Project**
```bash
gcloud config set project boreal-augury-484505-n3
```

### **Step 3: Verify Configuration**
```bash
gcloud config list
```

Should show:
```
[core]
account = your-email@gmail.com
project = boreal-augury-484505-n3
```

---

## 🚀 Deploy Backend to Cloud Run

### **Step 1: Enable Required APIs**
```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

### **Step 2: Create Dockerfile**

**File:** `backend/Dockerfile`
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port (Cloud Run uses PORT env var)
ENV PORT=8080
EXPOSE 8080

# Start server
CMD ["npm", "start"]
```

### **Step 3: Update package.json**

Make sure you have a `start` script:
```json
{
  "scripts": {
    "start": "node dist/index.js",
    "build": "tsc",
    "dev": "tsx watch src/index.ts"
  }
}
```

### **Step 4: Create .dockerignore**

**File:** `backend/.dockerignore`
```
node_modules
npm-debug.log
.env
.env.*
dist
*.md
.git
.gitignore
```

### **Step 5: Deploy to Cloud Run**
```bash
cd backend

gcloud run deploy advancia-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,SENTRY_DSN=$SENTRY_DSN,OPENAI_API_KEY=$OPENAI_API_KEY,ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY,GEMINI_API_KEY=$GEMINI_API_KEY"
```

**Or with secrets (more secure):**
```bash
# First, create secrets
echo -n "your-openai-key" | gcloud secrets create openai-api-key --data-file=-
echo -n "your-anthropic-key" | gcloud secrets create anthropic-api-key --data-file=-
echo -n "your-gemini-key" | gcloud secrets create gemini-api-key --data-file=-
echo -n "your-sentry-dsn" | gcloud secrets create sentry-dsn --data-file=-

# Deploy with secrets
gcloud run deploy advancia-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="OPENAI_API_KEY=openai-api-key:latest,ANTHROPIC_API_KEY=anthropic-api-key:latest,GEMINI_API_KEY=gemini-api-key:latest,SENTRY_DSN=sentry-dsn:latest"
```

---

## ✅ Verify Deployment

### **Get Service URL**
```bash
gcloud run services describe advancia-backend \
  --region us-central1 \
  --format="value(status.url)"
```

### **Test Endpoint**
```bash
# Replace with your actual URL
curl https://advancia-backend-xxxxx-uc.a.run.app/debug-sentry
```

### **View Logs**
```bash
gcloud run services logs read advancia-backend \
  --region us-central1 \
  --limit 50
```

---

## 🗄️ Setup Cloud SQL Database (Optional)

### **Step 1: Create PostgreSQL Instance**
```bash
gcloud sql instances create advancia-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=YOUR_SECURE_PASSWORD \
  --storage-size=10GB \
  --storage-type=SSD
```

### **Step 2: Create Database**
```bash
gcloud sql databases create advancia_payledger \
  --instance=advancia-db
```

### **Step 3: Get Connection Name**
```bash
gcloud sql instances describe advancia-db \
  --format="value(connectionName)"
```

### **Step 4: Connect Cloud Run to Cloud SQL**
```bash
gcloud run services update advancia-backend \
  --add-cloudsql-instances=boreal-augury-484505-n3:us-central1:advancia-db \
  --update-env-vars="DATABASE_URL=postgresql://postgres:PASSWORD@/advancia_payledger?host=/cloudsql/boreal-augury-484505-n3:us-central1:advancia-db" \
  --region=us-central1
```

### **Step 5: Run Migrations**
```bash
# Connect via Cloud SQL Proxy for migrations
cloud-sql-proxy boreal-augury-484505-n3:us-central1:advancia-db &

# Run migrations
cd backend
npx prisma migrate deploy
```

---

## 📊 Monitor Your Deployment

### **Cloud Run Dashboard**
https://console.cloud.google.com/run?project=boreal-augury-484505-n3

### **View Metrics**
- Request count
- Response times
- Error rates
- CPU/Memory usage

### **View Logs**
```bash
gcloud run services logs tail advancia-backend --region us-central1
```

---

## 💰 Cost Tracking

### **Check Current Usage**
```bash
gcloud billing accounts list
```

### **View Spending**
https://console.cloud.google.com/billing

### **Set Budget Alert**
1. Go to: https://console.cloud.google.com/billing/budgets
2. Create budget: $50/month
3. Set alert at 50%, 90%, 100%

---

## 🔧 Troubleshooting

### **Build Fails**
```bash
# Check build logs
gcloud builds list --limit=5

# View specific build
gcloud builds log BUILD_ID
```

### **Service Won't Start**
```bash
# Check logs
gcloud run services logs read advancia-backend --region us-central1 --limit 100

# Check service status
gcloud run services describe advancia-backend --region us-central1
```

### **Database Connection Issues**
```bash
# Test Cloud SQL connection
gcloud sql connect advancia-db --user=postgres

# Check Cloud SQL instance status
gcloud sql instances describe advancia-db
```

---

## 📚 Useful Commands

### **Update Service**
```bash
gcloud run services update advancia-backend \
  --region us-central1 \
  --update-env-vars="NEW_VAR=value"
```

### **Scale Service**
```bash
gcloud run services update advancia-backend \
  --region us-central1 \
  --min-instances=0 \
  --max-instances=10
```

### **Delete Service**
```bash
gcloud run services delete advancia-backend --region us-central1
```

### **List All Services**
```bash
gcloud run services list
```

---

## ✅ Post-Deployment Checklist

- [ ] gcloud CLI installed
- [ ] Authenticated with Google Cloud
- [ ] Project set to `boreal-augury-484505-n3`
- [ ] APIs enabled (Cloud Run, Cloud Build)
- [ ] Dockerfile created
- [ ] Backend deployed to Cloud Run
- [ ] Service URL obtained
- [ ] Endpoints tested
- [ ] Environment variables set
- [ ] Secrets configured (optional)
- [ ] Cloud SQL setup (optional)
- [ ] Monitoring configured
- [ ] Budget alerts set

---

## 🎯 Next Steps After Deployment

1. **Update Frontend**
   - Change API URL in `frontend/.env.local`
   - Point to Cloud Run URL
   - Redeploy frontend to Vercel

2. **Setup Custom Domain** (Optional)
   ```bash
   gcloud run domain-mappings create \
     --service advancia-backend \
     --domain api.advanciapayledger.com \
     --region us-central1
   ```

3. **Setup CI/CD** (Optional)
   - Connect GitHub to Cloud Build
   - Auto-deploy on push to main

4. **Monitor Performance**
   - Check Cloud Run metrics
   - Review Sentry errors
   - Optimize as needed

---

**Your backend will be live at:** `https://advancia-backend-xxxxx-uc.a.run.app`

**Cost:** FREE for 6+ months with your $300 credits! 🎉
