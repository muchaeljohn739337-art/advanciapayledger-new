# 🚀 **ADVANCIA PAYLEDGER - DEPLOYMENT GUIDE**

## 📋 **TABLE OF CONTENTS**

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Local Development](#local-development)
4. [Staging Deployment](#staging-deployment)
5. [Production Deployment](#production-deployment)
6. [Kubernetes Deployment](#kubernetes-deployment)
7. [Monitoring & Health Checks](#monitoring--health-checks)
8. [Troubleshooting](#troubleshooting)
9. [Maintenance Procedures](#maintenance-procedures)

---

## 🎯 **PREREQUISITES**

### **System Requirements**

#### **Minimum Requirements**
- **CPU**: 4 cores
- **Memory**: 8GB RAM
- **Storage**: 50GB SSD
- **Network**: 1Gbps connection

#### **Recommended Requirements**
- **CPU**: 8 cores
- **Memory**: 16GB RAM
- **Storage**: 100GB SSD
- **Network**: 10Gbps connection

### **Software Dependencies**

#### **Required Software**
- **Node.js**: 20.x or higher
- **Docker**: 20.x or higher
- **Kubernetes**: 1.28 or higher
- **PostgreSQL**: 15.x or higher
- **Redis**: 7.x or higher
- **Git**: 2.x or higher

#### **Development Tools**
- **kubectl**: Kubernetes CLI
- **helm**: Helm package manager
- **docker-compose**: Local development
- **make**: Build automation
- **openssl**: Certificate management

### **Cloud Provider Setup**

#### **AWS (Recommended)**
- **EKS**: Kubernetes cluster
- **RDS**: PostgreSQL database
- **ElastiCache**: Redis cache
- **S3**: Object storage
- **CloudFront**: CDN
- **Route53**: DNS management

#### **Google Cloud Platform**
- **GKE**: Kubernetes cluster
- **Cloud SQL**: PostgreSQL database
- **Memorystore**: Redis cache
- **Cloud Storage**: Object storage
- **Cloud CDN**: CDN
- **Cloud DNS**: DNS management

#### **Azure**
- **AKS**: Kubernetes cluster
- **Azure Database**: PostgreSQL
- **Azure Cache**: Redis cache
- **Blob Storage**: Object storage
- **Azure CDN**: CDN
- **Azure DNS**: DNS management

---

## 🛠️ **ENVIRONMENT SETUP**

### **1. Repository Setup**

```bash
# Clone the repository
git clone https://github.com/advancia/payledger.git
cd payledger

# Install dependencies
npm install

# Setup environment files
cp .env.example .env.local
cp .env.staging.example .env.staging
cp .env.production.example .env.production
```

### **2. Environment Variables**

#### **Development (.env.local)**
```bash
# Application
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/payledger_dev
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# External Services
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AI Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...

# Web3
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/...
POLYGON_RPC_URL=https://polygon-mainnet.infura.io/v3/...
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
PROMETHEUS_GATEWAY_URL=http://localhost:9090

# Storage
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=payledger-dev
```

#### **Staging (.env.staging)**
```bash
NODE_ENV=staging
PORT=3000
LOG_LEVEL=info

DATABASE_URL=postgresql://user:password@staging-db:5432/payledger_staging
REDIS_URL=redis://staging-redis:6379

JWT_SECRET=staging-jwt-secret
JWT_REFRESH_SECRET=staging-refresh-secret

STRIPE_SECRET_KEY=sk_test_...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...

SENTRY_DSN=https://staging@...sentry.io/...
```

#### **Production (.env.production)**
```bash
NODE_ENV=production
PORT=3000
LOG_LEVEL=warn

DATABASE_URL=postgresql://user:password@prod-db:5432/payledger
REDIS_URL=redis://prod-redis:6379

JWT_SECRET=production-jwt-secret
JWT_REFRESH_SECRET=production-refresh-secret

STRIPE_SECRET_KEY=sk_live_...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...

SENTRY_DSN=https://production@...sentry.io/...
```

### **3. Database Setup**

#### **PostgreSQL**
```bash
# Install PostgreSQL
brew install postgresql  # macOS
sudo apt-get install postgresql  # Ubuntu

# Start PostgreSQL
brew services start postgresql
sudo systemctl start postgresql

# Create database
createdb payledger_dev
createdb payledger_staging
createdb payledger_production

# Run migrations
npm run migrate:up
```

#### **Redis**
```bash
# Install Redis
brew install redis  # macOS
sudo apt-get install redis-server  # Ubuntu

# Start Redis
brew services start redis
sudo systemctl start redis

# Test connection
redis-cli ping
```

---

## 💻 **LOCAL DEVELOPMENT**

### **1. Using Docker Compose**

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### **docker-compose.yml**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@db:5432/payledger
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    volumes:
      - .:/app
      - /app/node_modules

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: payledger
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  postgres_data:
  redis_data:
  grafana_data:
```

### **2. Manual Setup**

```bash
# Install dependencies
npm install

# Setup database
npm run db:setup

# Run migrations
npm run migrate:up

# Seed database (optional)
npm run db:seed

# Start development server
npm run dev

# Start monitoring services
npm run monitoring:start
```

### **3. Development Scripts**

#### **package.json scripts**
```json
{
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc && npm run build:assets",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "db:setup": "createdb payledger_dev",
    "db:migrate": "prisma migrate dev",
    "db:seed": "ts-node scripts/seed.ts",
    "db:reset": "prisma migrate reset",
    "monitoring:start": "docker-compose up -d prometheus grafana",
    "docker:build": "docker build -t payledger .",
    "docker:run": "docker run -p 3000:3000 payledger"
  }
}
```

---

## 🧪 **STAGING DEPLOYMENT**

### **1. Kubernetes Cluster Setup**

#### **Create Namespace**
```bash
kubectl create namespace advancia-staging
```

#### **Apply Secrets**
```bash
# Create secrets
kubectl apply -f k8s/secrets/staging-secrets.yaml

# Create config maps
kubectl apply -f k8s/config/staging-config.yaml
```

#### **Deploy Services**
```bash
# Deploy database
kubectl apply -f k8s/database/postgres-staging.yaml
kubectl apply -f k8s/database/redis-staging.yaml

# Deploy application services
kubectl apply -f k8s/services/api-gateway-staging.yaml
kubectl apply -f k8s/services/monitoring-service-staging.yaml
kubectl apply -f k8s/services/web3-service-staging.yaml
kubectl apply -f k8s/services/ai-orchestrator-staging.yaml

# Deploy monitoring
kubectl apply -f k8s/monitoring/prometheus-staging.yaml
kubectl apply -f k8s/monitoring/grafana-staging.yaml
```

### **2. CI/CD Pipeline**

#### **GitHub Actions Workflow**
```yaml
name: Deploy to Staging

on:
  push:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test
      - run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: docker/setup-buildx-action@v2
      - uses: docker/login-action@v2
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - run: docker build -t ghcr.io/advancia/payledger:staging .
      - run: docker push ghcr.io/advancia/payledger:staging

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: azure/setup-kubectl@v3
        with:
          version: 'v1.28.0'
      - run: kubectl config use-context staging-cluster
      - run: kubectl apply -f k8s/staging/
      - run: kubectl rollout status deployment/api-gateway -n advancia-staging
```

### **3. Staging Configuration**

#### **k8s/secrets/staging-secrets.yaml**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: advancia-secrets
  namespace: advancia-staging
type: Opaque
data:
  DATABASE_URL: <base64-encoded-database-url>
  REDIS_URL: <base64-encoded-redis-url>
  JWT_SECRET: <base64-encoded-jwt-secret>
  STRIPE_SECRET_KEY: <base64-encoded-stripe-key>
  OPENAI_API_KEY: <base64-encoded-openai-key>
  ANTHROPIC_API_KEY: <base64-encoded-anthropic-key>
  GEMINI_API_KEY: <base64-encoded-gemini-key>
  SENTRY_DSN: <base64-encoded-sentry-dsn>
```

#### **k8s/config/staging-config.yaml**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: advancia-config
  namespace: advancia-staging
data:
  NODE_ENV: "staging"
  LOG_LEVEL: "info"
  PORT: "3000"
  METRICS_INTERVAL: "30"
  ALERT_THRESHOLD_CPU: "80"
  ALERT_THRESHOLD_MEMORY: "85"
```

---

## 🚀 **PRODUCTION DEPLOYMENT**

### **1. Production Cluster Setup**

#### **High Availability Architecture**
```
┌──────────────────────────────────────────────────────────────────────┐
│                      Load Balancer (ALB)                              │
│  • SSL Termination • Health Checks • Auto Scaling                   │
└─────────────────────┬──────────────────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      Ingress Controller                              │
│  • NGINX Ingress • Rate Limiting • Path Routing                    │
└─────────────────────┬──────────────────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      Application Services                             │
│  • API Gateway (3 replicas) • Monitoring (2 replicas)              │
│  • Web3 Service (2 replicas) • AI Orchestrator (2 replicas)       │
└─────────────────────┬──────────────────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      Data Layer                                       │
│  • PostgreSQL (Primary + Replica) • Redis Cluster                  │
│  • S3 Storage • CloudFront CDN                                     │
└──────────────────────────────────────────────────────────────────────┐
```

### **2. Production Deployment Steps**

#### **Step 1: Infrastructure Setup**
```bash
# Create production namespace
kubectl create namespace advancia-prod

# Apply network policies
kubectl apply -f k8s/security/network-policies.yaml

# Apply resource quotas
kubectl apply -f k8s/security/resource-quotas.yaml

# Apply Pod Security Policies
kubectl apply -f k8s/security/pod-security-policies.yaml
```

#### **Step 2: Database Setup**
```bash
# Deploy PostgreSQL with high availability
kubectl apply -f k8s/database/postgres-prod.yaml

# Deploy Redis cluster
kubectl apply -f k8s/database/redis-cluster.yaml

# Wait for databases to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n advancia-prod --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n advancia-prod --timeout=300s
```

#### **Step 3: Application Deployment**
```bash
# Deploy core services
kubectl apply -f k8s/services/api-gateway-prod.yaml
kubectl apply -f k8s/services/monitoring-service-prod.yaml
kubectl apply -f k8s/services/web3-service-prod.yaml
kubectl apply -f k8s/services/ai-orchestrator-prod.yaml

# Deploy supporting services
kubectl apply -f k8s/services/security-service-prod.yaml
kubectl apply -f k8s/services/notification-service-prod.yaml

# Wait for services to be ready
kubectl wait --for=condition=available deployment --all -n advancia-prod --timeout=600s
```

#### **Step 4: Monitoring Setup**
```bash
# Deploy monitoring stack
kubectl apply -f k8s/monitoring/prometheus-prod.yaml
kubectl apply -f k8s/monitoring/grafana-prod.yaml
kubectl apply -f k8s/monitoring/alertmanager-prod.yaml

# Deploy logging stack
kubectl apply -f k8s/logging/elasticsearch-prod.yaml
kubectl apply -f k8s/logging/kibana-prod.yaml
kubectl apply -f k8s/logging/fluentd-prod.yaml
```

#### **Step 5: Ingress and DNS**
```bash
# Deploy ingress
kubectl apply -f k8s/ingress/ingress-prod.yaml

# Setup SSL certificates
kubectl apply -f k8s/ingress/cert-manager.yaml
kubectl apply -f k8s/ingress/ssl-certificates.yaml

# Update DNS records
# (Manual step in your DNS provider)
```

### **3. Production Configuration**

#### **k8s/services/api-gateway-prod.yaml**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: advancia-prod
  labels:
    app: api-gateway
    version: v1
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
        version: v1
    spec:
      containers:
      - name: api-gateway
        image: ghcr.io/advancia/payledger:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: advancia-secrets
              key: DATABASE_URL
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: advancia-secrets
              key: REDIS_URL
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        securityContext:
          runAsNonRoot: true
          runAsUser: 1000
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
      securityContext:
        fsGroup: 1000
---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway
  namespace: advancia-prod
  labels:
    app: api-gateway
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 3000
    name: http
  selector:
    app: api-gateway
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway
  namespace: advancia-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

---

## ☸️ **KUBERNETES DEPLOYMENT**

### **1. Cluster Architecture**

#### **Multi-Zone Deployment**
```yaml
# k8s/cluster/cluster.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: advancia-prod
  labels:
    name: advancia-prod
    environment: production
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: advancia-quota
  namespace: advancia-prod
spec:
  hard:
    requests.cpu: "10"
    requests.memory: 20Gi
    limits.cpu: "20"
    limits.memory: 40Gi
    persistentvolumeclaims: "10"
    services: "20"
    secrets: "20"
    configmaps: "20"
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: api-gateway-pdb
  namespace: advancia-prod
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: api-gateway
```

### **2. Service Mesh**

#### **Istio Configuration**
```yaml
# k8s/istio/istio.yaml
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: advancia-gateway
  namespace: advancia-prod
spec:
  selector:
    istio: ingressgateway
  servers:
  - port:
      number: 443
      name: https
      protocol: HTTPS
    tls:
      mode: SIMPLE
      credentialName: advancia-tls
    hosts:
    - api.advancia.com
---
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: advancia-vs
  namespace: advancia-prod
spec:
  hosts:
  - api.advancia.com
  gateways:
  - advancia-gateway
  http:
  - match:
    - uri:
        prefix: /api/v1
    route:
    - destination:
        host: api-gateway
        port:
          number: 3000
    timeout: 30s
    retries:
      attempts: 3
      perTryTimeout: 10s
```

### **3. Security Configuration**

#### **Network Policies**
```yaml
# k8s/security/network-policies.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: advancia-network-policy
  namespace: advancia-prod
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: advancia-prod
    - namespaceSelector:
        matchLabels:
          name: istio-system
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: advancia-prod
  - to: []
    ports:
    - protocol: TCP
      port: 53
    - protocol: UDP
      port: 53
  - to: []
    ports:
    - protocol: TCP
      port: 443
    - protocol: TCP
      port: 80
```

#### **Pod Security Policies**
```yaml
# k8s/security/pod-security-policies.yaml
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: advancia-psp
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  volumes:
    - 'configMap'
    - 'emptyDir'
    - 'projected'
    - 'secret'
    - 'downwardAPI'
    - 'persistentVolumeClaim'
  runAsUser:
    rule: 'MustRunAsNonRoot'
  seLinux:
    rule: 'RunAsAny'
  fsGroup:
    rule: 'RunAsAny'
```

---

## 📊 **MONITORING & HEALTH CHECKS**

### **1. Health Check Endpoints**

#### **Application Health**
```typescript
// src/health.ts
import express from 'express';
import { systemMonitor } from './lib/system-monitor';
import { databaseMonitor } from './lib/database-monitor';

export const healthRouter = express.Router();

healthRouter.get('/health', async (req, res) => {
  try {
    const [systemHealth, dbHealth] = await Promise.all([
      systemMonitor.getHealthCheck(),
      databaseMonitor.runHealthCheck()
    ]);

    const overallHealth = systemHealth.status === 'healthy' && 
                        dbHealth.status === 'healthy' ? 'healthy' : 'unhealthy';

    res.json({
      status: overallHealth,
      timestamp: new Date().toISOString(),
      checks: {
        system: systemHealth,
        database: dbHealth
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

healthRouter.get('/ready', async (req, res) => {
  // Check if service is ready to accept traffic
  const isReady = await checkReadiness();
  
  res.status(isReady ? 200 : 503).json({
    ready: isReady,
    timestamp: new Date().toISOString()
  });
});

healthRouter.get('/live', async (req, res) => {
  // Check if service is still alive
  res.json({
    alive: true,
    timestamp: new Date().toISOString()
  });
});
```

### **2. Prometheus Metrics**

#### **Metrics Configuration**
```typescript
// src/metrics.ts
import { register, Counter, Histogram, Gauge } from 'prom-client';

// Request metrics
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests',
  labelNames: ['method', 'route'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

// Business metrics
export const paymentsTotal = new Counter({
  name: 'payments_total',
  help: 'Total number of payments',
  labelNames: ['currency', 'status']
});

export const paymentAmount = new Histogram({
  name: 'payment_amount',
  help: 'Payment amount distribution',
  labelNames: ['currency'],
  buckets: [10, 50, 100, 500, 1000, 5000, 10000]
});

// System metrics
export const activeUsers = new Gauge({
  name: 'active_users',
  help: 'Number of active users'
});

export const databaseConnections = new Gauge({
  name: 'database_connections',
  help: 'Number of database connections',
  labelNames: ['state']
});

// Register metrics
register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDuration);
register.registerMetric(paymentsTotal);
register.registerMetric(paymentAmount);
register.registerMetric(activeUsers);
register.registerMetric(databaseConnections);
```

### **3. Grafana Dashboards**

#### **Dashboard Configuration**
```json
{
  "dashboard": {
    "title": "Advancia PayLedger Overview",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "50th percentile"
          }
        ]
      },
      {
        "title": "Payment Volume",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(payments_total[5m])",
            "legendFormat": "{{currency}} {{status}}"
          }
        ]
      },
      {
        "title": "System Health",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=\"advancia\"}",
            "legendFormat": "{{instance}}"
          }
        ]
      }
    ]
  }
}
```

---

## 🔧 **TROUBLESHOOTING**

### **1. Common Issues**

#### **Database Connection Issues**
```bash
# Check database connectivity
kubectl exec -it postgres-pod -- psql -U postgres -d payledger

# Check connection logs
kubectl logs postgres-pod -n advancia-prod

# Test connection from application pod
kubectl exec -it api-gateway-pod -- nc -zv postgres 5432
```

#### **Memory Issues**
```bash
# Check memory usage
kubectl top pods -n advancia-prod

# Check OOM events
kubectl describe pod <pod-name> -n advancia-prod

# Increase memory limits
kubectl patch deployment api-gateway -n advancia-prod -p '{"spec":{"template":{"spec":{"containers":[{"name":"api-gateway","resources":{"limits":{"memory":"2Gi"}}}]}}}}'
```

#### **Performance Issues**
```bash
# Check CPU usage
kubectl top pods -n advancia-prod --sort-by=cpu

# Check response times
curl -w "@curl-format.txt" -o /dev/null -s https://api.advancia.com/health

# Check database queries
kubectl exec -it postgres-pod -- psql -U postgres -d payledger -c "SELECT query, calls, total_time, mean_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

### **2. Debug Commands**

#### **Pod Debugging**
```bash
# Get pod logs
kubectl logs <pod-name> -n advancia-prod -f

# Exec into pod
kubectl exec -it <pod-name> -n advancia-prod -- /bin/bash

# Check pod events
kubectl describe pod <pod-name> -n advancia-prod

# Check pod resources
kubectl exec <pod-name> -n advancia-prod -- top
```

#### **Service Debugging**
```bash
# Check service endpoints
kubectl get endpoints <service-name> -n advancia-prod

# Test service connectivity
kubectl exec -it <pod-name> -n advancia-prod -- curl <service-name>.<namespace>.svc.cluster.local

# Check ingress
kubectl get ingress -n advancia-prod
kubectl describe ingress <ingress-name> -n advancia-prod
```

#### **Network Debugging**
```bash
# Check network policies
kubectl get networkpolicy -n advancia-prod

# Test connectivity between pods
kubectl exec -it <pod1> -n advancia-prod -- ping <pod2-ip>

# Check DNS resolution
kubectl exec -it <pod-name> -n advancia-prod -- nslookup kubernetes.default.svc.cluster.local
```

---

## 🔄 **MAINTENANCE PROCEDURES**

### **1. Rolling Updates**

#### **Update Application**
```bash
# Update image
kubectl set image deployment/api-gateway api-gateway=ghcr.io/advancia/payledger:v2.1.0 -n advancia-prod

# Check rollout status
kubectl rollout status deployment/api-gateway -n advancia-prod

# Watch rollout progress
kubectl rollout status deployment/api-gateway -n advancia-prod --timeout=600s
```

#### **Database Migrations**
```bash
# Run migrations
kubectl exec -it api-gateway-pod -n advancia-prod -- npm run migrate:up

# Check migration status
kubectl exec -it api-gateway-pod -n advancia-prod -- npm run migrate:status

# Rollback if needed
kubectl exec -it api-gateway-pod -n advancia-prod -- npm run migrate:down
```

### **2. Backup Procedures**

#### **Database Backup**
```bash
# Create backup
kubectl exec postgres-pod -n advancia-prod -- pg_dump -U postgres payledger > backup-$(date +%Y%m%d).sql

# Restore backup
kubectl exec -i postgres-pod -n advancia-prod -- psql -U postgres payledger < backup-20240115.sql

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d)
kubectl exec postgres-pod -n advancia-prod -- pg_dump -U postgres payledger > $BACKUP_DIR/backup-$DATE.sql
aws s3 cp $BACKUP_DIR/backup-$DATE.sql s3://advancia-backups/database/
```

#### **Application Backup**
```bash
# Backup configuration
kubectl get configmap advancia-config -n advancia-prod -o yaml > config-backup.yaml

# Backup secrets
kubectl get secret advancia-secrets -n advancia-prod -o yaml > secrets-backup.yaml

# Backup deployment specs
kubectl get deployment -n advancia-prod -o yaml > deployments-backup.yaml
```

### **3. Scaling Operations**

#### **Manual Scaling**
```bash
# Scale up
kubectl scale deployment api-gateway --replicas=5 -n advancia-prod

# Scale down
kubectl scale deployment api-gateway --replicas=2 -n advancia-prod

# Check HPA status
kubectl get hpa -n advancia-prod
```

#### **Auto Scaling Configuration**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway
  namespace: advancia-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
```

---

## 📞 **SUPPORT & CONTACT**

### **Emergency Contacts**
- **On-Call Engineer**: oncall@advancia.com
- **DevOps Team**: devops@advancia.com
- **Infrastructure Team**: infrastructure@advancia.com

### **Monitoring Links**
- **Grafana Dashboard**: https://grafana.advancia.com
- **Prometheus**: https://prometheus.advancia.com
- **Kibana Logs**: https://kibana.advancia.com
- **Status Page**: https://status.advancia.com

### **Documentation**
- **Architecture Docs**: https://docs.advancia.com/architecture
- **API Documentation**: https://docs.advancia.com/api
- **Runbooks**: https://docs.advancia.com/runbooks

---

*Last Updated: January 2026*
*Version: 2.0*
*Maintainer: Advancia DevOps Team*
