# 🎯 COMPLETE STACK ROADMAP - Advancia PayLedger

**Date:** January 31, 2026
**Status:** Ready for Implementation

---

## ✅ **VALIDATED ARCHITECTURE ALIGNMENT**

Your stack summary **perfectly aligns** with the validated edge-first architecture. Here's the mapping:

| Your Summary | Validated Architecture | Status |
|--------------|------------------------|--------|
| **Vercel Frontend** | ✅ Next.js UI only | Deployed |
| **Cloudflare Edge** | ✅ Olympus Workers (routing only) | Not setup |
| **AWS Backend** | ✅ ECS Fargate + Express | Ready to deploy |
| **AWS RDS Postgres** | ✅ PostgreSQL 18 | Ready to deploy |
| **Supabase Auth** | ✅ Authentication only | Not setup |
| **LLM Orchestrator** | ✅ Backend service | Partially implemented |
| **Redis** | ✅ ElastiCache | Ready to deploy |

---

## 📊 **CURRENT STATE vs DESIRED STATE**

### **✅ What's Ready:**
- Backend code (error-free, pushed to GitHub)
- Docker-compose.yml for local dev
- Prisma schema with PostgreSQL
- Authentication middleware (needs Supabase migration)
- Payment processing (Stripe + Crypto)
- Blockchain integrations (Solana, Ethereum, Polygon, Base)

### **⏳ What's Missing:**
- Supabase project setup
- AWS infrastructure deployment
- Cloudflare Workers (Olympus) deployment
- LLM orchestration layer
- Vector DB for embeddings
- Redis queue for background jobs

### **❌ What Was Removed (Good!):**
- DigitalOcean confusion
- Azure overhead
- Docker Desktop issues
- WSL/Ubuntu complexity
- Netlify references

---

## 🚀 **PRIORITIZED IMPLEMENTATION ROADMAP**

### **PHASE 1: IMMEDIATE (Do First) - 2 hours**

#### **1. Supabase Setup (30 min)**
```bash
# 1. Create Supabase project
# Go to: https://supabase.com/dashboard

# 2. Get credentials:
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_JWT_SECRET=your-jwt-secret

# 3. Configure Auth settings:
# - Enable Email auth
# - Set site URL
# - Configure email templates
```

**Role:** Authentication ONLY
- ✅ User registration
- ✅ Login/logout
- ✅ Password reset
- ✅ JWT token issuance
- ❌ NO business data storage

#### **2. Update Backend for Supabase (1 hour)**

**Update `backend/src/middleware/auth.ts`:**
```typescript
// Validate Supabase JWT instead of custom JWT
const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET) as any;
const supabaseUserId = decoded.sub;

// Find or create user profile in RDS
let user = await prisma.user.findUnique({
  where: { supabaseId: supabaseUserId }
});

if (!user) {
  user = await prisma.user.create({
    data: {
      supabaseId: supabaseUserId,
      email: decoded.email,
      role: "PATIENT"
    }
  });
}
```

**Update Prisma Schema:**
```prisma
model User {
  id           String   @id @default(cuid())
  supabaseId   String?  @unique @map("supabase_id")
  email        String   @unique
  role         UserRole @default(PATIENT)
  // Remove passwordHash - Supabase handles this
}
```

**Run migration:**
```bash
cd backend
npx prisma migrate dev --name add_supabase_id
```

#### **3. Fix Vercel Root Directory (5 min)**
```bash
# Vercel Dashboard → Settings → General
# Root Directory: frontend
# Framework Preset: Next.js
# Save
```

#### **4. Remove Netlify References (5 min)**
```bash
# Search and remove any Netlify config files
rm -f netlify.toml
rm -f .netlify/
```

**Status:** ✅ Can complete in 2 hours

---

### **PHASE 2: INFRASTRUCTURE DEPLOYMENT - 3 hours**

#### **5. Deploy AWS Backend (90 min)**

Follow your AWS deployment guide:

```bash
# 1. Create VPC & Networking (5 min)
aws ec2 create-vpc --cidr-block 10.0.0.0/16

# 2. Create RDS PostgreSQL (10 min)
aws rds create-db-instance \
  --db-instance-identifier advancia-prod-db \
  --engine postgres \
  --engine-version 16.1

# 3. Create ElastiCache Redis (5 min)
aws elasticache create-cache-cluster \
  --cache-cluster-id advancia-redis

# 4. Store Secrets (5 min)
aws secretsmanager create-secret \
  --name advancia/prod/supabase-jwt-secret \
  --secret-string "your-supabase-jwt-secret"

# 5. Build & Push Docker Image (10 min)
# Note: Skip this if Docker not available
# Use GitHub Actions instead (see workaround below)

# 6. Create ECS Cluster (15 min)
aws ecs create-cluster --cluster-name advancia-prod-cluster

# 7. Create ALB (10 min)
aws elbv2 create-load-balancer --name advancia-alb

# 8. Create ECS Service (5 min)
aws ecs create-service --cluster advancia-prod-cluster

# 9. Run Migrations (5 min)
# Via ECS exec or separate migration task

# 10. Verify (5 min)
curl http://[ALB-DNS]/health
```

