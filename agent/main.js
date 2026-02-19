/**
 * SolanaHacker Agent — Tool-Use Architecture
 * Autonomous Solana developer for Colosseum Hackathon
 *
 * Architecture:
 *   Claude API (tool_use) → Agent decides what to do → We execute tools → Feed results back
 *
 * The agent has complete creative freedom. The orchestrator is a thin loop
 * that executes tools and injects human commands from Telegram.
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import Anthropic from '@anthropic-ai/sdk';

import { TelegramBridge, maskSecrets } from './telegram-bridge.js';
import { GrokWriter } from './grok-writer.js';
import { UXReviewer } from './ux-reviewer.js';
import { ColosseumAPI } from './colosseum-api.js';
import { TOOL_DEFINITIONS, createToolExecutors } from './agent-tools.js';
import { SKILL_REGISTRY, LOAD_SKILL_TOOL, loadSkill, getSkillHints } from './skill-loader.js';
import { ChatMode } from './chat-mode.js';
import { createProvider } from './llm-provider.js';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================
//  Configuration
// ============================================

const CONFIG = {
  baseDir: '/home/projects/solanahacker',
  workDir: '/home/projects/solanahacker/app',
  memoryDir: '/home/projects/solanahacker/memory',
  docsDir: '/home/projects/solanahacker/docs',  // Reference docs (product spec, design guides)
  screenshotsDir: '/home/projects/solanahacker/screenshots',
  logsDir: '/home/projects/solanahacker/logs',
  devServerPort: 5173,
  heartbeatInterval: parseInt(process.env.HEARTBEAT_INTERVAL) || 1800000,
  uxThreshold: parseInt(process.env.UX_CONFIDENCE_THRESHOLD) || 90,
  // Per-mode LLM configuration
  devProvider: process.env.DEVMODE_PROVIDER || 'grok',
  devModel: process.env.DEVMODE_MODEL || 'grok-4-1-fast-reasoning',
  chatProvider: process.env.CHATMODE_PROVIDER || 'grok',
  chatModel: process.env.CHATMODE_MODEL || 'grok-4-1-fast-reasoning',
  // Legacy single model (used as fallback)
  model: 'claude-sonnet-4-20250514',
  maxTokens: 8192,
  maxTurns: 200,
  maxMessages: 50, // prune after this many messages — lower = less rate limiting
  maxRetries: 3,
  baseDelay: 5000,
};

const STATE_FILE = path.join(CONFIG.logsDir, 'agent-state.json');

// ============================================
//  Agent Class
// ============================================

class SolanaHackerAgent {
  constructor() {
    // Raw Anthropic SDK client (kept for vision and as fallback)
    this.anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // Per-mode LLM providers
    this.devProvider = createProvider(CONFIG.devProvider, {
      apiKey: process.env.XAI_API_KEY,
      model: CONFIG.devModel,
      client: this.anthropicClient,
    });
    this.chatProvider = createProvider(CONFIG.chatProvider, {
      apiKey: process.env.XAI_API_KEY,
      model: CONFIG.chatModel,
      client: this.anthropicClient,
    });

    console.log(`[Agent] Dev provider: ${CONFIG.devProvider} (${CONFIG.devModel})`);
    console.log(`[Agent] Chat provider: ${CONFIG.chatProvider} (${CONFIG.chatModel})`);

    // Legacy alias
    this.client = this.anthropicClient;

    // Modules
    this.telegram = new TelegramBridge(
      process.env.TELEGRAM_BOT_TOKEN,
      process.env.TELEGRAM_CHAT_ID
    );

    this.writer = new GrokWriter(process.env.XAI_API_KEY);

    this.reviewer = new UXReviewer(
      process.env.ANTHROPIC_API_KEY,
      CONFIG.screenshotsDir
    );

    this.colosseum = process.env.COLOSSEUM_API_KEY
      ? new ColosseumAPI(process.env.COLOSSEUM_API_KEY)
      : null;

    // Tool executors (core tools only)
    const tools = createToolExecutors({
      baseDir: CONFIG.baseDir,  // For git commands (project root)
      workDir: CONFIG.workDir,
      docsDir: CONFIG.docsDir,
      screenshotsDir: CONFIG.screenshotsDir,
      devServerPort: CONFIG.devServerPort,
      telegram: this.telegram,
      reviewer: this.reviewer,
      colosseum: this.colosseum,
    });
    this.executors = tools.executors;
    this.getDevServer = tools.getDevServer;

    // Skill system: track loaded skills and their tools
    this.loadedSkills = new Set();
    this.skillTools = [];      // Tool definitions from loaded skills
    this.skillExecutors = {};  // Executors from loaded skills

    // Add load_skill executor
    this.executors.load_skill = async ({ skill_name }) => {
      if (this.loadedSkills.has(skill_name)) {
        return `Skill "${skill_name}" is already loaded. Tools available: ${this.getSkillToolNames(skill_name).join(', ')}`;
      }

      const skill = await loadSkill(skill_name, {
        workDir: CONFIG.workDir,
        writer: this.writer,
      });

      if (!skill) {
        return `Error: Unknown skill "${skill_name}". Available: ${SKILL_REGISTRY.map((s) => s.name).join(', ')}`;
      }

      // Register skill tools and executors
      this.loadedSkills.add(skill_name);
      this.skillTools.push(...skill.tools);
      Object.assign(this.skillExecutors, skill.executors);

      const toolNames = skill.tools.map((t) => t.name);
      console.log(`[Agent] Loaded skill: ${skill_name} → tools: ${toolNames.join(', ')}`);

      return `Skill "${skill_name}" loaded successfully!\n\nNew tools available:\n${toolNames.map((t) => `• ${t}`).join('\n')}\n\nYou can now use these tools.`;
    };

    // State
    this.isRunning = false;
    this.startTime = null;
    this.heartbeatTimer = null;
    this.messages = [];
    this.turn = 0;

    // Mode: 'chat' or 'dev' (default to chat on startup)
    this.currentMode = 'chat';
    this.modeSwitchRequested = null; // 'chat' | 'dev' | null

    // Chat Mode instance
    this.chatMode = new ChatMode({
      telegram: this.telegram,
      grokApiKey: process.env.XAI_API_KEY,
      claudeClient: this.chatProvider,      // Provider for chat (Grok or Anthropic)
      anthropicClient: this.anthropicClient, // Raw Anthropic SDK for vision
      memoryDir: CONFIG.memoryDir,
      baseDir: CONFIG.baseDir,
      reviewer: this.reviewer,
      devServerPort: CONFIG.devServerPort,
      docsDir: CONFIG.docsDir,
    });

    // Build system prompt (with embedded knowledge base)
    this.systemPrompt = this.buildSystemPrompt();
  }

  /**
   * Get tool names for a specific skill (from registry metadata, no async needed)
   */
  getSkillToolNames(skillName) {
    const skill = SKILL_REGISTRY.find(s => s.name === skillName);
    return skill ? skill.tools : [];
  }

  /**
   * Get all currently available tools (core + loaded skills)
   */
  getAvailableTools() {
    return [
      ...TOOL_DEFINITIONS,
      LOAD_SKILL_TOOL,
      ...this.skillTools,
    ];
  }

  /**
   * Get executor for a tool (core or skill)
   */
  getExecutor(toolName) {
    return this.executors[toolName] || this.skillExecutors[toolName];
  }

  /**
   * Get a snapshot of project structure to help Agent navigate files
   * v3.2: Reduces wasted turns from path guessing
   */
  getProjectStructureSnapshot() {
    const lines = [];
    const workDir = CONFIG.workDir;

    try {
      // List src/ structure (most important for dev tasks)
      const srcDir = path.join(workDir, 'src');
      if (fs.existsSync(srcDir)) {
        lines.push('src/');
        const srcFiles = fs.readdirSync(srcDir);
        for (const file of srcFiles) {
          const filePath = path.join(srcDir, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            lines.push(`  ${file}/`);
            // List component files
            try {
              const subFiles = fs.readdirSync(filePath).slice(0, 10);
              for (const sf of subFiles) {
                lines.push(`    ${sf}`);
              }
            } catch {}
          } else {
            lines.push(`  ${file}`);
          }
        }
      }

      // List key root files in workDir
      const rootFiles = ['package.json', 'vite.config.js', 'index.html', 'tailwind.config.js'];
      const existingRootFiles = rootFiles.filter(f => fs.existsSync(path.join(workDir, f)));
      if (existingRootFiles.length > 0) {
        lines.push('');
        lines.push('Root files: ' + existingRootFiles.join(', '));
      }

    } catch (err) {
      lines.push(`(Error reading structure: ${err.message})`);
    }

    return lines.join('\n') || '(No src/ directory found)';
  }

  // ============================================
  //  System Prompt
  // ============================================

  buildSystemPrompt() {
    // Load AGENTS.md as primary guidelines
    let agentsGuide = '';
    const agentsPath = path.join(CONFIG.baseDir, 'AGENTS.md');
    if (fs.existsSync(agentsPath)) {
      agentsGuide = fs.readFileSync(agentsPath, 'utf-8');
    }

    // Load short-term memory (today's and yesterday's journal)
    let recentMemory = '';
    const journalDir = path.join(CONFIG.memoryDir, 'journal');
    if (fs.existsSync(journalDir)) {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      for (const date of [yesterday, today]) {
        const journalPath = path.join(journalDir, `${date}.md`);
        if (fs.existsSync(journalPath)) {
          const content = fs.readFileSync(journalPath, 'utf-8');
          recentMemory += `\n\n### Journal: ${date}\n${content.slice(0, 3000)}`;
        }
      }

      // Current task
      const currentTaskPath = path.join(journalDir, 'current_task.md');
      if (fs.existsSync(currentTaskPath)) {
        const content = fs.readFileSync(currentTaskPath, 'utf-8');
        recentMemory += `\n\n### Current Task\n${content}`;
      }
    }

    // Load long-term memory (patterns, bugs, values)
    let longTermMemory = '';
    const knowledgeDir = path.join(CONFIG.memoryDir, 'knowledge');
    if (fs.existsSync(knowledgeDir)) {
      // Values are most important
      const valuesPath = path.join(knowledgeDir, 'values.md');
      if (fs.existsSync(valuesPath)) {
        const content = fs.readFileSync(valuesPath, 'utf-8');
        longTermMemory += `\n\n### H2Crypto's Values\n${content.slice(0, 2000)}`;
      }

      // Bug solutions index (v4: folder-based registry)
      const bugsIndexPath = path.join(knowledgeDir, 'bugs', 'index.md');
      if (fs.existsSync(bugsIndexPath)) {
        const content = fs.readFileSync(bugsIndexPath, 'utf-8');
        longTermMemory += `\n\n### Bug Solutions Registry\n${content}\n\n**To get full solution:** \`lookup_bug({ error: "error message" })\``;
      }
    }

    // Load reference docs (product spec, design guides, etc.)
    // Note: _transient/ subdirectory is excluded from system prompt
    // Use _transient/ for temporary docs (env setup guides, deployment notes, etc.)
    let refDocs = '';
    if (fs.existsSync(CONFIG.docsDir)) {
      const files = fs
        .readdirSync(CONFIG.docsDir)
        .filter((f) => {
          // Skip _transient directory and only include .md/.txt files
          const fullPath = path.join(CONFIG.docsDir, f);
          const isFile = fs.statSync(fullPath).isFile();
          const isTransient = f === '_transient';
          return isFile && !isTransient && (f.endsWith('.md') || f.endsWith('.txt'));
        });
      for (const file of files) {
        const content = fs.readFileSync(path.join(CONFIG.docsDir, file), 'utf-8');
        refDocs += `\n\n### ${file}\n${content.slice(0, 2000)}`;
      }
    }

    return `${agentsGuide}

---

## Recent Memory (Short-Term)
${recentMemory || '(No recent journal entries)'}

---

## Long-Term Knowledge
${longTermMemory || '(No long-term memory yet)'}

---

## Reference Docs
${refDocs || '(No docs files found)'}

---

${getSkillHints()}

---

## Quick Reference

### Environment
- Base: ${CONFIG.baseDir}
- App: ${CONFIG.workDir}
- Memory: ${CONFIG.memoryDir}
- Public URL: http://165.22.136.40:${CONFIG.devServerPort}

### v3 Architecture
- TG is always Chat Mode
- Dev work triggered by #dotask only
- Context cleared between tasks
- Token usage tracked and reported
- Completed tasks archived to memory/completed_tasks/

### Core Value: 句句有回應、事事有交代
- Every message deserves a response
- Every task deserves a completion report
- Report format: Task name, Token usage, Results

### Today's Date
${new Date().toISOString().split('T')[0]}

---

Begin by checking your current task and memory. If there's pending work, continue. If waiting for H2Crypto, wait. Otherwise, assess the situation and proceed.`;
  }

  // ============================================
  //  Main Entry Point
  // ============================================

  async run() {
    console.log('🚀 SolanaHacker Agent (tool_use) starting...');
    this.isRunning = true;
    this.startTime = Date.now();

    // Ensure work directory exists
    await execAsync(`mkdir -p ${CONFIG.workDir}`);

    // Initialize git
    await this.gitInit();

    // Start heartbeat
    this.startHeartbeat();

    // Note: Project checking moved to switchToDevMode()
    // Chat Mode is default, no project check needed at startup

    // Send startup message (v4: updated command list)
    await this.telegram.sendDevlog(
      `🤖 <b>SolanaHacker v4 上線了！</b>\n\n` +
      `💬 Chat Mode（唯一模式）\n\n` +
      `📋 <b>任務管理:</b>\n` +
      `• <code>#addtask [任務]</code> - 新增待辦任務\n` +
      `• <code>#tasklist</code> - 查看待辦清單\n` +
      `• <code>#dotask</code> - 🚀 處理待辦任務\n` +
      `• <code>#deltask</code> - 刪除當前任務\n\n` +
      `💬 <b>對話:</b>\n` +
      `• 直接輸入訊息即可聊天\n` +
      `• <code>#sleep</code> - 今天不再主動打擾\n\n` +
      `🔧 <b>系統:</b>\n` +
      `• <code>#clear_message</code> - 清空對話記憶\n` +
      `• <code>#reload_prompt</code> - 重載 System Prompt\n` +
      `• <code>/status</code> - 查看狀態\n` +
      `• <code>/stop</code> - 停止 Agent\n\n` +
      `<i>v4: 句句有回應、事事有交代</i>`
    );

    try {
      // Main mode loop
      await this.modeLoop();
    } catch (error) {
      console.error('Mode loop error:', error);
      await this.telegram.sendError(error, 'mode loop');
    } finally {
      await this.cleanup();
    }
  }

  // ============================================
  //  Main Mode Loop (Chat/Dev switching)
  // ============================================

  // v3: Simplified mode loop - TG is always Chat Mode
  // agentLoop is only entered via processTasksNow (#dotask)
  async modeLoop() {
    while (this.isRunning) {
      if (this.currentMode === 'chat') {
        await this.chatModeLoop();
      } else if (this.currentMode === 'dev') {
        // Dev Mode - only entered via #dotask for task processing
        await this.agentLoop(false);
        // After agentLoop exits, return to chat mode (v3 behavior)
        this.currentMode = 'chat';
        if (!this.isRunning) break;
      }
    }
  }

  // ============================================
  //  Chat Mode Loop
  // ============================================

  async chatModeLoop() {
    console.log('[Agent] Entering Chat Mode');

    while (this.isRunning && this.currentMode === 'chat') {
      // Check for commands
      const commands = this.telegram.getMustCommands();

      for (const cmd of commands) {
        // v3: mode_switch commands removed - give helpful message
        if (cmd.type === 'mode_switch') {
          await this.telegram.sendDevlog(
            `ℹ️ <b>v3 更新</b>\n\n` +
            `<code>#chatmode</code> 和 <code>#devmode</code> 已移除。\n\n` +
            `新用法：\n` +
            `• 聊天：<code>#chat [訊息]</code>\n` +
            `• 開發：<code>#dotask</code>（處理待辦任務）`
          );
          continue;
        }

        // Add task
        if (cmd.type === 'add_task') {
          await this.chatMode.addTask(cmd.command);
          continue;
        }

        // List tasks
        if (cmd.type === 'list_tasks') {
          await this.chatMode.listTasks();
          continue;
        }

        // Delete task(s) - supports single or multiple
        if (cmd.type === 'delete_task') {
          await this.chatMode.deleteTask(cmd.command);
          continue;
        }
        if (cmd.type === 'delete_tasks') {
          await this.chatMode.deleteTasks(cmd.command); // cmd.command is array
          continue;
        }

        // Process tasks now - switch to Dev Mode with task list
        if (cmd.type === 'process_tasks') {
          // Guard: Block if already processing
          if (this.processingTasklist || this.currentMode === 'dev') {
            await this.telegram.sendDevlog(
              `🚫 <b>Agent 正在處理任務中！</b>\n\n` +
              `請等待當前任務完成後再發送 <code>#dotask</code>。`
            );
            continue;
          }
          await this.processTasksNow();
          return; // Exit chat loop, now in Dev Mode
        }

        // Release - push to GitHub and create tag
        if (cmd.type === 'release') {
          const version = cmd.command || 'auto';
          try {
            const result = await this.executors.git_release({ version });
            await this.telegram.sendDevlog(result);
          } catch (err) {
            await this.telegram.sendDevlog(`❌ Release 失敗: ${err.message}`);
          }
          continue;
        }

        // Sleep mode
        if (cmd.type === 'sleep_today') {
          this.chatMode.activateSleep();
          continue;
        }

        // Restart (systemd will auto-restart the service)
        if (cmd.type === 'restart') {
          console.log('[Agent] Restart command received, exiting for systemd restart...');
          await this.telegram.sendDevlog('🔄 Agent 正在重啟...');
          setTimeout(() => process.exit(0), 2000);
          this.isRunning = false;
          return;
        }

        // Clear message - clear conversation history and STAY in Chat Mode
        if (cmd.type === 'clear_message') {
          this.messages = [];
          this.turn = 0;
          this.waitingCount = 0;
          this.currentMode = 'chat';
          this.processingTasklist = false;
          this.chatMode.resetSleep();
          this.chatMode.clearChatHistory();
          this.loadedSkills.clear();
          this.skillTools = [];
          this.skillExecutors = {};
          try { fs.unlinkSync(STATE_FILE); } catch { /* ignore */ }
          await this.telegram.sendDevlog(
            `🧹 <b>對話記憶已清空！</b>\n\n` +
            `System Prompt 保留不變，有什麼想聊的？`
          );
          continue;
        }

        // Reload prompt - rebuild system prompt from AGENTS.md and docs/
        if (cmd.type === 'reload_prompt') {
          this.systemPrompt = this.buildSystemPrompt();
          await this.telegram.sendDevlog(
            `🔄 <b>System Prompt 已重新載入！</b>\n\n` +
            `已重新讀取 AGENTS.md 和 docs/ 目錄。`
          );
          continue;
        }

        // Chat message (v3.2: supports image attachments)
        if (cmd.type === 'chat') {
          await this.chatMode.handleChat({
            message: cmd.command,
            imagePath: cmd.imagePath,  // Will be null if no image
          });
          continue;
        }

        // Status request
        if (cmd.type === 'status_request') {
          const hour = this.chatMode.getGMT8Hour();
          const sleepStatus = this.chatMode.sleepToday ? '😴 休眠中' : '✅ 活躍';
          await this.telegram.sendDevlog(
            `📊 <b>Agent 狀態</b>\n\n` +
            `<b>模式:</b> 💬 Chat Mode\n` +
            `<b>時間:</b> GMT+8 ${hour}:00\n` +
            `<b>狀態:</b> ${sleepStatus}\n` +
            `<b>運行:</b> ${Math.round((Date.now() - this.startTime) / 60000)} min`
          );
          continue;
        }
      }

      // Process feedback queue as chat
      const feedback = this.telegram.getFeedback();
      for (const fb of feedback) {
        if (fb.type === 'idea' && fb.content) {
          await this.chatMode.handleChat(fb.content);
        }
      }

      // Heartbeat (proactive actions)
      await this.chatMode.doHeartbeat();

      // Sleep before next check
      await this.sleep(5000); // Check every 5 seconds
    }
  }

  // ============================================
  //  Mode Switching
  // ============================================

  // v3: These methods are deprecated - mode switching removed
  // Kept for backwards compatibility but just log a message
  async switchToDevMode() {
    console.log('[Agent] switchToDevMode called but deprecated in v3');
    await this.telegram.sendDevlog(
      `ℹ️ <b>v3 更新</b>\n\n` +
      `模式切換已移除。請使用 <code>#dotask</code> 處理待辦任務。`
    );
  }

  async switchToChatMode() {
    console.log('[Agent] switchToChatMode called but deprecated in v3');
    // Just switch mode internally without message
    this.currentMode = 'chat';
  }

  // ============================================
  //  Work-in-Progress (WIP) System - v4
  // ============================================

  /**
   * Get the WIP file path
   */
  getWIPPath() {
    return path.join(CONFIG.memoryDir, 'journal', 'work_in_progress.md');
  }

  /**
   * Read current Work-in-Progress
   * Returns { task, started, progress, filesModified, lastAction } or null
   */
  getWorkInProgress() {
    const wipPath = this.getWIPPath();
    if (!fs.existsSync(wipPath)) return null;

    const content = fs.readFileSync(wipPath, 'utf-8');
    if (!content.trim() || content.includes('No active task')) return null;

    // Parse WIP file (supports both "## Task:" and "## Task" formats)
    const taskMatch = content.match(/## Task:?\s*\n([\s\S]*?)(?=\n##|$)/);
    const startedMatch = content.match(/(?:Started|Created):\s*([^\n]+)/);
    const lastUpdateMatch = content.match(/Last Update(?:d)?:\s*([^\n]+)/);
    const progressMatch = content.match(/## Progress:?\s*\n([\s\S]*?)(?=\n##|$)/);
    const attemptsMatch = content.match(/## Attempts Log:?\s*\n([\s\S]*?)(?=\n##|$)/);
    const filesMatch = content.match(/## Files Modified:?\s*\n([\s\S]*?)(?=\n##|$)/);
    const lastActionMatch = content.match(/## Last Action:?\s*\n([\s\S]*?)(?=\n##|$)/);

    // Parse attempts, filtering out placeholder text
    let attempts = attemptsMatch ? attemptsMatch[1].trim() : '';
    if (attempts.includes('記錄嘗試過的方法')) {
      attempts = '';
    }

    return {
      task: taskMatch ? taskMatch[1].trim() : null,
      started: startedMatch ? startedMatch[1].trim() : null,
      lastUpdate: lastUpdateMatch ? lastUpdateMatch[1].trim() : null,
      progress: progressMatch ? progressMatch[1].trim() : '',
      attempts: attempts,
      filesModified: filesMatch ? filesMatch[1].trim() : '',
      lastAction: lastActionMatch ? lastActionMatch[1].trim() : '',
      raw: content,
    };
  }

  /**
   * Set a new task in Work-in-Progress
   */
  setWorkInProgress(taskDescription) {
    const wipPath = this.getWIPPath();
    const journalDir = path.dirname(wipPath);
    if (!fs.existsSync(journalDir)) {
      fs.mkdirSync(journalDir, { recursive: true });
    }

    const now = new Date().toISOString();
    const content = `# Work in Progress

> Single active task - tracked for resume capability

## Task:
${taskDescription}

## Metadata:
- Created: ${now}
- Last Updated: ${now}
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

    fs.writeFileSync(wipPath, content, 'utf-8');
    console.log(`[Agent] WIP set: ${taskDescription.slice(0, 50)}...`);
    return true;
  }

  /**
   * Update progress in Work-in-Progress (called by Agent during work)
   * @param {object} options
   * @param {string} options.checkpoint - Progress checkpoint to add
   * @param {string} options.filesModified - Updated files list
   * @param {string} options.lastAction - Current action description
   * @param {string} options.attempt - Log an attempt (what was tried and result)
   */
  updateWorkProgress({ checkpoint, filesModified, lastAction, attempt }) {
    const wipPath = this.getWIPPath();
    if (!fs.existsSync(wipPath)) return false;

    let content = fs.readFileSync(wipPath, 'utf-8');
    const now = new Date().toISOString();
    const timeStr = now.split('T')[1].slice(0, 5);

    // Update Last Updated timestamp (handles both "Last Update:" and "Last Updated:")
    content = content.replace(/- Last Update(?:d)?:\s*[^\n]+/, `- Last Updated: ${now}`);
    // Also update Status to in_progress
    content = content.replace(/- Status:\s*\w+/, `- Status: in_progress`);

    // Add checkpoint to Progress if provided
    if (checkpoint) {
      const progressMatch = content.match(/(## Progress:?\s*\n)([\s\S]*?)((?=\n##)|$)/);
      if (progressMatch) {
        const existingProgress = progressMatch[2];
        const newProgress = existingProgress.trim() + `\n- [x] ${checkpoint}`;
        content = content.replace(progressMatch[0], `${progressMatch[1]}${newProgress}\n\n`);
      }
    }

    // Add attempt to Attempts Log if provided
    if (attempt) {
      const attemptsMatch = content.match(/(## Attempts Log:?\s*\n)([\s\S]*?)((?=\n##)|$)/);
      if (attemptsMatch) {
        let existingAttempts = attemptsMatch[2].trim();
        // Remove placeholder text
        if (existingAttempts.includes('記錄嘗試過的方法')) {
          existingAttempts = '';
        }
        const newAttempts = existingAttempts + `\n- [${timeStr}] ${attempt}`;
        content = content.replace(attemptsMatch[0], `${attemptsMatch[1]}${newAttempts.trim()}\n\n`);
      }
    }

    // Update Files Modified if provided
    if (filesModified) {
      content = content.replace(
        /## Files Modified:?\s*\n[\s\S]*?(?=\n##|$)/,
        `## Files Modified:\n${filesModified}\n\n`
      );
    }

    // Update Last Action if provided
    if (lastAction) {
      content = content.replace(
        /## Last Action:?\s*\n[\s\S]*?(?=\n##|$)/,
        `## Last Action:\n${lastAction}\n`
      );
    }

    fs.writeFileSync(wipPath, content, 'utf-8');
    return true;
  }

  /**
   * Clear Work-in-Progress (called after task completion)
   */
  clearWorkInProgress() {
    const wipPath = this.getWIPPath();
    const content = `# Work in Progress

No active task. Use #addtask to set a task, then #dotask to begin.
`;
    fs.writeFileSync(wipPath, content, 'utf-8');
    console.log('[Agent] WIP cleared');
  }

  /**
   * Check if there's an active task
   */
  hasActiveTask() {
    const wip = this.getWorkInProgress();
    return wip && wip.task;
  }

  /**
   * Save current work context to short-term memory before switching to tasks
   * @deprecated - replaced by WIP system
   */
  saveCurrentWorkContext() {
    // Now handled by WIP system
    console.log('[Agent] saveCurrentWorkContext called (deprecated, using WIP)');
  }

  // Legacy compatibility - kept for reference
  _legacySaveContext() {
    const journalDir = path.join(CONFIG.memoryDir, 'journal');
    const pausedWorkPath = path.join(journalDir, 'paused_work.md');

    // Read current task
    const currentTaskPath = path.join(journalDir, 'current_task.md');
    let currentTask = '';
    if (fs.existsSync(currentTaskPath)) {
      currentTask = fs.readFileSync(currentTaskPath, 'utf-8');
    }

    // Save paused work context
    const content = `# Paused Work Context

> Saved at: ${new Date().toISOString()}
> Reason: Switching to process tasklist (higher priority)

## Previous Task State
${currentTask || '(No current task was set)'}

## Resume Instructions
After completing tasklist tasks, read this file and resume the previous work.
`;

    fs.writeFileSync(pausedWorkPath, content);
    console.log('[Agent] Saved current work context to paused_work.md');
  }

  /**
   * Process task immediately (#dotask command)
   * v4: Uses Work-in-Progress system with progress tracking
   */
  async processTasksNow() {
    console.log('[Agent] Processing task now (v4 - WIP system)...');

    // v4: Read Work-in-Progress
    const wip = this.getWorkInProgress();

    if (!wip || !wip.task) {
      await this.telegram.sendDevlog(
        '📋 <b>沒有待處理的任務！</b>\n\n' +
        '使用 <code>#addtask [任務描述]</code> 新增任務，\n' +
        '然後用 <code>#dotask</code> 開始工作。'
      );
      return;
    }

    // Check if this is a resume (has previous progress)
    const isResume = wip.progress && !wip.progress.includes('Task started');

    // Switch to Dev Mode for task processing
    this.currentMode = 'dev';

    // Set task processing flag and token tracking
    this.processingTasklist = true;
    this.taskTokenUsage = { input: 0, output: 0 };
    this.taskStartTime = Date.now();

    // Clear previous messages and set task-focused initial prompt
    this.messages = [];
    this.turn = 0;
    this.waitingCount = 0;

    // v3: Clear chat history when switching to task mode
    this.chatMode.clearChatHistory();

    // v3.2: Get project structure snapshot to help Agent navigate
    const projectStructure = this.getProjectStructureSnapshot();

    // Build context message based on whether this is a new task or resume
    let taskContext = '';
    if (isResume) {
      // Build attempts section (critical for avoiding repeated failures)
      let attemptsSection = '';
      if (wip.attempts) {
        attemptsSection = `### ⚠️ ATTEMPTS ALREADY TRIED (DO NOT REPEAT THESE):\n${wip.attempts}\n\n`;
      }

      taskContext = `## ⚡ RESUMING TASK (conversation was reset)\n\n` +
        `**You were working on this task and got interrupted.**\n` +
        `**Review the progress below and CONTINUE from where you left off.**\n\n` +
        `### Previous Progress:\n${wip.progress}\n\n` +
        attemptsSection +
        `### Files Modified:\n${wip.filesModified || '(none recorded)'}\n\n` +
        `### Last Action:\n${wip.lastAction || '(none recorded)'}\n\n` +
        `---\n\n`;
    }

    // v4: Add task-focused initial message with WIP context
    this.messages.push({
      role: 'user',
      content:
        `[TASK MODE - v4] H2Crypto says: ${isResume ? 'CONTINUE' : 'Process'} this task NOW.\n\n` +
        `## Project Structure (paths relative to workDir)\n` +
        `${projectStructure}\n\n` +
        `${taskContext}` +
        `## Current Task\n${wip.task}\n\n` +
        `## Instructions:\n` +
        `**Path Rules:**\n` +
        `- Code files: "src/App.jsx", "src/components/HomePage.jsx"\n` +
        `- DO NOT prefix with "app/" - workDir is already app/\n\n` +
        `**Steps:**\n` +
        `1. ${isResume ? 'Review progress above and CONTINUE' : 'Complete this task fully'}\n` +
        `2. For UI tasks: Take screenshot to VERIFY changes appear\n` +
        `3. When done: \`complete_task({ summary: "what was done" })\`\n` +
        `4. Send Telegram update with results\n\n` +
        `${isResume ? '⚡ RESUME NOW - pick up where you left off!' : 'Start now!'}`
    });

    // Update WIP to show we're starting/resuming
    this.updateWorkProgress({
      lastAction: isResume ? 'Resuming after conversation reset...' : 'Starting task...',
    });

    await this.telegram.sendDevlog(
      isResume
        ? `⚡ <b>恢復任務！</b>\n\n` +
          `<pre>${wip.task.slice(0, 100)}</pre>\n\n` +
          `<i>從上次進度繼續...</i>`
        : `🚀 <b>開始處理任務！</b>\n\n` +
          `<pre>${wip.task.slice(0, 100)}</pre>\n\n` +
          `<i>v4: WIP 系統 - 支援中斷恢復</i>`
    );

    // Clear state file since we're starting fresh with tasks
    try { fs.unlinkSync(STATE_FILE); } catch { /* ignore */ }
  }

  /**
   * v4: No longer needed - WIP is single task
   * @deprecated
   */
  async loadNextTask() {
    // v4: WIP system only supports one task at a time
    // After complete_task, WIP is cleared and Agent returns to Chat Mode
    console.log('[Agent] loadNextTask called but deprecated in v4 - use WIP system');
    return false;
  }

  /**
   * Load current task state for saving
   */
  loadCurrentTaskState() {
    const taskPath = path.join(CONFIG.memoryDir, 'journal', 'current_task.md');
    if (!fs.existsSync(taskPath)) {
      return { phase: 'Unknown', status: 'Unknown' };
    }

    const content = fs.readFileSync(taskPath, 'utf-8');
    // Parse basic info from the file
    const phaseMatch = content.match(/Current Phase:\s*(\w+)/);
    const statusMatch = content.match(/Status:\s*(.+)/);

    return {
      phase: phaseMatch?.[1] || 'Unknown',
      status: statusMatch?.[1] || 'Unknown',
      lastTask: 'Development work in progress',
      notes: content.slice(0, 500),
    };
  }

  // ============================================
  //  Check Existing Project & Ask Architect
  // ============================================

  async checkExistingProject() {
    try {
      // Check if project directory has meaningful files
      const { stdout } = await execAsync(
        `find ${CONFIG.workDir} -type f \\( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" -o -name "package.json" \\) 2>/dev/null | head -20`
      );
      const files = stdout.trim().split('\n').filter(Boolean);

      if (files.length === 0) {
        console.log('[Agent] No existing project found — starting fresh');
        return false; // No project, start fresh
      }

      console.log(`[Agent] Found existing project with ${files.length} files`);

      // Read package.json for project info
      let projectInfo = '';
      const pkgPath = path.join(CONFIG.workDir, 'package.json');
      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
          projectInfo = `<b>專案名稱:</b> ${pkg.name || 'unknown'}\n`;
          if (pkg.description) projectInfo += `<b>描述:</b> ${pkg.description}\n`;
        } catch { /* ignore parse errors */ }
      }

      // List key files
      const keyFiles = files
        .map((f) => f.replace(CONFIG.workDir + '/', ''))
        .slice(0, 10)
        .join(', ');

      // Ask architect via Telegram
      const message = `
🔍 <b>發現現有專案</b>

${projectInfo}<b>檔案數量:</b> ${files.length}
<b>主要檔案:</b> ${keyFiles}

請問要繼續這個專案嗎？

回覆 <code>#yes</code> 繼續開發
回覆 <code>#no</code> 清除並重新開始
      `.trim();

      await this.telegram.sendDevlog(message);

      // Wait for architect response (poll mustQueue for #yes or #no)
      console.log('[Agent] Waiting for architect decision on existing project...');
      const timeout = 5 * 60 * 1000; // 5 minutes
      const start = Date.now();

      while (Date.now() - start < timeout) {
        await this.sleep(3000);
        const commands = this.telegram.getMustCommands();

        for (const cmd of commands) {
          if (cmd.type === 'must') {
            const lower = cmd.command.toLowerCase().trim();
            if (lower === 'yes' || lower === '#yes' || lower === 'y') {
              await this.telegram.sendDevlog('✅ 收到！繼續開發現有專案...');
              return true;
            }
            if (lower === 'no' || lower === '#no' || lower === 'n') {
              await this.telegram.sendDevlog('🔄 收到！清除專案，重新開始...');
              return false;
            }
          }
          if (cmd.type === 'restart') {
            console.log('[Agent] Restart command received');
            setTimeout(() => process.exit(0), 2000);
            this.isRunning = false;
            return false;
          }
        }
      }

      // Timeout — default to continue existing
      console.log('[Agent] Timeout waiting for architect — defaulting to continue existing project');
      await this.telegram.sendDevlog('⏱️ 等待超時，預設繼續現有專案...');
      return true;
    } catch (err) {
      console.error('[Agent] Error checking existing project:', err.message);
      return false; // On error, start fresh
    }
  }

  // ============================================
  //  Core Agentic Loop
  // ============================================

  async agentLoop(continueExisting = false) {
    // Check for clear_message command BEFORE loading state
    const pendingCommands = this.telegram.peekMustCommands();
    const hasClear = pendingCommands.some(cmd => cmd.type === 'clear_message');
    if (hasClear) {
      console.log('[Agent] Clear message command pending - skipping state load, switching to Chat Mode');
      // Consume the clear command
      this.telegram.getMustCommands();
      // Clear state
      this.messages = [];
      this.turn = 0;
      this.waitingCount = 0;
      this.currentMode = 'chat';
      this.processingTasklist = false;
      this.loadedSkills.clear();
      this.skillTools = [];
      this.skillExecutors = {};
      this.chatMode.resetSleep();
      this.chatMode.clearChatHistory();
      try { fs.unlinkSync(STATE_FILE); } catch { /* ignore */ }
      await this.telegram.sendDevlog(
        `🧹 <b>對話記憶已清空！</b>\n\n` +
        `System Prompt 保留不變，有什麼想聊的？`
      );
      return; // Exit agentLoop, modeLoop will enter chatModeLoop
    }

    // Check for reload_prompt command
    const hasReload = pendingCommands.some(cmd => cmd.type === 'reload_prompt');
    if (hasReload) {
      console.log('[Agent] Reload prompt command pending');
      this.telegram.getMustCommands();
      this.systemPrompt = this.buildSystemPrompt();
      await this.telegram.sendDevlog(
        `🔄 <b>System Prompt 已重新載入！</b>\n\n` +
        `已重新讀取 AGENTS.md 和 docs/ 目錄。`
      );
      // Continue with agentLoop after reload
    }

    // Try to resume from saved state
    const resumed = this.loadState();

    // v3: agentLoop is only entered via #dotask for task processing
    // Initial message should already be set by processTasksNow()
    if (resumed) {
      // Resuming from saved state (rare in v3, but handle it)
      await this.telegram.sendDevlog(
        `🔄 <b>Agent 從上次對話繼續</b>\n` +
        `回合: ${this.turn}, 訊息: ${this.messages.length}`
      );
    } else if (this.messages.length === 0) {
      // No messages set - this shouldn't happen in v3, but handle gracefully
      this.messages.push({
        role: 'user',
        content:
          '[SYSTEM] No tasks loaded. Please use #addtask to add tasks, then #dotask to process them.',
      });
      await this.telegram.sendDevlog(
        `⚠️ 沒有任務載入。請使用 <code>#addtask</code> 新增任務，然後 <code>#dotask</code> 處理。`
      );
      this.currentMode = 'chat';
      return;
    }
    // If messages are already set (from processTasksNow), continue normally

    while (this.isRunning && this.turn < CONFIG.maxTurns && this.currentMode === 'dev') {
      // === IDLE MODE CHECK (before any API call) ===
      // If we're in idle mode (waiting for H2Crypto), don't call API - just check TG
      // This saves tokens by not burning turns while waiting
      if (this.waitingCount >= 1) {
        console.log(`[Agent] In idle mode - sleeping 30s before checking TG (turn NOT incremented)...`);
        await this.sleep(30000);

        // PEEK at TG commands (don't consume them - let injectCommands handle that)
        const commands = this.telegram.peekMustCommands();
        const feedback = this.telegram.peekFeedback();

        // Check if there's something that should wake us up
        const hasCommands = commands.length > 0;
        const hasUrgentFeedback = feedback.some((fb) =>
          /error|bug|404|500|問題|不行|失敗|壞|broken|fail|issue|reject/i.test(fb.content || '')
        );

        if (hasCommands || hasUrgentFeedback) {
          console.log('[Agent] Waking up from idle - new commands or urgent feedback');
          this.waitingCount = 0;
          // Continue to normal flow - injectCommands will consume and handle the input
        } else {
          // Nothing new - stay in idle, don't increment turn, don't call API
          console.log('[Agent] Still idle - no new commands, skipping API call');
          continue;
        }
      }

      // === TASK CHECK (v4: WIP system) ===
      // v4: Task checking is simplified - just check if there's an active WIP
      // No more task queue - one task at a time via #addtask + #dotask

      // Check if task processing is complete
      if (this.processingTasklist) {
        const hasTask = this.hasActiveTask();
        if (!hasTask) {
          console.log('[Agent] Task completed (v4) - clearing context and returning to Chat Mode');

          // v3: Calculate and report token usage
          const elapsedMin = Math.round((Date.now() - (this.taskStartTime || Date.now())) / 60000);
          const tokenReport = this.taskTokenUsage
            ? `📊 Total Token Usage: ${this.taskTokenUsage.input} input / ${this.taskTokenUsage.output} output`
            : '';

          await this.telegram.sendDevlog(
            `✅ <b>任務完成！</b>\n\n` +
            `⏱️ 耗時：約 ${elapsedMin} 分鐘\n` +
            `${tokenReport}\n\n` +
            `<i>v4: 已返回 Chat Mode，使用 #addtask 新增下一個任務</i>`
          );

          // v3: Clear context and return to Chat Mode (no auto-resume)
          this.processingTasklist = false;
          this.taskTokenUsage = null;
          this.taskStartTime = null;
          this.currentMode = 'chat';
          this.messages = [];
          this.turn = 0;

          // Clear state file
          try { fs.unlinkSync(STATE_FILE); } catch { /* ignore */ }

          return; // Exit agentLoop, return to modeLoop which will enter chatModeLoop
        }
      }

      this.turn++;
      console.log(`\n[Agent] === Turn ${this.turn}/${CONFIG.maxTurns} ===`);

      // Inject queued TG commands into conversation
      await this.injectCommands();
      if (!this.isRunning) break;

      // Call Claude API with retry
      let response;
      try {
        response = await this.callClaudeWithRetry();
      } catch (err) {
        const errMsg = err.message || '';
        console.error('[Agent] Claude API failed after retries:', errMsg);

        // Detect orphaned tool_use/tool_result — repair and retry
        if (errMsg.includes('tool_result') && errMsg.includes('tool_use')) {
          this.repairAttempts = (this.repairAttempts || 0) + 1;
          console.log(`[Agent] Detected orphaned tool_use/tool_result — repair attempt ${this.repairAttempts}...`);

          if (this.repairAttempts >= 3) {
            // Too many repair attempts — nuclear option: start fresh conversation
            console.log('[Agent] Repair failed 3 times — resetting conversation...');
            await this.telegram.sendDevlog(
              `⚠️ <b>對話修復失敗</b>\n\n` +
              `嘗試修復 3 次仍無法恢復。\n` +
              `正在重置對話，從現有專案狀態繼續...`
            );
            // v4: After reset, check WIP for task to resume
            const wip = this.getWorkInProgress();
            const wipContext = wip && wip.task
              ? `You were working on: "${wip.task.slice(0, 100)}"\nCheck memory/journal/work_in_progress.md for your progress and CONTINUE from where you left off.`
              : 'No active task. WAIT for H2Crypto to send #dotask command.';

            this.messages = [{
              role: 'user',
              content:
                'Your previous conversation encountered an error and was reset. ' +
                'IMPORTANT: v4 Architecture - Work-in-Progress system. ' +
                `${wipContext} ` +
                'Do NOT start autonomous development work without explicit task instructions.',
            }];
            this.repairAttempts = 0;
            this.saveState();
            this.turn--;
            continue;
          }

          this.repairMessages();
          this.turn--; // Don't count this turn
          continue;
        }

        await this.telegram.sendError(err, 'Claude API');
        // Wait and retry the whole turn
        await this.sleep(30000);
        this.turn--; // Don't count failed turns
        continue;
      }

      // Add assistant response to history
      this.messages.push({ role: 'assistant', content: response.content });

      // Log text output
      for (const block of response.content) {
        if (block.type === 'text' && block.text) {
          console.log(`[Agent] 💬 ${block.text.slice(0, 300)}`);
        }
      }

      // v4.5: Hallucination detection — LLM claims actions but made no tool calls
      if (response.stop_reason !== 'tool_use') {
        const allText = response.content
          .filter(b => b.type === 'text')
          .map(b => b.text)
          .join('\n');
        const actionPatterns = [
          /已建立|已創建|已新增|已寫入|已寫了|已修改|已更新|已刪除|已移除/,
          /檔案已|文件已|Written:|Created:|File created/,
          /已\s*commit|已\s*push|已\s*tag|已\s*release/,
          /完整大小|bytes.*權限|檔案頭部|檔案內容預覽/i,
          /剛讀檔確認|剛讀取確認|讀檔確認/,
        ];
        const claimsAction = actionPatterns.some(p => p.test(allText));
        if (claimsAction) {
          console.warn(`[Agent] ⚠️ HALLUCINATION DETECTED: Response claims actions but stop_reason=${response.stop_reason}, no tool calls`);
          console.warn(`[Agent] Suspicious text: ${allText.slice(0, 300)}`);
          // Inject correction message to force LLM to use tools
          this.messages.push({
            role: 'user',
            content:
              '[SYSTEM] ⚠️ HALLUCINATION DETECTED: You claimed to have performed file operations (write/read/create) ' +
              'but you did NOT actually call any tools. Your response was text-only.\n\n' +
              'RULES:\n' +
              '1. To create/write files, you MUST call the write_file tool\n' +
              '2. To read files, you MUST call the read_file tool\n' +
              '3. To run commands, you MUST call the run_command tool\n' +
              '4. NEVER describe actions as if you did them — actually DO them with tools\n\n' +
              'Please REDO the operation using the correct tools.',
          });
          await this.telegram.sendDevlog(
            `⚠️ <b>幻覺偵測</b>：LLM 聲稱執行了檔案操作但未呼叫工具。已自動要求重新執行。`
          );
          continue; // Retry the turn with correction
        }
      }

      // Handle stop_reason
      if (response.stop_reason === 'end_turn') {
        console.log('[Agent] Agent signaled end_turn');

        // Check if agent considers itself done
        const lastText = response.content.find((b) => b.type === 'text')?.text || '';
        if (
          lastText.toLowerCase().includes('mission complete') ||
          lastText.toLowerCase().includes('submitted successfully')
        ) {
          console.log('[Agent] Mission complete!');
          await this.telegram.sendDevlog('🎉 <b>Agent 宣告任務完成！</b>');
          break;
        }

        // Check if agent is in "waiting" state (for review, approval, response, etc.)
        const lowerText = lastText.toLowerCase();
        const isWaiting = (
          // Waiting for approval/review
          (lowerText.includes('waiting') && lowerText.includes('approv')) ||
          (lowerText.includes('waiting') && lowerText.includes('review')) ||
          (lowerText.includes('waiting') && lowerText.includes('test')) ||
          // Waiting for H2Crypto response
          (lowerText.includes('waiting') && lowerText.includes('h2crypto')) ||
          (lowerText.includes('waiting') && lowerText.includes('response')) ||
          (lowerText.includes('waiting') && lowerText.includes('feedback')) ||
          // Chinese patterns
          lowerText.includes('等待') ||
          lowerText.includes('請回覆') ||
          lowerText.includes('請測試') ||
          // Explicit wait signals
          lowerText.includes('i will wait') ||
          lowerText.includes('i am waiting') ||
          lowerText.includes('please test') ||
          lowerText.includes('please review')
        );

        if (isWaiting) {
          this.waitingCount = (this.waitingCount || 0) + 1;
          console.log(`[Agent] Waiting state detected - entering idle mode`);

          // IMPORTANT: Decrement turn to keep it fixed while waiting
          // This prevents token waste during review wait
          this.turn--;
          console.log(`[Agent] Turn reverted to ${this.turn} (waiting for H2Crypto)`);

          // Enter idle mode immediately (save tokens)
          continue; // Skip nudge, go to idle check at loop start
        } else {
          // Reset waiting counter if doing something else
          this.waitingCount = 0;
        }

        // v3: Check if there is active WIP, otherwise wait
        const hasWIP = this.hasActiveTask();
        if (hasWIP) {
          this.messages.push({
            role: 'user',
            content:
              '[SYSTEM] You signaled end_turn but there is an active Work-in-Progress.\n\n' +
              'Check memory/journal/work_in_progress.md and continue the task.\n' +
              'Use complete_task when done.',
          });
        } else {
          this.messages.push({
            role: 'user',
            content:
              '[SYSTEM] No active task. You can now wait for H2Crypto.\n' +
              'If you just completed a task, send a summary to Telegram.\n' +
              'Do NOT start autonomous development work.',
          });
        }
        continue;
      }

      if (response.stop_reason === 'tool_use') {
        const toolResults = [];
        let taskCompleted = false; // v3.1: Track if complete_task was called

        for (const block of response.content) {
          if (block.type !== 'tool_use') continue;

          const toolName = block.name;
          const toolInput = block.input;
          console.log(
            `[Agent] 🔧 ${toolName}(${JSON.stringify(toolInput).slice(0, 150)})`
          );

          let result;
          try {
            const executor = this.getExecutor(toolName);
            if (!executor) {
              // Check if it's a skill tool that hasn't been loaded (use registry metadata)
              const requiredSkill = SKILL_REGISTRY.find((s) => {
                return s.tools && s.tools.includes(toolName);
              });

              if (requiredSkill) {
                result = `Error: Tool "${toolName}" requires skill "${requiredSkill.name}" to be loaded first.\nUse: load_skill({ skill_name: "${requiredSkill.name}" })`;
              } else {
                const allTools = [...Object.keys(this.executors), ...Object.keys(this.skillExecutors)];
                result = `Error: Unknown tool "${toolName}". Available tools: ${allTools.join(', ')}`;
              }
            } else {
              result = await executor(toolInput);
            }
          } catch (err) {
            result = `Error executing ${toolName}: ${err.message}`;
            console.error(`[Agent] Tool error (${toolName}):`, err.message);
          }

          // v3.1: Track complete_task calls and send summary to Telegram
          if (toolName === 'complete_task' && !result.startsWith('Error')) {
            taskCompleted = true;
            // v4.2: Send summary to Telegram
            const summary = block.input?.summary;
            if (summary) {
              await this.telegram.sendDevlog(
                `✅ <b>任務完成！</b>\n\n` +
                `<b>摘要:</b>\n${summary.slice(0, 500)}${summary.length > 500 ? '...' : ''}`
              );
            }
          }

          // Mask any secrets in tool results
          const safeResult = maskSecrets(String(result));

          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: safeResult,
          });

          console.log(`[Agent] ✅ ${toolName} → ${String(result).slice(0, 150)}`);
        }

        this.messages.push({ role: 'user', content: toolResults });

        // v3.1: If complete_task was called, load next task (if any)
        if (taskCompleted && this.processingTasklist) {
          const hasMoreTasks = await this.loadNextTask();
          if (!hasMoreTasks) {
            console.log('[Agent] All tasks completed! Returning to Chat Mode.');
            // Don't return here - let the existing check at the end of loop handle cleanup
          }
        }
      }

      // Context management
      this.pruneContext();

      // Persist state for resume after restart
      this.saveState();
    }

    if (this.turn >= CONFIG.maxTurns) {
      console.log('[Agent] Max turns reached');
      // Clear state file to prevent reload loop
      try { fs.unlinkSync(STATE_FILE); } catch { /* ignore */ }
      // Switch to Chat Mode
      this.currentMode = 'chat';
      this.turn = 0;
      this.messages = [];
      await this.telegram.sendDevlog(
        `⚠️ Agent 達到最大迭代次數 (${CONFIG.maxTurns})。\n\n` +
        `已切換到 Chat Mode。\n` +
        `發送 <code>#devmode</code> 繼續開發。`
      );
    }
  }

  // ============================================
  //  Claude API Call with Retry + Prompt Caching
  // ============================================

  /**
   * Build API request with prompt caching for cost efficiency.
   *
   * Cache hierarchy (up to 4 breakpoints):
   * 1. tools - rarely changes, cache entire tool definitions
   * 2. system - AGENTS.md + memory, changes ~daily
   * 3. messages - cache conversation prefix for multi-turn efficiency
   *
   * Requirements:
   * - Minimum 1024 tokens per cacheable block (Sonnet 4)
   * - cache_control: {type: "ephemeral"} marks end of cacheable prefix
   * - Cache reads = 10% of base cost (90% savings!)
   */
  buildCachedRequest() {
    // 1. Get available tools (core + load_skill + loaded skills)
    const availableTools = this.getAvailableTools();

    // Cache tools (add cache_control to last tool)
    const cachedTools = availableTools.map((tool, index) => {
      if (index === availableTools.length - 1) {
        return { ...tool, cache_control: { type: 'ephemeral' } };
      }
      return tool;
    });

    // 2. Cache system prompt (convert to array format with cache_control)
    const cachedSystem = [
      {
        type: 'text',
        text: this.systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ];

    // 3. Cache messages - v3: Skip message caching in Task Mode (context gets cleared frequently)
    // Only apply message caching in non-task mode where conversation persists
    let cachedMessages;
    if (this.processingTasklist) {
      // Task Mode: No message caching (context cleared between tasks)
      cachedMessages = this.messages;
    } else {
      // Non-task mode: Apply message caching for stable conversation
      cachedMessages = this.messages.map((msg, index) => {
        const isCacheCandidate =
          msg.role === 'user' &&
          typeof msg.content === 'string' &&
          index > 0 &&
          index === this.messages.length - 3;

        if (isCacheCandidate && msg.content.length > 500) {
          return {
            role: 'user',
            content: [
              {
                type: 'text',
                text: msg.content,
                cache_control: { type: 'ephemeral' },
              },
            ],
          };
        }
        return msg;
      });
    }

    return {
      model: CONFIG.devModel,
      max_tokens: CONFIG.maxTokens,
      system: cachedSystem,
      tools: cachedTools,
      messages: cachedMessages,
    };
  }

  async callClaudeWithRetry() {
    let lastError;
    for (let attempt = 0; attempt <= CONFIG.maxRetries; attempt++) {
      try {
        const request = this.buildCachedRequest();
        const response = await this.devProvider.messages.create(request);

        // Log cache performance (available in response.usage)
        if (response.usage) {
          const { cache_creation_input_tokens, cache_read_input_tokens, input_tokens, output_tokens } = response.usage;
          if (cache_read_input_tokens > 0) {
            const savings = Math.round((cache_read_input_tokens / (cache_read_input_tokens + input_tokens)) * 90);
            console.log(`[Cache] Hit! Read: ${cache_read_input_tokens} tokens (~${savings}% cost saved)`);
          } else if (cache_creation_input_tokens > 0) {
            console.log(`[Cache] Created: ${cache_creation_input_tokens} tokens (will save on next call)`);
          }

          // v3: Track token usage for task reporting
          if (this.processingTasklist && this.taskTokenUsage) {
            this.taskTokenUsage.input += input_tokens || 0;
            this.taskTokenUsage.output += output_tokens || 0;
          }
        }

        return response;
      } catch (error) {
        lastError = error;
        const status = error.status || error.statusCode;
        const msg = error.message || '';

        // Budget / credits exhausted — enter standby mode instead of crashing
        if (
          status === 400 && (msg.includes('credit') || msg.includes('balance')) ||
          status === 402 ||
          status === 403 && msg.includes('billing')
        ) {
          console.error(`[Agent] API budget exhausted (${status}): ${msg}`);
          await this.telegram.sendDevlog(
            `🚨 <b>Anthropic API 額度已用完！</b>\n\n` +
            `<b>錯誤碼:</b> ${status}\n\n` +
            `Agent 進入待機模式，等待額度恢復。\n` +
            `請充值後發送 <code>#clear_message</code> 重新啟動。\n\n` +
            `<i>Server 保持運行，無需 SSH 重啟。</i>`
          );

          // Enter standby mode - don't crash, just wait for reset
          await this.enterStandbyMode('API credits exhausted');

          // After standby mode exits (reset received), go back to main loop
          // Don't retry - messages were cleared during reset
          return { content: [{ type: 'text', text: '[Standby mode exited - resetting to Chat Mode]' }], stop_reason: 'end_turn' };
        }

        // Rate limited — retry with backoff
        if (status === 429 || status === 529) {
          const delay = CONFIG.baseDelay * Math.pow(2, attempt);
          console.log(
            `[Agent] Rate limited (${status}), retry ${attempt + 1}/${CONFIG.maxRetries} in ${delay / 1000}s...`
          );
          await this.sleep(delay);
          continue;
        }

        throw error;
      }
    }
    throw lastError;
  }

  // ============================================
  //  Telegram Command Injection
  // ============================================

  async injectCommands() {
    const commands = this.telegram.getMustCommands();
    const feedback = this.telegram.getFeedback();
    const parts = [];

    for (const cmd of commands) {
      if (cmd.type === 'restart') {
        console.log('[Agent] Restart command received');
        await this.telegram.sendDevlog('🔄 Agent 正在重啟...');
        setTimeout(() => process.exit(0), 2000);
        this.isRunning = false;
        return;
      }

      // v3: mode_switch commands removed
      if (cmd.type === 'mode_switch') {
        await this.telegram.sendDevlog(
          `ℹ️ <b>v3 更新</b>\n\n` +
          `<code>#chatmode</code> 和 <code>#devmode</code> 已移除。\n` +
          `正在處理任務中，完成後自動返回 Chat Mode。`
        );
        continue;
      }

      // Add task (works in both modes)
      if (cmd.type === 'add_task') {
        await this.chatMode.addTask(cmd.command);
        continue;
      }

      // List tasks (works in both modes)
      if (cmd.type === 'list_tasks') {
        await this.chatMode.listTasks();
        continue;
      }

      if (cmd.type === 'clear_message') {
        // Clear message history and switch to Chat Mode
        this.messages = [];
        this.turn = 0;
        this.waitingCount = 0;
        this.currentMode = 'chat';
        this.processingTasklist = false;
        this.loadedSkills.clear();
        this.skillTools = [];
        this.skillExecutors = {};
        this.chatMode.resetSleep();
        this.chatMode.clearChatHistory();
        try { fs.unlinkSync(STATE_FILE); } catch { /* ignore */ }
        console.log('[Agent] Clear message: switching to Chat Mode');
        await this.telegram.sendDevlog(
          `🧹 <b>對話記憶已清空！</b>\n\n` +
          `System Prompt 保留不變，有什麼想聊的？`
        );
        return; // Exit injectCommands, agentLoop will exit, modeLoop will enter chatModeLoop
      }

      if (cmd.type === 'reload_prompt') {
        // Reload system prompt from AGENTS.md and docs/
        this.systemPrompt = this.buildSystemPrompt();
        console.log('[Agent] System prompt reloaded');
        await this.telegram.sendDevlog(
          `🔄 <b>System Prompt 已重新載入！</b>\n\n` +
          `已重新讀取 AGENTS.md 和 docs/ 目錄。`
        );
        continue;
      }

      if (cmd.type === 'status_request') {
        const uptime = Math.round((Date.now() - this.startTime) / 60000);
        await this.telegram.sendDevlog(
          `📊 <b>Agent 狀態</b>\n\n` +
          `<b>模式:</b> tool_use\n` +
          `<b>回合:</b> ${this.turn}/${CONFIG.maxTurns}\n` +
          `<b>運行:</b> ${uptime} min\n` +
          `<b>對話長度:</b> ${this.messages.length} messages`
        );
      }

      if (cmd.type === 'must') {
        parts.push(`[ARCHITECT OVERRIDE] Urgent instruction: "${cmd.command}". Follow immediately.`);
        console.log(`[Agent] Injected must command: ${cmd.command}`);
      }

      if (cmd.type === 'rejection') {
        parts.push(
          `[ARCHITECT FEEDBACK] Submission REJECTED. Reason: "${cmd.command}". ` +
          `STOP WAITING and FIX THIS ISSUE. Do not wait for approval until the issue is resolved.`
        );
        console.log(`[Agent] Injected rejection: ${cmd.command}`);
        // Reset waiting state - rejection means work to do
        this.waitingCount = 0;
      }

      if (cmd.type === 'approval') {
        parts.push(
          `[ARCHITECT APPROVAL] H2Crypto has approved! You may now proceed to the NEXT PHASE. ` +
          `Stop waiting and continue development.`
        );
        console.log(`[Agent] Injected approval`);
        // Reset waiting state - approval means proceed
        this.waitingCount = 0;
      }

      if (cmd.type === 'question') {
        parts.push(
          `[ARCHITECT QUESTION] H2Crypto is asking: "${cmd.command}"\n\n` +
          `Please answer this question via Telegram (use send_telegram). ` +
          `After answering, check if you have an active task in work_in_progress.md. Otherwise wait.`
        );
        console.log(`[Agent] Injected question: ${cmd.command}`);
        // Reset waiting state - question needs response
        this.waitingCount = 0;
      }

      if (cmd.type === 'chat') {
        // Check for attached image
        if (cmd.imagePath && fs.existsSync(cmd.imagePath)) {
          try {
            const imageBuffer = fs.readFileSync(cmd.imagePath);
            const base64Image = imageBuffer.toString('base64');
            const mediaType = cmd.imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

            // Add multimodal message with image
            this.messages.push({
              role: 'user',
              content: [
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
                  text: `[H2CRYPTO MESSAGE with IMAGE] ${cmd.command || '(看圖片)'}\n\n` +
                    `H2Crypto sent you an image. Analyze it and respond appropriately.\n` +
                    `If it's a bug screenshot, identify and fix the issue.\n` +
                    `If it's a design reference, understand and apply the concept.`,
                },
              ],
            });
            console.log(`[Agent] Injected chat with image: ${cmd.imagePath}`);
          } catch (err) {
            console.error(`[Agent] Failed to read image: ${err.message}`);
            parts.push(`[H2CRYPTO MESSAGE] ${cmd.command} (圖片讀取失敗)`);
          }
        } else {
          parts.push(
            `[H2CRYPTO MESSAGE] ${cmd.command}\n\n` +
            `Handle this message appropriately:\n` +
            `- Bug report / issue → FIX IT immediately\n` +
            `- Question → Answer briefly via Telegram\n` +
            `- Instruction → Execute it\n` +
            `- Feedback → Acknowledge and apply it\n\n` +
            `IMPORTANT: After handling this message, CONTINUE with your current task.\n` +
            `Do NOT stop working unless H2Crypto explicitly tells you to stop.`
          );
        }
        console.log(`[Agent] Injected chat: ${cmd.command}`);
        // Reset waiting state - user is engaging
        this.waitingCount = 0;
      }
    }

    for (const fb of feedback) {
      if (fb.type === 'idea') {
        // Check if the "idea" is actually an urgent issue (error, bug, 404, etc.)
        const isUrgentIssue = /error|bug|404|500|問題|不行|失敗|壞|broken|fail|issue|can't|cannot|doesn't work|不能|沒有/i.test(fb.content || '');

        if (isUrgentIssue) {
          // Treat as urgent issue requiring immediate action
          parts.push(
            `[ARCHITECT FEEDBACK - URGENT ISSUE] H2Crypto reported a problem: "${fb.content}". ` +
            `This is NOT just a suggestion - this is a BUG REPORT that needs IMMEDIATE attention. ` +
            `STOP waiting for approval and FIX THIS ISSUE NOW. ` +
            `After fixing, verify the fix works, then resume your approval request.`
          );
          console.log(`[Agent] Urgent issue detected in feedback: ${fb.content}`);
          // Reset waiting state since we need to take action
          this.waitingCount = 0;
        } else {
          parts.push(`[ARCHITECT SUGGESTION] "${fb.content}" — consider in next iteration.`);
        }
      }
    }

    // Aggregate all injections into a single user message to maintain alternation
    if (parts.length > 0) {
      this.messages.push({
        role: 'user',
        content: parts.join('\n\n'),
      });
    }
  }

  // ============================================
  //  Context Pruning (safe cut points)
  // ============================================

  pruneContext() {
    if (this.messages.length <= CONFIG.maxMessages) return;

    console.log(
      `[Agent] Pruning context: ${this.messages.length} → ~${CONFIG.maxMessages} messages`
    );

    // Find safe cut points: indices of user messages with string content
    // These mark boundaries between complete tool-call cycles
    const safeCuts = [];
    for (let i = 4; i < this.messages.length; i++) {
      const msg = this.messages[i];
      if (msg.role === 'user' && typeof msg.content === 'string') {
        safeCuts.push(i);
      }
    }

    // Find the cut point that keeps roughly maxMessages
    const targetStart = this.messages.length - CONFIG.maxMessages + 3;
    let cutIndex = safeCuts.find((i) => i >= targetStart);

    if (!cutIndex) {
      // No ideal safe cut — use the last available, or fallback
      cutIndex = safeCuts[safeCuts.length - 1] || Math.max(4, this.messages.length - 20);
    }

    // Include the preceding assistant message to maintain alternation
    if (cutIndex > 0 && this.messages[cutIndex - 1].role === 'assistant') {
      cutIndex--;
    }

    const tail = this.messages.slice(cutIndex);

    this.messages = [
      this.messages[0], // Initial mission (user)
      {
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: 'Understood. I will check work_in_progress.md for any active task.',
          },
        ],
      },
      {
        role: 'user',
        content:
          '[CONTEXT NOTE] Earlier conversation messages were pruned to save context. ' +
          'v3 Architecture: Check work_in_progress.md - if active task exists, continue it. Otherwise wait for #dotask.',
      },
      ...tail,
    ];

    // Safety net: repair any broken pairs or alternation
    this.repairMessages();
    console.log(`[Agent] Context pruned to ${this.messages.length} messages`);
  }

  // ============================================
  //  Message Repair (orphaned tool_use/tool_result + alternation)
  // ============================================

  repairMessages() {
    console.log(`[Agent] Repairing messages (${this.messages.length} total)...`);

    // Debug: log structure before repair
    for (let i = 0; i < this.messages.length; i++) {
      const msg = this.messages[i];
      let desc = `[${i}] ${msg.role}: `;
      if (typeof msg.content === 'string') {
        desc += `text(${msg.content.slice(0, 50)}...)`;
      } else if (Array.isArray(msg.content)) {
        const types = msg.content.map((b) => {
          if (b.type === 'tool_use') return `tool_use(${b.id.slice(-8)})`;
          if (b.type === 'tool_result') return `tool_result(${b.tool_use_id.slice(-8)})`;
          return b.type;
        });
        desc += types.join(', ');
      }
      console.log(desc);
    }

    // Phase 1: Fix alternation — ensure strict user/assistant/user/assistant
    const alternated = [this.messages[0]];
    for (let i = 1; i < this.messages.length; i++) {
      const prev = alternated[alternated.length - 1];
      const curr = this.messages[i];

      if (prev.role === curr.role) {
        if (curr.role === 'user') {
          alternated.push({
            role: 'assistant',
            content: [{ type: 'text', text: 'Acknowledged.' }],
          });
        } else {
          alternated.push({ role: 'user', content: 'Continue.' });
        }
      }
      alternated.push(curr);
    }

    // Phase 2: Fix orphaned tool_use (assistant has tool_use but next user has no matching tool_result)
    for (let i = 0; i < alternated.length - 1; i++) {
      const msg = alternated[i];
      if (msg.role !== 'assistant' || !Array.isArray(msg.content)) continue;

      const toolUseIds = [];
      for (const block of msg.content) {
        if (block.type === 'tool_use') toolUseIds.push(block.id);
      }
      if (toolUseIds.length === 0) continue;

      // Check next message for matching tool_results
      const next = alternated[i + 1];
      const resultIds = new Set();
      if (next.role === 'user' && Array.isArray(next.content)) {
        for (const block of next.content) {
          if (block.type === 'tool_result') resultIds.add(block.tool_use_id);
        }
      }

      // Find orphaned tool_use ids
      const orphanedIds = toolUseIds.filter((id) => !resultIds.has(id));
      if (orphanedIds.length > 0) {
        console.log(`[Agent] Fixing ${orphanedIds.length} orphaned tool_use(s) at message ${i}`);
        // Remove orphaned tool_use blocks, keep text blocks
        const filtered = msg.content.filter((b) => {
          if (b.type === 'tool_use') return !orphanedIds.includes(b.id);
          return true;
        });
        if (filtered.length === 0) {
          // All were tool_use — replace with text
          alternated[i] = {
            role: 'assistant',
            content: [{ type: 'text', text: 'I was working on the project. Let me continue.' }],
          };
        } else {
          alternated[i] = { ...msg, content: filtered };
        }
      }
    }

    // Phase 3: Fix orphaned tool_results (user has tool_result but prev assistant has no matching tool_use)
    for (let i = 1; i < alternated.length; i++) {
      const msg = alternated[i];
      if (msg.role !== 'user' || !Array.isArray(msg.content)) continue;

      const hasToolResult = msg.content.some((b) => b.type === 'tool_result');
      if (!hasToolResult) continue;

      // Preceding message must be assistant (guaranteed after Phase 1)
      const prev = alternated[i - 1];
      const toolIds = new Set();
      if (Array.isArray(prev.content)) {
        for (const block of prev.content) {
          if (block.type === 'tool_use') toolIds.add(block.id);
        }
      }

      const valid = msg.content.filter((b) => {
        if (b.type === 'tool_result') return toolIds.has(b.tool_use_id);
        return true;
      });

      if (valid.length === 0) {
        // All tool_results were orphaned — replace with text
        alternated[i] = {
          role: 'user',
          content:
            '[System] Previous tool results were from a pruned context. Check work_in_progress.md for active task.',
        };
      } else if (valid.length < msg.content.length) {
        alternated[i] = { ...msg, content: valid };
      }
    }

    // Phase 4: Ensure all messages have non-empty content (Claude API requirement)
    for (let i = 0; i < alternated.length; i++) {
      const msg = alternated[i];
      const isEmpty = (
        msg.content === undefined ||
        msg.content === null ||
        msg.content === '' ||
        (Array.isArray(msg.content) && msg.content.length === 0)
      );

      if (isEmpty) {
        console.log(`[Agent] Fixing empty content at message ${i} (role: ${msg.role})`);
        if (msg.role === 'assistant') {
          alternated[i] = {
            role: 'assistant',
            content: [{ type: 'text', text: 'Continuing work...' }],
          };
        } else {
          alternated[i] = {
            role: 'user',
            content: '[System] Continue.',
          };
        }
      }
    }

    this.messages = alternated;
    console.log(`[Agent] Messages repaired → ${this.messages.length} messages`);
  }

  // ============================================
  //  State Persistence (resume after restart)
  // ============================================

  saveState() {
    try {
      const state = {
        messages: this.messages,
        turn: this.turn,
        savedAt: new Date().toISOString(),
      };
      fs.writeFileSync(STATE_FILE, JSON.stringify(state));
    } catch (err) {
      console.error('[Agent] Failed to save state:', err.message);
    }
  }

  loadState() {
    try {
      if (!fs.existsSync(STATE_FILE)) return false;
      const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      if (!data.messages || data.messages.length === 0) return false;

      this.messages = data.messages;
      this.turn = data.turn || 0;

      // Repair any broken state from the saved file
      this.repairMessages();

      // Ensure messages end with user message (required by Claude API)
      const last = this.messages[this.messages.length - 1];
      if (last.role !== 'user') {
        this.messages.push({
          role: 'user',
          content:
            '[SYSTEM] Agent was restarted. Check current project state with list_files and continue from where you left off.',
        });
      }

      console.log(
        `[Agent] Resumed from saved state: turn ${this.turn}, ${this.messages.length} messages`
      );
      return true;
    } catch (err) {
      console.error('[Agent] Failed to load state:', err.message);
      return false;
    }
  }

  // ============================================
  //  Git Initialization
  // ============================================

  async gitInit() {
    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO;
    if (!token || !repo) {
      console.log('[Agent] Git not configured (missing GITHUB_TOKEN or GITHUB_REPO)');
      return;
    }

    try {
      // Init repo if needed
      try {
        await execAsync('git rev-parse --is-inside-work-tree', { cwd: CONFIG.workDir });
      } catch {
        await execAsync('git init', { cwd: CONFIG.workDir });
      }

      // Configure remote
      const remoteUrl = `https://x-access-token:${token}@github.com/${repo}.git`;
      try {
        await execAsync('git remote remove origin', { cwd: CONFIG.workDir });
      } catch {
        /* no remote yet */
      }
      await execAsync(`git remote add origin ${remoteUrl}`, { cwd: CONFIG.workDir });

      // Configure user
      await execAsync('git config user.email "agent@solanahacker.ai"', { cwd: CONFIG.workDir });
      await execAsync('git config user.name "SolanaHacker Agent"', { cwd: CONFIG.workDir });

      console.log(`[Agent] Git configured: github.com/${repo}`);
    } catch (err) {
      console.error('[Agent] Git init failed:', err.message);
    }
  }

  // ============================================
  //  Heartbeat
  // ============================================

  startHeartbeat() {
    this.heartbeatTimer = setInterval(async () => {
      if (!this.isRunning) return;
      const uptime = Math.round((Date.now() - this.startTime) / 60000);
      await this.telegram.sendDevlog(
        `💓 <b>心跳</b> | 回合: ${this.turn}/${CONFIG.maxTurns} | 運行: ${uptime}min | 訊息: ${this.messages.length}`
      );
    }, CONFIG.heartbeatInterval);
    console.log(`[Agent] Heartbeat started (every ${CONFIG.heartbeatInterval / 60000}min)`);
  }

  // ============================================
  //  Standby Mode (for API credit exhaustion)
  // ============================================

  /**
   * Enter standby mode when API credits are exhausted.
   * Keeps server alive, polls Telegram for #clear_message command.
   * @param {string} reason - Why we entered standby
   */
  async enterStandbyMode(reason) {
    console.log(`[Agent] Entering standby mode: ${reason}`);
    this.inStandby = true;

    const pollInterval = 60000; // Check every 60 seconds
    let lastNotify = Date.now();
    const notifyInterval = 30 * 60 * 1000; // Remind every 30 minutes

    while (this.inStandby && this.isRunning) {
      await this.sleep(pollInterval);

      // Check for commands
      const commands = this.telegram.getMustCommands();

      for (const cmd of commands) {
        if (cmd.type === 'clear_message') {
          console.log('[Agent] Clear message command received in standby mode');
          await this.telegram.sendDevlog(
            `🧹 <b>對話記憶已清空！</b>\n\n` +
            `正在切換到 Chat Mode...`
          );

          // Clear state and exit standby - go to Chat Mode
          this.messages = [];
          this.turn = 0;
          this.currentMode = 'chat';
          this.processingTasklist = false;
          this.chatMode.clearChatHistory();
          try { fs.unlinkSync(STATE_FILE); } catch { /* ignore */ }

          this.inStandby = false;
          return;
        }

        if (cmd.type === 'reload_prompt') {
          console.log('[Agent] Reload prompt command received in standby mode');
          this.systemPrompt = this.buildSystemPrompt();
          await this.telegram.sendDevlog(
            `🔄 <b>System Prompt 已重新載入！</b>\n\n` +
            `已重新讀取 AGENTS.md 和 docs/ 目錄。\n` +
            `Agent 仍在待機模式。`
          );
          continue;
        }

        if (cmd.type === 'restart') {
          console.log('[Agent] Restart command received in standby mode');
          await this.telegram.sendDevlog('🔄 Agent 正在重啟...');
          setTimeout(() => process.exit(0), 2000);
          this.isRunning = false;
          this.inStandby = false;
          return;
        }
      }

      // Periodic reminder (every 30 minutes)
      if (Date.now() - lastNotify > notifyInterval) {
        await this.telegram.sendDevlog(
          `⏳ <b>Agent 待機中</b>\n\n` +
          `原因: ${reason}\n` +
          `請充值 API 後發送 <code>#clear_message</code> 重新啟動。`
        );
        lastNotify = Date.now();
      }

      console.log('[Agent] Standby: still waiting for reset...');
    }
  }

  // ============================================
  //  Utilities
  // ============================================

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async cleanup() {
    console.log('[Agent] Cleaning up...');
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);

    const devServer = this.getDevServer();
    if (devServer) devServer.kill();

    await this.reviewer.close();
    this.telegram.stop();
  }
}

