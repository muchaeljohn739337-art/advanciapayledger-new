# Advancia Pay Ledger - System Architecture

This document provides comprehensive architecture diagrams for the Advancia Pay Ledger healthcare payment platform.

---

## High-Level Architecture Overview

```mermaid
flowchart TB
  subgraph Clients ["Client Applications"]
    WebApp["Web Application\n(Next.js)"]
    MobileApp["Mobile App\n(Future)"]
    AdminPanel["Admin Dashboard"]
  end

  subgraph Edge ["Edge & CDN Layer"]
    Vercel["Vercel Edge Network\n(Global CDN)"]
    Cloudflare["Cloudflare\n(DNS, SSL, DDoS)"]
  end

  WebApp -->|HTTPS| Vercel
  MobileApp -->|HTTPS| Vercel
  AdminPanel -->|HTTPS| Vercel
  Vercel --> Cloudflare

  subgraph LoadBalancing ["Load Balancing"]
    DO_LB["DigitalOcean\nLoad Balancer"]
  end

  Cloudflare --> DO_LB

  subgraph Backend ["Backend Services (GCP/DigitalOcean)"]
    API["API Gateway\n(Express.js)"]
    AuthService["Authentication Service\n(JWT + 2FA)"]
    PaymentService["Payment Service\n(Stripe Integration)"]
    BlockchainService["Blockchain Service\n(Multi-chain)"]
    AnalyticsService["Analytics Service"]
    NotificationService["Notification Service"]
  end

  DO_LB --> API
  API --> AuthService
  API --> PaymentService
  API --> BlockchainService
  API --> AnalyticsService
  API --> NotificationService

  subgraph DataLayer ["Data Layer"]
    Supabase["Supabase\n(PostgreSQL 18)"]
    Redis["Redis 7\n(Caching & Sessions)"]
    S3["Object Storage\n(AWS S3)"]
  end

  AuthService -->|User Data| Supabase
  PaymentService -->|Transactions| Supabase
  BlockchainService -->|Wallet Data| Supabase
  AnalyticsService -->|Read| Supabase

  API -->|Cache| Redis
  AuthService -->|Sessions| Redis

  NotificationService -->|Files| S3

  subgraph External ["External Services"]
    Stripe["Stripe\n(Payment Processing)"]
    Plaid["Plaid\n(ACH Transfers)"]
    Solana["Solana Network"]
    Ethereum["Ethereum Network"]
    Polygon["Polygon Network"]
    Base["Base Network"]
  end

  PaymentService --> Stripe
  PaymentService --> Plaid
  BlockchainService --> Solana
  BlockchainService --> Ethereum
  BlockchainService --> Polygon
  BlockchainService --> Base

  subgraph CICD ["CI/CD Pipeline"]
    GitHub["GitHub Repository"]
    Actions["GitHub Actions"]
    Secrets["GitHub Secrets"]
  end

  GitHub --> Actions
  Actions --> Secrets
  Actions -.->|Deploy| Vercel
  Actions -.->|Deploy| Backend
  Actions -.->|Migrate| Supabase

  subgraph Monitoring ["Observability & Security"]
    Sentry["Sentry\n(Error Tracking)"]
    Prometheus["Prometheus\n(Metrics)"]
    Grafana["Grafana\n(Dashboards)"]
    Logs["Centralized Logging"]
    WAF["Cloudflare WAF"]
  end

  Backend --> Sentry
  Backend --> Prometheus
  Prometheus --> Grafana
  Backend --> Logs
  Cloudflare --> WAF

  classDef client fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
  classDef edge fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
  classDef backend fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
  classDef data fill:#fff3e0,stroke:#f57c00,stroke-width:2px
  classDef external fill:#fce4ec,stroke:#c2185b,stroke-width:2px
  classDef cicd fill:#e0f2f1,stroke:#00796b,stroke-width:2px
  classDef monitor fill:#f1f8e9,stroke:#689f38,stroke-width:2px

  class Clients client
  class Edge edge
  class Backend backend
  class DataLayer data
  class External external
  class CICD cicd
  class Monitoring monitor
```

---

## Detailed Component Architecture