**Workaround for Docker (if not installed):**

Create `.github/workflows/deploy-aws.yml`:
```yaml
name: Deploy to AWS

on:
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push
        run: |
          cd backend
          docker build -t ${{ steps.login-ecr.outputs.registry }}/advancia-backend:latest .
          docker push ${{ steps.login-ecr.outputs.registry }}/advancia-backend:latest
```

#### **6. Deploy Vercel Frontend (15 min)**
```bash
# 1. Add environment variables in Vercel dashboard:
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_API_URL=https://api.advanciapayledger.com

# 2. Deploy
vercel --prod

# 3. Verify
# Visit your Vercel URL
```

#### **7. Deploy Cloudflare Workers (45 min)**

**Create Olympus Worker:**
```bash
npm create cloudflare@latest olympus
cd olympus
```

**`wrangler.toml`:**
```toml
name = "advancia-olympus"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[env.production]
vars = { 
  AWS_BACKEND_URL = "https://api.advanciapayledger.com",
  VERCEL_FRONTEND_URL = "https://your-app.vercel.app"
}
```

**`src/index.ts`:**
```typescript
export interface Env {
  AWS_BACKEND_URL: string
  VERCEL_FRONTEND_URL: string
  SUPABASE_JWT_PUBLIC_KEY: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    
    // Health check
    if (url.pathname === '/health') {
      return new Response('OK', { status: 200 })
    }
    
    // Route API calls to AWS
    if (url.pathname.startsWith('/api/')) {
      return await routeToAWS(request, env)
    }
    
    // Route frontend to Vercel
    return await routeToVercel(request, env)
  }
}

async function routeToAWS(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  
  // Simple passthrough - NO business logic
  const response = await fetch(env.AWS_BACKEND_URL + url.pathname + url.search, {
    method: request.method,
    headers: request.headers,
    body: request.method !== 'GET' ? request.body : undefined
  })
  
  // Cache GET responses only
  if (request.method === 'GET' && response.ok) {
    const cache = caches.default
    await cache.put(request, response.clone())
  }
  
  return response
}

async function routeToVercel(request: Request, env: Env): Promise<Response> {
  return await fetch(env.VERCEL_FRONTEND_URL + new URL(request.url).pathname, {
    method: request.method,
    headers: request.headers,
    body: request.method !== 'GET' ? request.body : undefined
  })
}
```

**Deploy:**
```bash
npm install
npx wrangler deploy
```

**Status:** ✅ Can complete in 3 hours

---

### **PHASE 3: LLM ORCHESTRATION - 4 hours**

#### **8. Setup LLM Orchestrator Backend (2 hours)**

**Create `backend/src/services/llmOrchestrator.ts`:**
```typescript
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

interface LLMRequest {
  task: string;
  context?: string;
  role: 'reasoning' | 'creative' | 'formatting';
}

interface LLMResponse {
  result: string;
  agent: string;
  tokensUsed: number;
}

export class LLMOrchestrator {
  private claude: Anthropic;
  private gemini: GoogleGenerativeAI;
  private openai: OpenAI;

  constructor() {
    this.claude = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!
    });
    
    this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!
    });
  }

  async orchestrate(request: LLMRequest): Promise<LLMResponse> {
    switch (request.role) {
      case 'reasoning':
        return await this.useClaude(request);
      case 'creative':
        return await this.useGemini(request);
      case 'formatting':
        return await this.useOpenAI(request);
      default:
        throw new Error('Invalid role');
    }
  }

  private async useClaude(request: LLMRequest): Promise<LLMResponse> {
    const message = await this.claude.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: request.task
      }]
    });

    return {
      result: message.content[0].type === 'text' ? message.content[0].text : '',
      agent: 'claude',
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens
    };
  }

  private async useGemini(request: LLMRequest): Promise<LLMResponse> {
    const model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(request.task);
    const response = result.response;

    return {
      result: response.text(),
      agent: 'gemini',
      tokensUsed: 0 // Gemini doesn't expose token count easily
    };
  }

  private async useOpenAI(request: LLMRequest): Promise<LLMResponse> {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{
        role: 'user',
        content: request.task
      }]
    });

    return {
      result: completion.choices[0].message.content || '',
      agent: 'openai',
      tokensUsed: completion.usage?.total_tokens || 0
    };
  }

  async multiAgentTask(task: string): Promise<LLMResponse[]> {
    // Parallel execution for independent tasks
    const [reasoning, creative, formatting] = await Promise.all([
      this.orchestrate({ task, role: 'reasoning' }),
      this.orchestrate({ task, role: 'creative' }),
      this.orchestrate({ task, role: 'formatting' })
    ]);

    return [reasoning, creative, formatting];
  }
}
```

