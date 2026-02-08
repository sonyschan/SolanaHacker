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
import { SKILL_REGISTRY, LOAD_SKILL_TOOL, loadSkill, getSkillHints } from './skills.js';
import { ChatMode } from './chat-mode.js';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================
//  Configuration
// ============================================

const CONFIG = {
  baseDir: '/home/projects/solanahacker',
  workDir: '/home/projects/solanahacker/app',
  knowledgeDir: '/home/projects/solanahacker/knowledge',
  memoryDir: '/home/projects/solanahacker/memory',
  docsDir: '/home/projects/solanahacker/docs',
  screenshotsDir: '/home/projects/solanahacker/screenshots',
  logsDir: '/home/projects/solanahacker/logs',
  devServerPort: 5173,
  heartbeatInterval: parseInt(process.env.HEARTBEAT_INTERVAL) || 1800000,
  uxThreshold: parseInt(process.env.UX_CONFIDENCE_THRESHOLD) || 90,
  model: 'claude-sonnet-4-20250514',
  maxTokens: 8192, // Tier 1 output limit: 8K/min for Sonnet
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
    // Claude API client
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
      workDir: CONFIG.workDir,
      knowledgeDir: CONFIG.knowledgeDir,
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

      const skill = loadSkill(skill_name, {
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
      claudeClient: this.client,
      memoryDir: CONFIG.memoryDir,
    });

    // Build system prompt (with embedded knowledge base)
    this.systemPrompt = this.buildSystemPrompt();
  }

  /**
   * Get tool names for a specific skill
   */
  getSkillToolNames(skillName) {
    const skillDef = loadSkill(skillName, { workDir: CONFIG.workDir, writer: this.writer });
    if (!skillDef) return [];
    return skillDef.tools.map((t) => t.name);
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

      // Bug solutions
      const bugsPath = path.join(knowledgeDir, 'bugs.md');
      if (fs.existsSync(bugsPath)) {
        const content = fs.readFileSync(bugsPath, 'utf-8');
        longTermMemory += `\n\n### Bug Solutions (searchable)\n${content.slice(0, 3000)}`;
      }
    }

    // Load reference knowledge base
    let refKnowledge = '';
    if (fs.existsSync(CONFIG.knowledgeDir)) {
      const files = fs
        .readdirSync(CONFIG.knowledgeDir)
        .filter((f) => f.endsWith('.md') || f.endsWith('.txt'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(CONFIG.knowledgeDir, file), 'utf-8');
        refKnowledge += `\n\n### ${file}\n${content.slice(0, 2000)}`;
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

## Reference Knowledge Base
${refKnowledge || '(No knowledge files found)'}

---

${getSkillHints()}

---

## Quick Reference

### Environment
- Base: ${CONFIG.baseDir}
- App: ${CONFIG.workDir}
- Memory: ${CONFIG.memoryDir}
- Public URL: http://165.22.136.40:${CONFIG.devServerPort}

### Phase Thresholds
- Approval required at 90% confidence
- UX score threshold: ${CONFIG.uxThreshold}%

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

    // Send startup message
    await this.telegram.sendDevlog(
      `🤖 <b>SolanaHacker 上線了！</b>\n\n` +
      `目前模式: 💬 <b>Chat Mode</b>\n\n` +
      `我會在這裡跟你聊天、搜尋新聞、回答問題。\n\n` +
      `📋 指令:\n` +
      `• <code>#chat [訊息]</code> - 跟我聊天\n` +
      `• <code>#devmode</code> - 切換到開發模式\n` +
      `• <code>#addtask [任務]</code> - 新增待辦任務\n` +
      `• <code>#tasklist</code> - 查看待辦清單\n` +
      `• <code>#dotask</code> - 立即處理待辦任務\n` +
      `• <code>#sleep</code> - 今天不再主動打擾\n` +
      `• <code>/status</code> - 查看狀態\n\n` +
      `有什麼想聊的嗎？☕`
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

  async modeLoop() {
    while (this.isRunning) {
      if (this.currentMode === 'chat') {
        await this.chatModeLoop();
      } else {
        // Dev Mode - check for existing project on first entry
        await this.agentLoop(true); // Always try to continue existing work
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
        // Mode switch request
        if (cmd.type === 'mode_switch') {
          if (cmd.command === 'dev') {
            await this.switchToDevMode();
            return; // Exit chat loop
          }
          // Already in chat mode
          if (cmd.command === 'chat') {
            await this.telegram.sendDevlog('💬 已經在 Chat Mode 了！');
          }
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

        // Process tasks now - switch to Dev Mode with task list
        if (cmd.type === 'process_tasks') {
          await this.processTasksNow();
          return; // Exit chat loop, now in Dev Mode
        }

        // Sleep mode
        if (cmd.type === 'sleep_today') {
          this.chatMode.activateSleep();
          continue;
        }

        // Stop
        if (cmd.type === 'stop') {
          this.isRunning = false;
          return;
        }

        // Reset - clear state and stay in Chat Mode
        if (cmd.type === 'reset') {
          this.messages = [];
          this.turn = 0;
          this.waitingCount = 0;
          this.chatMode.resetSleep();
          this.loadedSkills.clear();
          this.skillTools = [];
          this.skillExecutors = {};
          try { fs.unlinkSync(STATE_FILE); } catch { /* ignore */ }
          await this.telegram.sendDevlog(
            `🔄 <b>已重置到 Chat Mode！</b>\n\n` +
            `記憶已清空，有什麼想聊的？`
          );
          continue;
        }

        // Chat message
        if (cmd.type === 'chat') {
          await this.chatMode.handleChat(cmd.command);
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

  async switchToDevMode() {
    console.log('[Agent] Switching to Dev Mode...');
    await this.telegram.sendDevlog('🔄 正在切換到 Dev Mode，檢查專案狀態...');

    // Check for saved Dev Mode state first
    const savedState = this.chatMode.loadDevModeState();

    // Check for existing project files
    let projectInfo = '';
    try {
      const { stdout } = await execAsync(
        `find ${CONFIG.workDir} -type f \\( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" -o -name "package.json" \\) 2>/dev/null | head -20`
      );
      const files = stdout.trim().split('\n').filter(Boolean);

      if (files.length > 0) {
        // Read package.json for project name
        const pkgPath = path.join(CONFIG.workDir, 'package.json');
        if (fs.existsSync(pkgPath)) {
          try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
            projectInfo = pkg.name || 'Unknown';
          } catch { projectInfo = 'Unknown'; }
        }
      }
    } catch (err) {
      console.log('[Agent] Error checking project:', err.message);
    }

    this.currentMode = 'dev';

    // Prepare status message
    let statusMsg = `🛠️ <b>已切換到 Dev Mode！</b>\n\n`;

    if (savedState) {
      statusMsg += `📂 <b>找到保存的進度</b>\n`;
      statusMsg += `我會繼續之前的工作。\n\n`;
    } else if (projectInfo) {
      statusMsg += `📂 <b>發現現有專案:</b> ${projectInfo}\n`;
      statusMsg += `我會檢查專案狀態並繼續開發。\n\n`;
    } else {
      statusMsg += `📂 沒有找到現有專案，準備從頭開始。\n\n`;
    }

    statusMsg += `📋 Dev Mode 指令:\n`;
    statusMsg += `• <code>#chat [訊息]</code> - 跟我說話\n`;
    statusMsg += `• <code>#chatmode</code> - 切換回聊天模式\n`;
    statusMsg += `• <code>#approve</code> - 批准\n`;
    statusMsg += `• <code>#reject [原因]</code> - 退回\n`;
    statusMsg += `• <code>#tasklist</code> - 待辦清單`;

    await this.telegram.sendDevlog(statusMsg);
  }

  async switchToChatMode() {
    console.log('[Agent] Switching to Chat Mode...');
    await this.telegram.sendDevlog('🔄 正在結束手邊工作，切換到 Chat Mode...');

    // Save current state
    const currentTask = this.loadCurrentTaskState();
    await this.chatMode.saveDevModeState(currentTask);

    this.currentMode = 'chat';
    await this.telegram.sendDevlog(
      `💬 <b>已切換到 Chat Mode！</b>\n\n` +
      `開發進度已保存，下次回到 Dev Mode 時會繼續。\n\n` +
      `有什麼想聊的嗎？`
    );
  }

  /**
   * Check if there are pending tasks in tasklist
   * @returns {string|null} - Pending tasks content or null if none
   */
  getPendingTasks() {
    const tasksPath = path.join(CONFIG.memoryDir, 'journal', 'pending_tasks.md');
    if (!fs.existsSync(tasksPath)) return null;

    const content = fs.readFileSync(tasksPath, 'utf-8');
    // Check for uncompleted tasks
    if (!content.includes('- [ ]')) return null;

    // Extract only uncompleted tasks
    const lines = content.split('\n');
    const pendingLines = lines.filter(line => line.includes('- [ ]'));
    return pendingLines.length > 0 ? pendingLines.join('\n') : null;
  }

  /**
   * Clear completed tasks from tasklist (auto-cleanup)
   */
  clearCompletedTasks() {
    const tasksPath = path.join(CONFIG.memoryDir, 'journal', 'pending_tasks.md');
    if (!fs.existsSync(tasksPath)) return;

    const content = fs.readFileSync(tasksPath, 'utf-8');
    const lines = content.split('\n');

    // Keep header and uncompleted tasks only
    const kept = lines.filter(line => {
      if (line.startsWith('#') || line.startsWith('>') || line.trim() === '') return true;
      if (line.includes('- [ ]')) return true; // Keep uncompleted
      if (line.includes('- [x]')) return false; // Remove completed
      return true; // Keep other lines
    });

    fs.writeFileSync(tasksPath, kept.join('\n'));
    console.log('[Agent] Cleared completed tasks from tasklist');
  }

  /**
   * Save current work context to short-term memory before switching to tasks
   */
  saveCurrentWorkContext() {
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
   * Process pending tasks immediately (#tasknow command)
   * Loads task list and switches to Dev Mode with task-focused instructions
   */
  async processTasksNow() {
    console.log('[Agent] Processing tasks now...');

    const pendingTasks = this.getPendingTasks();

    if (!pendingTasks) {
      await this.telegram.sendDevlog('📋 待辦清單是空的！沒有任務需要處理。');
      return;
    }

    // Save current work context before switching
    this.saveCurrentWorkContext();

    // Switch to Dev Mode
    this.currentMode = 'dev';

    // Set task processing flag
    this.processingTasklist = true;

    // Clear previous messages and set task-focused initial prompt
    this.messages = [];
    this.turn = 0;
    this.waitingCount = 0;

    // Add task-focused initial message
    this.messages.push({
      role: 'user',
      content:
        `[TASK MODE - HIGH PRIORITY] H2Crypto says: Process these pending tasks NOW.\n\n` +
        `## Pending Tasks\n${pendingTasks}\n\n` +
        `Instructions:\n` +
        `1. Read each task carefully\n` +
        `2. Work through them one by one\n` +
        `3. After completing EACH task, use write_file to update pending_tasks.md:\n` +
        `   - Change "- [ ]" to "- [x]" for the completed task\n` +
        `4. Send Telegram update after completing each task\n` +
        `5. After ALL tasks are done:\n` +
        `   - Send summary to Telegram\n` +
        `   - Read paused_work.md to see what you were doing before\n` +
        `   - Resume that previous work\n\n` +
        `Start now!`
    });

    await this.telegram.sendDevlog(
      `🚀 <b>開始處理待辦任務！</b>\n\n` +
      `已切換到 Dev Mode，正在處理：\n\n` +
      `<pre>${pendingTasks.slice(0, 500)}</pre>`
    );

    // Clear state file since we're starting fresh with tasks
    try { fs.unlinkSync(STATE_FILE); } catch { /* ignore */ }
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
          if (cmd.type === 'stop') {
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
    // Check for reset command BEFORE loading state
    const pendingCommands = this.telegram.peekMustCommands();
    const hasReset = pendingCommands.some(cmd => cmd.type === 'reset');
    if (hasReset) {
      console.log('[Agent] Reset command pending - skipping state load, switching to Chat Mode');
      // Consume the reset command
      this.telegram.getMustCommands();
      // Clear state
      this.messages = [];
      this.turn = 0;
      this.waitingCount = 0;
      this.currentMode = 'chat';
      this.loadedSkills.clear();
      this.skillTools = [];
      this.skillExecutors = {};
      this.chatMode.resetSleep();
      try { fs.unlinkSync(STATE_FILE); } catch { /* ignore */ }
      await this.telegram.sendDevlog(
        `🔄 <b>已重置到 Chat Mode！</b>\n\n` +
        `記憶已清空，有什麼想聊的？`
      );
      return; // Exit agentLoop, modeLoop will enter chatModeLoop
    }

    // Try to resume from saved state
    const resumed = this.loadState();

    if (resumed) {
      // Notify architect that we're resuming from saved conversation
      await this.telegram.sendDevlog(
        `🔄 <b>Agent 從上次對話繼續</b>\n` +
        `回合: ${this.turn}, 訊息: ${this.messages.length}`
      );
    } else if (continueExisting) {
      // Have existing project files but no saved conversation — analyze and continue
      this.messages.push({
        role: 'user',
        content:
          'You are resuming work on an EXISTING project. The architect has approved continuing this project.\n\n' +
          'IMPORTANT: Do NOT brainstorm a new idea. Instead:\n' +
          '1. Use list_files to see what already exists\n' +
          '2. Read key files (package.json, src/App.jsx, etc.) to understand the current state\n' +
          '3. Use review_ux to assess current progress\n' +
          '4. Continue building from where the project left off\n' +
          '5. Send a Telegram update summarizing what you found and your plan to continue',
      });
    } else {
      // Fresh start
      this.messages.push({
        role: 'user',
        content:
          'You are now active. Begin your mission. ' +
          'Start by reading the knowledge base for inspiration, ' +
          'then brainstorm a unique product idea, build it, and iterate until the UX score reaches the threshold.',
      });
    }

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

      // === TASK PRIORITY CHECK ===
      // Tasklist tasks have higher priority than current work
      // Check every 10 turns or when not actively processing tasks
      if (!this.processingTasklist && this.turn % 10 === 0) {
        const pendingTasks = this.getPendingTasks();
        if (pendingTasks) {
          console.log('[Agent] Found pending tasks in tasklist - switching to task mode');
          this.saveCurrentWorkContext();
          this.processingTasklist = true;

          // Inject high-priority task message
          this.messages.push({
            role: 'user',
            content:
              `[HIGH PRIORITY - TASKLIST] New tasks have been added to your tasklist.\n\n` +
              `STOP your current work and process these tasks FIRST:\n\n` +
              `${pendingTasks}\n\n` +
              `Instructions:\n` +
              `1. Process each task\n` +
              `2. Mark completed tasks as [x] in pending_tasks.md\n` +
              `3. After ALL tasks done, read paused_work.md and resume previous work`
          });

          await this.telegram.sendDevlog(
            `📋 <b>發現新任務！</b>\n\n` +
            `正在優先處理待辦清單...`
          );
        }
      }

      // Check if tasklist processing is complete (no more pending tasks)
      if (this.processingTasklist) {
        const stillPending = this.getPendingTasks();
        if (!stillPending) {
          console.log('[Agent] Tasklist completed - clearing completed tasks');
          this.clearCompletedTasks();
          this.processingTasklist = false;

          // Remind agent to resume previous work
          this.messages.push({
            role: 'user',
            content:
              `[TASKLIST COMPLETE] All tasks have been completed!\n\n` +
              `Now read paused_work.md to resume your previous work.`
          });

          await this.telegram.sendDevlog(
            `✅ <b>待辦任務全部完成！</b>\n\n` +
            `正在恢復之前的工作...`
          );
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
            this.messages = [{
              role: 'user',
              content:
                'Your previous conversation encountered an error and was reset. ' +
                'IMPORTANT: First read memory/journal/current_task.md to check your current PHASE (IDEA/POC/MVP/SUBMIT). ' +
                'Do NOT regress to an earlier phase. If current_task says MVP, continue MVP work. ' +
                'If current_task says POC approved, proceed to MVP. ' +
                'Then check the project state with list_files, review_ux, and continue from your current phase.',
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

        // Check if agent is in "waiting" state (for approval, response, feedback, etc.)
        const lowerText = lastText.toLowerCase();
        const isWaiting = (
          // Waiting for approval
          (lowerText.includes('waiting') && lowerText.includes('approv')) ||
          // Waiting for H2Crypto response
          (lowerText.includes('waiting') && lowerText.includes('h2crypto')) ||
          (lowerText.includes('waiting') && lowerText.includes('response')) ||
          // Chinese patterns
          lowerText.includes('等待') ||
          lowerText.includes('請回覆') ||
          // Explicit wait signals
          lowerText.includes('i will wait') ||
          lowerText.includes('i am waiting')
        );

        if (isWaiting) {
          this.waitingCount = (this.waitingCount || 0) + 1;
          console.log(`[Agent] Waiting state detected (${this.waitingCount}/3)`);

          // Enter idle mode immediately after 1 waiting turn (save tokens)
          if (this.waitingCount >= 1) {
            console.log('[Agent] Entering idle mode - waiting for H2Crypto');
            continue; // Skip nudge, go to idle check at loop start
          }
        } else {
          // Reset waiting counter if doing something else
          this.waitingCount = 0;
        }

        // Nudge agent to continue work (not waiting)
        // Remind them of phase requirements
        this.messages.push({
          role: 'user',
          content:
            '[SYSTEM - NOT H2Crypto] You signaled end_turn but should continue working.\n\n' +
            'IMPORTANT REMINDERS:\n' +
            '1. MVP phase requires UX score >= 90% before requesting approval\n' +
            '2. If UX score is below 90%, keep improving - do NOT ask for approval\n' +
            '3. Use review_ux to check current score\n' +
            '4. If you fixed a bug from #chat, return to your previous task (check current_task.md)\n' +
            '5. Only wait if you EXPLICITLY need H2Crypto input on a decision\n\n' +
            'Read current_task.md and continue your work.',
        });
        continue;
      }

      if (response.stop_reason === 'tool_use') {
        const toolResults = [];

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
              // Check if it's a skill tool that hasn't been loaded
              const requiredSkill = SKILL_REGISTRY.find((s) => {
                const skillDef = loadSkill(s.name, { workDir: CONFIG.workDir, writer: this.writer });
                return skillDef && skillDef.tools.some((t) => t.name === toolName);
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

    // 3. Cache messages - find safe cache point (last complete user turn before current)
    // We want to cache stable conversation history, not the most recent exchange
    const cachedMessages = this.messages.map((msg, index) => {
      // For multi-turn caching: cache the user message that's 2 turns back
      // This creates a stable prefix that gets reused as conversation grows
      const isCacheCandidate =
        msg.role === 'user' &&
        typeof msg.content === 'string' &&
        index > 0 &&
        index === this.messages.length - 3; // Cache 2nd-to-last user message

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

    return {
      model: CONFIG.model,
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
        const response = await this.client.messages.create(request);

        // Log cache performance (available in response.usage)
        if (response.usage) {
          const { cache_creation_input_tokens, cache_read_input_tokens, input_tokens } = response.usage;
          if (cache_read_input_tokens > 0) {
            const savings = Math.round((cache_read_input_tokens / (cache_read_input_tokens + input_tokens)) * 90);
            console.log(`[Cache] Hit! Read: ${cache_read_input_tokens} tokens (~${savings}% cost saved)`);
          } else if (cache_creation_input_tokens > 0) {
            console.log(`[Cache] Created: ${cache_creation_input_tokens} tokens (will save on next call)`);
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
            `請充值後發送 <code>#reset_agent</code> 重新啟動。\n\n` +
            `<i>Server 保持運行，無需 SSH 重啟。</i>`
          );

          // Enter standby mode - don't crash, just wait for reset
          await this.enterStandbyMode('API credits exhausted');

          // After standby mode exits (reset received), retry
          continue;
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
      if (cmd.type === 'stop') {
        this.isRunning = false;
        console.log('[Agent] Stop command received');
        return;
      }

      // Mode switch to chat - need to wrap up and exit agentLoop
      if (cmd.type === 'mode_switch' && cmd.command === 'chat') {
        console.log('[Agent] Mode switch to chat requested');
        await this.switchToChatMode();
        return; // Exit injectCommands, agentLoop will exit on next iteration
      }

      // Already in dev mode
      if (cmd.type === 'mode_switch' && cmd.command === 'dev') {
        await this.telegram.sendDevlog('🛠️ 已經在 Dev Mode 了！');
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

      if (cmd.type === 'reset') {
        // Reset to Chat Mode (default)
        this.messages = [];
        this.turn = 0;
        this.waitingCount = 0;
        this.currentMode = 'chat';
        this.loadedSkills.clear();
        this.skillTools = [];
        this.skillExecutors = {};
        this.chatMode.resetSleep();
        try { fs.unlinkSync(STATE_FILE); } catch { /* ignore */ }
        console.log('[Agent] Reset: switching to Chat Mode');
        await this.telegram.sendDevlog(
          `🔄 <b>已重置到 Chat Mode！</b>\n\n` +
          `記憶已清空，有什麼想聊的？`
        );
        return; // Exit injectCommands, agentLoop will exit, modeLoop will enter chatModeLoop
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
          `After answering, continue with your current work.`
        );
        console.log(`[Agent] Injected question: ${cmd.command}`);
        // Reset waiting state - question needs response
        this.waitingCount = 0;
      }

      if (cmd.type === 'chat') {
        parts.push(
          `[H2CRYPTO MESSAGE] ${cmd.command}\n\n` +
          `Handle this message appropriately:\n` +
          `- Bug report / issue → FIX IT, then return to your previous task\n` +
          `- Question → Answer via Telegram, then continue working\n` +
          `- Instruction → Execute it, then return to your previous task\n` +
          `- Feedback → Acknowledge and apply it\n\n` +
          `CRITICAL: After handling this message:\n` +
          `1. Read current_task.md to remember your PHASE and what you were doing\n` +
          `2. Check UX score with review_ux if in POC/MVP phase\n` +
          `3. If UX < 90%, CONTINUE IMPROVING - do NOT request approval\n` +
          `4. Return to your previous work - DO NOT ask H2Crypto what to do next`
        );
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
            text: 'Understood. I will check the current project state and continue working.',
          },
        ],
      },
      {
        role: 'user',
        content:
          '[CONTEXT NOTE] Earlier conversation messages were pruned to save context. ' +
          'The project is in progress. Use list_files and review_ux to understand current state before making changes.',
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
            '[System] Previous tool results were from a pruned context. Continue working on the project.',
        };
      } else if (valid.length < msg.content.length) {
        alternated[i] = { ...msg, content: valid };
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
   * Keeps server alive, polls Telegram for #reset_agent command.
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
        if (cmd.type === 'reset') {
          console.log('[Agent] Reset command received in standby mode');
          await this.telegram.sendDevlog(
            `🔄 <b>收到重置指令！</b>\n\n` +
            `正在重新啟動 Agent...`
          );

          // Clear state and exit standby
          this.messages = [{
            role: 'user',
            content:
              'Agent was restarted after API credit recovery. ' +
              'Check project state with list_files and continue from where you left off.',
          }];
          this.turn = 0;
          try { fs.unlinkSync(STATE_FILE); } catch { /* ignore */ }

          this.inStandby = false;
          return;
        }

        if (cmd.type === 'stop') {
          console.log('[Agent] Stop command received in standby mode');
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
          `請充值 API 後發送 <code>#reset_agent</code> 重新啟動。`
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
        `發送 <code>#reset_agent</code> 重新啟動。`
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
