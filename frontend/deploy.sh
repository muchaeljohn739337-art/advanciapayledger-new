#!/bin/bash

echo "🚀 Deploying Advancia PayLedger Frontend to Vercel..."

# Set environment variables for production
export NEXT_PUBLIC_API_URL="https://advancia-backend-469723681861.us-central1.run.app"
export NEXT_PUBLIC_ENV="production"
export NEXT_PUBLIC_API_VERSION="v1"

# Deploy to Vercel
npx vercel --prod --confirm

echo "✅ Deployment complete!"
