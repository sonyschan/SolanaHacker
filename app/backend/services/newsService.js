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
   * Fetch real-time crypto news via Grok web search.
   * @param {Array} recentMemeThemes - optional array of {title, tags, newsSource} from recent memes
   */
  async getCryptoNews(recentMemeThemes = []) {
    try {
      const today = new Date().toISOString().split('T')[0];

      let prompt = `Today is ${today}. Search for the 3 most meme-worthy crypto/blockchain events from the PAST 12 HOURS. Prioritize:
- Breaking price movements (coins pumping/dumping >20% today)
- New memecoin launches or viral tokens (e.g. tokens hitting $10M+ market cap today)
- Major protocol events, hacks, or launches happening NOW
- Regulatory announcements or celebrity crypto moves from TODAY
- Trending CT (Crypto Twitter) topics RIGHT NOW

If fewer than 3 events happened in the last 12 hours, extend to 24 hours.
Do NOT include old events (BTC hitting $100K months ago, Solana Saga launch, etc.) unless they are specifically trending again TODAY.

For each event, include the X (Twitter) handle of the key person or entity involved (e.g. @elonmusk, @solana, @VitalikButerin, @aaboronkov). Use null if no clear handle.

Return as JSON array: [{ "title": "...", "summary": "...", "trend_reason": "...", "x_handle": "@..." }]`;

      if (recentMemeThemes.length > 0) {
        const themesList = recentMemeThemes
          .map(t => `- "${t.title}" (${(t.tags || []).join(', ')})`)
          .join('\n');
        prompt += `\n\nAVOID these themes (already used as memes recently):\n${themesList}\nPick topics that are DIFFERENT from the above.`;
      }

      const content = await this.callGrokWithSearch(prompt, 1200);

      // Try to parse JSON response
      try {
        const jsonMatch = content.match(/\[\s*\{[\s\S]*?\}\s*\]/);
        if (jsonMatch) {
          const newsData = JSON.parse(jsonMatch[0]);
          if (Array.isArray(newsData) && newsData.length > 0) {
            console.log(`📰 Grok web search returned ${newsData.length} news items for ${today}`);
            return newsData;
          }
        }
        // If no JSON array found, try parsing the whole content
        const newsData = JSON.parse(content);
        return Array.isArray(newsData) ? newsData : [newsData];
      } catch (parseError) {
        // If JSON parsing fails, create structured data from text
        return this.parseNewsFromText(content);
      }
    } catch (error) {
      console.error('Error fetching crypto news via web search:', error);
      return this.getFallbackNews();
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
        title: `Crypto market update ${today}`,
        summary: `Latest cryptocurrency market movements and trends for ${today}.`,
        trend_reason: 'Daily market activity',
        source: 'Fallback',
      },
      {
        title: `DeFi and memecoin activity ${today}`,
        summary: `Decentralized finance and memecoin trading activity on ${today}.`,
        trend_reason: 'Community trading activity',
        source: 'Fallback',
      },
      {
        title: `Solana ecosystem developments ${today}`,
        summary: `Solana network updates and ecosystem growth on ${today}.`,
        trend_reason: 'Ecosystem growth',
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
