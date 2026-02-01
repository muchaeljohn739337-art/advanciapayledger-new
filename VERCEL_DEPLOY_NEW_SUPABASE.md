# 🚀 Vercel Deployment with New Supabase

## ✅ Your New Supabase Credentials

**Project:** `fvceynqcxfwtbpbugtqr`  
**URL:** `https://fvceynqcxfwtbpbugtqr.supabase.co`  
**Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2Y2V5bnFjeGZ3dGJwYnVndHFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MjE3NjIsImV4cCI6MjA4NTQ5Nzc2Mn0.R-6Hk1sfzqOC0UmqwcKRyDmcEL4eD4AttJ_7qlqvueE`

---

## 🎯 Deploy Frontend to Vercel (3 Steps)

### **Step 1: Install Vercel CLI**
```bash
npm i -g vercel
vercel login
```

### **Step 2: Deploy from Frontend Directory**
```bash
cd frontend
vercel
```

Follow prompts:
- Set up and deploy? **Yes**
- Which scope? **[Your account]**
- Link to existing project? **No** (or Yes if you have one)
- Project name? **advancia-payledger**
- Directory? **./frontend**
- Override settings? **No**

### **Step 3: Add Environment Variables**

In Vercel Dashboard → Settings → Environment Variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://fvceynqcxfwtbpbugtqr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2Y2V5bnFjeGZ3dGJwYnVndHFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MjE3NjIsImV4cCI6MjA4NTQ5Nzc2Mn0.R-6Hk1sfzqOC0UmqwcKRyDmcEL4eD4AttJ_7qlqvueE
NEXT_PUBLIC_API_URL=https://your-backend-url.com
NEXT_PUBLIC_ENV=production
```

Then redeploy:
```bash
vercel --prod
```

---

## 🔧 Update GitHub Actions

### **Update `.github/workflows/deploy-frontend.yml`**

Add these secrets to GitHub → Settings → Secrets → Actions:

```yaml
NEXT_PUBLIC_SUPABASE_URL: https://fvceynqcxfwtbpbugtqr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2Y2V5bnFjeGZ3dGJwYnVndHFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MjE3NjIsImV4cCI6MjA4NTQ5Nzc2Mn0.R-6Hk1sfzqOC0UmqwcKRyDmcEL4eD4AttJ_7qlqvueE
VERCEL_TOKEN: [Get from vercel.com/account/tokens]
VERCEL_ORG_ID: [Get from Vercel project settings]
VERCEL_PROJECT_ID: [Get from Vercel project settings]
```

---

## 📋 Vercel Project Settings

### **Get Vercel IDs:**

```bash
# Link project
cd frontend
vercel link

# Get project info
vercel inspect
```

Or find in Vercel Dashboard → Project Settings → General

---

## ✅ Deployment Checklist

- [ ] Vercel CLI installed
- [ ] Logged into Vercel
- [ ] Frontend deployed to Vercel
- [ ] Environment variables added in Vercel
- [ ] Production deployment successful
- [ ] GitHub secrets updated
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (automatic)

---

## 🌐 Custom Domain (Optional)

1. Go to Vercel Project → Settings → Domains
2. Add domain: `app.yourdomain.com`
3. Add DNS records:
   ```
   Type: A
   Name: app
   Value: 76.76.21.21
   ```
4. Wait for DNS propagation (5-30 minutes)
5. SSL auto-provisions

---

## 🎉 Your Vercel Deployment

**Frontend URL:** `https://advancia-payledger.vercel.app`  
**Supabase:** Connected ✅  
**Auto-deploy:** Enabled on push to main  

**Ready to go!** 🚀
