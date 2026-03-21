import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import MemeCard from './MemeCard';
import { useWallets, useSignAndSendTransaction } from '@privy-io/react-auth/solana';
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import bs58 from 'bs58';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://memeforge-api-836651762884.asia-southeast1.run.app';

const MEMEYA_WALLET = new PublicKey('4BqywEbjMf4APFBw1spPFr11q21Uu5A1fHpCRM2zSbMP');
const MEMEYA_MINT = new PublicKey('mPj8dgqLDciVX27vU5efHiodbQhsgK43gGhjQrBpump');
const MEMEYA_DECIMALS = 6;
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const USDC_DECIMALS = 6;

// ── Single source of truth for meme service pricing ──────────────────
const MEME_PRICES = {
  news: 0.10,       // News Memes (generate-custom)
  generate: 0.10,   // x402 API alias for news/generate-custom
  community: 0.15,  // Community Memes (generate-community)
  newspaper: 0.15,  // Community Newspaper (generate-newspaper)
  rate: 0.05,       // Rate a Meme
};

const SOLANA_RPC = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

/** Extract X handle from URL or raw handle, build account object with avatarUrl */
function buildAccountFromX(input) {
  let handle = input.replace(/^@/, '');
  const urlMatch = input.match(/(?:x\.com|twitter\.com)\/([^/?#]+)/);
  if (urlMatch) handle = urlMatch[1];
  return {
    handle: `@${handle}`,
    name: handle,
    avatarUrl: `https://unavatar.io/x/${handle}`,
  };
}

// ── Private-mode auth helpers ──────────────────────────────────────────
const LAB_STORAGE_KEY = 'lab_api_key';
const LAB_EXPIRY_KEY = 'lab_api_key_expires';
const LAB_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function getStoredKey() {
  const key = localStorage.getItem(LAB_STORAGE_KEY);
  const expires = localStorage.getItem(LAB_EXPIRY_KEY);
  if (key && expires && Date.now() < Number(expires)) return key;
  localStorage.removeItem(LAB_STORAGE_KEY);
  localStorage.removeItem(LAB_EXPIRY_KEY);
  return null;
}
function storeKey(key) {
  localStorage.setItem(LAB_STORAGE_KEY, key);
  localStorage.setItem(LAB_EXPIRY_KEY, String(Date.now() + LAB_TTL_MS));
}
function clearStoredKey() {
  localStorage.removeItem(LAB_STORAGE_KEY);
  localStorage.removeItem(LAB_EXPIRY_KEY);
}

// ── Constants ──────────────────────────────────────────────────────────
const GRADE_COLORS = {
  'S':  'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  'A+': 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  'A':  'text-blue-400 bg-blue-400/10 border-blue-400/30',
  'B+': 'text-green-400 bg-green-400/10 border-green-400/30',
  'B':  'text-green-400 bg-green-400/10 border-green-400/30',
  'C':  'text-gray-400 bg-gray-400/10 border-gray-400/30',
  'D':  'text-orange-400 bg-orange-400/10 border-orange-400/30',
  'F':  'text-red-400 bg-red-400/10 border-red-400/30',
};

const CODE_SNIPPETS = {
  rate: {
    base: (base) => `npm install @x402/fetch @x402/evm viem

import { x402Client, wrapFetchWithPayment } from '@x402/fetch';
import { registerExactEvmScheme } from '@x402/evm/exact/client';
import { privateKeyToAccount } from 'viem/accounts';

const client = new x402Client();
const account = privateKeyToAccount('0x...');
registerExactEvmScheme(client, { signer: account });
const fetchPaid = wrapFetchWithPayment(fetch, client);

// Rate a meme — $0.05 USDC on Base
const res = await fetchPaid('${base}/api/memes/rate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageUrl: 'https://example.com/meme.png'
  }),
});
const { score, grade, pass, suggestions } = await res.json();`,
    solana: (base) => `npm install @x402/fetch @x402/svm @solana/signers bs58

import { x402Client, wrapFetchWithPayment } from '@x402/fetch';
import { registerExactSvmScheme } from '@x402/svm/exact/client';
import { createKeyPairSignerFromBytes } from '@solana/signers';
import bs58 from 'bs58';

const client = new x402Client();
const keyBytes = bs58.decode('your-base58-secret-key');
const signer = await createKeyPairSignerFromBytes(keyBytes);
registerExactSvmScheme(client, { signer });
const fetchPaid = wrapFetchWithPayment(fetch, client);

// Rate a meme — $0.05 USDC on Solana (gas sponsored by Dexter)
const res = await fetchPaid('${base}/api/memes/rate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageUrl: 'https://example.com/meme.png'
  }),
});
const { score, grade, pass, suggestions } = await res.json();`,
  },
  generate: {
    base: (base) => `npm install @x402/fetch @x402/evm viem

import { x402Client, wrapFetchWithPayment } from '@x402/fetch';
import { registerExactEvmScheme } from '@x402/evm/exact/client';
import { privateKeyToAccount } from 'viem/accounts';

const client = new x402Client();
const account = privateKeyToAccount('0x...');
registerExactEvmScheme(client, { signer: account });
const fetchPaid = wrapFetchWithPayment(fetch, client);

// Generate a custom meme — $0.10 USDC on Base
const res = await fetchPaid('${base}/api/memes/generate-custom', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    topic: 'Bitcoin hits $200K',
    // Optional: template, strategy, narrative, artStyle
  }),
});
const { meme } = await res.json();
// meme.imageUrl, meme.title, meme.tags, meme.metadata`,
    solana: (base) => `npm install @x402/fetch @x402/svm @solana/signers bs58

import { x402Client, wrapFetchWithPayment } from '@x402/fetch';
import { registerExactSvmScheme } from '@x402/svm/exact/client';
import { createKeyPairSignerFromBytes } from '@solana/signers';
import bs58 from 'bs58';

const client = new x402Client();
const keyBytes = bs58.decode('your-base58-secret-key');
const signer = await createKeyPairSignerFromBytes(keyBytes);
registerExactSvmScheme(client, { signer });
const fetchPaid = wrapFetchWithPayment(fetch, client);

// Generate a custom meme — $0.10 USDC on Solana (gas sponsored by Dexter)
const res = await fetchPaid('${base}/api/memes/generate-custom', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    topic: 'Bitcoin hits $200K',
    // Optional: template, strategy, narrative, artStyle
  }),
});
const { meme } = await res.json();
// meme.imageUrl, meme.title, meme.tags, meme.metadata`,
  },
  community: {
    base: (base) => `npm install @x402/fetch @x402/evm viem

import { x402Client, wrapFetchWithPayment } from '@x402/fetch';
import { registerExactEvmScheme } from '@x402/evm/exact/client';
import { privateKeyToAccount } from 'viem/accounts';

const client = new x402Client();
const account = privateKeyToAccount('0x...');
registerExactEvmScheme(client, { signer: account });
const fetchPaid = wrapFetchWithPayment(fetch, client);

// Generate a community meme — $0.15 USDC on Base
const res = await fetchPaid('${base}/api/memes/generate-community', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    description: 'Memeya token pumping to the moon',
    tone: 'hype',
    style: 'meme',
  }),
});
const { meme, suggestedTweet } = await res.json();`,
    solana: (base) => `npm install @x402/fetch @x402/svm @solana/signers bs58

import { x402Client, wrapFetchWithPayment } from '@x402/fetch';
import { registerExactSvmScheme } from '@x402/svm/exact/client';
import { createKeyPairSignerFromBytes } from '@solana/signers';
import bs58 from 'bs58';

const client = new x402Client();
const keyBytes = bs58.decode('your-base58-secret-key');
const signer = await createKeyPairSignerFromBytes(keyBytes);
registerExactSvmScheme(client, { signer });
const fetchPaid = wrapFetchWithPayment(fetch, client);

// Generate a community meme — $0.15 USDC on Solana (gas sponsored by Dexter)
const res = await fetchPaid('${base}/api/memes/generate-community', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    description: 'Memeya token pumping to the moon',
    tone: 'hype',
    style: 'meme',
  }),
});
const { meme, suggestedTweet } = await res.json();`,
  },
  newspaper: {
    base: (base) => `npm install @x402/fetch @x402/evm viem

import { x402Client, wrapFetchWithPayment } from '@x402/fetch';
import { registerExactEvmScheme } from '@x402/evm/exact/client';
import { privateKeyToAccount } from 'viem/accounts';

const client = new x402Client();
const account = privateKeyToAccount('0x...');
registerExactEvmScheme(client, { signer: account });
const fetchPaid = wrapFetchWithPayment(fetch, client);

// Generate a community newspaper — $0.15 USDC on Base
const res = await fetchPaid('\${base}/api/memes/generate-newspaper', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    description: 'BTC hits new ATH as institutional demand surges',
    xProfileUrl: 'https://x.com/YourProject',
  }),
});
const { meme, suggestedTweet } = await res.json();`,
    solana: (base) => `npm install @x402/fetch @x402/svm @solana/signers bs58

import { x402Client, wrapFetchWithPayment } from '@x402/fetch';
import { registerExactSvmScheme } from '@x402/svm/exact/client';
import { createKeyPairSignerFromBytes } from '@solana/signers';
import bs58 from 'bs58';

const client = new x402Client();
const keyBytes = bs58.decode('your-base58-secret-key');
const signer = await createKeyPairSignerFromBytes(keyBytes);
registerExactSvmScheme(client, { signer });
const fetchPaid = wrapFetchWithPayment(fetch, client);

// Generate a community newspaper — $0.15 USDC on Solana (gas sponsored by Dexter)
const res = await fetchPaid('\${base}/api/memes/generate-newspaper', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    description: 'BTC hits new ATH as institutional demand surges',
    xProfileUrl: 'https://x.com/YourProject',
  }),
});
const { meme, suggestedTweet } = await res.json();`,
  },
  catalog: (base) => `// Browse catalog — Free, no x402 needed

// Art styles
const styles = await fetch('${base}/api/catalog/art-styles')
  .then(r => r.json());

// Templates
const templates = await fetch('${base}/api/catalog/templates')
  .then(r => r.json());

// Strategies
const strategies = await fetch('${base}/api/catalog/strategies')
  .then(r => r.json());

// Narratives
const narratives = await fetch('${base}/api/catalog/narratives')
  .then(r => r.json());`,
};

// Memeya chat messages during generation (~90s total, show each for ~12s)
const MEMEYA_CHAT = [
  { msg: "Ooh, let me think about this one...", pct: 5 },
  { msg: "Scanning the meme multiverse for inspiration...", pct: 15 },
  { msg: "Found it! Crafting the comedy architecture now.", pct: 25 },
  { msg: "Picking the perfect art style. Trust me, I have taste.", pct: 40 },
  { msg: "Generating image... this is the fun part!", pct: 60 },
  { msg: "Adding the finishing touches. Almost ready!", pct: 80 },
  { msg: "Just a few more seconds... worth the wait!", pct: 92 },
];

// ── Component ──────────────────────────────────────────────────────────
const LabTab = ({ publicMode = false }) => {
  const { t } = useTranslation();
  const { authenticated, walletAddress, login } = useAuth();
  const { wallets: solanaWallets } = useWallets();
  const { signAndSendTransaction } = useSignAndSendTransaction();

  // Tab state (public mode: create/api; private mode: rate/generate/catalog/api)
  const [activePanel, setActivePanel] = useState(publicMode ? 'create' : 'rate');

  // ── Create tab state ──────────────────────────────────────
  const [createCategory, setCreateCategory] = useState(null); // null | 'news' | 'community' | 'newspaper'
  const [createTopic, setCreateTopic] = useState('');
  const [communityForm, setCommunityForm] = useState({ xAccount: '', description: '', tone: 'hype', style: 'meme' });
  const [newspaperForm, setNewspaperForm] = useState({ xProfileUrl: '', description: '' });
  const [prices, setPrices] = useState(null);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [headlines, setHeadlines] = useState([]);
  const [headlineIdx, setHeadlineIdx] = useState(0);
  const [createLoading, setCreateLoading] = useState(false);
  const [createStatus, setCreateStatus] = useState('');
  const [createProgress, setCreateProgress] = useState(0);
  const [createResult, setCreateResult] = useState(null);
  const [createError, setCreateError] = useState('');
  const [featuredMeme, setFeaturedMeme] = useState(null);
  const [tweetCopied, setTweetCopied] = useState(false);

  // ── My Memes tab state ─────────────────────────────────────
  const [myMemes, setMyMemes] = useState([]);
  const [myMemesLoading, setMyMemesLoading] = useState(false);
  const [myMemesLoaded, setMyMemesLoaded] = useState(false);
  const [selectedMeme, setSelectedMeme] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Private mode auth state ───────────────────────────────
  const [apiKey, setApiKey] = useState(() => getStoredKey());
  const [passphrase, setPassphrase] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Private mode panel states
  const [catalogs, setCatalogs] = useState({ templates: [], strategies: [], narratives: [], artStyles: [], topRecipes: [] });
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [rateImageUrl, setRateImageUrl] = useState('');
  const [rateResult, setRateResult] = useState(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [genForm, setGenForm] = useState({ topic: '', templateId: '', strategyId: '', narrativeId: '', artStyleId: '', mode: 'auto' });
  const [genResult, setGenResult] = useState(null);
  const [genLoading, setGenLoading] = useState(false);
  const [catalogTab, setCatalogTab] = useState('templates');
  const [codeCopied, setCodeCopied] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [codeTab, setCodeTab] = useState('rate');
  const [chainTab, setChainTab] = useState('solana');
  const [recipesLoaded, setRecipesLoaded] = useState(false);

  const labHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'x-api-key': apiKey || '',
  }), [apiKey]);

  // ── Fetch prices (Create tab) — re-fetches when category changes ──
  useEffect(() => {
    if (!publicMode || !createCategory) return;
    setPricesLoading(true);
    const type = createCategory === 'community' ? 'community' : createCategory === 'newspaper' ? 'newspaper' : 'news';
    const typeParam = type !== 'news' ? `?type=${type}` : '';
    fetch(`${API_BASE_URL}/api/memes/generate-price${typeParam}`)
      .then(r => r.json())
      .then(data => { if (data.success) setPrices(data); })
      .catch(() => {})
      .finally(() => setPricesLoading(false));
  }, [publicMode, createCategory]);

  // ── Fetch headlines for rotating placeholder ──────────────
  useEffect(() => {
    if (!publicMode) return;
    fetch(`${API_BASE_URL}/api/news/headlines`)
      .then(r => r.json())
      .then(data => { if (data.headlines?.length) setHeadlines(data.headlines); })
      .catch(() => {});
  }, [publicMode]);

  // Rotate headline every 4 seconds
  useEffect(() => {
    if (headlines.length < 2) return;
    const timer = setInterval(() => {
      setHeadlineIdx(i => (i + 1) % headlines.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [headlines.length]);

  // ── Fetch featured memes (recent lottery winners — human-voted #1) ──
  useEffect(() => {
    if (!publicMode) return;
    fetch(`${API_BASE_URL}/api/lottery/recent-winners?limit=9`)
      .then(r => r.json())
      .then(data => {
        if (data.data?.length) {
          setFeaturedMeme(data.data.map(d => ({
            id: d.memeId,
            title: d.memeTitle,
            imageUrl: d.memeImageUrl,
            rarityScore: d.memeRarityScore,
          })));
        }
      })
      .catch(() => {});
  }, [publicMode]);

  // ── Fetch my creations when tab is active ──────────────────
  useEffect(() => {
    if (activePanel !== 'myMemes' || !authenticated || !walletAddress || myMemesLoaded) return;
    setMyMemesLoading(true);
    fetch(`${API_BASE_URL}/api/memes/my-creations?wallet=${walletAddress}&limit=50`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setMyMemes(data.memes || []);
        setMyMemesLoaded(true);
      })
      .catch(() => {})
      .finally(() => setMyMemesLoading(false));
  }, [activePanel, authenticated, walletAddress, myMemesLoaded]);

  // ── Solana payment + generation ───────────────────────────
  const handleCreate = async (paymentToken) => {
    // Validate input based on category
    if (createCategory === 'community') {
      if (!communityForm.description.trim()) return;
    } else if (createCategory === 'newspaper') {
      if (!newspaperForm.description.trim()) return;
    } else {
      if (!createTopic.trim()) return;
    }
    if (!authenticated) { login(); return; }

    setCreateLoading(true);
    setCreateError('');
    setCreateResult(null);
    setCreateStatus(MEMEYA_CHAT[0].msg);
    setCreateProgress(MEMEYA_CHAT[0].pct);

    // Rotate Memeya chat messages with progress
    let msgIdx = 0;
    const statusTimer = setInterval(() => {
      msgIdx = Math.min(msgIdx + 1, MEMEYA_CHAT.length - 1);
      setCreateStatus(MEMEYA_CHAT[msgIdx].msg);
      setCreateProgress(MEMEYA_CHAT[msgIdx].pct);
    }, 12000);

    try {
      // 1. Find connected Solana wallet
      //    Match the wallet address from useAuth() to ensure we use the same wallet
      //    the user sees displayed. useAuth() prefers external wallets (Phantom) over embedded.
      const solWallet = walletAddress
        ? solanaWallets.find(w => w.address === walletAddress) || solanaWallets[0]
        : solanaWallets[0];
      if (!solWallet) throw new Error('No Solana wallet found. Please connect a wallet.');

      // 2. Build transaction
      const connection = new Connection(SOLANA_RPC, 'confirmed');
      const fromPubkey = new PublicKey(solWallet.address);

      let tx;
      if (paymentToken === 'SOL') {
        const lamports = Math.ceil(prices.sol.amount * LAMPORTS_PER_SOL);
        tx = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey,
            toPubkey: MEMEYA_WALLET,
            lamports,
          })
        );
      } else if (paymentToken === 'MEMEYA') {
        // $Memeya SPL token transfer (Token-2022 program)
        const rawAmount = BigInt(Math.ceil(prices.memeya.amount * 10 ** MEMEYA_DECIMALS));
        const fromAta = getAssociatedTokenAddressSync(MEMEYA_MINT, fromPubkey, false, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
        const toAta = getAssociatedTokenAddressSync(MEMEYA_MINT, MEMEYA_WALLET, true, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);

        // Pre-flight: check user's $Memeya balance before building tx
        try {
          const balInfo = await connection.getTokenAccountBalance(fromAta);
          const userBalance = Number(balInfo.value.amount);
          if (userBalance < Number(rawAmount)) {
            const needed = (Number(rawAmount) / 10 ** MEMEYA_DECIMALS).toLocaleString(undefined, { maximumFractionDigits: 0 });
            const have = (userBalance / 10 ** MEMEYA_DECIMALS).toLocaleString(undefined, { maximumFractionDigits: 0 });
            throw new Error(`Insufficient $Memeya balance. Need ~${needed}, have ${have}.`);
          }
        } catch (balErr) {
          if (balErr.message?.includes('Insufficient')) throw balErr;
          const errMsg = balErr?.message || '';
          if (errMsg.includes('could not find account') || errMsg.includes('Invalid param') || errMsg.includes('not found')) {
            throw new Error('You don\'t have any $Memeya tokens. Buy some or pay with SOL instead.');
          }
          console.warn('Balance check failed (RPC issue?), proceeding anyway:', errMsg);
        }

        tx = new Transaction();

        // Ensure destination ATA exists (idempotent — no-op if already exists)
        tx.add(createAssociatedTokenAccountIdempotentInstruction(
          fromPubkey, toAta, MEMEYA_WALLET, MEMEYA_MINT,
          TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID,
        ));

        tx.add(createTransferCheckedInstruction(
          fromAta,
          MEMEYA_MINT,
          toAta,
          fromPubkey,
          rawAmount,
          MEMEYA_DECIMALS,
          [],
          TOKEN_2022_PROGRAM_ID,
        ));
      } else {
        // USDC SPL token transfer (standard TOKEN_PROGRAM)
        const rawAmount = BigInt(Math.ceil(prices.usdc.amount * 10 ** USDC_DECIMALS));
        const fromAta = getAssociatedTokenAddressSync(USDC_MINT, fromPubkey, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
        const toAta = getAssociatedTokenAddressSync(USDC_MINT, MEMEYA_WALLET, true, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);

        // Pre-flight: check user's USDC balance
        try {
          const balInfo = await connection.getTokenAccountBalance(fromAta);
          const userBalance = Number(balInfo.value.amount);
          if (userBalance < Number(rawAmount)) {
            const needed = (Number(rawAmount) / 10 ** USDC_DECIMALS).toFixed(2);
            const have = (userBalance / 10 ** USDC_DECIMALS).toFixed(2);
            throw new Error(`Insufficient USDC balance. Need ${needed}, have ${have}.`);
          }
        } catch (balErr) {
          if (balErr.message?.includes('Insufficient')) throw balErr;
          const errMsg = balErr?.message || '';
          if (errMsg.includes('could not find account') || errMsg.includes('Invalid param') || errMsg.includes('not found')) {
            throw new Error('No USDC found in your wallet. Pay with SOL instead.');
          }
          console.warn('Balance check failed (RPC issue?), proceeding anyway:', errMsg);
        }

        tx = new Transaction();

        tx.add(createAssociatedTokenAccountIdempotentInstruction(
          fromPubkey, toAta, MEMEYA_WALLET, USDC_MINT,
          TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID,
        ));

        tx.add(createTransferCheckedInstruction(
          fromAta,
          USDC_MINT,
          toAta,
          fromPubkey,
          rawAmount,
          USDC_DECIMALS,
          [],
          TOKEN_PROGRAM_ID,
        ));
      }

      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      tx.recentBlockhash = blockhash;
      tx.feePayer = fromPubkey;

      // 3. Serialize and sign+send via Privy SDK
      //    Privy's signAndSendTransaction expects { transaction: Uint8Array, wallet }
      //    Return shape varies: { hash: string } (base58) or { signature: Uint8Array }
      //    Note: omit chain param — Privy uses the default solanaClusters entry.
      //    Passing 'solana:mainnet' breaks embedded wallets when solanaClusters uses 'mainnet-beta'.
      setCreateStatus('Waiting for wallet signature...');
      setCreateProgress(3);
      const txBytes = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
      const result = await signAndSendTransaction({
        transaction: txBytes,
        wallet: solWallet,
      });
      // Handle both return shapes: hash (base58 string) or signature (raw bytes)
      const signature = typeof result.hash === 'string'
        ? result.hash
        : result.signature
          ? bs58.encode(result.signature)
          : null;
      if (!signature) throw new Error('Failed to get transaction signature from wallet');

      // 4. Send to backend for verification + generation
      setCreateStatus(MEMEYA_CHAT[1].msg);
      setCreateProgress(MEMEYA_CHAT[1].pct);

      let endpoint, body;
      if (createCategory === 'community') {
        endpoint = `${API_BASE_URL}/api/memes/generate-community-solana`;
        body = {
          description: communityForm.description.trim(),
          tone: communityForm.tone,
          style: communityForm.style,
          account: communityForm.xAccount.trim() ? buildAccountFromX(communityForm.xAccount.trim()) : null,
          txSignature: signature,
          paymentToken,
        };
      } else if (createCategory === 'newspaper') {
        endpoint = `${API_BASE_URL}/api/memes/generate-newspaper-solana`;
        body = {
          description: newspaperForm.description.trim(),
          xProfileUrl: newspaperForm.xProfileUrl.trim() || null,
          txSignature: signature,
          paymentToken,
        };
      } else {
        endpoint = `${API_BASE_URL}/api/memes/generate-solana`;
        body = {
          topic: createTopic.trim(),
          txSignature: signature,
          paymentToken,
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Generation failed');
      }

      setCreateResult({ ...data.meme, suggestedTweet: data.suggestedTweet });
      setMyMemesLoaded(false); // refresh My Memes on next visit
    } catch (err) {
      console.error('Create meme error:', err);
      const msg = err?.message || err?.toString() || 'Something went wrong';
      if (msg.includes('User rejected') || msg.includes('cancelled') || msg.includes('user rejected')) {
        setCreateError(t('lab.create.cancelled'));
      } else if (msg.includes('insufficient') || msg.includes('0x1')) {
        setCreateError('Insufficient token balance. Please check your wallet.');
      } else {
        setCreateError(msg);
      }
    } finally {
      clearInterval(statusTimer);
      setCreateLoading(false);
      setCreateStatus('');
      setCreateProgress(0);
    }
  };

  // ── Private mode handlers ─────────────────────────────────
  const handleAuth = async (e) => {
    e.preventDefault();
    if (!passphrase.trim()) return;
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/catalog/art-styles`, {
        headers: { 'x-api-key': passphrase.trim() },
      });
      if (res.ok) {
        storeKey(passphrase.trim());
        setApiKey(passphrase.trim());
        setPassphrase('');
      } else {
        const data = await res.json().catch(() => ({}));
        setAuthError(data.message || 'Invalid passphrase');
      }
    } catch (err) {
      setAuthError('Connection failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    clearStoredKey();
    setApiKey(null);
    setCatalogs({ templates: [], strategies: [], narratives: [], artStyles: [], topRecipes: [] });
  };

  useEffect(() => {
    if (!apiKey) return;
    const fetchCatalogs = async () => {
      setCatalogLoading(true);
      try {
        const fetchOpts = { headers: { 'x-api-key': apiKey } };
        const [tpl, str, nar, art] = await Promise.all([
          fetch(`${API_BASE_URL}/api/catalog/templates`, fetchOpts).then(r => r.json()),
          fetch(`${API_BASE_URL}/api/catalog/strategies`, fetchOpts).then(r => r.json()),
          fetch(`${API_BASE_URL}/api/catalog/narratives`, fetchOpts).then(r => r.json()),
          fetch(`${API_BASE_URL}/api/catalog/art-styles`, fetchOpts).then(r => r.json()),
        ]);
        if (tpl.error === 'FORBIDDEN' || str.error === 'FORBIDDEN') {
          clearStoredKey();
          setApiKey(null);
          return;
        }
        setCatalogs({
          templates: tpl.items || [],
          strategies: str.items || [],
          narratives: nar.items || [],
          artStyles: art.items || [],
          topRecipes: [],
        });
      } catch (err) {
        console.error('Failed to load catalogs:', err);
      } finally {
        setCatalogLoading(false);
      }
    };
    fetchCatalogs();
  }, [apiKey]);

  useEffect(() => {
    if (!apiKey || catalogTab !== 'recipes' || recipesLoaded) return;
    setRecipesLoaded(true);
    fetch(`${API_BASE_URL}/api/catalog/top-recipes`, { headers: { 'x-api-key': apiKey } })
      .then(r => r.json())
      .then(data => setCatalogs(prev => ({ ...prev, topRecipes: data.items || [] })))
      .catch(console.error);
  }, [catalogTab, apiKey, recipesLoaded]);

  const handleRate = async () => {
    setRateLoading(true);
    setRateResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/memes/rate`, {
        method: 'POST',
        headers: labHeaders(),
        body: JSON.stringify({ imageUrl: rateImageUrl.trim() }),
      });
      if (res.status === 402) {
        setRateResult({ success: false, error: t('lab.rate.paymentRequired'), is402: true });
      } else {
        setRateResult(await res.json());
      }
    } catch (err) {
      setRateResult({ success: false, error: err.message });
    } finally {
      setRateLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenLoading(true);
    setGenResult(null);
    try {
      const body = { topic: genForm.topic };
      if (genForm.templateId) body.templateId = genForm.templateId;
      if (genForm.strategyId) body.strategyId = genForm.strategyId;
      if (genForm.narrativeId) body.narrativeId = genForm.narrativeId;
      if (genForm.artStyleId) body.artStyleId = genForm.artStyleId;
      if (genForm.mode !== 'auto') body.mode = genForm.mode;
      const res = await fetch(`${API_BASE_URL}/api/memes/generate-custom`, {
        method: 'POST',
        headers: labHeaders(),
        body: JSON.stringify(body),
      });
      if (res.status === 402) {
        setGenResult({ success: false, error: t('lab.generate.paymentRequired'), is402: true });
      } else {
        setGenResult(await res.json());
      }
    } catch (err) {
      setGenResult({ success: false, error: err.message });
    } finally {
      setGenLoading(false);
    }
  };

  // ── Panel definitions ─────────────────────────────────────
  const privatePanels = [
    { id: 'rate', label: t('lab.panels.rate') },
    { id: 'generate', label: t('lab.panels.generate') },
    { id: 'catalog', label: t('lab.panels.catalog') },
    { id: 'api', label: t('lab.panels.api') },
  ];
  const publicPanels = [
    { id: 'create', label: t('lab.create.tabCreate') },
    { id: 'myMemes', label: t('lab.myMemes.tab') },
    { id: 'api', label: t('lab.panels.api') },
    { id: 'mcp', label: 'MCP' },
  ];
  const panels = publicMode ? publicPanels : privatePanels;

  // ── Private-mode auth gate ────────────────────────────────
  if (!apiKey && !publicMode) {
    return (
      <div className="flex items-center justify-center py-20">
        <form onSubmit={handleAuth} className="bg-white/5 border border-white/10 rounded-xl p-8 w-full max-w-sm space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white">{t('lab.title')}</h2>
            <p className="text-gray-400 text-sm mt-1">{t('lab.auth.prompt')}</p>
          </div>
          <input
            type="password"
            value={passphrase}
            onChange={e => setPassphrase(e.target.value)}
            placeholder={t('lab.auth.placeholder')}
            autoFocus
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
          {authError && <p className="text-red-400 text-xs text-center">{authError}</p>}
          <button
            type="submit"
            disabled={authLoading || !passphrase.trim()}
            className="w-full py-2.5 rounded-lg font-medium text-sm bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {authLoading ? t('common.loading') : t('lab.auth.submit')}
          </button>
        </form>
      </div>
    );
  }

  // ── Placeholder text from headlines ───────────────────────
  const placeholderText = headlines.length > 0
    ? headlines[headlineIdx]?.title || t('lab.create.placeholder')
    : t('lab.create.placeholder');

  // ── Main render ───────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {publicMode ? t('lab.create.title') : t('lab.title')}
        </h2>
        <p className="text-gray-400 text-sm sm:text-base mt-2 tracking-wide">
          {publicMode ? t('lab.create.subtitle') : t('lab.subtitle')}
        </p>
        {!publicMode && (
          <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-gray-300 mt-1 transition-colors">
            {t('lab.auth.logout')}
          </button>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 justify-center">
        {panels.map(p => (
          <button
            key={p.id}
            onClick={() => setActivePanel(p.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activePanel === p.id
                ? 'bg-indigo-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════
          CREATE TAB — Category selection → Input → Payment
          ═══════════════════════════════════════════════════════ */}
      {activePanel === 'create' && (
        <div className="space-y-8">

          {/* ── Step 1: Category Selection ── */}
          {!createCategory && !createLoading && !createResult && !createError && (
            <div className="max-w-3xl mx-auto space-y-6">
              <h3 className="text-center text-xl font-extrabold text-white tracking-tight">{t('lab.create.categoryTitle')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* News Memes Card */}
                <button
                  onClick={() => setCreateCategory('news')}
                  className="group text-left p-7 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 hover:border-cyan-500/40 hover:from-cyan-500/10 hover:to-blue-500/10 transition-all"
                >
                  <div className="text-3xl mb-4">🗞️</div>
                  <h4 className="text-xl font-extrabold text-white mb-3 group-hover:text-cyan-400 transition-colors tracking-tight">{t('lab.create.newsLabel')}</h4>
                  <p className="text-sm text-gray-300/90 mb-5 leading-relaxed">{t('lab.create.newsDesc')}</p>
                  <div className="space-y-2 text-xs text-gray-400/80 mb-5">
                    <p>📥 {t('lab.create.newsInput')}</p>
                    <p>📤 {t('lab.create.newsOutput')}</p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-xl font-extrabold font-mono text-cyan-400 block">${MEME_PRICES.news.toFixed(2)}</span>
                    <span className="text-[11px] text-gray-500 leading-snug italic block">{t('lab.create.newsWhy')}</span>
                  </div>
                </button>

                {/* Community Memes Card */}
                <button
                  onClick={() => setCreateCategory('community')}
                  className="group text-left p-7 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-green-500/5 hover:border-emerald-500/40 hover:from-emerald-500/10 hover:to-green-500/10 transition-all"
                >
                  <div className="text-3xl mb-4">🌐</div>
                  <h4 className="text-xl font-extrabold text-white mb-3 group-hover:text-emerald-400 transition-colors tracking-tight">{t('lab.create.communityLabel')}</h4>
                  <p className="text-sm text-gray-300/90 mb-5 leading-relaxed">{t('lab.create.communityDesc')}</p>
                  <div className="space-y-2 text-xs text-gray-400/80 mb-5">
                    <p>📥 {t('lab.create.communityInput')}</p>
                    <p>📤 {t('lab.create.communityOutput')}</p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-xl font-extrabold font-mono text-emerald-400 block">${MEME_PRICES.community.toFixed(2)}</span>
                    <span className="text-[11px] text-gray-500 leading-snug italic block">{t('lab.create.communityWhy')}</span>
                  </div>
                </button>

                {/* Community Newspaper Card */}
                <button
                  onClick={() => setCreateCategory('newspaper')}
                  className="group text-left p-7 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5 hover:border-amber-500/40 hover:from-amber-500/10 hover:to-orange-500/10 transition-all"
                >
                  <div className="text-3xl mb-4">{String.fromCodePoint(0x1F4F0)}</div>
                  <h4 className="text-xl font-extrabold text-white mb-3 group-hover:text-amber-400 transition-colors tracking-tight">{t('lab.create.newspaperLabel')}</h4>
                  <p className="text-sm text-gray-300/90 mb-5 leading-relaxed">{t('lab.create.newspaperDesc')}</p>
                  <div className="space-y-2 text-xs text-gray-400/80 mb-5">
                    <p>{String.fromCodePoint(0x1F4E5)} {t('lab.create.newspaperInput')}</p>
                    <p>{String.fromCodePoint(0x1F4E4)} {t('lab.create.newspaperOutput')}</p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-xl font-extrabold font-mono text-amber-400 block">${MEME_PRICES.newspaper.toFixed(2)}</span>
                    <span className="text-[11px] text-gray-500 leading-snug italic block">{t('lab.create.newspaperWhy')}</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2a: News Memes Input (existing flow) ── */}
          {createCategory === 'news' && !createLoading && !createResult && !createError && (
            <div className="max-w-2xl mx-auto space-y-4">
              <button onClick={() => setCreateCategory(null)} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
                {t('lab.create.backToCategories')}
              </button>
              <div className="relative">
                <input
                  type="text"
                  value={createTopic}
                  onChange={e => setCreateTopic(e.target.value)}
                  placeholder={placeholderText}
                  disabled={createLoading}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && createTopic.trim() && !createLoading) {
                      handleCreate(prices?.memeya ? 'MEMEYA' : 'SOL');
                    }
                  }}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-5 py-4 text-white text-base placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all disabled:opacity-50"
                />
                {createTopic.trim() && !createLoading && (
                  <button
                    onClick={() => setCreateTopic('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    x
                  </button>
                )}
              </div>

              {/* Payment buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {!authenticated ? (
                  <button
                    onClick={() => login()}
                    className="px-8 py-3 rounded-xl font-medium text-sm transition-all bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-500/20"
                  >
                    {t('lab.create.connectWallet')}
                  </button>
                ) : (
                  <>
                    {prices?.memeya && (
                      <button onClick={() => handleCreate('MEMEYA')} disabled={!createTopic.trim()} className="group flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20">
                        <span className="text-lg font-bold font-mono">~{prices.memeya.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} $Memeya</span>
                        <span className="text-xs opacity-80 bg-white/20 rounded-full px-2 py-0.5">{Math.round(prices.memeya.discount * 100)}% off</span>
                      </button>
                    )}
                    {prices?.sol && (
                      <button onClick={() => handleCreate('SOL')} disabled={!createTopic.trim()} className="group flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20">
                        <span className="text-lg font-bold font-mono">{prices.sol.amount.toFixed(6)} SOL</span>
                      </button>
                    )}
                    {prices?.usdc && (
                      <button onClick={() => handleCreate('USDC')} disabled={!createTopic.trim()} className="group flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20">
                        <span className="text-lg font-bold font-mono">{prices.usdc.amount.toFixed(2)} USDC</span>
                      </button>
                    )}
                    {!prices && !pricesLoading && <p className="text-gray-500 text-sm text-center">{t('lab.create.priceUnavailable')}</p>}
                    {pricesLoading && <p className="text-gray-500 text-sm text-center animate-pulse">{t('lab.create.loadingPrices')}</p>}
                  </>
                )}
              </div>

              {prices && (
                <div className="text-center space-y-1">
                  <p className="text-xs text-gray-600">{t('lab.create.priceNote', { base: `$${MEME_PRICES[createCategory || 'news'].toFixed(2)}` })}</p>
                  <p className="text-xs text-gray-500">{t('lab.create.ecosystemFund')}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Step 2b: Community Memes Input ── */}
          {createCategory === 'community' && !createLoading && !createResult && !createError && (
            <div className="max-w-2xl mx-auto space-y-4">
              <button onClick={() => setCreateCategory(null)} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
                {t('lab.create.backToCategories')}
              </button>

              {/* X Account */}
              <div>
                <label className="text-xs text-gray-400 block mb-1.5 font-semibold uppercase tracking-wider">{t('lab.create.xAccount')}</label>
                <input
                  type="text"
                  value={communityForm.xAccount}
                  onChange={e => setCommunityForm(f => ({ ...f, xAccount: e.target.value }))}
                  placeholder={t('lab.create.xPlaceholder')}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-5 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-gray-400 block mb-1.5 font-semibold uppercase tracking-wider">{t('lab.create.postDescription')} <span className="text-red-400">*</span></label>
                <textarea
                  rows={3}
                  value={communityForm.description}
                  onChange={e => setCommunityForm(f => ({ ...f, description: e.target.value }))}
                  placeholder={t('lab.create.descPlaceholder')}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-5 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all resize-vertical"
                />
              </div>

              {/* Tone + Style */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-xs text-gray-400 block mb-1.5 font-semibold uppercase tracking-wider">{t('lab.create.tone')}</label>
                  <select
                    value={communityForm.tone}
                    onChange={e => setCommunityForm(f => ({ ...f, tone: e.target.value }))}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all"
                  >
                    <option value="hype">{t('lab.create.toneHype')}</option>
                    <option value="wholesome">{t('lab.create.toneWholesome')}</option>
                    <option value="funny">{t('lab.create.toneFunny')}</option>
                    <option value="flex">{t('lab.create.toneFlex')}</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-400 block mb-1.5 font-semibold uppercase tracking-wider">{t('lab.create.visualStyle')}</label>
                  <select
                    value={communityForm.style}
                    onChange={e => setCommunityForm(f => ({ ...f, style: e.target.value }))}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all"
                  >
                    <option value="meme">{t('lab.create.styleMeme')}</option>
                    <option value="announcement">{t('lab.create.styleAnnouncement')}</option>
                    <option value="comic">{t('lab.create.styleComic')}</option>
                    <option value="infographic">{t('lab.create.styleInfoGraphic')}</option>
                  </select>
                </div>
              </div>

              {/* Payment buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {!authenticated ? (
                  <button
                    onClick={() => login()}
                    className="px-8 py-3 rounded-xl font-medium text-sm transition-all bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-500/20"
                  >
                    {t('lab.create.connectWallet')}
                  </button>
                ) : (
                  <>
                    {prices?.sol && (
                      <button onClick={() => handleCreate('SOL')} disabled={!communityForm.description.trim()} className="group flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20">
                        <span className="text-lg font-bold font-mono">{prices.sol.amount.toFixed(6)} SOL</span>
                      </button>
                    )}
                    {prices?.usdc && (
                      <button onClick={() => handleCreate('USDC')} disabled={!communityForm.description.trim()} className="group flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20">
                        <span className="text-lg font-bold font-mono">{prices.usdc.amount.toFixed(2)} USDC</span>
                      </button>
                    )}
                    {!prices && !pricesLoading && <p className="text-gray-500 text-sm text-center">{t('lab.create.priceUnavailable')}</p>}
                    {pricesLoading && <p className="text-gray-500 text-sm text-center animate-pulse">{t('lab.create.loadingPrices')}</p>}
                  </>
                )}
              </div>

              {prices && (
                <div className="text-center space-y-1">
                  <p className="text-xs text-gray-600">{t('lab.create.priceNote', { base: `$${MEME_PRICES[createCategory || 'news'].toFixed(2)}` })}</p>
                  <p className="text-xs text-gray-500">{t('lab.create.ecosystemFund')}</p>
                </div>
              )}
            </div>
          )}


          {/* ── Step 2c: Community Newspaper Input ── */}
          {createCategory === 'newspaper' && !createLoading && !createResult && !createError && (
            <div className="max-w-2xl mx-auto space-y-4">
              <button onClick={() => setCreateCategory(null)} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
                {t('lab.create.backToCategories')}
              </button>

              {/* X Profile URL */}
              <div>
                <label className="text-xs text-gray-400 block mb-1.5 font-semibold uppercase tracking-wider">{t('lab.create.xProfileUrl')}</label>
                <input
                  type="text"
                  value={newspaperForm.xProfileUrl}
                  onChange={e => setNewspaperForm(f => ({ ...f, xProfileUrl: e.target.value }))}
                  placeholder={t('lab.create.xProfilePlaceholder')}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-5 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all"
                />
              </div>

              {/* News Content */}
              <div>
                <label className="text-xs text-gray-400 block mb-1.5 font-semibold uppercase tracking-wider">{t('lab.create.newsContent')} <span className="text-red-400">*</span></label>
                <textarea
                  rows={3}
                  value={newspaperForm.description}
                  onChange={e => setNewspaperForm(f => ({ ...f, description: e.target.value }))}
                  placeholder={t('lab.create.newsContentPlaceholder')}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-5 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all resize-vertical"
                />
              </div>

              {/* Payment buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {!authenticated ? (
                  <button
                    onClick={() => login()}
                    className="px-8 py-3 rounded-xl font-medium text-sm transition-all bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-500/20"
                  >
                    {t('lab.create.connectWallet')}
                  </button>
                ) : (
                  <>
                    {prices?.sol && (
                      <button onClick={() => handleCreate('SOL')} disabled={!newspaperForm.description.trim()} className="group flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20">
                        <span className="text-lg font-bold font-mono">{prices.sol.amount.toFixed(6)} SOL</span>
                      </button>
                    )}
                    {prices?.usdc && (
                      <button onClick={() => handleCreate('USDC')} disabled={!newspaperForm.description.trim()} className="group flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20">
                        <span className="text-lg font-bold font-mono">{prices.usdc.amount.toFixed(2)} USDC</span>
                      </button>
                    )}
                    {!prices && !pricesLoading && <p className="text-gray-500 text-sm text-center">{t('lab.create.priceUnavailable')}</p>}
                    {pricesLoading && <p className="text-gray-500 text-sm text-center animate-pulse">{t('lab.create.loadingPrices')}</p>}
                  </>
                )}
              </div>

              {prices && (
                <div className="text-center space-y-1">
                  <p className="text-xs text-gray-600">{t('lab.create.priceNote', { base: `$${MEME_PRICES[createCategory || 'news'].toFixed(2)}` })}</p>
                  <p className="text-xs text-gray-500">{t('lab.create.ecosystemFund')}</p>
                </div>
              )}
            </div>
          )}

          {/* Loading state */}
          {createLoading && (
            <div className="max-w-lg mx-auto py-10 space-y-6">
              {/* Time estimate */}
              <p className="text-center text-sm text-gray-400">{t('lab.create.timeEstimate')}</p>

              {/* Progress bar + percentage */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="relative h-3 bg-white/5 rounded-full overflow-hidden flex-1">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${createProgress}%` }}
                    />
                  </div>
                  <span className="text-lg font-bold text-cyan-400 tabular-nums w-12 text-right">{createProgress}%</span>
                </div>
              </div>

              {/* Memeya chat bubble */}
              <div className="flex items-start gap-4">
                <img src="/images/memeya-avatar.png" alt="Memeya" className="w-10 h-10 rounded-full flex-shrink-0 mt-0.5" />
                <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-5 py-4 flex-1">
                  <p className="text-gray-200 text-base leading-relaxed">{createStatus}</p>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {createError && (
            <div className="max-w-md mx-auto bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
              <p className="text-red-400 text-sm">{createError}</p>
              <button
                onClick={() => setCreateError('')}
                className="mt-2 text-xs text-gray-400 hover:text-white transition-colors"
              >
                {t('lab.create.tryAnother')}
              </button>
              <button
                onClick={() => { setCreateError(''); setCreateCategory(null); }}
                className="mt-2 ml-3 text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                {t('lab.create.backToCategories')}
              </button>
            </div>
          )}

          {/* Result */}
          {createResult && (
            <div className="max-w-lg mx-auto space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                {createResult.imageUrl && (
                  <img
                    src={createResult.imageUrl}
                    alt={createResult.title}
                    className="w-full"
                  />
                )}
                <div className="p-4 space-y-2">
                  <h3 className="text-white font-extrabold text-xl tracking-tight">{createResult.title}</h3>
                  {createResult.description && (
                    <p className="text-gray-400 text-sm leading-relaxed">{createResult.description}</p>
                  )}
                  {createResult.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {createResult.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-white/5 text-gray-300 border border-white/10">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Suggested Tweet (community memes) */}
              {createResult.suggestedTweet && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 space-y-2">
                  <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">{t('lab.create.suggestedTweet')}</p>
                  <p className="text-gray-200 text-sm whitespace-pre-wrap">{createResult.suggestedTweet}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(createResult.suggestedTweet);
                      setTweetCopied(true);
                      setTimeout(() => setTweetCopied(false), 2000);
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    {tweetCopied ? t('lab.create.copied') : t('lab.create.copyTweet')}
                  </button>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    const url = createResult.id
                      ? `https://aimemeforge.io/meme/${createResult.id}`
                      : window.location.href;
                    const text = createResult.suggestedTweet
                      ? `${createResult.suggestedTweet}\n\n${url}`
                      : `${createResult.title} — made with @MemeForgeAI`;
                    const shareUrl = createResult.suggestedTweet
                      ? `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`
                      : `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
                    window.open(shareUrl, '_blank');
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all"
                >
                  {t('lab.create.share')}
                </button>
                <button
                  onClick={() => { setCreateResult(null); setTweetCopied(false); }}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-all"
                >
                  {t('lab.create.tryAnother')}
                </button>
              </div>
            </div>
          )}

          {/* Featured memes showcase — show on category selection screen */}
          {!createCategory && !createLoading && !createResult && !createError && Array.isArray(featuredMeme) && featuredMeme.length > 0 && (
            <div className="max-w-4xl mx-auto">
              <p className="text-center text-xs text-gray-500 mb-3">{t('lab.create.featured')}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {featuredMeme.map((meme, i) => (
                  <MemeCard
                    key={meme.id || i}
                    meme={meme}
                    imageFit="object-cover"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MY MEMES TAB — browse past creations
          ═══════════════════════════════════════════════════════ */}
      {activePanel === 'myMemes' && (
        <div className="space-y-6">
          {/* Not logged in */}
          {!authenticated ? (
            <div className="text-center py-16 space-y-4">
              <div className="text-4xl">🔒</div>
              <p className="text-gray-400">{t('lab.myMemes.connectWallet')}</p>
              <button
                onClick={() => login()}
                className="px-6 py-2.5 rounded-lg font-medium text-sm bg-indigo-600 hover:bg-indigo-500 text-white transition-all"
              >
                {t('lab.create.connectWallet')}
              </button>
            </div>
          ) : myMemesLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-400 text-sm">{t('lab.myMemes.loading')}</p>
            </div>
          ) : selectedMeme ? (
            /* ── Expanded meme detail ── */
            <div className="max-w-lg mx-auto space-y-4">
              <button
                onClick={() => setSelectedMeme(null)}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                ← {t('lab.myMemes.backToGrid')}
              </button>
              <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                {selectedMeme.imageUrl && (
                  <img
                    src={selectedMeme.imageUrl}
                    alt={selectedMeme.title}
                    className="w-full"
                  />
                )}
                <div className="p-4 space-y-2">
                  <h3 className="text-white font-bold text-lg">{selectedMeme.title}</h3>
                  {selectedMeme.description && (
                    <p className="text-gray-400 text-sm">{selectedMeme.description}</p>
                  )}
                  {selectedMeme.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedMeme.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-white/5 text-gray-300 border border-white/10">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => {
                    const url = `https://aimemeforge.io/meme/${selectedMeme.id}`;
                    const text = `${selectedMeme.title} — made with @MemeForgeAI`;
                    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all"
                >
                  {t('lab.myMemes.share')}
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://aimemeforge.io/meme/${selectedMeme.id}`);
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 2000);
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all"
                >
                  {linkCopied ? t('lab.myMemes.linkCopied') : t('lab.myMemes.copyLink')}
                </button>
                <button
                  disabled={deleting}
                  onClick={async () => {
                    if (!window.confirm(t('lab.myMemes.deleteConfirm'))) return;
                    setDeleting(true);
                    try {
                      const res = await fetch(`${API_BASE_URL}/api/memes/${selectedMeme.id}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ wallet: walletAddress }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        setMyMemes(prev => prev.filter(m => m.id !== selectedMeme.id));
                        setSelectedMeme(null);
                        setMyMemesLoaded(false);
                      }
                    } catch (e) {
                      console.error('Delete meme error:', e);
                    } finally {
                      setDeleting(false);
                    }
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all disabled:opacity-50"
                >
                  {t('lab.myMemes.delete')}
                </button>
              </div>
            </div>
          ) : myMemes.length === 0 ? (
            /* ── Empty state ── */
            <div className="text-center py-16 space-y-3">
              <div className="text-4xl">🎨</div>
              <p className="text-gray-300 font-medium">{t('lab.myMemes.empty')}</p>
              <p className="text-gray-500 text-sm">{t('lab.myMemes.emptyHint')}</p>
              <button
                onClick={() => setActivePanel('create')}
                className="mt-2 px-6 py-2.5 rounded-lg font-medium text-sm bg-indigo-600 hover:bg-indigo-500 text-white transition-all"
              >
                {t('lab.create.tabCreate')}
              </button>
            </div>
          ) : (
            /* ── Meme grid ── */
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-4xl mx-auto">
              {myMemes.map((meme) => (
                <MemeCard
                  key={meme.id}
                  meme={meme}
                  onClick={() => setSelectedMeme(meme)}
                  hoverColor="indigo"
                  imageFit="object-cover"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          RATE TAB (private mode only)
          ═══════════════════════════════════════════════════════ */}
      {activePanel === 'rate' && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">{t('lab.rate.title')}</h3>
          <p className="text-gray-400 text-sm">{t('lab.rate.desc')}</p>

          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-300 mb-1">{t('lab.rate.imageUrl')}</label>
              <input
                type="url"
                value={rateImageUrl}
                onChange={e => setRateImageUrl(e.target.value)}
                placeholder="https://example.com/meme.png"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {rateImageUrl.trim() && (
              <div className="flex justify-center">
                <img
                  src={rateImageUrl.trim()}
                  alt="Meme preview"
                  className="max-w-xs max-h-64 rounded-lg border border-white/10 object-contain"
                  onError={e => { e.target.style.display = 'none'; }}
                  onLoad={e => { e.target.style.display = 'block'; }}
                />
              </div>
            )}

            <button
              onClick={handleRate}
              disabled={rateLoading || !rateImageUrl.trim()}
              className="w-full py-2 rounded-lg font-medium text-sm transition-all bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {rateLoading ? t('lab.rate.analyzing') : t('lab.rate.submit')}
            </button>
            {rateLoading && (
              <p className="text-xs text-gray-500 text-center">{t('lab.rate.estimatedTime')}</p>
            )}
          </div>

          {rateResult && (
            <div className="mt-4 space-y-3">
              {rateResult.success ? (
                <>
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold text-white">{rateResult.score}</div>
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${rateResult.pass ? 'text-green-400 bg-green-400/10 border-green-400/30' : 'text-red-400 bg-red-400/10 border-red-400/30'}`}>
                        {rateResult.pass ? 'PASS' : 'FAIL'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${GRADE_COLORS[rateResult.grade] || GRADE_COLORS['C']}`}>
                        {t('lab.rate.grade')}: {rateResult.grade}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        rateResult.score >= 82 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                        rateResult.score >= 65 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                        'bg-gradient-to-r from-red-500 to-red-400'
                      }`}
                      style={{ width: `${rateResult.score}%` }}
                    />
                  </div>

                  {rateResult.suggestions?.length > 0 && (
                    <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-lg p-3">
                      <p className="text-xs text-yellow-400 font-medium mb-1">{t('lab.rate.suggestions')}</p>
                      <ul className="text-xs text-gray-300 space-y-1">
                        {rateResult.suggestions.map((s, i) => <li key={i}>- {s}</li>)}
                      </ul>
                    </div>
                  )}
                </>
              ) : rateResult.is402 ? (
                <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-lg p-4 text-center">
                  <p className="text-yellow-400 font-medium text-sm mb-1">402 Payment Required</p>
                  <p className="text-gray-400 text-xs">{rateResult.error}</p>
                </div>
              ) : (
                <div className="text-red-400 text-sm">{rateResult.error}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          GENERATE TAB (private mode only)
          ═══════════════════════════════════════════════════════ */}
      {activePanel === 'generate' && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">{t('lab.generate.title')}</h3>
          <p className="text-gray-400 text-sm">{t('lab.generate.desc')}</p>

          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-300 mb-1">{t('lab.generate.topic')} *</label>
              <input
                type="text"
                value={genForm.topic}
                onChange={e => setGenForm(f => ({ ...f, topic: e.target.value }))}
                placeholder="e.g. Bitcoin hits $200K"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">{t('lab.generate.template')}</label>
                <select
                  value={genForm.templateId}
                  onChange={e => setGenForm(f => ({ ...f, templateId: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Auto</option>
                  {catalogs.templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">{t('lab.generate.strategy')}</label>
                <select
                  value={genForm.strategyId}
                  onChange={e => setGenForm(f => ({ ...f, strategyId: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Auto</option>
                  {catalogs.strategies.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">{t('lab.generate.narrative')}</label>
                <select
                  value={genForm.narrativeId}
                  onChange={e => setGenForm(f => ({ ...f, narrativeId: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Auto</option>
                  {catalogs.narratives.map(n => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">{t('lab.generate.artStyle')}</label>
                <select
                  value={genForm.artStyleId}
                  onChange={e => setGenForm(f => ({ ...f, artStyleId: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Auto</option>
                  {catalogs.artStyles.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">{t('lab.generate.mode')}</label>
              <div className="flex gap-2">
                {['auto', 'template', 'original'].map(m => (
                  <button
                    key={m}
                    onClick={() => setGenForm(f => ({ ...f, mode: m }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      genForm.mode === m ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {t(`lab.generate.modes.${m}`)}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={genLoading || !genForm.topic.trim()}
              className="w-full py-2 rounded-lg font-medium text-sm transition-all bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {genLoading ? t('lab.generate.generating') : t('lab.generate.submit')}
            </button>
            {genLoading && (
              <p className="text-xs text-gray-500 text-center">{t('lab.generate.estimatedTime')}</p>
            )}
          </div>

          {genResult && (
            <div className="mt-4">
              {genResult.success ? (
                <div className="space-y-3">
                  {genResult.meme?.imageUrl && (
                    <img
                      src={genResult.meme.imageUrl}
                      alt={genResult.meme.title}
                      className="w-full max-w-md mx-auto rounded-xl border border-white/10"
                    />
                  )}
                  <div>
                    <h4 className="text-white font-bold">{genResult.meme?.title}</h4>
                    <p className="text-gray-400 text-sm mt-1">{genResult.meme?.description}</p>
                  </div>
                  {genResult.meme?.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {genResult.meme.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-white/5 text-gray-300 border border-white/10">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-xs text-gray-400 space-y-1">
                    <p><span className="text-gray-300">{t('lab.generate.result.quality')}:</span> {genResult.meme?.metadata?.qualityScore}/100</p>
                    <p><span className="text-gray-300">{t('lab.generate.result.model')}:</span> {genResult.meme?.metadata?.aiModel}</p>
                    <p><span className="text-gray-300">{t('lab.generate.result.style')}:</span> {genResult.meme?.metadata?.artStyleName}</p>
                    <p><span className="text-gray-300">{t('lab.generate.result.strategy')}:</span> {genResult.meme?.metadata?.strategyName}</p>
                    <p><span className="text-gray-300">{t('lab.generate.result.narrative')}:</span> {genResult.meme?.metadata?.narrativeName}</p>
                    {genResult.meme?.metadata?.templateName && (
                      <p><span className="text-gray-300">{t('lab.generate.result.template')}:</span> {genResult.meme.metadata.templateName}</p>
                    )}
                    <p><span className="text-gray-300">{t('lab.generate.result.caption')}:</span> {genResult.meme?.metadata?.memeIdea?.caption}</p>
                    <p><span className="text-gray-300">{t('lab.generate.result.twist')}:</span> {genResult.meme?.metadata?.memeIdea?.twist}</p>
                  </div>
                </div>
              ) : genResult.is402 ? (
                <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-lg p-4 text-center">
                  <p className="text-yellow-400 font-medium text-sm mb-1">402 Payment Required</p>
                  <p className="text-gray-400 text-xs">{genResult.error}</p>
                </div>
              ) : (
                <div className="text-red-400 text-sm">{genResult.error}: {genResult.message}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          CATALOG TAB (private mode only)
          ═══════════════════════════════════════════════════════ */}
      {activePanel === 'catalog' && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">{t('lab.catalog.title')}</h3>

          <div className="flex gap-1 flex-wrap">
            {['templates', 'strategies', 'narratives', 'artStyles', 'recipes'].map(tab => (
              <button
                key={tab}
                onClick={() => setCatalogTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  catalogTab === tab ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {t(`lab.catalog.tabs.${tab}`)}
              </button>
            ))}
          </div>

          {catalogLoading ? (
            <p className="text-gray-500 text-sm">{t('common.loading')}</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {catalogTab === 'templates' && catalogs.templates.map(item => (
                <div key={item.id} className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <p className="text-white font-medium text-sm">{item.name}</p>
                  <p className="text-gray-500 text-xs mt-0.5">ID: {item.id}</p>
                  <p className="text-gray-400 text-xs mt-1">Archetype: {item.archetype} | Format: {item.caption_format}</p>
                  {item.suitability_tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.suitability_tags.slice(0, 5).map((tag, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded text-[11px] bg-blue-500/10 text-blue-400 border border-blue-500/20">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {catalogTab === 'strategies' && catalogs.strategies.map(item => (
                <div key={item.id} className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <p className="text-white font-medium text-sm">{item.name}</p>
                  <p className="text-gray-500 text-xs mt-0.5">ID: {item.id}</p>
                  <p className="text-gray-400 text-xs mt-1">{item.definition}</p>
                  {item.punchline_patterns?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.punchline_patterns.map((p, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded text-[11px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">{p}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {catalogTab === 'narratives' && catalogs.narratives.map(item => (
                <div key={item.id} className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <p className="text-white font-medium text-sm">{item.name}</p>
                  <p className="text-gray-500 text-xs mt-0.5">ID: {item.id}</p>
                  <p className="text-gray-400 text-xs mt-1">{item.psychology}</p>
                  <p className="text-xs mt-1"><span className="text-purple-400">{item.emotion}</span> | <span className="text-gray-400">{item.trader_role}</span></p>
                </div>
              ))}

              {catalogTab === 'artStyles' && catalogs.artStyles.map(item => (
                <div key={item.id} className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <p className="text-white font-medium text-sm">{item.name}</p>
                  <p className="text-gray-500 text-xs mt-0.5">ID: {item.id}</p>
                </div>
              ))}

              {catalogTab === 'recipes' && catalogs.topRecipes.length === 0 && (
                <p className="text-gray-500 text-sm col-span-2">{recipesLoaded ? 'No recipes found' : t('common.loading')}</p>
              )}
              {catalogTab === 'recipes' && catalogs.topRecipes.slice(0, 20).map(item => (
                <div key={item.id} className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <p className="text-white font-medium text-sm">{item.title}</p>
                    <span className="text-xs text-green-400 font-mono">{item.votes}v</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1 text-[11px]">
                    {item.templateId && <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">{item.templateId}</span>}
                    {item.strategyId && <span className="px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">{item.strategyId}</span>}
                    {item.narrativeId && <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">{item.narrativeId}</span>}
                    {item.artStyleId && <span className="px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20">{item.artStyleId}</span>}
                  </div>
                  <p className="text-gray-500 text-xs mt-1">Q: {item.qualityScore}/100 | {item.generationMode}{item.isWinner ? ' | Winner' : ''}{item.finalRarity ? ` | ${item.finalRarity}` : ''}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          API TAB (both modes)
          ═══════════════════════════════════════════════════════ */}
      {activePanel === 'api' && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white">{t('lab.api.title')}</h3>
            <p className="text-gray-400 text-sm mt-1">{t('lab.api.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {['rate', 'generate', 'community', 'newspaper', 'catalog'].map(svc => (
              <div key={svc} className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2">
                <p className="text-white font-medium text-sm">{t(`lab.api.${svc}.name`)}</p>
                <p className="text-green-400 text-2xl font-bold">{MEME_PRICES[svc] ? `$${MEME_PRICES[svc].toFixed(2)}` : t(`lab.api.${svc}.price`)}</p>
                <p className="text-gray-500 text-xs">{svc === 'catalog' ? '\u2014' : 'USDC on Base & Solana'}</p>
                {t(`lab.api.${svc}.sla`) !== '\u2014' && (
                  <p className="text-gray-400 text-xs">SLA: {t(`lab.api.${svc}.sla`)}</p>
                )}
                <p className="text-gray-400 text-xs">{t(`lab.api.${svc}.desc`)}</p>
              </div>
            ))}
          </div>

          <div className="text-center space-y-2">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-gray-300">
              {t('lab.api.protocol')}
            </span>
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
              <a href="https://app.virtuals.io" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition-colors">
                Virtuals Protocol
              </a>
              <span>·</span>
              <a href="https://dexter.cash" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition-colors">
                Dexter x402 Facilitator
              </a>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-white">{t('lab.api.quickStart')}</h4>
              <div className="flex items-center gap-2">
                {codeTab !== 'catalog' && (
                  <div className="flex bg-white/5 border border-white/10 rounded overflow-hidden">
                    {['solana', 'base'].map(chain => (
                      <button
                        key={chain}
                        onClick={() => setChainTab(chain)}
                        className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                          chainTab === chain
                            ? 'bg-white/10 text-white'
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        {chain === 'solana' ? 'Solana' : 'Base'}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => {
                    const snippet = codeTab === 'catalog'
                      ? CODE_SNIPPETS.catalog(API_BASE_URL)
                      : CODE_SNIPPETS[codeTab][chainTab](API_BASE_URL);
                    navigator.clipboard.writeText(snippet);
                    setCodeCopied(true);
                    setTimeout(() => setCodeCopied(false), 2000);
                  }}
                  className="px-3 py-1 rounded text-xs font-medium bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all"
                >
                  {codeCopied ? t('common.copied') : t('lab.api.copyCode')}
                </button>
              </div>
            </div>
            <div className="flex gap-1 mb-1">
              {['rate', 'generate', 'community', 'newspaper', 'catalog'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setCodeTab(tab)}
                  className={`px-3 py-1.5 rounded-t text-xs font-medium transition-colors ${
                    codeTab === tab
                      ? 'bg-[#0D1117] text-white border border-white/10 border-b-transparent'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {t(`lab.api.${tab}.name`)}
                </button>
              ))}
            </div>
            <pre className="bg-[#0D1117] border border-white/10 rounded-lg rounded-tl-none p-4 overflow-x-auto text-xs font-mono text-gray-300 leading-relaxed">
              {codeTab === 'catalog'
                ? CODE_SNIPPETS.catalog(API_BASE_URL)
                : CODE_SNIPPETS[codeTab][chainTab](API_BASE_URL)}
            </pre>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-white">{t('lab.api.baseUrl')}</h4>
            <div className="flex items-center gap-2 bg-[#0D1117] border border-white/10 rounded-lg px-4 py-3">
              <code className="text-xs font-mono text-gray-300 flex-1 break-all">{API_BASE_URL}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(API_BASE_URL);
                  setUrlCopied(true);
                  setTimeout(() => setUrlCopied(false), 2000);
                }}
                className="px-3 py-1 rounded text-xs font-medium bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all shrink-0"
              >
                {urlCopied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MCP TAB — Claude Code / AI Agent integration guide
          ═══════════════════════════════════════════════════════ */}
      {activePanel === 'mcp' && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white">MCP Server</h3>
            <p className="text-gray-400 text-sm mt-1">Use meme services directly from Claude Code, Cursor, or any MCP client</p>
          </div>

          {/* Install */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">1. Install</h4>
            <div className="bg-black/40 rounded-lg p-4 font-mono text-sm text-green-400 overflow-x-auto">
              claude mcp add aimemeforge -- npx -y @aimemeforge/mcp-server
            </div>
            <p className="text-gray-400 text-xs">Works with Claude Code, Cursor, and any MCP-compatible AI agent.</p>
          </div>

          {/* Create Wallet */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">2. Create Wallet</h4>
            <p className="text-gray-400 text-sm">Inside Claude Code, say:</p>
            <div className="bg-black/40 rounded-lg p-4 font-mono text-sm text-cyan-400">
              "create a wallet for meme services"
            </div>
            <p className="text-gray-400 text-xs">Generates a Solana wallet instantly. Gas is FREE (Dexter sponsored). You only need USDC.</p>
          </div>

          {/* Fund */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">3. Fund with USDC</h4>
            <p className="text-gray-400 text-sm">Send USDC to the wallet address shown. $0.50 is enough for 5 memes.</p>
            <div className="text-gray-500 text-xs space-y-1">
              <p>Coinbase / Binance / Phantom &rarr; Send USDC &rarr; Solana network &rarr; paste address</p>
            </div>
          </div>

          {/* Use */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">4. Generate Memes</h4>
            <p className="text-gray-400 text-sm">Just tell your AI agent what you want:</p>
            <div className="bg-black/40 rounded-lg p-4 font-mono text-sm text-yellow-400 space-y-2">
              <p>"generate a meme about Bitcoin hitting $150k"</p>
              <p>"rate this meme: https://example.com/meme.png"</p>
              <p>"create a community meme for our token launch"</p>
            </div>
            <p className="text-gray-400 text-xs">Payment is automatic via x402. No API keys needed.</p>
          </div>

          {/* Tools & Pricing */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Available Tools</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-left text-xs uppercase tracking-wider border-b border-white/10">
                    <th className="pb-2 pr-4">Tool</th>
                    <th className="pb-2 pr-4">Cost</th>
                    <th className="pb-2">Description</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  <tr className="border-b border-white/5"><td className="py-2 pr-4 font-mono text-xs text-green-400">create_wallet</td><td className="pr-4 text-green-400">FREE</td><td>Generate Solana wallet</td></tr>
                  <tr className="border-b border-white/5"><td className="py-2 pr-4 font-mono text-xs text-green-400">check_balance</td><td className="pr-4 text-green-400">FREE</td><td>Check USDC balance</td></tr>
                  <tr className="border-b border-white/5"><td className="py-2 pr-4 font-mono text-xs text-green-400">health_check</td><td className="pr-4 text-green-400">FREE</td><td>Service status</td></tr>
                  <tr className="border-b border-white/5"><td className="py-2 pr-4 font-mono text-xs text-cyan-400">generate_meme</td><td className="pr-4">$0.10</td><td>AI meme from any topic</td></tr>
                  <tr className="border-b border-white/5"><td className="py-2 pr-4 font-mono text-xs text-cyan-400">rate_meme</td><td className="pr-4">$0.05</td><td>AI quality score + suggestions</td></tr>
                  <tr className="border-b border-white/5"><td className="py-2 pr-4 font-mono text-xs text-cyan-400">generate_community_meme</td><td className="pr-4">$0.15</td><td>Announcement meme + tweet</td></tr>
                  <tr className="border-b border-white/5"><td className="py-2 pr-4 font-mono text-xs text-cyan-400">generate_newspaper</td><td className="pr-4">$0.15</td><td>Newspaper-style banner</td></tr>
                  <tr><td className="py-2 pr-4 font-mono text-xs text-purple-400">withdraw</td><td className="pr-4 text-green-400">FREE</td><td>Send USDC to another address</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* npm link */}
          <div className="text-center">
            <a href="https://www.npmjs.com/package/@aimemeforge/mcp-server" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors">
              npm: @aimemeforge/mcp-server &rarr;
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabTab;
