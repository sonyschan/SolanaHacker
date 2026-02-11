/**
 * MemeForge Frontend API Service
 * 前端 API 呼叫服務
 */

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://memeforge-api.example.com'  // TODO: Update with actual production URL
  : 'http://localhost:3001';  // Local backend port

class MemeService {
  
  /**
   * Test backend connections
   */
  async testConnections() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/memes/test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Backend connection test failed:', error);
      return {
        success: false,
        error: error.message,
        fallback: true
      };
    }
  }

  /**
   * Generate daily memes
   */
  async generateDailyMemes() {
    try {
      console.log('📅 Calling backend to generate daily memes...');
      
      const response = await fetch(`${API_BASE_URL}/api/memes/generate-daily`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          count: 3  // Generate 3 memes per day
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ Daily memes generated:', result);
      
      return result;
    } catch (error) {
      console.error('Daily memes generation failed:', error);
      return {
        success: false,
        error: error.message,
        memes: this.getFallbackMemes()
      };
    }
  }

  /**
   * Get today's memes
   */
  async getTodaysMemes() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/memes/today`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // If no memes found, try to generate them
      if (result.memes && result.memes.length === 0) {
        console.log('📅 No memes for today, generating new ones...');
        const generateResult = await this.generateDailyMemes();
        return generateResult;
      }
      
      return result;
    } catch (error) {
      console.error('Failed to get today\'s memes:', error);
      return {
        success: false,
        error: error.message,
        memes: this.getFallbackMemes(),
        fallback: true
      };
    }
  }

  /**
   * Generate a single custom meme
   */
  async generateMeme(prompt, theme = 'crypto') {
    try {
      const response = await fetch(`${API_BASE_URL}/api/memes/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          theme,
          style: 'funny'
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Meme generation failed:', error);
      return {
        success: false,
        error: error.message,
        meme: null
      };
    }
  }

  /**
   * Get fallback memes when backend is not available
   */
  getFallbackMemes() {
    return [
      {
        id: 'fallback-1',
        title: 'AI Dreams of Electric Sheep',
        description: 'When AI tries to understand crypto volatility',
        imageUrl: '/generated/test-meme-flash.png', // Use our test image
        prompt: 'A confused robot looking at crypto charts',
        newsSource: 'Mock Crypto News',
        generatedAt: new Date().toISOString(),
        type: 'fallback',
        status: 'active',
        votes: {
          selection: { yes: 89, no: 23 },
          rarity: { common: 45, rare: 67, legendary: 123 }
        },
        metadata: {
          fallback: true,
          note: 'Backend connection failed - using fallback data'
        }
      },
      {
        id: 'fallback-2', 
        title: 'Diamond Hands Forever',
        description: 'HODLers when market crashes but they keep buying',
        imageUrl: '/generated/meme-preview-crypto-hodl.png',
        prompt: 'Diamond hands meme with crypto theme',
        newsSource: 'Mock DeFi News',
        generatedAt: new Date().toISOString(),
        type: 'fallback',
        status: 'active', 
        votes: {
          selection: { yes: 134, no: 45 },
          rarity: { common: 67, rare: 89, legendary: 178 }
        },
        metadata: {
          fallback: true,
          note: 'Backend connection failed - using fallback data'
        }
      },
      {
        id: 'fallback-3',
        title: 'This Is Fine DeFi',
        description: 'DeFi users when gas fees are $200+',
        imageUrl: '/generated/meme-preview-voting-democracy.png',
        prompt: 'This is fine meme but with DeFi theme',
        newsSource: 'Mock Solana News',
        generatedAt: new Date().toISOString(),
        type: 'fallback',
        status: 'active',
        votes: {
          selection: { yes: 98, no: 67 },
          rarity: { common: 56, rare: 78, legendary: 134 }
        },
        metadata: {
          fallback: true,
          note: 'Backend connection failed - using fallback data'
        }
      }
    ];
  }
}

// Create singleton instance
const memeService = new MemeService();

export default memeService;