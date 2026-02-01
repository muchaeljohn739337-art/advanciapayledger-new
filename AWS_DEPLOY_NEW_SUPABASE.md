# 🚀 AWS Deployment with New Supabase

## ✅ Your New Supabase Credentials

**Project:** `fvceynqcxfwtbpbugtqr`  
**Database URL:** `postgresql://postgres:[YOUR_PASSWORD]@db.fvceynqcxfwtbpbugtqr.supabase.co:5432/postgres`  
**Supabase URL:** `https://fvceynqcxfwtbpbugtqr.supabase.co`  
**Service Role Key:** `[Get from Supabase Dashboard → Settings → API]`

---

## 🎯 AWS Deployment Options

### **Option 1: ECS Fargate (Recommended)**
- Serverless containers
- Auto-scaling
- No server management
- **Cost:** ~$50-100/month

### **Option 2: EC2 + Docker**
- Full control
- Cost-effective for steady traffic
- **Cost:** ~$30-60/month

### **Option 3: Elastic Beanstalk**
- Managed platform
- Easy deployment
- **Cost:** ~$40-80/month

---

## 🚀 Quick Deploy to AWS ECS (Recommended)

### **Prerequisites:**
```bash
# Install AWS CLI (already done ✅)
aws --version

# Configure AWS credentials
aws configure
# AWS Access Key ID: [Your key]
# AWS Secret Access Key: [Your secret]
# Default region: us-east-1
# Output format: json

# Verify
aws sts get-caller-identity
```

### **Step 1: Store Secrets in AWS Secrets Manager**

```bash
# Create secret for Supabase credentials
aws secretsmanager create-secret \
  --name advancia/supabase \
  --description "Supabase credentials for Advancia PayLedger" \
  --secret-string '{
    "DATABASE_URL":"postgresql://postgres:[YOUR_PASSWORD]@db.fvceynqcxfwtbpbugtqr.supabase.co:5432/postgres",
    "SUPABASE_URL":"https://fvceynqcxfwtbpbugtqr.supabase.co",
    "SUPABASE_SERVICE_ROLE_KEY":"[YOUR_SERVICE_ROLE_KEY]",
    "JWT_SECRET":"[YOUR_JWT_SECRET]"
  }'
```

### **Step 2: Create Redis on AWS ElastiCache**

```bash
# Create Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id advancia-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1 \
  --preferred-availability-zone us-east-1a

# Get Redis endpoint (wait 5 minutes for creation)
aws elasticache describe-cache-clusters \
  --cache-cluster-id advancia-redis \
  --show-cache-node-info
```

### **Step 3: Build and Push Docker Image**

```bash
cd backend

# Create Dockerfile if not exists
cat > Dockerfile << 'EOF'
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production
RUN npx prisma generate

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
EOF

# Build image
docker build -t advancia-backend .

# Create ECR repository
aws ecr create-repository --repository-name advancia-backend

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin [YOUR_AWS_ACCOUNT_ID].dkr.ecr.us-east-1.amazonaws.com

# Tag image
docker tag advancia-backend:latest [YOUR_AWS_ACCOUNT_ID].dkr.ecr.us-east-1.amazonaws.com/advancia-backend:latest

# Push to ECR
docker push [YOUR_AWS_ACCOUNT_ID].dkr.ecr.us-east-1.amazonaws.com/advancia-backend:latest
```

### **Step 4: Create ECS Cluster**

