const { Connection, PublicKey } = require('@solana/web3.js');

const MEMEYA_TOKEN_MINT = '983j5C4udenB89Wh8Z7ebcgtqeEAUp2uprnbrLvHpump';
const SOLANA_RPC = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const TOKEN_DECIMALS = 6;
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

let connection = null;

function getConnection() {
  if (!connection) {
    connection = new Connection(SOLANA_RPC, 'confirmed');
  }
  return connection;
}

/**
 * Get $Memeya token balance for a wallet address.
 * Returns human-readable amount (raw balance / 10^6).
 * Gracefully returns 0 on any error.
 */
async function getMemeyaBalance(walletAddress) {
  try {
    const conn = getConnection();
    const owner = new PublicKey(walletAddress);
    const mint = new PublicKey(MEMEYA_TOKEN_MINT);

    const response = await conn.getTokenAccountsByOwner(owner, { mint }, { encoding: 'jsonParsed' });

    if (!response.value || response.value.length === 0) {
      return 0;
    }

    // Sum balances across all token accounts for this mint
    let totalRaw = 0;
    for (const account of response.value) {
      const parsed = account.account.data.parsed;
      if (parsed && parsed.info && parsed.info.tokenAmount) {
        totalRaw += Number(parsed.info.tokenAmount.amount);
      }
    }

    return totalRaw / Math.pow(10, TOKEN_DECIMALS);
  } catch (error) {
    console.error('Error fetching $Memeya balance:', error.message);
    return 0;
  }
}

/**
 * Calculate bonus tickets from token holdings.
 * Formula: floor(log10(tokenAmount)), 0 if < 10.
 */
function calculateTokenBonus(tokenAmount) {
  if (tokenAmount < 10) return 0;
  return Math.floor(Math.log10(tokenAmount));
}

module.exports = {
  getMemeyaBalance,
  calculateTokenBonus,
  MEMEYA_TOKEN_MINT
};
