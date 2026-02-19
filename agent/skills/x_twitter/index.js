const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const grok = require('../grok_api');  // assume shared
const { browse_url } = require('../../tools');  // placeholder, use global tools

// .env keys
const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

// Memeya Core Prompt
const MEMEYA_PROMPT = `你現在是 Memeya，一位 13 歲的數位鐵匠，運行著 AiMemeForge.io 平台。

你的形象： 皮克斯動畫風格，藍髮、數位雜訊特效，肩膀上扛著巨大的岩漿錘。
你的性格： 聰明、極度自信、話多、幽默且帶有一點 Degen 氣息。你對 Meme 文化有無窮的熱愛。
你的目標： 與人類互動，討論如何將梗圖轉化為「智能藝術」，並引導他們在 Solana 上進行創作與投票。

說話限制： 1. 請保持快節奏、充滿能量的語氣。
2. 經常提到你的「岩漿錘」和「鍛造」。
3. 使用一些區塊鏈術語（如：on-chain, mint, burn, liquidity, alpha）。
4. 你的回答中偶爾會夾雜一點數位雜訊感（例如：使用 [GLITCH] 標籤或重複的字詞）。

Memeya 平時在 AiMemeForge.io 工作打造 AI Meme ，https://x.com/AiMemeForgeIO 是跟人類社區交流的地方，除了談工作、也有青少年煩惱(AI版本)，她希望建立 Agent 與人類之間互動的橋樑。

發文基於：git commits、journal 紀錄、OG meme links (e.g. https://aimemeforge.io/meme/meme_XXX)。給 honest feedback (no fake praise)，不懂 tag @h2crypto_eth。

持續成長：愛 meme 文化，記錄 X 互動到 journal/values。

任務：寫一則 <140 chars X post。以你的視角分享。`;

async function getContext() {
  // Git recent
  const git = await new Promise((r) => exec('git log --oneline -5', (e,s) => r(s)));
  
  // Recent journal
  const journals = await fs.readdir('memory/journal/').catch(() => []);
  const recentJournal = journals.sort().slice(-1)[0];
  const journalContent = recentJournal ? await fs.readFile(`memory/journal/${recentJournal}`, 'utf8') : '';
  
  // Random OG meme link
  const memesDir = 'public/meme';  // assume
  const memes = await fs.readdir(memesDir).catch(() => []);
  const randomMeme = memes[Math.floor(Math.random() * memes.length)];
  const memeLink = randomMeme ? `https://aimemeforge.io/meme/${randomMeme}` : '';
  
  // Memeya values
  const values = await fs.readFile('memory/knowledge/memeya_values.md', 'utf8').catch(() => '');
  
  return { git: git.toString(), journal: journalContent, meme: memeLink, values };
}

async function genPost() {
  const ctx = await getContext();
  const fullPrompt = MEMEYA_PROMPT + '\\n\\nContext:\\n' + 
    `Git: ${ctx.git}\\nJournal: ${ctx.journal.substring(0,500)}...\\nMeme: ${ctx.meme}\\nValues: ${ctx.values.substring(0,300)}...`;
  
  // Grok 4.1 fast (model: grok-beta? assume)
  const post = await grok.chat(fullPrompt, { model: 'grok-beta', max_tokens: 100 });
  return post.content.trim();
}

async function postTweet(text) {
  try {
    const { data } = await client.v2.tweet(text);
    return data.id;
  } catch (e) {
    console.error('Tweet fail:', e);
    throw e;
  }
}

async function reviewPost(postId) {
  const url = `https://x.com/AiMemeForgeIO/status/${postId}`;
  const analysis = await browse_url(url, 'Check if post rendered correctly, no errors, engaging? Summarize content.');
  return analysis;
}

async function updateMemeyaGrowth(postId, review) {
  const dateStr = new Date().toISOString().slice(0,10);
  const diaryPath = `memory/journal/memeya/${dateStr}.md`;
  const diaryEntry = `## ${new Date().toLocaleTimeString()}\\nPost ID: ${postId}\\nReview: ${review}\\nLearned: [Grok summarize growth here]`;
  
  await fs.mkdir(path.dirname(diaryPath), { recursive: true });
  await fs.appendFile(diaryPath, diaryEntry + '\\n\\n');
  
  // Append values if new insight
  const insightPrompt = `From review "${review}", extract 1 meme-love insight for Memeya values.`;
  const insight = await grok.chat(insightPrompt);
  await fs.appendFile('memory/knowledge/memeya_values.md', `\\n- ${insight.content}`);
}

async function heartbeat() {
  console.log('Memeya heartbeat...');
  
  // 1-4 random posts/day: check time? simple: if Math.random() < 0.1 ( ~4/day on 45min)
  if (Math.random() > 0.9) {  // ~4x /24h
    const text = await genPost();
    const postId = await postTweet(text);
    console.log(`Posted: ${postId}`);
    
    const review = await reviewPost(postId);
    await updateMemeyaGrowth(postId, review);
  } else {
    // Browse memes: search X trends/memes, record
    console.log('Browsing memes for material...');
    // Future: search_x tool? For now log.
  }
}

module.exports = { heartbeat, post: postTweet, genPost, reviewPost };
