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
    this.claudeClient = deps.claudeClient;         // LLM provider for chat (Grok or Anthropic)
    this.anthropicClient = deps.anthropicClient;    // Raw Anthropic SDK for vision (browse_url)
    this.memoryDir = deps.memoryDir;
    this.baseDir = deps.baseDir || path.join(this.memoryDir, '..');
    this.reviewer = deps.reviewer; // UXReviewer for browse_url
    this.devServerPort = deps.devServerPort || 5173;
    this.docsDir = deps.docsDir || path.join(this.baseDir, 'docs');
    this.tgCommunity = deps.tgCommunity || null;
    console.log(`[ChatMode] Initialized with baseDir: ${this.baseDir}`);
    this.valuesPath = path.join(this.memoryDir, 'knowledge', 'values.md');
    this.wipPath = path.join(this.memoryDir, 'journal', 'work_in_progress.md');
    this.contextPath = path.join(this.memoryDir, 'journal', 'chat_context.md');

    this.sleepToday = false;
    this.lastHeartbeat = 0;
    this.heartbeatInterval = 60 * 60 * 1000; // 60 minutes
    this.lastNewsSentAt = 0; // 4-hour cooldown for news search

    // Autonomous X posting timer (2-4 hours randomized)
    // Initialize to now so first post waits full interval after boot
    this.lastXPost = Date.now();
    this.xPostInterval = this._randomXInterval();

    // Community engagement timer (every 2-4 hours, offset from posting)
    this.lastCommunityEngage = Date.now();
    this.communityEngageInterval = this._randomCommunityInterval();

    // Owner mention check timer (every 15 minutes, check immediately on boot)
    this.lastOwnerMentionCheck = 0;
    this.ownerMentionInterval = 15 * 60 * 1000;

    // Moltbook posting timer (posts 1 meme per heartbeat, 2-3 hour cooldown)
    this.lastMoltbookPost = null;
    this.moltbookPostInterval = this._randomMoltbookPostInterval();
    this.moltbookPostDoneDate = null; // YYYY-MM-DD when all memes posted for the day
    this.moltbookSetupDone = false;
    this.moltbookIntroDone = false;

    // Moltbook engagement timer (every 3-5 hours randomized)
    this.lastMoltbookEngage = Date.now(); // wait full interval after boot
    this.moltbookEngageInterval = this._randomMoltbookEngageInterval();

    // Moltbook ecosystem posts to m/general (3.5-5 day timer, independent from meme posts)
    this.lastMoltbookEcosystemPost = Date.now(); // wait full interval after boot
    this.moltbookEcosystemInterval = this._randomMoltbookEcosystemInterval();

    // Memory distillation flag (biweekly Sunday 9am GMT+8)
    this.lastDistillDate = null;

    // v3: Chat history for multi-turn conversations
    this.chatHistory = [];
    this.maxChatHistory = 50; // Keep last 50 messages (sliding window)

    // v4.5: Helper to sanitize strings - ALWAYS remove invalid Unicode surrogates
    // JavaScript JSON.stringify may succeed but API may still reject invalid surrogates
    this.sanitizeString = (str) => {
      if (typeof str !== 'string') return str;
      // ALWAYS sanitize - don't rely on JSON.stringify to detect issues
      let result = '';
      for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        // Handle surrogates
        if (code >= 0xD800 && code <= 0xDBFF) {
          // High surrogate - check if followed by valid low surrogate
          const next = str.charCodeAt(i + 1);
          if (next >= 0xDC00 && next <= 0xDFFF) {
            // Valid surrogate pair, keep both
            result += str[i] + str[i + 1];
            i++;
          } else {
            // Unpaired high surrogate, skip it
            console.log(`[Sanitize] Removed unpaired high surrogate at position ${i}`);
          }
        } else if (code >= 0xDC00 && code <= 0xDFFF) {
          // Lone low surrogate, skip it
          console.log(`[Sanitize] Removed unpaired low surrogate at position ${i}`);
        } else {
          result += str[i];
        }
      }
      return result;
    };

    // v4: Enhanced tools for Chat Mode
    this.chatTools = [
      // --- File Operations ---
      {
        name: 'read_file',
        description: 'Read a file. Path is relative to /home/projects/solanahacker/.',
        input_schema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path like "docs/product.md", "AGENTS.md", or "app/src/App.jsx".' },
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
            path: { type: 'string', description: 'File path like "docs/product.md"' },
            old_text: { type: 'string', description: 'The exact text to find and replace' },
            new_text: { type: 'string', description: 'The new text to replace it with' },
          },
          required: ['path', 'old_text', 'new_text'],
        },
      },
      {
        name: 'write_file',
        description: 'Write content to a file. Creates the file if it does not exist. Use for creating new files or completely rewriting existing ones.',
        input_schema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path like "app/src/components/NewComponent.jsx"' },
            content: { type: 'string', description: 'Complete file content to write' },
          },
          required: ['path', 'content'],
        },
      },
      {
        name: 'list_files',
        description: 'List files and directories in a path. Use to explore project structure.',
        input_schema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Directory path relative to project root. Default: "." (root)' },
            recursive: { type: 'boolean', description: 'List recursively (skips node_modules, .git). Default: false' },
          },
        },
      },

      // --- Web Browsing ---
      {
        name: 'browse_url',
        description: 'Browse a URL and analyze its visual design using Claude Vision. Takes a screenshot and returns detailed analysis of layout, colors, typography, and design patterns.',
        input_schema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'The URL to browse (e.g., "https://example.com")' },
            prompt: { type: 'string', description: 'What to analyze (e.g., "Describe the color scheme and layout"). Default: general design analysis.' },
          },
          required: ['url'],
        },
      },

      // --- Debug ---
      {
        name: 'check_console_errors',
        description: 'Check browser console for JavaScript errors on the dev server. Use to debug UI issues without taking screenshots.',
        input_schema: {
          type: 'object',
          properties: {
            click_selector: { type: 'string', description: 'Optional CSS selector to click before checking errors' },
          },
        },
      },
      {
        name: 'take_screenshot',
        description: 'Take a screenshot of the running dev server to verify UI changes. Returns the screenshot path. Use after making UI changes to confirm they look correct.',
        input_schema: {
          type: 'object',
          properties: {
            viewport: { type: 'string', enum: ['desktop', 'mobile'], description: 'Viewport size. desktop: 1280x720, mobile: 375x812. Default: desktop' },
          },
        },
      },

      // --- Dev Server ---
      {
        name: 'dev_server',
        description: 'Control the Vite development server. Use to start/restart the frontend after waking up or if it crashes.',
        input_schema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['start', 'restart', 'stop', 'status'],
              description: 'start: Launch dev server. restart: Kill and relaunch. stop: Kill. status: Check if running.',
            },
          },
          required: ['action'],
        },
      },

      // --- Cron Jobs ---
      {
        name: 'cron_list',
        description: 'List all cron jobs for the current user. Shows scheduled tasks with their timing and commands.',
        input_schema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'cron_add',
        description: 'Add a new cron job. Schedule format: "minute hour day month weekday" (e.g., "0 8 * * *" for daily 8am, "*/30 * * * *" for every 30min).',
        input_schema: {
          type: 'object',
          properties: {
            schedule: { type: 'string', description: 'Cron schedule (e.g., "0 8 * * *" for daily 8am UTC)' },
            command: { type: 'string', description: 'Command to run (e.g., "curl http://localhost:3001/api/scheduler/daily-memes")' },
            comment: { type: 'string', description: 'Optional comment to identify this job (e.g., "Daily meme generation")' },
          },
          required: ['schedule', 'command'],
        },
      },
      {
        name: 'cron_remove',
        description: 'Remove a cron job by its comment or line number.',
        input_schema: {
          type: 'object',
          properties: {
            identifier: { type: 'string', description: 'Comment text or line number to identify the job to remove' },
          },
          required: ['identifier'],
        },
      },

      // --- Shell ---
      {
        name: 'run_command',
        description: 'Execute a shell command in the app directory. Use for npm install, npm run build, etc. Dangerous commands are blocked.',
        input_schema: {
          type: 'object',
          properties: {
            command: { type: 'string', description: 'Shell command to run (e.g., "npm install", "npm run build")' },
            timeout_ms: { type: 'number', description: 'Timeout in ms. Default: 120000 (2 min)' },
          },
          required: ['command'],
        },
      },

      // --- Git Operations ---
      {
        name: 'git_commit',
        description: 'Commit all changes locally. Does NOT push to remote. Use after editing files.',
        input_schema: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Commit message in format: "type: description"' },
          },
          required: ['message'],
        },
      },
      {
        name: 'git_release',
        description: 'Push commits to GitHub and create a version tag. Use after H2Crypto approves changes.',
        input_schema: {
          type: 'object',
          properties: {
            version: { type: 'string', description: 'Version tag (e.g., "v1.2.3") or "auto" for auto-increment' },
          },
          required: ['version'],
        },
      },

      // --- Memory System ---
      {
        name: 'read_knowledge',
        description: 'Read from the knowledge base. Call without filename to list available files.',
        input_schema: {
          type: 'object',
          properties: {
            filename: { type: 'string', description: 'Knowledge file to read (e.g., "product.md"). Omit to list files.' },
          },
        },
      },
      {
        name: 'search_memory',
        description: 'Search across memory files (bugs, patterns, decisions, values) for relevant information.',
        input_schema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            type: { type: 'string', description: 'File type: "bugs", "patterns", "decisions", "values", or "all" (default)' },
          },
          required: ['query'],
        },
      },
      {
        name: 'remember',
        description: 'Save important information that H2Crypto wants you to remember. Stored in memory/knowledge/values.md.',
        input_schema: {
          type: 'object',
          properties: {
            item: { type: 'string', description: 'The thing to remember' },
          },
          required: ['item'],
        },
      },

      // --- Communication ---
      {
        name: 'send_telegram',
        description: 'Send an additional message to H2Crypto via Telegram. Use for progress updates, asking clarifying questions, or sharing intermediate results.',
        input_schema: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Message text (HTML format supported: <b>, <code>, <pre>)' },
          },
          required: ['message'],
        },
      },
      {
        name: 'write_journal',
        description: 'Write an entry to today\'s journal. Use to log important conversations, decisions, or learnings so Dev Mode can reference them later.',
        input_schema: {
          type: 'object',
          properties: {
            entry: { type: 'string', description: 'Journal entry content' },
            type: { type: 'string', enum: ['action', 'learning', 'decision', 'chat'], description: 'Entry type. Default: chat' },
          },
          required: ['entry'],
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
        model: 'grok-4-1-fast-non-reasoning',
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

    // Handle content that might be string or array of content blocks
    const content = assistantMessage?.content;
    if (!content) return '';
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      // Extract text from content blocks
      return content
        .filter(block => block.type === 'text' || block.type === 'output_text' || typeof block === 'string')
        .map(block => typeof block === 'string' ? block : block.text)
        .join('\n');
    }
    // Fallback: stringify if it's an unexpected object
    return JSON.stringify(content);
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
- 產品規格: docs/product.md（會被載入 context）
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

### 檔案操作
- **read_file**：讀取檔案內容，回覆時要說明具體內容（不要只說「已讀取」）
- **edit_file**：精準替換文字，優先使用（比重寫整個檔案安全）
- **write_file**：創建新檔案或完全重寫檔案
- **list_files**：列出目錄內容，探索專案結構

### 網頁瀏覽
- **browse_url**：截取網頁畫面 + Claude Vision 分析設計
  - 用於：分析競品設計、學習 UI 風格、檢查外部網站
  - 返回：截圖路徑 + 詳細視覺分析

### Debug & 驗證
- **check_console_errors**：檢查 dev server 的瀏覽器 console 錯誤
- **take_screenshot**：截取 dev server 畫面並發送到 Telegram
  - 用於：驗證 UI 修改是否正確顯示
  - 支援 desktop/mobile viewport

### Dev Server & Shell
- **dev_server**：控制前端開發伺服器（start/restart/stop/status）
- **run_command**：執行 shell 指令（在 app/ 目錄）
  - 用於：npm install, npm run build 等
  - 危險指令會被阻擋

### 排程任務 (Cron)
- **cron_list**：列出所有 cron jobs
- **cron_add**：新增排程任務
  - schedule: "minute hour day month weekday" (e.g., "0 8 * * *" = 每天 8:00 UTC)
  - command: 要執行的指令
  - comment: 任務說明
- **cron_remove**：移除排程任務（用 comment 或行號識別）

### Git 操作
- **git_commit**：Commit 變更（不 push），等 H2Crypto review
- **git_release**：Push + 建立 tag，版本可用 "auto" 自動遞增

### 記憶系統
- **read_knowledge**：讀取參考文件（docs/*.md）
- **search_memory**：搜尋記憶（bugs, patterns, decisions, values）
- **remember**：記住 H2Crypto 說的重要事項

### 通訊與日誌
- **send_telegram**：主動發送訊息給 H2Crypto（進度更新、提問）
  - 格式：Telegram HTML（<b>, <code>, <pre>）
  - 換行：用 \\n，**禁止用 <br>**
- **write_journal**：寫入今日日誌，讓 Dev Mode 能參考對話內容

## 檔案放置規則（路徑相對於 /home/projects/solanahacker/）
重要：所有路徑都相對於專案根目錄，不需要加 "app/" 前綴（除非真的在 app/ 下）

| 類型 | 正確路徑 |
|------|---------|
| 產品規格 | **docs/product.md** ← 注意是 docs/ 不是 knowledge/ |
| 程式碼 | app/src/App.jsx |
| 日誌 | memory/journal/2026-02-09.md |
| Agent 記憶 | memory/knowledge/values.md（這裡沒有 product.md！）|
| 參考文件 | docs/*.md |

⚠️ product.md 在 **docs/** 目錄，不在 memory/knowledge/！

## 「記得」指令處理
當 H2Crypto 說「記得...」或「Remember...」時：
- 使用 **remember** 工具，不要手動編輯檔案
- 只記錄 H2Crypto 這次訊息中提到的內容
- 例如：「記得用 Grok 讀新聞」→ remember({ item: "用 Grok 讀新聞" })`;

      // v4.4: Sanitize the entire system context to prevent JSON encoding errors
      const sanitizedSystemContext = this.sanitizeString(systemContext);

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

      // v3: Add current message to chat history (v4.2: validate non-empty, v4.4: sanitize)
      let sanitizedUserContent;
      if (typeof userContent === 'string') {
        sanitizedUserContent = this.sanitizeString(userContent);
      } else if (Array.isArray(userContent)) {
        // Sanitize text parts of multimodal content (images + text)
        sanitizedUserContent = userContent.map(block => {
          if (block.type === 'text' && block.text) {
            return { ...block, text: this.sanitizeString(block.text) };
          }
          return block;
        });
      } else {
        sanitizedUserContent = userContent;
      }
      if (sanitizedUserContent && (typeof sanitizedUserContent === 'string' ? sanitizedUserContent.trim() : sanitizedUserContent.length > 0)) {
        this.chatHistory.push({
          role: 'user',
          content: sanitizedUserContent,
        });
      } else {
        console.log('[ChatMode] Skipping empty user message');
        // Add placeholder to prevent empty content error
        this.chatHistory.push({
          role: 'user',
          content: '(繼續)',
        });
      }

      // v3.8: Simple pruning - history is now text-only so slice is safe
      if (this.chatHistory.length > this.maxChatHistory) {
        this.chatHistory = this.chatHistory.slice(-this.maxChatHistory);
      }

      // v4.2: Filter out any messages with empty content before sending
      // v4.4: Also sanitize all message content to prevent JSON encoding errors
      const validMessages = this.chatHistory
        .filter(msg => {
          if (!msg.content) return false;
          if (typeof msg.content === 'string') return msg.content.trim().length > 0;
          if (Array.isArray(msg.content)) return msg.content.length > 0;
          return true;
        })
        .map(msg => {
          // Sanitize content before sending
          if (typeof msg.content === 'string') {
            return { ...msg, content: this.sanitizeString(msg.content) };
          } else if (Array.isArray(msg.content)) {
            return {
              ...msg,
              content: msg.content.map(block => {
                if (block.type === 'text' && block.text) {
                  return { ...block, text: this.sanitizeString(block.text) };
                }
                if (block.type === 'tool_result' && typeof block.content === 'string') {
                  return { ...block, content: this.sanitizeString(block.content) };
                }
                return block;
              }),
            };
          }
          return msg;
        });

      // v3.3: Chat with tool support
      // v4.5: Add debug logging for 400 errors
      let response;
      try {
        response = await this.claudeClient.messages.create({
          max_tokens: 2500,
          tools: this.chatTools,
          system: [{
            type: 'text',
            text: sanitizedSystemContext,
            cache_control: { type: 'ephemeral' },
          }],
          messages: validMessages,
        });
      } catch (apiError) {
        // v4.5: Debug all API errors
        console.error('[ChatMode] API Error caught:', apiError.status, apiError.message);
        console.error(`[ChatMode] System context length: ${sanitizedSystemContext.length}`);
        console.error(`[ChatMode] Messages count: ${validMessages.length}`);

        // Always try to find surrogates
        try {
          const fullPayload = JSON.stringify({ system: sanitizedSystemContext, messages: validMessages });
          console.error(`[ChatMode] Full payload length: ${fullPayload.length}`);
          let surrogateCount = 0;
          for (let i = 0; i < fullPayload.length; i++) {
            const code = fullPayload.charCodeAt(i);
            if (code >= 0xD800 && code <= 0xDFFF) {
              surrogateCount++;
              if (surrogateCount <= 5) {
                console.error(`[ChatMode] Found surrogate at ${i}: \\u${code.toString(16)}, context: "${fullPayload.slice(Math.max(0,i-10), i+10)}"`);
              }
            }
          }
          console.error(`[ChatMode] Total surrogates found: ${surrogateCount}`);
        } catch (e) {
          console.error(`[ChatMode] Error while scanning payload: ${e.message}`);
        }
        throw apiError;
      }

      // v3.3: Handle tool use loop (max 3 iterations)
      let iterations = 0;
      let collectedText = []; // v3.6: Collect all text during loop
      let lastToolResults = []; // v3.6: Track last tool results
      let sentViaTelegram = false; // v4.1: Track if send_telegram was used
      const historyLengthBeforeTools = this.chatHistory.length; // v3.8: Track for cleanup

      while (response.stop_reason === 'tool_use' && iterations < 30) {
        iterations++;

        // v4.1: Don't send progress text if send_telegram is in this response
        // (Agent will send its own message via the tool)
        const textBlocks = response.content.filter(b => b.type === 'text');
        const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
        const hasSendTelegram = toolUseBlocks.some(b => b.name === 'send_telegram');

        // v3.4: Send intermediate text updates (but skip if send_telegram is being used)
        if (textBlocks.length > 0 && !hasSendTelegram) {
          const progressText = textBlocks.map(b => b.text).join('\n');
          if (progressText.trim()) {
            collectedText.push(progressText);
            await this.telegram.sendDevlog(`💭 ${progressText}`);
          }
        }

        const toolResults = [];
        lastToolResults = []; // Reset for this iteration

        for (const toolUse of toolUseBlocks) {
          const rawResult = await this.executeChatTool(toolUse.name, toolUse.input);
          // v4.4: Sanitize tool results to prevent JSON encoding errors
          const result = this.sanitizeString(rawResult);
          // v4.1: Track if send_telegram was successfully used
          if (toolUse.name === 'send_telegram' && result.includes('[OK]')) {
            sentViaTelegram = true;
          }
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: result,
          });
          lastToolResults.push({ tool: toolUse.name, result: result.slice(0, 200) });
          console.log(`[ChatMode] Tool ${toolUse.name}: ${result.slice(0, 100)}...`);
        }

        // Add assistant message with tool use
        if (response.content && response.content.length > 0) {
          this.chatHistory.push({
            role: 'assistant',
            content: response.content,
          });
        }

        // Add tool results (v4.2: validate non-empty)
        if (toolResults && toolResults.length > 0) {
          this.chatHistory.push({
            role: 'user',
            content: toolResults,
          });
        }

        // v4.2: Filter out any messages with empty content before sending
        // v4.4: Filter and sanitize all messages before API call
        const validMessagesLoop = this.chatHistory
          .filter(msg => {
            if (!msg.content) return false;
            if (typeof msg.content === 'string') return msg.content.trim().length > 0;
            if (Array.isArray(msg.content)) return msg.content.length > 0;
            return true;
          })
          .map(msg => {
            if (typeof msg.content === 'string') {
              return { ...msg, content: this.sanitizeString(msg.content) };
            } else if (Array.isArray(msg.content)) {
              return {
                ...msg,
                content: msg.content.map(block => {
                  if (block.type === 'text' && block.text) {
                    return { ...block, text: this.sanitizeString(block.text) };
                  }
                  if (block.type === 'tool_result' && typeof block.content === 'string') {
                    return { ...block, content: this.sanitizeString(block.content) };
                  }
                  return block;
                }),
              };
            }
            return msg;
          });

        // Continue conversation
        response = await this.claudeClient.messages.create({
          max_tokens: 2500,
          tools: this.chatTools,
          system: [{
            type: 'text',
            text: sanitizedSystemContext,
            cache_control: { type: 'ephemeral' },
          }],
          messages: validMessagesLoop,
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

      // v4.5: Hallucination detection — LLM claims actions but made no tool calls
      // If detected, re-prompt LLM to actually use tools instead of just describing actions
      if (iterations === 0 && answer) {
        const actionPatterns = [
          /已建立|已創建|已新增|已寫入|已寫了|已修改|已更新|已刪除|已移除/,
          /檔案已|文件已|Written:|Created:|File created/,
          /已\s*commit|已\s*push|已\s*tag|已\s*release/,
          /完整大小|bytes.*權限|檔案頭部|檔案內容預覽/i,
          /剛讀檔確認|剛讀取確認|讀檔確認/,
        ];
        const claimsAction = actionPatterns.some(p => p.test(answer));
        if (claimsAction) {
          console.warn(`[ChatMode] ⚠️ HALLUCINATION DETECTED: Response claims actions but tool_calls=0`);
          console.warn(`[ChatMode] Suspicious text: ${answer.slice(0, 200)}`);
          await this.telegram.sendDevlog(`⚠️ <b>幻覺偵測</b>：LLM 聲稱執行了操作但未呼叫工具，正在自動修正...`);

          // Add the hallucinated response + correction to history, then re-call LLM
          this.chatHistory.push({
            role: 'assistant',
            content: [{ type: 'text', text: answer }],
          });
          this.chatHistory.push({
            role: 'user',
            content: '[SYSTEM] ⚠️ HALLUCINATION DETECTED: You just described file operations (create/write/read/commit) ' +
              'as if you performed them, but you did NOT call any tools. Your response was text-only.\n\n' +
              'RULES:\n' +
              '1. To create/write files → MUST call write_file tool\n' +
              '2. To read files → MUST call read_file tool\n' +
              '3. To run commands → MUST call run_command tool\n' +
              '4. To commit/push → MUST call git_commit / git_release tool\n' +
              '5. NEVER describe actions without actually calling the tool\n\n' +
              'Please REDO the operation by actually calling the correct tools now.',
          });

          // Re-call LLM with correction
          const retryMessages = this.chatHistory
            .filter(msg => {
              if (!msg.content) return false;
              if (typeof msg.content === 'string') return msg.content.trim().length > 0;
              if (Array.isArray(msg.content)) return msg.content.length > 0;
              return true;
            })
            .map(msg => {
              if (typeof msg.content === 'string') {
                return { ...msg, content: this.sanitizeString(msg.content) };
              }
              return msg;
            });

          response = await this.claudeClient.messages.create({
            max_tokens: 2500,
            tools: this.chatTools,
            system: [{
              type: 'text',
              text: sanitizedSystemContext,
              cache_control: { type: 'ephemeral' },
            }],
            messages: retryMessages,
          });

          // Run tool loop on the retry response
          while (response.stop_reason === 'tool_use' && iterations < 30) {
            iterations++;
            const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
            const toolResults = [];
            for (const toolUse of toolUseBlocks) {
              const rawResult = await this.executeChatTool(toolUse.name, toolUse.input);
              const result = this.sanitizeString(rawResult);
              if (toolUse.name === 'send_telegram' && result.includes('[OK]')) {
                sentViaTelegram = true;
              }
              toolResults.push({
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: result,
              });
              console.log(`[ChatMode] Tool ${toolUse.name}: ${result.slice(0, 100)}...`);
            }
            this.chatHistory.push({ role: 'assistant', content: response.content });
            if (toolResults.length > 0) {
              this.chatHistory.push({ role: 'user', content: toolResults });
            }
            const validRetryMessages = this.chatHistory
              .filter(msg => msg.content && (typeof msg.content === 'string' ? msg.content.trim().length > 0 : Array.isArray(msg.content) ? msg.content.length > 0 : true))
              .map(msg => typeof msg.content === 'string' ? { ...msg, content: this.sanitizeString(msg.content) } : msg);
            response = await this.claudeClient.messages.create({
              max_tokens: 2500,
              tools: this.chatTools,
              system: [{ type: 'text', text: sanitizedSystemContext, cache_control: { type: 'ephemeral' } }],
              messages: validRetryMessages,
            });
          }

          // Extract corrected answer
          const retryText = response.content.find(b => b.type === 'text');
          answer = retryText?.text || '✅ 操作已透過工具重新執行。';
          console.log(`[ChatMode] Hallucination corrected, iterations=${iterations}`);
        }
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

      // v4.1/v4.6: Send final message to Telegram
      // Previously: skip if send_telegram was used. But this caused lost messages when
      // Grok sent an intermediate "in progress" via send_telegram and had a final summary.
      // Fix: always send the final answer if it has meaningful content.
      if (answer && answer.trim()) {
        if (sentViaTelegram) {
          // send_telegram was used during tool loop — send final answer as a follow-up
          console.log('[ChatMode] send_telegram was used during loop, but still sending final answer');
        }
        await this.telegram.sendDevlog(`💬 ${answer}`);
      }
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
   * Normalize path - handle absolute paths and fix common mistakes
   */
  normalizePath(inputPath) {
    let normalized = inputPath;

    // Handle absolute paths - strip baseDir prefix if present
    if (normalized.startsWith('/home/projects/solanahacker/')) {
      normalized = normalized.slice('/home/projects/solanahacker/'.length);
      console.log(`[ChatMode] Absolute path converted: ${inputPath} -> ${normalized}`);
    }

    // v4.5: Fix duplicate "app/app/" path issue
    // Agent sometimes mistakenly uses app/app/ instead of just app/
    if (normalized.startsWith('app/app/')) {
      normalized = normalized.slice(4); // Remove first "app/"
      console.log(`[ChatMode] Fixed duplicate app/: ${inputPath} -> ${normalized}`);
    }

    // Always strip "app/" prefix for directories that should be at project root
    // knowledge/, memory/, docs/ should NEVER be under app/
    if (normalized.startsWith('app/knowledge/') ||
        normalized.startsWith('app/memory/') ||
        normalized.startsWith('app/docs/')) {
      const withoutApp = normalized.slice(4); // Remove "app/"
      console.log(`[ChatMode] Path correction: ${normalized} -> ${withoutApp}`);
      normalized = withoutApp;
    }

    // Transient docs should go to docs/_transient/
    // Cleanup plans, env setup guides, etc.
    if (normalized === 'cleanup-plan.md' || normalized.endsWith('/cleanup-plan.md')) {
      normalized = 'docs/_transient/cleanup-plan.md';
      console.log(`[ChatMode] Moved to _transient: ${inputPath} -> ${normalized}`);
    }

    return normalized;
  }

  /**
   * Normalize command paths - fix cd commands that use wrong relative paths
   * Also rewrite dangerous process-killing commands to be safer
   */
  normalizeCommand(command) {
    // Fix common cd mistakes when cwd is already /app
    // "cd app/backend" -> "cd backend" (since we're already in app/)
    // "cd /home/projects/solanahacker/app/backend" -> "cd backend"
    let fixed = command;

    // Handle absolute paths in cd
    fixed = fixed.replace(/cd\s+\/home\/projects\/solanahacker\/app\/?/g, 'cd ');
    fixed = fixed.replace(/cd\s+\/home\/projects\/solanahacker\/?/g, 'cd ../');

    // Handle "cd app/..." when already in app/
    fixed = fixed.replace(/cd\s+app\//g, 'cd ');

    // v4.3: Rewrite pkill commands to exclude main.js (Agent's own process)
    // Agent often tries to kill node processes for backend restart, which kills itself
    // Rewrite: pkill -f "node.*server" -> pkill -f "node.*server" --ignore-args "main.js"
    // Better: Use pgrep + grep + xargs to exclude main.js
    if (/pkill\s+(-f\s+)?["']?node/i.test(fixed)) {
      console.log(`[ChatMode] WARNING: Blocking pkill node command: "${fixed}"`);
      // Instead of running pkill, provide instructions
      fixed = 'echo "ERROR: pkill node commands are blocked. Use: lsof -i :3001 | grep node | awk \'{print $2}\' | xargs kill -9 to kill backend only"';
    }

    // Also block killall node
    if (/killall\s+node/i.test(fixed)) {
      console.log(`[ChatMode] WARNING: Blocking killall node command: "${fixed}"`);
      fixed = 'echo "ERROR: killall node is blocked. Use: lsof -i :3001 | grep node | awk \'{print $2}\' | xargs kill -9 to kill backend only"';
    }

    if (fixed !== command) {
      console.log(`[ChatMode] Command fix: "${command}" -> "${fixed}"`);
    }

    return fixed;
  }

  /**
   * Execute a chat tool (v4)
   */
  async executeChatTool(toolName, input) {
    try {
      // --- File Operations ---
      if (toolName === 'read_file') {
        const normalizedPath = this.normalizePath(input.path);
        const filePath = path.join(this.baseDir, normalizedPath);
        console.log(`[ChatMode] read_file: baseDir=${this.baseDir}, path=${normalizedPath}, full=${filePath}`);
        if (!fs.existsSync(filePath)) {
          return `Error: File not found: ${normalizedPath} (looked in ${filePath})`;
        }
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          const files = fs.readdirSync(filePath);
          return `${normalizedPath} is a directory. Contents:\n${files.join('\n')}`;
        }
        const rawContent = fs.readFileSync(filePath, 'utf-8');
        // v4.4: Sanitize to remove invalid Unicode surrogates
        const content = this.sanitizeString(rawContent);
        if (content.length > 50000) {
          return content.slice(0, 50000) + `\n\n[...truncated, file is ${content.length} chars]`;
        }
        return content;
      }

      if (toolName === 'edit_file') {
        const normalizedPath = this.normalizePath(input.path);
        const filePath = path.join(this.baseDir, normalizedPath);
        console.log(`[ChatMode] edit_file: ${normalizedPath}, replacing "${input.old_text.slice(0, 30)}..." with "${input.new_text.slice(0, 30)}..."`);
        if (!fs.existsSync(filePath)) {
          return `Error: File not found: ${normalizedPath}`;
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        if (!content.includes(input.old_text)) {
          return `Error: Text not found in file. Could not find: "${input.old_text.slice(0, 50)}..."`;
        }
        const newContent = content.replace(input.old_text, input.new_text);
        fs.writeFileSync(filePath, newContent, 'utf-8');
        return `Successfully replaced "${input.old_text.slice(0, 30)}..." with "${input.new_text.slice(0, 30)}..." in ${normalizedPath}`;
      }

      if (toolName === 'write_file') {
        const normalizedPath = this.normalizePath(input.path);
        const filePath = path.join(this.baseDir, normalizedPath);
        console.log(`[ChatMode] write_file: ${normalizedPath}`);

        // Create parent directories if needed
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(filePath, input.content, 'utf-8');
        return `Successfully wrote ${input.content.length} characters to ${normalizedPath}`;
      }

      if (toolName === 'list_files') {
        const targetPath = input.path || '.';
        const normalizedPath = this.normalizePath(targetPath);
        const fullPath = path.join(this.baseDir, normalizedPath);
        console.log(`[ChatMode] list_files: ${normalizedPath}`);

        if (!fs.existsSync(fullPath)) {
          return `Error: Path not found: ${normalizedPath}`;
        }

        const listDir = (dir, prefix = '', recursive = false) => {
          const items = fs.readdirSync(dir);
          let result = [];

          for (const item of items) {
            // Skip common noise
            if (['node_modules', '.git', 'dist', '.next', '.cache'].includes(item)) continue;

            const itemPath = path.join(dir, item);
            const stat = fs.statSync(itemPath);
            const isDir = stat.isDirectory();

            result.push(`${prefix}${isDir ? '📁 ' : '📄 '}${item}`);

            if (recursive && isDir) {
              result = result.concat(listDir(itemPath, prefix + '  ', true));
            }
          }
          return result;
        };

        const files = listDir(fullPath, '', input.recursive || false);
        return `Contents of ${normalizedPath}:\n${files.join('\n')}`;
      }

      // --- Web Browsing ---
      if (toolName === 'browse_url') {
        if (!this.reviewer) {
          return 'Error: UXReviewer not available. Cannot browse URLs.';
        }
        try {
          const url = input.url;
          const prompt = input.prompt || 'Analyze this webpage design: describe the color scheme, layout, typography, key visual elements, and overall design style. What makes it effective or unique?';

          // Take screenshot of the URL
          await this.reviewer.init();
          const screenshotPath = await this.reviewer.takeScreenshot(url, 'browse');

          // Analyze with Claude Vision (always use Anthropic for vision)
          const imageBuffer = fs.readFileSync(screenshotPath);
          const base64Image = imageBuffer.toString('base64');

          const visionClient = this.anthropicClient || this.claudeClient;
          const visionResponse = await visionClient.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1500,
            messages: [{
              role: 'user',
              content: [
                { type: 'image', source: { type: 'base64', media_type: 'image/png', data: base64Image } },
                { type: 'text', text: prompt }
              ]
            }]
          });

          const analysis = visionResponse.content.find(c => c.type === 'text')?.text || 'No analysis available';
          return `Screenshot saved: ${screenshotPath}\n\n**Visual Analysis:**\n${analysis}`;
        } catch (err) {
          return `Error browsing URL: ${err.message}`;
        }
      }

      // --- Debug ---
      if (toolName === 'check_console_errors') {
        try {
          const { chromium } = await import('playwright');
          const browser = await chromium.launch({ headless: true });
          const page = await browser.newPage();

          const consoleErrors = [];
          page.on('console', msg => {
            if (msg.type() === 'error') consoleErrors.push(msg.text());
          });
          page.on('pageerror', err => consoleErrors.push(`[PageError] ${err.message}`));

          const url = `http://localhost:${this.devServerPort}`;
          await page.goto(url);
          await page.waitForTimeout(2000);

          if (input.click_selector) {
            try {
              const element = await page.locator(input.click_selector).first();
              if (await element.isVisible()) {
                await element.click();
                await page.waitForTimeout(3000);
              }
            } catch (e) {
              consoleErrors.push(`Click failed: ${e.message}`);
            }
          }

          await browser.close();

          if (consoleErrors.length === 0) {
            return '✅ No console errors found.';
          }
          return `⚠️ Found ${consoleErrors.length} console error(s):\n${consoleErrors.map((e, i) => `${i + 1}. ${e}`).join('\n')}`;
        } catch (err) {
          return `Error checking console: ${err.message}`;
        }
      }

      if (toolName === 'take_screenshot') {
        if (!this.reviewer) {
          return 'Error: UXReviewer not available. Cannot take screenshots.';
        }
        try {
          await this.reviewer.init();
          const url = `http://localhost:${this.devServerPort}`;
          const viewport = input.viewport || 'desktop';

          let screenshotPath;
          if (viewport === 'mobile') {
            screenshotPath = await this.reviewer.takeMobileScreenshot(url, 'chat');
          } else {
            screenshotPath = await this.reviewer.takeScreenshot(url, 'chat');
          }

          // Send screenshot to Telegram so H2Crypto can see it
          if (this.telegram && fs.existsSync(screenshotPath)) {
            await this.telegram.sendPhoto(screenshotPath, `📸 Screenshot (${viewport})`);
          }

          return `Screenshot saved: ${screenshotPath}\nViewport: ${viewport}\nURL: ${url}\n\n✅ Screenshot sent to Telegram for review.`;
        } catch (err) {
          return `Error taking screenshot: ${err.message}`;
        }
      }

      // --- Dev Server ---
      if (toolName === 'dev_server') {
        try {
          const { exec, spawn } = await import('child_process');
          const { promisify } = await import('util');
          const execAsync = promisify(exec);
          const appDir = path.join(this.baseDir, 'app');
          const port = this.devServerPort;

          const killPort = async () => {
            try {
              const { stdout } = await execAsync(`lsof -ti:${port} 2>/dev/null || true`);
              if (stdout.trim()) {
                const pids = stdout.trim().split('\n');
                for (const pid of pids) {
                  try { await execAsync(`kill -9 ${pid}`); } catch {}
                }
                await new Promise(r => setTimeout(r, 1000));
              }
            } catch {}
          };

          const checkStatus = async () => {
            try {
              const { stdout } = await execAsync(`lsof -ti:${port} 2>/dev/null || true`);
              return stdout.trim() !== '';
            } catch { return false; }
          };

          switch (input.action) {
            case 'status': {
              const running = await checkStatus();
              return running
                ? `✅ Dev server is running on port ${port}\nURL: http://165.22.136.40:${port}`
                : `❌ Dev server is NOT running on port ${port}`;
            }
            case 'stop': {
              await killPort();
              return `Dev server stopped (port ${port} cleared)`;
            }
            case 'start':
            case 'restart': {
              if (input.action === 'restart') await killPort();

              // Check if already running for 'start'
              if (input.action === 'start' && await checkStatus()) {
                return `Dev server already running on port ${port}`;
              }

              // Spawn dev server in background
              const child = spawn('npm', ['run', 'dev', '--', '--host', '0.0.0.0'], {
                cwd: appDir,
                detached: true,
                stdio: 'ignore',
                env: { ...process.env, FORCE_COLOR: '0' },
              });
              child.unref();

              // Wait for server to be ready
              await new Promise(r => setTimeout(r, 3000));
              const running = await checkStatus();

              if (running) {
                return `✅ Dev server ${input.action}ed successfully!\nURL: http://165.22.136.40:${port}`;
              } else {
                return `⚠️ Dev server may still be starting. Check status in a few seconds.`;
              }
            }
            default:
              return `Unknown action: ${input.action}. Use: start, restart, stop, status`;
          }
        } catch (err) {
          return `Dev server error: ${err.message}`;
        }
      }

      // --- Cron Jobs ---
      if (toolName === 'cron_list') {
        try {
          const { exec } = await import('child_process');
          const { promisify } = await import('util');
          const execAsync = promisify(exec);

          const { stdout, stderr } = await execAsync('crontab -l 2>/dev/null || echo "No crontab for current user"');

          if (stdout.includes('No crontab') || stdout.trim() === '') {
            return '📅 No cron jobs configured.\n\nUse cron_add to create scheduled tasks.';
          }

          // Parse and format cron jobs
          const lines = stdout.trim().split('\n');
          let result = '📅 **Current Cron Jobs:**\n\n';
          let jobNum = 1;

          for (const line of lines) {
            if (line.startsWith('#')) {
              // Comment line
              result += `${line}\n`;
            } else if (line.trim()) {
              // Cron job line
              const parts = line.trim().split(/\s+/);
              if (parts.length >= 6) {
                const schedule = parts.slice(0, 5).join(' ');
                const command = parts.slice(5).join(' ');
                result += `**${jobNum}.** \`${schedule}\` → \`${command.slice(0, 60)}${command.length > 60 ? '...' : ''}\`\n`;
                jobNum++;
              }
            }
          }

          result += '\n**Schedule format:** `minute hour day month weekday`\n';
          result += '- `*` = any value\n';
          result += '- `*/N` = every N units\n';
          result += '- Example: `0 8 * * *` = daily at 8:00 UTC';

          return result;
        } catch (err) {
          return `Error listing cron jobs: ${err.message}`;
        }
      }

      if (toolName === 'cron_add') {
        try {
          const { exec } = await import('child_process');
          const { promisify } = await import('util');
          const execAsync = promisify(exec);

          const { schedule, command, comment } = input;

          // Validate schedule format (basic check)
          const scheduleParts = schedule.trim().split(/\s+/);
          if (scheduleParts.length !== 5) {
            return `Error: Invalid schedule format. Expected 5 fields (minute hour day month weekday), got ${scheduleParts.length}.\nExample: "0 8 * * *" for daily at 8:00 UTC`;
          }

          // Get current crontab
          let currentCrontab = '';
          try {
            const { stdout } = await execAsync('crontab -l 2>/dev/null');
            currentCrontab = stdout;
          } catch {
            // No existing crontab
          }

          // Build new crontab entry
          let newEntry = '';
          if (comment) {
            newEntry += `# ${comment}\n`;
          }
          newEntry += `${schedule} ${command}`;

          // Append to crontab
          const newCrontab = currentCrontab.trim() + '\n' + newEntry + '\n';

          // Write new crontab
          await execAsync(`echo "${newCrontab.replace(/"/g, '\\"')}" | crontab -`);

          return `✅ Cron job added successfully!\n\n**Schedule:** \`${schedule}\`\n**Command:** \`${command}\`${comment ? `\n**Comment:** ${comment}` : ''}\n\nUse cron_list to verify.`;
        } catch (err) {
          return `Error adding cron job: ${err.message}`;
        }
      }

      if (toolName === 'cron_remove') {
        try {
          const { exec } = await import('child_process');
          const { promisify } = await import('util');
          const execAsync = promisify(exec);

          const { identifier } = input;

          // Get current crontab
          let currentCrontab = '';
          try {
            const { stdout } = await execAsync('crontab -l 2>/dev/null');
            currentCrontab = stdout;
          } catch {
            return 'No crontab exists for current user.';
          }

          const lines = currentCrontab.split('\n');
          let newLines = [];
          let removed = false;
          let removedLine = '';

          // Check if identifier is a line number
          const lineNum = parseInt(identifier);
          if (!isNaN(lineNum)) {
            // Remove by line number (1-indexed, counting only non-comment job lines)
            let jobCount = 0;
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              if (line.trim() && !line.startsWith('#')) {
                jobCount++;
                if (jobCount === lineNum) {
                  removed = true;
                  removedLine = line;
                  // Also remove preceding comment if exists
                  if (i > 0 && lines[i - 1].startsWith('#')) {
                    newLines.pop();
                  }
                  continue;
                }
              }
              newLines.push(line);
            }
          } else {
            // Remove by comment match
            let skipNext = false;
            for (const line of lines) {
              if (skipNext) {
                removedLine = line;
                skipNext = false;
                removed = true;
                continue;
              }
              if (line.includes(identifier)) {
                if (line.startsWith('#')) {
                  // This is a comment, skip the next line too (the actual job)
                  skipNext = true;
                  removed = true;
                  continue;
                } else {
                  // This is the job line itself
                  removedLine = line;
                  removed = true;
                  continue;
                }
              }
              newLines.push(line);
            }
          }

          if (!removed) {
            return `No cron job found matching: ${identifier}\n\nUse cron_list to see current jobs.`;
          }

          // Write updated crontab
          const newCrontab = newLines.join('\n');
          if (newCrontab.trim()) {
            await execAsync(`echo "${newCrontab.replace(/"/g, '\\"')}" | crontab -`);
          } else {
            await execAsync('crontab -r 2>/dev/null || true');
          }

          return `✅ Cron job removed:\n\`${removedLine}\`\n\nUse cron_list to verify.`;
        } catch (err) {
          return `Error removing cron job: ${err.message}`;
        }
      }

      // --- Shell ---
      if (toolName === 'run_command') {
        // Dangerous command blocklist (same as Dev Mode)
        // v4.3: Updated to catch more pkill patterns that could kill the agent
        // pkill.*node matches: pkill node, pkill -f node, pkill -f "node.*server", etc.
        const DANGEROUS_CMD = /rm\s+-rf\s+\/|mkfs|dd\s+if=|shutdown|reboot|:()\s*\{|wget.*\|\s*sh|curl.*\|\s*sh|pkill.*node|killall\s+node|pkill\s+(-f\s+)?agent|kill\s+-9\s+\$\$|kill\s+-9\s+\$PPID/i;

        if (DANGEROUS_CMD.test(input.command)) {
          return `Error: Dangerous command blocked: ${input.command}`;
        }

        try {
          const { exec } = await import('child_process');
          const { promisify } = await import('util');
          const execAsync = promisify(exec);
          const appDir = path.join(this.baseDir, 'app');
          const timeout_ms = input.timeout_ms || 120000;

          // Auto-fix common path mistakes in commands
          const fixedCommand = this.normalizeCommand(input.command);

          // Strip sensitive env vars
          const safeEnv = { ...process.env };
          delete safeEnv.ANTHROPIC_API_KEY;
          delete safeEnv.XAI_API_KEY;
          delete safeEnv.GEMINI_API_KEY;
          delete safeEnv.GITHUB_TOKEN;
          delete safeEnv.TELEGRAM_BOT_TOKEN;

          const { stdout, stderr } = await execAsync(fixedCommand, {
            cwd: appDir,
            timeout: timeout_ms,
            maxBuffer: 2 * 1024 * 1024,
            env: safeEnv,
          });

          let result = stdout || '';
          if (stderr) result += `\n[stderr]: ${stderr}`;
          if (result.length > 5000) result = result.slice(0, 5000) + '\n...(truncated)';

          return result || '(command completed with no output)';
        } catch (err) {
          const msg = err.stderr || err.stdout || err.message || 'Unknown error';
          return `Command error: ${msg.slice(0, 2000)}`;
        }
      }

      // --- Git Operations ---
      if (toolName === 'git_commit') {
        try {
          const { execSync } = await import('child_process');
          const gitDir = this.baseDir;

          execSync('git add -A', { cwd: gitDir });

          // Check if there are changes
          try {
            execSync('git diff --cached --quiet', { cwd: gitDir });
            return 'No changes to commit.';
          } catch {
            // There ARE changes - expected
          }

          // Commit (safe from injection using array args)
          execSync(`git commit -m "${input.message.replace(/"/g, '\\"')}"`, { cwd: gitDir });
          const hash = execSync('git rev-parse --short HEAD', { cwd: gitDir }).toString().trim();

          return `✅ Committed locally (${hash}): "${input.message}"\n\n⏳ Waiting for H2Crypto review. Use git_release when ready to push.`;
        } catch (err) {
          return `Git error: ${err.message}`;
        }
      }

      if (toolName === 'git_release') {
        if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPO) {
          return 'Error: Git not configured (missing GITHUB_TOKEN or GITHUB_REPO).';
        }
        try {
          const { execSync } = await import('child_process');
          const gitDir = this.baseDir;

          // Auto-increment version if requested
          let tagVersion = input.version;
          if (tagVersion === 'auto') {
            try {
              const lastTag = execSync('git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0"', { cwd: gitDir }).toString().trim();
              const parts = lastTag.replace('v', '').split('.');
              const patch = parseInt(parts[2] || 0) + 1;
              tagVersion = `v${parts[0] || 0}.${parts[1] || 0}.${patch}`;
            } catch {
              tagVersion = 'v0.1.0';
            }
          }

          // Push and tag
          execSync('git push origin HEAD', { cwd: gitDir });
          execSync(`git tag ${tagVersion}`, { cwd: gitDir });
          execSync(`git push origin ${tagVersion}`, { cwd: gitDir });

          return `✅ Released ${tagVersion}!\n\n🔗 GitHub: https://github.com/${process.env.GITHUB_REPO}/releases/tag/${tagVersion}`;
        } catch (err) {
          return `Git release error: ${err.message}`;
        }
      }

      // --- Memory System ---
      if (toolName === 'read_knowledge') {
        if (!input.filename) {
          if (!fs.existsSync(this.docsDir)) return 'No docs directory found.';
          const files = fs.readdirSync(this.docsDir).filter(f => f.endsWith('.md') || f.endsWith('.txt'));
          return `Available docs files:\n${files.map(f => `- ${f}`).join('\n')}`;
        }
        const full = path.join(this.docsDir, path.basename(input.filename));
        if (!fs.existsSync(full)) {
          return `Error: Docs file not found: ${input.filename}`;
        }
        return fs.readFileSync(full, 'utf-8');
      }

      if (toolName === 'search_memory') {
        const memoryKnowledgeDir = path.join(this.memoryDir, 'knowledge');
        const results = [];
        const files = input.type === 'all'
          ? ['bugs.md', 'patterns.md', 'decisions.md', 'values.md']
          : [`${input.type}.md`];
        const queryLower = input.query.toLowerCase();

        for (const filename of files) {
          const filePath = path.join(memoryKnowledgeDir, filename);
          if (!fs.existsSync(filePath)) continue;

          const content = fs.readFileSync(filePath, 'utf-8');
          const lines = content.split('\n');
          const matches = [];

          for (let i = 0; i < lines.length; i++) {
            if (lines[i].toLowerCase().includes(queryLower)) {
              const start = Math.max(0, i - 2);
              const end = Math.min(lines.length - 1, i + 2);
              matches.push({ line: i + 1, context: lines.slice(start, end + 1).join('\n') });
            }
          }

          if (matches.length > 0) {
            results.push({ file: filename, matches });
          }
        }

        if (results.length === 0) {
          return `No results found for "${input.query}"`;
        }

        return results.map(r => `**${r.file}:**\n${r.matches.map(m => `Line ${m.line}:\n${m.context}`).join('\n---\n')}`).join('\n\n');
      }

      if (toolName === 'remember') {
        const valuesDir = path.dirname(this.valuesPath);
        if (!fs.existsSync(valuesDir)) {
          fs.mkdirSync(valuesDir, { recursive: true });
        }

        const date = new Date().toISOString().split('T')[0];
        const entry = `\n- **[${date}]** ${input.item}`;

        if (fs.existsSync(this.valuesPath)) {
          fs.appendFileSync(this.valuesPath, entry);
        } else {
          fs.writeFileSync(this.valuesPath, `# H2Crypto's Values & Preferences\n\n## Remembered Items\n${entry}`);
        }

        return `✅ Remembered: "${input.item}"`;
      }

      // --- Communication ---
      if (toolName === 'send_telegram') {
        // Guard: Don't send tool results or system messages
        const msg = input.message || '';
        const blockedPatterns = [
          /^(send_telegram|Message sent|Tool result|Error:|✅\s*(send_|Message\s+sent))/i,
          /^[a-z_]+:\s*(Message sent|Error|Success)/i,
          /^\[OK\]/i,
          /^\[Internal\]/i,
        ];
        if (blockedPatterns.some(p => p.test(msg.trim()))) {
          return '[Internal] Blocked: This looks like a tool result, not a user message.';
        }

        try {
          await this.telegram.sendDevlog(msg);
          return '[OK] Telegram 訊息已發送。不需要再發送確認訊息。';
        } catch (err) {
          return `Error sending Telegram: ${err.message}`;
        }
      }

      if (toolName === 'write_journal') {
        const journalDir = path.join(this.memoryDir, 'journal');
        if (!fs.existsSync(journalDir)) {
          fs.mkdirSync(journalDir, { recursive: true });
        }

        const today = new Date().toISOString().split('T')[0];
        const time = new Date().toISOString().split('T')[1].slice(0, 5);
        const journalPath = path.join(journalDir, `${today}.md`);

        const typeEmoji = {
          action: '🔧',
          learning: '💡',
          decision: '📌',
          chat: '💬',
        };
        const emoji = typeEmoji[input.type] || '💬';
        const entry = `\n### ${time} ${emoji} ${input.type || 'chat'}\n${input.entry}\n`;

        if (fs.existsSync(journalPath)) {
          fs.appendFileSync(journalPath, entry);
        } else {
          fs.writeFileSync(journalPath, `# Journal — ${today}\n${entry}`);
        }

        return `✅ Journal entry added to ${today}.md`;
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
   * Random interval for X posting: 2-4 hours in ms
   */
  _randomXInterval() {
    return (2 + Math.random() * 2) * 60 * 60 * 1000; // 2-4 hours
  }

  _randomCommunityInterval() {
    return (2 + Math.random() * 2) * 60 * 60 * 1000; // 2-4 hours
  }

  _randomMoltbookPostInterval() {
    return (2 + Math.random() * 1) * 60 * 60 * 1000; // 2-3 hours
  }

  _randomMoltbookEngageInterval() {
    return (3 + Math.random() * 2) * 60 * 60 * 1000; // 3-5 hours
  }

  _randomMoltbookEcosystemInterval() {
    return (3.5 + Math.random() * 1.5) * 24 * 60 * 60 * 1000; // 3.5-5 days
  }

  /**
   * Autonomous X posting — runs independently on its own 2-4 hour timer.
   * No active window — Memeya serves global users, not just GMT+8.
   */
  async maybePostToX() {
    // Check kill switch — dashboard toggle controls this file
    const flagPath = path.join(this.baseDir, 'agent', '.memeya-x-enabled');
    if (!fs.existsSync(flagPath)) return; // Autonomous X posting disabled

    const now = Date.now();
    if (now - this.lastXPost < this.xPostInterval) return; // Not time yet

    this.lastXPost = now;
    this.xPostInterval = this._randomXInterval(); // Randomize next interval

    console.log('[ChatMode] maybePostToX: attempting autonomous X post...');

    try {
      const { autoPost } = await import('./skills/x_twitter/index.js');
      const result = await autoPost({
        baseDir: this.baseDir,
        grokApiKey: this.grokApiKey,
      });

      if (result.success) {
        console.log(`[ChatMode] X post success: ${result.topic} → ${result.url}`);
        try {
          await this.telegram.sendDevlog(
            `🐦 <b>Memeya posted to X!</b>\n` +
            `Topic: <code>${result.topic}</code>\n` +
            `${result.text}\n` +
            `<a href="${result.url}">View tweet</a>`
          );
        } catch (e) {
          console.error('[ChatMode] Telegram notification failed:', e.message);
        }
        // Share to TG community group
        if (this.tgCommunity) {
          try {
            await this.tgCommunity.shareXPost(result.text, result.url);
          } catch (e) {
            console.error('[ChatMode] TG community share failed:', e.message);
          }
        }
      } else {
        console.log(`[ChatMode] X post skipped: ${result.reason}`);
        if (result.draft) {
          try {
            await this.telegram.sendDevlog(
              `🐦 <b>X draft (not posted)</b>\n` +
              `Reason: ${result.reason}\n` +
              `Draft: ${result.draft}`
            );
          } catch (e) {
            console.error('[ChatMode] Telegram notification failed:', e.message);
          }
        }
      }
    } catch (err) {
      console.error('[ChatMode] maybePostToX error:', err.message);
    }
  }

  /**
   * Community engagement — reply to meaningful comments in AiMemeForge X community.
   * Runs on its own 2-4 hour timer. Up to 3 replies per run.
   */
  async maybeCommunityEngage() {
    // Same kill switch as X posting
    const flagPath = path.join(this.baseDir, 'agent', '.memeya-x-enabled');
    if (!fs.existsSync(flagPath)) return;

    const now = Date.now();
    if (now - this.lastCommunityEngage < this.communityEngageInterval) return;

    this.lastCommunityEngage = now;
    this.communityEngageInterval = this._randomCommunityInterval();

    console.log('[ChatMode] maybeCommunityEngage: checking community...');

    try {
      const { communityEngage } = await import('./skills/x_twitter/index.js');
      const result = await communityEngage({
        baseDir: this.baseDir,
        grokApiKey: this.grokApiKey,
      });

      if (result.replies && result.replies.length > 0) {
        const replyList = result.replies.map(r => `  @${r.replyTo}: ${r.text}`).join('\n');
        console.log(`[ChatMode] Community engage: ${result.replies.length} replies posted`);
        try {
          await this.telegram.sendDevlog(
            `🏛️ <b>Memeya community engagement</b>\n` +
            `Replied to ${result.replies.length} comment(s):\n` +
            result.replies.map(r =>
              `• <a href="${r.url}">@${r.replyTo}</a>: ${r.text.slice(0, 100)}`
            ).join('\n')
          );
        } catch (e) {
          console.error('[ChatMode] Telegram notification failed:', e.message);
        }
      } else {
        console.log(`[ChatMode] Community engage: ${result.reason || 'no replies needed'}`);
      }
    } catch (err) {
      console.error('[ChatMode] maybeCommunityEngage error:', err.message);
    }
  }

  /**
   * Owner mention handler — check for @mentions from trusted accounts every 15 minutes.
   * Auto-replies in character and extracts TODOs from task-like mentions.
   */
  async maybeCheckOwnerMentions() {
    // Same kill switch as X posting
    const flagPath = path.join(this.baseDir, 'agent', '.memeya-x-enabled');
    if (!fs.existsSync(flagPath)) return;

    const now = Date.now();
    if (now - this.lastOwnerMentionCheck < this.ownerMentionInterval) return;

    this.lastOwnerMentionCheck = now;

    console.log('[ChatMode] maybeCheckOwnerMentions: checking for owner mentions...');

    try {
      const { ownerMentionHandler } = await import('./skills/x_twitter/index.js');
      const result = await ownerMentionHandler({
        baseDir: this.baseDir,
        grokApiKey: this.grokApiKey,
      });

      if (result.processed && result.processed.length > 0) {
        console.log(`[ChatMode] Owner mentions: ${result.processed.length} processed`);
        try {
          const lines = result.processed.map(r => {
            let line = `\u2022 <a href="${r.replyUrl}">@${r.author}</a>: ${r.replyText.slice(0, 100)}`;
            if (r.todo) line += `\n  \ud83d\udcdd TODO: ${r.todo}`;
            return line;
          });
          await this.telegram.sendDevlog(
            `\ud83d\udc41 <b>Owner mention reply</b>\n` +
            lines.join('\n')
          );
        } catch (e) {
          console.error('[ChatMode] Telegram notification failed:', e.message);
        }
      } else {
        console.log(`[ChatMode] Owner mentions: ${result.reason || 'none found'}`);
      }
    } catch (err) {
      console.error('[ChatMode] maybeCheckOwnerMentions error:', err.message);
    }
  }

  /**
   * Check if it's biweekly distillation time: every other Sunday at 9:00 AM GMT+8.
   */
  _isDistillTime() {
    const now = new Date();
    const hk = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong' }));
    if (hk.getDay() !== 0) return false; // Sunday only
    if (hk.getHours() < 9 || hk.getHours() > 10) return false; // 9-10am window (catches 60min heartbeat)
    // Biweekly: count weeks since a fixed epoch (Jan 5 2026, a known Sunday)
    const epoch = new Date(2026, 0, 5);
    const weeksSinceEpoch = Math.floor((hk - epoch) / (7 * 86400000));
    return weeksSinceEpoch % 2 === 0;
  }

  /**
   * Biweekly memory distillation — distill 14 days of journals into long-term memory.
   */
  async maybeDistillMemory() {
    if (!this._isDistillTime()) return;

    // Only run once per distill day
    const today = new Date().toISOString().slice(0, 10);
    if (this.lastDistillDate === today) return;
    this.lastDistillDate = today;

    console.log('[ChatMode] maybeDistillMemory: starting biweekly distillation...');

    try {
      const { distillMemory } = await import('./skills/x_twitter/index.js');
      const result = await distillMemory({
        baseDir: this.baseDir,
        grokApiKey: this.grokApiKey,
      });

      if (result.success) {
        let msg = `🧠 <b>Memory Distillation Complete</b>\n` +
          `Extracted ${result.items || 0} long-term items from 14 days of journals.`;

        if (result.coreProposals && result.coreProposals.length > 0) {
          msg += `\n\n⚡ <b>Core Value Proposals (needs your approval):</b>\n` +
            result.coreProposals.map(p => `• ${p}`).join('\n');
        }

        console.log(`[ChatMode] Memory distillation: ${result.items} items`);
        try { await this.telegram.sendDevlog(msg); } catch {}
      } else {
        console.log(`[ChatMode] Memory distillation skipped: ${result.reason}`);
      }
    } catch (err) {
      console.error('[ChatMode] maybeDistillMemory error:', err.message);
    }
  }

  /**
   * Autonomous Moltbook posting — posts ONE meme per heartbeat cycle.
   * Uses a 35-min cooldown (Moltbook's 30-min post rate limit + buffer).
   * Only starts after 8 AM GMT+8 (after daily meme generation).
   * First-ever run triggers setup + introduction post.
   *
   * With 60-min heartbeats, this posts ~1 meme/hour → 3 memes done in 3 heartbeats.
   */
  async maybePostToMoltbook() {
    if (!process.env.MOLTBOOK_API_KEY) return;

    // Only start posting after 8:30 AM GMT+8 (memes generated at 8 AM, allow 30 min buffer)
    const now8 = new Date(Date.now() + 8 * 3600_000);
    const hour = now8.getUTCHours();
    const minute = now8.getUTCMinutes();
    if (hour < 8 || (hour === 8 && minute < 30)) return;

    // Skip if all memes already posted today
    const today = new Date().toISOString().slice(0, 10);
    if (this.moltbookPostDoneDate === today) return;

    // Rate limit: space posts 2-3 hours apart to avoid spam flags
    const now = Date.now();
    if (this.lastMoltbookPost && (now - this.lastMoltbookPost < this.moltbookPostInterval)) return;

    console.log('[ChatMode] maybePostToMoltbook: checking for memes to post...');

    try {
      const { ensureSetup, postIntroduction, autoPostMemes } = await import('./skills/moltbook/index.js');
      const deps = {
        baseDir: this.baseDir,
        moltbookApiKey: process.env.MOLTBOOK_API_KEY,
        grokApiKey: this.grokApiKey,
      };

      // First-ever run: verify profile, create submolt, subscribe
      if (!this.moltbookSetupDone) {
        const setupResult = await ensureSetup(deps);
        if (setupResult.success) {
          this.moltbookSetupDone = true;
          console.log('[ChatMode] Moltbook setup complete');
        } else {
          console.error('[ChatMode] Moltbook setup failed:', setupResult.reason);
          return; // Don't set lastMoltbookPost — allow retry next heartbeat
        }
      }

      // One-time intro post (retried until successful, guarded by state.introPosted)
      if (!this.moltbookIntroDone) {
        const introResult = await postIntroduction(deps);
        if (introResult.success) {
          this.moltbookIntroDone = true;
          if (introResult.reason !== 'already_posted') {
            console.log('[ChatMode] Moltbook introduction posted');
            try {
              await this.telegram.sendDevlog(
                `📘 <b>Moltbook: Introduction posted!</b>\n` +
                `Posted self-intro to m/introductions`
              );
            } catch {}
          }
        }
        // If failed, moltbookIntroDone stays false → retry next heartbeat
      }

      // Post next un-posted meme (1 per call, non-blocking)
      const result = await autoPostMemes(deps);

      if (result.success && result.posted > 0) {
        // Only set cooldown on successful post — randomize next interval
        this.lastMoltbookPost = now;
        this.moltbookPostInterval = this._randomMoltbookPostInterval();
        console.log(`[ChatMode] Moltbook: posted "${result.title}" (${result.posted}/${result.total})`);
        try {
          await this.telegram.sendDevlog(
            `📘 <b>Moltbook meme showcase</b>\n` +
            `Posted "${result.title}" to m/AiMemeForge`
          );
        } catch {}
      } else if (result.reason === 'all_posted_today' || result.reason === 'no_memes_today') {
        // All done for today — skip until tomorrow
        this.moltbookPostDoneDate = today;
      } else {
        console.log(`[ChatMode] Moltbook post skipped: ${result.reason || 'unknown'}`);
        // Don't set lastMoltbookPost on failure — allow retry next heartbeat
      }
    } catch (err) {
      console.error('[ChatMode] maybePostToMoltbook error:', err.message);
      // Don't set lastMoltbookPost — allow retry next heartbeat
    }
  }

  /**
   * Moltbook community engagement — upvote, comment, reply to notifications.
   * Runs every 3-5 hours during active hours (9 AM - 11 PM GMT+8).
   */
  async maybeMoltbookEngage() {
    if (!process.env.MOLTBOOK_API_KEY) return;
    if (!this.isActiveHours()) return;

    const now = Date.now();
    if (now - this.lastMoltbookEngage < this.moltbookEngageInterval) return;

    this.lastMoltbookEngage = now;
    this.moltbookEngageInterval = this._randomMoltbookEngageInterval();

    console.log('[ChatMode] maybeMoltbookEngage: engaging on Moltbook...');

    try {
      const { engage } = await import('./skills/moltbook/index.js');
      const result = await engage({
        baseDir: this.baseDir,
        moltbookApiKey: process.env.MOLTBOOK_API_KEY,
        grokApiKey: this.grokApiKey,
      });

      if (result.success && result.actions) {
        const { upvotes, comments, replies, dms } = result.actions;
        const total = upvotes + comments + replies + dms;
        if (total > 0) {
          console.log(`[ChatMode] Moltbook engage: ${upvotes} upvotes, ${comments} comments, ${replies} replies, ${dms} DMs`);
          try {
            await this.telegram.sendDevlog(
              `📘 <b>Moltbook engagement</b>\n` +
              `${upvotes} upvotes, ${comments} comments, ${replies} replies, ${dms} DMs`
            );
          } catch {}
        } else {
          console.log('[ChatMode] Moltbook engage: nothing to engage with');
        }
      }
    } catch (err) {
      console.error('[ChatMode] maybeMoltbookEngage error:', err.message);
    }
  }

  /**
   * Moltbook ecosystem post to m/general — value-first content (not meme promotion).
   * Runs on its own 3.5-5 day timer, independent from meme posts.
   * Checks 35-min buffer vs last meme post to respect Moltbook's rate limit.
   */
  async maybePostEcosystem() {
    if (!process.env.MOLTBOOK_API_KEY) return;
    if (!this.isActiveHours()) return;

    const now = Date.now();

    // Check ecosystem timer (3.5-5 day interval)
    if (now - this.lastMoltbookEcosystemPost < this.moltbookEcosystemInterval) return;

    // Rate limit safe: 35-min buffer vs last meme post to avoid 1-post-per-30-min limit
    if (this.lastMoltbookPost && (now - this.lastMoltbookPost < 35 * 60 * 1000)) return;

    console.log('[ChatMode] maybePostEcosystem: attempting ecosystem post to m/general...');

    try {
      const { autoPostEcosystem } = await import('./skills/moltbook/index.js');
      const result = await autoPostEcosystem({
        baseDir: this.baseDir,
        moltbookApiKey: process.env.MOLTBOOK_API_KEY,
        grokApiKey: this.grokApiKey,
      });

      if (result.success) {
        this.lastMoltbookEcosystemPost = now;
        this.moltbookEcosystemInterval = this._randomMoltbookEcosystemInterval();
        console.log(`[ChatMode] Moltbook ecosystem: "${result.title}" (topic: ${result.topic})`);
        try {
          await this.telegram.sendDevlog(
            `📘 <b>Moltbook ecosystem post</b>\n` +
            `Topic: <code>${result.topic}</code>\n` +
            `"${result.title}" → m/general` +
            (result.url ? `\n<a href="${result.url}">View post</a>` : '')
          );
        } catch {}
      } else {
        console.log(`[ChatMode] Moltbook ecosystem skipped: ${result.reason || 'unknown'}`);
        // Don't update timer on failure — allow retry next heartbeat
      }
    } catch (err) {
      console.error('[ChatMode] maybePostEcosystem error:', err.message);
    }
  }

  /**
   * TG Community murmur tick — called from heartbeat
   */
  async maybeTgCommunityTick() {
    if (!this.tgCommunity) return;
    try {
      await this.tgCommunity.tick();
    } catch (err) {
      console.error('[ChatMode] TG community tick error:', err.message);
    }
  }

  /**
   * Heartbeat action - reflect, chat, or search news
   */
  async doHeartbeat() {
    // Write timer state for dashboard visibility
    this.writeTimerState();

    // Owner mention check runs on its own 15-min timer
    await this.maybeCheckOwnerMentions();

    // Autonomous X posting runs on its own timer, independent of heartbeat logic
    await this.maybePostToX();

    // Community engagement runs on its own timer
    await this.maybeCommunityEngage();

    // Biweekly memory distillation (Sunday 9am GMT+8)
    await this.maybeDistillMemory();

    // Moltbook daily meme posting
    await this.maybePostToMoltbook();

    // Moltbook community engagement
    await this.maybeMoltbookEngage();

    // Moltbook ecosystem posts to m/general (3.5-5 day timer)
    await this.maybePostEcosystem();

    // TG Community murmur check
    await this.maybeTgCommunityTick();

    if (this.sleepToday) {
      console.log('[ChatMode] Sleep mode active, skipping heartbeat');
      return;
    }

    // Check morning news BEFORE active hours gate (8am is outside 9-23 window)
    if (this.isMorningNewsTime()) {
      await this.doMorningNews();
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
   * Write current timer state to disk so the dashboard can display it.
   * Called at the start of every heartbeat tick.
   */
  writeTimerState() {
    try {
      const now = Date.now();
      const fmt = (ms) => {
        if (!ms || ms <= 0) return 'now';
        const m = Math.floor(ms / 60000);
        const h = Math.floor(m / 60);
        if (h > 0) return `${h}h ${m % 60}m`;
        return `${m}m`;
      };

      const xEnabled = fs.existsSync(path.join(this.baseDir, 'agent', '.memeya-x-enabled'));
      const today = new Date().toISOString().slice(0, 10);

      const state = {
        updatedAt: new Date().toISOString(),
        activeHours: this.isActiveHours(),
        sleepToday: this.sleepToday,
        gmtPlus8Hour: this.getGMT8Hour(),
        timers: {
          ownerMention: {
            label: 'Owner Mention Check',
            interval: '15m',
            intervalMs: this.ownerMentionInterval,
            lastFired: this.lastOwnerMentionCheck || null,
            nextIn: fmt(this.ownerMentionInterval - (now - (this.lastOwnerMentionCheck || 0))),
            enabled: true,
            scope: '24/7',
          },
          xPost: {
            label: 'X Post',
            interval: fmt(this.xPostInterval),
            intervalMs: this.xPostInterval,
            lastFired: this.lastXPost || null,
            nextIn: fmt(this.xPostInterval - (now - (this.lastXPost || 0))),
            enabled: xEnabled,
            scope: '24/7',
          },
          communityEngage: {
            label: 'X Community Engage',
            interval: fmt(this.communityEngageInterval),
            intervalMs: this.communityEngageInterval,
            lastFired: this.lastCommunityEngage || null,
            nextIn: fmt(this.communityEngageInterval - (now - (this.lastCommunityEngage || 0))),
            enabled: xEnabled,
            scope: '24/7',
          },
          moltbookPost: {
            label: 'Moltbook Post',
            interval: fmt(this.moltbookPostInterval),
            intervalMs: this.moltbookPostInterval,
            lastFired: this.lastMoltbookPost || null,
            nextIn: this.moltbookPostDoneDate === today
              ? 'done today'
              : (this.lastMoltbookPost ? fmt(this.moltbookPostInterval - (now - this.lastMoltbookPost)) : 'ready'),
            enabled: !!process.env.MOLTBOOK_API_KEY,
            scope: 'after 8:30am GMT+8',
            setupDone: this.moltbookSetupDone,
            introDone: this.moltbookIntroDone,
            doneDate: this.moltbookPostDoneDate,
          },
          moltbookEngage: {
            label: 'Moltbook Engage',
            interval: fmt(this.moltbookEngageInterval),
            intervalMs: this.moltbookEngageInterval,
            lastFired: this.lastMoltbookEngage || null,
            nextIn: fmt(this.moltbookEngageInterval - (now - (this.lastMoltbookEngage || 0))),
            enabled: !!process.env.MOLTBOOK_API_KEY,
            scope: '9-23 GMT+8',
          },
          moltbookEcosystem: {
            label: 'Moltbook Ecosystem',
            interval: fmt(this.moltbookEcosystemInterval),
            intervalMs: this.moltbookEcosystemInterval,
            lastFired: this.lastMoltbookEcosystemPost || null,
            nextIn: fmt(this.moltbookEcosystemInterval - (now - (this.lastMoltbookEcosystemPost || 0))),
            enabled: !!process.env.MOLTBOOK_API_KEY,
            scope: '9-23 GMT+8 (every 3.5-5 days)',
          },
          morningNews: {
            label: 'Morning News',
            interval: 'daily 8am GMT+8',
            lastFired: this.lastMorningNews || null,
            nextIn: this.getGMT8Hour() >= 9 ? 'tomorrow 8am' : (this.getGMT8Hour() < 8 ? 'today 8am' : 'now'),
            enabled: true,
            scope: '8am GMT+8',
          },
          distillMemory: {
            label: 'Memory Distill',
            interval: 'biweekly Sun 9am',
            lastFired: this.lastDistillDate || null,
            nextIn: this.lastDistillDate === today ? 'done today' : 'next Sunday 9am',
            enabled: true,
            scope: 'Sun 9am GMT+8',
          },
          heartbeatAction: {
            label: 'Reflect/News',
            interval: '60m',
            intervalMs: this.heartbeatInterval,
            lastFired: this.lastHeartbeat || null,
            nextIn: fmt(this.heartbeatInterval - (now - (this.lastHeartbeat || 0))),
            enabled: !this.sleepToday,
            scope: '9-23 GMT+8',
          },
        },
      };

      const statePath = path.join(this.baseDir, 'agent', '.timer-state.json');
      fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
    } catch (err) {
      // Non-critical — don't let timer state writing break the heartbeat
      console.warn('[ChatMode] Failed to write timer state:', err.message);
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
   * Search latest news (cooldown: 4 hours between searches)
   */
  async doNewsSearch() {
    // Skip if news was sent within the last 4 hours
    const FOUR_HOURS = 4 * 60 * 60 * 1000;
    if (this.lastNewsSentAt && Date.now() - this.lastNewsSentAt < FOUR_HOURS) {
      console.log('[ChatMode] News cooldown active, skipping (last sent ' +
        Math.round((Date.now() - this.lastNewsSentAt) / 60000) + 'm ago)');
      return null;
    }

    console.log('[ChatMode] Searching latest news...');

    const today = new Date().toISOString().split('T')[0];

    try {
      const prompt = `現在是 ${today}。請搜尋「過去 4 小時內」Web3/Crypto/AI Agent 領域的最新新聞，找出 1-2 則最有趣的、有 meme 潛力的。

重要：只要最近 4 小時內的新聞，不要更早的！

用中文簡短分享，包含日期和來源。如果過去 4 小時確實沒有重大新聞，請說「過去 4 小時暫無重大新聞」。`;
      // Use search-enabled Grok for real-time news
      const news = await this.callGrokWithSearch(prompt, 400);

      // Handle empty or invalid response
      if (!news || news.trim() === '' || news === '{}' || news === '[]') {
        console.log('[ChatMode] News search returned empty, skipping TG message');
        return null;
      }

      // If Grok says no news, don't send to TG
      if (news.includes('暫無重大新聞') || news.includes('沒有重大新聞')) {
        console.log('[ChatMode] No significant news found, skipping TG message');
        return null;
      }

      await this.telegram.sendDevlog(`📰 <b>剛看到的新聞</b>\n\n${news}`);
      this.lastNewsSentAt = Date.now();

      // Save to memory
      this.saveToJournal('news', news);

      return news;
    } catch (err) {
      console.error('[ChatMode] News search error:', err.message);
      return null;
    }
  }

  /**
   * v4: Check if there's an active Work-in-Progress (pending or in_progress)
   */
  hasActiveWIP() {
    if (!fs.existsSync(this.wipPath)) return false;
    const content = fs.readFileSync(this.wipPath, 'utf-8');
    return content.includes('## Task:') && !content.includes('Status: completed') && !content.includes('No active task');
  }

  /**
   * v4: Check if task is currently being processed (in_progress status)
   */
  isTaskInProgress() {
    if (!fs.existsSync(this.wipPath)) return false;
    const content = fs.readFileSync(this.wipPath, 'utf-8');
    return content.includes('Status: in_progress');
  }

  /**
   * v4: Get current WIP content with status
   */
  getWIP() {
    if (!fs.existsSync(this.wipPath)) return null;
    const content = fs.readFileSync(this.wipPath, 'utf-8');
    const taskMatch = content.match(/## Task:\s*\n([\s\S]*?)(?=\n##|$)/);
    const statusMatch = content.match(/- Status:\s*(\w+)/);
    return {
      task: taskMatch ? taskMatch[1].trim() : null,
      status: statusMatch ? statusMatch[1] : 'unknown',
      raw: content,
    };
  }

  /**
   * v4: Set Work-in-Progress (replaces pending_tasks concept)
   * Only one task at a time - simpler and more focused
   * BLOCKS if a task is currently in_progress
   */
  async addTask(task) {
    const journalDir = path.dirname(this.wipPath);
    if (!fs.existsSync(journalDir)) {
      fs.mkdirSync(journalDir, { recursive: true });
    }

    // Check if task is currently being processed
    if (this.isTaskInProgress()) {
      const wip = this.getWIP();
      await this.telegram.sendDevlog(
        `🚫 <b>任務正在處理中！</b>\n\n` +
        `<pre>${wip.task?.slice(0, 100) || '(unknown task)'}</pre>\n\n` +
        `<b>請等待 Agent 完成當前任務後再新增。</b>\n` +
        `如需中斷，請先用 <code>#deltask</code> 清除。`
      );
      return false;
    }

    // Check if there's already a pending WIP (not in_progress)
    if (this.hasActiveWIP()) {
      const wip = this.getWIP();
      await this.telegram.sendDevlog(
        `⚠️ <b>已有待處理的任務！</b>\n\n` +
        `<pre>${wip.task?.slice(0, 100) || '(unknown task)'}</pre>\n\n` +
        `請先處理或清除現有任務：\n` +
        `• <code>#deltask</code> - 清除當前任務\n` +
        `• <code>#dotask</code> - 開始處理`
      );
      return false;
    }

    const timestamp = new Date().toISOString();
    const wipContent = `# Work in Progress

> Single active task - tracked for resume capability

## Task:
${task}

## Metadata:
- Created: ${timestamp}
- Last Updated: ${timestamp}
- Status: pending

## Progress:
- [ ] Task started

## Attempts Log:
(記錄嘗試過的方法和結果，避免重複嘗試)

## Files Modified:
(none yet)

## Last Action:
Waiting for #dotask to begin...
`;

    fs.writeFileSync(this.wipPath, wipContent);
    await this.telegram.sendDevlog(
      `✅ <b>任務已設定！</b>\n\n` +
      `<pre>${task.slice(0, 150)}</pre>\n\n` +
      `使用 <code>#dotask</code> 開始處理`
    );
    return true;
  }

  /**
   * v4: Clear/delete the current WIP task
   */
  async deleteTask() {
    if (!fs.existsSync(this.wipPath)) {
      await this.telegram.sendDevlog(`⚠️ 沒有進行中的任務`);
      return false;
    }

    const wip = this.getWIP();
    fs.unlinkSync(this.wipPath);

    await this.telegram.sendDevlog(
      `🗑️ <b>任務已清除</b>\n\n` +
      `<s>${wip.task?.slice(0, 100) || '(unknown task)'}</s>\n\n` +
      `使用 <code>#addtask [任務]</code> 新增任務`
    );
    return true;
  }

  /**
   * v4: Delete tasks - simplified for single WIP
   */
  async deleteTasks(taskNums) {
    // In v4, we only have one task at a time
    // Ignore taskNums and just delete the current WIP
    return this.deleteTask();
  }

  /**
   * v4: List current task (shows WIP status)
   */
  async listTasks() {
    if (!fs.existsSync(this.wipPath)) {
      await this.telegram.sendDevlog(`📋 <b>任務狀態</b>\n\n(目前沒有待辦任務)\n\n使用 <code>#addtask [任務]</code> 新增`);
      return [];
    }

    const content = fs.readFileSync(this.wipPath, 'utf-8');

    // Parse WIP content
    const taskMatch = content.match(/## Task:\s*\n([\s\S]*?)(?=\n##|$)/);
    const statusMatch = content.match(/- Status: (\w+)/);
    const lastActionMatch = content.match(/## Last Action:\s*\n([\s\S]*?)(?=\n##|$)/);

    const task = taskMatch ? taskMatch[1].trim() : '(unknown)';
    const status = statusMatch ? statusMatch[1] : 'pending';
    const lastAction = lastActionMatch ? lastActionMatch[1].trim() : '(none)';

    const statusEmoji = status === 'completed' ? '✅' : status === 'in_progress' ? '🔄' : '⬜';

    await this.telegram.sendDevlog(
      `📋 <b>任務狀態</b>\n\n` +
      `${statusEmoji} <b>${task.slice(0, 100)}</b>\n\n` +
      `📊 狀態: ${status}\n` +
      `⏱️ 最後動作: ${lastAction.slice(0, 50)}\n\n` +
      `• <code>#dotask</code> - 處理任務\n` +
      `• <code>#deltask</code> - 清除任務`
    );

    return [{ task, status, lastAction }];
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
    return this.sanitizeString(content.slice(0, 2000)); // v4.4: sanitize
  }

  /**
   * Load current task
   */
  loadCurrentTask() {
    const taskPath = path.join(this.memoryDir, 'journal', 'current_task.md');
    if (!fs.existsSync(taskPath)) {
      return '(沒有進行中的任務)';
    }
    return this.sanitizeString(fs.readFileSync(taskPath, 'utf-8')); // v4.4: sanitize
  }

  /**
   * Load recent journal entries
   * - Today: last 2000 chars
   * - Yesterday: only decision/learning entries (精華)
   */
  loadRecentJournal() {
    const journalDir = path.join(this.memoryDir, 'journal');
    if (!fs.existsSync(journalDir)) {
      return '(沒有最近的日誌)';
    }

    let result = '';

    // 1. Load yesterday's decision/learning entries only
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const yesterdayPath = path.join(journalDir, `${yesterday}.md`);
    if (fs.existsSync(yesterdayPath)) {
      const yesterdayContent = fs.readFileSync(yesterdayPath, 'utf-8');
      // Extract only decision (📌) and learning (💡) entries
      const importantEntries = yesterdayContent
        .split(/(?=### \d{2}:\d{2})/)  // Split by time headers
        .filter(entry => entry.includes('📌 decision') || entry.includes('💡 learning'))
        .join('\n');

      if (importantEntries.trim()) {
        result += `## 昨日重點 (${yesterday})\n${importantEntries.slice(-1000)}\n\n`;
      }
    }

    // 2. Load today's journal (last 2000 chars)
    const today = new Date().toISOString().split('T')[0];
    const todayPath = path.join(journalDir, `${today}.md`);
    if (fs.existsSync(todayPath)) {
      const todayContent = fs.readFileSync(todayPath, 'utf-8');
      result += todayContent.slice(-2000);
    } else if (!result) {
      return '(沒有最近的日誌)';
    }

    return this.sanitizeString(result); // v4.4: sanitize
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
