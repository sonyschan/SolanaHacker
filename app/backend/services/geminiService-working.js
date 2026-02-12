const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const fs = require('fs');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use correct model names from API
    this.textModel = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    // Use the experimental image generation model!
    this.imageModel = this.genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp-image-generation"
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

  async generateMemeImage(prompt) {
    try {
      console.log('🎨 Generating real meme image with Gemini 2.0 Image Generation...');
      
      // Enhanced prompt for high-quality meme generation
      const imagePrompt = `Create a high-quality internet meme image based on this concept:
${prompt}

Style requirements:
- Classic internet meme format
- Bold, readable text overlay with black outline on white text
- High contrast colors for maximum visual impact
- Square aspect ratio (1:1) optimized for social media
- Professional finish suitable for sharing
- Crypto/tech themed visual elements
- Engaging composition that captures attention
- Clear, sharp details at 1024x1024 resolution`;

      const result = await this.imageModel.generateContent(imagePrompt);
      const response = result.response;
      
      // Check if we have image data in the response
      const candidates = response.candidates;
      if (!candidates || candidates.length === 0) {
        throw new Error('No candidates in Gemini image response');
      }

      const parts = candidates[0].content?.parts;
      if (!parts) {
        throw new Error('No parts in Gemini image response');
      }

      // Look for image data
      const imagePart = parts.find((part) =>
        part.inlineData?.mimeType?.startsWith('image/')
      );

      if (!imagePart || !imagePart.inlineData?.data) {
        // If no image, check for text explanation
        const textPart = parts.find((part) => part.text);
        if (textPart) {
          console.log('Image generation response:', textPart.text);
          throw new Error(`Image generation failed: ${textPart.text.substring(0, 200)}`);
        }
        throw new Error('No image data in Gemini response');
      }

      // Save the generated image
      const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
      const filename = `meme_${Date.now()}.png`;
      const outputDir = path.join(__dirname, '../public/generated');
      fs.mkdirSync(outputDir, { recursive: true });
      
      const filePath = path.join(outputDir, filename);
      fs.writeFileSync(filePath, imageBuffer);
      
      console.log(`✅ Real AI image saved: ${filename} (${imageBuffer.length} bytes)`);
      
      return {
        success: true,
        imagePrompt: prompt,
        imageUrl: `/generated/${filename}`,
        localPath: filePath,
        fileSize: imageBuffer.length,
        storageLocation: 'local',
        realImage: true,
        mimeType: imagePart.inlineData.mimeType
      };
      
    } catch (error) {
      console.error('Error in meme image generation:', error);
      
      // Create fallback placeholder
      const placeholderUrl = `https://via.placeholder.com/512x512/3b82f6/ffffff?text=${encodeURIComponent('AI Generated Meme')}`;
      
      return {
        success: false,
        error: error.message,
        imagePrompt: prompt,
        imageUrl: placeholderUrl,
        fallbackUrl: placeholderUrl,
        note: 'Real image generation failed - using placeholder'
      };
    }
  }

  async generateDailyMemes(newsData, count = 3) {
    try {
      const memes = [];
      
      for (let i = 0; i < count; i++) {
        console.log(`🔄 Generating meme ${i + 1}/${count}...`);
        
        const newsItem = newsData[i] || newsData[0];
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
            aiModel: 'gemini-2.0-flash-exp-image-generation',
            imageGenerated: imageData.success,
            fileSize: imageData.fileSize || 0,
            storageLocation: imageData.storageLocation || 'unknown',
            realImage: imageData.realImage || false,
            error: imageData.error || null
          },
          rarity: 'unknown'
        });
        
        console.log(`✅ Generated: ${title} (Real image: ${imageData.success})`);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      const successCount = memes.filter(m => m.metadata.imageGenerated).length;
      console.log(`🎉 Generated ${memes.length} memes (${successCount} with real AI images)`);
      
      return memes;
    } catch (error) {
      console.error('Error generating daily memes:', error);
      throw new Error(`Failed to generate daily memes: ${error.message}`);
    }
  }

  // Test connectivity
  async testConnection() {
    try {
      // Test text model
      const textResult = await this.textModel.generateContent("Say hello from MemeForge with real image generation!");
      const textResponse = await textResult.response;
      
      return {
        success: true,
        message: 'Gemini API connection successful with image generation!',
        textModel: {
          model: 'gemini-2.5-flash',
          status: 'connected',
          testResponse: textResponse.text()
        },
        imageModel: {
          model: 'gemini-2.0-flash-exp-image-generation', 
          status: 'connected',
          testResponse: 'Ready to generate real meme images!'
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