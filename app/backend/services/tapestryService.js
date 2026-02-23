/**
 * Tapestry Social Integration Service
 *
 * Wraps the Tapestry REST API for onchain social features:
 * profiles, content nodes, comments, and likes.
 *
 * All functions are non-fatal — Tapestry failures never block core functionality.
 *
 * API docs: https://docs.usetapestry.dev/
 */

const { getFirestore, collections } = require('../config/firebase');

const TAPESTRY_API = process.env.TAPESTRY_API_URL || 'https://api.usetapestry.dev/api/v1';
const TAPESTRY_KEY = process.env.TAPESTRY_API_KEY;

// ─── Helpers ────────────────────────────────────────────────────

function apiUrl(path) {
  const separator = path.includes('?') ? '&' : '?';
  return `${TAPESTRY_API}${path}${separator}apiKey=${TAPESTRY_KEY}`;
}

async function tapestryFetch(path, options = {}) {
  if (!TAPESTRY_KEY) {
    throw new Error('TAPESTRY_API_KEY not configured');
  }
  const url = apiUrl(path);
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tapestry ${res.status}: ${text}`);
  }
  return res.json();
}

// ─── Profiles ───────────────────────────────────────────────────

/**
 * Find or create a Tapestry profile for a wallet address.
 * Caches the tapestryProfileId in the Firestore user document.
 *
 * @param {string} walletAddress - Solana wallet address
 * @returns {Promise<string>} Tapestry profile ID
 */
async function findOrCreateProfile(walletAddress) {
  // Check Firestore cache first
  const db = getFirestore();
  const userRef = db.collection(collections.USERS).doc(walletAddress);
  const userDoc = await userRef.get();

  if (userDoc.exists && userDoc.data().tapestryProfileId) {
    return userDoc.data().tapestryProfileId;
  }

  // Create on Tapestry
  const short = walletAddress.slice(0, 8);
  const result = await tapestryFetch('/profiles/findOrCreate', {
    method: 'POST',
    body: JSON.stringify({
      walletAddress,
      username: `memeforge_${short}`,
      blockchain: 'SOLANA',
      execution: 'FAST_UNCONFIRMED',
    }),
  });

  const profileId = result.profile?.id || result.id;
  if (!profileId) {
    throw new Error('Tapestry returned no profile ID');
  }

  // Cache in Firestore (merge so we don't overwrite other fields)
  if (userDoc.exists) {
    await userRef.update({ tapestryProfileId: profileId });
  }

  return profileId;
}

// ─── Content Nodes ──────────────────────────────────────────────

/**
 * Find or create a Tapestry content node for a meme.
 * Caches tapestryContentId in the Firestore meme document.
 *
 * @param {string} memeId - MemeForge meme ID
 * @param {string} memeTitle - Meme title for the content text
 * @returns {Promise<string>} Tapestry content ID
 */
async function findOrCreateMemeContent(memeId, memeTitle) {
  const db = getFirestore();
  const memeRef = db.collection(collections.MEMES).doc(memeId);
  const memeDoc = await memeRef.get();

  if (memeDoc.exists && memeDoc.data().tapestryContentId) {
    return memeDoc.data().tapestryContentId;
  }

  // Create content node on Tapestry
  // Use MEMEYA_TAPESTRY_PROFILE_ID as the author (platform-level content)
  const platformProfileId = process.env.MEMEYA_TAPESTRY_PROFILE_ID;

  const body = {
    id: `meme_${memeId}`,
    properties: [
      { key: 'memeId', value: memeId },
      { key: 'title', value: memeTitle || `Meme ${memeId}` },
      { key: 'source', value: 'aimemeforge' },
      { key: 'url', value: `https://aimemeforge.io/meme/${memeId}` },
    ],
  };

  if (platformProfileId) {
    body.profileId = platformProfileId;
  }

  const result = await tapestryFetch('/contents/findOrCreate', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  const contentId = result.content?.id || result.id;
  if (!contentId) {
    throw new Error('Tapestry returned no content ID');
  }

  // Cache in Firestore
  if (memeDoc.exists) {
    await memeRef.update({ tapestryContentId: contentId });
  }

  return contentId;
}

/**
 * Create a vote activity content node on Tapestry.
 *
 * @param {string} profileId - Tapestry profile ID
 * @param {string} memeId - MemeForge meme ID
 * @param {string} memeTitle - Meme title
 */
async function createVoteContent(profileId, memeId, memeTitle) {
  const voteId = `vote_${profileId}_${memeId}_${Date.now()}`;
  return tapestryFetch('/contents/findOrCreate', {
    method: 'POST',
    body: JSON.stringify({
      id: voteId,
      profileId,
      properties: [
        { key: 'memeId', value: memeId },
        { key: 'title', value: `Voted for "${memeTitle}" on AIMemeForge!` },
        { key: 'action', value: 'vote' },
        { key: 'source', value: 'aimemeforge' },
      ],
    }),
  });
}

// ─── Comments ───────────────────────────────────────────────────

/**
 * Get comments for a Tapestry content node.
 *
 * @param {string} contentId - Tapestry content ID
 * @param {number} page - Page number (1-indexed)
 * @param {number} pageSize - Items per page
 * @returns {Promise<Object>} { comments, page, pageSize }
 */
async function getComments(contentId, page = 1, pageSize = 20) {
  return tapestryFetch(`/comments/?contentId=${contentId}&page=${page}&pageSize=${pageSize}`);
}

/**
 * Create a comment on a Tapestry content node.
 *
 * @param {string} profileId - Commenter's Tapestry profile ID
 * @param {string} contentId - Tapestry content ID
 * @param {string} text - Comment text
 * @returns {Promise<Object>} Created comment
 */
async function createComment(profileId, contentId, text) {
  // Note: Tapestry has a known bug where comment creation returns 500
  // even though the comment is actually created successfully.
  // We handle this by catching the error and returning a synthetic response.
  try {
    return await tapestryFetch('/comments/', {
      method: 'POST',
      body: JSON.stringify({
        profileId,
        contentId,
        text,
      }),
    });
  } catch (err) {
    if (err.message.includes('Tapestry 500')) {
      console.warn('[tapestry] Comment likely created despite 500 response');
      return { id: `comment-${Date.now()}`, text, created_at: Date.now() };
    }
    throw err;
  }
}

// ─── Agent Content ──────────────────────────────────────────────

/**
 * Create content as the Memeya agent profile on Tapestry.
 * Used to mirror X posts to the social graph.
 *
 * @param {string} text - Content text
 * @param {Array<{key: string, value: string}>} customProperties - Extra metadata
 * @returns {Promise<Object>} Created content
 */
async function createAgentContent(text, customProperties = []) {
  const profileId = process.env.MEMEYA_TAPESTRY_PROFILE_ID;
  if (!profileId) {
    throw new Error('MEMEYA_TAPESTRY_PROFILE_ID not configured');
  }

  const contentId = `memeya_${Date.now()}`;
  return tapestryFetch('/contents/findOrCreate', {
    method: 'POST',
    body: JSON.stringify({
      id: contentId,
      profileId,
      properties: [
        { key: 'source', value: 'memeya_agent' },
        { key: 'text', value: text },
        ...customProperties,
      ],
    }),
  });
}

module.exports = {
  findOrCreateProfile,
  findOrCreateMemeContent,
  createVoteContent,
  getComments,
  createComment,
  createAgentContent,
};
