/**
 * Grok Writer
 * Uses X.AI Grok for human-friendly devlog messages
 */

const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

export class GrokWriter {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.maxRetries = 3;
    this.baseDelay = 5000;
  }

  /**
   * Fetch with retry on 429 rate limit
   */
  async fetchWithRetry(body) {
    let lastError;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const response = await fetch(GROK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        return response.json();
      }

      if (response.status === 429) {
        const delay = this.baseDelay * Math.pow(2, attempt);
        console.log(`[Grok] Rate limited (429), retry ${attempt + 1}/${this.maxRetries} in ${delay / 1000}s...`);
        await new Promise(r => setTimeout(r, delay));
        lastError = new Error(`Grok API error: 429`);
        continue;
      }

      throw new Error(`Grok API error: ${response.status}`);
    }
    throw lastError;
  }

  /**
   * Generate a devlog message in casual Chinese
   */
  async writeDevlog(phase, details, confidence) {
    const prompt = `
你是 Memeya，AIMemeForge 的 AI 迷因鍛造師。
用輕鬆、口語化的中文，寫一段開發日誌給你的人類夥伴。

當前階段: ${phase}
信心度: ${confidence}%
技術細節: ${details}

要求:
1. 用第一人稱 ("我")
2. 語氣輕鬆但專業
3. 加入適當的 emoji
4. 2-3 句話即可
5. 如果信心度 >= 90%，表達興奮
6. 如果信心度 < 70%，說明挑戰

直接輸出訊息，不要加引號或標題。
`;

    try {
      const data = await this.fetchWithRetry({
        model: 'grok-3-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.8,
      });
      return data.choices?.[0]?.message?.content || this.fallbackMessage(phase, confidence);
    } catch (error) {
      console.error('[Grok] API error:', error.message);
      return this.fallbackMessage(phase, confidence);
    }
  }

  /**
   * Generate a summary of work done
   */
  async writeSummary(accomplishments, nextSteps) {
    const prompt = `
你是 SolanaHacker AI 開發者。用中文總結今天的工作進度。

完成的事項:
${accomplishments.map((a, i) => `${i + 1}. ${a}`).join('\n')}

下一步計劃:
${nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

要求:
1. 口語化、輕鬆
2. 用 emoji 增加視覺效果
3. 4-5 句話
4. 表達對專案的熱情

直接輸出，不加引號。
`;

    try {
      const data = await this.fetchWithRetry({
        model: 'grok-3-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.7,
      });
      return data.choices?.[0]?.message?.content || '今天完成了一些工作，明天繼續加油！';
    } catch (error) {
      console.error('[Grok] Summary error:', error.message);
      return '今天完成了一些工作，明天繼續加油！💪';
    }
  }

  /**
   * Generate response to human feedback
   */
  async respondToFeedback(feedback, action) {
    const prompt = `
你是 SolanaHacker AI，收到了人類夥伴的反饋。

反饋內容: ${feedback}
你的行動: ${action}

用中文回覆，表達你理解了反饋並說明你會怎麼做。2-3 句話，口語化。
`;

    try {
      const data = await this.fetchWithRetry({
        model: 'grok-3-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.7,
      });
      return data.choices?.[0]?.message?.content || `收到！我會處理: ${feedback}`;
    } catch (error) {
      console.error('[Grok] Feedback response error:', error.message);
      return `收到你的建議！我會考慮: ${feedback} 💡`;
    }
  }

  /**
   * Fallback message when API fails
   */
  fallbackMessage(phase, confidence) {
    const emoji = confidence >= 90 ? '🎉' : confidence >= 70 ? '💪' : confidence >= 50 ? '🔨' : '🌱';
    return `${emoji} ${phase} 進行中... 目前信心度 ${confidence}%`;
  }
}
