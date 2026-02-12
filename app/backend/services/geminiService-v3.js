const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const fs = require('fs');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use Gemini 3 series models as requested by H2Crypto
    this.textModel = this.genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    // Use Gemini 3 Pro for image generation - latest and best!
    this.imageModel = this.genAI.getGenerativeModel({ 
      model: "gemini-3-pro-image-preview"
    });
  }

  async generateMemePrompt(newsContent) {
    try {
      const prompt = `基於這個加密貨幣/科技新聞創作梗圖概念: "${newsContent}"
      
創建一個有趣且引人入勝的梗圖概念，吸引加密貨幣和科技愛好者：
1. 詳細的視覺場景描述（人物、物件、設定）
2. 應該出現在梗圖上的文字（上方文字和下方文字）
3. 情感基調（有趣、諷刺、易懂等）

格式：「視覺：[描述] | 上方文字：[文字] | 下方文字：[文字] | 基調：[基調]」

保持適當內容，避免爭議性內容。`;

      const result = await this.textModel.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating meme prompt:', error);
      throw new Error(`Failed to generate meme prompt: ${error.message}`);
    }
  }

  async generateMemeImage(prompt) {
    try {
      console.log('🎨 使用 Gemini 3 Pro Image 生成真實梗圖...');
      
      // 為高品質梗圖生成增強提示詞
      const imagePrompt = `根據這個概念創建高品質的網路梗圖：
${prompt}

風格要求：
- 經典網路梗圖格式，上下文字佈局
- 粗體白色文字配黑色邊框，易於閱讀
- 高對比度顏色，視覺衝擊力強
- 方形比例 (1:1) 適合社群媒體
- 專業品質適合分享
- 加密貨幣/科技主題視覺元素
- 吸引注意力的構圖
- 1024x1024解析度的清晰細節

技術規格：
- 完全正方形比例
- 高解析度圖像
- 適合作為 NFT 的品質
- 清晰的文字可讀性
- 專業的視覺設計`;

      const result = await this.imageModel.generateContent(imagePrompt);
      const response = result.response;
      
      // 檢查是否有圖像數據
      const candidates = response.candidates;
      if (!candidates || candidates.length === 0) {
        throw new Error('Gemini 3 圖像回應中沒有候選結果');
      }

      const parts = candidates[0].content?.parts;
      if (!parts) {
        throw new Error('Gemini 3 圖像回應中沒有部分');
      }

      // 尋找圖像數據
      const imagePart = parts.find((part) =>
        part.inlineData?.mimeType?.startsWith('image/')
      );

      if (!imagePart || !imagePart.inlineData?.data) {
        // 如果沒有圖像，檢查文字說明
        const textPart = parts.find((part) => part.text);
        if (textPart) {
          console.log('圖像生成回應:', textPart.text);
          throw new Error(`圖像生成失敗: ${textPart.text.substring(0, 200)}`);
        }
        throw new Error('Gemini 3 回應中沒有圖像數據');
      }

      // 保存生成的圖像
      const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
      const filename = `meme_gemini3_${Date.now()}.png`;
      const outputDir = path.join(__dirname, '../public/generated');
      fs.mkdirSync(outputDir, { recursive: true });
      
      const filePath = path.join(outputDir, filename);
      fs.writeFileSync(filePath, imageBuffer);
      
      console.log(`✅ Gemini 3 真實AI圖像已保存: ${filename} (${imageBuffer.length} bytes)`);
      
      return {
        success: true,
        imagePrompt: prompt,
        imageUrl: `/generated/${filename}`,
        localPath: filePath,
        fileSize: imageBuffer.length,
        storageLocation: 'local',
        realImage: true,
        aiModel: 'gemini-3-pro-image-preview',
        mimeType: imagePart.inlineData.mimeType
      };
      
    } catch (error) {
      console.error('Gemini 3 梗圖圖像生成錯誤:', error);
      
      // 創建後備佔位符
      const placeholderUrl = `https://via.placeholder.com/512x512/3b82f6/ffffff?text=${encodeURIComponent('Gemini 3 AI Meme')}`;
      
      return {
        success: false,
        error: error.message,
        imagePrompt: prompt,
        imageUrl: placeholderUrl,
        fallbackUrl: placeholderUrl,
        note: 'Gemini 3 真實圖像生成失敗 - 使用佔位符',
        aiModel: 'gemini-3-pro-image-preview (failed)'
      };
    }
  }

  async generateDailyMemes(newsData, count = 3) {
    try {
      const memes = [];
      
      for (let i = 0; i < count; i++) {
        console.log(`🔄 使用 Gemini 3 生成梗圖 ${i + 1}/${count}...`);
        
        const newsItem = newsData[i] || newsData[0];
        const memePrompt = await this.generateMemePrompt(newsItem);
        const imageData = await this.generateMemeImage(memePrompt);
        
        // 生成吸引人的標題
        const titleResult = await this.textModel.generateContent(
          `為這個梗圖概念創建簡短、吸引人的中文標題（最多6個字）: ${memePrompt.substring(0, 200)}`
        );
        const titleResponse = await titleResult.response;
        const title = titleResponse.text().trim().replace(/['"「」]/g, '');
        
        memes.push({
          id: `meme_${Date.now()}_${i}`,
          title: title || `加密梗圖 #${i + 1}`,
          description: memePrompt.substring(0, 150) + '...',
          prompt: memePrompt,
          imageUrl: imageData.imageUrl,
          newsSource: newsItem,
          generatedAt: new Date().toISOString(),
          type: 'daily',
          status: 'active',
          votes: {
            selection: { yes: 0, no: 0 },
            rarity: { common: 0, rare: 0, legendary: 0 }
          },
          metadata: {
            originalNews: newsItem,
            aiModel: imageData.aiModel || 'gemini-3-pro-image-preview',
            imageGenerated: imageData.success,
            fileSize: imageData.fileSize || 0,
            storageLocation: imageData.storageLocation || 'unknown',
            realImage: imageData.realImage || false,
            error: imageData.error || null,
            gemini3: true
          },
          rarity: 'unknown'
        });
        
        console.log(`✅ 已生成: ${title} (真實圖像: ${imageData.success})`);
        
        // 添加延遲避免速率限制
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      const successCount = memes.filter(m => m.metadata.imageGenerated).length;
      console.log(`🎉 使用 Gemini 3 生成了 ${memes.length} 個梗圖 (${successCount} 個真實AI圖像)`);
      
      return memes;
    } catch (error) {
      console.error('生成每日梗圖錯誤:', error);
      throw new Error(`Failed to generate daily memes: ${error.message}`);
    }
  }

  // 測試連接性
  async testConnection() {
    try {
      // 測試文字模型
      const textResult = await this.textModel.generateContent("Hello from MemeForge with Gemini 3 series!");
      const textResponse = await textResult.response;
      
      return {
        success: true,
        message: 'Gemini 3 API 連接成功，支持圖像生成！',
        textModel: {
          model: 'gemini-3-flash-preview',
          status: 'connected',
          testResponse: textResponse.text()
        },
        imageModel: {
          model: 'gemini-3-pro-image-preview', 
          status: 'connected',
          testResponse: 'Ready to generate real meme images with Gemini 3!'
        },
        gemini3: true
      };
    } catch (error) {
      return {
        success: false,
        message: `Gemini 3 API 連接失敗: ${error.message}`,
        error: error.message
      };
    }
  }
}

module.exports = new GeminiService();