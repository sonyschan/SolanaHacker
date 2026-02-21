#!/usr/bin/env node

const { GoogleGenerativeAI } = require('../app/node_modules/@google/generative-ai');
const fs = require('fs');
const path = require('path');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateStreakInfographic() {
  try {
    console.log('🎨 Generating streak bonus infographic with Gemini 3 Pro Image Preview...');

    const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-image-preview' });

    const prompt = `Generate an infographic image that explains a "Streak Bonus" ticket reward system for a crypto meme voting platform.

RULES TO SHOW:
- Users earn lottery tickets by voting on memes daily
- Base tickets: random 1 to 10 per vote
- Streak bonus: +1 ticket per consecutive voting day, max +10
- Examples: Day 1 = 2-11, Day 5 = 6-15, Day 10+ = 11-20
- Miss a day = streak resets to 1

VISUAL DESIGN:
- Dark background (#111111), suitable for dark-themed web app
- Show a rising staircase/bar chart from Day 1 to Day 10
- Each bar has TWO colors: cyan/blue bottom section for "Base (1-10)" and green top section for "Streak Bonus (+N)"
- The green section grows taller each day
- Red warning text or icon at bottom: "Miss a day → Reset to Day 1"
- Title at top: "Streak Bonus System" in white bold text
- Subtitle formula: "Total Tickets = Base (1-10) + Streak (up to +10)"
- Clean, modern, gaming-tier UI style
- Wide landscape format (roughly 2:1 ratio)
- White text labels, minimal clutter
- Professional data visualization feel`;

    const result = await model.generateContent({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        responseModalities: ['image', 'text'],
      }
    });

    const response = result.response;

    if (response && response.candidates && response.candidates[0]) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.data) {
            const imageBuffer = Buffer.from(part.inlineData.data, 'base64');
            const outputPath = path.join(__dirname, '../app/public/images/streak-bonus-chart.png');

            const dir = path.dirname(outputPath);
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(outputPath, imageBuffer);
            console.log('✅ Infographic generated:', outputPath);
            console.log('📏 Size:', (imageBuffer.length / 1024).toFixed(2) + 'KB');
            return outputPath;
          }
          if (part.text) {
            console.log('📝 Text response:', part.text.substring(0, 300));
          }
        }
      }
    }

    throw new Error('No image data received from Gemini');

  } catch (error) {
    console.error('❌ Generation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  generateStreakInfographic()
    .then(result => {
      console.log('🎉 Done!', result);
    })
    .catch(error => {
      console.error('💥 Failed:', error);
      process.exit(1);
    });
}

module.exports = { generateStreakInfographic };
