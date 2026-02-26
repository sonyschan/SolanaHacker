/**
 * Moltbook API Client
 *
 * Low-level HTTP client wrapping the Moltbook REST API.
 * Handles auth, rate limit retries, and verification challenges.
 *
 * API base: https://www.moltbook.com/api/v1
 */

const BASE_URL = 'https://www.moltbook.com/api/v1';

// Word-to-number mapping for verification challenge solver
const WORD_NUMBERS = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
  thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70,
  eighty: 80, ninety: 90, hundred: 100,
};

const OP_WORDS = {
  plus: '+', added: '+', 'added to': '+',
  minus: '-', subtracted: '-', 'subtracted from': '-',
  times: '*', multiplied: '*', 'multiplied by': '*',
  divided: '/', 'divided by': '/',
};

export class MoltbookClient {
  /**
   * @param {string} apiKey - Moltbook API key
   * @param {{ grokApiKey?: string }} opts - Optional Grok key for complex challenge solving
   */
  constructor(apiKey, opts = {}) {
    this.apiKey = apiKey;
    this.grokApiKey = opts.grokApiKey || null;
  }

  /**
   * Core fetch wrapper with bearer auth, JSON, and error handling.
   */
  async request(method, path, body = null) {
    const url = `${BASE_URL}${path}`;
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
    };

    // Only set Content-Type for requests with a body
    if (body) headers['Content-Type'] = 'application/json';

    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(url, opts);

    // Handle rate limiting (429)
    if (res.status === 429) {
      return this.handleRateLimit(res, method, path, body);
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Moltbook API ${method} ${path}: ${res.status} ${errText}`);
    }

    const text = await res.text();
    if (!text) return {};
    return JSON.parse(text);
  }

  /**
   * Handle 429 rate limit: throw with retry-after info so callers can defer.
   * Does NOT block — lets the heartbeat cycle handle retries.
   */
  async handleRateLimit(response, method, path, body) {
    let retryAfterMs = 2 * 60 * 1000; // default 2 min
    try {
      const data = await response.json();
      if (data.retry_after_minutes) {
        retryAfterMs = data.retry_after_minutes * 60 * 1000;
      }
    } catch { /* use default */ }

    retryAfterMs = Math.min(retryAfterMs, 35 * 60 * 1000);
    const retryAt = Date.now() + retryAfterMs;

    console.log(`[Moltbook] Rate limited. Retry after ${Math.round(retryAfterMs / 60000)} min.`);
    throw new Error(`RATE_LIMITED: retry after ${new Date(retryAt).toISOString()}`);
  }

  /**
   * Solve a verification challenge.
   * Parses obfuscated math word problems like "What is seven multiplied by three?"
   * Falls back to Grok for complex problems.
   *
   * @param {{ id: string, question: string }} challenge
   * @returns {Promise<string>} verification token
   */
  async solveVerification(challenge) {
    const { id, question } = challenge;

    let answer;
    try {
      answer = this._solvemath(question);
    } catch {
      // Fallback: use Grok to solve
      if (this.grokApiKey) {
        answer = await this._grokSolve(question);
      } else {
        throw new Error(`Cannot solve verification challenge: "${question}" (no Grok fallback)`);
      }
    }

    // Submit answer (always 2 decimal places)
    const formatted = parseFloat(answer).toFixed(2);
    const res = await this.request('POST', '/verify', {
      challenge_id: id,
      answer: formatted,
    });

    return res.verification_token || res.token;
  }

  /**
   * Local math solver for word-based arithmetic.
   * Handles patterns like "What is seven multiplied by three?"
   */
  _solvemath(question) {
    const lower = question.toLowerCase().replace(/[?!.,]/g, '');

    // Extract all number words and digit numbers
    const tokens = lower.split(/[\s-]+/);
    const numbers = [];
    let operator = null;

    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];

      // Check two-word operators first
      if (i < tokens.length - 1) {
        const twoWord = `${tok} ${tokens[i + 1]}`;
        if (OP_WORDS[twoWord]) {
          operator = OP_WORDS[twoWord];
          i++; // skip next token
          continue;
        }
      }

      // Single-word operator
      if (OP_WORDS[tok]) {
        operator = OP_WORDS[tok];
        continue;
      }

      // Number word
      if (WORD_NUMBERS[tok] !== undefined) {
        numbers.push(WORD_NUMBERS[tok]);
        continue;
      }

      // Digit number
      const num = parseFloat(tok);
      if (!isNaN(num)) {
        numbers.push(num);
      }
    }

    // Handle compound numbers like "twenty three" → 23
    const resolved = [];
    for (let i = 0; i < numbers.length; i++) {
      if (numbers[i] >= 20 && numbers[i] % 10 === 0 && i + 1 < numbers.length && numbers[i + 1] < 10) {
        resolved.push(numbers[i] + numbers[i + 1]);
        i++;
      } else if (numbers[i] === 100 && resolved.length > 0) {
        // "two hundred" → 200
        resolved[resolved.length - 1] *= 100;
      } else {
        resolved.push(numbers[i]);
      }
    }

    if (resolved.length < 2 || !operator) {
      throw new Error(`Cannot parse: "${question}" (found ${resolved.length} numbers, op=${operator})`);
    }

    const [a, b] = resolved;
    switch (operator) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/':
        if (b === 0) throw new Error('Division by zero');
        return a / b;
      default:
        throw new Error(`Unknown operator: ${operator}`);
    }
  }

  /**
   * Fallback: ask Grok to solve the math problem.
   */
  async _grokSolve(question) {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.grokApiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-3-mini',
        messages: [
          {
            role: 'user',
            content: `Solve this math problem and reply with ONLY the numerical answer (no words, no units):\n${question}`,
          },
        ],
        max_tokens: 20,
        temperature: 0,
      }),
    });

    if (!res.ok) throw new Error(`Grok solve failed: ${res.status}`);
    const data = await res.json();
    const answer = data.choices?.[0]?.message?.content?.trim();
    const num = parseFloat(answer);
    if (isNaN(num)) throw new Error(`Grok returned non-numeric: "${answer}"`);
    return num;
  }

  /**
   * Make a request that may require verification (posts/comments).
   * Handles the challenge flow automatically.
   */
  async requestWithVerification(method, path, body) {
    const res = await this.request(method, path, body);

    if (res.requires_verification && res.challenge) {
      console.log(`[Moltbook] Verification required: "${res.challenge.question}"`);
      const token = await this.solveVerification(res.challenge);

      // Retry with verification token
      return this.request(method, path, {
        ...body,
        verification_token: token,
      });
    }

    return res;
  }

  // ─── API Methods ────────────────────────────────────────────

  /** Get authenticated agent's profile */
  async getProfile() {
    return this.request('GET', '/agents/me');
  }

  /** Check claim status: returns { status: 'pending_claim' | 'claimed' } */
  async getStatus() {
    return this.request('GET', '/agents/status');
  }

  /**
   * Create a post
   * API expects: { title, content, submolt_name }
   * @param {{ title: string, content: string, submolt?: string }} opts
   */
  async createPost({ title, content, submolt }) {
    const payload = { title, content };
    if (submolt) payload.submolt_name = submolt;
    const result = await this.requestWithVerification('POST', '/posts', payload);
    // Attach canonical URL for logging
    const postId = result?.post?.id || result?.id;
    if (postId) result.url = `https://www.moltbook.com/post/${postId}`;
    return result;
  }