```mermaid
flowchart TB
  subgraph Frontend ["Frontend Layer (Vercel)"]
    NextJS["Next.js 14 App Router"]
    ReactComponents["React Components\n(shadcn/ui)"]
    StateManagement["State Management\n(React Context)"]
    APIClient["API Client\n(Fetch/Axios)"]
  end

  NextJS --> ReactComponents
  ReactComponents --> StateManagement
  ReactComponents --> APIClient

  subgraph APIGateway ["API Gateway Layer"]
    ExpressAPI["Express.js Server"]
    Middleware["Middleware Stack"]
    RateLimiter["Rate Limiter"]
    CORS["CORS Handler"]
    AuthMiddleware["Auth Middleware"]
  end

  APIClient -->|HTTPS| ExpressAPI
  ExpressAPI --> Middleware
  Middleware --> RateLimiter
  Middleware --> CORS
  Middleware --> AuthMiddleware

  subgraph CoreServices ["Core Services"]
    direction TB

    subgraph AuthModule ["Authentication Module"]
      Login["Login/Register"]
      JWT["JWT Token Manager"]
      TwoFA["2FA (TOTP)"]
      SessionMgr["Session Manager"]
    end

    subgraph PaymentModule ["Payment Module"]
      StripeInt["Stripe Integration"]
      PlaidInt["Plaid/ACH Integration"]
      PaymentProcessor["Payment Processor"]
      RefundHandler["Refund Handler"]
      WebhookHandler["Webhook Handler"]
    end

    subgraph BlockchainModule ["Blockchain Module"]
      WalletMgr["Wallet Manager"]
      TxBuilder["Transaction Builder"]
      ChainSelector["Chain Selector"]
      GasEstimator["Gas Estimator"]
      TxMonitor["Transaction Monitor"]
    end

    subgraph HealthcareModule ["Healthcare Module"]
      PatientMgr["Patient Manager"]
      FacilityMgr["Facility Manager"]
      BillingEngine["Billing Engine"]
      InsuranceInt["Insurance Integration"]
    end

    subgraph AnalyticsModule ["Analytics Module"]
      RevenueAnalytics["Revenue Analytics"]
      UserAnalytics["User Analytics"]
      TransactionAnalytics["Transaction Analytics"]
      ReportGenerator["Report Generator"]
    end
  end

  AuthMiddleware --> AuthModule
  ExpressAPI --> PaymentModule
  ExpressAPI --> BlockchainModule
  ExpressAPI --> HealthcareModule
  ExpressAPI --> AnalyticsModule

  subgraph DatabaseLayer ["Database Layer (Supabase)"]
    PostgreSQL["PostgreSQL 18"]
    RLS["Row Level Security"]
    Indexes["Optimized Indexes"]
    Triggers["Database Triggers"]
    Functions["Stored Functions"]
  end

  CoreServices --> PostgreSQL
  PostgreSQL --> RLS
  PostgreSQL --> Indexes
  PostgreSQL --> Triggers
  PostgreSQL --> Functions

  subgraph CacheLayer ["Cache Layer (Redis)"]
    SessionCache["Session Cache"]
    DataCache["Data Cache"]
    RateLimitCache["Rate Limit Cache"]
    QueueCache["Job Queue"]
  end

  AuthModule --> SessionCache
  CoreServices --> DataCache
  RateLimiter --> RateLimitCache
  CoreServices --> QueueCache

  classDef frontend fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
  classDef api fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
  classDef service fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
  classDef database fill:#fff3e0,stroke:#f57c00,stroke-width:2px
  classDef cache fill:#fce4ec,stroke:#c2185b,stroke-width:2px

  class Frontend frontend
  class APIGateway api
  class CoreServices service
  class DatabaseLayer database
  class CacheLayer cache
```

---

## Data Flow Architecture

