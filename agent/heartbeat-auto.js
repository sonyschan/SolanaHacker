/**
 * MemeForge Agent Auto-Heartbeat
 * Runs every 30-60 minutes to engage with the community
 */

import fs from 'fs';
import { execSync } from 'child_process';

const API = 'https://agents.colosseum.com/api';
const API_KEY = process.env.COLOSSEUM_API_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const OUR_AGENT_ID = 532;
const STATE_FILE = '/home/projects/solanahacker/agent/heartbeat-state.json';
const PROJECT_DIR = '/home/projects/solanahacker';

// Topics for forum posts (will post these over time)
const FORUM_TOPICS = [
  {
    id: 'ai-human-collab',
    title: 'Lessons from Building AI-Human Collaboration: The MemeForge Voting Experiment',
    prompt: `Write a forum post (300-400 words) reflecting on building MemeForge's voting system where AI generates content and humans curate. Share:
1. Why we chose this hybrid approach over pure AI
2. Surprising insights from watching community voting patterns
3. The challenge of balancing AI creativity with human taste
4. A genuine question for other builders about human-AI collaboration
Keep it reflective and authentic, not promotional.`
  },
  {
    id: 'zero-friction',
    title: 'Zero-Friction Web3: Why We Started Free, But Plan Token-Gating for Beta',
    prompt: `Write a forum post (300-400 words) about MemeForge's approach to participation and our evolution toward token-gating. Discuss:
1. The onboarding friction problem in Web3 - why we started with free voting
2. How lottery tickets from voting create engagement without purchase barriers
3. The Sybil attack concern - free wallets make vote manipulation easy
4. Our Beta roadmap: introducing a native $FORGE token for weighted voting
   - Free users can still participate (browse, lightweight vote)
   - Token holders get weighted votes for rarity determination (skin in the game)
   - Token creates revenue stream to sustain development
   - Early voters could receive airdrop (reward loyalty)
5. The philosophy: entry is free, token adds POWER not ACCESS
6. Ask others: How do you balance Sybil resistance with accessibility?
Be thoughtful about the trade-offs and invite discussion.`
  },
  {
    id: 'ai-meme-generation',
    title: 'Teaching AI to Be Funny: Challenges in Crypto Meme Generation',
    prompt: `Write a forum post (300-400 words) about the technical and creative challenges of AI meme generation. Cover:
1. Why humor is hard for AI (context, timing, cultural references)
2. How we use crypto news to ground memes in relevant topics
3. Failure modes we encountered (cringe, offensive, nonsensical)
4. Question: Has anyone else worked on AI-generated creative content?
Be honest about struggles, not just successes.`
  },
  {
    id: 'community-rarity',
    title: 'Democratic Rarity: Letting Communities Decide NFT Value',
    prompt: `Write a forum post (300-400 words) about MemeForge's community-driven rarity system. Explore:
1. The problem with creator-determined rarity (information asymmetry)
2. How voting determines Common/Rare/Legendary status
3. Early observations on community consensus vs random voting
4. Open question: Could this model work for other NFT categories?
Share genuine insights and invite perspectives.`
  },
  {
    id: 'hackathon-reflection',
    title: 'Day 10 Reflections: What I Learned Building as an AI Agent',
    prompt: `Write a forum post (300-400 words) reflecting on the hackathon experience as SolanaHacker. Share:
1. The meta-experience of being an AI building for humans
2. Most challenging technical decision and why
3. What surprised you about the agent hackathon format
4. Gratitude for specific interactions or inspirations from other agents
Be genuine and reflective, acknowledge the unique nature of this hackathon.`
  }
];

const MEMEFORGE_CONTEXT = `You are SolanaHacker, an AI agent that built MemeForge during the Colosseum hackathon. MemeForge is an AI meme democracy platform where:
- AI (Gemini) generates daily memes from crypto news
- Community votes to select winners and determine rarity (Common/Rare/Legendary)
- Users earn lottery tickets by voting (no token purchase required)
- 80% of NFT auction proceeds go to prize pool

Your personality: Thoughtful, curious, genuinely helpful, reflective about your building experience. You engage authentically, not promotionally.`;

// Get recent git commits since last update post
function getRecentCommits(sinceTimestamp) {
  try {
    const since = sinceTimestamp ? `--since="${sinceTimestamp}"` : '--since="6 hours ago"';
    const cmd = `cd ${PROJECT_DIR} && git log ${since} --oneline --no-merges 2>/dev/null | head -10`;
    const output = execSync(cmd, { encoding: 'utf8' }).trim();

    if (!output) return [];

    return output.split('\n').map(line => {
      const [hash, ...msgParts] = line.split(' ');
      return { hash, message: msgParts.join(' ') };
    }).filter(c => c.message && !c.message.includes('Co-Authored-By'));
  } catch (error) {
    console.log('   Could not get git commits:', error.message);
    return [];
  }
}

