# 🚀 Local Development Setup

**Last Updated:** January 31, 2026

---

## ✅ **What You Have**

Your `docker-compose.yml` is already configured for local development with:
- ✅ Backend API (Node.js 20)
- ✅ PostgreSQL 16 database
- ✅ Redis 8 cache
- ✅ Supabase integration ready

---

## 📋 **Prerequisites**

**Note:** Docker Desktop was uninstalled during cleanup. You have two options:

### **Option A: Reinstall Docker Desktop (Recommended for Local Dev)**
```powershell
# Download and install Docker Desktop
# https://www.docker.com/products/docker-desktop/

# After installation, verify:
docker --version
docker-compose --version
```

### **Option B: Run Without Docker (Direct Node.js)**
```bash
# Install PostgreSQL locally
# Install Redis locally
# Run backend directly with npm
cd backend
npm install
npm run dev
```

---

## 🔧 **Setup Steps (With Docker)**

### **1. Create .env File**

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### **2. Configure Supabase (Required)**

Get your Supabase credentials:
1. Go to https://supabase.com
2. Create a new project (or use existing)
3. Go to Project Settings → API
4. Copy these values to your `.env`:

```env
SUPABASE_URL="https://xxxxx.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_JWT_SECRET="your-jwt-secret-from-settings"
```

**Where to find JWT Secret:**
- Supabase Dashboard → Project Settings → API → JWT Settings → JWT Secret

### **3. Start Services**

```bash
# Start all services (backend, postgres, redis)
docker-compose up -d

# View logs
docker-compose logs -f backend

# Check status
docker-compose ps
```

### **4. Run Database Migrations**

```bash
# Enter backend container
docker-compose exec backend sh

# Inside container:
npx prisma migrate dev
npx prisma generate

# Exit container
exit
```

### **5. Verify Setup**

```bash
# Backend should be running on:
http://localhost:3000

# Test health endpoint:
curl http://localhost:3000/health

# PostgreSQL accessible at:
localhost:5432
Username: postgres
Password: postgres
Database: devdb

# Redis accessible at:
localhost:6379
```

---

## 🔄 **Development Workflow**

### **Start Development**
```bash
docker-compose up -d
```

### **View Logs**
```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Database only
docker-compose logs -f db
```

### **Stop Services**
```bash
docker-compose down
```

### **Reset Database**
```bash
# WARNING: This deletes all data
docker-compose down -v
docker-compose up -d
```

### **Run Prisma Commands**
```bash
# Generate Prisma client
docker-compose exec backend npx prisma generate

# Run migrations
docker-compose exec backend npx prisma migrate dev

# Open Prisma Studio
docker-compose exec backend npx prisma studio
```

### **Install New npm Packages**
```bash
# Backend packages
docker-compose exec backend npm install package-name

# Restart backend to apply changes
docker-compose restart backend
```

---

## 🎯 **Environment Variables Explained**

### **Required for Local Dev:**
```env
# Database (auto-configured by docker-compose)
DATABASE_URL=postgres://postgres:postgres@db:5432/devdb

# Supabase (get from Supabase dashboard)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGc...
SUPABASE_JWT_SECRET=your-jwt-secret
```

### **Optional but Recommended:**
```env
# JWT (for custom tokens if not using Supabase)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long

# Stripe (for payment testing)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Blockchain RPC (for crypto features)
SOLANA_RPC_URL=https://api.devnet.solana.com
ETHEREUM_RPC_URL=https://goerli.infura.io/v3/your-project-id
```

---

## 🐛 **Troubleshooting**

### **Port Already in Use**
```bash
# Check what's using port 3000
netstat -ano | findstr :3000

# Kill the process or change port in docker-compose.yml
```

### **Database Connection Failed**
```bash
# Ensure database container is running
docker-compose ps

# Check database logs
docker-compose logs db

# Restart database
docker-compose restart db
```

### **Backend Won't Start**
```bash
# Check backend logs
docker-compose logs backend

# Common issues:
# 1. Missing .env file → Create from .env.example
# 2. Invalid DATABASE_URL → Check docker-compose.yml
# 3. Port conflict → Change port in docker-compose.yml
```

### **Prisma Errors**
```bash
# Regenerate Prisma client
docker-compose exec backend npx prisma generate

# Reset database
docker-compose exec backend npx prisma migrate reset
```

---

## 📊 **Local vs Production**

| Aspect | Local (Docker) | Production (AWS) |
|--------|----------------|------------------|
| **Database** | PostgreSQL in Docker | AWS RDS PostgreSQL 18 |
| **Redis** | Redis in Docker | AWS ElastiCache |
| **Backend** | Node.js in Docker | AWS ECS Fargate |
| **Auth** | Supabase (same) | Supabase (same) |
| **Frontend** | localhost:3000 | Vercel |
| **Edge** | None | Cloudflare Workers |

---

## 🚀 **Next Steps**

### **For Local Development:**
1. ✅ Docker-compose.yml configured
2. ⏳ Install Docker Desktop (if needed)
3. ⏳ Create .env file with Supabase credentials
4. ⏳ Run `docker-compose up -d`
5. ⏳ Run database migrations
6. ⏳ Start coding!

### **For Production Deployment:**
1. ⏳ Setup Supabase project
2. ⏳ Deploy backend to AWS ECS
3. ⏳ Deploy frontend to Vercel
4. ⏳ Setup Cloudflare Workers (Olympus)

---

## 📝 **Quick Reference**

```bash
# Start everything
docker-compose up -d

# Stop everything
docker-compose down

# View logs
docker-compose logs -f

# Restart backend
docker-compose restart backend

# Run migrations
docker-compose exec backend npx prisma migrate dev

# Open Prisma Studio
docker-compose exec backend npx prisma studio

# Shell into backend
docker-compose exec backend sh

# Remove everything (including data)
docker-compose down -v
```

---

**Your docker-compose.yml is ready to use!**

Just need to:
1. Reinstall Docker Desktop (or use Option B)
2. Create .env with Supabase credentials
3. Run `docker-compose up -d`