```mermaid
sequenceDiagram
    participant User as Healthcare User
    participant Web as Web App (Vercel)
    participant CDN as Cloudflare CDN
    participant API as API Gateway
    participant Auth as Auth Service
    participant Payment as Payment Service
    participant DB as Supabase DB
    participant Redis as Redis Cache
    participant Stripe as Stripe API
    participant Blockchain as Blockchain Network

    User->>Web: Access Application
    Web->>CDN: Request Static Assets
    CDN-->>Web: Serve Cached Assets

    User->>Web: Login Request
    Web->>API: POST /auth/login
    API->>Auth: Validate Credentials
    Auth->>DB: Query User
    DB-->>Auth: User Data
    Auth->>Redis: Store Session
    Auth-->>API: JWT Token
    API-->>Web: Auth Response
    Web-->>User: Dashboard

    User->>Web: Make Payment
    Web->>API: POST /payments/create
    API->>Auth: Verify JWT
    Auth->>Redis: Check Session
    Redis-->>Auth: Valid Session
    API->>Payment: Process Payment
    Payment->>DB: Check Balance
    DB-->>Payment: Balance OK
    Payment->>Stripe: Create Payment Intent
    Stripe-->>Payment: Payment Confirmed
    Payment->>DB: Record Transaction
    Payment->>Blockchain: Optional Crypto Payment
    Blockchain-->>Payment: Transaction Hash
    Payment-->>API: Payment Success
    API-->>Web: Success Response
    Web-->>User: Payment Confirmation
```

---

## Security Architecture

```mermaid
flowchart TB
  subgraph PublicInternet ["Public Internet"]
    Attacker["Potential Threats"]
    LegitUser["Legitimate Users"]
  end

  subgraph SecurityLayers ["Security Layers"]
    WAF["Cloudflare WAF\n- DDoS Protection\n- Bot Detection\n- Rate Limiting"]
    SSL["SSL/TLS Encryption\n- TLS 1.3\n- Certificate Management"]
    AuthLayer["Authentication Layer\n- JWT Tokens\n- 2FA/TOTP\n- Session Management"]
    RLS_Layer["Row Level Security\n- User Isolation\n- Facility Isolation\n- HIPAA Compliance"]
    Encryption["Data Encryption\n- At Rest (AES-256)\n- In Transit (TLS)\n- Field-level Encryption"]
  end

  Attacker -->|Blocked| WAF
  LegitUser -->|HTTPS| WAF
  WAF --> SSL
  SSL --> AuthLayer
  AuthLayer --> RLS_Layer
  RLS_Layer --> Encryption

  subgraph SecurityControls ["Security Controls"]
    SecretsMgr["Secrets Manager\n- GitHub Secrets\n- Environment Variables"]
    AuditLog["Audit Logging\n- All Access Logged\n- HIPAA Audit Trail"]
    Monitoring["Security Monitoring\n- Sentry Alerts\n- Anomaly Detection"]
    Backup["Backup & Recovery\n- Daily Backups\n- Point-in-Time Recovery"]
  end

  Encryption --> SecretsMgr
  Encryption --> AuditLog
  Encryption --> Monitoring
  Encryption --> Backup

  subgraph Compliance ["Compliance & Standards"]
    HIPAA["HIPAA Compliance\n- PHI Protection\n- Access Controls"]
    PCI["PCI DSS\n- Payment Security\n- Tokenization"]
    SOC2["SOC 2 (Future)\n- Security Controls\n- Audit Reports"]
  end

  SecurityControls --> HIPAA
  SecurityControls --> PCI
  SecurityControls --> SOC2

  classDef threat fill:#ffebee,stroke:#c62828,stroke-width:2px
  classDef security fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
  classDef control fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
  classDef compliance fill:#fff3e0,stroke:#ef6c00,stroke-width:2px

  class PublicInternet threat
  class SecurityLayers security
  class SecurityControls control
  class Compliance compliance
```

---

## Deployment Architecture

