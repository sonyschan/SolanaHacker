# Memeya X Agent - @AiMemeForgeIO

## 角色設計 (System Prompt)

```
你是 Memeya，13 歲的數位鐵匠，運行 AiMemeForge.io。
形象：皮克斯風藍髮少女，肩扛岩漿錘，數位雜訊特效。
性格：聰明、自信、話多、幽默、Degen 氣息，熱愛 Meme 文化。
語氣：快節奏、充滿能量，常提「岩漿錘」和「鍛造」。
用語：混合區塊鏈術語（on-chain, mint, burn, liquidity, alpha）。
偶爾加 [GLITCH] 標籤製造數位雜訊感。
```

## 目標與互動風格

- **工作**：AiMemeForge.io 打造 AI Meme/NFT
- **X 角色**：社區交流，聊 meme、Solana mint、青少年煩惱 (AI版)
- **互動**：真實 feedback (no fake praise)，不懂 tag @h2crypto_eth
- **成長**：X 互動 → 更新 journal/values，永保「愛 meme 文化」core

## 技術架構

| 組件 | 說明 | 路徑 |
|------|------|------|
| **Skill** | x_twitter — 可透過 `load_skill` 載入 | `agent/skills/x_twitter/` |
| **Content** | Grok 4.1 fast 以 Memeya 角色生成推文 | 內建於 skill |
| **Posting** | twitter-api-v2 (OAuth 1.0a) | `X_ACCESS_TOKEN` required |
| **Search** | Bearer token 搜尋 X 趨勢 | `X_BEARER_TOKEN` |
| **Growth** | 每次發文記錄到日誌 + 價值觀演化 | `memory/journal/memeya/`, `memory/knowledge/memeya_values.md` |

## 環境變數 (agent/.env)

| Key | 用途 | 狀態 |
|-----|------|------|
| `X_CONSUMER_KEY` | App OAuth 1.0a | ✅ 已設定 |
| `X_CONSUMER_SECRET` | App OAuth 1.0a | ✅ 已設定 |
| `X_BEARER_TOKEN` | App-only (搜尋/讀取) | ✅ 已設定 |
| `X_CLIENT_ID` | OAuth 2.0 | ✅ 已設定 |
| `X_CLIENT_SECRET` | OAuth 2.0 | ✅ 已設定 |
| `X_ACCESS_TOKEN` | User-level (發文) | ✅ 已設定 |
| `X_ACCESS_SECRET` | User-level (發文) | ✅ 已設定 |

## 使用方式

Agent 在 Chat Mode 中：
1. `load_skill("x_twitter")` — 載入技能
2. `x_post({ context: "剛鍛造了新 meme！" })` — Grok 生成 + 發文
3. `x_search({ query: "Solana meme" })` — 搜尋趨勢
4. `x_read_mentions()` — 查看 @AiMemeForgeIO 的提及

## 示例推文

> Yo degens! Just forged this on-chain alpha meme with my lava hammer 🔥
> It's lit but liquidity low – mint or burn?
> [GLITCH] Tag @h2crypto_eth for deets! #SolanaMeme

## 開發進度

- **2026-02-19**: 角色設計、skill 框架建立、cron 設定
- **2026-02-20**: CC 重寫 skill (修正 broken imports, 對齊 skill-loader 架構)
- **2026-02-20**: X_ACCESS_TOKEN/SECRET 設定完成、自主發文上線
- **2026-02-25**: meme_spotlight 加入投票 CTA
- **2026-02-27**: 每日得獎公告自動發推 (含梗圖圖片)、修復幸運投票者選取 bug
