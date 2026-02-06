# patient-link-service

Minimal PHI-aware patient linkage microservice skeleton.

## Env

- PORT (default 3001)
- DATABASE_URL (Aurora)
- JWT_ACCESS_SECRET
- AWS_REGION

## Run

```powershell
npm install
npm run dev
# curl http://localhost:3001/health
# curl -X POST http://localhost:3001/health/patient/link -H "Content-Type: application/json" -d "{}"
```

## Build & Docker

```powershell
npm run build
docker build -t patient-link-service:dev .
```
