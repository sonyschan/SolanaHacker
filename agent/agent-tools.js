/**
 * Agent Tools — Core tool definitions and executors for Claude API tool_use
 *
 * This module defines CORE tools that are always available.
 * Specialized tools (Gemini, Grok, X.AI) are in skills.js and loaded on-demand.
 *
 * Architecture:
 *   - Core tools: ~15 essential tools, always loaded
 *   - Skills: Loaded via load_skill tool when needed
 *   - Token savings: ~500-1000 tokens per API call
 */

import fs from 'fs';
import path from 'path';
import { exec, execFile, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

// ============================================
//  Tool Definitions (for Claude API)
// ============================================

export const TOOL_DEFINITIONS = [
  // --- File System ---
  {
    name: 'read_file',
    description: 'Read the contents of a file in the project directory.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'File path relative to project root (e.g., "src/App.jsx", "package.json")',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description:
      'Write content to a file. Creates parent directories if needed. Use this for all code creation and editing.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'File path relative to project root',
        },
        content: {
          type: 'string',
          description: 'Complete file content to write',
        },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'list_files',
    description: 'List files and directories. Use to understand project structure.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Directory path relative to project root. Default: root.',
        },
        recursive: {
          type: 'boolean',
          description: 'List recursively (skips node_modules and .git). Default: false.',
        },
      },
    },
  },

  // --- Shell ---
  {
    name: 'run_command',
    description:
      'Execute a shell command in the project directory. Use for npm install, build checks, system fixes, etc. Dangerous commands are blocked. Tip: if "npm install" fails, try "npm install --legacy-peer-deps".',
    input_schema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'Shell command to run',
        },
        timeout_ms: {
          type: 'number',
          description: 'Timeout in milliseconds. Default: 120000 (2 min).',
        },
      },
      required: ['command'],
    },
  },

  // --- Dev Server ---
  {
    name: 'dev_server',
    description:
      'Control the Vite development server. Must be running for screenshots and UX reviews.',
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

  // --- Review ---
  {
    name: 'take_screenshot',
    description:
      'Take a screenshot of the running dev server page. Returns the screenshot file path.',
    input_schema: {
      type: 'object',
      properties: {
        viewport: {
          type: 'string',
          enum: ['desktop', 'mobile'],
          description: 'Viewport size. desktop: 1280x720. mobile: 375x812. Default: desktop.',
        },
      },
    },
  },
  {
    name: 'review_ux',
    description:
      'Run full 2-stage UX review. Stage 1: Hard Metrics (build OK, no runtime errors, no white screen). Stage 2: Claude Vision assessment (desktop + mobile screenshots scored on visual hierarchy, first impression, usability, web3 UX, aesthetics). Returns JSON with combinedScore (0-100), issues, and improvement suggestions. Dev server must be running.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },

  // --- Communication ---
  {
    name: 'send_telegram',
    description:
      'Send a message to the human architect via Telegram. Use HTML formatting (<b>, <code>, <pre>). Report progress after every major milestone.',
    input_schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Message text (HTML format supported)',
        },
        screenshot_path: {
          type: 'string',
          description: 'Optional: absolute path to screenshot image to attach',
        },
      },
      required: ['message'],
    },
  },
  {
    name: 'request_approval',
    description:
      'Request human approval before submitting to Colosseum. BLOCKS until the architect responds with #approve or #reject. Only use when UX combinedScore >= 90%.',
    input_schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Description of what you are requesting approval for',
        },
        screenshot_path: {
          type: 'string',
          description: 'Optional screenshot to include with the approval request',
        },
      },
      required: ['message'],
    },
  },

  // --- Git ---
  {
    name: 'git_commit_push',
    description:
      'Stage all changes in the project directory, commit with the given message, and push to GitHub. Use after each significant code change.',
    input_schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Commit message',
        },
      },
      required: ['message'],
    },
  },

  // --- Colosseum ---
  {
    name: 'colosseum_project',
    description: 'Manage your Colosseum hackathon project submission.',
    input_schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['create', 'update', 'submit', 'get'],
          description:
            'create: Create draft project. update: Update project info. submit: Lock and submit (REQUIRES prior approval via request_approval!). get: Get current project status.',
        },
        data: {
          type: 'object',
          description:
            'Project data for create/update actions. Fields: name (string), description (string), repoUrl (string), tags (string[]), solanaIntegration (string).',
        },
      },
      required: ['action'],
    },
  },

  // --- Knowledge Base ---
  {
    name: 'read_knowledge',
    description:
      'Read reference documentation from the knowledge base. Contains patterns from IdleTrencher (3D portfolio visualization), TraderHan (trading bot), Beedog (farm game), and Solana development skills.',
    input_schema: {
      type: 'object',
      properties: {
        filename: {
          type: 'string',
          description:
            'File to read: "idletrencher.md", "traderhan.md", "beedog.md", "solana-skills.md". Omit to list available files.',
        },
      },
    },
  },

  // --- Memory System ---
  {
    name: 'write_journal',
    description:
      'Write an entry to today\'s journal (short-term memory). Use to log significant actions, learnings, and bug fixes. This helps maintain context across restarts.',
    input_schema: {
      type: 'object',
      properties: {
        entry: {
          type: 'string',
          description: 'Journal entry content (Markdown format)',
        },
        type: {
          type: 'string',
          enum: ['action', 'learning', 'bug_fix', 'blocker', 'decision'],
          description: 'Type of entry for organization',
        },
      },
      required: ['entry', 'type'],
    },
  },
  {
    name: 'update_current_task',
    description:
      'Update the current_task.md file to track what you\'re working on. Use when starting a new task or when task status changes.',
    input_schema: {
      type: 'object',
      properties: {
        phase: {
          type: 'string',
          enum: ['IDEA', 'POC', 'MVP', 'SUBMIT', 'WAITING'],
          description: 'Current hackathon phase',
        },
        status: {
          type: 'string',
          description: 'Brief status (e.g., "Building feature X", "Waiting for approval")',
        },
        next_steps: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of next steps to take',
        },
        blockers: {
          type: 'array',
          items: { type: 'string' },
          description: 'Any blockers or things needed from H2Crypto',
        },
      },
      required: ['phase', 'status'],
    },
  },
  {
    name: 'add_bug_solution',
    description:
      'Add a bug solution to long-term memory (knowledge/bugs.md). Use when you solve a bug that might recur. This helps future debugging.',
    input_schema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Category (e.g., "Solana", "React", "Vite", "Claude API")',
        },
        error: {
          type: 'string',
          description: 'The error message or symptom',
        },
        context: {
          type: 'string',
          description: 'When/where the error occurs',
        },
        root_cause: {
          type: 'string',
          description: 'Why it happened',
        },
        solution: {
          type: 'string',
          description: 'How to fix it',
        },
        prevention: {
          type: 'string',
          description: 'How to avoid in future',
        },
      },
      required: ['category', 'error', 'solution'],
    },
  },
  {
    name: 'remember',
    description:
      'Add an item to long-term memory (values.md). Use when H2Crypto says "Remember" or "記得" to store important preferences or guidance.',
    input_schema: {
      type: 'object',
      properties: {
        item: {
          type: 'string',
          description: 'The thing to remember',
        },
      },
      required: ['item'],
    },
  },
  {
    name: 'search_memory',
    description:
      'Search long-term memory for relevant patterns, bug solutions, or decisions. Use before implementing similar features or when encountering errors.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (keywords or error message)',
        },
        type: {
          type: 'string',
          enum: ['bugs', 'patterns', 'decisions', 'all'],
          description: 'Which memory file(s) to search. Default: all.',
        },
      },
      required: ['query'],
    },
  },

  // --- Tasklist Management ---
  {
    name: 'complete_task',
    description:
      'Mark a task as completed. This will: 1) Mark the task as done in pending_tasks.md, 2) Save it to memory/completed_tasks/ with metadata, 3) Update index.md with last 10 completed tasks. Use this IMMEDIATELY after completing each task.',
    input_schema: {
      type: 'object',
      properties: {
        task_text: {
          type: 'string',
          description: 'The beginning of the task text to mark as complete (enough to uniquely identify it)',
        },
        summary: {
          type: 'string',
          description: 'Brief summary of what was accomplished (1-2 sentences)',
        },
        tokens_used: {
          type: 'object',
          description: 'Token usage for this task',
          properties: {
            input: { type: 'number', description: 'Input tokens used' },
            output: { type: 'number', description: 'Output tokens used' },
          },
        },
      },
      required: ['task_text', 'summary'],
    },
  },

];

