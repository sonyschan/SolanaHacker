# AI MemeForge Beta - Score-Based Rarity System v2

## Background

原本的 3 按鈕選擇機制 (Common/Rare/Legendary) 有設計缺陷：
- 用戶選中喜歡的梗圖後，不太可能投 "Common"
- 導致 Common 和 Uncommon 幾乎不會被選出
- Rarity 分佈不符合預期（應該 Common 最多，Legendary 最少）

## New Design: Score-Based Rating

### UI Changes

**Phase 2 - Rarity Vote:**
- 原本: 3 個按鈕 (Common / Rare / Legendary)
- 改為: 滑桿評分 1-10 分

```
┌─────────────────────────────────────────────┐
│  Rate this meme:                            │
│                                             │
│  1 ────────────●────────────── 10          │
│       [Current: 7.5]                        │
│                                             │
│  [ Submit Rating ]                          │
└─────────────────────────────────────────────┘
```

### 5 Rarity Levels

| Rarity    | Percentile Range | Target Distribution |
|-----------|------------------|---------------------|
| Common    | 0 - 40%          | 40% of all memes    |
| Uncommon  | 40 - 65%         | 25% of all memes    |
| Rare      | 65 - 85%         | 20% of all memes    |
| Epic      | 85 - 95%         | 10% of all memes    |
| Legendary | 95 - 100%        | 5% of all memes     |

### Percentile Calculation Algorithm

```javascript
/**
 * 根據歷史所有梗圖的平均分數計算 percentile
 * @param {number} memeAverageScore - 當前梗圖的平均分數
 * @returns {object} { rarity: string, percentile: number }
 */
async function calculateRarity(memeAverageScore) {
  // 1. 取得所有歷史梗圖分數
  const allMemes = await db.collection('memes')
    .where('rarity.averageScore', '>', 0)
    .get();

  const historicalScores = allMemes.docs
    .map(d => d.data().rarity?.averageScore)
    .filter(s => s != null)
    .sort((a, b) => a - b);

  // 2. 計算當前梗圖的 percentile
  const belowCount = historicalScores.filter(s => s < memeAverageScore).length;
  const percentile = (belowCount / historicalScores.length) * 100;

  // 3. 根據 percentile 決定 rarity
  if (percentile < 40) return { rarity: 'Common', percentile };
  if (percentile < 65) return { rarity: 'Uncommon', percentile };
  if (percentile < 85) return { rarity: 'Rare', percentile };
  if (percentile < 95) return { rarity: 'Epic', percentile };
  return { rarity: 'Legendary', percentile };
}
```

### Cold Start Handling (Day 1-7)

當歷史資料不足 30 筆時，使用固定分數區間：

| Rarity    | Score Range |
|-----------|-------------|
| Common    | 1.0 - 4.0   |
| Uncommon  | 4.0 - 5.5   |
| Rare      | 5.5 - 7.0   |
| Epic      | 7.0 - 8.5   |
| Legendary | 8.5 - 10.0  |

```javascript
function getRarityFromScore(score, historicalCount) {
  // 歷史資料不足時使用固定閾值
  if (historicalCount < 30) {
    if (score < 4) return 'Common';
    if (score < 5.5) return 'Uncommon';
    if (score < 7) return 'Rare';
    if (score < 8.5) return 'Epic';
    return 'Legendary';
  }
  // 資料足夠時使用 percentile 計算
  return calculateRarity(score);
}
```

### Data Schema Changes

**votes collection:**
```javascript
{
  id: "vote_xxx",
  memeId: "meme_xxx",
  walletAddress: "ABC123...",
  voteType: "rarity",
  score: 7.5,              // NEW: 數字分數 (1-10)
  // choice: "rare"        // DEPRECATED: 舊的字串選擇
  timestamp: "2026-02-14T12:00:00Z",
  status: "active"
}
```

**memes collection:**
```javascript
{
  id: "meme_xxx",
  title: "Diamond Hands Forever",
  imageUrl: "https://...",
  rarity: {
    averageScore: 7.2,     // 所有投票的平均分數
    totalVotes: 45,        // 總投票數
    rarity: "Rare",        // 計算出的稀有度
    percentile: 68.5,      // 在歷史分佈中的位置
    calculatedAt: "2026-02-14T20:00:00Z"
  },
  // votes: {...}          // DEPRECATED: 舊的投票計數
}
```

### Example Scenarios

**Scenario 1: Day 10**
- 歷史累積 100 個分數，範圍 3.2 - 9.1
- 新梗圖平均分數: 7.2
- 有 62 個歷史分數低於 7.2 → percentile = 62%
- 62% 落在 40-65% 區間 → **Uncommon**

**Scenario 2: Day 50**
- 歷史累積 500 個分數，分佈上移至 6.1 - 9.5
- 同樣 7.2 分，現在只有 35 個低於它 → percentile = 7%
- 7% 落在 0-40% 區間 → **Common**

這樣的設計讓 rarity 會根據社群評分標準自動調整，而非絕對分數決定。

### Implementation Checklist

- [x] **ForgeTab.jsx** - Phase 2 UI 改為滑桿 ✅
- [x] **voting.js route** - 接受 `score` 數字參數 ✅
- [x] **rarityService.js** - 新增 percentile 計算邏輯 ✅
- [x] **votingController.js** - 處理 score 投票 ✅
- [x] **memeService.js** - 新增 submitScoreVote 方法 ✅
- [ ] **Database migration** - 舊資料兼容處理 (向下兼容，無需遷移)

### API Changes

**POST /api/voting/vote**
```javascript
// Before (Phase 2 - Rarity)
{
  memeId: "meme_xxx",
  walletAddress: "ABC123...",
  voteType: "rarity",
  choice: "rare"           // 舊: 字串選擇
}

// After (Phase 2 - Rating)
{
  memeId: "meme_xxx",
  walletAddress: "ABC123...",
  voteType: "rarity",
  score: 7.5               // 新: 數字分數 (1-10)
}
```

## Timeline

- Design: 2026-02-14
- Implementation: TBD
- Testing: TBD
- Release: TBD

## Last Updated
2026-02-14
