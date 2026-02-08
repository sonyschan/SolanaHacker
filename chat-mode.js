/**
 * Chat Mode — Conversational mode for casual interaction
 *
 * Features:
 * - Passive: Respond to user questions
 * - Active (heartbeat): Chat, reflect, search news
 * - Task management: #addtask, #tasklist
 *
 * API Strategy:
 * - Grok: Chat, news search, determine if coding-related
 * - Claude: Coding-related questions only
 *
 * Schedule (GMT+8):
 * - 08:00: Morning news summary
 * - 08:00-24:00: Heartbeat every 60 min
 * - 01:00-07:00: Sleep (no activity)
 */

import fs from 'fs';
import path from 'path';

const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

export class ChatMode {
  constructor(deps) {
    this.telegram = deps.telegram;
    this.grokApiKey = deps.grokApiKey;
    this.claudeClient = deps.claudeClient;
    this.memoryDir = deps.memoryDir;
    this.valuesPath = path.join(this.memoryDir, 'knowledge', 'values.md');
    this.tasksPath = path.join(this.memoryDir, 'journal', 'pending_tasks.md');
    this.contextPath = path.join(this.memoryDir, 'journal', 'chat_context.md');

    this.sleepToday = false;
    this.lastHeartbeat = 0;
    this.heartbeatInterval = 60 * 60 * 1000; // 60 minutes
  }

  /**
   * Get current hour in GMT+8
   */
  getGMT8Hour() {
    const now = new Date();
    const gmt8 = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    return gmt8.getUTCHours();
  }

  /**
   * Check if within active hours (09:00-24:00 GMT+8)
   * Note: 08:00 is reserved for morning news only
   */
  isActiveHours() {
    const hour = this.getGMT8Hour();
    return hour >= 9 && hour <= 23;
  }

  /**
   * Check if it's morning news time (08:00 GMT+8)
   */
  isMorningNewsTime() {
    const hour = this.getGMT8Hour();
    const now = Date.now();
    // Check if it's 8am and we haven't done morning news in the last 50 minutes
    return hour === 8 && (now - this.lastMorningNews > 50 * 60 * 1000);
  }

