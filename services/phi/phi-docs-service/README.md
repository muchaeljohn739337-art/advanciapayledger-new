# phi-docs-service

Minimal PHI-aware document generation microservice skeleton.

## Env

- PORT (default 3002)
- DATABASE_URL (Aurora)
- JWT_ACCESS_SECRET
- AWS_REGION

## Run

```powershell
npm install
npm run dev
# curl http://localhost:3002/health
# curl -X POST http://localhost:3002/health/documents/generate -H "Content-Type: application/json" -d "{}"
```

## Build & Docker

```powershell
npm run build
docker build -t phi-docs-service:dev .
```
