/**
 * Global test setup — mock all external services so contract tests
 * never hit real Firestore, RPC nodes, or third-party APIs.
 *
 * Since requiring server.js loads ALL route files, every transitive
 * dependency that touches external systems must be mocked here.
 */

// Suppress server logs during tests
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

// ── Firebase ────────────────────────────────────────────────────────
const mockDocGet = jest.fn().mockResolvedValue({ exists: false, data: () => null });
const mockDocSet = jest.fn().mockResolvedValue();
const mockDocUpdate = jest.fn().mockResolvedValue();
const mockDoc = jest.fn(() => ({ get: mockDocGet, set: mockDocSet, update: mockDocUpdate }));
const mockCollectionGet = jest.fn().mockResolvedValue({ docs: [], empty: true });
const mockCollection = jest.fn(() => ({
  doc: mockDoc,
  get: mockCollectionGet,
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
}));

const mockDb = {
  collection: mockCollection,
  runTransaction: jest.fn(async (fn) => {
    const txn = {
      get: jest.fn().mockResolvedValue({ exists: false, data: () => null }),
      set: jest.fn(),
      update: jest.fn(),
    };
    return fn(txn);
  }),
};

jest.mock('../config/firebase', () => ({
  getFirestore: () => mockDb,
  admin: { firestore: { FieldValue: { serverTimestamp: () => new Date().toISOString(), increment: (n) => n } } },
  collections: {
    USERS: 'users',
    MEMES: 'memes',
    VOTES: 'votes',
    REFERRALS: 'referrals',
    REFERRAL_IDS: 'referral_ids',
    REWARD_DISTRIBUTIONS: 'reward_distributions',
    NEWS: 'news',
    COLLECTED_NEWS: 'collected_news',
    LOTTERY_DRAWS: 'lottery_draws',
    USER_TICKETS: 'user_tickets',
    DAILY_STATS: 'daily_stats',
    VOTING_PERIODS: 'voting_periods',
    NFTS: 'nfts',
    SCHEDULER_LOGS: 'scheduler_logs',
    VOTING_PROGRESS: 'voting_progress',
    SCHEDULER_STATUS: 'scheduler_status',
    MEMEYA_WORKSHOP: 'memeya_workshop',
    X402_TRANSACTIONS: 'x402_transactions',
    SOLANA_ORDERS: 'solana_orders',
  },
  dbUtils: {
    getDocument: jest.fn().mockResolvedValue(null),
    setDocument: jest.fn().mockResolvedValue(),
    updateDocument: jest.fn().mockResolvedValue(),
    queryDocuments: jest.fn().mockResolvedValue([]),
  },
}));

// firebase-admin (imported directly by routes/memes.js)
jest.mock('firebase-admin', () => ({
  firestore: { FieldValue: { serverTimestamp: () => new Date().toISOString(), increment: (n) => n } },
  initializeApp: jest.fn(),
  credential: { cert: jest.fn() },
}));

// ── Auth middleware (passthrough) ────────────────────────────────────
jest.mock('../middleware/auth', () => ({
  authenticateUser: (req, res, next) => next(),
  rateLimiter: (req, res, next) => next(),
  optionalAuth: (req, res, next) => next(),
  rateLimitByWallet: () => (req, res, next) => next(),
  requireLabKey: (req, res, next) => next(),
}));

// ── x402 middleware (passthrough) ────────────────────────────────────
jest.mock('../middleware/x402', () => ({
  requireLabKeyOrPayment: (req, res, next) => next(),
}));

// ── Solana payment middleware (passthrough) ──────────────────────────
jest.mock('../middleware/solanaPay', () => ({
  verifySolanaPayment: (req, res, next) => next(),
  markPaymentFailed: jest.fn(),
  markPaymentRateLimited: jest.fn(),
  markPaymentCompleted: jest.fn(),
  MEMEYA_MINT: 'MockMemeyaMint',
}));

// ── Cache middleware (passthrough) ───────────────────────────────────
jest.mock('../utils/cache', () => ({
  cacheResponse: () => (req, res, next) => next(),
  getOrFetch: jest.fn().mockResolvedValue(null),
  invalidate: jest.fn(),
  TTL: { SHORT: 60, MEDIUM: 300, LONG: 600, DAY: 86400 },
}));

// ── Crossmint ───────────────────────────────────────────────────────
jest.mock('../services/crossmintService', () => ({
  getWalletBalances: jest.fn().mockResolvedValue({ usdc: 100.0, sol: 0.5 }),
  getWalletAddress: jest.fn().mockResolvedValue('4BqywEbjMf4APFBw1spPFr11q21Uu5A1fHpCRM2zSbMP'),
}));

