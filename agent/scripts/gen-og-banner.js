/**
 * Generate OG banner using Gemini image generation
 * Usage: cd /home/projects/solanahacker/agent && node scripts/gen-og-banner.js
 */
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error('Missing GEMINI_API_KEY'); process.exit(1); }

const prompt = `Create a wide banner image for social media Open Graph preview (landscape, approximately 1200x630 pixels).

Theme: AI Meme Forge - a cyber forge workshop where AI memes are created.

Style: Pixar-quality 3D render, vibrant neon colors (cyan, magenta, orange glow), dark industrial forge background with glowing lava and floating digital particles.

Center: A confident blue-haired teenage girl character (Memeya) wielding a giant glowing lava hammer, standing in a futuristic digital forge. She wears a brown leather apron over a hoodie with green code patterns. She looks energetic and fun.

Background: Floating holographic screens showing memes, emoji particles (🔥😎), circuit board patterns, sparks from the forge.

Right side: Clean, clearly readable text "AiMemeForge.io" in a modern glowing tech font.

Bottom text line: "Vote on AI Memes · Earn Real SOL" in smaller clean text.

Important: Make all text clearly legible. Energetic, fun, crypto-native mood. No watermarks.`;

console.log('Generating OG banner with Gemini...');

const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${API_KEY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    }),
  }
);

if (!response.ok) {
  const err = await response.text();
  console.error(`API error ${response.status}: ${err.slice(0, 500)}`);
  process.exit(1);
}

const data = await response.json();
const parts = data.candidates?.[0]?.content?.parts || [];

let saved = false;
for (const part of parts) {
  if (part.inlineData) {
    const buf = Buffer.from(part.inlineData.data, 'base64');
    const outPath = '/home/projects/solanahacker/app/public/images/og-banner.png';
    const { writeFileSync } = await import('fs');
    writeFileSync(outPath, buf);
    console.log(`✅ Saved: ${outPath} (${buf.length} bytes)`);
    saved = true;
  } else if (part.text) {
    console.log(`Gemini text: ${part.text.slice(0, 200)}`);
  }
}

if (!saved) {
  console.error('No image in response');
  console.error(JSON.stringify(data).slice(0, 1000));
}
