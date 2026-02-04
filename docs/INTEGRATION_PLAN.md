# Sprint 1 Integration Plan
## Foundation & Service Integration

### Current State Analysis
Based on existing codebase review:

**✅ Existing Infrastructure:**
- Monorepo structure with `/backend`, `/frontend`, `/docs`
- Express.js backend with comprehensive route structure
- Prisma ORM with PostgreSQL
- Authentication system with JWT tokens
- Role-based access control (SUPER_ADMIN, FACILITY_ADMIN, etc.)
- Healthcare-specific models (Facility, Patient, Provider)
- Payment processing infrastructure

**🔧 Missing Components for Multi-Tenant SaaS:**
- Tenant isolation layer
- Tenant-specific routing
- Multi-tenant database schema
- Tenant management UI
- Per-tenant analytics

### Sprint 1 Implementation Tasks

#### 1. Tenant Service Integration

**Create Tenant Model & Service:**
```typescript
// backend/src/models/tenant.model.ts
model Tenant {
  id          String   @id @default(uuid())
  name        String
  domain      String?  @unique
  subdomain   String   @unique
  status      TenantStatus @default(ACTIVE)
  plan        BillingPlan @default(FREE)
  settings    Json     // Tenant-specific settings
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  users       TenantUser[]
  facilities  Facility[]
  auditLogs   AuditLog[]
  
  @@index([subdomain])
  @@index([domain])
  @@map("tenants")
}

model TenantUser {
  id        String   @id @default(uuid())
  tenantId  String
  userId    String
  role      TenantRole
  joinedAt  DateTime @default(now())
  
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
  
  @@unique([tenantId, userId])
  @@map("tenant_users")
}
```

**Tenant Middleware:**
```typescript
// backend/src/middleware/tenant.ts
export const tenantMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const subdomain = req.subdomains?.[0];
  if (!subdomain) {
    return res.status(400).json({ error: 'Tenant required' });
  }
  
  const tenant = await prisma.tenant.findUnique({
    where: { subdomain }
  });
  
  if (!tenant || tenant.status !== 'ACTIVE') {
    return res.status(404).json({ error: 'Tenant not found' });
  }
  
  req.tenant = tenant;
  next();
};
```

#### 2. API Gateway Structure

**Gateway Configuration:**
```typescript
// backend/src/gateway/index.ts
import express from 'express';
import { tenantMiddleware } from '../middleware/tenant';
import { authRoutes } from '../routes/auth';
import { tenantRoutes } from '../routes/tenants';

const gateway = express();

// Apply tenant resolution first
gateway.use(tenantMiddleware);

// Route to tenant-specific services
gateway.use('/api/auth', authRoutes);
gateway.use('/api/tenants', tenantRoutes);

// Forward to microservices
gateway.use('/api/payments', proxy('payment-service:3001'));
gateway.use('/api/analytics', proxy('analytics-service:3002'));
```

#### 3. Frontend Console Structure

**Role-Based Route Guards:**
```typescript
// frontend/src/components/withRoleGuard.tsx
export function withRoleGuard<T>(
  Component: React.ComponentType<T>,
  allowedRoles: UserRole[]
) {
  return function GuardedComponent(props: T) {
    const { user, loading } = useAuth();
    
    if (loading) return <LoadingSpinner />;
    if (!user || !allowedRoles.includes(user.role)) {
      return <UnauthorizedPage />;
    }
    
    return <Component {...props} />;
  };
}
```

**Console Route Structure:**
```typescript
// frontend/app/super-admin/page.tsx
export default withRoleGuard(SuperAdminDashboard, ['SUPER_ADMIN']);

// frontend/app/admin/page.tsx  
export default withRoleGuard(AdminDashboard, ['FACILITY_ADMIN', 'SUPER_ADMIN']);

// frontend/app/staff/page.tsx
export default withRoleGuard(StaffDashboard, ['FACILITY_STAFF', 'FACILITY_ADMIN', 'SUPER_ADMIN']);
```

#### 4. Docker/Kubernetes Setup

**Docker Compose for Development:**
```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: advancia_payledger
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

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/advancia_payledger
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001

volumes:
  postgres_data:
```

**Kubernetes Deployment:**
```yaml
# infra/k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend-api
  template:
    metadata:
      labels:
        app: backend-api
    spec:
      containers:
      - name: backend
        image: advancia/backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
```

### Integration Steps

1. **Database Migration** - Add tenant tables to existing schema
2. **Service Refactoring** - Extract tenant-specific logic
3. **Middleware Implementation** - Add tenant resolution
4. **Frontend Updates** - Implement role-based routing
5. **Containerization** - Dockerize all services
6. **K8s Deployment** - Set up cluster configuration

### Success Criteria

- [ ] Multi-tenant routing works with subdomains
- [ ] Role-based access control enforced
- [ ] Docker containers run locally
- [ ] Kubernetes deployment successful
- [ ] Existing functionality preserved

### Risk Mitigation

- **Database Migration:** Backup before schema changes
- **Service Disruption:** Blue-green deployment strategy  
- **Security:** Audit all tenant isolation mechanisms
- **Performance:** Monitor query performance with tenant filters
