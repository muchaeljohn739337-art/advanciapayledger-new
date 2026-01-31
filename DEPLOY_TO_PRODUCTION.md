# 🚀 Production Deployment - Complete Guide

## 📊 Your Server Information

**DigitalOcean Server:**
- **Public IP**: 147.182.193.11
- **Private IP**: 10.124.0.2
- **SSH Access**: `root@147.182.193.11`

**Current Status:**
- ✅ Frontend deployed to Vercel
- ⏳ Backend needs deployment to DigitalOcean
- ✅ Database migrated to Supabase

---

## 🔐 Step 1: Set Up SSH Access

You need SSH key authentication to deploy. Run these commands:

```powershell
# Check if you have an SSH key
ls ~/.ssh/id_rsa.pub

# If not, generate one
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# Copy your public key
Get-Content ~/.ssh/id_rsa.pub | clip

# Add it to DigitalOcean
# Go to: https://cloud.digitalocean.com/account/security
# Click "Add SSH Key" and paste
```

**Or use password authentication:**
```powershell
# Connect with password (you'll be prompted)
ssh root@147.182.193.11
```

---

## 🚀 Step 2: Deploy Backend to Server

### Option A: Manual Deployment (Recommended First Time)

```powershell
# 1. Connect to server
ssh root@147.182.193.11

# 2. Install Node.js and PM2 (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
npm install -g pm2

# 3. Create application directory
mkdir -p /var/www/advancia-payledger
cd /var/www/advancia-payledger

# 4. Clone your repository (or upload files)
# If using Git:
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .

# Or manually upload files using SCP (from your local machine):
# scp -r c:\Users\mucha.DESKTOP-H7T9NPM\Downloads\productution\backend root@147.182.193.11:/var/www/advancia-payledger/

# 5. Navigate to backend
cd backend

# 6. Create .env file
cat > .env << 'EOF'
DATABASE_URL="postgresql://postgres.jwabwrcykdtpwdhwhmqq:F3vR2UQT49NK8ifI@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"
REDIS_URL="redis://localhost:6379"
FRONTEND_URL="https://your-vercel-app.vercel.app"
NODE_ENV="production"
PORT=3001
EOF

# 7. Install dependencies
npm install --production

# 8. Build the application
npm run build

# 9. Run Prisma migrations
npx prisma migrate deploy
npx prisma generate

# 10. Start with PM2
pm2 start dist/index.js --name advancia-backend
pm2 save
pm2 startup

# 11. Check status
pm2 status
pm2 logs advancia-backend
```

### Option B: Automated Deployment Script

Create a deployment script on your local machine:

```powershell
# Save this as deploy-backend.ps1
$SERVER_IP = "147.182.193.11"
$SERVER_USER = "root"
$APP_DIR = "/var/www/advancia-payledger/backend"

Write-Host "🚀 Deploying backend to $SERVER_IP..." -ForegroundColor Cyan

# Upload backend files
Write-Host "📦 Uploading files..." -ForegroundColor Yellow
scp -r .\backend\* ${SERVER_USER}@${SERVER_IP}:${APP_DIR}/

# Deploy on server
Write-Host "🔧 Installing and building..." -ForegroundColor Yellow
ssh ${SERVER_USER}@${SERVER_IP} @"
cd $APP_DIR
npm install --production
npm run build
npx prisma migrate deploy
npx prisma generate
pm2 restart advancia-backend || pm2 start dist/index.js --name advancia-backend
pm2 save
"@

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🌐 Backend URL: http://$SERVER_IP:3001" -ForegroundColor Cyan
```

Run it:
```powershell
cd c:\Users\mucha.DESKTOP-H7T9NPM\Downloads\productution
.\deploy-backend.ps1
```

---

## 🌐 Step 3: Configure Nginx (Optional but Recommended)

Set up Nginx as a reverse proxy for better performance and SSL:

```bash
# On the server
ssh root@147.182.193.11

# Install Nginx
apt-get update
apt-get install -y nginx

# Create Nginx configuration
cat > /etc/nginx/sites-available/advancia-backend << 'EOF'
server {
    listen 80;
    server_name 147.182.193.11;  # Or your domain name

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable the site
ln -s /etc/nginx/sites-available/advancia-backend /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Now your backend is accessible at http://147.182.193.11 (port 80)
```

---

## 🔒 Step 4: Set Up SSL with Let's Encrypt (If Using Domain)

If you have a domain name pointing to your server:

```bash
# Install Certbot
apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d api.yourdomain.com

# Auto-renewal is set up automatically
certbot renew --dry-run
```

---

## 🔗 Step 5: Update Frontend to Use Production Backend

### Get Your Vercel App URL

