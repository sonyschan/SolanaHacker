/**
 * Contract tests for GET /api/users/:wallet
 *
 * Ensures the response shape matches what App.jsx expects.
 * These tests catch silent frontend breakage when backend changes the response.
 */
const request = require('supertest');
const { getUserProfile } = require('../../controllers/userController');
const { dbUtils } = require('../../config/firebase');

const app = require('../../server');

describe('GET /api/users/:wallet — response contract', () => {
  const WALLET = '4BqywEbjMf4APFBw1spPFr11q21Uu5A1fHpCRM2zSbMP';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Shape assertion helpers ──────────────────────────────────────
  function assertUserShape(user) {
    expect(typeof user.weeklyTickets).toBe('number');
    expect(typeof user.streakDays).toBe('number');
    expect(typeof user.lotteryOptIn).toBe('boolean');
    expect(Array.isArray(user.nftWins)).toBe(true);
    expect(user.referredBy === null || typeof user.referredBy === 'string').toBe(true);
    expect(typeof user.referralCount).toBe('number');
  }

  // ── Test: new user (no profile doc) ──────────────────────────────
  it('returns correct shape for a new user (no profile doc)', async () => {
    getUserProfile.mockResolvedValue(null);
    dbUtils.getDocument.mockResolvedValue(null);

    const res = await request(app).get(`/api/users/${WALLET}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();

    const { user } = res.body;
    assertUserShape(user);
    expect(user.wallet).toBe(WALLET);
    expect(user.isNewUser).toBe(true);
    expect(typeof user.displayName).toBe('string');
    expect(typeof user.joinDate).toBe('string');
    expect(typeof user.totalVotes).toBe('number');
    expect(typeof user.winCount).toBe('number');
  });

  // ── Test: existing user with UUID doc only (no wallet-keyed doc) ─
  it('returns ticket fields even when only UUID profile doc exists', async () => {
    getUserProfile.mockResolvedValue({
      id: 'uuid-123',
      walletAddress: WALLET,
      // UUID doc has no weeklyTickets/streakDays
    });
    dbUtils.getDocument.mockResolvedValue(null); // no wallet-keyed doc either

    const res = await request(app).get(`/api/users/${WALLET}`);

    expect(res.status).toBe(200);
    const { user } = res.body;
    assertUserShape(user);
    // Defaults kick in via ?? fallback
    expect(user.weeklyTickets).toBe(0);
    expect(user.streakDays).toBe(0);
    expect(user.lotteryOptIn).toBe(true);
    expect(user.nftWins).toEqual([]);
    expect(user.referralId).toBeNull();
  });

  // ── Test: existing user with wallet-keyed doc (merge) ────────────
  it('merges ticket data from wallet-keyed doc when profile doc lacks it', async () => {
    getUserProfile.mockResolvedValue({
      id: 'uuid-456',
      walletAddress: WALLET,
      // no weeklyTickets on profile
    });
    dbUtils.getDocument.mockResolvedValue({
      weeklyTickets: 7,
      streakDays: 3,
      lotteryOptIn: false,
      nftWins: ['meme-abc'],
    });

    const res = await request(app).get(`/api/users/${WALLET}`);

    expect(res.status).toBe(200);
    const { user } = res.body;
    assertUserShape(user);
    expect(user.weeklyTickets).toBe(7);
    expect(user.streakDays).toBe(3);
    expect(user.lotteryOptIn).toBe(false);
    expect(user.nftWins).toEqual(['meme-abc']);
  });

  // ── Test: existing user with both docs (profile takes precedence) ─
  it('prefers profile doc values over wallet-keyed doc', async () => {
    getUserProfile.mockResolvedValue({
      id: 'uuid-789',
      walletAddress: WALLET,
      weeklyTickets: 10,
      streakDays: 5,
      lotteryOptIn: true,
      nftWins: ['meme-xyz'],
      referredBy: 'SomeWallet',
      referralCount: 2,
      referralId: 'ref-abc',
    });
    dbUtils.getDocument.mockResolvedValue({
      weeklyTickets: 3, // should be ignored — profile has value
      streakDays: 1,
    });

    const res = await request(app).get(`/api/users/${WALLET}`);

    expect(res.status).toBe(200);
    const { user } = res.body;
    assertUserShape(user);
    expect(user.weeklyTickets).toBe(10);
    expect(user.streakDays).toBe(5);
    expect(user.referredBy).toBe('SomeWallet');
    expect(user.referralCount).toBe(2);
    expect(user.referralId).toBe('ref-abc');
  });

  // ── Test: invalid wallet returns 400 ─────────────────────────────
  it('rejects short wallet with 400', async () => {
    const res = await request(app).get('/api/users/tooshort');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // ── Test: 500 error shape ──────────────────────────────────────────
  it('returns error shape when getUserProfile throws', async () => {
    getUserProfile.mockRejectedValue(new Error('Firestore unavailable'));

    const res = await request(app).get(`/api/users/${WALLET}`);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(typeof res.body.error).toBe('string');
  });
});
