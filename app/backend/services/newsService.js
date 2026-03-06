class NewsService {
  constructor() {
    this.grokApiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
    this.grokResponsesUrl = 'https://api.x.ai/v1/responses';
    this.grokChatUrl = 'https://api.x.ai/v1/chat/completions';
  }

  /**
   * Call Grok Responses API with web_search tool for real-time results.
   * Same pattern as agent/chat-mode.js:403-445.
   */
  async callGrokWithSearch(query, maxTokens = 1000) {
    const response = await fetch(this.grokResponsesUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.grokApiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-4-1-fast-non-reasoning',
        input: [{ role: 'user', content: query }],
        tools: [{ type: 'web_search' }],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Grok Search API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const outputMessages = data.output || [];
    const assistantMessage = outputMessages.find(m => m.role === 'assistant');

    const content = assistantMessage?.content;
    if (!content) return '';
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content
        .filter(block => block.type === 'text' || block.type === 'output_text' || typeof block === 'string')
        .map(block => (typeof block === 'string' ? block : block.text))
        .join('\n');
    }
    return JSON.stringify(content);
  }

  /**
   * Fetch crypto news — prefers agent-collected news, supplements with Grok web search if needed.
   * @param {Array} recentMemeThemes - optional array of {title, tags, newsSource} from recent memes
   */
  async getCryptoNews(recentMemeThemes = []) {
    try {
      // Step 1: Check pre-collected news from agent's heartbeat discovery (last 24h)
      const collected = await this.getCollectedNews();

      if (collected.length >= 3) {
        const diverse = this.ensureCategoryDiversity(collected);
        console.log(`📰 Using ${diverse.length} pre-collected news (agent discovery)`);
        return diverse;
      }

      // Step 2: Supplement with Grok web search if < 3
      if (collected.length > 0) {
        const needed = 3 - collected.length;
        console.log(`📰 Only ${collected.length} collected news, supplementing ${needed} via Grok`);
        const supplemented = await this.supplementWithGrokSearch(collected, needed, recentMemeThemes);
        return supplemented;
      }

      // Step 3: No collected news at all — full Grok web search (original behavior)
      console.log('📰 No collected news available, using full Grok web search');
      return await this.fetchNewsViaGrok(recentMemeThemes);
    } catch (error) {
      console.error('Error in getCryptoNews:', error);
      return this.getFallbackNews();
    }
  }

  /**
   * Read pre-collected news from Firestore (last 24h, deduped).
   */
  async getCollectedNews() {
    try {
      const { getFirestore, collections } = require('../config/firebase');
      const db = getFirestore();
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const snapshot = await db.collection(collections.COLLECTED_NEWS)
        .where('collectedAt', '>=', cutoff)
        .orderBy('collectedAt', 'desc')
        .limit(10)
        .get();

      if (snapshot.empty) return [];

      // Dedupe by title similarity (exact lowercase match)
      const seen = new Set();
      const items = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        const key = data.title.toLowerCase().trim();
        if (!seen.has(key)) {
          seen.add(key);
          items.push(data);
        }
      });

      return items;
    } catch (error) {
      console.error('Error reading collected news:', error.message);
      return [];
    }
  }

  /**
   * Pick best 3 items ensuring category diversity (A, B, C) when possible.
   */
  ensureCategoryDiversity(items) {
    const byCategory = { A: [], B: [], C: [] };
    for (const item of items) {
      const cat = item.category || 'B';
      if (byCategory[cat]) byCategory[cat].push(item);
    }

    const result = [];
    // Pick one from each category first
    for (const cat of ['A', 'B', 'C']) {
      if (byCategory[cat].length > 0) {
        result.push(byCategory[cat].shift());
      }
    }

    // Fill remaining slots from any category
    if (result.length < 3) {
      const remaining = items.filter(i => !result.includes(i));
      for (const item of remaining) {
        if (result.length >= 3) break;
        result.push(item);
      }
    }

    return result.slice(0, 3);
  }

  /**
   * Supplement collected news with Grok web search for missing categories.
   */
  async supplementWithGrokSearch(existing, needed, recentMemeThemes) {
    const existingCategories = new Set(existing.map(e => e.category || 'B'));
    const missingCategories = ['A', 'B', 'C'].filter(c => !existingCategories.has(c));

    try {
      const today = new Date().toISOString().split('T')[0];
      const existingTitles = existing.map(e => `- "${e.title}"`).join('\n');
      const categoryHint = missingCategories.length > 0
        ? `Focus on categories: ${missingCategories.join(', ')} (A=Token/Market, B=Macro/Tech, C=People/Culture).`
        : '';

      let prompt = `Today is ${today}. Search for ${needed} meme-worthy crypto event(s) from the PAST 48 hours.
${categoryHint}

Already covered (DO NOT repeat):
${existingTitles}

Return as JSON array: [{ "title": "...", "summary": "...", "trend_reason": "...", "x_handle": "@..." or null, "category": "A"|"B"|"C" }]`;

      if (recentMemeThemes.length > 0) {
        const themesList = recentMemeThemes
          .map(t => `- "${t.title}" (${(t.tags || []).join(', ')})`)
          .join('\n');
        prompt += `\n\nAlso AVOID these recent meme themes:\n${themesList}`;
      }

      const content = await this.callGrokWithSearch(prompt, 800);
      const supplemented = this.parseGrokNewsResponse(content);

      return this.ensureCategoryDiversity([...existing, ...supplemented]);
    } catch (error) {
      console.error('Error supplementing news via Grok:', error.message);
      return this.ensureCategoryDiversity(existing);
    }
  }

  /**
   * Full Grok web search for news (original getCryptoNews behavior).
   */
  async fetchNewsViaGrok(recentMemeThemes = []) {
    const today = new Date().toISOString().split('T')[0];

    let prompt = `Today is ${today}. Search for 3 meme-worthy events from the PAST 48 hours that crypto communities are talking about.

PURPOSE: We create "Historical AI Memes" — memes that capture the most memorable moments shaping crypto and the world. If a major world event is dominating crypto sentiment right now, it MUST be included.

CRITICAL: Each event MUST be from a DIFFERENT category. Pick exactly one from each:

Category A — Token/Market Action:
  Price pumps/dumps >20%, viral memecoin launches, liquidation cascades, exchange listing pumps, major market crashes or rallies, AI/agent token surges or crashes (e.g. FET, RNDR, AI16Z, VIRTUAL)

Category B — Macro, World Events & Tech Breakthroughs Impacting Crypto:
  Geopolitical conflicts (wars, sanctions, diplomatic shifts), central bank decisions (rate cuts/hikes, QE), government regulations, trade wars, economic crises, major political events. Also: major AI developments (new model releases from OpenAI/Google/Anthropic, NVIDIA earnings, AI agent platform launches) that move AI token sentiment or spark Crypto Twitter discussion. Fallback: protocol launches, hacks, or industry partnerships if no macro/AI event is dominant.

Category C — People & Culture:
  Celebrity/influencer crypto moments, famous people speeches/tweets about crypto, AI founder statements (Sam Altman, Elon Musk on AI), CT drama, community milestones, viral crypto or AI memes, cultural moments

PRIORITY RULE: If a major geopolitical or macro event (war, financial crisis, regulatory crackdown) is dominating headlines and clearly affecting crypto prices or sentiment in the past 48 hours, it MUST take the Category B slot — do NOT substitute it with a minor industry story.

Prefer events from the last 24 hours, but include events up to 48 hours old if they are still actively trending or developing.

For each event, include the X (Twitter) handle of the key person or entity involved (e.g. @elonmusk, @solana, @VitalikButerin). Use null if no clear handle.

Return as JSON array: [{ "title": "...", "summary": "...", "trend_reason": "...", "x_handle": "@...", "category": "A"|"B"|"C" }]`;

    if (recentMemeThemes.length > 0) {
      const themesList = recentMemeThemes
        .map(t => `- "${t.title}" (${(t.tags || []).join(', ')})`)
        .join('\n');
      prompt += `\n\nAVOID these themes (already used as memes recently):\n${themesList}\nPick topics that are DIFFERENT from the above.`;
    }

    const content = await this.callGrokWithSearch(prompt, 1200);
    const newsData = this.parseGrokNewsResponse(content);
    if (newsData.length > 0) {
      console.log(`📰 Grok web search returned ${newsData.length} news items for ${today}`);
      return newsData;
    }
    return this.getFallbackNews();
  }

  /**
   * Parse Grok response into structured news array.
   */
  parseGrokNewsResponse(content) {
    try {
      const jsonMatch = content.match(/\[\s*\{[\s\S]*?\}\s*\]/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        if (Array.isArray(data) && data.length > 0) return data;
      }
      const data = JSON.parse(content);
      return Array.isArray(data) ? data : [data];
    } catch {
      return this.parseNewsFromText(content);
    }
  }

  parseNewsFromText(text) {
    const topics = text.split('\n').filter(line => line.trim().length > 0);
    const news = [];

    for (let i = 0; i < Math.min(topics.length, 3); i++) {
      news.push({
        title: topics[i].substring(0, 50),
        summary: topics[i],
        trend_reason: 'Current market discussion',
        source: 'Grok Web Search',
      });
    }

    return news.length > 0 ? news : this.getFallbackNews();
  }

  getFallbackNews() {
    const today = new Date().toISOString().split('T')[0];
    return [
      {
        title: `Crypto market movers ${today}`,
        summary: `Top cryptocurrency price movements and trading volume spikes for ${today}.`,
        trend_reason: 'Daily market activity',
        category: 'A',
        source: 'Fallback',
      },
      {
        title: `Web3 tech and protocol updates ${today}`,
        summary: `Latest blockchain upgrades, DeFi protocol launches, and AI×Web3 developments on ${today}.`,
        trend_reason: 'Industry developments',
        category: 'B',
        source: 'Fallback',
      },
      {
        title: `Crypto culture and community moments ${today}`,
        summary: `Notable crypto community milestones, influencer takes, and viral moments on ${today}.`,
        trend_reason: 'Community buzz',
        category: 'C',
        source: 'Fallback',
      },
    ];
  }

  /**
   * Extract and validate a cryptocurrency token symbol from a news headline.
   * Uses Grok chat (no web search) for extraction, DexScreener for validation.
   * @param {string} newsTitle
   * @returns {Promise<{symbol: string, verified: boolean}|null>}
   */
  async extractTokenSymbol(newsTitle) {
    try {
      if (!this.grokApiKey || !newsTitle) return null;

      // Step 1: Grok extraction via chat completions (NOT web search)
      const response = await fetch(this.grokChatUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.grokApiKey}`,
        },
        body: JSON.stringify({
          model: 'grok-4-1-fast-reasoning',
          messages: [{
            role: 'user',
            content: `Extract the exact cryptocurrency/memecoin ticker symbol from this news headline.\nOnly return the ticker symbol in ALL CAPS (e.g. BTC, SOL, PIPPIN, ESP).\nIf no specific token is mentioned, return "NONE".\n\nHeadline: "${newsTitle}"\n\nSymbol:`,
          }],
          max_tokens: 20,
          temperature: 0,
        }),
      });

      if (!response.ok) return null;
      const data = await response.json();
      const symbol = (data.choices?.[0]?.message?.content || '').trim().toUpperCase();

      if (!symbol || symbol === 'NONE' || symbol.length > 10) return null;

      // Step 2: DexScreener validation
      const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(symbol)}`);
      if (!dexRes.ok) return null;
      const dexData = await dexRes.json();
      const pairs = dexData.pairs || [];
      const match = pairs.some(p =>
        p.baseToken?.symbol?.toUpperCase() === symbol
      );

      if (match) {
        console.log(`🪙 Token symbol extracted and verified: $${symbol}`);
        return { symbol, verified: true };
      }

      console.log(`🪙 Token symbol "${symbol}" not found on DexScreener, skipping`);
      return null;
    } catch (error) {
      console.error('Error extracting token symbol:', error.message);
      return null;
    }
  }

  async analyzeTrendingTopics(count = 5) {
    try {
      const prompt = `Analyze the top ${count} trending topics in crypto/blockchain that would make great meme content today. Consider:
      - Price movements and market reactions
      - New protocol launches or updates
      - Community drama or celebrations
      - Regulatory news impact
      - Celebrity or institutional involvement

      Return a JSON array of trending topics with meme potential.`;

      const response = await fetch(this.grokChatUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.grokApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'grok-4-1-fast-non-reasoning',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
          max_tokens: 800
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices[0].message.content;
      }

      return "Current crypto trends include DeFi innovations, NFT market developments, and regulatory discussions.";

    } catch (error) {
      console.error('Error analyzing trends:', error);
      return "Crypto market showing typical volatility with community engagement high.";
    }
  }

  async testConnection() {
    try {
      const response = await fetch(this.grokChatUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.grokApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'grok-4-1-fast-non-reasoning',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10
        })
      });

      return {
        success: response.ok,
        message: response.ok ? 'Grok API connection successful' : `Grok API error: ${response.status}`,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        message: `Grok API connection failed: ${error.message}`,
        error: error.message
      };
    }
  }
}

module.exports = new NewsService();
