class NewsService {
  constructor() {
    // Using Grok API for news analysis and trends
    this.grokApiKey = process.env.GROK_API_KEY;
    this.grokBaseUrl = 'https://api.x.ai/v1';
  }

  async getCryptoNews() {
    try {
      // Using Grok to analyze current crypto trends
      const prompt = `Please provide 3 current trending topics in cryptocurrency and blockchain technology. 
      For each topic, provide:
      1. A brief title (under 50 characters)
      2. A summary (2-3 sentences)
      3. Why it's trending
      
      Focus on topics that would make good meme material - price movements, new technologies, community reactions, etc.
      
      Format as JSON array with objects containing: title, summary, trend_reason`;

      const response = await fetch(`${this.grokBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.grokApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'grok-4-1-fast-non-reasoning',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      // Try to parse JSON response
      try {
        const newsData = JSON.parse(content);
        return Array.isArray(newsData) ? newsData : [newsData];
      } catch (parseError) {
        // If JSON parsing fails, create structured data from text
        return this.parseNewsFromText(content);
      }

    } catch (error) {
      console.error('Error fetching crypto news:', error);
      
      // Fallback news data
      return this.getFallbackNews();
    }
  }

  parseNewsFromText(text) {
    // Simple parsing fallback
    const topics = text.split('\n').filter(line => line.trim().length > 0);
    const news = [];
    
    for (let i = 0; i < Math.min(topics.length, 3); i++) {
      news.push({
        title: topics[i].substring(0, 50),
        summary: topics[i],
        trend_reason: 'Current market discussion',
        source: 'Grok Analysis'
      });
    }
    
    return news.length > 0 ? news : this.getFallbackNews();
  }

  getFallbackNews() {
    const fallbackTopics = [
      {
        title: "Bitcoin Price Action",
        summary: "Bitcoin continues to show volatility as markets react to regulatory news and institutional adoption.",
        trend_reason: "Always a hot topic for memes",
        source: "Crypto Community"
      },
      {
        title: "Solana Ecosystem Growth", 
        summary: "New DeFi projects and NFT collections launching on Solana are driving network activity.",
        trend_reason: "Developer interest and transaction volume",
        source: "Solana News"
      },
      {
        title: "Meme Coin Season",
        summary: "Community-driven tokens are seeing increased attention and trading volume.",
        trend_reason: "Social media buzz and retail interest", 
        source: "DeFi Pulse"
      }
    ];

    return fallbackTopics;
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

      const response = await fetch(`${this.grokBaseUrl}/chat/completions`, {
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

  // Test connectivity  
  async testConnection() {
    try {
      const response = await fetch(`${this.grokBaseUrl}/chat/completions`, {
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