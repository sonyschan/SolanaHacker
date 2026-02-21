const path = require('path');
const fs = require('fs');
const storageService = require('./storageService');

class GrokImageService {
  constructor() {
    this.apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
    this.baseUrl = 'https://api.x.ai/v1';
    this.model = 'grok-imagine-image-pro';
  }

  async generateMemeImage(prompt, style = 'Classic 2D Illustration') {
    try {
      const imagePrompt = `Create a high-quality meme image: ${prompt}\n\nART STYLE: ${style}\nSquare 1:1 aspect ratio, bold readable text, high contrast, NFT-quality.`;

      console.log(`🎨 [Grok] Generating meme in "${style}" style...`);

      const response = await fetch(`${this.baseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: imagePrompt,
          response_format: 'b64_json',
          n: 1,
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Grok API error: ${response.status} - ${errBody.substring(0, 200)}`);
      }

      const data = await response.json();
      const b64 = data.data?.[0]?.b64_json;
      if (!b64) throw new Error('No image data in Grok response');

      // Environment-based storage strategy (same as geminiService)
      const isProduction = process.env.NODE_ENV === 'production';
      const isVercel = process.env.VERCEL === '1';
      const useGCS = process.env.USE_GCS === 'true';
      const shouldUseCloudStorage = isProduction || isVercel || useGCS;

      const imageBuffer = Buffer.from(b64, 'base64');
      const filename = storageService.generateFilename('meme', 'png');

      let imageUrl, localPath, storageLocation;

      if (shouldUseCloudStorage) {
        try {
          const uploadResult = await storageService.uploadImage(imageBuffer, filename, {
            contentType: 'image/png',
            aiModel: 'grok-imagine-image-pro',
            generatedAt: new Date().toISOString()
          });

          imageUrl = uploadResult.url;
          storageLocation = 'gcs';
          console.log(`✅ [Grok] Image uploaded to GCS: ${filename}`);
        } catch (gcsError) {
          console.error('[Grok] GCS upload failed, falling back to local storage:', gcsError);
          const outputDir = path.join(__dirname, '../public/generated');
          fs.mkdirSync(outputDir, { recursive: true });
          localPath = path.join(outputDir, filename);
          fs.writeFileSync(localPath, imageBuffer);
          imageUrl = `/generated/${filename}`;
          storageLocation = 'local-fallback';
        }
      } else {
        const outputDir = path.join(__dirname, '../public/generated');
        fs.mkdirSync(outputDir, { recursive: true });
        localPath = path.join(outputDir, filename);
        fs.writeFileSync(localPath, imageBuffer);
        imageUrl = `/generated/${filename}`;
        storageLocation = 'local';
        console.log(`✅ [Grok] Image saved locally: ${filename}`);
      }

      return {
        success: true,
        imagePrompt,
        imageData: b64,
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
      console.error('[Grok] Image generation failed:', error);
      return {
        success: false,
        error: error.message,
        imagePrompt: prompt,
        fallbackUrl: 'https://via.placeholder.com/512x512/ef4444/ffffff?text=Grok+Generation+Failed',
        note: 'Grok image generation failed - using error placeholder'
      };
    }
  }
}

module.exports = new GrokImageService();
