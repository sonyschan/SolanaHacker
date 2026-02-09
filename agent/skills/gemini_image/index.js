/**
 * Skill: gemini_image
 * Generate images with Gemini AI
 */

import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const tools = [
  {
    name: 'generate_image',
    description:
      'Generate an image using Gemini AI. Use cases:\n' +
      '• Icons (app icon, favicon, button icons): use model "gemini-2.5-flash-image"\n' +
      '• Logos and branding graphics: use model "gemini-2.5-flash-image"\n' +
      '• UI/UX assets (backgrounds, illustrations): use model "gemini-2.5-flash-image"\n' +
      '• NFT artwork (high detail): use model "gemini-3-pro-image-preview"\n' +
      'Returns path to generated image.',
    input_schema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Detailed description of the image to generate',
        },
        model: {
          type: 'string',
          enum: ['gemini-2.5-flash-image', 'gemini-3-pro-image-preview'],
          description: 'Model to use. Flash for UX assets (cheaper), Pro for NFT art (higher quality).',
        },
        filename: {
          type: 'string',
          description: 'Output filename (e.g., "hero-bg.png", "nft-001.png")',
        },
        reference_image_path: {
          type: 'string',
          description: 'Optional: path to reference image for style consistency',
        },
      },
      required: ['prompt', 'model', 'filename'],
    },
  },
];

export function createExecutors(deps) {
  const { workDir } = deps;

  return {
    async generate_image({ prompt, model, filename, reference_image_path }) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return 'Error: GEMINI_API_KEY not configured in .env';
      }

      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        console.log(`[Gemini] Using model: ${model}`);

        const genModel = genAI.getGenerativeModel({
          model: model,
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        });

        const contentParts = [prompt];

        if (reference_image_path) {
          const refPath = path.resolve(workDir, reference_image_path);
          if (fs.existsSync(refPath)) {
            const refImage = fs.readFileSync(refPath);
            const refBase64 = refImage.toString('base64');
            const ext = path.extname(refPath).toLowerCase();
            const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
            contentParts.push({ inlineData: { mimeType, data: refBase64 } });
            console.log(`[Gemini] Added reference image: ${refPath}`);
          }
        }

        console.log(`[Gemini] Generating image...`);
        const result = await genModel.generateContent(contentParts);
        const response = result.response;
        const candidates = response.candidates;

        if (!candidates || candidates.length === 0) {
          return 'Error: No candidates in Gemini response';
        }

        const parts = candidates[0].content?.parts;
        if (!parts) {
          return 'Error: No parts in Gemini response';
        }

        const imagePart = parts.find((part) =>
          part.inlineData?.mimeType?.startsWith('image/')
        );

        if (!imagePart || !imagePart.inlineData?.data) {
          const textPart = parts.find((part) => part.text);
          if (textPart) {
            return `Error: Image generation failed - ${textPart.text.substring(0, 200)}`;
          }
          return 'Error: No image in Gemini response';
        }

        const outputDir = path.join(workDir, 'public', 'generated');
        fs.mkdirSync(outputDir, { recursive: true });

        const outputPath = path.join(outputDir, filename);
        const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
        fs.writeFileSync(outputPath, imageBuffer);

        console.log(`[Gemini] Image saved to: ${outputPath}`);
        return `Image generated successfully!\nPath: ${outputPath}\nRelative: /generated/${filename}\nSize: ${imageBuffer.length} bytes`;
      } catch (err) {
        console.error(`[Gemini] Error:`, err.message);
        return `Error generating image: ${err.message}`;
      }
    },
  };
}
