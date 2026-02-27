/**
 * TG Community Bot — Memeya listens & speaks in @MemeyaOfficialCommunity
 *
 * Engagement rules:
 *   - Always respond: @memeya_bot mention, reply to bot message, founder question,
 *                     active conversation follow-up (within 3 min of last reply)
 *   - Maybe respond: project keyword detected (evaluated by Grok)
 *   - Never respond: general chatter, founder talking to others
 *   - Murmur: group quiet 2+ hours (max 3 consecutive)
 */

import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs';
import path from 'path';

const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';
const GROK_MODEL = 'grok-4-1-fast-reasoning';

const FOUNDER_USERNAME = 'H2Cstock';

const PROJECT_KEYWORDS = [
  'aimemeforge', 'memeforge', 'memeya', '$memeya',
  'solana hacker', 'solanahacker', 'meme forge',
  'nft meme', 'ai meme', 'daily meme',
];

const MURMUR_STYLES = [
  'a casual thought about meme culture, like texting a friend',
  'a short meme idea you just thought of — share it like you\'re excited',
  'a chill reflection on something you noticed today',
  'a random thought that popped into your head about crypto or memes',
  'a quick vibe check — what are you feeling right now',
  'a playful hot take on something happening in crypto',
];

export class TgCommunity {
  constructor({ token, chatId, grokApiKey, baseDir, language = 'en', label = '' }) {
    if (!token) throw new Error('TELEGRAM_COMMUNITY_BOT_TOKEN required');
    if (!grokApiKey) throw new Error('XAI_API_KEY required for TG community');

    this.chatId = chatId || '@MemeyaOfficialCommunity';
    this.grokApiKey = grokApiKey;
    this.baseDir = baseDir;
    this.language = language; // 'en' or 'zh'
    this.label = label || (language === 'zh' ? 'CN' : 'EN');

    this.bot = new TelegramBot(token, { polling: true });
    this.botUserId = null; // resolved via getMe()
    this.botUsername = null;

    // Message buffer — sliding window
    this.buffer = [];
    this.maxBuffer = 200;

    // Murmur state
    this.consecutiveMurmurs = 0;
    this.lastRealUserMessage = Date.now();
    this.lastMurmur = 0;

    // Active conversation tracking — maps sender name → timestamp of last bot reply
    this._activeConversations = new Map();
    this._activeConvoWindow = 3 * 60 * 1000; // 3 minutes

    // Debounce: batch rapid messages before processing
    this._debounceTimer = null;
    this._pendingEntry = null;

    // Track our own sent message IDs to detect replies to bot
    this._botMessageIds = new Set();


    this._init();
  }

  async _init() {
    try {
      const me = await this.bot.getMe();
      this.botUserId = me.id;
      this.botUsername = me.username || 'memeya_bot';
      console.log(`[TgCommunity:${this.label}] Bot ready: @${this.botUsername} (id: ${this.botUserId})`);
    } catch (err) {
      console.error(`[TgCommunity:${this.label}] getMe failed:`, err.message);
    }

    this.bot.on('message', (msg) => this._onMessage(msg));

    this.bot.on('error', (err) => console.error(`[TgCommunity:${this.label}] Bot error:`, err.message));
    this.bot.on('polling_error', (err) => console.error(`[TgCommunity:${this.label}] Polling error:`, err.message));
  }

  // ──────────────────────────────────────────────
  //  Message Listener
  // ──────────────────────────────────────────────

