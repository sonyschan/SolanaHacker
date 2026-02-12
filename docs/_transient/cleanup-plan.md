# 🧹 MemeForge Components 清理計劃

## 目前狀況
- **總組件數**: 78個 (.jsx 檔案)
- **實際使用**: 6個 Production 組件
- **Legacy**: 72個 未使用組件
- **問題**: 開發時容易改錯檔案、混淆版本

## Production 組件 (保留)
### 核心架構
1. `App.jsx` - 應用程式入口
2. `HomePage.jsx` - 主頁面  
3. `Dashboard.jsx` - 控制台介面
4. `WalletConnection.jsx` - 錢包連接

### 功能組件  
5. `ForgeTab.jsx` - 梗圖投票功能
6. `MemeModal.jsx` - 彈窗預覽

## 清理策略

### 第一階段：安全封存
```bash
# 1. 創建封存目錄
mkdir -p app/src/components/archive

# 2. 移動 Legacy 組件到封存區
# (保留 production 的 6 個組件)
```

### 第二階段：Legacy 組件分類
按功能分類封存：
- `archive/wallet-variants/` - 各種錢包連接版本
- `archive/dashboard-variants/` - 各種控制台版本  
- `archive/hero-variants/` - 各種首頁 Hero 版本
- `archive/cta-variants/` - 各種 CTA 按鈕版本
- `archive/voting-variants/` - 各種投票介面版本
- `archive/experimental/` - 實驗性組件

### 第三階段：建立規範
1. **命名規範**: 
   - Production: `ComponentName.jsx`
   - 實驗版: `ComponentName.experimental.jsx`
   - 特殊版: `ComponentName.variant-name.jsx`

2. **版本管理**:
   - 每個組件檔案頭部加上狀態註釋
   - 明確標示 PRODUCTION / EXPERIMENTAL / DEPRECATED

3. **目錄結構**:
   ```
   components/
   ├── App.jsx                    ✅ PRODUCTION
   ├── HomePage.jsx              ✅ PRODUCTION  
   ├── Dashboard.jsx             ✅ PRODUCTION
   ├── WalletConnection.jsx      ✅ PRODUCTION
   ├── ForgeTab.jsx              ✅ PRODUCTION
   ├── MemeModal.jsx             ✅ PRODUCTION
   ├── experimental/             🧪 TEST VERSIONS
   └── archive/                  📦 OLD VERSIONS
   ```

## 執行風險評估
- **低風險**: Legacy 組件未被引用，移動到封存區安全
- **測試需求**: 確保 6 個 production 組件正常運作
- **回滾方案**: Git 版本控制確保可以復原

## 預期效果
- **開發效率**: 找檔案速度提升 90%
- **錯誤減少**: 不會再改錯組件
- **新手友善**: 清晰的專案結構
- **維護成本**: 大幅降低技術債務

## 執行時機
建議在 H2Crypto 確認 6 個 production 組件運作正常後執行。