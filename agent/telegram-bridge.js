/**
 * Telegram Bridge
 * Bi-directional communication with human operator
 * Supports: #must, #idea, #set_config, #clear_message, #reload_prompt, #approve, /status, /restart
 */

import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs';
import path from 'path';

// Patterns that look like API keys / secrets
const SECRET_PATTERNS = [
  /sk-ant-[a-zA-Z0-9_-]{20,}/g,       // Anthropic
  /xai-[a-zA-Z0-9_-]{20,}/g,          // X.AI / Grok
  /\b[0-9]+:[A-Za-z0-9_-]{30,}\b/g,   // Telegram bot tokens
  /ghp_[A-Za-z0-9_]{36,}/g,           // GitHub PAT (classic)
  /github_pat_[A-Za-z0-9_]{20,}/g,    // GitHub PAT (fine-grained)
  /ghs_[A-Za-z0-9_]{36,}/g,           // GitHub App installation token
  /x-access-token:[^\s@]+/g,          // Token in git remote URLs
  /0x[a-fA-F0-9]{64}/g,               // Private keys (hex)
  /\b(AKIA|ASIA)[A-Z0-9]{16}\b/g,     // AWS access keys
];

/**
 * Mask any potential secrets in a string
 */
function maskSecrets(text) {
  if (!text) return text;
  let masked = String(text);
  for (const pattern of SECRET_PATTERNS) {
    masked = masked.replace(pattern, (match) => {
      if (match.length <= 8) return '********';
      return match.slice(0, 4) + '****' + match.slice(-4);
    });
  }
  return masked;
}

/**
 * Sanitize HTML for Telegram (only allow supported tags)
 * Telegram supports: b, strong, i, em, u, s, strike, del, code, pre, a
 */
function sanitizeHtmlForTelegram(text) {
  if (!text) return text;
  let sanitized = String(text);

  // List of allowed Telegram HTML tags
  const allowedTags = ['b', 'strong', 'i', 'em', 'u', 's', 'strike', 'del', 'code', 'pre', 'a'];
  const allowedPattern = allowedTags.join('|');

  // Find all HTML-like tags
  const tagPattern = /<\/?([a-zA-Z_][a-zA-Z0-9_-]*)[^>]*>/g;

  sanitized = sanitized.replace(tagPattern, (match, tagName) => {
    const tag = tagName.toLowerCase();
    // Keep allowed tags, escape others
    if (allowedTags.includes(tag)) {
      return match;
    }
    // Escape the < and > to prevent parse errors
    return match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  });

  return sanitized;
}

export class TelegramBridge {
  constructor(token, chatId, configPath = '/home/projects/solanahacker/docs/config.json') {
    this.bot = new TelegramBot(token, { polling: true });
    this.chatId = chatId;
    this.configPath = configPath;
    this.feedbackQueue = [];
    this.mustQueue = [];
    this.approvalPending = false;
    this.approvalResult = null; // { approved: boolean, reason?: string }
    this.screenshotDir = '/home/projects/solanahacker/screenshots';

    this.setupListeners();
  }

  /**
   * Download photo from Telegram message
   * Returns the local file path or null if failed
   */
  async downloadPhoto(msg) {
    try {
      if (!msg.photo || msg.photo.length === 0) return null;

      // Get the largest photo (last in array)
      const photo = msg.photo[msg.photo.length - 1];
      const fileId = photo.file_id;

      // Get file link from Telegram
      const fileLink = await this.bot.getFileLink(fileId);

      // Download the file
      const response = await fetch(fileLink);
      if (!response.ok) throw new Error(`Failed to download: ${response.status}`);

      const buffer = Buffer.from(await response.arrayBuffer());

      // Save to screenshots folder
      const filename = `tg-${Date.now()}.jpg`;
      const filepath = path.join(this.screenshotDir, filename);

      if (!fs.existsSync(this.screenshotDir)) {
        fs.mkdirSync(this.screenshotDir, { recursive: true });
      }

      fs.writeFileSync(filepath, buffer);
      console.log(`[TG] Photo downloaded: ${filepath}`);
      return filepath;
    } catch (err) {
      console.error('[TG] Failed to download photo:', err.message);
      return null;
    }
  }