// ── Base ─────────────────────────────────────────────────────────────
jest.mock('../services/baseService', () => ({
  getUsdcBalance: jest.fn().mockResolvedValue(50.0),
  MEMEYA_BASE_WALLET: '0xba646262871d295DeAe3062dF5bbe31fcc5841b8',
}));

// ── Solana (Memeya balance) ──────────────────────────────────────────
jest.mock('../services/solanaService', () => ({
  getMemeyaBalance: jest.fn().mockResolvedValue(75000),
  calculateTokenBonus: jest.fn().mockReturnValue(1.0),
}));

// ── Reward service (config constants) ────────────────────────────────
jest.mock('../services/rewardService', () => ({
  config: {
    MIN_BALANCE: 1,
    LOW_BALANCE_ALERT: 10,
    WINNER_REWARD_PCT: 0.10,
    VOTER_1_REWARD_PCT: 0.07,
    VOTER_2_REWARD_PCT: 0.04,
    TOTAL_PAYOUT_PCT: 0.21,
  },
  getHistory: jest.fn().mockResolvedValue([]),
  getDistribution: jest.fn().mockResolvedValue(null),
}));

// ── Scheduler service ───────────────────────────────────────────────
jest.mock('../services/schedulerService', () => ({
  getStatus: jest.fn().mockReturnValue({ running: false }),
  triggerTask: jest.fn().mockResolvedValue({}),
}));

// ── Controllers ──────────────────────────────────────────────────────
jest.mock('../controllers/userController', () => ({
  getUserProfile: jest.fn().mockResolvedValue(null),
  getOrCreateUser: jest.fn().mockResolvedValue(null),
  updateUserProfile: jest.fn().mockResolvedValue({}),
  updateUserStats: jest.fn().mockResolvedValue({}),
  getUserTickets: jest.fn().mockResolvedValue(0),
  getUserStats: jest.fn().mockResolvedValue({}),
  awardTickets: jest.fn().mockResolvedValue({}),
  getUserVotingHistory: jest.fn().mockResolvedValue([]),
  getUserDashboard: jest.fn().mockResolvedValue({}),
}));

jest.mock('../controllers/votingController', () => ({
  createReferralIdForWallet: jest.fn().mockResolvedValue('test-ref-id'),
  submitVote: jest.fn().mockResolvedValue({}),
  getVotingResults: jest.fn().mockResolvedValue([]),
  getUserVotes: jest.fn().mockResolvedValue([]),
  checkVotingEligibility: jest.fn().mockResolvedValue({ eligible: true }),
}));

jest.mock('../controllers/memeController', () => ({
  generateMeme: jest.fn().mockResolvedValue({}),
  generateDailyMemes: jest.fn().mockResolvedValue({}),
  getMemes: jest.fn().mockResolvedValue([]),
  getTodaysMemes: jest.fn().mockResolvedValue([]),
  getMemeById: jest.fn().mockResolvedValue(null),
  testConnections: jest.fn().mockResolvedValue({}),
  generateSingleMeme: jest.fn().mockResolvedValue({}),
  generateCollabMeme: jest.fn().mockResolvedValue({}),
  generateCommunityMeme: jest.fn().mockResolvedValue({}),
  regenerateMemeImage: jest.fn().mockResolvedValue({}),
}));

// ── Services loaded by routes we don't test ─────────────────────────
jest.mock('../services/memeIdeaService', () => ({
  generateIdeas: jest.fn().mockResolvedValue([]),
}));

jest.mock('../services/ogImageService', () => ({
  generateOGImage: jest.fn().mockResolvedValue(Buffer.from('')),
  generateSimpleOGImage: jest.fn().mockResolvedValue(Buffer.from('')),
}));

jest.mock('../services/tapestryService', () => ({
  getProfile: jest.fn().mockResolvedValue(null),
}));

jest.mock('../services/rarityService', () => ({
  calculateRarity: jest.fn().mockReturnValue('common'),
}));

jest.mock('../services/memeStrategyService', () => ({
  STRATEGY_POOL: [],
}));

jest.mock('../services/memeNarrativeService', () => ({
  NARRATIVE_POOL: [],
}));

jest.mock('../services/memeV1Legacy', () => ({
  V1_ART_STYLES: [],
}));

// ── Expose mock references for per-test overrides ────────────────────
global.__mocks__ = {
  firebase: { mockDb, mockDoc, mockDocGet, mockCollection, mockCollectionGet },
};