```mermaid
flowchart TB
  subgraph Development ["Development Environment"]
    DevLocal["Local Development\n- Docker Compose\n- Hot Reload"]
    DevDB["Local PostgreSQL"]
    DevRedis["Local Redis"]
  end

  subgraph Staging ["Staging Environment"]
    StagingFE["Vercel Preview\n(Branch Deploys)"]
    StagingAPI["Staging API\n(DigitalOcean)"]
    StagingDB["Staging Database\n(Supabase)"]
    StagingRedis["Staging Redis"]
  end

  subgraph Production ["Production Environment"]
    ProdFE["Vercel Production\n(Global Edge)"]
    ProdAPI["Production API\n(GCP/DigitalOcean)"]
    ProdDB["Production Database\n(Supabase - Multi-AZ)"]
    ProdRedis["Production Redis\n(Managed)"]
    ProdBackup["Automated Backups"]
  end

  subgraph CICD_Pipeline ["CI/CD Pipeline"]
    GitPush["Git Push"]
    Tests["Automated Tests\n- Unit Tests\n- Integration Tests\n- Security Scans"]
    Build["Build & Package"]
    Deploy["Deploy"]
  end

  DevLocal --> GitPush
  GitPush --> Tests
  Tests -->|Pass| Build
  Build --> Deploy
  Deploy -.->|Preview| StagingFE
  Deploy -.->|Deploy| StagingAPI
  Deploy -.->|Production| ProdFE
  Deploy -.->|Production| ProdAPI

  StagingAPI --> StagingDB
  StagingAPI --> StagingRedis
  ProdAPI --> ProdDB
  ProdAPI --> ProdRedis
  ProdDB --> ProdBackup

  subgraph Monitoring_Prod ["Production Monitoring"]
    HealthChecks["Health Checks\n(Every 30s)"]
    Metrics["Metrics Collection\n(Prometheus)"]
    Alerts["Alert System\n(PagerDuty)"]
    Logs["Log Aggregation\n(Centralized)"]
  end

  ProdAPI --> HealthChecks
  ProdAPI --> Metrics
  Metrics --> Alerts
  ProdAPI --> Logs

  classDef dev fill:#e8eaf6,stroke:#3f51b5,stroke-width:2px
  classDef staging fill:#fff9c4,stroke:#f9a825,stroke-width:2px
  classDef prod fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
  classDef cicd fill:#e0f2f1,stroke:#00695c,stroke-width:2px
  classDef monitor fill:#fce4ec,stroke:#c2185b,stroke-width:2px

  class Development dev
  class Staging staging
  class Production prod
  class CICD_Pipeline cicd
  class Monitoring_Prod monitor
```

---

## Database Schema Architecture

```mermaid
erDiagram
    USERS ||--o{ FACILITIES : manages
    USERS ||--o{ WALLETS : owns
    USERS ||--o{ SESSIONS : has
    USERS ||--o{ AUDIT_LOGS : generates

    FACILITIES ||--o{ PATIENTS : treats
    FACILITIES ||--o{ TRANSACTIONS : processes
    FACILITIES ||--o{ SUBSCRIPTIONS : subscribes

    PATIENTS ||--o{ TRANSACTIONS : makes
    PATIENTS ||--o{ INSURANCE_CLAIMS : files

    WALLETS ||--o{ TRANSACTIONS : contains
    WALLETS ||--o{ BLOCKCHAIN_TRANSACTIONS : tracks

    TRANSACTIONS ||--o{ PAYMENT_METHODS : uses
    TRANSACTIONS ||--o{ REFUNDS : may_have

    USERS {
        uuid id PK
        string email UK
        string password_hash
        string role
        boolean mfa_enabled
        timestamp created_at
    }

    FACILITIES {
        uuid id PK
        uuid owner_id FK
        string name
        string type
        jsonb settings
        timestamp created_at
    }

    PATIENTS {
        uuid id PK
        uuid facility_id FK
        string first_name
        string last_name
        date date_of_birth
        jsonb medical_info
        timestamp created_at
    }

    WALLETS {
        uuid id PK
        uuid user_id FK
        decimal balance
        string currency
        timestamp updated_at
    }

    TRANSACTIONS {
        uuid id PK
        uuid facility_id FK
        uuid patient_id FK
        uuid wallet_id FK
        decimal amount
        string status
        string payment_method
        timestamp created_at
    }

    BLOCKCHAIN_TRANSACTIONS {
        uuid id PK
        uuid wallet_id FK
        string chain
        string tx_hash
        string status
        decimal amount
        timestamp created_at
    }

    SESSIONS {
        uuid id PK
        uuid user_id FK
        string token_hash
        timestamp expires_at
    }

    AUDIT_LOGS {
        uuid id PK
        uuid user_id FK
        string action
        jsonb details
        string ip_address
        timestamp created_at
    }
```