  setupListeners() {
    this.bot.on('message', async (msg) => {
      if (msg.chat.id.toString() !== this.chatId.toString()) {
        console.log(`[TG] Ignoring message from unknown chat: ${msg.chat.id}`);
        return;
      }

      const text = msg.text || msg.caption || '';  // Also check caption for photos

      // === #approve — Human approval for submission ===
      if (text.startsWith('#approve')) {
        if (this.approvalPending) {
          this.approvalResult = { approved: true };
          this.approvalPending = false;
        }

        // ALWAYS push approval to mustQueue so Agent can proceed
        // Even if no formal approval pending, H2Crypto's approval should be honored
        this.mustQueue.push({
          type: 'approval',
          command: 'approved',
          timestamp: Date.now(),
        });
        this.bot.sendMessage(this.chatId, '✅ 已批准！Agent 將收到通知並繼續下一階段。');
        console.log('[TG] Approval received');
        return;
      }

      // === #reject — Reject submission, go back to iterate ===
      if (text.startsWith('#reject')) {
        const reason = text.replace('#reject', '').trim() || '需要更多改進';

        if (this.approvalPending) {
          this.approvalResult = { approved: false, reason };
          this.approvalPending = false;
        }

        // ALWAYS push to mustQueue so Agent receives the rejection feedback
        // Even if no formal approval pending, H2Crypto's rejection should wake up Agent
        this.mustQueue.push({
          type: 'rejection',
          command: reason,
          timestamp: Date.now(),
        });
        this.bot.sendMessage(this.chatId, `🔄 已拒絕，Agent 將收到反饋並繼續迭代。原因: ${reason}`);
        console.log(`[TG] Rejection received: ${reason}`);
        return;
      }

      // === #set_config [key] [value] — Inject non-sensitive config ===
      if (text.startsWith('#set_config')) {
        const parts = text.replace('#set_config', '').trim().split(/\s+/);
        const key = parts[0];
        const value = parts.slice(1).join(' ');

        if (!key || !value) {
          this.bot.sendMessage(this.chatId, '⚠️ 格式: <code>#set_config key value</code>', { parse_mode: 'HTML' });
          return;
        }

        // Block sensitive keys
        const blockedKeys = ['ANTHROPIC_API_KEY', 'XAI_API_KEY', 'PRIVATE_KEY', 'TELEGRAM_BOT_TOKEN', 'API_SECRET'];
        if (blockedKeys.some(k => key.toUpperCase().includes(k))) {
          this.bot.sendMessage(this.chatId, '🚫 禁止透過 TG 設定敏感金鑰！請直接在主機 .env 中設定。');
          console.log(`[TG] Blocked sensitive config attempt: ${key}`);
          return;
        }

        this._writeConfig(key, value);
        this.bot.sendMessage(this.chatId, `✅ 已設定 <code>${key}</code> = <code>${value}</code>`, { parse_mode: 'HTML' });
        console.log(`[TG] Config set: ${key} = ${value}`);
        return;
      }

      // === #clear_message — Clear conversation history ===
      if (text.startsWith('#clear_message')) {
        this.mustQueue.push({
          type: 'clear_message',
          timestamp: Date.now(),
        });
        this.bot.sendMessage(this.chatId, '🧹 收到清除指令，清空對話記憶...');
        console.log('[TG] Clear message command received');
        return;
      }

      // === #reload_prompt — Reload system prompt (AGENTS.md, docs/) ===
      if (text.startsWith('#reload_prompt')) {
        this.mustQueue.push({
          type: 'reload_prompt',
          timestamp: Date.now(),
        });
        this.bot.sendMessage(this.chatId, '🔄 收到重載指令，重新載入 System Prompt...');
        console.log('[TG] Reload prompt command received');
        return;
      }

      // === #yes / #no — Quick responses for prompts ===
      if (text === '#yes' || text === '#no') {
        const response = text.replace('#', '');
        this.mustQueue.push({
          type: 'must',
          command: response,
          timestamp: Date.now(),
          messageId: msg.message_id,
        });
        console.log(`[TG] Quick response: ${response}`);
        return;
      }

      // NOTE: #chatmode and #devmode removed in v3
      // TG is always Chat Mode; Dev work triggered by #dotask only

      // === #addtask [task] — Add task to pending list ===
      if (text.startsWith('#addtask')) {
        const task = text.replace('#addtask', '').trim();
        if (!task) {
          this.bot.sendMessage(this.chatId, '⚠️ 請提供任務內容，例如: <code>#addtask 優化首頁載入速度</code>', { parse_mode: 'HTML' });
          return;
        }
        this.mustQueue.push({
          type: 'add_task',
          command: task,
          timestamp: Date.now(),
        });
        this.bot.sendMessage(this.chatId, `📝 已記錄任務: ${task}`);
        console.log(`[TG] Task added: ${task}`);
        return;
      }

      // === #tasklist — List pending tasks ===
      if (text === '#tasklist') {
        this.mustQueue.push({
          type: 'list_tasks',
          timestamp: Date.now(),
        });
        console.log('[TG] Task list requested');
        return;
      }

      // === #deltask [numbers] — Delete tasks by number (supports: #deltask 1,2,3 or #deltask 1 2 3) ===
      if (text.startsWith('#deltask')) {
        const input = text.replace('#deltask', '').trim();
        // Parse numbers separated by comma, space, or both
        const taskNums = input.split(/[,\s]+/).map(n => parseInt(n.trim())).filter(n => !isNaN(n) && n >= 1);

        if (taskNums.length === 0) {
          this.bot.sendMessage(this.chatId, '⚠️ 請提供任務編號，例如:\n<code>#deltask 2</code> 或 <code>#deltask 1,2,3</code>', { parse_mode: 'HTML' });
          return;
        }
        this.mustQueue.push({
          type: 'delete_tasks',
          command: taskNums,
          timestamp: Date.now(),
        });
        console.log(`[TG] Delete tasks requested: #${taskNums.join(', #')}`);
        return;
      }

      // === #dotask — Process WIP task immediately ===
      if (text === '#dotask') {
        this.mustQueue.push({
          type: 'process_tasks',
          timestamp: Date.now(),
        });
        this.bot.sendMessage(this.chatId, '🚀 收到！正在處理任務...');
        console.log('[TG] Process WIP task requested');
        return;
      }

      // === #release [version] — Push local commits and create tag ===
      if (text.startsWith('#release')) {
        const version = text.replace('#release', '').trim() || 'auto';
        this.mustQueue.push({
          type: 'release',
          command: version,
          timestamp: Date.now(),
        });
        this.bot.sendMessage(this.chatId, `🚀 收到！準備 release${version !== 'auto' ? ` (${version})` : ''}...`);
        console.log(`[TG] Release requested: ${version}`);
        return;
      }

      // === #sleep — No proactive actions today ===
      if (text === '#sleep') {
        this.mustQueue.push({
          type: 'sleep_today',
          timestamp: Date.now(),
        });
        this.bot.sendMessage(this.chatId, '😴 收到！今天不再主動做事，只響應你的訊息。明天會自動恢復。');
        console.log('[TG] Sleep mode activated');
        return;
      }

      // === #chat [message] — Natural conversation with Agent ===
      // Agent will determine intent (question, instruction, feedback, etc.)
      // Supports photo attachments with caption starting with #chat
      if (text.startsWith('#chat') || (msg.photo && (msg.caption || '').startsWith('#chat'))) {
        const message = (text || msg.caption || '').replace('#chat', '').trim();

        // Check for photo attachment
        const photoPath = msg.photo ? await this.downloadPhoto(msg) : null;

        this.mustQueue.push({
          type: 'chat',
          command: message,
          imagePath: photoPath,  // Will be null if no photo
          timestamp: Date.now(),
          messageId: msg.message_id,
        });

        const photoNote = photoPath ? ' (含圖片 📷)' : '';
        this.bot.sendMessage(this.chatId, `💬 已送出，Agent 將會回應${photoNote}`);
        console.log(`[TG] Chat received: ${message}${photoPath ? ` [with image: ${photoPath}]` : ''}`);
        return;
      }

      // === #must [command] — Immediate override (legacy, still supported) ===
      if (text.startsWith('#must')) {
        const command = text.replace('#must', '').trim();
        this.mustQueue.push({
          type: 'chat',  // Treat as chat, Agent will understand it's urgent
          command: `[緊急指令] ${command}`,
          timestamp: Date.now(),
          messageId: msg.message_id,
        });
        this.bot.sendMessage(this.chatId, `✅ 收到指令: ${command}`);
        console.log(`[TG] MUST command received: ${command}`);
        return;
      }

      // === #ask [question] — Ask Agent a question (legacy, still supported) ===
      if (text.startsWith('#ask')) {
        const question = text.replace('#ask', '').trim();
        this.mustQueue.push({
          type: 'chat',  // Treat as chat
          command: `[問題] ${question}`,
          timestamp: Date.now(),
          messageId: msg.message_id,
        });
        this.bot.sendMessage(this.chatId, `❓ 問題已送出: ${question}`);
        console.log(`[TG] Question received: ${question}`);
        return;
      }

      // === #idea [suggestion] — Queue for next iteration ===
      if (text.startsWith('#idea')) {
        const idea = text.replace('#idea', '').trim();
        this.feedbackQueue.push({
          type: 'idea',
          content: idea,
          timestamp: Date.now(),
        });
        this.bot.sendMessage(this.chatId, `💡 已記錄建議，下一輪會考慮: ${idea}`);
        console.log(`[TG] Idea recorded: ${idea}`);
        return;
      }

      // === /status ===
      if (text === '/status') {
        this.mustQueue.push({ type: 'status_request', timestamp: Date.now() });
        return;
      }

      // === /restart ===
      if (text === '/restart') {
        this.mustQueue.push({ type: 'restart', timestamp: Date.now() });
        this.bot.sendMessage(this.chatId, '🔄 收到重啟指令，Agent 將在 3 秒後重啟...');
        return;
      }

      // === DEFAULT: Treat any unmatched message as #chat ===
      // This allows natural conversation without needing to prefix with #chat
      if (text && text.trim()) {
        const photoPath = msg.photo ? await this.downloadPhoto(msg) : null;
        this.mustQueue.push({
          type: 'chat',
          command: text.trim(),
          imagePath: photoPath,
          timestamp: Date.now(),
          messageId: msg.message_id,
        });
        this.bot.sendMessage(this.chatId, '💬 已送出，Agent 將會回應');
        console.log(`[TG] Default chat: ${text.slice(0, 50)}...`);
        return;
      }
    });

    this.bot.on('error', (error) => {
      console.error('[TG] Bot error:', error.message);
    });
  }

