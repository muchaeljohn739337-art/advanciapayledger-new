# Azure OIDC CI/CD Setup Guide

Complete guide for setting up secure Azure deployments with OIDC authentication.

---

## What This Provides

Zero long-lived credentials - GitHub Actions authenticates to Azure using OIDC tokens.

Benefits:
- No credential rotation needed
- Automatic token expiration
- Audit trail in Azure AD
- Reduced security risk
- Zero-trust principles

---

## Prerequisites

- Azure subscription
- GitHub repository with admin access
- Azure CLI installed
- Owner or Contributor role in Azure

---

## Step-by-Step Setup

### Step 1: Create Azure Service Principal

```bash
az login
az account set --subscription "YOUR_SUBSCRIPTION_ID"

az group create --name advancia-payledger-rg --location eastus

az ad sp create-for-rbac \
  --name "advancia-payledger-github" \
  --role contributor \
  --scopes /subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/advancia-payledger-rg
```

Save the output:
- appId (CLIENT_ID)
- tenant (TENANT_ID)

### Step 2: Configure Federated Identity

```bash
APP_ID="your-app-id"

az ad app federated-credential create \
  --id $APP_ID \
  --parameters '{
    "name": "github-main-branch",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:advancia-devuser/advancia-payledger1:ref:refs/heads/main",
    "audiences": ["api://AzureADTokenExchange"]
  }'
```

### Step 3: Add GitHub Secrets

Go to: GitHub Repository Settings Secrets and variables Actions

Add these secrets:
- AZURE_CLIENT_ID
- AZURE_TENANT_ID
- AZURE_SUBSCRIPTION_ID
- PROD_DATABASE_URL
- SANDBOX_DATABASE_URL
- PROD_REDIS_URL
- SANDBOX_REDIS_URL
- PROD_JWT_SECRET
- SANDBOX_JWT_SECRET
- SENTRY_DSN
- SLACK_WEBHOOK_URL

---

## Current Status

Created files:
- .github/workflows/azure-deploy.yml - Full CI/CD pipeline with OIDC
- docker-compose.simple.yml - Simple compose with pre-built images
- AZURE_OIDC_SETUP_GUIDE.md - This guide

Next steps:
1. Start local infrastructure (postgres + redis)
2. Test backend and frontend locally
3. Configure Azure OIDC when ready for production

---

## Quick Start (Local Development)

Start just the infrastructure services:

```bash
docker-compose up -d postgres redis
```

Then run backend and frontend locally:

```bash
cd backend && npm run dev
cd frontend && npm run dev
```