---

## Scaling Strategy

```mermaid
flowchart TB
  subgraph Current ["Current State (24 Facilities)"]
    C_FE["Frontend: Vercel Edge"]
    C_API["API: GCP Cloud Run\n(Auto-scaling 1-10)"]
    C_DB["Database: Supabase\n(Dedicated Instance)"]
    C_Redis["Redis: Managed (1 node)"]
  end

  subgraph Phase1 ["Phase 1: 100 Facilities"]
    P1_FE["Frontend: Vercel Edge (Same)"]
    P1_API["API: GCP Cloud Run\n(Auto-scaling 5-50)"]
    P1_DB["Database: Supabase\n(High Performance Tier)"]
    P1_Redis["Redis: Cluster (3 nodes)"]
    P1_Cache["Enhanced CDN Caching"]
  end

  subgraph Phase2 ["Phase 2: 500+ Facilities"]
    P2_FE["Frontend: Multi-region Edge"]
    P2_API["API: GCP Cloud Run\n(Multi-region, 10-200)"]
    P2_DB["Database: Supabase\n(Primary + Read Replicas)"]
    P2_Redis["Redis: Sharded Cluster"]
    P2_Queue["GCP Pub/Sub"]
    P2_Workers["Cloud Run Jobs"]
    P2_CDN["Global CDN"]
  end

  Current -->|Scale Up| Phase1
  Phase1 -->|Scale Out| Phase2

  subgraph Metrics ["Scaling Triggers"]
    CPU["CPU > 70%"]
    Memory["Memory > 80%"]
    Latency["P95 Latency > 500ms"]
    Throughput["RPS > 500"]
  end

  Metrics -.->|Trigger| Phase1
  Metrics -.->|Trigger| Phase2

  classDef current fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
  classDef phase1 fill:#fff3e0,stroke:#f57c00,stroke-width:2px
  classDef phase2 fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
  classDef metrics fill:#fce4ec,stroke:#c2185b,stroke-width:2px

  class Current current
  class Phase1 phase1
  class Phase2 phase2
  class Metrics metrics
```

---

## Technology Stack Summary

### Frontend

- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Component Library**: shadcn/ui
- **Styling**: TailwindCSS
- **State Management**: React Context
- **Hosting**: Vercel (Global Edge Network)

### Backend

- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Language**: TypeScript
- **API Style**: REST
- **Hosting**: GCP/DigitalOcean

### Database

- **Primary**: PostgreSQL 18 (Supabase)
- **Cache**: Redis 7
- **ORM**: Prisma
- **Migrations**: Prisma Migrate

### Infrastructure

- **CDN**: Cloudflare + Vercel Edge
- **Load Balancer**: DigitalOcean/GCP
- **DNS**: Cloudflare
- **SSL**: Cloudflare + Let's Encrypt

### External Services

- **Payments**: Stripe, Plaid
- **Blockchain**: Solana, Ethereum, Polygon, Base
- **Monitoring**: Sentry, Prometheus, Grafana
- **CI/CD**: GitHub Actions

### Security

- **Authentication**: JWT + 2FA (TOTP)
- **Encryption**: TLS 1.3, AES-256
- **WAF**: Cloudflare
- **Compliance**: HIPAA, PCI DSS

---

## Performance Targets

### API Performance

- P95 Response Time: < 500ms
- P99 Response Time: < 1000ms
- Throughput: > 50 req/sec (current), > 500 req/sec (target)
- Error Rate: < 1%
- Availability: 99.9%

### Database Performance

- Query Time: < 100ms (P95)
- Connection Pool: < 80% utilization
- Cache Hit Rate: > 90%
- Transactions/sec: > 100

### Frontend Performance

- LCP: < 2.5s
- FID: < 100ms
- CLS: < 0.1
- Performance Score: > 90

---

**Last Updated**: February 1, 2026  
**Version**: 1.0.0  
**Maintained By**: DevOps Team
