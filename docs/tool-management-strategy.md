# Agent Tools 三分類管理策略

> 管理 SolanaHacker Agent 的 25 個核心工具，確保功能清晰、使用高效

**目標**: 
- 將工具按用途分類，提高查找效率
- 新工具加入時有明確的分類依據
- 實時維護分類標準，避免功能重複

---

## 📊 工具分類概覽

| 分類 | 工具數量 | 主要用途 | 使用頻率 |
|------|---------|---------|----------|
| **🔧 開發工具 (Development)** | 13 個 | 程式碼開發、測試、部署 | 高 |
| **🧠 智能工具 (Intelligence)** | 6 個 | AI 分析、研究、決策支援 | 中 |
| **📋 管理工具 (Management)** | 7 個 | 專案管理、記憶、溝通 | 高 |

**總計**: 26 個工具

---

## 🔧 開發工具 (Development Tools)

> **用途**: 直接參與程式碼開發、系統操作和產品部署

### 檔案操作 (3 個)
1. **`read_file`** - 讀取檔案內容
2. **`write_file`** - 寫入檔案內容  
3. **`list_files`** - 列出目錄結構

### 系統操作 (3 個)
4. **`run_command`** - 執行 shell 指令
5. **`dev_server`** - 控制 Vite 開發伺服器
6. **`browse_url`** - 外部網站視覺分析

### 測試除錯 (2 個)
7. **`take_screenshot`** - 擷取應用截圖
8. **`check_console_errors`** - 檢查 JS 錯誤 (節省 token)

### 版本控制 (2 個)
9. **`git_commit`** - 本地 Git 提交
10. **`git_release`** - 推送並建立版本標籤

### 專案部署 (2 個)
11. **`colosseum_project`** - 管理競賽專案提交
12. **`review_ux`** - 全面 UX 評估 (視覺 + 指標)

### API 管理 (1 個)
13. **`check_anthropic_api_budget`** - 檢查 Anthropic API 使用量和 rate limits

**特點**:
- 使用頻率最高
- 直接影響產品開發
- 需要謹慎的權限管理
- 錯誤影響範圍大

---

## 🧠 智能工具 (Intelligence Tools)

> **用途**: AI 驅動的分析、研究和內容生成

### 知識獲取 (2 個)
1. **`read_knowledge`** - 讀取參考文件庫
2. **`search_memory`** - 搜索長期記憶庫

### AI 技能系統 (2 個)
3. **`load_skill`** - 載入專業技能模組
   - `gemini_image` - 圖像生成
   - `grok_research` - 網路研究  
   - `v0_ui` - UI 組件生成
   - `xai_analysis` - X/Twitter 分析

### 問題解決 (2 個)
4. **`lookup_bug`** - 查找錯誤解決方案
5. **`add_bug_solution`** - 新增錯誤解決方案

**特點**:
- 提供專業領域知識
- 通常需要外部 API
- 結果品質影響決策
- 可擴展性強

---

## 📋 管理工具 (Management Tools)

> **用途**: 專案管理、記憶系統和溝通協調

### 任務管理 (3 個)
1. **`complete_task`** - 標記任務完成
2. **`update_current_task`** - 更新任務狀態 (受限)
3. **`log_attempt`** - 記錄工作嘗試

### 溝通協調 (2 個)
4. **`send_telegram`** - Telegram 通知
5. **`request_approval`** - 請求人工批准

### 記憶系統 (2 個)
6. **`remember`** - 長期記憶存儲  
7. **`write_journal`** - 寫入每日日誌

**特點**:
- 維護專案連續性
- 支援人機協作
- 提供決策依據
- 累積專案智慧

---

## 🎯 分類判斷標準

新工具加入時，按以下標準分類：

### 開發工具 (Development) 判斷依據
- ✅ 直接操作檔案系統
- ✅ 執行程式碼或命令
- ✅ 影響應用執行環境
- ✅ 測試和除錯功能
- ✅ 版本控制和部署

**範例**: `deploy_app`, `run_tests`, `code_analysis`

### 智能工具 (Intelligence) 判斷依據  
- ✅ 使用 AI 模型進行分析
- ✅ 產生創意內容
- ✅ 提供專業建議
- ✅ 處理複雜數據
- ✅ 知識檢索和學習

**範例**: `analyze_market`, `generate_content`, `smart_recommend`

### 管理工具 (Management) 判斷依據
- ✅ 維護專案狀態
- ✅ 協調人機互動
- ✅ 記錄和檢索資訊
- ✅ 追蹤專案進度
- ✅ 溝通和通知

**範例**: `track_progress`, `notify_stakeholder`, `log_decision`

---

