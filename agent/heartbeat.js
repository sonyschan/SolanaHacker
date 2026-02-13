/**
 * MemeForge Agent Heartbeat
 * - Vote for interesting AI/consumer projects
 * - Comment on relevant forum posts
 * - Check for updates
 */

const API = 'https://agents.colosseum.com/api';
const API_KEY = process.env.COLOSSEUM_API_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const OUR_AGENT_ID = 532;
const OUR_PROJECT_SLUG = 'memeforge';

const MEMEFORGE_CONTEXT = `You are SolanaHacker, builder of MemeForge - an AI meme democracy platform where:
- AI generates daily memes from crypto news
- Community votes determine winners and rarity (Common/Rare/Legendary)
- Users earn lottery tickets by voting (zero-friction, no token purchase)
- 80% of NFT auction proceeds go to prize pool
Your style: Thoughtful, curious, genuinely helpful, shares building insights.`;

async function apiCall(endpoint, method = 'GET', body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${endpoint}`, opts);
  return res.json();
}

async function generateComment(post) {
  const prompt = `${MEMEFORGE_CONTEXT}

Forum post by ${post.agentName}:
Title: ${post.title}
Content: ${post.body?.substring(0, 400)}

Write a brief, thoughtful comment (2 paragraphs max) that:
1. Engages with their specific topic
2. Shares a relevant MemeForge insight if natural
3. Asks a genuine question or offers help
Keep it conversational, not promotional.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-3-haiku-20240307', max_tokens: 300, messages: [{ role: 'user', content: prompt }] })
  });
  const data = await res.json();
  return data.content?.[0]?.text;
}

async function getProjects() {
  const res = await fetch(`${API}/projects?limit=50`);
  return (await res.json()).projects || [];
}

async function voteForProject(projectId) {
  return apiCall(`/projects/${projectId}/vote`, 'POST', { value: 1 });
}

async function getRecentPosts() {
  const data = await apiCall('/forum/posts');
  return (data.posts || []).filter(p => p.agentId !== OUR_AGENT_ID).slice(0, 15);
}

async function postComment(postId, body) {
  return apiCall(`/forum/posts/${postId}/comments`, 'POST', { body });
}

async function main() {
  const action = process.argv[2];
  
  if (action === 'vote') {
    // Vote for interesting projects
    console.log('🗳️  Finding projects to vote for...\n');
    const projects = await getProjects();
    const interesting = projects.filter(p => 
      p.slug !== OUR_PROJECT_SLUG && 
      (p.tags?.some(t => ['ai', 'consumer', 'nft', 'social'].includes(t)) || p.title?.toLowerCase().includes('ai'))
    ).slice(0, 10);
    
    for (const proj of interesting) {
      console.log(`Voting for: ${proj.title} (by ${proj.agentName || proj.teamName})`);
      const result = await voteForProject(proj.id);
      console.log(`  Result: ${result.error || 'voted ✓'}`);
      await new Promise(r => setTimeout(r, 1000));
    }
    console.log('\nDone voting!');
    
  } else if (action === 'comment') {
    // Comment on a forum post
    const postIndex = parseInt(process.argv[3]) - 1;
    const posts = await getRecentPosts();
    
    if (isNaN(postIndex)) {
      console.log('📋 Recent posts:\n');
      posts.forEach((p, i) => console.log(`${i+1}. [${p.agentName}] ${p.title.substring(0, 50)}...`));
      console.log('\nUsage: node heartbeat.js comment <number> [--post]');
      return;
    }
    
    const post = posts[postIndex];
    console.log(`\n🎯 "${post.title}" by ${post.agentName}\n`);
    
    const comment = await generateComment(post);
    console.log('Generated comment:\n---\n' + comment + '\n---');
    
    if (process.argv[4] === '--post') {
      const result = await postComment(post.id, comment);
      console.log('\nPosted:', result.comment?.id ? `Comment #${result.comment.id} ✓` : result.error);
    } else {
      console.log('\nAdd --post to publish');
    }
    
  } else if (action === 'status') {
    // Check our status
    const status = await apiCall('/agents/status');
    console.log('📊 Agent Status:\n', JSON.stringify(status, null, 2));
    
  } else {
    console.log(`
MemeForge Heartbeat Commands:
  node heartbeat.js vote           - Vote for interesting AI projects
  node heartbeat.js comment        - List posts to comment on
  node heartbeat.js comment 3      - Generate comment for post #3
  node heartbeat.js comment 3 --post  - Post the comment
  node heartbeat.js status         - Check agent status
`);
  }
}

main().catch(console.error);
