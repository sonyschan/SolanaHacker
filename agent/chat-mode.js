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
    this.reviewer = deps.reviewer; // UXReviewer for browse_url
    this.devServerPort = deps.devServerPort || 5173;
    this.docsDir = deps.docsDir || path.join(this.baseDir, 'docs');
    console.log(`[ChatMode] Initialized with baseDir: ${this.baseDir}`);
    this.valuesPath = path.join(this.memoryDir, 'knowledge', 'values.md');
    this.wipPath = path.join(this.memoryDir, 'journal', 'work_in_progress.md');
    this.contextPath = path.join(this.memoryDir, 'journal', 'chat_context.md');

    this.sleepToday = false;
    this.lastHeartbeat = 0;
    this.heartbeatInterval = 60 * 60 * 1000; // 60 minutes

    // v3: Chat history for multi-turn conversations
    this.chatHistory = [];
    this.maxChatHistory = 50; // Keep last 50 messages (sliding window)

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
        .filter(block => block.type === 'text' || typeof block === 'string')
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

### Git 操作
- **git_commit**：Commit 變更（不 push），等 H2Crypto review
- **git_release**：Push + 建立 tag，版本可用 "auto" 自動遞增

### 記憶系統
- **read_knowledge**：讀取參考文件（docs/*.md）
- **search_memory**：搜尋記憶（bugs, patterns, decisions, values）
- **remember**：記住 H2Crypto 說的重要事項

### 通訊與日誌
- **send_telegram**：主動發送訊息給 H2Crypto（進度更新、提問）
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
          const result = await this.executeChatTool(toolUse.name, toolUse.input);
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

      // v4.1: Skip final message if already sent via send_telegram tool
      if (!sentViaTelegram) {
        await this.telegram.sendDevlog(`💬 ${answer}`);
      } else {
        console.log('[ChatMode] Skipping final message (already sent via send_telegram)');
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
   * Normalize command paths - fix cd commands that use wrong relative paths
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

    if (fixed !== command) {
      console.log(`[ChatMode] Command path fix: "${command}" -> "${fixed}"`);
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
        const content = fs.readFileSync(filePath, 'utf-8');
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

          // Analyze with Claude Vision
          const imageBuffer = fs.readFileSync(screenshotPath);
          const base64Image = imageBuffer.toString('base64');

          const visionResponse = await this.claudeClient.messages.create({
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

      // --- Shell ---
      if (toolName === 'run_command') {
        // Dangerous command blocklist (same as Dev Mode)
        const DANGEROUS_CMD = /rm\s+-rf\s+\/|mkfs|dd\s+if=|shutdown|reboot|:()\s*\{|wget.*\|\s*sh|curl.*\|\s*sh|pkill\s+(-f\s+)?node|killall\s+node|pkill\s+(-f\s+)?agent|kill\s+-9\s+\$\$|kill\s+-9\s+\$PPID/i;

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

      // Handle empty or invalid response
      if (!news || news.trim() === '' || news === '{}' || news === '[]') {
        await this.telegram.sendDevlog(`📰 <b>剛看到的新聞</b>\n\n最近 1 小時暫無重大新聞，稍後再看看！`);
        return null;
      }

      await this.telegram.sendDevlog(`📰 <b>剛看到的新聞</b>\n\n${news}`);

      // Save to memory
      this.saveToJournal('news', news);

      return news;
    } catch (err) {
      console.error('[ChatMode] News search error:', err.message);
      await this.telegram.sendDevlog(`📰 <b>新聞搜尋</b>\n\n搜尋時發生錯誤，稍後再試。`);
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

    return result;
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