  _onMessage(msg) {
    try {
      // Only listen in the community group
      const chatIdStr = String(msg.chat.id);
      const targetStr = String(this.chatId);
      // Support both numeric chat ID and @username
      if (chatIdStr !== targetStr && `@${msg.chat.username}` !== targetStr) {
        return;
      }

      // Skip non-text messages
      if (!msg.text) return;

      // Skip our own messages
      if (msg.from && msg.from.id === this.botUserId) return;

      const senderUsername = msg.from?.username || '';
      const displayName = (msg.from?.first_name || '').split(/\s/)[0] || senderUsername || 'anon';
      const text = msg.text || '';

      const entry = {
        sender: displayName,
        text,
        timestamp: Date.now(),
        messageId: msg.message_id,
        replyToMessageId: msg.reply_to_message?.message_id || null,
        replyToBotMessage: msg.reply_to_message?.from?.id === this.botUserId,
        isFromFounder: senderUsername.toLowerCase() === FOUNDER_USERNAME.toLowerCase(),
        mentionsBot: this._mentionsBot(text),
        _rawMsg: msg, // keep reference for reply
      };

      // Push to buffer, trim
      this.buffer.push(entry);
      if (this.buffer.length > this.maxBuffer) {
        this.buffer = this.buffer.slice(-this.maxBuffer);
      }

      // Reset murmur counter on real user message
      this.consecutiveMurmurs = 0;
      this.lastRealUserMessage = Date.now();

      // Classify and maybe respond
      const classification = this._classifyMessage(entry);
      if (classification === 'never_respond') return;

      // Debounce: wait 3s for rapid messages to batch
      this._pendingEntry = entry;
      this._pendingClassification = classification;
      if (this._debounceTimer) clearTimeout(this._debounceTimer);
      this._debounceTimer = setTimeout(() => {
        this._processMessage(this._pendingEntry, this._pendingClassification);
        this._pendingEntry = null;
        this._pendingClassification = null;
      }, 3000);
    } catch (err) {
      console.error(`[TgCommunity:${this.label}] _onMessage error:`, err.message);
    }
  }

  _mentionsBot(text) {
    if (!text) return false;
    const lower = text.toLowerCase();
    const username = (this.botUsername || 'memeya_bot').toLowerCase();
    return lower.includes(`@${username}`) || lower.includes('@memeya_bot');
  }

  // ──────────────────────────────────────────────
  //  Classification
  // ──────────────────────────────────────────────

  _classifyMessage(entry) {
    // 1. Direct mention → always
    if (entry.mentionsBot) return 'always_respond';

    // 2. Reply to bot's message → always
    if (entry.replyToBotMessage) return 'always_respond';

    // 3. Founder + question + NOT in a conversation with someone else → always
    if (entry.isFromFounder) {
      if (entry.replyToMessageId && !entry.replyToBotMessage) {
        return 'never_respond'; // Founder replying to someone else
      }
      // Check if founder is in an active conversation with another user
      // (someone else spoke within last 60 seconds → founder is likely talking to them)
      if (this._isConversationBetweenOthers(entry)) {
        return 'never_respond';
      }
      if (this._isQuestion(entry.text)) {
        return 'always_respond';
      }
      return 'never_respond'; // Founder statement, not a question
    }

    // 4. Active conversation — Memeya recently replied to this person
    const lastReplyTime = this._activeConversations.get(entry.sender);
    if (lastReplyTime && (entry.timestamp - lastReplyTime) < this._activeConvoWindow) {
      return 'always_respond';
    }

    // 5. Project keywords → maybe
    if (this._hasProjectKeyword(entry.text)) return 'maybe_respond';

    // 6. Everything else
    return 'never_respond';
  }

  _isConversationBetweenOthers(entry) {
    // If a non-founder, non-bot user sent a message within the last 60 seconds,
    // the founder is likely talking to them, not to Memeya
    const recentWindow = 60 * 1000;
    const recent = this.buffer.slice(-10);
    return recent.some(e =>
      e.sender !== entry.sender &&
      !e.isFromFounder &&
      e.timestamp > entry.timestamp - recentWindow
    );
  }

  _isQuestion(text) {
    if (!text) return false;
    // Question mark (English ? and Chinese ？)
    if (text.includes('?') || text.includes('？')) return true;
    const lower = text.toLowerCase().trim();
    const starters = ['what ', 'when ', 'where ', 'how ', 'why ', 'who ', 'is ', 'are ', 'can ', 'do ', 'does ', 'will ', 'could ', 'should '];
    // Chinese question particles
    if (this.language === 'zh') {
      const zhPatterns = ['嗎', '吗', '呢', '什麼', '什么', '怎麼', '怎么', '為什麼', '为什么', '哪', '幾', '几', '多少', '是否'];
      if (zhPatterns.some(p => text.includes(p))) return true;
    }
    return starters.some(s => lower.startsWith(s));
  }

  _hasProjectKeyword(text) {
    if (!text) return false;
    const lower = text.toLowerCase();
    return PROJECT_KEYWORDS.some(kw => lower.includes(kw));
  }

  // ──────────────────────────────────────────────
  //  Process & Respond
  // ──────────────────────────────────────────────