```bash
# Create cluster
aws ecs create-cluster --cluster-name advancia-cluster

# Create task definition
cat > task-definition.json << 'EOF'
{
  "family": "advancia-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "[YOUR_AWS_ACCOUNT_ID].dkr.ecr.us-east-1.amazonaws.com/advancia-backend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:[YOUR_AWS_ACCOUNT_ID]:secret:advancia/supabase:DATABASE_URL::"
        },
        {
          "name": "SUPABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:[YOUR_AWS_ACCOUNT_ID]:secret:advancia/supabase:SUPABASE_URL::"
        },
        {
          "name": "SUPABASE_SERVICE_ROLE_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:[YOUR_AWS_ACCOUNT_ID]:secret:advancia/supabase:SUPABASE_SERVICE_ROLE_KEY::"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3000"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/advancia-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
EOF

# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

### **Step 5: Create ECS Service**

```bash
# Create service
aws ecs create-service \
  --cluster advancia-cluster \
  --service-name advancia-backend-service \
  --task-definition advancia-backend \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}"
```

---

## 📋 AWS Deployment Checklist

### **Prerequisites:**
- [x] AWS CLI installed ✅
- [ ] AWS credentials configured
- [ ] Docker Desktop running
- [ ] Backend code ready

### **Deployment Steps:**
- [ ] Secrets stored in Secrets Manager
- [ ] Redis cluster created
- [ ] Docker image built and pushed to ECR
- [ ] ECS cluster created
- [ ] Task definition registered
- [ ] ECS service running
- [ ] Load balancer configured (optional)
- [ ] Domain configured (optional)

---

## 🔧 Alternative: Deploy to EC2

### **Quick EC2 Setup:**

```bash
# 1. Launch EC2 instance
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.small \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxx \
  --subnet-id subnet-xxxxx

# 2. SSH into instance
ssh -i your-key.pem ec2-user@[EC2_PUBLIC_IP]

# 3. Install Docker
sudo yum update -y
sudo yum install docker -y
sudo service docker start
sudo usermod -a -G docker ec2-user

# 4. Install Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20

# 5. Clone and deploy
git clone https://github.com/your-repo/advancia-payledger.git
cd advancia-payledger/backend
npm install
npx prisma generate
npm run build

# 6. Set environment variables
cat > .env << 'EOF'
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.fvceynqcxfwtbpbugtqr.supabase.co:5432/postgres
SUPABASE_URL=https://fvceynqcxfwtbpbugtqr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_ROLE_KEY]
NODE_ENV=production
PORT=3000
EOF

# 7. Start with PM2
npm install -g pm2
pm2 start dist/index.js --name advancia-backend
pm2 save
pm2 startup
```

---

## 💰 Cost Estimate

### **ECS Fargate:**
- **Compute:** ~$30/month (0.5 vCPU, 1GB RAM)
- **Redis:** ~$15/month (cache.t3.micro)
- **Data Transfer:** ~$5/month
- **Total:** ~$50/month

### **EC2:**
- **Instance:** ~$25/month (t3.small)
- **Redis:** ~$15/month
- **Total:** ~$40/month

### **Supabase (Free Tier):**
- Database: Included ✅
- Auth: Included ✅
- Storage: 1GB included

---

## 🎯 Recommended Architecture

```
┌─────────────────┐
│  Vercel (CDN)   │ ← Frontend
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  AWS ECS/EC2    │ ← Backend API
└────────┬────────┘
         │
    ┌────┴────┐
    ↓         ↓
┌────────┐ ┌──────────┐
│Supabase│ │AWS Redis │
│   DB   │ │ElastiCache│
└────────┘ └──────────┘
```

---

## 🚀 Quick Start Commands

```bash
# 1. Configure AWS
aws configure

# 2. Deploy to ECS (automated script coming)
./deploy-to-aws.sh

# 3. Verify deployment
aws ecs describe-services --cluster advancia-cluster --services advancia-backend-service

# 4. Get public IP
aws ecs describe-tasks --cluster advancia-cluster --tasks [TASK_ARN]
```

---

## 📞 Next Steps

1. **Fix Docker Desktop** (if needed - see AWS_SETUP_STATUS.md)
2. **Configure AWS credentials**
3. **Choose deployment method** (ECS recommended)
4. **Run deployment script**
5. **Update Vercel frontend** with new backend URL

**Your Supabase is ready - just need to deploy backend to AWS!** 🚀
