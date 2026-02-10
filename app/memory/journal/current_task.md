# Current Task

> What SolanaHacker is currently working on. Updated on each significant action.

---

## Status: MVP Phase - Ensuring All Features Work

## Current Phase: MVP

---

## Phase Definitions (詳細版):

### MVP - 最小可行產品
**目標**: 所有核心功能可執行，使用者可完成主要流程

**驗收標準**:
1. Build 成功 (npm run build 無錯誤)
2. 無 Console 致命錯誤 (Uncaught Error)
3. 核心流程可走完:
   - 連接錢包 → 看到內容 → 執行互動 → 看到結果
4. API 串接正常 (若有後端)
5. 資料正確顯示 (不是 undefined 或空白)

**不需要**:
- 漂亮的 UI (功能優先)
- Loading 動畫
- 錯誤提示美化
- Mobile responsive

---

### BETA - 真實用戶測試階段
**目標**: 可以讓真實使用者測試，收集反饋

**驗收標準**:
1. 部署到公開 URL (用戶可訪問)
2. 基本 UX 體驗:
   - Loading states (用戶知道在等待)
   - Error messages (用戶知道哪裡出錯)
   - Success feedback (用戶知道操作成功)
3. Mobile 基本可用
4. 無明顯 Bug (不會卡死或白屏)
5. 效能可接受 (頁面 < 5 秒載入)

**Beta 完成條件**:
- 至少 1 個真實用戶成功完成完整流程
- 收集到用戶反饋 (可透過 TG 回報)
- 嚴重 Bug 已修復

---

## Project: MemeForge
AI-powered meme NFT voting platform with democratic rarity system and SOL rewards.

## MVP Checklist:
- [ ] Wallet connection works
- [ ] Meme display loads correctly
- [ ] Voting interaction works
- [ ] Reward/ticket display shows
- [ ] No critical console errors

## Blockers:
None

---

*Last updated: 2026-02-08*

---

## MemeForge 完整價值循環 (Business Model)



### 關鍵理解：
- **用戶 incentive**: 投票免費，但可獲得彩票參與抽獎
- **價值來源**: NFT 競標收益是獎池的資金來源
- **投票意義**: 不只是參與，而是「決定」NFT 的市場價值
- **經濟循環**: 投票 → 稀有度 → NFT價值 → 競標 → 獎池 → 回饋用戶


---

## MemeForge 完整價值循環 (Business Model)

```
1. AI 生成 Meme
       |
       v
2. 用戶投票 --> 獲得彩票 (8-15張/次)
       |
       v
3. 投票結果決定 Meme 稀有度 (Common -> Legendary)
       |
       v
4. 高稀有度 Meme --> 鑄造為 NFT --> 競標拍賣
       |
       v
5. 競標收益 --> 進入獎池
       |
       v
6. 週日 8PM UTC 開獎 --> 獎池分配給中獎者 (SOL)
```

### 關鍵理解：
- **用戶 incentive**: 投票免費，但可獲得彩票參與抽獎
- **價值來源**: NFT 競標收益是獎池的資金來源
- **投票意義**: 不只是參與，而是「決定」NFT 的市場價值
- **經濟循環**: 投票 -> 稀有度 -> NFT價值 -> 競標 -> 獎池 -> 回饋用戶
