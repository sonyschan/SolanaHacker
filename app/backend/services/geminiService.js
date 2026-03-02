const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const fs = require('fs');
const storageService = require('./storageService');

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

  async generateMemeTitle(memeIdea) {
    const context = typeof memeIdea === 'string'
      ? memeIdea.substring(0, 150)
      : `${memeIdea.caption || ''} — ${memeIdea.event_angle || ''}`.substring(0, 150);
    try {
      const prompt = `Generate a short, catchy meme title in 2-5 words only.

Meme concept: "${context}"

Requirements:
- Maximum 5 words
- No quotation marks
- No punctuation at the end
- Make it punchy and memorable
- Sound like a real meme title
- Examples: "Diamond Hands Forever", "This Is Fine", "Number Go Up", "Crypto Winter Mood"

Title:`;

      const result = await this.textModel.generateContent(prompt);
      const response = await result.response;
      let title = response.text().trim();
      
      // Clean up the title
      title = title.replace(/^Title:\s*/i, ''); // Remove "Title:" prefix
      title = title.replace(/["""'']/g, ''); // Remove all types of quotes
      title = title.replace(/[.!?]+$/, ''); // Remove ending punctuation
      title = title.trim();
      
      // Fallback if title is too long or empty
      if (!title || title.length > 50) {
        const fallback = typeof memeIdea === 'string' ? memeIdea : (memeIdea.caption || '');
        const words = fallback.split(' ').slice(0, 3);
        title = words.join(' ').replace(/[^a-zA-Z0-9 ]/g, '');
      }

      return title || 'AI Meme';
    } catch (error) {
      console.error('Error generating meme title:', error);
      const fallback = typeof memeIdea === 'string' ? memeIdea : (memeIdea.caption || '');
      const words = fallback.split(' ').slice(0, 3);
      return words.join(' ').replace(/[^a-zA-Z0-9 ]/g, '') || 'AI Meme';
    }
  }

  // Weighted random helper for tag count distribution
  weightedRandomTagCount() {
    const distribution = [
      { count: 2, weight: 35 },
      { count: 3, weight: 25 },
      { count: 4, weight: 18 },
      { count: 5, weight: 12 },
      { count: 6, weight: 6 },
      { count: 7, weight: 3 },
      { count: 8, weight: 1 },
    ];
    const total = distribution.reduce((sum, d) => sum + d.weight, 0);
    let random = Math.random() * total;
    for (const d of distribution) {
      random -= d.weight;
      if (random <= 0) return d.count;
    }
    return 2;
  }

  async generateMemeTags(memeIdea, newsSource) {
    try {
      const tagCount = this.weightedRandomTagCount();
      console.log(`🏷️ Generating ${tagCount} tags...`);

      const memeContext = typeof memeIdea === 'string'
        ? memeIdea.substring(0, 300)
        : `Caption: "${memeIdea.caption || ''}" | Template: ${memeIdea.template_id || ''} | Emotion: ${memeIdea.emotion || ''} | Angle: ${memeIdea.event_angle || ''}`.substring(0, 300);

      const prompt = `Analyze this meme and extract exactly ${tagCount} descriptive tags.

Meme concept: "${memeContext}"
News context: "${newsSource}"

Requirements:
- Output EXACTLY ${tagCount} single-word tags (one word each, no hyphens, no multi-word)
- Be specific and creative
- Include: emotions, topics, visual elements, cultural references
- Examples: pump, degen, fomo, bullish, chaos, ironic, solana, memecoin

Output as JSON array only:
["tag1", "tag2", ...]`;

      const result = await this.textModel.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();

      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const tags = JSON.parse(jsonMatch[0]);
        const cleanTags = tags
          .slice(0, tagCount)
          .map(tag => tag.toLowerCase().replace(/[^a-z0-9]/g, ''));
        console.log(`✅ Generated tags: ${cleanTags.join(', ')}`);
        return cleanTags;
      }
      return ['ai', 'crypto'];
    } catch (error) {
      console.error('Error generating tags:', error);
      return ['ai', 'crypto'];
    }
  }

  async generateMemeDescription(memeIdea, newsSource) {
    try {
      const memeContext = typeof memeIdea === 'string'
        ? memeIdea.substring(0, 200)
        : `Caption: "${memeIdea.caption || ''}" | Twist: ${memeIdea.twist || ''}`.substring(0, 200);

      const prompt = `Write a brief, fun meme description in 1-2 sentences (max 120 characters).

Meme concept: "${memeContext}"
News topic: "${newsSource}"

Requirements:
- Maximum 120 characters
- No "Here is" or "This is" prefix
- Describe what the meme shows
- Fun and punchy tone

Description:`;

      const result = await this.textModel.generateContent(prompt);
      const response = await result.response;
      let desc = response.text().trim();

      desc = desc.replace(/^Description:\s*/i, '');
      desc = desc.replace(/^["']/g, '');
      desc = desc.replace(/["']$/g, '');

      if (desc.length > 150) {
        desc = desc.substring(0, 147) + '...';
      }

      return desc || `Meme inspired by: ${newsSource}`;
    } catch (error) {
      console.error('Error generating description:', error);
      return `Meme inspired by: ${newsSource}`;
    }
  }

  async generateMemeImage(imagePrompt) {
    try {
      console.log(`🎨 Generating meme image...`);
      
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

      // Environment-based storage strategy
      const isProduction = process.env.NODE_ENV === 'production';
      const isVercel = process.env.VERCEL === '1';
      const useGCS = process.env.USE_GCS === 'true';
      const shouldUseCloudStorage = isProduction || isVercel || useGCS;

      const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
      const filename = storageService.generateFilename('meme', 'png');

      let imageUrl, localPath, storageLocation;

      if (shouldUseCloudStorage) {
        // Production/Vercel: Store in Google Cloud Storage
        try {
          const uploadResult = await storageService.uploadImage(imageBuffer, filename, {
            contentType: 'image/png',
            aiModel: 'gemini-3-pro-image-preview',
            generatedAt: new Date().toISOString()
          });
          
          imageUrl = uploadResult.url;
          storageLocation = 'gcs';
          console.log(`✅ Image uploaded to GCS: ${filename}`);
          
        } catch (gcsError) {
          console.error('GCS upload failed, falling back to local storage:', gcsError);
          // Fallback to local storage if GCS fails
          const outputDir = path.join(__dirname, '../public/generated');
          fs.mkdirSync(outputDir, { recursive: true });
          localPath = path.join(outputDir, filename);
          fs.writeFileSync(localPath, imageBuffer);
          imageUrl = `/generated/${filename}`;
          storageLocation = 'local-fallback';
        }
        
      } else {
        // Development: Store locally for fast iteration
        const outputDir = path.join(__dirname, '../public/generated');
        fs.mkdirSync(outputDir, { recursive: true });
        localPath = path.join(outputDir, filename);
        fs.writeFileSync(localPath, imageBuffer);
        imageUrl = `/generated/${filename}`;
        storageLocation = 'local';
        console.log(`✅ Image saved locally: ${filename}`);
      }
      
      return {
        success: true,
        imagePrompt,
        imageData: imagePart.inlineData.data,
        imageUrl,
        localPath,
        fileSize: imageBuffer.length,
        storageLocation,
        environment: {
          isProduction,
          isVercel,
          useGCS,
          shouldUseCloudStorage
        }
      };
      
    } catch (error) {
      console.error('Error in meme image generation:', error);
      
      return {
        success: false,
        error: error.message,
        imagePrompt: imagePrompt,
        fallbackUrl: 'https://via.placeholder.com/512x512/ef4444/ffffff?text=Generation+Failed',
        note: 'Image generation failed - using error placeholder'
      };
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