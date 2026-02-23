const MEMEYA_TOKEN_MINT = 'mPj8dgqLDciVX27vU5efHiodbQhsgK43gGhjQrBpump';
const SOLANA_RPC = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const TOKEN_DECIMALS = 6;

/**
 * Get $Memeya token balance for a wallet address.
 * Uses direct JSON-RPC call to avoid @solana/web3.js Token-2022 parsing bugs.
 * Returns human-readable amount (raw balance / 10^6).
 * Gracefully returns 0 on any error.
 */
async function getMemeyaBalance(walletAddress) {
  try {
    const response = await fetch(SOLANA_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTokenAccountsByOwner',
        params: [
          walletAddress,
          { mint: MEMEYA_TOKEN_MINT },
          { encoding: 'jsonParsed' }
        ]
      })
    });

    const data = await response.json();
    const accounts = data?.result?.value || [];

    if (accounts.length === 0) return 0;

    let totalRaw = 0;
    for (const account of accounts) {
      const tokenAmount = account?.account?.data?.parsed?.info?.tokenAmount;
      if (tokenAmount) {
        totalRaw += Number(tokenAmount.amount);
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
