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

    // v3: Chat history for multi-turn conversations
    this.chatHistory = [];
    this.maxChatHistory = 5; // Keep last 5 messages (sliding window, no caching benefit)
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
   * Check if it's tool search time (09:00 GMT+8)
   */
  isToolSearchTime() {
    const hour = this.getGMT8Hour();
    const now = Date.now();
    // Check if it's 9am and we haven't done tool search in the last 50 minutes
    return hour === 9 && (now - (this.lastToolSearch || 0) > 50 * 60 * 1000);
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
   * v3: Maintains chat history for multi-turn conversations
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
- 回答要基於專案實際情況，不要臆測

## 「記得」指令處理
當 H2Crypto 說「記得...」或「Remember...」時：
- 只記錄 H2Crypto 這次訊息中提到的內容
- 不要把 system prompt 中的內容當作要記住的東西
- 例如：「記得用 Grok 讀新聞」→ 只記「用 Grok 讀新聞」`;

      // v3: Add current message to chat history
      this.chatHistory.push({
        role: 'user',
        content: message,
      });

      // Prune to keep only last N messages
      if (this.chatHistory.length > this.maxChatHistory) {
        this.chatHistory = this.chatHistory.slice(-this.maxChatHistory);
      }

      const response = await this.claudeClient.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        // v3: Cache system prompt for cost savings
        system: [{
          type: 'text',
          text: systemContext,
          cache_control: { type: 'ephemeral' },
        }],
        messages: this.chatHistory,  // v3: Send chat history (no caching - slides)
      });

      const answer = response.content[0]?.text || '抱歉，我無法回答這個問題。';

      // v3: Add assistant response to history
      this.chatHistory.push({
        role: 'assistant',
        content: answer,
      });

      await this.telegram.sendDevlog(`💬 ${answer}`);
      return answer;
    } catch (err) {
      console.error('[ChatMode] Claude error:', err.message);
      await this.telegram.sendDevlog(`❌ Claude API 錯誤: ${err.message}`);
      return null;
    }
  }

  /**
   * Clear chat history (called on reset or when starting tasks)
   */
  clearChatHistory() {
    this.chatHistory = [];
    console.log('[ChatMode] Chat history cleared');
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
   * Daily tool search (09:00 GMT+8)
   * Search for new agentic tools, SDKs, MCP updates
   */
  async doToolSearch() {
    console.log('[ChatMode] Doing daily tool search...');
    this.lastToolSearch = Date.now();

    const today = new Date().toISOString().split('T')[0];

    try {
      const searchPrompt = `現在是 ${today}。請搜尋「過去 24 小時內」最新的 AI Agent 開發工具和 SDK 更新。

重點搜尋:
1. Claude MCP (Model Context Protocol) 新工具或更新
2. Anthropic SDK 更新 (Python, TypeScript)
3. AI Agent 框架更新 (LangChain, AutoGPT, CrewAI, etc.)
4. 新的 Agentic 工具或 API
5. AI coding assistant 更新

只要 2026 年 2 月的新聞/更新，不要舊資訊！

格式:
- 工具名稱
- 更新內容簡述
- 對 Agent 開發的意義

如果過去 24 小時沒有重大更新，請說「過去 24 小時暫無重大工具更新」`;

      const results = await this.callGrok([{ role: 'user', content: searchPrompt }], 800);

      // Save to docs/tool_discoveries.md
      const docsDir = path.join(this.memoryDir, '..', 'docs');
      if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
      }

      const discoveryPath = path.join(docsDir, 'tool_discoveries.md');
      const entry = `
## ${today} 09:00 Daily Tool Search

${results}

---
`;

      if (fs.existsSync(discoveryPath)) {
        const existing = fs.readFileSync(discoveryPath, 'utf-8');
        fs.writeFileSync(discoveryPath, existing + entry);
      } else {
        const header = `# Tool Discoveries Log

> Daily search for new agentic tools and SDK updates.
> Runs at 09:00 GMT+8.

---
${entry}`;
        fs.writeFileSync(discoveryPath, header);
      }

      // Notify via Telegram
      await this.telegram.sendDevlog(
        `🔧 <b>每日工具搜尋 (09:00)</b>\n\n${results}\n\n<i>完整記錄在 docs/tool_discoveries.md</i>`
      );

      // Save to short-term memory
      this.saveToJournal('tool_search', results);

      return results;
    } catch (err) {
      console.error('[ChatMode] Tool search error:', err.message);
      await this.telegram.sendDevlog(`❌ 工具搜尋錯誤: ${err.message}`);
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

    // Check if tool search time (9:00 AM GMT+8)
    if (this.isToolSearchTime()) {
      await this.doToolSearch();
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
   * Get next task number
   */
  getNextTaskNumber() {
    if (!fs.existsSync(this.tasksPath)) return 1;

    const content = fs.readFileSync(this.tasksPath, 'utf-8');
    // Match pattern: - [ ] #1. or - [x] #1. (task format)
    const matches = content.match(/#(\d+)\./g);
    if (!matches || matches.length === 0) return 1;

    const numbers = matches.map(m => parseInt(m.replace('#', '').replace('.', '')));
    return Math.max(...numbers) + 1;
  }

  /**
   * Add a task to pending list (with numbering)
   */
  async addTask(task) {
    const tasksDir = path.dirname(this.tasksPath);
    if (!fs.existsSync(tasksDir)) {
      fs.mkdirSync(tasksDir, { recursive: true });
    }

    const taskNum = this.getNextTaskNumber();
    const timestamp = new Date().toISOString();
    const entry = `- [ ] #${taskNum}. ${task} _(added: ${timestamp.split('T')[0]})_\n`;

    if (fs.existsSync(this.tasksPath)) {
      fs.appendFileSync(this.tasksPath, entry);
    } else {
      const header = `# Pending Tasks\n\n> Tasks to be done via #dotask\n\n`;
      fs.writeFileSync(this.tasksPath, header + entry);
    }

    await this.telegram.sendDevlog(`✅ 任務 #${taskNum} 已加入待辦清單！\n\n使用 <code>#dotask</code> 處理任務`);
    return taskNum;
  }

  /**
   * Delete a task by number
   */
  async deleteTask(taskNum) {
    if (!fs.existsSync(this.tasksPath)) {
      await this.telegram.sendDevlog(`⚠️ 待辦清單是空的`);
      return false;
    }

    const content = fs.readFileSync(this.tasksPath, 'utf-8');
    const lines = content.split('\n');

    const pattern = new RegExp(`#${taskNum}\\.`);
    const taskLine = lines.find(line => pattern.test(line));

    if (!taskLine) {
      await this.telegram.sendDevlog(`⚠️ 找不到任務 #${taskNum}`);
      return false;
    }

    const newLines = lines.filter(line => !pattern.test(line));
    fs.writeFileSync(this.tasksPath, newLines.join('\n'));

    // Extract task text for confirmation
    const taskText = taskLine.replace(/- \[[ x]\] #\d+\. /, '').replace(/_\(added:.*\)_/, '').trim();
    await this.telegram.sendDevlog(`🗑️ 已刪除任務 #${taskNum}\n\n<s>${taskText}</s>`, null);
    return true;
  }

  /**
   * List pending tasks (with numbering)
   */
  async listTasks() {
    if (!fs.existsSync(this.tasksPath)) {
      await this.telegram.sendDevlog(`📋 <b>待辦清單</b>\n\n(目前沒有待辦任務)`);
      return [];
    }

    const content = fs.readFileSync(this.tasksPath, 'utf-8');
    const lines = content.split('\n');

    // Format for display
    const tasks = lines
      .filter(line => line.includes('- [ ]') || line.includes('- [x]'))
      .map(line => {
        const isDone = line.includes('- [x]');
        const match = line.match(/#(\d+)\.\s*(.+?)(?:_\(added:|$)/);
        if (match) {
          const num = match[1];
          const text = match[2].trim();
          return isDone ? `✅ #${num}. <s>${text}</s>` : `⬜ #${num}. ${text}`;
        }
        return line;
      });

    if (tasks.length === 0) {
      await this.telegram.sendDevlog(`📋 <b>待辦清單</b>\n\n(目前沒有待辦任務)`);
      return [];
    }

    const formatted = tasks.join('\n');
    await this.telegram.sendDevlog(
      `📋 <b>待辦清單</b>\n\n${formatted}\n\n` +
      `<i>使用 <code>#deltask [編號]</code> 刪除任務</i>`,
      null
    );
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
