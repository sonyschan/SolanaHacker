# x_twitter - Memeya X Agent

## 描述
自動以 Memeya 角色發 X 推文。Grok 4.1 gen 內容 → Twitter v2 post → review → journal 成長。

分類：**Comm/Social** (三類：Comm)

## 使用
```js
await require('./agent/skills/x_twitter').heartbeat();  // 30-60min cron
await require('./agent/skills/x_twitter').post(content); // manual
```

## 依賴
- twitter-api-v2 (.env keys)
- grok_api (Grok 4.1 fast)
- browse_url (post review)
- fs, child_process (git/journal)

## Memeya Growth
- 互動 → append memeya_values.md
- Daily diary: memory/journal/memeya/YYYY-MM-DD.md
