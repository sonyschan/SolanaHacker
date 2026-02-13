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

  async generateMemeTitle(memePrompt) {
    try {
      const prompt = `Generate a short, catchy meme title in 2-5 words only. 

Meme concept: "${memePrompt.substring(0, 150)}"

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
        const words = memePrompt.split(' ').slice(0, 3);
        title = words.join(' ').replace(/[^a-zA-Z0-9 ]/g, '');
      }
      
      return title || 'AI Meme';
    } catch (error) {
      console.error('Error generating meme title:', error);
      // Fallback title generation
      const words = memePrompt.split(' ').slice(0, 3);
      return words.join(' ').replace(/[^a-zA-Z0-9 ]/g, '') || 'AI Meme';
    }
  }

  // Weighted random helper for tag count distribution
  weightedRandomTagCount() {
    const distribution = [
      { count: 2, weight: 35 },  // 35% - most common
      { count: 3, weight: 25 },  // 25%
      { count: 4, weight: 18 },  // 18%
      { count: 5, weight: 12 },  // 12%
      { count: 6, weight: 6 },   // 6%
      { count: 7, weight: 3 },   // 3%
      { count: 8, weight: 1 },   // 1% - most rare
    ];

    const total = distribution.reduce((sum, d) => sum + d.weight, 0);
    let random = Math.random() * total;

    for (const d of distribution) {
      random -= d.weight;
      if (random <= 0) return d.count;
    }
    return 2; // fallback
  }

  async generateMemeTags(memePrompt, newsSource) {
    try {
      const tagCount = this.weightedRandomTagCount();
      console.log(`🏷️ Generating ${tagCount} tags for meme...`);

      const prompt = `Analyze this meme and extract exactly ${tagCount} descriptive tags.

Meme concept: "${memePrompt.substring(0, 300)}"
News context: "${newsSource}"

Requirements:
- Output EXACTLY ${tagCount} tags, no more, no less
- Be specific and creative, avoid generic tags
- Include: emotions, topics, visual elements, characters, cultural references
- Capture any trending topics, crypto terms, or meme references
- Format: lowercase, hyphenated for multi-word (e.g., "diamond-hands")

BAD tags (too generic): "funny", "meme", "crypto", "image", "cool"
GOOD tags (specific): "bear-market-cope", "degen-energy", "this-is-fine-moment", "hopium-overdose", "ngmi-vibes"

Output as JSON array only, no explanation:
["tag1", "tag2", ...]`;

      const result = await this.textModel.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();

      // Clean up response to extract JSON array
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const tags = JSON.parse(jsonMatch[0]);
        // Ensure tags are properly formatted
        const cleanTags = tags
          .slice(0, tagCount)
          .map(tag => tag.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));

        console.log(`✅ Generated tags: ${cleanTags.join(', ')}`);
        return {
          tags: cleanTags,
          count: cleanTags.length,
          targetCount: tagCount
        };
      }

      throw new Error('Could not parse tags from response');
    } catch (error) {
      console.error('Error generating meme tags:', error);
      // Fallback: generate basic tags from news source
      const fallbackTags = ['ai-generated', 'crypto-meme'];
      return {
        tags: fallbackTags,
        count: fallbackTags.length,
        targetCount: 2,
        error: error.message
      };
    }
  }

  async generateMemeDescription(memePrompt, newsSource) {
    try {
      const prompt = `Write a brief, engaging meme description in 1-2 sentences (max 100 characters).

Meme concept: "${memePrompt.substring(0, 200)}"
News topic: "${newsSource}"

Requirements:
- Maximum 100 characters total
- No "Here is" or "This is" prefix
- Describe what the meme shows, not how it was made
- Fun and punchy tone
- Example: "When your portfolio is down 80% but you keep buying the dip"

Description:`;

      const result = await this.textModel.generateContent(prompt);
      const response = await result.response;
      let desc = response.text().trim();

      // Clean up
      desc = desc.replace(/^Description:\s*/i, '');
      desc = desc.replace(/^["']/g, '');
      desc = desc.replace(/["']$/g, '');

      // Ensure max length
      if (desc.length > 120) {
        desc = desc.substring(0, 117) + '...';
      }

      return desc || `Meme inspired by: ${newsSource}`;
    } catch (error) {
      console.error('Error generating meme description:', error);
      return `Meme inspired by: ${newsSource}`;
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
- EXACTLY 1024x1024 pixels resolution (required for NFT standard)
- Bold text that stands out against background
- Engaging visual composition that captures attention
- Professional finish suitable for digital collectibles
- PNG format with transparency support
- File size optimized for web (under 2MB)
- Perfect square ratio for consistent display across all platforms`;

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
        
        // Generate a catchy title using the new improved method
        const title = await this.generateMemeTitle(memePrompt);

        // Generate a clean, short description
        const description = await this.generateMemeDescription(memePrompt, newsItem.title || 'Crypto News');

        // Generate tags with weighted random count (2-8 tags)
        const tagsResult = await this.generateMemeTags(memePrompt, newsItem.title || 'Crypto News');

        memes.push({
          id: `meme_${Date.now()}_${i}`,
          title: title,
          description: description,
          prompt: memePrompt,
          imageUrl: imageData.imageUrl || imageData.fallbackUrl,
          newsSource: newsItem.title || 'Crypto News',
          generatedAt: new Date().toISOString(),
          type: 'daily',
          status: 'active',
          tags: tagsResult.tags,
          votes: {
            selection: { yes: 0, no: 0 },
            rarity: { common: 0, rare: 0, legendary: 0 }
          },
          metadata: {
            originalNews: newsItem.title || newsItem,
            aiModel: 'gemini-3-pro-image-preview',
            imageGenerated: imageData.success,
            fileSize: imageData.fileSize || 0,
            storageLocation: imageData.storageLocation || 'unknown',
            environment: imageData.environment || {},
            tagsGenerated: tagsResult.count,
            tagsTargetCount: tagsResult.targetCount
          },
          rarity: 'unknown'
        });
        
        // Add delay to avoid rate limiting (Gemini has generous limits)
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      console.log(`✅ Generated ${memes.length} daily memes with real AI images and improved titles`);
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