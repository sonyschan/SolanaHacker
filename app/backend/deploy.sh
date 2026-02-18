#!/bin/bash
# Deploy backend to Cloud Run
# IMPORTANT: Uses --env-vars-file to set ALL env vars from YAML, never --set-env-vars
set -e

REGION=asia-southeast1
SERVICE=memeforge-api

echo "🚀 Deploying  to Cloud Run..."
gcloud run deploy    --source .   --region    --allow-unauthenticated   --memory 512Mi   --timeout 300   --env-vars-file=/tmp/env-vars.yaml

echo "✅ Deployed. Verifying..."
REVISION=$(gcloud run services describe  --region= --format='value(status.traffic[0].revisionName)')
echo "Active revision: $REVISION"
curl -s "https://memeforge-api-836651762884.asia-southeast1.run.app/api/health" | head -1