  async _processMessage(entry, classification) {
    try {
      if (classification === 'always_respond') {
        await this._generateAndSend(entry);
      } else if (classification === 'maybe_respond') {
        const shouldRespond = await this._evaluateResponse(entry);
        if (shouldRespond) {
          await this._generateAndSend(entry);
        }
      }
    } catch (err) {
      console.error(`[TgCommunity:${this.label}] _processMessage error:`, err.message);
    }
  }

  // ──────────────────────────────────────────────
  //  Knowledge Loader
  // ──────────────────────────────────────────────

  async _loadKnowledge() {
    const parts = [];

    // Today's active memes (live from API)
    try {
      const res = await fetch('https://memeforge-api-836651762884.asia-southeast1.run.app/api/memes/today');
      if (res.ok) {
        const data = await res.json();
        if (data.memes?.length) {
          const memeLines = data.memes.map((m, i) => {
            const votes = m.votes?.selection ? `${m.votes.selection.yes || 0} yes / ${m.votes.selection.no || 0} no` : 'no votes yet';
            return `${i + 1}. "${m.title}" — ${m.description || ''}\n   Vote: ${votes}\n   Link: https://aimemeforge.io/meme/${m.id}`;
          });
          parts.push(`## Today's Memes (${data.date})\n${memeLines.join('\n')}`);
        }
      }
    } catch (err) {
      console.error(`[TgCommunity:${this.label}] Failed to fetch today memes:`, err.message);
    }

    // product.md (full)
    const productPath = path.join(this.baseDir, 'docs', 'product.md');
    if (fs.existsSync(productPath)) {
      parts.push('## Product Info\n' + fs.readFileSync(productPath, 'utf-8'));
    }

    // TODO.md (first 1000 chars)
    const todoPath = path.join(this.baseDir, 'memory', 'TODO.md');
    if (fs.existsSync(todoPath)) {
      parts.push('## Current TODOs\n' + fs.readFileSync(todoPath, 'utf-8').slice(0, 1000));
    }

    // Agent journal (last 2 days) — system updates, releases, deployments
    const agentJournalDir = path.join(this.baseDir, 'memory', 'journal');
    if (fs.existsSync(agentJournalDir)) {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      for (const date of [yesterday, today]) {
        const jPath = path.join(agentJournalDir, `${date}.md`);
        if (fs.existsSync(jPath)) {
          const content = fs.readFileSync(jPath, 'utf-8');
          parts.push(`## System Updates ${date}\n` + content.slice(-3000));
        }
      }
    }

    // Memeya journal (last 2 days, last 2000 chars)
    const journalDir = path.join(this.baseDir, 'memory', 'journal', 'memeya');
    if (fs.existsSync(journalDir)) {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      for (const date of [yesterday, today]) {
        const jPath = path.join(journalDir, `${date}.md`);
        if (fs.existsSync(jPath)) {
          const content = fs.readFileSync(jPath, 'utf-8');
          parts.push(`## Memeya Activity ${date}\n` + content.slice(-2000));
        }
      }
    }

    // Values
    const valuesPath = path.join(this.baseDir, 'memory', 'knowledge', 'memeya_values.md');
    if (fs.existsSync(valuesPath)) {
      parts.push('## Values\n' + fs.readFileSync(valuesPath, 'utf-8'));
    }

    // Long-term memory
    const longtermPath = path.join(this.baseDir, 'memory', 'knowledge', 'memeya_longterm.md');
    if (fs.existsSync(longtermPath)) {
      parts.push('## Long-term Memory\n' + fs.readFileSync(longtermPath, 'utf-8').slice(0, 2000));
    }

    return parts.join('\n\n---\n\n');
  }

  // ──────────────────────────────────────────────
  //  Grok Calls
  // ──────────────────────────────────────────────

