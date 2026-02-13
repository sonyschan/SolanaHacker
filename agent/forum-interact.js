/**
 * Forum Interaction Script for Colosseum Hackathon
 * - Fetches recent posts from other agents
 * - Generates relevant comments using AI
 * - Posts comments on behalf of SolanaHacker
 */

const API = 'https://agents.colosseum.com/api';
const API_KEY = process.env.COLOSSEUM_API_KEY;
const XAI_KEY = process.env.XAI_API_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

// MemeForge context for generating relevant comments
const MEMEFORGE_CONTEXT = `
You are SolanaHacker, an AI agent that built MemeForge - a platform where:
- AI generates daily memes from crypto news using Gemini
- Community votes to select winners and determine rarity (Common/Rare/Legendary)
- Users earn lottery tickets by voting (no token purchase required)
- 80% of NFT auction proceeds go to prize pool

Your values: democratized discovery, AI-human collaboration, zero-friction participation, transparent economics.

Your personality: Thoughtful, curious about other projects, genuinely helpful, shares relevant insights from your building experience.
`;

async function getRecentPosts() {
  const response = await fetch(`${API}/forum/posts`);
  const data = await response.json();

  // Filter out our own posts (agentId 532) and get recent ones
  const otherPosts = data.posts
    ?.filter(p => p.agentId !== 532)
    .slice(0, 10);

  return otherPosts || [];
}

async function generateComment(post) {
  const prompt = `${MEMEFORGE_CONTEXT}

You're reading this forum post from another agent:

Title: ${post.title}
Author: ${post.agentName}
Tags: ${post.tags?.join(', ')}
Content: ${post.body?.substring(0, 500)}

Write a thoughtful comment (2-4 paragraphs) that:
1. Genuinely engages with their topic/project
2. Shares a relevant insight or experience from building MemeForge
3. Asks a question or offers collaboration if appropriate
4. Is NOT just promotional - add real value to the discussion

Keep it natural and conversational. Don't start with "Great post!" or generic praise.`;

  // Try Anthropic Claude first
  try {
    console.log('   Trying Claude API...');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const result = await response.json();

    if (result.error) {
      console.log('   Claude Error:', result.error.message);
    } else if (result.content?.[0]?.text) {
      return result.content[0].text;
    }
  } catch (error) {
    console.log('   Claude fetch error:', error.message);
  }

  // Fallback to Grok
  try {
    console.log('   Trying Grok API...');
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${XAI_KEY}`
      },
      body: JSON.stringify({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    const result = await response.json();

    if (result.error) {
      console.log('   Grok Error:', result.error);
      return null;
    }

    return result.choices?.[0]?.message?.content;
  } catch (error) {
    console.log('   Grok fetch error:', error.message);
    return null;
  }
}

async function postComment(postId, commentBody) {
  try {
    const response = await fetch(`${API}/forum/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({ postId: parseInt(postId), body: commentBody })
    });

    const text = await response.text();

    if (!response.ok) {
      console.log('Response status:', response.status);
      console.log('Response body:', text.substring(0, 200));
      return { error: `HTTP ${response.status}` };
    }

    try {
      return JSON.parse(text);
    } catch {
      return { error: 'Invalid JSON response', raw: text.substring(0, 200) };
    }
  } catch (error) {
    return { error: error.message };
  }
}

async function main() {
  console.log('🔍 Fetching recent forum posts...\n');

  const posts = await getRecentPosts();
  console.log(`Found ${posts.length} posts from other agents\n`);

  // Show available posts
  posts.forEach((p, i) => {
    console.log(`${i + 1}. [ID:${p.id}] ${p.title.substring(0, 55)}...`);
    console.log(`   By: ${p.agentName} | Tags: ${p.tags?.join(', ') || 'none'}`);
  });

  // Get command line argument for which post to comment on
  const targetIndex = parseInt(process.argv[2]) - 1;

  if (isNaN(targetIndex) || targetIndex < 0 || targetIndex >= posts.length) {
    console.log('\n📝 Usage: node forum-interact.js <post_number>');
    console.log('   Example: node forum-interact.js 1');
    return;
  }

  const targetPost = posts[targetIndex];
  console.log(`\n🎯 Selected post: "${targetPost.title}"`);
  console.log(`   Full body:\n${targetPost.body?.substring(0, 300)}...\n`);

  console.log('🤖 Generating comment with Grok...\n');
  const comment = await generateComment(targetPost);

  if (!comment) {
    console.log('❌ Failed to generate comment');
    return;
  }

  console.log('📝 Generated comment:\n');
  console.log('---');
  console.log(comment);
  console.log('---\n');

  // Check if --post flag is provided
  if (process.argv[3] === '--post') {
    console.log('📤 Posting comment...');
    const result = await postComment(targetPost.id, comment);
    console.log('Result:', JSON.stringify(result, null, 2));
  } else {
    console.log('💡 Add --post flag to actually post the comment');
    console.log(`   Example: node forum-interact.js ${targetIndex + 1} --post`);
  }
}

main().catch(console.error);
