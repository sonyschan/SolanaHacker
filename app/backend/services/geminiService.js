const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const fs = require('fs');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Text model for meme prompt generation (use the same model as image)
    this.textModel = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    // Image model using agent skill - NFT quality for premium memes
    this.imageModel = this.genAI.getGenerativeModel({
      model: "gemini-3-pro-image-preview",
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });
  }

  async generateMemePrompt(newsContent) {
    try {
      const prompt = `Based on this crypto/tech news: "${newsContent}"
      
Create a funny, engaging meme concept that would appeal to crypto and tech enthusiasts. 
Include:
1. A brief description of the visual scene
2. Any text that should appear on the meme
3. The emotional tone (funny, ironic, relatable, etc.)

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
      // Enhanced prompt for high-quality NFT meme generation
      const imagePrompt = `Create a high-quality meme image: ${prompt}

Style requirements:
- Internet meme format with bold, readable text overlay
- High contrast colors for maximum visual impact
- Professional typography with clear font hierarchy
- Viral meme aesthetic that's instantly shareable
- NFT-quality artwork suitable for collection
- Square aspect ratio (1:1) optimized for social media
- Clean composition with balanced visual elements

Technical specs:
- High resolution (minimum 512x512, prefer 1024x1024)
- Bold text that stands out against background
- Engaging visual composition that captures attention
- Professional finish suitable for digital collectibles`;

      console.log('🎨 Generating real image with Gemini...');
      
      // Use actual Gemini API for image generation
      const result = await this.imageModel.generateContent(imagePrompt);
      const response = result.response;
      const candidates = response.candidates;

      if (!candidates || candidates.length === 0) {
        throw new Error('No candidates in Gemini response');
      }

      const parts = candidates[0].content?.parts;
      if (!parts) {
        throw new Error('No parts in Gemini response');
      }

      const imagePart = parts.find((part) =>
        part.inlineData?.mimeType?.startsWith('image/')
      );

      if (!imagePart || !imagePart.inlineData?.data) {
        const textPart = parts.find((part) => part.text);
        if (textPart) {
          throw new Error(`Image generation failed - ${textPart.text.substring(0, 200)}`);
        }
        throw new Error('No image in Gemini response');
      }

      // Save the image to public/generated folder
      const outputDir = path.join(__dirname, '../public/generated');
      fs.mkdirSync(outputDir, { recursive: true });

      const filename = `meme-${Date.now()}.png`;
      const outputPath = path.join(outputDir, filename);
      const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
      fs.writeFileSync(outputPath, imageBuffer);

      console.log(`✅ Image generated and saved: ${filename}`);
      
      return {
        success: true,
        imagePrompt,
        imageData: imagePart.inlineData.data,
        fallbackUrl: `/generated/${filename}`,
        localPath: outputPath,
        fileSize: imageBuffer.length,
        developmentMode: false
      };
      
    } catch (error) {
      console.error('Error in meme image generation:', error);
      
      return {
        success: false,
        error: error.message,
        imagePrompt: prompt,
        fallbackUrl: 'https://via.placeholder.com/512x512/ef4444/ffffff?text=Generation+Failed',
        note: 'Image generation failed - using error placeholder'
      };
    }
  }

  async generateDailyMemes(newsData, count = 3) {
    try {
      const memes = [];
      
      for (let i = 0; i < count; i++) {
        const newsItem = newsData[i] || newsData[0]; // Use available news or fallback
        const memePrompt = await this.generateMemePrompt(newsItem.title || newsItem);
        const imageData = await this.generateMemeImage(memePrompt);
        
        // Generate a catchy title based on the news
        const titleResult = await this.textModel.generateContent(
          `Create a short, catchy title (max 6 words) for this meme concept: ${memePrompt.substring(0, 200)}`
        );
        const titleResponse = await titleResult.response;
        const title = titleResponse.text().trim().replace(/"/g, '');
        
        memes.push({
          id: `meme_${Date.now()}_${i}`,
          title: title || `AI Meme #${i + 1}`,
          description: memePrompt.substring(0, 100) + '...',
          prompt: memePrompt,
          imageUrl: imageData.fallbackUrl,
          newsSource: newsItem.title || 'Crypto News',
          generatedAt: new Date().toISOString(),
          type: 'daily',
          status: 'active',
          votes: {
            selection: { yes: 0, no: 0 },
            rarity: { common: 0, rare: 0, legendary: 0 }
          },
          metadata: {
            originalNews: newsItem.title || newsItem,
            aiModel: 'gemini-3-pro-image-preview',
            imageGenerated: imageData.success,
            fileSize: imageData.fileSize || 0
          },
          rarity: 'unknown'
        });
        
        // Add delay to avoid rate limiting (Gemini has generous limits)
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      console.log(`✅ Generated ${memes.length} daily memes with real AI images`);
      return memes;
    } catch (error) {
      console.error('Error generating daily memes:', error);
      throw new Error(`Failed to generate daily memes: ${error.message}`);
    }
  }

  // Test connectivity for text model
  async testConnection() {
    try {
      // Test text model
      const textResult = await this.textModel.generateContent("Say hello from MemeForge!");
      const textResponse = await textResult.response;
      
      return {
        success: true,
        message: 'Gemini text API connection successful',
        textModel: {
          model: 'gemini-1.5-flash',
          status: 'connected',
          testResponse: textResponse.text()
        },
        imageModel: {
          model: 'imagen (Vertex AI)', 
          status: 'not implemented yet',
          testResponse: 'Image generation needs Vertex AI setup'
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