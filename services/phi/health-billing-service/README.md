# health-billing-service

Minimal PHI-aware billing microservice skeleton.

## Env

- PORT (default 3000)
- DATABASE_URL (Aurora)
- JWT_ACCESS_SECRET
- AWS_REGION

## Run

```powershell
npm install
npm run dev
# curl http://localhost:3000/health
# curl -X POST http://localhost:3000/health/claims/submit -H "Content-Type: application/json" -d "{}"
```

## Build & Docker

```powershell
npm run build
docker build -t health-billing-service:dev .
```