  /**
   * Write config key/value to docs/config.json
   */
  _writeConfig(key, value) {
    const dir = path.dirname(this.configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let config = {};
    if (fs.existsSync(this.configPath)) {
      config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
    }

    config[key] = value;
    config._updatedAt = new Date().toISOString();
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
  }

  /**
   * Read a config value from docs/config.json
   */
  getConfig(key) {
    if (!fs.existsSync(this.configPath)) return null;
    const config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
    return config[key] || null;
  }

  /**
   * Request human approval — blocks until #approve or #reject
   * @returns {Promise<{approved: boolean, reason?: string}>}
   */
  async requestApproval(message, screenshotPath = null) {
    this.approvalPending = true;
    this.approvalResult = null;

    const fullMessage = `
🔍 <b>人工審查請求</b>

${message}

回覆 <code>#approve</code> 批准提交
回覆 <code>#reject [原因]</code> 退回修改
    `.trim();

    await this.sendDevlog(fullMessage, screenshotPath);

    // Poll for approval/rejection
    while (this.approvalPending) {
      await new Promise(r => setTimeout(r, 3000));
    }

    return this.approvalResult || { approved: false, reason: 'No response received' };
  }

  /**
   * Split long message into chunks for Telegram (max 4096 chars)
   */
  _splitMessage(text, maxLength = 4000) {
    if (text.length <= maxLength) return [text];

    const chunks = [];
    let remaining = text;

    while (remaining.length > 0) {
      if (remaining.length <= maxLength) {
        chunks.push(remaining);
        break;
      }

      // Try to split at newline
      let splitIndex = remaining.lastIndexOf('\n', maxLength);
      if (splitIndex < maxLength * 0.5) {
        // No good newline found, try space
        splitIndex = remaining.lastIndexOf(' ', maxLength);
      }
      if (splitIndex < maxLength * 0.5) {
        // No good split point, force split
        splitIndex = maxLength;
      }

      chunks.push(remaining.slice(0, splitIndex));
      remaining = remaining.slice(splitIndex).trimStart();
    }

    return chunks;
  }

  /**
   * Send a devlog update with optional screenshot (with secret masking + HTML sanitization)
   * Auto-splits messages longer than 4096 chars
   */
  async sendDevlog(message, screenshotPath = null) {
    // Mask secrets and sanitize HTML for Telegram
    const safeMessage = sanitizeHtmlForTelegram(maskSecrets(message));

    // Split into chunks if too long
    const chunks = this._splitMessage(safeMessage);

    try {
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const isFirst = i === 0;
        const partLabel = chunks.length > 1 ? `\n\n📄 (${i + 1}/${chunks.length})` : '';
        const chunkWithLabel = chunk + partLabel;

        if (isFirst && screenshotPath && fs.existsSync(screenshotPath)) {
          await this.bot.sendPhoto(this.chatId, screenshotPath, {
            caption: chunkWithLabel.slice(0, 1024), // Telegram caption limit
            parse_mode: 'HTML',
          });
        } else {
          await this.bot.sendMessage(this.chatId, chunkWithLabel, {
            parse_mode: 'HTML',
          });
        }

        // Small delay between chunks to avoid rate limiting
        if (i < chunks.length - 1) {
          await new Promise(r => setTimeout(r, 300));
        }
      }
      console.log(`[TG] Devlog sent successfully (${chunks.length} part${chunks.length > 1 ? 's' : ''})`);
    } catch (error) {
      // If HTML parsing fails, try without parse_mode
      if (error.message?.includes('parse entities') || error.message?.includes('too long')) {
        console.log('[TG] HTML parse failed or too long, retrying as plain text');
        try {
          const plainMessage = safeMessage.replace(/<[^>]+>/g, ''); // Strip all HTML
          const plainChunks = this._splitMessage(plainMessage);
          for (let i = 0; i < plainChunks.length; i++) {
            const partLabel = plainChunks.length > 1 ? `\n\n(${i + 1}/${plainChunks.length})` : '';
            await this.bot.sendMessage(this.chatId, plainChunks[i] + partLabel);
            if (i < plainChunks.length - 1) await new Promise(r => setTimeout(r, 300));
          }
          console.log(`[TG] Devlog sent as plain text (${plainChunks.length} part${plainChunks.length > 1 ? 's' : ''})`);
          return;
        } catch (retryErr) {
          console.error('[TG] Retry failed:', retryErr.message);
        }
      }
      console.error('[TG] Failed to send devlog:', error.message);
    }
  }

