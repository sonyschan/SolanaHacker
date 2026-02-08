/**
 * Telegram Bridge
 * Bi-directional communication with human operator
 * Supports: #must, #idea, #set_config, #reset_agent, #approve, /status, /stop
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

export class TelegramBridge {
  constructor(token, chatId, configPath = '/home/projects/solanahacker/docs/config.json') {
    this.bot = new TelegramBot(token, { polling: true });
    this.chatId = chatId;
    this.configPath = configPath;
    this.feedbackQueue = [];
    this.mustQueue = [];
    this.approvalPending = false;
    this.approvalResult = null; // { approved: boolean, reason?: string }

    this.setupListeners();
  }

  setupListeners() {
    this.bot.on('message', (msg) => {
      if (msg.chat.id.toString() !== this.chatId.toString()) {
        console.log(`[TG] Ignoring message from unknown chat: ${msg.chat.id}`);
        return;
      }

      const text = msg.text || '';

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

      // === #reset_agent — Reset to Chat Mode ===
      if (text.startsWith('#reset_agent')) {
        this.mustQueue.push({
          type: 'reset',
          timestamp: Date.now(),
        });
        this.bot.sendMessage(this.chatId, '🔄 收到重置指令，重置到 Chat Mode...');
        console.log('[TG] Reset agent command received');
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

      // === #deltask [number] — Delete a task by number ===
      if (text.startsWith('#deltask')) {
        const taskNum = parseInt(text.replace('#deltask', '').trim());
        if (isNaN(taskNum) || taskNum < 1) {
          this.bot.sendMessage(this.chatId, '⚠️ 請提供任務編號，例如: <code>#deltask 2</code>', { parse_mode: 'HTML' });
          return;
        }
        this.mustQueue.push({
          type: 'delete_task',
          command: taskNum,
          timestamp: Date.now(),
        });
        console.log(`[TG] Delete task requested: #${taskNum}`);
        return;
      }

      // === #dotask — Process pending tasks immediately ===
      if (text === '#dotask') {
        this.mustQueue.push({
          type: 'process_tasks',
          timestamp: Date.now(),
        });
        this.bot.sendMessage(this.chatId, '🚀 收到！正在處理待辦任務...');
        console.log('[TG] Process tasks now requested');
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
      if (text.startsWith('#chat')) {
        const message = text.replace('#chat', '').trim();
        this.mustQueue.push({
          type: 'chat',
          command: message,
          timestamp: Date.now(),
          messageId: msg.message_id,
        });
        this.bot.sendMessage(this.chatId, `💬 已送出，Agent 將會回應`);
        console.log(`[TG] Chat received: ${message}`);
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

      // === /stop ===
      if (text === '/stop') {
        this.mustQueue.push({ type: 'stop', timestamp: Date.now() });
        this.bot.sendMessage(this.chatId, '⏹️ 收到停止指令...');
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
   * Send a devlog update with optional screenshot (with secret masking)
   */
  async sendDevlog(message, screenshotPath = null) {
    const safeMessage = maskSecrets(message);
    try {
      if (screenshotPath && fs.existsSync(screenshotPath)) {
        await this.bot.sendPhoto(this.chatId, screenshotPath, {
          caption: safeMessage,
          parse_mode: 'HTML',
        });
      } else {
        await this.bot.sendMessage(this.chatId, safeMessage, {
          parse_mode: 'HTML',
        });
      }
      console.log('[TG] Devlog sent successfully');
    } catch (error) {
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
