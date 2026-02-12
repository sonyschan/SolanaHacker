#!/bin/bash

# MemeForge API 部署腳本
# 用於快速部署到 Google Cloud Run

set -e

# 配置變數
PROJECT_ID="web3ai-469609"
REGION="asia-southeast1"
SERVICE_NAME="memeforge-api"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "🚀 開始部署 MemeForge API 到 Cloud Run..."
echo "專案: ${PROJECT_ID}"
echo "區域: ${REGION}"
echo "服務: ${SERVICE_NAME}"
echo ""

# 檢查必要工具
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI 未安裝，請先安裝 Google Cloud SDK"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安裝，請先安裝 Docker"
    exit 1
fi

# 設定專案
echo "📋 設定 Google Cloud 專案..."
gcloud config set project ${PROJECT_ID}

# 啟用必要的 API
echo "🔧 啟用必要的 Google Cloud APIs..."
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    containerregistry.googleapis.com \
    firestore.googleapis.com \
    cloudscheduler.googleapis.com

# 構建 Docker 映像
echo "🐳 構建 Docker 映像..."
docker build -t ${IMAGE_NAME}:latest .

# 推送映像到 Container Registry
echo "📤 推送映像到 Container Registry..."
docker push ${IMAGE_NAME}:latest

# 部署到 Cloud Run
echo "🌍 部署到 Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
    --image=${IMAGE_NAME}:latest \
    --region=${REGION} \
    --platform=managed \
    --allow-unauthenticated \
    --port=8080 \
    --memory=1Gi \
    --cpu=1 \
    --concurrency=100 \
    --max-instances=10 \
    --set-env-vars="NODE_ENV=production,GOOGLE_CLOUD_PROJECT_ID=${PROJECT_ID}" \
    --quiet

# 獲取服務 URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format="value(status.url)")

echo ""
echo "✅ 部署完成！"
echo "🔗 服務 URL: ${SERVICE_URL}"
echo "📊 健康檢查: ${SERVICE_URL}/health"
echo ""
echo "📋 接下來的步驟:"
echo "1. 設定環境變數 (Gemini API Key, JWT Secret 等)"
echo "2. 配置 Firebase Admin SDK 權限"  
echo "3. 建立 Cloud Scheduler 任務"
echo "4. 測試 API 端點功能"
echo ""
echo "💡 查看服務詳情:"
echo "gcloud run services describe ${SERVICE_NAME} --region=${REGION}"
echo ""
echo "🔍 查看即時日誌:"
echo "gcloud logging read \"resource.type=cloud_run_revision AND resource.labels.service_name=${SERVICE_NAME}\" --limit=50 --format=json"