# Advancia PayLedger

Healthcare payment processing platform supporting cryptocurrency and traditional payments.

## 🚀 Quick Start (Automated Setup)

```bash
# Clone the repository
git clone https://github.com/advancia-devuser/advanciapayledger-new.git
cd advanciapayledger-new

# Run the automated setup script
chmod +x setup.sh
./setup.sh
```

The setup script will:
- ✅ Install all dependencies
- ✅ Create environment files
- ✅ Start PostgreSQL 18 and Redis
- ✅ Run database migrations
- ✅ Start both backend and frontend servers

## 📋 Prerequisites

- Node.js 20+
- PostgreSQL 18
- Redis 7
- Docker Desktop (recommended)

## 🛠️ Manual Setup

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
nano .env  # or use your preferred editor
```

### 3. Setup Database

#### Option A: Using Docker (Recommended)

```bash
docker-compose up -d postgres redis
```

#### Option B: Local PostgreSQL

```bash
# Install PostgreSQL 18
sudo apt install postgresql-18

# Create database
sudo -u postgres psql -c "CREATE DATABASE advanciapayledger;"
sudo -u postgres psql -c "CREATE USER advancia WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE advanciapayledger TO advancia;"
```

### 4. Run Migrations

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Start Development Servers

```bash
# Start both servers (from root)
npm run dev

# Or start individually
npm run dev:backend  # Backend on port 3001
npm run dev:frontend # Frontend on port 3000
```

## 🐳 Docker Deployment

```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## 📁 Project Structure

```
advancia-payledger/
├── backend/                 # Express + TypeScript API
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utilities (logger, prisma, etc.)
│   │   ├── agents/         # AI agents (hidden from users)
│   │   ├── app.ts          # Express app setup
│   │   └── index.ts        # Server entry point
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   ├── tests/              # Backend tests
│   ├── Dockerfile
│   └── package.json
├── frontend/                # Next.js 14 + React
│   ├── app/                # Next.js app directory
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx        # Home page
│   │   └── globals.css     # Global styles
│   ├── components/         # React components
│   ├── lib/                # Frontend utilities
│   ├── public/             # Static assets
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml      # Docker orchestration
├── .env.example            # Environment template
├── .gitignore
├── setup.sh                # Automated setup script
└── README.md
```

## 🔑 Environment Variables

See `.env.example` for all required environment variables.

**Critical variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret (min 32 chars)
- `ENCRYPTION_KEY` - Data encryption key (64 hex chars)
- `STRIPE_SECRET_KEY` - Stripe API key
- Blockchain RPC URLs for Solana, Ethereum, Polygon, Base

## 🧪 Testing

```bash
# Run all tests
npm test

# Backend tests only
npm run test:backend

# Frontend tests only
npm run test:frontend

# Watch mode
npm run test:watch
```

## 📊 Database Management

```bash
# Open Prisma Studio (GUI)
npm run db:studio

# Create migration
cd backend && npx prisma migrate dev --name migration_name

# Reset database (WARNING: Deletes all data)
cd backend && npx prisma migrate reset
```

## 🚢 Production Deployment

### DigitalOcean Setup

```bash
# SSH into your server
ssh root@157.245.8.131

# Clone repository
git clone https://github.com/advancia-devuser/advanciapayledger-new.git
cd advanciapayledger-new

# Setup environment
cp .env.example .env
nano .env  # Add production values

# Start with Docker
docker-compose -f docker-compose.prod.yml up -d
```

### SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
apt install certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d yourdomain.com
```

## 📈 Monitoring

- Backend health check: `http://localhost:3001/health` 
- Prometheus metrics: `http://localhost:3001/metrics` 
- Logs directory: `./backend/logs/` 

## 🔒 Security Features

- ✅ HIPAA-compliant encryption at rest
- ✅ JWT authentication with refresh tokens
- ✅ Rate limiting on all endpoints
- ✅ Helmet.js security headers
- ✅ CORS protection
- ✅ Input validation with Zod
- ✅ SQL injection prevention (Prisma)
- ✅ XSS protection
- ✅ Audit logging

## 🏥 Compliance

- **HIPAA**: PHI encryption, audit logs, access controls
- **PCI-DSS**: No credit card storage (Stripe tokens only)

## 🤖 AI Agents (Internal Use Only)

**CRITICAL**: All AI functionality is hidden from end users. The platform must appear as traditional software with human support.

- Never mention "AI" in user-facing text
- Attribute actions to "support team" or "processing system"
- No AI branding in interfaces

## 📞 Support

For issues or questions:
1. Check documentation
2. Review logs: `docker-compose logs -f` 
3. Check GitHub Issues
4. Contact: support@advanciapayledger.com

## 📝 License

Proprietary - All rights reserved

---

**Last Updated:** January 29, 2026
**Version:** 1.0.0
