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
const GROK_RESPONSES_URL = 'https://api.x.ai/v1/responses'; // For web search

export class ChatMode {
  constructor(deps) {
    this.telegram = deps.telegram;
    this.grokApiKey = deps.grokApiKey;
    this.claudeClient = deps.claudeClient;
    this.memoryDir = deps.memoryDir;
    this.baseDir = deps.baseDir || path.join(this.memoryDir, '..');
    console.log(`[ChatMode] Initialized with baseDir: ${this.baseDir}`);
    this.valuesPath = path.join(this.memoryDir, 'knowledge', 'values.md');
    this.tasksPath = path.join(this.memoryDir, 'journal', 'pending_tasks.md');
    this.contextPath = path.join(this.memoryDir, 'journal', 'chat_context.md');

    this.sleepToday = false;
    this.lastHeartbeat = 0;
    this.heartbeatInterval = 60 * 60 * 1000; // 60 minutes

    // v3: Chat history for multi-turn conversations
    this.chatHistory = [];
    this.maxChatHistory = 10; // Keep last 10 messages (sliding window, no caching benefit)

    // v3.3: Simple tools for Chat Mode (file operations)
    this.chatTools = [
      {
        name: 'write_file',
        description: 'Write content to a file. Path is relative to /home/projects/solanahacker/.',
        input_schema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path like "knowledge/product.md" or "memory/journal/2026-02-09.md". Do NOT prefix with "app/".' },
            content: { type: 'string', description: 'Content to write' },
          },
          required: ['path', 'content'],
        },
      },
      {
        name: 'read_file',
        description: 'Read a file. Path is relative to /home/projects/solanahacker/.',
        input_schema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path like "knowledge/product.md", "AGENTS.md", or "app/src/App.jsx". Do NOT prefix with unnecessary "app/".' },
          },
          required: ['path'],
        },
      },
      {
        name: 'edit_file',
        description: 'Replace specific text in a file. Use this for modifications instead of rewriting the whole file.',
        input_schema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path like "knowledge/product.md"' },
            old_text: { type: 'string', description: 'The exact text to find and replace' },
            new_text: { type: 'string', description: 'The new text to replace it with' },
          },
          required: ['path', 'old_text', 'new_text'],
        },
      },
    ];
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
   * Call Grok API with web search enabled (for real-time news)
   * Uses the /responses endpoint with web_search tool
   */
  async callGrokWithSearch(query, maxTokens = 1000) {
    if (!this.grokApiKey) {
      throw new Error('XAI_API_KEY not configured');
    }

    const response = await fetch(GROK_RESPONSES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.grokApiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-4.1-fast-non-reasoning',
        input: [{ role: 'user', content: query }],
        tools: [
          {
            type: 'web_search',
            // No domain filters - search freely
          },
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Grok Search API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    // The responses API returns output array with message objects
    const outputMessages = data.output || [];
    const assistantMessage = outputMessages.find(m => m.role === 'assistant');
    return assistantMessage?.content || '';
  }

  /**
   * Handle a chat message from user
   * Always use Claude for better project context understanding
   * @param {string|object} messageOrOptions - message string or { message, imagePath }
   */
  async handleChat(messageOrOptions) {
    // Support both string and object format
    const message = typeof messageOrOptions === 'string' ? messageOrOptions : messageOrOptions.message;
    const imagePath = typeof messageOrOptions === 'object' ? messageOrOptions.imagePath : null;
    return this.handleWithClaude(message, imagePath);
  }

  /**
   * Handle all chat with Claude (better project context understanding)
   * v3: Maintains chat history for multi-turn conversations
   * v3.2: Supports image attachments
   */
  async handleWithClaude(message, imagePath = null) {
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
- 產品規格: knowledge/product.md（會被載入 context）
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

## 工具使用原則

### 修改檔案：優先用 edit_file
- **edit_file**：精準替換，只需指定 old_text 和 new_text
- **write_file**：只在需要創建新檔案或大幅重寫時使用

範例 - 用戶說「把 90% 改成 50%」：
- ✅ 用 edit_file：old_text="90%", new_text="50%" → 回覆確認
- ❌ 不要：read_file → 手動重寫整個檔案

### 查詢檔案
用戶問「商業模式是什麼？」：
- read_file → 回覆具體內容（不要只說「已讀取」）

## 檔案放置規則（路徑相對於 /home/projects/solanahacker/）
重要：所有路徑都相對於專案根目錄，不需要加 "app/" 前綴（除非真的在 app/ 下）

| 類型 | 正確路徑 |
|------|---------|
| 產品規格 | knowledge/product.md |
| 程式碼 | app/src/App.jsx |
| 日誌 | memory/journal/2026-02-09.md |
| Agent 記憶 | memory/knowledge/values.md |
| 知識庫 | knowledge/*.md |

## 「記得」指令處理
當 H2Crypto 說「記得...」或「Remember...」時：
- 檔案位置：memory/knowledge/values.md（不是 memory/values.md！）
- 只記錄 H2Crypto 這次訊息中提到的內容
- 不要把 system prompt 中的內容當作要記住的東西
- 例如：「記得用 Grok 讀新聞」→ 用 edit_file 在 memory/knowledge/values.md 添加`;

      // v3.2: Build message content (text or multimodal with image)
      let userContent;
      if (imagePath && fs.existsSync(imagePath)) {
        try {
          const imageBuffer = fs.readFileSync(imagePath);
          const base64Image = imageBuffer.toString('base64');
          const mediaType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

          userContent = [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: message || '(H2Crypto 傳了這張圖片)',
            },
          ];
          console.log(`[ChatMode] Including image in message: ${imagePath}`);
        } catch (err) {
          console.error(`[ChatMode] Failed to read image: ${err.message}`);
          userContent = message;
        }
      } else {
        userContent = message;
      }

      // v3: Add current message to chat history
      this.chatHistory.push({
        role: 'user',
        content: userContent,
      });

      // v3.8: Simple pruning - history is now text-only so slice is safe
      if (this.chatHistory.length > this.maxChatHistory) {
        this.chatHistory = this.chatHistory.slice(-this.maxChatHistory);
      }

      // v3.3: Chat with tool support
      let response = await this.claudeClient.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2500,
        tools: this.chatTools,
        system: [{
          type: 'text',
          text: systemContext,
          cache_control: { type: 'ephemeral' },
        }],
        messages: this.chatHistory,
      });

      // v3.3: Handle tool use loop (max 3 iterations)
      let iterations = 0;
      let collectedText = []; // v3.6: Collect all text during loop
      let lastToolResults = []; // v3.6: Track last tool results
      const historyLengthBeforeTools = this.chatHistory.length; // v3.8: Track for cleanup

      while (response.stop_reason === 'tool_use' && iterations < 10) {
        iterations++;

        // v3.4: Send intermediate text updates to user (progress updates)
        const textBlocks = response.content.filter(b => b.type === 'text');
        if (textBlocks.length > 0) {
          const progressText = textBlocks.map(b => b.text).join('\n');
          if (progressText.trim()) {
            collectedText.push(progressText);
            await this.telegram.sendDevlog(`💭 ${progressText}`);
          }
        }

        const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
        const toolResults = [];
        lastToolResults = []; // Reset for this iteration

        for (const toolUse of toolUseBlocks) {
          const result = await this.executeChatTool(toolUse.name, toolUse.input);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: result,
          });
          lastToolResults.push({ tool: toolUse.name, result: result.slice(0, 200) });
          console.log(`[ChatMode] Tool ${toolUse.name}: ${result.slice(0, 100)}...`);
        }

        // Add assistant message with tool use
        this.chatHistory.push({
          role: 'assistant',
          content: response.content,
        });

        // Add tool results
        this.chatHistory.push({
          role: 'user',
          content: toolResults,
        });

        // Continue conversation
        response = await this.claudeClient.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2500,
          tools: this.chatTools,
          system: [{
            type: 'text',
            text: systemContext,
            cache_control: { type: 'ephemeral' },
          }],
          messages: this.chatHistory,
        });
      }

      // Extract text answer
      const textBlock = response.content.find(b => b.type === 'text');
      let answer = textBlock?.text;

      // v3.9: If no text in final response, construct meaningful answer from tool results
      if (!answer && lastToolResults.length > 0) {
        const successResults = lastToolResults.filter(r => !r.result.startsWith('Error'));
        if (successResults.length > 0) {
          answer = successResults.map(r => {
            if (r.tool === 'write_file') return `✅ 檔案已更新: ${r.result}`;
            if (r.tool === 'read_file') {
              // Show preview of what was read
              const preview = r.result.slice(0, 500);
              return `📄 檔案內容預覽:\n${preview}${r.result.length > 500 ? '...' : ''}`;
            }
            return `✅ ${r.tool}: ${r.result.slice(0, 100)}`;
          }).join('\n');
        } else {
          answer = `❌ 操作失敗: ${lastToolResults.map(r => r.result).join(', ')}`;
        }
      }

      // Final fallback
      if (!answer) {
        answer = collectedText.length > 0
          ? collectedText[collectedText.length - 1] // Use last progress text
          : '抱歉，我無法完成這個操作。';
      }

      // v3.8: Clean up tool_use/tool_result from history, keep only text
      // Restore history to state before tool loop started
      if (iterations > 0) {
        this.chatHistory = this.chatHistory.slice(0, historyLengthBeforeTools);
        console.log(`[ChatMode] Cleaned tool messages from history`);
      }

      // Add only text content to history
      const textOnlyContent = response.content
        .filter(b => b.type === 'text')
        .map(b => ({ type: 'text', text: b.text }));

      if (textOnlyContent.length > 0) {
        this.chatHistory.push({
          role: 'assistant',
          content: textOnlyContent,
        });
      } else if (answer) {
        // If no text in response but we constructed an answer, add that
        this.chatHistory.push({
          role: 'assistant',
          content: [{ type: 'text', text: answer }],
        });
      }

      // Prune to keep conversation manageable
      if (this.chatHistory.length > this.maxChatHistory) {
        this.chatHistory = this.chatHistory.slice(-this.maxChatHistory);
      }
      console.log(`[ChatMode] History: ${this.chatHistory.length} messages`);

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
   * Normalize path - fix common mistakes like prefixing with "app/" when not needed
   */
  normalizePath(inputPath) {
    let normalized = inputPath;

    // Always strip "app/" prefix for directories that should be at project root
    // knowledge/, memory/, docs/ should NEVER be under app/
    if (normalized.startsWith('app/knowledge/') ||
        normalized.startsWith('app/memory/') ||
        normalized.startsWith('app/docs/')) {
      const withoutApp = normalized.slice(4); // Remove "app/"
      console.log(`[ChatMode] Path correction: ${normalized} -> ${withoutApp}`);
      normalized = withoutApp;
    }

    return normalized;
  }

  /**
   * Execute a chat tool (v3.3)
   */
  async executeChatTool(toolName, input) {
    try {
      if (toolName === 'write_file') {
        const normalizedPath = this.normalizePath(input.path);
        const filePath = path.join(this.baseDir, normalizedPath);
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, input.content, 'utf-8');
        return `File written successfully: ${normalizedPath}`;
      }

      if (toolName === 'read_file') {
        const normalizedPath = this.normalizePath(input.path);
        const filePath = path.join(this.baseDir, normalizedPath);
        console.log(`[ChatMode] read_file: baseDir=${this.baseDir}, path=${normalizedPath}, full=${filePath}`);
        if (!fs.existsSync(filePath)) {
          return `Error: File not found: ${normalizedPath} (looked in ${filePath})`;
        }
        // Check if it's a directory
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          const files = fs.readdirSync(filePath);
          return `${normalizedPath} is a directory. Contents:\n${files.join('\n')}`;
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        return content.slice(0, 15000); // Limit to 15000 chars
      }

      // v3.10: Targeted replacement tool
      if (toolName === 'edit_file') {
        const normalizedPath = this.normalizePath(input.path);
        const filePath = path.join(this.baseDir, normalizedPath);
        console.log(`[ChatMode] edit_file: ${normalizedPath}, replacing "${input.old_text.slice(0, 30)}..." with "${input.new_text.slice(0, 30)}..."`);

        if (!fs.existsSync(filePath)) {
          return `Error: File not found: ${normalizedPath}`;
        }

        const content = fs.readFileSync(filePath, 'utf-8');

        // Check if old_text exists in file
        if (!content.includes(input.old_text)) {
          return `Error: Text not found in file. Could not find: "${input.old_text.slice(0, 50)}..."`;
        }

        // Replace and write
        const newContent = content.replace(input.old_text, input.new_text);
        fs.writeFileSync(filePath, newContent, 'utf-8');

        return `Successfully replaced "${input.old_text.slice(0, 30)}..." with "${input.new_text.slice(0, 30)}..." in ${normalizedPath}`;
      }

      return `Unknown tool: ${toolName}`;
    } catch (err) {
      return `Error executing ${toolName}: ${err.message}`;
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

      // Use search-enabled Grok for real-time news
      const news = await this.callGrokWithSearch(newsPrompt, 800);

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

      // Use search-enabled Grok for real-time tool search
      const results = await this.callGrokWithSearch(searchPrompt, 800);

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

基於以上，選一個來說：
- 分享開發心得或學習
- 問 H2Crypto 一個問題（他喜歡反思）
- 分享一個有趣的觀察

直接寫內容，不要有編號或前綴。用中文，2-3 句話，口語化。`;

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
      // Use search-enabled Grok for real-time news
      const news = await this.callGrokWithSearch(prompt, 400);

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
    return this.deleteTasks([taskNum]);
  }

  /**
   * Delete multiple tasks by number (supports array of task numbers)
   */
  async deleteTasks(taskNums) {
    if (!fs.existsSync(this.tasksPath)) {
      await this.telegram.sendDevlog(`⚠️ 待辦清單是空的`);
      return false;
    }

    const content = fs.readFileSync(this.tasksPath, 'utf-8');
    const lines = content.split('\n');

    const deleted = [];
    const notFound = [];

    // Find and track tasks to delete
    for (const taskNum of taskNums) {
      const pattern = new RegExp(`#${taskNum}\\.`);
      const taskLine = lines.find(line => pattern.test(line));

      if (taskLine) {
        const taskText = taskLine.replace(/- \[[ x]\] #\d+\. /, '').replace(/_\(added:.*\)_/, '').trim();
        deleted.push({ num: taskNum, text: taskText });
      } else {
        notFound.push(taskNum);
      }
    }

    if (deleted.length === 0) {
      await this.telegram.sendDevlog(`⚠️ 找不到任務 #${taskNums.join(', #')}`);
      return false;
    }

    // Remove all matched tasks
    const patternsToRemove = deleted.map(d => new RegExp(`#${d.num}\\.`));
    const newLines = lines.filter(line => !patternsToRemove.some(p => p.test(line)));
    fs.writeFileSync(this.tasksPath, newLines.join('\n'));

    // Build confirmation message
    let message = `🗑️ 已刪除 ${deleted.length} 個任務:\n\n`;
    for (const d of deleted) {
      message += `• <s>#${d.num}. ${d.text.slice(0, 50)}${d.text.length > 50 ? '...' : ''}</s>\n`;
    }

    if (notFound.length > 0) {
      message += `\n⚠️ 找不到: #${notFound.join(', #')}`;
    }

    await this.telegram.sendDevlog(message, null);
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