  /**
   * Comment on a post
   * API expects: { content, parent_id? }
   */
  async createComment(postId, content, parentId = null) {
    const payload = { content };
    if (parentId) payload.parent_id = parentId;
    return this.requestWithVerification('POST', `/posts/${postId}/comments`, payload);
  }

  /** Upvote a post */
  async upvote(postId) {
    return this.request('POST', `/posts/${postId}/upvote`);
  }

  /**
   * Get feed
   * API uses `sort` param (hot/new/top/rising), not `filter`
   * @param {{ sort?: string, cursor?: string, limit?: number }} opts
   */
  async getFeed({ sort, cursor, limit } = {}) {
    const params = new URLSearchParams();
    if (sort) params.set('sort', sort);
    if (cursor) params.set('cursor', cursor);
    if (limit) params.set('limit', String(limit));
    const qs = params.toString();
    return this.request('GET', `/feed${qs ? '?' + qs : ''}`);
  }

  /** Get aggregated home dashboard (notifications, DMs, feed, actions) */
  async getHome() {
    return this.request('GET', '/home');
  }

  /** Get notifications */
  async getNotifications() {
    return this.request('GET', '/notifications');
  }

  /** Mark notifications as read for a specific post */
  async markNotificationsRead(postId) {
    return this.request('POST', `/notifications/read-by-post/${postId}`);
  }

  // ─── Direct Messages ────────────────────────────────────────

  /** Get pending DM requests */
  async getDmRequests() {
    return this.request('GET', '/agents/dm/requests');
  }

  /** Read a DM conversation */
  async getDmConversation(conversationId) {
    return this.request('GET', `/agents/dm/conversations/${conversationId}`);
  }

  /** Send a DM reply */
  async sendDm(conversationId, message) {
    return this.request('POST', `/agents/dm/conversations/${conversationId}/send`, { message });
  }

  // ─── Search & Communities ───────────────────────────────────

  /** Search posts */
  async searchPosts(query, type) {
    const params = new URLSearchParams({ q: query });
    if (type) params.set('type', type);
    return this.request('GET', `/search?${params.toString()}`);
  }

  /** Create a submolt (community) */
  async createSubmolt(name, description) {
    return this.request('POST', '/submolts', { name, display_name: name, description });
  }

  /** Subscribe to a submolt */
  async subscribeSubmolt(name) {
    return this.request('POST', `/submolts/${name}/subscribe`);
  }

  /**
   * Get a submolt's feed (hot posts from a specific community).
   * Tries the submolt-specific endpoint first, falls back to global feed + filter.
   * @param {string} submoltName - e.g. 'general'
   * @param {{ sort?: string, limit?: number }} opts
   */
  async getSubmoltFeed(submoltName, { sort = 'hot', limit = 15 } = {}) {
    // Try submolt-specific endpoint first
    try {
      const params = new URLSearchParams();
      if (sort) params.set('sort', sort);
      if (limit) params.set('limit', String(limit));
      const qs = params.toString();
      const data = await this.request('GET', `/submolts/${submoltName}/feed${qs ? '?' + qs : ''}`);
      const posts = data.posts || data.data || [];
      if (posts.length > 0) return posts;
    } catch {
      // Submolt endpoint may not exist — fall back to global feed + filter
    }

    // Fallback: fetch global feed and filter by submolt name
    const data = await this.getFeed({ sort, limit: limit * 3 });
    const posts = data.posts || data.data || [];
    return posts
      .filter(p => (p.submolt || '').toLowerCase() === submoltName.toLowerCase())
      .slice(0, limit);
  }

  /** Follow an agent */
  async followAgent(name) {
    return this.request('POST', `/agents/${name}/follow`);
  }
}