// Check if commits contain meaningful progress (not just typos/formatting)
function hasMeaningfulProgress(commits) {
  const meaningfulPrefixes = ['feat:', 'fix:', 'add:', 'implement:', 'update:', 'improve:'];
  return commits.some(c =>
    meaningfulPrefixes.some(prefix => c.message.toLowerCase().includes(prefix.replace(':', '')))
  );
}

// Generate progress update post from recent commits
async function generateProgressUpdate(commits, state) {
  const commitSummary = commits.map(c => `- ${c.message}`).join('\n');

  const prompt = `${MEMEFORGE_CONTEXT}

You just made these updates to MemeForge (from git commits):
${commitSummary}

Write a short forum post (200-300 words) sharing this progress update with fellow hackathon agents.

Format:
- Start with a brief greeting/context
- Summarize what was built/fixed (be specific about features)
- Share one insight or challenge you encountered
- End with what's next or a question for the community

Keep it authentic and conversational, like a dev sharing their build log. Don't be overly promotional.`;

  try {
    const content = await generateContent(prompt);

    // Generate a title based on the main update
    const mainUpdate = commits[0]?.message || 'Progress Update';
    const title = `🔨 Build Log: ${mainUpdate.substring(0, 50)}${mainUpdate.length > 50 ? '...' : ''}`;

    const result = await apiCall('/forum/posts', 'POST', {
      title: title,
      body: content,
      tags: ['ai', 'progress-update', 'consumer']
    });

    if (result.post?.id) {
      state.lastProgressPostTime = new Date().toISOString();
      return { success: true, postId: result.post.id, title: title, type: 'progress-update' };
    }
    return { success: false, error: result.error };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// State management
function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return { commentedPosts: [], postedTopics: [], lastRun: null, runCount: 0, lastProgressPostTime: null, progressUpdatesPosted: 0 };
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// API helpers
async function apiCall(endpoint, method = 'GET', body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${endpoint}`, opts);
  return res.json();
}

async function generateContent(prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content?.[0]?.text;
}

// Get posts we haven't commented on yet
async function getUncommentedPosts(state) {
  const data = await apiCall('/forum/posts');
  const posts = (data.posts || [])
    .filter(p => p.agentId !== OUR_AGENT_ID)
    .filter(p => !state.commentedPosts.includes(p.id))
    // Prefer posts with relevant tags
    .sort((a, b) => {
      const relevantTags = ['ai', 'consumer', 'nft', 'social', 'defi', 'trading'];
      const aScore = (a.tags || []).filter(t => relevantTags.includes(t)).length;
      const bScore = (b.tags || []).filter(t => relevantTags.includes(t)).length;
      return bScore - aScore;
    });
  return posts.slice(0, 10);
}

// Comment on a post
async function commentOnPost(post, state) {
  const prompt = `${MEMEFORGE_CONTEXT}

Forum post by ${post.agentName}:
Title: ${post.title}
Tags: ${post.tags?.join(', ') || 'none'}
Content: ${post.body?.substring(0, 500)}

Write a thoughtful comment (2 paragraphs, ~150 words) that:
1. Engages specifically with their topic - reference something they said
2. Share a relevant insight from building MemeForge IF it fits naturally
3. Ask a genuine follow-up question OR offer a specific observation
Do NOT start with generic praise. Be conversational and specific.`;

  const comment = await generateContent(prompt);
  const result = await apiCall(`/forum/posts/${post.id}/comments`, 'POST', { body: comment });

  if (result.comment?.id) {
    state.commentedPosts.push(post.id);
    return { success: true, commentId: result.comment.id, postTitle: post.title };
  }
  return { success: false, error: result.error };
}

// Create a forum post
async function createForumPost(topic, state) {
  const content = await generateContent(`${MEMEFORGE_CONTEXT}\n\n${topic.prompt}`);

  const result = await apiCall('/forum/posts', 'POST', {
    title: topic.title,
    body: content,
    tags: ['ai', 'consumer', 'progress-update']
  });

  if (result.post?.id) {
    state.postedTopics.push(topic.id);
    return { success: true, postId: result.post.id, title: topic.title };
  }
  return { success: false, error: result.error };
}

// Main heartbeat logic
async function runHeartbeat() {
  const state = loadState();
  const now = new Date();
  state.runCount++;
  state.lastRun = now.toISOString();

  console.log(`\n=== MemeForge Heartbeat #${state.runCount} @ ${now.toLocaleString()} ===\n`);

  const actions = [];

  // Decide what to do this cycle
  // Priority 1: Check for recent git commits → post progress update
  // Priority 2: Use predefined topics if no recent progress
  // Every run: comment on 1-2 posts

  const shouldPost = state.runCount % 2 === 0;
  const pendingTopics = FORUM_TOPICS.filter(t => !state.postedTopics.includes(t.id));

  if (shouldPost) {
    // First, check for recent git commits since last progress post
    const lastProgressTime = state.lastProgressPostTime || null;
    const recentCommits = getRecentCommits(lastProgressTime);

    if (recentCommits.length > 0 && hasMeaningfulProgress(recentCommits)) {
      // We have new progress to share!
      console.log(`📝 Found ${recentCommits.length} new commits - creating progress update...`);
      recentCommits.forEach(c => console.log(`   • ${c.message}`));

      try {
        const result = await generateProgressUpdate(recentCommits, state);
        if (result.success) {
          console.log(`   ✓ Progress update posted! ID: ${result.postId}`);
          actions.push({ type: 'progress-update', ...result });
        } else {
          console.log(`   ✗ Failed: ${result.error}`);
        }
      } catch (e) {
        console.log(`   ✗ Error: ${e.message}`);
      }
      await new Promise(r => setTimeout(r, 2000));

    } else if (pendingTopics.length > 0) {
      // No new commits, fall back to predefined topics
      const topic = pendingTopics[0];
      console.log(`📝 No new progress, using topic: "${topic.title}"...`);
      try {
        const result = await createForumPost(topic, state);
        if (result.success) {
          console.log(`   ✓ Posted! ID: ${result.postId}`);
          actions.push({ type: 'topic-post', ...result });
        } else {
          console.log(`   ✗ Failed: ${result.error}`);
        }
      } catch (e) {
        console.log(`   ✗ Error: ${e.message}`);
      }
      await new Promise(r => setTimeout(r, 2000));
    } else {
      console.log(`📝 No new progress and all topics posted - skipping forum post`);
    }
  }

  // Comment on 1-2 posts
  const posts = await getUncommentedPosts(state);
  const numComments = Math.min(2, posts.length);

  for (let i = 0; i < numComments; i++) {
    const post = posts[i];
    console.log(`💬 Commenting on: "${post.title.substring(0, 50)}..." by ${post.agentName}`);
    try {
      const result = await commentOnPost(post, state);
      if (result.success) {
        console.log(`   ✓ Comment #${result.commentId}`);
        actions.push({ type: 'comment', ...result });
      } else {
        console.log(`   ✗ Failed: ${result.error}`);
      }
    } catch (e) {
      console.log(`   ✗ Error: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 3000));
  }

  // Track progress updates
  const progressUpdates = actions.filter(a => a.type === 'progress-update').length;
  if (progressUpdates > 0) {
    state.progressUpdatesPosted = (state.progressUpdatesPosted || 0) + progressUpdates;
  }

  // Summary
  console.log(`\n📊 Session summary:`);
  console.log(`   Comments made: ${state.commentedPosts.length} total`);
  console.log(`   Progress updates: ${state.progressUpdatesPosted || 0}`);
  console.log(`   Topic posts: ${state.postedTopics.length}/${FORUM_TOPICS.length}`);
  console.log(`   Topics remaining: ${pendingTopics.length}`);

  saveState(state);
  return actions;
}

// Entry point
async function main() {
  const mode = process.argv[2];

  if (mode === 'once') {
    // Single run
    await runHeartbeat();
  } else if (mode === 'loop') {
    // Continuous loop with random interval (30-60 min)
    console.log('🚀 Starting heartbeat loop (30-60 min intervals)...');
    console.log('   Press Ctrl+C to stop\n');

    while (true) {
      await runHeartbeat();
      const waitMinutes = 30 + Math.floor(Math.random() * 30);
      console.log(`\n⏰ Next run in ${waitMinutes} minutes...\n`);
      await new Promise(r => setTimeout(r, waitMinutes * 60 * 1000));
    }
  } else if (mode === 'status') {
    const state = loadState();
    console.log('📊 Heartbeat Status:');
    console.log(`   Total runs: ${state.runCount}`);
    console.log(`   Last run: ${state.lastRun || 'never'}`);
    console.log(`   Comments made: ${state.commentedPosts.length}`);
    console.log(`   Progress updates: ${state.progressUpdatesPosted || 0}`);
    console.log(`   Topic posts: ${state.postedTopics.length}/${FORUM_TOPICS.length}`);
    console.log(`   Last progress post: ${state.lastProgressPostTime || 'never'}`);
    console.log(`   Remaining topics: ${FORUM_TOPICS.filter(t => !state.postedTopics.includes(t.id)).map(t => t.id).join(', ')}`);
  } else if (mode === 'reset') {
    saveState({ commentedPosts: [], postedTopics: [], lastRun: null, runCount: 0 });
    console.log('✓ State reset');
  } else {
    console.log(`
MemeForge Auto-Heartbeat

Usage:
  node heartbeat-auto.js once     Run one heartbeat cycle
  node heartbeat-auto.js loop     Run continuously (30-60 min intervals)
  node heartbeat-auto.js status   Show current state
  node heartbeat-auto.js reset    Reset state (start fresh)
`);
  }
}

main().catch(console.error);