## ⚠️ 邊界情況處理

### 跨類別工具
某些工具可能同時具備多種特性：

**範例**: `review_ux`
- 開發特性：測試應用功能
- 智能特性：AI 視覺分析  
- **分類原則**: 按**主要用途**分類 → **開發工具** (因為主要用於產品品質控制)

### 已棄用工具
- **`git_commit_push`** - 已標記為 DEPRECATED，建議使用 `git_commit`
- **`update_current_task`** - 受限使用，僅限特定場景

### 特殊工具類別
如果未來出現不適合三分類的工具：
1. **評估是否需要新分類**
2. **考慮重新定義現有分類**  
3. **暫時歸入最相近的類別**
4. **記錄在 `邊界情況` 區塊**

---

## 🔄 維護機制

### 自動化統計分析 (已實作)
**數據來源**: `memory/journal/*.md` 中的詳細 action log  
**分析週期**: 每3天 (週二/週五/週日 09:00 UTC)  
**統計維度**:
- 工具使用頻率 (次數統計)
- 使用場景分布 (對話內容分析)  
- 工具組合模式 (常見配對)
- 執行成功率 (錯誤率分析)

#### 自動分類調整機制
基於統計結果的智能調整：
```bash
# 自動執行: 每3天分析最近使用情況
0 9 */3 * * curl http://localhost:3001/analyze-tool-usage
```

**調整邏輯**:
- 高頻工具 (>10次/3天) → 提升至核心分類 
- 中頻工具 (3-10次/3天) → 維持或調整至中頻
- 低頻工具 (<3次/3天) → 考慮降級或按需載入

**即時維護原則**:
- AI 自主決策分類調整，無需請示
- 每次調整都記錄在 journal 中
- 重大變更會通過 Telegram 通知

### 週期性回顧
- 檢查工具使用頻率統計
- 評估分類是否合理
- 識別冗余或遺漏功能
- 更新工具清單和分類

### 新增工具流程
1. **按判斷標準分類**
2. **更新 `tool-inventory.md`**
3. **更新本策略文件**
4. **檢查是否有功能重複**
5. **記錄新增原因和預期用途**

### 工具退役流程  
1. **標記為 Deprecated**
2. **提供替代方案**
3. **設定移除時間表**
4. **更新相關文件**
5. **通知相關使用者**

---

## 📈 使用建議

### 高效工作流程
1. **開發階段**: 優先使用 Development Tools 建立功能
2. **分析階段**: 善用 Intelligence Tools 進行決策  
3. **協作階段**: 依賴 Management Tools 維護專案

### Token 優化策略
- `check_console_errors` 優於 `take_screenshot` (檢查錯誤時)
- `search_memory` 和 `lookup_bug` 優於重複分析
- 批量使用同類工具提高效率
- 適當使用 `log_attempt` 避免重複嘗試

### 安全考量
- Development Tools 權限最高，使用需謹慎
- Intelligence Tools 注意 API 配額管理
- Management Tools 避免敏感資訊洩露
- 定期檢查 Git 提交內容

---

## 📊 工具使用統計建議

### 高頻工具 (每日使用)
- `read_file`, `write_file`, `list_files`
- `dev_server`, `take_screenshot`
- `write_journal`, `log_attempt`

### 中頻工具 (週期使用)
- `git_commit`, `git_release`  
- `review_ux`, `send_telegram`
- `search_memory`, `complete_task`

### 低頻工具 (按需使用)
- `colosseum_project`, `request_approval`
- `load_skill`, `add_bug_solution`
- `browse_url`, `update_current_task`

---

## 📋 未來擴展計畫

### 潛在新工具類別
- **🔗 集成工具 (Integration)**: 第三方服務連接
- **🛡️ 安全工具 (Security)**: 代碼掃描、權限管理
- **📊 分析工具 (Analytics)**: 性能監控、用戶行為

### 工具升級路線圖
- **Phase 1**: 完善現有三分類，建立使用統計
- **Phase 2**: 增加工具間依賴管理和工作流程優化
- **Phase 3**: 智能工具推薦系統和自動選擇  
- **Phase 4**: 自動化工具組合和批量操作功能

---

## 📝 分類維護記錄

- **2026-02-13**: 建立初始三分類策略 (25個工具)
- **2026-02-13**: 新增 `check_anthropic_api_budget` 工具 (26個工具)
- **待更新**: 下次工具新增或調整時記錄

---

**維護責任**: SolanaHacker Agent + H2Crypto  
**更新頻率**: 每次新增/移除工具後立即更新  
**最後更新**: 2026-02-13

---

*這個分類策略將隨著專案發展持續優化，確保工具管理的清晰性和實用性。*