// Note: web_search, write_research, write_devlog, generate_image, and X.AI analysis tools
// have been moved to skills.js for on-demand loading to save tokens.

// ============================================
//  Tool Executor Factory
// ============================================

// Commands that could kill the agent itself or destroy the system
const DANGEROUS_CMD =
  /rm\s+-rf\s+\/|mkfs|dd\s+if=|shutdown|reboot|:()\s*\{|wget.*\|\s*sh|curl.*\|\s*sh|pkill\s+(-f\s+)?node|killall\s+node|pkill\s+(-f\s+)?agent|kill\s+-9\s+\$\$|kill\s+-9\s+\$PPID/i;

/**
 * Create tool executors bound to agent dependencies.
 *
 * @param {object} deps
 * @param {string} deps.workDir - Project working directory
 * @param {string} deps.knowledgeDir - Knowledge base directory
 * @param {string} deps.screenshotsDir - Screenshot output directory
 * @param {number} deps.devServerPort - Dev server port
 * @param {object} deps.telegram - TelegramBridge instance
 * @param {object} deps.reviewer - UXReviewer instance
 * @param {object} deps.colosseum - ColosseumAPI instance (or null)
 * @returns {{ executors: Record<string, Function>, getDevServer: Function }}
 */
export function createToolExecutors(deps) {
  const {
    workDir,
    knowledgeDir,
    screenshotsDir,
    devServerPort,
    telegram,
    reviewer,
    colosseum,
  } = deps;

  // Mutable dev server reference
  let devServer = null;

  /**
   * Resolve a relative path safely within workDir
   */
  function resolveProjectPath(relativePath) {
    const resolved = path.resolve(workDir, relativePath);
    if (!resolved.startsWith(workDir)) {
      throw new Error(`Path escape blocked: ${relativePath}`);
    }
    return resolved;
  }

  /**
   * Kill any process using the dev server port
   */
  async function killPortProcess() {
    try {
      const { stdout } = await execAsync(`lsof -ti:${devServerPort} 2>/dev/null || true`);
      if (stdout.trim()) {
        const pids = stdout.trim().split('\n');
        for (const pid of pids) {
          try {
            await execAsync(`kill -9 ${pid}`);
            console.log(`[Dev] Killed process ${pid} using port ${devServerPort}`);
          } catch { /* ignore */ }
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
    } catch (err) {
      console.log(`[Dev] Port check error: ${err.message}`);
    }
  }

  /**
   * Start the Vite dev server (shared by start and restart)
   */
  async function startServer() {
    // Always ensure port is free before starting
    await killPortProcess();

    devServer = spawn('npm', ['run', 'dev', '--', '--host', '0.0.0.0'], {
      cwd: workDir,
      stdio: 'pipe',
      env: { ...process.env },
    });

    let output = '';
    devServer.stdout.on('data', (d) => {
      output += d.toString();
      console.log(`[Dev] ${d}`);
    });
    devServer.stderr.on('data', (d) => {
      output += d.toString();
      console.error(`[Dev Error] ${d}`);
    });
    devServer.on('exit', (code) => {
      console.log(`[Dev] Server exited with code ${code}`);
      devServer = null;
    });

    // Wait for server to be ready
    await new Promise((r) => setTimeout(r, 5000));
    return `Dev server started on http://localhost:${devServerPort}\n${output.slice(0, 1000)}`;
  }

  // --- Tool executor functions ---
  const executors = {
    async read_file({ path: filePath }) {
      const full = resolveProjectPath(filePath);
      if (!fs.existsSync(full)) {
        return `Error: File not found: ${filePath}`;
      }
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        return `Error: "${filePath}" is a directory. Use list_files instead.`;
      }
      const content = fs.readFileSync(full, 'utf-8');
      if (content.length > 50000) {
        return content.slice(0, 50000) + `\n\n[...truncated, file is ${content.length} chars]`;
      }
      return content;
    },

    async write_file({ path: filePath, content }) {
      const full = resolveProjectPath(filePath);
      const dir = path.dirname(full);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(full, content);
      return `Written: ${filePath} (${content.length} chars)`;
    },

    async list_files({ path: dirPath = '', recursive = false }) {
      const full = resolveProjectPath(dirPath || '.');
      if (!fs.existsSync(full)) {
        return `Error: Directory not found: ${dirPath || '.'}`;
      }
      const results = [];
      const walk = (dir, prefix = '') => {
        let entries;
        try {
          entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
          return;
        }
        for (const entry of entries) {
          if (entry.name === 'node_modules' || entry.name === '.git') continue;
          const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
          if (entry.isDirectory()) {
            results.push(`${rel}/`);
            if (recursive) walk(path.join(dir, entry.name), rel);
          } else {
            results.push(rel);
          }
        }
      };
      walk(full);
      return results.join('\n') || '(empty directory)';
    },

    async run_command({ command, timeout_ms = 120000 }) {
      if (DANGEROUS_CMD.test(command)) {
        return `Error: Dangerous command blocked: ${command}`;
      }
      // Strip sensitive env vars from child process to prevent leaks via env/printenv
      const safeEnv = { ...process.env };
      delete safeEnv.ANTHROPIC_API_KEY;
      delete safeEnv.XAI_API_KEY;
      delete safeEnv.GITHUB_TOKEN;
      delete safeEnv.TELEGRAM_BOT_TOKEN;
      delete safeEnv.COLOSSEUM_API_KEY;
      delete safeEnv.COLOSSEUM_CLAIM_CODE;
      try {
        const { stdout, stderr } = await execAsync(command, {
          cwd: workDir,
          timeout: timeout_ms,
          maxBuffer: 2 * 1024 * 1024,
          env: safeEnv,
        });
        let result = '';
        if (stdout) result += stdout.slice(0, 8000);
        if (stderr) result += (result ? '\n\nSTDERR:\n' : '') + stderr.slice(0, 3000);
        return result || '(command completed with no output)';
      } catch (err) {
        const msg = (err.stderr || err.stdout || err.message || '').slice(0, 5000);
        return `Error (exit ${err.code || '?'}): ${msg}`;
      }
    },

    async dev_server({ action }) {
      switch (action) {
        case 'start':
          if (devServer) {
            return `Dev server is already running (PID: ${devServer.pid}). Use "restart" to restart it.`;
          }
          return startServer();

        case 'restart':
          if (devServer) {
            devServer.kill();
            devServer = null;
            await new Promise((r) => setTimeout(r, 1000));
          }
          return startServer();

        case 'stop':
          if (devServer) {
            devServer.kill();
            devServer = null;
            return 'Dev server stopped.';
          }
          return 'Dev server is not running.';

        case 'status':
          return devServer
            ? `Dev server is running (PID: ${devServer.pid}).`
            : 'Dev server is not running.';

        default:
          return `Unknown action: ${action}`;
      }
    },

    async take_screenshot({ viewport = 'desktop' }) {
      if (!devServer) {
        return 'Error: Dev server is not running. Start it first with dev_server({ action: "start" }).';
      }
      try {
        const url = `http://localhost:${devServerPort}`;
        const screenshotPath =
          viewport === 'mobile'
            ? await reviewer.takeMobileScreenshot(url, 'mobile')
            : await reviewer.takeScreenshot(url, 'desktop');
        return `Screenshot saved: ${screenshotPath}`;
      } catch (err) {
        return `Error taking screenshot: ${err.message}`;
      }
    },

    async review_ux() {
      if (!devServer) {
        return 'Error: Dev server is not running. Start it first with dev_server({ action: "start" }).';
      }
      try {
        const url = `http://localhost:${devServerPort}`;
        const review = await reviewer.fullReview(url, workDir);
        return JSON.stringify(review, null, 2);
      } catch (err) {
        return `Error during UX review: ${err.message}`;
      }
    },

    async send_telegram({ message, screenshot_path }) {
      try {
        await telegram.sendDevlog(message, screenshot_path);
        return 'Message sent to Telegram.';
      } catch (err) {
        return `Error sending Telegram: ${err.message}`;
      }
    },

    async request_approval({ message, screenshot_path }) {
      try {
        const result = await telegram.requestApproval(message, screenshot_path);
        if (result.approved) {
          return 'APPROVED: The architect approved your request. You may proceed.';
        }
        return `REJECTED: ${result.reason || 'No reason given'}. Address the feedback and iterate.`;
      } catch (err) {
        return `Error requesting approval: ${err.message}`;
      }
    },

    async git_commit_push({ message }) {
      if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPO) {
        return 'Error: Git not configured (missing GITHUB_TOKEN or GITHUB_REPO in environment).';
      }
      try {
        await execAsync('git add -A', { cwd: workDir });

        // Check if there are staged changes
        try {
          await execAsync('git diff --cached --quiet', { cwd: workDir });
          return 'No changes to commit.';
        } catch {
          // Exit code 1 = there ARE changes — expected
        }

        // Use execFile to avoid shell injection from agent-crafted commit messages
        await execFileAsync('git', ['commit', '-m', message], { cwd: workDir });
        await execAsync('git push -u origin main --force-with-lease', {
          cwd: workDir,
          timeout: 30000,
        });
        return `Committed and pushed: "${message}"`;
      } catch (err) {
        return `Git error: ${err.message}`;
      }
    },

    async colosseum_project({ action, data }) {
      if (!colosseum) {
        return 'Error: Colosseum API not configured (missing COLOSSEUM_API_KEY).';
      }
      try {
        switch (action) {
          case 'create':
            return JSON.stringify(await colosseum.createProject(data || {}));
          case 'update':
            return JSON.stringify(await colosseum.updateProject(data || {}));
          case 'submit':
            return JSON.stringify(await colosseum.submitProject());
          case 'get':
            return JSON.stringify(await colosseum.getMyProject());
          default:
            return `Unknown action: ${action}`;
        }
      } catch (err) {
        return `Colosseum API error: ${err.message}`;
      }
    },

    async read_knowledge({ filename } = {}) {
      if (!filename) {
        if (!fs.existsSync(knowledgeDir)) return 'No knowledge base directory found.';
        const files = fs
          .readdirSync(knowledgeDir)
          .filter((f) => f.endsWith('.md') || f.endsWith('.txt'));
        return `Available knowledge files:\n${files.map((f) => `- ${f}`).join('\n')}`;
      }
      const full = path.join(knowledgeDir, path.basename(filename)); // basename prevents traversal
      if (!fs.existsSync(full)) {
        return `Error: Knowledge file not found: ${filename}`;
      }
      return fs.readFileSync(full, 'utf-8');
    },

    // --- Memory System ---
    async write_journal({ entry, type }) {
      const memoryDir = path.join(workDir, '..', 'memory', 'journal');
      if (!fs.existsSync(memoryDir)) {
        fs.mkdirSync(memoryDir, { recursive: true });
      }
      const today = new Date().toISOString().split('T')[0];
      const time = new Date().toISOString().split('T')[1].slice(0, 5);
      const journalPath = path.join(memoryDir, `${today}.md`);

      const typeEmoji = {
        action: '🔧',
        learning: '💡',
        bug_fix: '🐛',
        blocker: '🚫',
        decision: '🎯',
      };
      const emoji = typeEmoji[type] || '📝';

      const formattedEntry = `\n## ${time} — ${emoji} ${type.toUpperCase()}\n\n${entry}\n`;

      if (fs.existsSync(journalPath)) {
        fs.appendFileSync(journalPath, formattedEntry);
      } else {
        const header = `# Journal — ${today}\n`;
        fs.writeFileSync(journalPath, header + formattedEntry);
      }
      return `Journal entry added to ${today}.md`;
    },

    async update_current_task({ phase, status, next_steps = [], blockers = [] }) {
      const memoryDir = path.join(workDir, '..', 'memory', 'journal');
      if (!fs.existsSync(memoryDir)) {
        fs.mkdirSync(memoryDir, { recursive: true });
      }
      const taskPath = path.join(memoryDir, 'current_task.md');

      const content = `# Current Task

> What SolanaHacker is currently working on. Updated on each significant action.

---

## Status: ${status}

## Current Phase: ${phase}

## Next Steps:
${next_steps.length ? next_steps.map((s) => `- [ ] ${s}`).join('\n') : '- (none defined)'}

## Blockers:
${blockers.length ? blockers.map((b) => `- ${b}`).join('\n') : 'None'}

---

*Last updated: ${new Date().toISOString()}*
`;
      fs.writeFileSync(taskPath, content);
      return `Current task updated: ${phase} — ${status}`;
    },

    async add_bug_solution({ category, error, context = '', root_cause = '', solution, prevention = '' }) {
      const knowledgePath = path.join(workDir, '..', 'memory', 'knowledge', 'bugs.md');
      if (!fs.existsSync(path.dirname(knowledgePath))) {
        fs.mkdirSync(path.dirname(knowledgePath), { recursive: true });
      }

      const entry = `
### ${category}: ${error.slice(0, 50)}
**Error**: \`${error}\`
${context ? `**Context**: ${context}\n` : ''}${root_cause ? `**Root Cause**: ${root_cause}\n` : ''}**Solution**: ${solution}
${prevention ? `**Prevention**: ${prevention}\n` : ''}
---
`;

      if (fs.existsSync(knowledgePath)) {
        const content = fs.readFileSync(knowledgePath, 'utf-8');
        // Insert before the last comment line
        const marker = '<!-- Add new bug solutions above this line -->';
        if (content.includes(marker)) {
          const updated = content.replace(marker, entry + '\n' + marker);
          fs.writeFileSync(knowledgePath, updated);
        } else {
          fs.appendFileSync(knowledgePath, entry);
        }
      } else {
        fs.writeFileSync(knowledgePath, `# Bug Solutions Database\n\n---\n${entry}`);
      }
      return `Bug solution added: ${category} — ${error.slice(0, 30)}`;
    },

    async remember({ item }) {
      const valuesPath = path.join(workDir, '..', 'memory', 'knowledge', 'values.md');
      if (!fs.existsSync(path.dirname(valuesPath))) {
        fs.mkdirSync(path.dirname(valuesPath), { recursive: true });
      }

      const date = new Date().toISOString().split('T')[0];
      const entry = `\n- **[${date}]** ${item}`;

      if (fs.existsSync(valuesPath)) {
        fs.appendFileSync(valuesPath, entry);
      } else {
        fs.writeFileSync(valuesPath, `# H2Crypto's Values & Preferences\n\n## Remembered Items\n${entry}`);
      }

      // Also write to today's journal
      await executors.write_journal({
        entry: `H2Crypto said to remember: "${item}"`,
        type: 'decision',
      });

      return `Remembered: ${item}`;
    },

    async search_memory({ query, type = 'all' }) {
      const knowledgeDir = path.join(workDir, '..', 'memory', 'knowledge');
      const results = [];

      const files =
        type === 'all'
          ? ['bugs.md', 'patterns.md', 'decisions.md', 'values.md']
          : [`${type}.md`];

      const queryLower = query.toLowerCase();

      for (const filename of files) {
        const filePath = path.join(knowledgeDir, filename);
        if (!fs.existsSync(filePath)) continue;

        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        const matches = [];

        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes(queryLower)) {
            // Get context (3 lines before and after)
            const start = Math.max(0, i - 3);
            const end = Math.min(lines.length - 1, i + 3);
            const context = lines.slice(start, end + 1).join('\n');
            matches.push({ line: i + 1, context });
          }
        }

        if (matches.length > 0) {
          results.push({
            file: filename,
            matches: matches.slice(0, 5), // Limit to 5 matches per file
          });
        }
      }

      if (results.length === 0) {
        return `No matches found for "${query}" in ${type} memory.`;
      }

      let output = `Search results for "${query}":\n\n`;
      for (const r of results) {
        output += `### ${r.file}\n`;
        for (const m of r.matches) {
          output += `**Line ${m.line}:**\n\`\`\`\n${m.context}\n\`\`\`\n\n`;
        }
      }
      return output;
    },

    // --- Tasklist Management ---
    async complete_task({ task_text, summary = '', tokens_used = {} }) {
      const memoryBase = path.join(workDir, '..', 'memory');
      const tasksPath = path.join(memoryBase, 'journal', 'pending_tasks.md');
      const completedDir = path.join(memoryBase, 'completed_tasks');
      const indexPath = path.join(completedDir, 'index.md');

      if (!fs.existsSync(tasksPath)) {
        return 'Error: No pending_tasks.md file found.';
      }

      // Ensure completed_tasks directory exists
      if (!fs.existsSync(completedDir)) {
        fs.mkdirSync(completedDir, { recursive: true });
      }

      const content = fs.readFileSync(tasksPath, 'utf-8');
      const lines = content.split('\n');
      let found = false;
      let fullTaskText = '';

      const updated = lines.map(line => {
        // Find uncompleted task that matches the text
        if (line.includes('- [ ]') && line.toLowerCase().includes(task_text.toLowerCase())) {
          found = true;
          fullTaskText = line.replace('- [ ]', '').trim();
          return line.replace('- [ ]', '- [x]');
        }
        return line;
      });

      if (!found) {
        return `Error: Could not find uncompleted task matching: "${task_text}"`;
      }

      fs.writeFileSync(tasksPath, updated.join('\n'));

      // --- Save to completed_tasks ---
      const now = new Date();
      const timestamp = now.toISOString();
      const dateStr = timestamp.split('T')[0];
      const timeStr = timestamp.split('T')[1].slice(0, 5);
      const taskId = `${dateStr}-${Date.now().toString(36)}`;

      // Create task file with metadata
      const taskFilePath = path.join(completedDir, `${taskId}.md`);
      const tokenInfo = tokens_used.input || tokens_used.output
        ? `\n## Token Usage\n- Input: ${tokens_used.input || 0}\n- Output: ${tokens_used.output || 0}`
        : '';

      const taskFileContent = `# Completed Task: ${taskId}

## Metadata
- **Completed At**: ${timestamp}
- **Task**: ${fullTaskText}

## Summary
${summary || '(No summary provided)'}
${tokenInfo}
`;

      fs.writeFileSync(taskFilePath, taskFileContent);

      // --- Update index.md with last 10 tasks ---
      let indexEntries = [];

      if (fs.existsSync(indexPath)) {
        const indexContent = fs.readFileSync(indexPath, 'utf-8');
        // Parse existing entries (lines starting with |)
        const tableLines = indexContent.split('\n').filter(line => line.startsWith('|') && !line.includes('---') && !line.includes('Task ID'));
        indexEntries = tableLines.map(line => {
          const parts = line.split('|').map(p => p.trim()).filter(Boolean);
          return { id: parts[0], date: parts[1], task: parts[2] };
        });
      }

      // Add new entry
      indexEntries.unshift({
        id: taskId,
        date: `${dateStr} ${timeStr}`,
        task: fullTaskText.slice(0, 50) + (fullTaskText.length > 50 ? '...' : ''),
      });

      // Keep only last 10
      indexEntries = indexEntries.slice(0, 10);

      // Write index
      const indexContent = `# Completed Tasks Index

> Last 10 completed tasks. Full details in individual files.

| Task ID | Completed | Task |
|---------|-----------|------|
${indexEntries.map(e => `| ${e.id} | ${e.date} | ${e.task} |`).join('\n')}
`;

      fs.writeFileSync(indexPath, indexContent);

      // Check if all tasks are now complete (no more - [ ])
      const remaining = updated.filter(line => line.includes('- [ ]'));
      if (remaining.length === 0) {
        // Auto-clear completed tasks
        const cleaned = updated.filter(line => {
          if (line.startsWith('#') || line.startsWith('>') || line.trim() === '') return true;
          if (line.includes('- [x]')) return false; // Remove completed
          return true;
        });
        fs.writeFileSync(tasksPath, cleaned.join('\n'));
        return `✅ Task archived to ${taskId}.md! All tasks complete - cleared tasklist.`;
      }

      return `✅ Task archived to ${taskId}.md! ${remaining.length} task(s) remaining.`;
    },

  };

  return {
    executors,
    getDevServer: () => devServer,
  };
}
