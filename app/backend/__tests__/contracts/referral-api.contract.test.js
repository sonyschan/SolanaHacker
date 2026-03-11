/**
 * Contract tests for GET /api/users/:wallet/referral-info
 *
 * Ensures the response shape matches what ReferralTab.jsx expects.
 */
const request = require('supertest');

const app = require('../../server');

const { mockDb } = global.__mocks__.firebase;

describe('GET /api/users/:wallet/referral-info — response contract', () => {
  const WALLET = '4BqywEbjMf4APFBw1spPFr11q21Uu5A1fHpCRM2zSbMP';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Helper: set up collection-name-aware Firestore mocks.
   * The endpoint reads from 'users' then 'referrals' — we dispatch
   * by collection name instead of fragile call ordering.
   */
  function mockFirestoreDocs(userDoc, referralDoc) {
    mockDb.collection.mockImplementation((name) => ({
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue(
          name === 'users' ? userDoc : referralDoc
        ),
        set: jest.fn(),
        update: jest.fn(),
      })),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ docs: [], empty: true }),
    }));
  }

  it('returns all fields ReferralTab.jsx depends on', async () => {
    mockFirestoreDocs(
      { exists: true, data: () => ({ referralId: 'abc123', referredBy: 'SomeWallet', referralCount: 3, memeyaBalance: 75000 }) },
      { exists: true, data: () => ({ totalReferredBonus: 1.25 }) }
    );

    const res = await request(app).get(`/api/users/${WALLET}/referral-info`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { data } = res.body;
    expect(data).toBeDefined();
    expect(data.referralId === null || typeof data.referralId === 'string').toBe(true);
    expect(data.referredBy === null || typeof data.referredBy === 'string').toBe(true);
    expect(typeof data.referralCount).toBe('number');
    expect(typeof data.memeyaBalance).toBe('number');
    expect(typeof data.isElite).toBe('boolean');
    expect(typeof data.referralBonus).toBe('number');
  });

  it('returns correct values for an existing user with referral data', async () => {
    mockFirestoreDocs(
      { exists: true, data: () => ({ referralId: 'ref-xyz', referredBy: null, referralCount: 5, memeyaBalance: 100000 }) },
      { exists: true, data: () => ({ totalReferredBonus: 3.5 }) }
    );

    const res = await request(app).get(`/api/users/${WALLET}/referral-info`);

    const { data } = res.body;
    expect(data.referralId).toBe('ref-xyz');
    expect(data.referredBy).toBeNull();
    expect(data.referralCount).toBe(5);
    expect(data.memeyaBalance).toBe(100000);
    expect(data.isElite).toBe(true);  // 100000 >= 50000
    expect(data.referralBonus).toBe(3.5);
  });

  it('returns defaults for a user with no data', async () => {
    mockFirestoreDocs(
      { exists: false, data: () => null },
      { exists: false, data: () => null }
    );

    const res = await request(app).get(`/api/users/${WALLET}/referral-info`);

    expect(res.status).toBe(200);
    const { data } = res.body;
    expect(data.referralId).toBeNull();
    expect(data.referredBy).toBeNull();
    expect(data.referralCount).toBe(0);
    expect(data.memeyaBalance).toBe(0);
    expect(data.isElite).toBe(false); // 0 < 50000
    expect(data.referralBonus).toBe(0);
  });

  it('computes isElite based on 50k threshold', async () => {
    // Just under threshold
    mockFirestoreDocs(
      { exists: true, data: () => ({ referralId: 'ref-1', memeyaBalance: 49999 }) },
      { exists: false, data: () => null }
    );
    let res = await request(app).get(`/api/users/${WALLET}/referral-info`);
    expect(res.body.data.isElite).toBe(false);

    // Exactly at threshold
    mockFirestoreDocs(
      { exists: true, data: () => ({ referralId: 'ref-2', memeyaBalance: 50000 }) },
      { exists: false, data: () => null }
    );
    res = await request(app).get(`/api/users/${WALLET}/referral-info`);
    expect(res.body.data.isElite).toBe(true);
  });
});