  /**
   * Send progress update
   */
  async sendProgress(phase, confidence, details) {
    const emoji = confidence >= 90 ? '🎉' : confidence >= 70 ? '📈' : confidence >= 50 ? '🔨' : '🌱';
    const message = `
${emoji} <b>${phase}</b>
信心度: ${confidence}%

${details}

<i>回覆 #must [指令] 來覆蓋當前任務</i>
<i>回覆 #idea [建議] 來記錄想法</i>
    `.trim();

    await this.sendDevlog(message);
  }

  /**
   * Send error notification (with secret masking)
   */
  async sendError(error, context = '') {
    const safeError = maskSecrets(error.message || String(error));
    const message = `
🚨 <b>錯誤發生</b>

${context ? `<b>階段:</b> ${context}\n` : ''}
<b>錯誤:</b> <code>${safeError}</code>

我會嘗試自動恢復...
    `.trim();

    await this.bot.sendMessage(this.chatId, message, { parse_mode: 'HTML' });
  }

  /**
   * Send a photo to Telegram
   */
  async sendPhoto(imagePath, caption = '') {
    try {
      if (!fs.existsSync(imagePath)) {
        console.log(`[TG] sendPhoto: File not found: ${imagePath}`);
        return false;
      }
      await this.bot.sendPhoto(this.chatId, imagePath, {
        caption: caption,
        parse_mode: 'HTML',
      });
      console.log(`[TG] Photo sent: ${imagePath}`);
      return true;
    } catch (err) {
      console.error(`[TG] sendPhoto error:`, err.message);
      return false;
    }
  }

