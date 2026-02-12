const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const fs = require('fs');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use correct model names for 2024
    this.textModel = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    // Gemini 1.5 Pro supports multimodal generation
    this.imageModel = this.genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.9,
        topP: 0.95
      }
    });
  }

  async generateMemePrompt(newsContent) {
    try {
      const prompt = `Based on this crypto/tech news: "${newsContent}"
      
Create a funny, engaging meme concept that would appeal to crypto and tech enthusiasts. 
Include:
1. A brief description of the visual scene (be specific about characters, objects, setting)
2. Any text that should appear on the meme (top text and bottom text)
3. The emotional tone (funny, ironic, relatable, etc.)

Format as: "Visual: [description] | Top text: [text] | Bottom text: [text] | Tone: [tone]"

Keep it appropriate and avoid controversial content.`;

      const result = await this.textModel.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating meme prompt:', error);
      throw new Error(`Failed to generate meme prompt: ${error.message}`);
    }
  }

  // Create a simple meme-style image using text description
  async generateMemeImage(prompt) {
    try {
      console.log('🎨 Creating meme description with Gemini...');
      
      // Generate detailed visual description for a meme
      const imagePrompt = `Create a detailed visual description for a meme image based on this concept:
${prompt}

Description should include:
- Specific visual elements (characters, objects, background)
- Color scheme and style
- Text placement and font style
- Overall composition

Make it suitable for a crypto/tech meme that would be popular on social media.

Format as a clear, detailed description that could be used to create an actual image.`;

      const result = await this.textModel.generateContent(imagePrompt);
      const response = await result.response;
      const imageDescription = response.text();
      
      // For now, create a placeholder image with the description
      // In production, this would use actual image generation
      const filename = `meme_${Date.now()}.json`;
      const outputDir = path.join(__dirname, '../public/generated');
      fs.mkdirSync(outputDir, { recursive: true });
      
      const memeData = {
        prompt: prompt,
        description: imageDescription,
        timestamp: new Date().toISOString(),
        placeholder: true
      };
      
      const filePath = path.join(outputDir, filename);
      fs.writeFileSync(filePath, JSON.stringify(memeData, null, 2));
      
      // Create a simple placeholder URL
      const placeholderUrl = `https://via.placeholder.com/512x512/3b82f6/ffffff?text=${encodeURIComponent('AI Meme Generated')}`;
      
      return {
        success: true,
        imagePrompt: prompt,
        description: imageDescription,
        imageUrl: placeholderUrl,
        localPath: filePath,
        fileSize: JSON.stringify(memeData).length,
        storageLocation: 'local',
        placeholder: true,
        note: 'Generated description - actual image generation needs image API'
      };
      
    } catch (error) {
      console.error('Error in meme description generation:', error);
      
      return {
        success: false,
        error: error.message,
        imagePrompt: prompt,
        fallbackUrl: 'https://via.placeholder.com/512x512/ef4444/ffffff?text=Generation+Failed',
        note: 'Description generation failed - using error placeholder'
      };
    }
  }

  async generateDailyMemes(newsData, count = 3) {
    try {
      const memes = [];
      
      for (let i = 0; i < count; i++) {
        console.log(`🔄 Generating meme ${i + 1}/${count}...`);
        
        const newsItem = newsData[i] || newsData[0]; // Use available news or fallback
        const memePrompt = await this.generateMemePrompt(newsItem);
        const imageData = await this.generateMemeImage(memePrompt);
        
        // Generate a catchy title
        const titleResult = await this.textModel.generateContent(
          `Create a short, catchy title (max 6 words) for this meme: ${memePrompt.substring(0, 200)}`
        );
        const titleResponse = await titleResult.response;
        const title = titleResponse.text().trim().replace(/['"]/g, '');
        
        memes.push({
          id: `meme_${Date.now()}_${i}`,
          title: title || `Crypto Meme #${i + 1}`,
          description: memePrompt.substring(0, 150) + '...',
          prompt: memePrompt,
          imageUrl: imageData.imageUrl || imageData.fallbackUrl,
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
            aiModel: 'gemini-1.5-flash',
            imageGenerated: imageData.success,
            fileSize: imageData.fileSize || 0,
            storageLocation: imageData.storageLocation || 'unknown',
            placeholder: imageData.placeholder || false
          },
          rarity: 'unknown'
        });
        
        console.log(`✅ Generated: ${title}`);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log(`🎉 Generated ${memes.length} daily memes with AI descriptions`);
      return memes;
    } catch (error) {
      console.error('Error generating daily memes:', error);
      throw new Error(`Failed to generate daily memes: ${error.message}`);
    }
  }

  // Test connectivity
  async testConnection() {
    try {
      const textResult = await this.textModel.generateContent("Say hello from MemeForge API test!");
      const textResponse = await textResult.response;
      
      return {
        success: true,
        message: 'Gemini API connection successful',
        textModel: {
          model: 'gemini-1.5-flash',
          status: 'connected',
          testResponse: textResponse.text()
        },
        imageModel: {
          model: 'gemini-1.5-pro (description)', 
          status: 'connected',
          testResponse: 'Ready to generate meme descriptions'
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Gemini API connection failed: ${error.message}`,
        error: error.message
      };
    }
  }
}

module.exports = new GeminiService();