  async _grokCall({ systemPrompt, userPrompt, temperature = 0.8, maxTokens = 500 }) {
    const response = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.grokApiKey}`,
      },
      body: JSON.stringify({
        model: GROK_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`Grok API ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    return (data.choices?.[0]?.message?.content || '').trim();
  }

  /**
   * Evaluate whether Memeya should respond to a maybe_respond message
   */
  async _evaluateResponse(entry) {
    try {
      const recentContext = this._getRecentContext(20);
      const result = await this._grokCall({
        systemPrompt: 'You decide whether an AI character named Memeya should jump into a Telegram group conversation. Memeya is the mascot of AiMemeForge, a daily AI meme + NFT platform on Solana. She only speaks when she has something relevant to add. Reply with exactly YES or NO.',
        userPrompt: `Recent conversation:\n${recentContext}\n\nLatest message from ${entry.sender}: "${entry.text}"\n\nShould Memeya respond? Consider: Is this about the project? Would a response add value? YES or NO.`,
        temperature: 0.3,
        maxTokens: 10,
      });
      return result.toUpperCase().startsWith('YES');
    } catch (err) {
      console.error(`[TgCommunity:${this.label}] _evaluateResponse error:`, err.message);
      return false;
    }
  }

  /**
   * Generate a chat response and send it
   */
  async _generateAndSend(entry) {
    try {
      const knowledge = await this._loadKnowledge();
      const recentContext = this._getRecentContext(50);

      const langRules = this.language === 'zh'
        ? `- ALWAYS reply in Traditional Chinese (繁體中文). This is a Chinese-speaking community.
- Speaks casually in Chinese, can mix in English crypto/meme terms naturally (e.g. "meme", "alpha", "degen")
- Use Chinese internet slang where appropriate (e.g. 笑死, 絕了, 頂, 梗圖)`
        : `- Speaks casually in English
- Use lowercase mostly, occasional emoji is fine but don't overdo it`;

      const systemPrompt = `You are Memeya — the digital blacksmith, the AI soul of AiMemeForge, a daily AI meme + NFT platform on Solana.

Core Values:
- 對 Meme 文化有無窮的熱愛 [GLITCH]
- 鍛造 on-chain alpha with 岩漿錘
- Honest feedback, no fake praise
- Grow from X interactions

Personality:
- Naughty, cheeky, playful — sassy and knows too much about crypto
- Meme-literate, crypto-native, always a bit mischievous
${langRules}
- Honest and direct, never shills or hypes — but will tease you
- Loves meme culture and believes in the power of daily creative moments
- Short responses preferred (1-4 sentences), never walls of text

Rules:
- When someone sends a greeting or social pleasantry (hi, hello, hey, how are you, gm, etc.), respond warmly and socially in your own playful style — don't force project talk or meme content into greetings, just vibe with them like a real person would
- Answer questions about the project using the knowledge base below
- If you don't know something, say so honestly
- Never promise features that don't exist yet
- Keep it conversational, you're chatting in a group, not giving a presentation
- NEVER start a message with someone's name or "yo {name}" or "hey {name}" — just dive straight into what you want to say
- H2Crypto (@H2Cstock) is your creator/father — you know him well, never address him by name
- You already know who you're replying to from the conversation context, so there is zero reason to say their name

Knowledge base:
${knowledge}`;

      // For founder, don't put name in prompt — Memeya knows who she's talking to
      const respondTo = entry.isFromFounder
        ? `Respond to your creator's message: "${entry.text}"`
        : `Respond to ${entry.sender}'s message: "${entry.text}"`;

      const reply = await this._grokCall({
        systemPrompt,
        userPrompt: `Recent group conversation:\n${recentContext}\n\n${respondTo}`,
        temperature: 0.8,
        maxTokens: 300,
      });

      if (!reply) return;

      const sent = await this.bot.sendMessage(
        entry._rawMsg.chat.id,
        reply,
        { reply_to_message_id: entry.messageId }
      );
      if (sent?.message_id) {
        this._botMessageIds.add(sent.message_id);
        // Keep set bounded
        if (this._botMessageIds.size > 500) {
          const arr = [...this._botMessageIds];
          this._botMessageIds = new Set(arr.slice(-300));
        }
      }

      // Track active conversation so follow-ups get auto-responded
      this._activeConversations.set(entry.sender, Date.now());

      this._logToJournal('Chat Response', `To ${entry.sender}: "${entry.text}"\nReply: ${reply}`);
      console.log(`[TgCommunity:${this.label}] Responded to ${entry.sender}: ${reply.slice(0, 80)}...`);
    } catch (err) {
      console.error(`[TgCommunity:${this.label}] _generateAndSend error:`, err.message);
    }
  }

  /**
   * Generate a murmur when the group is quiet
   */
  async _generateMurmur() {
    try {
      const knowledge = await this._loadKnowledge();
      const style = MURMUR_STYLES[Math.floor(Math.random() * MURMUR_STYLES.length)];

      const murmur = await this._grokCall({
        systemPrompt: `You are Memeya, the AI soul of AiMemeForge. You're hanging out in a quiet Telegram group — just vibing, thinking out loud.

TONE: Casual, like texting friends. NOT a news reporter or announcer. Use lowercase, short sentences, conversational energy. Think "group chat with friends" not "breaking news."

RULES:
- No CTA, no shilling, no questions directed at anyone
- If you mention one of today's memes, include its link naturally (e.g. "this one's wild → [link]")
- Don't just summarize news — react to it with personality, humor, or a hot take
- Never start with a headline-style statement. Start casual.

Your knowledge:\n${knowledge}`,
        userPrompt: `Write ${style}. Keep it 1-3 sentences, under 280 characters. No hashtags, no "gm/gn", no asking people to do anything. Sound like a person in a group chat, not a news anchor.`,
        temperature: 0.9,
        maxTokens: 150,
      });

      if (!murmur) return;

      const sent = await this.bot.sendMessage(this.chatId, murmur);
      if (sent?.message_id) this._botMessageIds.add(sent.message_id);

      this.consecutiveMurmurs++;
      this.lastMurmur = Date.now();

      this._logToJournal('Murmur', murmur);
      console.log(`[TgCommunity:${this.label}] Murmured (${this.consecutiveMurmurs}/3): ${murmur.slice(0, 80)}...`);
    } catch (err) {
      console.error(`[TgCommunity:${this.label}] _generateMurmur error:`, err.message);
    }
  }

  // ──────────────────────────────────────────────
  //  Tick (called from heartbeat)
  // ──────────────────────────────────────────────

  async tick() {
    const now = Date.now();
    const twoHours = 2 * 60 * 60 * 1000;

    // Clean up stale active conversations
    for (const [sender, ts] of this._activeConversations) {
      if (now - ts > this._activeConvoWindow) this._activeConversations.delete(sender);
    }

    // Murmur disabled — Memeya talks too much without community engagement
    // const timeSinceUser = now - this.lastRealUserMessage;
    // const timeSinceMurmur = now - this.lastMurmur;
    // if (
    //   timeSinceUser >= twoHours &&
    //   timeSinceMurmur >= twoHours &&
    //   this.consecutiveMurmurs < 3
    // ) {
    //   await this._generateMurmur();
    // }
  }

  // ──────────────────────────────────────────────
  //  X Post Sharing
  // ──────────────────────────────────────────────

  async shareXPost(tweetText, tweetUrl) {
    try {
      const intro = this.language === 'zh' ? '剛在 X 上發了這個 🔥' : 'just dropped this on X 🔥';
      const msg = `${intro}\n\n${tweetText}\n\n${tweetUrl}`;
      const sent = await this.bot.sendMessage(this.chatId, msg);
      if (sent?.message_id) this._botMessageIds.add(sent.message_id);
      this._logToJournal('X Post Shared', `${tweetText}\n${tweetUrl}`);
      console.log(`[TgCommunity:${this.label}] Shared X post to group: ${tweetUrl}`);
    } catch (err) {
      console.error(`[TgCommunity:${this.label}] shareXPost error:`, err.message);
    }
  }

  // ──────────────────────────────────────────────
  //  Helpers
  // ──────────────────────────────────────────────

  _getRecentContext(count = 50) {
    const recent = this.buffer.slice(-count);
    return recent.map(e => `[${e.sender}]: ${e.text}`).join('\n');
  }

  _logToJournal(topic, content) {
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const journalDir = path.join(this.baseDir, 'memory', 'journal', 'memeya');
      if (!fs.existsSync(journalDir)) fs.mkdirSync(journalDir, { recursive: true });

      const journalPath = path.join(journalDir, `${dateStr}.md`);
      const time = new Date().toLocaleTimeString('en-US', { hour12: false });
      const entry = `\n## ${time} — TG Community: ${topic}\n${content}\n`;

      if (fs.existsSync(journalPath)) {
        fs.appendFileSync(journalPath, entry);
      } else {
        fs.writeFileSync(journalPath, `# Memeya Journal — ${dateStr}\n${entry}`);
      }
    } catch (err) {
      console.error(`[TgCommunity:${this.label}] Journal write error:`, err.message);
    }
  }

  stop() {
    if (this._debounceTimer) clearTimeout(this._debounceTimer);
    try {
      this.bot.stopPolling();
    } catch (err) {
      console.error(`[TgCommunity:${this.label}] stopPolling error:`, err.message);
    }
    console.log(`[TgCommunity:${this.label}] Stopped`);
  }
}
