# 🎯 Google Cloud Platform Setup - Advancia PayLedger

## 🎉 Your GCP Account

**Project:** My First Project  
**Project ID:** `boreal-augury-484505-n3`  
**Project Number:** `469723681861`  
**Credits:** $300 (Expires April 17, 2026)

---

## 💡 Why GCP Makes Things Easier

### **What You Get:**
1. ✅ **$300 Free Credits** - Run everything free for months
2. ✅ **Gemini API** - Already have access (you're using it!)
3. ✅ **Cloud Run** - Deploy backend with zero config
4. ✅ **Cloud SQL** - Managed PostgreSQL (alternative to Supabase)
5. ✅ **Cloud Storage** - File uploads (alternative to Digital Ocean)
6. ✅ **Vertex AI** - Advanced AI/ML capabilities
7. ✅ **BigQuery** - Analytics at scale
8. ✅ **Cloud Functions** - Serverless functions

---

## 🚀 Recommended GCP Services for Your Project

### **1. Cloud Run (Backend Deployment)** ⭐ HIGHLY RECOMMENDED

**Why:** Deploy your backend with one command, auto-scaling, HTTPS included

**Cost:** ~$5-20/month (covered by credits)

**Setup:**
```bash
# Install gcloud CLI
# https://cloud.google.com/sdk/docs/install

# Login
gcloud auth login

# Set project
gcloud config set project boreal-augury-484505-n3

# Deploy backend
cd backend
gcloud run deploy advancia-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

**Benefits:**
- ✅ Automatic HTTPS
- ✅ Auto-scaling (0 to millions)
- ✅ Pay only for what you use
- ✅ Built-in monitoring
- ✅ Easy environment variables

---

### **2. Cloud SQL (Database)** ⭐ ALTERNATIVE TO SUPABASE

**Why:** Managed PostgreSQL, automatic backups, high availability

**Cost:** ~$10-50/month (covered by credits)

**Setup:**
```bash
# Create PostgreSQL instance
gcloud sql instances create advancia-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1

# Create database
gcloud sql databases create advancia_payledger \
  --instance=advancia-db

# Get connection string
gcloud sql instances describe advancia-db
```

**Benefits:**
- ✅ Automatic backups
- ✅ High availability
- ✅ Easy scaling
- ✅ Built-in monitoring
- ✅ No connection issues (unlike Supabase)

---

### **3. Cloud Storage (File Uploads)** ⭐ ALTERNATIVE TO DIGITAL OCEAN

**Why:** Unlimited storage, global CDN, cheap

**Cost:** ~$0.02/GB/month (covered by credits)

**Setup:**
```bash
# Create bucket
gsutil mb -p boreal-augury-484505-n3 \
  -c STANDARD \
  -l us-central1 \
  gs://advancia-payledger-uploads/

# Make public (for receipts, etc.)
gsutil iam ch allUsers:objectViewer \
  gs://advancia-payledger-uploads/
```

**Benefits:**
- ✅ Global CDN
- ✅ Unlimited storage
- ✅ Cheap ($0.02/GB)
- ✅ Easy integration
- ✅ Automatic backups

---

### **4. Vertex AI (Advanced AI)** 💡 OPTIONAL

**Why:** Access to Gemini Pro, Claude, and custom models

**Cost:** Pay per use (covered by credits)

**Use Cases:**
- Financial analysis
- Document processing
- Fraud detection
- Custom ML models

---

### **5. Secret Manager (API Keys)** 🔐 RECOMMENDED

**Why:** Secure storage for all your API keys

**Cost:** Free for first 10,000 operations

**Setup:**
```bash
# Store OpenAI key
echo -n "sk-proj-..." | gcloud secrets create openai-api-key --data-file=-

# Store Anthropic key
echo -n "sk-ant-..." | gcloud secrets create anthropic-api-key --data-file=-

# Store Supabase key
echo -n "eyJhbGc..." | gcloud secrets create supabase-service-key --data-file=-
```

**Benefits:**
- ✅ Encrypted storage
- ✅ Version control
- ✅ Access control
- ✅ Audit logging
- ✅ Easy rotation

---

### **6. Cloud Monitoring (Observability)** 📊 FREE

**Why:** Better than Sentry for infrastructure monitoring

**Cost:** Free tier is generous

**Features:**
- ✅ Logs aggregation
- ✅ Metrics & dashboards
- ✅ Alerts & notifications
- ✅ Trace analysis
- ✅ Error reporting

---

## 🎯 Recommended Architecture with GCP

### **Option 1: Full GCP Stack** (Recommended)

```
Frontend (Vercel) 
    ↓
Backend (Cloud Run) 
    ↓
Database (Cloud SQL PostgreSQL)
    ↓
Storage (Cloud Storage)
    ↓
AI (Gemini + Vertex AI)
```

**Monthly Cost:** ~$30-50 (covered by $300 credits = 6+ months free!)

---

### **Option 2: Hybrid Stack** (Current)

```
Frontend (Vercel)
    ↓
Backend (Cloud Run) 
    ↓
Database (Supabase)
    ↓
Storage (Cloud Storage)
    ↓
AI (OpenAI + Claude + Gemini)
```

**Monthly Cost:** ~$20-40 + Supabase ($25)

---

## 🚀 Quick Start: Deploy to GCP

### **Step 1: Install gcloud CLI** (5 min)

**Windows:**
```powershell
# Download installer
# https://cloud.google.com/sdk/docs/install

# Or use Chocolatey
choco install gcloudsdk
```

**Verify:**
```bash
gcloud --version
```

---

### **Step 2: Authenticate** (2 min)

```bash
# Login to your Google account
gcloud auth login

# Set your project
gcloud config set project boreal-augury-484505-n3

# Verify
gcloud config list
```

---

### **Step 3: Enable Required APIs** (3 min)

```bash
# Enable Cloud Run
gcloud services enable run.googleapis.com

# Enable Cloud SQL
gcloud services enable sqladmin.googleapis.com

# Enable Cloud Storage
gcloud services enable storage.googleapis.com

# Enable Secret Manager
gcloud services enable secretmanager.googleapis.com

# Enable Vertex AI
gcloud services enable aiplatform.googleapis.com
```

---

### **Step 4: Deploy Backend to Cloud Run** (10 min)

**Create Dockerfile (if not exists):**
```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 8080
CMD ["npm", "start"]
```

**Deploy:**
```bash
cd backend

# Deploy to Cloud Run
gcloud run deploy advancia-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production" \
  --set-secrets="OPENAI_API_KEY=openai-api-key:latest,ANTHROPIC_API_KEY=anthropic-api-key:latest"
```

**Get URL:**
```bash
gcloud run services describe advancia-backend \
  --region us-central1 \
  --format="value(status.url)"
```

---

### **Step 5: Create Cloud SQL Database** (15 min)

```bash
# Create instance
gcloud sql instances create advancia-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=YOUR_SECURE_PASSWORD

# Create database
gcloud sql databases create advancia_payledger \
  --instance=advancia-db

# Get connection name
gcloud sql instances describe advancia-db \
  --format="value(connectionName)"
```

**Connect from Cloud Run:**
```bash
# Update Cloud Run with database connection
gcloud run services update advancia-backend \
  --add-cloudsql-instances=boreal-augury-484505-n3:us-central1:advancia-db \
  --set-env-vars="DATABASE_URL=postgresql://postgres:PASSWORD@/advancia_payledger?host=/cloudsql/boreal-augury-484505-n3:us-central1:advancia-db"
```

---

### **Step 6: Setup Cloud Storage** (5 min)

```bash
# Create bucket
gsutil mb -p boreal-augury-484505-n3 \
  -c STANDARD \
  -l us-central1 \
  gs://advancia-payledger-uploads/

# Set CORS (for web uploads)
cat > cors.json << EOF
[
  {
    "origin": ["https://your-frontend.vercel.app"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF

gsutil cors set cors.json gs://advancia-payledger-uploads/
```

---

## 💰 Cost Breakdown (with $300 credits)

| Service | Monthly Cost | Months Free |
|---------|--------------|-------------|
| **Cloud Run** | $10-20 | 15-30 months |
| **Cloud SQL** | $10-30 | 10-30 months |
| **Cloud Storage** | $1-5 | 60+ months |
| **Secret Manager** | Free | Forever |
| **Monitoring** | Free | Forever |
| **Vertex AI** | $5-20 | 15-60 months |
| **Total** | ~$30-75 | **4-10 months free!** |

**After credits:** Still cheaper than AWS/Azure!

---

## 🎯 Benefits vs Current Setup

### **Current (Supabase + AWS):**
- ❌ Database connection issues
- ❌ Complex setup
- ❌ Multiple platforms
- ❌ Higher costs
- ⚠️ Limited free tier

### **With GCP:**
- ✅ Everything in one place
- ✅ $300 free credits
- ✅ Easier deployment
- ✅ Better monitoring
- ✅ Gemini API included
- ✅ Auto-scaling
- ✅ Better reliability

---

## 📚 Next Steps

### **Immediate:**
1. Install gcloud CLI
2. Enable required APIs
3. Deploy backend to Cloud Run
4. Test deployment

### **This Week:**
1. Migrate database to Cloud SQL
2. Setup Cloud Storage
3. Configure monitoring
4. Add custom domain

### **Optional:**
1. Explore Vertex AI
2. Setup CI/CD with Cloud Build
3. Add Cloud CDN
4. Implement Cloud Functions

---

## 🔗 Useful Links

- **GCP Console:** https://console.cloud.google.com/
- **Cloud Run Docs:** https://cloud.google.com/run/docs
- **Cloud SQL Docs:** https://cloud.google.com/sql/docs
- **Gemini API:** https://ai.google.dev/
- **Pricing Calculator:** https://cloud.google.com/products/calculator

---

## ✅ Summary

**You have $300 in GCP credits - use them!**

**Recommended:**
1. Deploy backend to Cloud Run (easiest)
2. Use Cloud SQL for database (more reliable than Supabase)
3. Use Cloud Storage for files (cheaper than Digital Ocean)
4. Keep Gemini API (you already have it!)

**This will solve your current issues:**
- ✅ No more database connection problems
- ✅ Easier deployment
- ✅ Better monitoring
- ✅ Everything in one place
- ✅ Free for 6+ months!

**Want me to help you deploy to GCP?** 🚀