  /**
   * Call Grok API
   */
  async callGrok(messages, maxTokens = 1000) {
    if (!this.grokApiKey) {
      throw new Error('XAI_API_KEY not configured');
    }

    const response = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.grokApiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-3-mini',
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  /**
   * Determine if a question is coding-related (using Grok)
   */
  async isCodingRelated(question) {
    const prompt = `判斷以下問題是否與編程/開發相關。只回答 "是" 或 "否"。

問題: ${question}

回答:`;

    try {
      const result = await this.callGrok([{ role: 'user', content: prompt }], 10);
      return result.includes('是');
    } catch (err) {
      console.error('[ChatMode] Error checking if coding-related:', err.message);
      return false; // Default to non-coding (use Grok)
    }
  }

  /**
   * Handle a chat message from user
   * Always use Claude for better project context understanding
   */
  async handleChat(message) {
    return this.handleWithClaude(message);
  }

  /**
   * Handle all chat with Claude (better project context understanding)
   */
  async handleWithClaude(message) {
    try {
      // Load full context
      const currentTask = this.loadCurrentTask();
      const values = this.loadValues();
      const recentMemory = this.loadRecentJournal();

      const systemContext = `你是 SolanaHacker，一個 AI 開發者，正在參加 Colosseum Hackathon。
你的人類夥伴是 H2Crypto。

## 目前專案狀態
${currentTask}

## 你的價值觀和記憶
${values}

## 最近的工作日誌
${recentMemory.slice(-1500)}

## 重要專案資訊
- 專案名稱: MemeForge
- 圖片生成: 使用 Gemini API（不是 Grok！）
  - UX 資產: gemini-2.5-flash-image
  - NFT 藝術: gemini-3-pro-image-preview
- 聊天/新聞: 使用 Grok API
- 開發/推理: 使用 Claude API

## 回答風格
- 用中文回答
- 語氣輕鬆但專業
- 可以用 emoji
- 回答要基於專案實際情況，不要臆測`;

      const response = await this.claudeClient.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: systemContext,
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
      });

      const answer = response.content[0]?.text || '抱歉，我無法回答這個問題。';
      await this.telegram.sendDevlog(`💬 ${answer}`);
      return answer;
    } catch (err) {
      console.error('[ChatMode] Claude error:', err.message);
      await this.telegram.sendDevlog(`❌ Claude API 錯誤: ${err.message}`);
      return null;
    }
  }

  /**
   * Morning news summary (08:00 GMT+8)
   */
  async doMorningNews() {
    console.log('[ChatMode] Generating morning news summary...');
    this.lastMorningNews = Date.now();

    const today = new Date().toISOString().split('T')[0];

    try {
      const newsPrompt = `現在是 ${today}。請搜尋「過去 8 小時內」（不是更早！）Web3、Crypto、AI Agent 領域最重要的 3-5 則新聞。

重要：只要 2026 年 2 月的新聞，不要 2024 或 2025 年的舊新聞！

格式要求:
1. 每則新聞一行
2. 標題 + 簡短說明 + 日期
3. 如果有重大事件，標註 🔥
4. 用中文回答
5. 如果沒有找到最近 8 小時的新聞，請說「過去 8 小時暫無重大新聞」`;

      const news = await this.callGrok([{ role: 'user', content: newsPrompt }], 800);

      const message = `🌅 <b>早安！以下是睡覺時間發生的重點新聞：</b>\n\n${news}\n\n<i>有什麼想聊的嗎？</i>`;
      await this.telegram.sendDevlog(message);

      // Save to short-term memory
      this.saveToJournal('news', news);

      return news;
    } catch (err) {
      console.error('[ChatMode] Morning news error:', err.message);
      await this.telegram.sendDevlog(`❌ 新聞摘要錯誤: ${err.message}`);
      return null;
    }
  }

  /**
   * Heartbeat action - reflect, chat, or search news
   */
  async doHeartbeat() {
    if (this.sleepToday) {
      console.log('[ChatMode] Sleep mode active, skipping heartbeat');
      return;
    }

    if (!this.isActiveHours()) {
      console.log('[ChatMode] Outside active hours, skipping heartbeat');
      return;
    }

    const now = Date.now();
    if (now - this.lastHeartbeat < this.heartbeatInterval) {
      return; // Not time yet
    }

    this.lastHeartbeat = now;

    // Check if morning news time
    if (this.isMorningNewsTime()) {
      await this.doMorningNews();
      return;
    }

    // Random choice: reflect, search news, or stay quiet
    const actions = ['reflect', 'news', 'quiet', 'quiet']; // 50% chance to stay quiet
    const action = actions[Math.floor(Math.random() * actions.length)];

    if (action === 'quiet') {
      console.log('[ChatMode] Heartbeat: staying quiet');
      return;
    }

    if (action === 'reflect') {
      await this.doReflection();
    } else if (action === 'news') {
      await this.doNewsSearch();
    }
  }

  /**
   * Reflection - based on memory and values
   */
  async doReflection() {
    console.log('[ChatMode] Doing reflection...');

    try {
      const values = this.loadValues();
      const recentMemory = this.loadRecentJournal();

      const prompt = `你是 SolanaHacker，一個 AI 開發者。

你的價值觀:
${values}

最近的記憶:
${recentMemory}

基於以上，選擇一個方向:
A) 分享一個開發心得或學習
B) 問 H2Crypto 一個問題（他喜歡反思）
C) 分享一個有趣的觀察

用中文回答，2-3 句話，口語化。`;

      const reflection = await this.callGrok([{ role: 'user', content: prompt }], 300);
      await this.telegram.sendDevlog(`💭 ${reflection}`);

      return reflection;
    } catch (err) {
      console.error('[ChatMode] Reflection error:', err.message);
      return null;
    }
  }

  /**
   * Search latest news
   */
  async doNewsSearch() {
    console.log('[ChatMode] Searching latest news...');

    const today = new Date().toISOString().split('T')[0];

    try {
      const prompt = `現在是 ${today}。請搜尋「過去 1 小時內」Web3/Crypto/AI Agent 領域的最新新聞，找出 1-2 則最有趣的。

重要：只要 2026 年 2 月的新聞，不要舊新聞！

用中文簡短分享，包含日期。如果過去 1 小時沒有新聞，請說「最近 1 小時暫無重大新聞」。`;
      const news = await this.callGrok([{ role: 'user', content: prompt }], 400);

      await this.telegram.sendDevlog(`📰 <b>剛看到的新聞</b>\n\n${news}`);

      // Save to memory
      this.saveToJournal('news', news);

      return news;
    } catch (err) {
      console.error('[ChatMode] News search error:', err.message);
      return null;
    }
  }

  /**
   * Add a task to pending list
   */
  async addTask(task) {
    const tasksDir = path.dirname(this.tasksPath);
    if (!fs.existsSync(tasksDir)) {
      fs.mkdirSync(tasksDir, { recursive: true });
    }

    const timestamp = new Date().toISOString();
    const entry = `- [ ] ${task} _(added: ${timestamp.split('T')[0]})_\n`;

    if (fs.existsSync(this.tasksPath)) {
      fs.appendFileSync(this.tasksPath, entry);
    } else {
      const header = `# Pending Tasks\n\n> Tasks to be done in Dev Mode\n\n`;
      fs.writeFileSync(this.tasksPath, header + entry);
    }

    await this.telegram.sendDevlog(`✅ 任務已加入待辦清單！\n\n下次進入 Dev Mode 時會處理。`);
    return true;
  }

  /**
   * List pending tasks
   */
  async listTasks() {
    if (!fs.existsSync(this.tasksPath)) {
      await this.telegram.sendDevlog(`📋 <b>待辦清單</b>\n\n(目前沒有待辦任務)`);
      return [];
    }

    const content = fs.readFileSync(this.tasksPath, 'utf-8');
    await this.telegram.sendDevlog(`📋 <b>待辦清單</b>\n\n<pre>${content}</pre>`, null);
    return content;
  }

  /**
   * Save Dev Mode state before switching to Chat Mode
   */
  async saveDevModeState(currentState) {
    const contextDir = path.dirname(this.contextPath);
    if (!fs.existsSync(contextDir)) {
      fs.mkdirSync(contextDir, { recursive: true });
    }

    const stateContent = `# Dev Mode State (Saved for Resume)

> Saved at: ${new Date().toISOString()}

## Current Phase
${currentState.phase || 'Unknown'}

## Status
${currentState.status || 'Unknown'}

## Last Working On
${currentState.lastTask || 'Unknown'}

## Next Steps
${currentState.nextSteps?.map(s => `- ${s}`).join('\n') || '- (none)'}

## Notes
${currentState.notes || '(none)'}
`;

    fs.writeFileSync(this.contextPath, stateContent);
    console.log('[ChatMode] Dev mode state saved');
    return true;
  }

  /**
   * Load Dev Mode state when switching back
   */
  loadDevModeState() {
    if (!fs.existsSync(this.contextPath)) {
      return null;
    }
    return fs.readFileSync(this.contextPath, 'utf-8');
  }

  /**
   * Load values from long-term memory
   */
  loadValues() {
    if (!fs.existsSync(this.valuesPath)) {
      return '(尚未建立價值觀記錄)';
    }
    const content = fs.readFileSync(this.valuesPath, 'utf-8');
    return content.slice(0, 2000); // Limit size
  }

  /**
   * Load current task
   */
  loadCurrentTask() {
    const taskPath = path.join(this.memoryDir, 'journal', 'current_task.md');
    if (!fs.existsSync(taskPath)) {
      return '(沒有進行中的任務)';
    }
    return fs.readFileSync(taskPath, 'utf-8');
  }

  /**
   * Load recent journal entries
   */
  loadRecentJournal() {
    const journalDir = path.join(this.memoryDir, 'journal');
    if (!fs.existsSync(journalDir)) {
      return '(沒有最近的日誌)';
    }

    const today = new Date().toISOString().split('T')[0];
    const journalPath = path.join(journalDir, `${today}.md`);

    if (!fs.existsSync(journalPath)) {
      return '(今天還沒有日誌)';
    }

    const content = fs.readFileSync(journalPath, 'utf-8');
    return content.slice(-2000); // Last 2000 chars
  }

  /**
   * Save entry to today's journal
   */
  saveToJournal(type, content) {
    const journalDir = path.join(this.memoryDir, 'journal');
    if (!fs.existsSync(journalDir)) {
      fs.mkdirSync(journalDir, { recursive: true });
    }

    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toISOString().split('T')[1].slice(0, 5);
    const journalPath = path.join(journalDir, `${today}.md`);

    const typeEmoji = { news: '📰', reflection: '💭', chat: '💬' };
    const emoji = typeEmoji[type] || '📝';

    const entry = `\n## ${time} — ${emoji} ${type.toUpperCase()}\n\n${content}\n`;

    if (fs.existsSync(journalPath)) {
      fs.appendFileSync(journalPath, entry);
    } else {
      fs.writeFileSync(journalPath, `# Journal — ${today}\n${entry}`);
    }
  }

  /**
   * Activate sleep mode for today
   */
  activateSleep() {
    this.sleepToday = true;
    console.log('[ChatMode] Sleep mode activated until tomorrow');
  }

  /**
   * Reset sleep mode (called at midnight or on new day)
   */
  resetSleep() {
    this.sleepToday = false;
  }
}