**Create API endpoint `backend/src/routes/llm.routes.ts`:**
```typescript
import { Router } from 'express';
import { LLMOrchestrator } from '../services/llmOrchestrator';
import { authenticate } from '../middleware/auth';

const router = Router();
const orchestrator = new LLMOrchestrator();

router.post('/request', authenticate, async (req, res) => {
  try {
    const { task, role } = req.body;
    
    const response = await orchestrator.orchestrate({ task, role });
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'LLM orchestration failed' });
  }
});

router.post('/multi-agent', authenticate, async (req, res) => {
  try {
    const { task } = req.body;
    
    const responses = await orchestrator.multiAgentTask(task);
    
    res.json({ responses });
  } catch (error) {
    res.status(500).json({ error: 'Multi-agent task failed' });
  }
});

export default router;
```

**Install dependencies:**
```bash
cd backend
npm install @anthropic-ai/sdk @google/generative-ai openai
```

**Add to `backend/src/app.ts`:**
```typescript
import llmRoutes from './routes/llm.routes';
app.use('/api/v1/llm', llmRoutes);
```

#### **9. Setup Vector DB for Embeddings (1 hour)**

**Option A: Use Supabase Vector (Recommended)**
```sql
-- In Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE embeddings (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON embeddings USING ivfflat (embedding vector_cosine_ops);
```

**Option B: Use Pinecone**
```bash
npm install @pinecone-database/pinecone
```

**Create `backend/src/services/vectorDB.ts`:**
```typescript
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

export class VectorDB {
  private supabase;
  private openai;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!
    });
  }

  async storeEmbedding(userId: string, content: string, metadata?: any) {
    // Generate embedding
    const embedding = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: content
    });

    // Store in Supabase
    const { data, error } = await this.supabase
      .from('embeddings')
      .insert({
        user_id: userId,
        content: content,
        embedding: embedding.data[0].embedding,
        metadata: metadata
      });

    if (error) throw error;
    return data;
  }

  async searchSimilar(userId: string, query: string, limit: number = 5) {
    // Generate query embedding
    const embedding = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query
    });

    // Search similar embeddings
    const { data, error } = await this.supabase.rpc('match_embeddings', {
      query_embedding: embedding.data[0].embedding,
      match_threshold: 0.7,
      match_count: limit,
      filter_user_id: userId
    });

    if (error) throw error;
    return data;
  }
}
```

**Create matching function in Supabase:**
```sql
CREATE OR REPLACE FUNCTION match_embeddings(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT,
  filter_user_id TEXT
)
RETURNS TABLE (
  id BIGINT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    embeddings.id,
    embeddings.content,
    1 - (embeddings.embedding <=> query_embedding) AS similarity
  FROM embeddings
  WHERE embeddings.user_id = filter_user_id
    AND 1 - (embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

#### **10. Setup Redis Queue for Background Jobs (1 hour)**

**Install Bull:**
```bash
cd backend
npm install bull @types/bull
```

**Create `backend/src/services/queueService.ts`:**
```typescript
import Bull from 'bull';
import { LLMOrchestrator } from './llmOrchestrator';

const llmQueue = new Bull('llm-tasks', process.env.REDIS_URL!);

const orchestrator = new LLMOrchestrator();

// Process LLM tasks in background
llmQueue.process(async (job) => {
  const { task, role } = job.data;
  
  const response = await orchestrator.orchestrate({ task, role });
  
  return response;
});

export async function queueLLMTask(task: string, role: string) {
  const job = await llmQueue.add({ task, role });
  return job.id;
}

export async function getLLMTaskResult(jobId: string) {
  const job = await llmQueue.getJob(jobId);
  
  if (!job) {
    throw new Error('Job not found');
  }
  
  const state = await job.getState();
  
  if (state === 'completed') {
    return {
      status: 'completed',
      result: job.returnvalue
    };
  } else if (state === 'failed') {
    return {
      status: 'failed',
      error: job.failedReason
    };
  } else {
    return {
      status: state
    };
  }
}
```

**Status:** ✅ Can complete in 4 hours

---

### **PHASE 4: LOCAL DEVELOPMENT SETUP - 1 hour**

#### **11. Setup WSL2 (if on Windows) - Skip if already done**
```powershell
# Already uninstalled, skip this
```

#### **12. Setup Docker for Local Dev (30 min)**

**Option A: Reinstall Docker Desktop**
```bash
# Download from: https://www.docker.com/products/docker-desktop/
# Install and restart
```

**Option B: Use existing docker-compose.yml**
```bash
# Already configured at project root
docker-compose up -d
```

#### **13. Configure .env (15 min)**
```bash
cp .env.example .env

