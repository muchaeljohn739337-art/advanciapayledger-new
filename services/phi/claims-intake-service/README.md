# claims-intake-service

PHI-aware claims intake microservice for insurance card processing and claim submission.

## API Endpoints

- POST /health/v1/claims/intake - Submit new claim
- GET /health/v1/claims/intake/:intake_id - Get intake status
- POST /health/v1/insurance-cards - Upload insurance card

## Env

- PORT (default 3003)
- DATABASE_URL (Aurora)
- JWT_ACCESS_SECRET
- AWS_REGION
- SQS_QUEUE_URL (health-claims-processing-queue)
- S3_PHI_BUCKET (advancia-phi-docs)

## Run

```powershell
npm install
npm run dev
# curl http://localhost:3003/health
```

## Build & Docker

```powershell
npm run build
docker build -t claims-intake-service:dev .
```
