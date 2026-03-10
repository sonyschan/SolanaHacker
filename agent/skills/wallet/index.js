/**
 * Skill: wallet
 * Check Memeya's USDC reward wallet, view distribution history, trigger payouts.
 *
 * Calls backend API via BACKEND_URL (already on droplet).
 */

const BACKEND_URL = process.env.BACKEND_URL || 'https://memeforge-api-836651762884.asia-southeast1.run.app';

// ─── Tool Definitions ───────────────────────────────────────────

export const tools = [
  {
    name: 'wallet_balance',
    description:
      'Check Memeya\'s reward wallet USDC and SOL balance, plus distribution thresholds.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'wallet_rewards',
    description:
      'View recent reward distribution history (who got paid, amounts, tx signatures).',
    input_schema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Number of records to fetch (default: 10, max: 100)' },
      },
    },
  },
  {
    name: 'wallet_distribute',
    description:
      'Manually trigger reward distribution for today\'s completed lottery draw.',
    input_schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Reason for manual trigger' },
      },
    },
  },
];

// ─── Helpers ────────────────────────────────────────────────────

async function apiGet(path) {
  const res = await fetch(`${BACKEND_URL}${path}`);
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function apiPost(path, body = {}) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

// ─── Executors ──────────────────────────────────────────────────

export function createExecutors(deps) {
  return {
    async wallet_balance() {
      try {
        const data = await apiGet('/api/rewards/balance');
        if (!data.success) throw new Error(data.error || 'Unknown error');

        const d = data.data;
        const lines = [
          `💳 **Memeya Reward Wallet**`,
          `Address: \`${d.address}\``,
          `USDC: $${d.usdc.toFixed(2)}`,
          `SOL: ${d.sol.toFixed(4)}`,
          '',
          `Thresholds:`,
          `  Min distribution: $${d.thresholds.minDistribution}`,
          `  Low balance alert: $${d.thresholds.lowBalanceAlert}`,
          `  Reward rates: ${(d.rewards.winnerPct * 100)}% / ${(d.rewards.voter1Pct * 100)}% / ${(d.rewards.voter2Pct * 100)}%`,
          `  Projected payout: $${d.rewards.projected.winner} + $${d.rewards.projected.voter1} + $${d.rewards.projected.voter2} = $${d.rewards.projected.total}`,
        ];

        if (d.usdc < d.thresholds.lowBalanceAlert) {
          lines.push('', `⚠️ Balance below alert threshold! Please top up.`);
        }

        return lines.join('\n');
      } catch (err) {
        return `❌ Failed to fetch wallet balance: ${err.message}`;
      }
    },

    async wallet_rewards({ limit = 10 } = {}) {
      try {
        const data = await apiGet(`/api/rewards/history?limit=${limit}`);
        if (!data.success) throw new Error(data.error || 'Unknown error');

        const dists = data.data.distributions;
        if (dists.length === 0) return 'No reward distributions yet.';

        const lines = [`📊 **Recent Reward Distributions** (${dists.length})\n`];

        for (const d of dists) {
          const transfers = (d.transfers || []).length;
          const errors = (d.errors || []).length;
          lines.push(
            `**${d.drawId}** — ${d.status}`,
            `  Balance: $${(d.balance || 0).toFixed(2)} | Transfers: ${transfers} | Errors: ${errors}`
          );
          if (d.winnerWallet) {
            lines.push(`  Winner: \`${d.winnerWallet.slice(0, 8)}...\``);
          }
          if (d.calculatedAmounts) {
            lines.push(`  Amounts: winner $${d.calculatedAmounts.winner?.toFixed(2)}, voter1 $${d.calculatedAmounts.voter1?.toFixed(2)}, voter2 $${d.calculatedAmounts.voter2?.toFixed(2)}`);
          }
          lines.push('');
        }

        return lines.join('\n');
      } catch (err) {
        return `❌ Failed to fetch reward history: ${err.message}`;
      }
    },

    async wallet_distribute({ reason } = {}) {
      try {
        const data = await apiPost('/api/scheduler/trigger/reward_distribution', {
          reason: reason || 'Manual trigger via agent wallet skill'
        });

        if (!data.success) throw new Error(data.error || 'Unknown error');
        return `✅ Reward distribution triggered at ${data.triggeredAt}`;
      } catch (err) {
        return `❌ Failed to trigger distribution: ${err.message}`;
      }
    },
  };
}
