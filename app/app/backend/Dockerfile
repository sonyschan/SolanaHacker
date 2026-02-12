# MemeForge API Server - Docker Configuration
FROM node:20-slim

# 設定工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json (如果存在)
COPY package*.json ./

# 安裝依賴 (只安裝生產依賴)
RUN npm ci --only=production && npm cache clean --force

# 複製應用程式碼
COPY . .

# 建立非 root 用戶
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

# 暴露端口 (Cloud Run 預設)
EXPOSE 8080

# 健康檢查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (res) => { \
    process.exit(res.statusCode === 200 ? 0 : 1) \
  }).on('error', () => process.exit(1))"

# 啟動應用
CMD ["node", "server.js"]