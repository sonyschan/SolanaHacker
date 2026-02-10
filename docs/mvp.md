# MemeForge MVP 技術實作計畫

## 💡 選項 1 - 完成投票核心邏輯

基於目前的程式碼分析，制定完整的技術實作策略。

### 🎯 現況評估

我們已經有很強的 **前端投票 UI**：
- ✅ `EnhancedVotingInterface.jsx` - 精美的投票界面
- ✅ `VotingInterface.jsx` - 投票邏輯組件
- ✅ 模擬數據和即時統計顯示
- ⚠️ **但缺少真實的後端邏輯和狀態管理**

---

## 🔧 技術實作方案

### 1. 狀態管理層 (React Context + Local Storage)
```javascript
// 新建: app/src/contexts/VotingContext.jsx
const VotingContext = {
  // 投票狀態
  currentMemes: [], // 當日 3 個 AI 生成梗圖
  userVotes: {}, // 用戶投票記錄 {memeId: {vote, tickets, timestamp}}
  votingStats: {}, // 即時投票統計
  userStreak: 0, // 連續投票天數
  
  // 投票邏輯
  submitVote: async (memeId, voteType) => {...},
  calculateTickets: (streak, voteType) => {...},
  checkDailyReset: () => {...},
  
  // 彩票系統
  userTickets: [], // 用戶彩票 [{id, memeId, timestamp, drawn: false}]
  totalJackpot: 0, // 當前獎池 SOL 數量
}
```

### 2. 數據持久化 (Local Storage + 未來 Solana)
```javascript
// 新建: app/src/utils/votingStorage.js
export const VotingStorage = {
  // Local Storage 暫存 (MVP)
  saveVote: (userId, memeId, vote) => {...},
  getUserVotes: (userId) => {...},
  updateVotingStats: (memeId, votes) => {...},
  
  // 未來: Solana 程序調用
  submitToChain: async (vote) => {...},
  getChainVotes: async (memeId) => {...},
}
```

### 3. 彩票系統邏輯
```javascript
// 新建: app/src/utils/lotterySystem.js
export const LotterySystem = {
  // 彩票分配 (完全基於產品規格)
  calculateTickets: (consecutiveDays) => {
    // 8-12 基礎 + 連續獎勵
    const base = Math.floor(Math.random() * 5) + 8; // 8-12
    const streakBonus = consecutiveDays >= 4 ? Math.floor(Math.random() * 3) + 1 : 0;
    const capBonus = consecutiveDays >= 8 ? 2 : 0;
    return Math.min(base + streakBonus + capBonus, 15);
  },
  
  // 週日開獎邏輯
  drawWinners: (allTickets, jackpotSOL) => {
    // 80% 分給中獎者，20% 營運
    const prizePool = jackpotSOL * 0.8;
    return drawRandomWinners(allTickets, prizePool);
  },
}
```

### 4. 假數據生成 (AI 整合前)
```javascript
// 新建: app/src/utils/mockMemeGenerator.js
export const MockMemeGenerator = {
  // 生成每日 3 個模擬梗圖
  generateDailyMemes: () => [
    {
      id: generateId(),
      title: "AI Trying to Understand Emotions",
      description: "When AI attempts to comprehend human feelings",
      imageUrl: "/generated/meme-preview-ai-emotions.png",
      trend: "trending_up",
      generatedAt: new Date().toISOString(),
    },
    // ... 另外 2 個
  ],
  
  // 檢查是否需要生成新梗圖 (每天 UTC 00:00)
  checkDailyReset: () => {...},
}
```

### 5. 整合現有組件
```javascript
// 修改: app/src/components/EnhancedVotingInterface.jsx
import { useVoting } from '../contexts/VotingContext';

const EnhancedVotingInterface = () => {
  const {
    currentMemes,
    userVotes,
    votingStats,
    submitVote,
    userTickets
  } = useVoting();
  
  // 真實投票邏輯取代模擬數據
  const handleVoteClick = async (voteType) => {
    const result = await submitVote(currentMemes[selectedMeme].id, voteType);
    // 更新 UI 狀態
  };
  
  // 使用真實投票統計而非固定數字
  const currentVotes = votingStats[currentMemes[selectedMeme]?.id] || {
    common: 0, rare: 0, legendary: 0
  };
};
```

---

## ⚡ 實作順序 (MVP 優先)

### Phase 1 (2-3 小時)：基礎狀態管理
1. 建立 `VotingContext.jsx` - 投票狀態管理
2. 建立 `votingStorage.js` - Local Storage 持久化
3. 修改 `EnhancedVotingInterface.jsx` 使用真實狀態

### Phase 2 (2-3 小時)：彩票系統
4. 實作 `lotterySystem.js` - 彩票分配邏輯
5. 建立 `mockMemeGenerator.js` - 每日梗圖生成
6. 整合連續投票獎勵計算

### Phase 3 (2-3 小時)：完整用戶體驗
7. 投票流程測試和 bug 修復
8. 添加即時投票統計更新
9. 實作每日重置邏輯 (UTC 時區)

---

## 🎮 MVP 功能驗證

完成後用戶可以：
- ✅ 每天看到 3 個新梗圖
- ✅ 對梗圖投票 (Common/Rare/Legendary)
- ✅ 即時看到社群投票統計
- ✅ 獲得 8-15 隨機彩票
- ✅ 連續投票獲得獎勵加成
- ✅ 投票狀態在重新整理後保持

---

## 🔮 未來擴展路徑

這個 MVP 設計為 **漸進式升級**：
- **Week 1**: Local Storage 版本 (可立即展示)
- **Week 2**: 整合 Gemini AI 真實生成梗圖
- **Week 3**: Solana 智能合約投票記錄
- **Week 4**: 真實 SOL 獎池和開獎機制

---

## 📊 MVP 完成標準

### 核心功能
- [ ] 每日 3 個梗圖展示
- [ ] 兩階段投票系統 (最愛 → 稀有度)
- [ ] 8-15 彩票分配邏輯
- [ ] 連續投票獎勵計算
- [ ] 投票統計即時更新
- [ ] Local Storage 持久化

### 用戶體驗
- [ ] 流暢的投票流程
- [ ] 清晰的投票結果反饋
- [ ] 彩票獲得通知
- [ ] 連續投票進度顯示
- [ ] 每日重置提醒

### 技術品質
- [ ] 錯誤處理機制
- [ ] 投票防重複提交
- [ ] 時區處理 (UTC)
- [ ] 組件測試覆蓋
- [ ] 性能優化