/**
 * Contract tests for reward endpoints:
 *   GET /api/rewards/balance
 *   GET /api/rewards/config
 *
 * Ensures the response shape matches what Dashboard.jsx expects.
 */
const request = require('supertest');
const crossmintService = require('../../services/crossmintService');
const baseService = require('../../services/baseService');
const { dbUtils } = require('../../config/firebase');

const app = require('../../server');

// ═══════════════════════════════════════════════════════════════════
// GET /api/rewards/balance
// ═══════════════════════════════════════════════════════════════════
describe('GET /api/rewards/balance — response contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    crossmintService.getWalletBalances.mockResolvedValue({ usdc: 100.0, sol: 0.5 });
    crossmintService.getWalletAddress.mockResolvedValue('4BqywEbjMf4APFBw1spPFr11q21Uu5A1fHpCRM2zSbMP');
    baseService.getUsdcBalance.mockResolvedValue(50.0);
  });

  it('returns all fields Dashboard.jsx depends on', async () => {
    const res = await request(app).get('/api/rewards/balance');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { data } = res.body;
    expect(data).toBeDefined();

    // Top-level balances
    expect(typeof data.usdc).toBe('number');
    expect(typeof data.sol).toBe('number');
    expect(typeof data.address).toBe('string');

    // Base chain
    expect(data.base).toBeDefined();
    expect(typeof data.base.address).toBe('string');
    expect(data.base.usdc === null || typeof data.base.usdc === 'number').toBe(true);

    // Thresholds
    expect(data.thresholds).toBeDefined();
    expect(typeof data.thresholds.minDistribution).toBe('number');
    expect(typeof data.thresholds.lowBalanceAlert).toBe('number');

    // Rewards config + projections
    expect(data.rewards).toBeDefined();
    expect(typeof data.rewards.winnerPct).toBe('number');
    expect(typeof data.rewards.voter1Pct).toBe('number');
    expect(typeof data.rewards.voter2Pct).toBe('number');
    expect(typeof data.rewards.totalPct).toBe('number');

    expect(data.rewards.projected).toBeDefined();
    expect(typeof data.rewards.projected.winner).toBe('number');
    expect(typeof data.rewards.projected.voter1).toBe('number');
    expect(typeof data.rewards.projected.voter2).toBe('number');
    expect(typeof data.rewards.projected.total).toBe('number');

    // Timestamp
    expect(typeof data.timestamp).toBe('string');
  });

  it('returns base.usdc as null when Base fetch fails', async () => {
    baseService.getUsdcBalance.mockRejectedValue(new Error('RPC down'));

    const res = await request(app).get('/api/rewards/balance');

    expect(res.status).toBe(200);
    expect(res.body.data.base.usdc).toBeNull();
  });

  it('returns projected rewards proportional to USDC balance', async () => {
    crossmintService.getWalletBalances.mockResolvedValue({ usdc: 200.0, sol: 1.0 });

    const res = await request(app).get('/api/rewards/balance');

    const { projected } = res.body.data.rewards;
    expect(projected.winner).toBe(20.0);  // 200 * 0.10
    expect(projected.voter1).toBe(14.0);  // 200 * 0.07
    expect(projected.voter2).toBe(8.0);   // 200 * 0.04
    expect(projected.total).toBe(42.0);
  });

  it('returns error shape when balance fetch fails', async () => {
    crossmintService.getWalletBalances.mockRejectedValue(new Error('API down'));

    const res = await request(app).get('/api/rewards/balance');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(typeof res.body.error).toBe('string');
  });
});

// ═══════════════════════════════════════════════════════════════════
// GET /api/rewards/config
// ═══════════════════════════════════════════════════════════════════
describe('GET /api/rewards/config — response contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns rewardEnabled boolean', async () => {
    dbUtils.getDocument.mockResolvedValue({ rewardEnabled: true });

    const res = await request(app).get('/api/rewards/config');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.rewardEnabled).toBe('boolean');
  });

  it('defaults rewardEnabled to true when doc is missing', async () => {
    dbUtils.getDocument.mockResolvedValue(null);

    const res = await request(app).get('/api/rewards/config');

    expect(res.status).toBe(200);
    expect(res.body.data.rewardEnabled).toBe(true);
  });

  it('defaults rewardEnabled to true when field is missing', async () => {
    dbUtils.getDocument.mockResolvedValue({}); // doc exists but no rewardEnabled field

    const res = await request(app).get('/api/rewards/config');

    expect(res.status).toBe(200);
    expect(res.body.data.rewardEnabled).toBe(true);
  });
});