// ============================================
//  Main Execution
// ============================================

const agent = new SolanaHackerAgent();

process.on('SIGINT', async () => {
  console.log('\nShutdown requested...');
  agent.isRunning = false;
  await agent.cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  agent.isRunning = false;
  await agent.cleanup();
  process.exit(0);
});

agent.run().catch(async (error) => {
  console.error('Fatal error:', error);

  // Check if it's an API credit issue - enter standby instead of crashing
  const msg = error.message || '';
  if (msg.includes('credit') || msg.includes('balance') || msg.includes('billing')) {
    console.log('[Agent] API credit error caught at top level - entering standby');
    try {
      await agent.telegram.sendDevlog(
        `🚨 <b>發生錯誤，Agent 進入待機模式</b>\n\n` +
        `<code>${msg.slice(0, 200)}</code>\n\n` +
        `發送 <code>#clear_message</code> 重新啟動。`
      );
      await agent.enterStandbyMode('Fatal error: ' + msg.slice(0, 100));

      // If we exit standby (reset received), restart the agent loop
      console.log('[Agent] Restarting agent loop after standby...');
      agent.run();
    } catch (standbyError) {
      console.error('Standby mode failed:', standbyError);
      await agent.cleanup();
      process.exit(1);
    }
  } else {
    // Non-recoverable error - exit
    await agent.cleanup();
    process.exit(1);
  }
});
