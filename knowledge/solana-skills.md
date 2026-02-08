# Solana Development Skills

## Jupiter Swap Integration

Jupiter is the #1 swap aggregator on Solana, providing best prices across all DEXs.

### Quote API
```javascript
const getQuote = async (inputMint, outputMint, amount) => {
  const response = await fetch(
    `https://quote-api.jup.ag/v6/quote?` +
    `inputMint=${inputMint}&` +
    `outputMint=${outputMint}&` +
    `amount=${amount}&` +
    `slippageBps=50` // 0.5% slippage
  );
  return response.json();
};
```

### Swap Execution
```javascript
const executeSwap = async (quoteResponse, userPublicKey) => {
  const { swapTransaction } = await fetch('https://quote-api.jup.ag/v6/swap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey: userPublicKey.toString(),
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
    }),
  }).then(r => r.json());

  // Deserialize and sign transaction
  const transaction = VersionedTransaction.deserialize(
    Buffer.from(swapTransaction, 'base64')
  );

  return transaction;
};
```

## Common Token Addresses (Solana)

```javascript
const TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',  // Wrapped SOL
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
};
```

## Wallet Connection (Solana Wallet Adapter)

No API key or domain configuration needed. Works on any domain/IP.

```jsx
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import '@solana/wallet-adapter-react-ui/styles.css';

// Provider setup
const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];

<ConnectionProvider endpoint={rpcUrl}>
  <WalletProvider wallets={wallets} autoConnect>
    <WalletModalProvider>
      <App />
    </WalletModalProvider>
  </WalletProvider>
</ConnectionProvider>

// Usage in component
const { publicKey, connected, connect, disconnect, signTransaction } = useWallet();
```

## Solana Web3.js Basics

```javascript
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Connect to RPC
const connection = new Connection('https://api.mainnet-beta.solana.com');

// Get SOL balance
const balance = await connection.getBalance(new PublicKey(walletAddress));
const solBalance = balance / LAMPORTS_PER_SOL;

// Get token accounts
const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
  new PublicKey(walletAddress),
  { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
);
```

## Transaction Signing Flow

```javascript
// 1. Build transaction
const transaction = new Transaction().add(
  // instruction(s)
);

// 2. Get recent blockhash
const { blockhash } = await connection.getLatestBlockhash();
transaction.recentBlockhash = blockhash;
transaction.feePayer = wallet.publicKey;

// 3. Sign with wallet adapter
const signed = await wallet.signTransaction(transaction);

// 4. Send and confirm
const signature = await connection.sendRawTransaction(signed.serialize());
await connection.confirmTransaction(signature);
```

## Token Safety Checks

```javascript
const checkTokenSafety = async (tokenAddress) => {
  // 1. Check liquidity
  const pools = await fetchJupiterPools(tokenAddress);
  const totalLiquidity = pools.reduce((sum, p) => sum + p.liquidity, 0);
  if (totalLiquidity < 10000) return { safe: false, reason: 'Low liquidity' };

  // 2. Check if tradeable (not frozen)
  const mintInfo = await getMint(connection, new PublicKey(tokenAddress));
  if (mintInfo.freezeAuthority) return { safe: false, reason: 'Has freeze authority' };

  // 3. Check holder distribution (optional)
  // Too concentrated = potential rug

  return { safe: true };
};
```

## Error Handling

```javascript
try {
  const signature = await sendTransaction();
} catch (error) {
  if (error.message.includes('insufficient funds')) {
    // Not enough SOL for fees
  } else if (error.message.includes('blockhash not found')) {
    // Transaction expired, retry with fresh blockhash
  } else if (error.message.includes('slippage')) {
    // Price moved too much, retry with higher slippage
  }
}
```

## Best Practices

1. **Always check token safety** before trading
2. **Use versioned transactions** for better compatibility
3. **Set reasonable slippage** (0.5-1% for majors, 1-3% for memes)
4. **Handle RPC rate limits** with retry logic
5. **Test on devnet first** before mainnet