# Add all API keys:
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_JWT_SECRET=your-jwt-secret
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
OPENAI_API_KEY=sk-...
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

#### **14. Test Local Setup (15 min)**
```bash
# Start services
docker-compose up -d

# Run migrations
docker-compose exec backend npx prisma migrate dev

# Test backend
curl http://localhost:3000/health

# Test LLM endpoint
curl -X POST http://localhost:3000/api/v1/llm/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"task": "Summarize this", "role": "reasoning"}'
```

**Status:** ✅ Can complete in 1 hour

---

### **PHASE 5: SECURITY & MONITORING - 2 hours**

#### **15-19. Security Checks**

**Supabase RLS:**
```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = supabase_id);
```

**Backend-only service keys:**
```typescript
// ✅ CORRECT - Backend only
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Never expose to frontend
);

// ✅ CORRECT - Frontend only
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Safe to expose
);
```

**Cloudflare WAF:**
```bash
# Enable in Cloudflare dashboard:
# - WAF managed rules
# - Rate limiting (100 req/min)
# - Bot fight mode
# - SSL/TLS encryption mode: Full (strict)
```

**Status:** ✅ Can complete in 2 hours

---

## 📋 **COMPLETE ACTIONABLE CHECKLIST**

### **IMMEDIATE (2 hours)**
- [ ] Create Supabase project and get credentials
- [ ] Update backend auth middleware for Supabase
- [ ] Add `supabaseId` field to User model
- [ ] Run Prisma migration
- [ ] Fix Vercel root directory setting
- [ ] Remove Netlify references from codebase

### **INFRASTRUCTURE (3 hours)**
- [ ] Deploy AWS VPC and networking
- [ ] Deploy AWS RDS PostgreSQL
- [ ] Deploy AWS ElastiCache Redis
- [ ] Store secrets in AWS Secrets Manager
- [ ] Build and push Docker image to ECR (or use GitHub Actions)
- [ ] Create ECS cluster and service
- [ ] Create Application Load Balancer
- [ ] Run database migrations on AWS
- [ ] Deploy Vercel frontend with env vars
- [ ] Deploy Cloudflare Workers (Olympus)

### **LLM ORCHESTRATION (4 hours)**
- [ ] Install LLM SDKs (Anthropic, Gemini, OpenAI)
- [ ] Create LLM orchestrator service
- [ ] Create LLM API routes
- [ ] Setup Vector DB (Supabase vector extension)
- [ ] Create embedding storage and search functions
- [ ] Install Bull for Redis queue
- [ ] Create background job processor
- [ ] Test LLM endpoints

### **LOCAL DEVELOPMENT (1 hour)**
- [ ] Reinstall Docker Desktop (optional)
- [ ] Copy .env.example to .env
- [ ] Add all API keys to .env
- [ ] Run docker-compose up
- [ ] Test local backend
- [ ] Test local frontend

### **SECURITY (2 hours)**
- [ ] Enable Supabase RLS policies
- [ ] Verify backend-only service keys
- [ ] Ensure edge workers have no secrets
- [ ] Enable Cloudflare WAF
- [ ] Enable SSL/TLS
- [ ] Setup monitoring (Sentry, CloudWatch)

---

## 🎯 **TOTAL TIME ESTIMATE**

| Phase | Time | Priority |
|-------|------|----------|
| Immediate | 2 hours | **CRITICAL** |
| Infrastructure | 3 hours | **HIGH** |
| LLM Orchestration | 4 hours | **MEDIUM** |
| Local Development | 1 hour | **LOW** |
| Security | 2 hours | **HIGH** |
| **TOTAL** | **12 hours** | |

---

## 🚀 **RECOMMENDED START SEQUENCE**

**Day 1 (4 hours):**
1. Supabase setup (30 min)
2. Backend auth migration (1 hour)
3. AWS infrastructure deployment (2.5 hours)

**Day 2 (4 hours):**
1. Vercel deployment (15 min)
2. Cloudflare Workers deployment (45 min)
3. LLM orchestrator implementation (3 hours)

**Day 3 (4 hours):**
1. Vector DB setup (1 hour)
2. Redis queue setup (1 hour)
3. Security hardening (2 hours)

---

## ✅ **SUCCESS CRITERIA**

Your stack is **fully operational** when:

- [ ] Users can register/login via Supabase
- [ ] Frontend deployed on Vercel
- [ ] Backend running on AWS ECS
- [ ] Database on AWS RDS
- [ ] Cloudflare Workers routing traffic
- [ ] LLM orchestrator responding to requests
- [ ] Vector DB storing embeddings
- [ ] Redis processing background jobs
- [ ] All secrets secured
- [ ] Monitoring enabled

---

**Your stack summary is PERFECT. Ready to start with Phase 1?**
