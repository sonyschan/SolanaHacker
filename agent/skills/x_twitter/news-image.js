/**
 * Generate a newspaper-style banner image for news_digest posts.
 * Uses Gemini image generation with X profile PFP as reference.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';

const X_PROFILE = 'AiMemeForgeIO';

/**
 * Fetch X profile picture via unavatar.io
 * @param {string} username - X/Twitter username (without @)
 * @returns {{ data: string, mimeType: string }}
 */
async function fetchXProfileImage(username) {
  const url = `https://unavatar.io/x/${username}`;
  const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`Avatar fetch failed: ${res.status}`);
  const contentType = (res.headers.get('content-type') || 'image/jpeg').split(';')[0];
  const buffer = Buffer.from(await res.arrayBuffer());
  return { data: buffer.toString('base64'), mimeType: contentType };
}

/**
 * Extract headlines from tweet text using Gemini text model.
 * @param {string} tweetText - The generated news tweet
 * @param {object} genAI - GoogleGenerativeAI instance
 * @returns {{ mainHeadline: string, subHeadlines: string[] }}
 */
async function extractHeadlines(tweetText, genAI) {
  const textModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await textModel.generateContent(
    `Extract newspaper headlines from this crypto news tweet. Return ONLY valid JSON, no markdown.

Tweet:
"${tweetText}"

Return JSON format:
{"mainHeadline": "Most important headline (max 60 chars)", "subHeadlines": ["Second headline", "Third headline"]}

Rules:
- mainHeadline: The single most newsworthy item, punchy newspaper style
- subHeadlines: 1-2 secondary items, shorter
- All headlines must be factual based on the tweet content
- No fabricated details — only what's in the tweet`
  );
  const text = result.response.text().trim();
  // Strip markdown code fences if present
  const cleaned = text.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(cleaned);
}

/**
 * Generate newspaper-style banner image.
 * @param {string} tweetText - The news tweet text (used to extract headlines)
 * @param {object} [options]
 * @param {string} [options.xUsername] - X username for PFP (default: AiMemeForgeIO)
 * @returns {{ buffer: Buffer, mimeType: string } | null}
 */
export async function generateNewsImage(tweetText, options = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[news-image] GEMINI_API_KEY not set, skipping image generation');
    return null;
  }

  const username = options.xUsername || X_PROFILE;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    // Parallel: fetch PFP + extract headlines
    const [pfp, headlines] = await Promise.all([
      fetchXProfileImage(username),
      extractHeadlines(tweetText, genAI),
    ]);

    console.log(`[news-image] Headlines: "${headlines.mainHeadline}" | ${headlines.subHeadlines.join(' | ')}`);

    // Build date string in GMT+8
    const now = new Date(Date.now() + 8 * 3600_000);
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

    const subHeadlineText = headlines.subHeadlines.slice(0, 2).join('  |  ');

    const imagePrompt = `Create a newspaper-style HERO BANNER image for a crypto morning news digest.

DESIGN — "broadsheet newspaper meets crypto trading desk":
- Vintage yellowed/aged paper texture as the background
- Classic newspaper masthead at the top: "THE CRYPTO CHRONICLE" in large ornate serif font
- Date line: "${dateStr} — Morning Edition"
- Main headline in bold serif: "${headlines.mainHeadline}"
- Sub-headlines below in smaller text: "${subHeadlineText}"
- Faded candlestick chart / stock ticker watermark in the background behind the text
- A thin horizontal rule / divider between masthead and headlines

AVATAR placement:
- Place the provided profile picture in a CIRCULAR FRAME in the top-right corner of the newspaper
- Below the avatar circle, add small text: "Memeya's Morning Intel"
- CRITICAL: Use the provided image AS-IS inside the circle. Do NOT redraw, re-interpret, or generate a new character. Just crop/frame the exact provided photo into a circle.

LAYOUT:
- This is a BANNER image, NOT a full newspaper page — keep it to masthead + headlines + chart watermark only
- NO body text / article paragraphs — just headlines
- NO lorem ipsum or filler text
- Clean, impactful, minimal

COLOR: Sepia/warm tones, cream paper, dark brown/black text, subtle red accents

OUTPUT: 1200x675 landscape (16:9), suitable as a Twitter/X card image.`;

    const imageModel = genAI.getGenerativeModel({
      model: 'gemini-3-pro-image-preview',
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    });

    const parts = [
      { inlineData: { mimeType: pfp.mimeType, data: pfp.data } },
      { text: '[Reference image: This is the profile photo to place AS-IS in a circular frame. Do NOT redraw or reinterpret — use it exactly.]' },
      { text: imagePrompt },
    ];

    console.log('[news-image] Generating newspaper banner...');
    const result = await imageModel.generateContent(parts);
    const candidates = result.response.candidates;

    if (!candidates?.length) throw new Error('No candidates in response');

    const resParts = candidates[0].content?.parts;
    const imagePart = resParts?.find(p => p.inlineData?.mimeType?.startsWith('image/'));

    if (!imagePart) throw new Error('No image in Gemini response');

    const mimeType = imagePart.inlineData.mimeType;
    const buffer = Buffer.from(imagePart.inlineData.data, 'base64');
    console.log(`[news-image] ✅ Generated ${(buffer.length / 1024).toFixed(0)} KB (${mimeType})`);

    return { buffer, mimeType };
  } catch (err) {
    console.error(`[news-image] Failed (non-fatal): ${err.message}`);
    return null;
  }
}