  /**
   * Get and clear must commands
   */
  getMustCommands() {
    const commands = [...this.mustQueue];
    this.mustQueue = [];
    return commands;
  }

  /**
   * Peek at must commands WITHOUT clearing them
   * Used by idle mode to check if there's something to wake up for
   */
  peekMustCommands() {
    return [...this.mustQueue];
  }

  /**
   * Get and clear feedback
   */
  getFeedback() {
    const feedback = [...this.feedbackQueue];
    this.feedbackQueue = [];
    return feedback;
  }

  /**
   * Peek at feedback WITHOUT clearing it
   * Used by idle mode to check if there's urgent feedback
   */
  peekFeedback() {
    return [...this.feedbackQueue];
  }

  /**
   * Save feedback to file
   */
  saveFeedbackToFile(feedbackPath) {
    const existing = fs.existsSync(feedbackPath)
      ? JSON.parse(fs.readFileSync(feedbackPath, 'utf-8'))
      : [];

    const allFeedback = [...existing, ...this.feedbackQueue];
    fs.writeFileSync(feedbackPath, JSON.stringify(allFeedback, null, 2));
    this.feedbackQueue = [];
  }

  /**
   * Stop the bot
   */
  stop() {
    this.bot.stopPolling();
  }
}

export { maskSecrets };