```powershell
cd c:\Users\mucha.DESKTOP-H7T9NPM\Downloads\productution\frontend
vercel ls
# Note your production URL (e.g., your-app.vercel.app)
```

### Update Backend CORS

On your server, update the backend `.env` file:

```bash
ssh root@147.182.193.11
cd /var/www/advancia-payledger/backend
nano .env

# Update FRONTEND_URL to your Vercel URL:
FRONTEND_URL="https://your-app.vercel.app"

# Save and restart
pm2 restart advancia-backend
```

### Update Frontend Environment Variables

```powershell
# Set the backend API URL in Vercel
cd c:\Users\mucha.DESKTOP-H7T9NPM\Downloads\productution\frontend

# Add environment variable
vercel env add NEXT_PUBLIC_API_URL production
# When prompted, enter: http://147.182.193.11:3001
# Or if using Nginx: http://147.182.193.11

# Redeploy frontend
vercel --prod
```

---

## ✅ Step 6: Verify Everything Works

### Test Backend Health

```powershell
# Test health endpoint
curl http://147.182.193.11:3001/health

# Expected response:
# {"status":"ok","timestamp":"..."}
```

### Test API Endpoints

```powershell
# Test chambers endpoint
curl http://147.182.193.11:3001/api/chambers

# Test bookings endpoint
curl http://147.182.193.11:3001/api/bookings
```

### Test Frontend

1. Open your Vercel URL: `https://your-app.vercel.app`
2. Navigate to `/bookings` - should load booking system
3. Navigate to `/admin` - should load admin console
4. Check browser console for any API errors

---

## 🔧 Troubleshooting

### Backend Not Starting

```bash
# Check PM2 logs
ssh root@147.182.193.11
pm2 logs advancia-backend

# Check if port is in use
netstat -tlnp | grep 3001

# Restart backend
pm2 restart advancia-backend
```

### Database Connection Issues

```bash
# Test database connection
ssh root@147.182.193.11
cd /var/www/advancia-payledger/backend
npx prisma db pull
```

### CORS Errors

Update `backend/src/app.ts` to include your Vercel domain:

```typescript
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://your-app.vercel.app",  // Add your Vercel URL
      process.env.FRONTEND_URL || "",
    ],
    credentials: true,
  })
);
```

Then redeploy backend.

### Frontend Can't Connect to Backend

1. Check backend is running: `curl http://147.182.193.11:3001/health`
2. Verify `NEXT_PUBLIC_API_URL` in Vercel environment variables
3. Check browser console for CORS errors
4. Ensure firewall allows port 3001

---

## 📊 Monitoring & Maintenance

### View Backend Logs

```bash
ssh root@147.182.193.11
pm2 logs advancia-backend
pm2 monit
```

### Update Backend

```bash
ssh root@147.182.193.11
cd /var/www/advancia-payledger/backend
git pull  # Or upload new files
npm install --production
npm run build
npx prisma migrate deploy
pm2 restart advancia-backend
```

### Database Backups

```bash
# Manual backup
ssh root@147.182.193.11
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Or use Supabase's built-in backups (recommended)
```

---

## 🎯 Quick Reference

**Server Access:**
```bash
ssh root@147.182.193.11
```

**Backend Commands:**
```bash
pm2 status                    # Check status
pm2 logs advancia-backend     # View logs
pm2 restart advancia-backend  # Restart
pm2 stop advancia-backend     # Stop
pm2 delete advancia-backend   # Remove
```

**URLs:**
- Backend API: http://147.182.193.11:3001
- Health Check: http://147.182.193.11:3001/health
- Frontend: https://your-app.vercel.app

**Environment Variables:**
- Backend: `/var/www/advancia-payledger/backend/.env`
- Frontend: Vercel Dashboard → Settings → Environment Variables

---

## 🚀 Next Steps After Deployment

1. ✅ Set up monitoring (PM2 Plus, Sentry, DataDog)
2. ✅ Configure automated backups
3. ✅ Set up domain name and SSL
4. ✅ Configure firewall rules
5. ✅ Set up CI/CD pipeline (GitHub Actions)
6. ✅ Load testing
7. ✅ Security audit

---

## 📞 Need Help?

**Common Issues:**
- SSH Permission Denied → Set up SSH keys or use password
- Port 3001 blocked → Check firewall: `ufw allow 3001`
- Database connection failed → Verify DATABASE_URL in .env
- CORS errors → Update FRONTEND_URL and cors config

**Useful Commands:**
```bash
# Check if backend is running
curl http://147.182.193.11:3001/health

# Check server resources
ssh root@147.182.193.11 "htop"

# Check disk space
ssh root@147.182.193.11 "df -h"
```

---

**Your production deployment is almost complete! Follow the steps above to get your backend running on DigitalOcean.** 🚀
