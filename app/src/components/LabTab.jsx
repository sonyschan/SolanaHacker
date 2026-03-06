import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
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
} from '@solana/spl-token';
import bs58 from 'bs58';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://memeforge-api-836651762884.asia-southeast1.run.app';

const MEMEYA_WALLET = new PublicKey('4BqywEbjMf4APFBw1spPFr11q21Uu5A1fHpCRM2zSbMP');
const MEMEYA_MINT = new PublicKey('mPj8dgqLDciVX27vU5efHiodbQhsgK43gGhjQrBpump');
const MEMEYA_DECIMALS = 6;

const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';

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
  rate: (base) => `npm install @x402/fetch @x402/evm viem

import { x402Client, wrapFetchWithPayment } from '@x402/fetch';
import { registerExactEvmScheme } from '@x402/evm/exact/client';
import { privateKeyToAccount } from 'viem/accounts';

const client = new x402Client();
const account = privateKeyToAccount('0x...');
registerExactEvmScheme(client, { signer: account });
const fetchPaid = wrapFetchWithPayment(fetch, client);

// Rate a meme — $0.05 USDC
const res = await fetchPaid('${base}/api/memes/rate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageUrl: 'https://example.com/meme.png'
  }),
});
const { score, grade, pass, suggestions } = await res.json();`,

  generate: (base) => `npm install @x402/fetch @x402/evm viem

import { x402Client, wrapFetchWithPayment } from '@x402/fetch';
import { registerExactEvmScheme } from '@x402/evm/exact/client';
import { privateKeyToAccount } from 'viem/accounts';

const client = new x402Client();
const account = privateKeyToAccount('0x...');
registerExactEvmScheme(client, { signer: account });
const fetchPaid = wrapFetchWithPayment(fetch, client);

// Generate a custom meme — $0.10 USDC
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

const GENERATION_MESSAGES = [
  'Analyzing topic...',
  'Crafting comedy architecture...',
  'Selecting art style...',
  'Generating image...',
  'Almost there...',
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
  const [createTopic, setCreateTopic] = useState('');
  const [prices, setPrices] = useState(null);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [headlines, setHeadlines] = useState([]);
  const [headlineIdx, setHeadlineIdx] = useState(0);
  const [createLoading, setCreateLoading] = useState(false);
  const [createStatus, setCreateStatus] = useState('');
  const [createResult, setCreateResult] = useState(null);
  const [createError, setCreateError] = useState('');
  const [featuredMeme, setFeaturedMeme] = useState(null);

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
  const [recipesLoaded, setRecipesLoaded] = useState(false);

  const labHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'x-api-key': apiKey || '',
  }), [apiKey]);

  // ── Fetch prices (Create tab) ────────────────────────────
  useEffect(() => {
    if (!publicMode) return;
    setPricesLoading(true);
    fetch(`${API_BASE_URL}/api/memes/generate-price`)
      .then(r => r.json())
      .then(data => { if (data.success) setPrices(data); })
      .catch(() => {})
      .finally(() => setPricesLoading(false));
  }, [publicMode]);

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

  // ── Fetch featured memes (top recent memes) ──────────────
  useEffect(() => {
    if (!publicMode) return;
    fetch(`${API_BASE_URL}/api/memes/hall-of-memes?days=7&limit=6`)
      .then(r => r.json())
      .then(data => {
        if (data.memes?.length) setFeaturedMeme(data.memes);
      })
      .catch(() => {});
  }, [publicMode]);

  // ── Solana payment + generation ───────────────────────────
  const handleCreate = async (paymentToken) => {
    if (!createTopic.trim()) return;
    if (!authenticated) { login(); return; }

    setCreateLoading(true);
    setCreateError('');
    setCreateResult(null);
    setCreateStatus(GENERATION_MESSAGES[0]);

    // Rotate status messages
    let msgIdx = 0;
    const statusTimer = setInterval(() => {
      msgIdx = Math.min(msgIdx + 1, GENERATION_MESSAGES.length - 1);
      setCreateStatus(GENERATION_MESSAGES[msgIdx]);
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
      } else {
        // $Memeya SPL token transfer
        const rawAmount = BigInt(Math.ceil(prices.memeya.amount * 10 ** MEMEYA_DECIMALS));
        const fromAta = getAssociatedTokenAddressSync(MEMEYA_MINT, fromPubkey);
        const toAta = getAssociatedTokenAddressSync(MEMEYA_MINT, MEMEYA_WALLET, true);

        tx = new Transaction();

        // Ensure destination ATA exists (idempotent — no-op if already exists)
        tx.add(createAssociatedTokenAccountIdempotentInstruction(fromPubkey, toAta, MEMEYA_WALLET, MEMEYA_MINT));

        tx.add(createTransferCheckedInstruction(
          fromAta,
          MEMEYA_MINT,
          toAta,
          fromPubkey,
          rawAmount,
          MEMEYA_DECIMALS,
        ));
      }

      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      tx.recentBlockhash = blockhash;
      tx.feePayer = fromPubkey;

      // 3. Serialize and sign+send via Privy SDK
      //    Privy's signAndSendTransaction expects { transaction: Uint8Array, wallet, chain }
      //    Return shape varies: { hash: string } (base58) or { signature: Uint8Array }
      setCreateStatus('Waiting for wallet signature...');
      const txBytes = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
      const result = await signAndSendTransaction({
        transaction: txBytes,
        wallet: solWallet,
        chain: 'solana:mainnet',
      });
      // Handle both return shapes: hash (base58 string) or signature (raw bytes)
      const signature = typeof result.hash === 'string'
        ? result.hash
        : result.signature
          ? bs58.encode(result.signature)
          : null;
      if (!signature) throw new Error('Failed to get transaction signature from wallet');

      // 4. Send to backend for verification + generation
      setCreateStatus(GENERATION_MESSAGES[1]);
      const res = await fetch(`${API_BASE_URL}/api/memes/generate-solana`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: createTopic.trim(),
          txSignature: signature,
          paymentToken,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Generation failed');
      }

      setCreateResult(data.meme);
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
    { id: 'api', label: t('lab.panels.api') },
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
        <h2 className="text-2xl font-bold text-white">
          {publicMode ? t('lab.create.title') : t('lab.title')}
        </h2>
        <p className="text-gray-400 text-sm mt-1">
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
          CREATE TAB — Google-search-style meme generator
          ═══════════════════════════════════════════════════════ */}
      {activePanel === 'create' && (
        <div className="space-y-8">
          {/* Search-style input area */}
          <div className="max-w-2xl mx-auto space-y-4">
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

            {/* Payment buttons or Connect Wallet */}
            {!createLoading && !createResult && (
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
                    {/* $Memeya button */}
                    {prices?.memeya && (
                      <button
                        onClick={() => handleCreate('MEMEYA')}
                        disabled={!createTopic.trim() || createLoading}
                        className="group flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
                      >
                        <span className="text-lg">~{prices.memeya.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} $Memeya</span>
                        <span className="text-xs opacity-80 bg-white/20 rounded-full px-2 py-0.5">
                          {Math.round(prices.memeya.discount * 100)}% off
                        </span>
                      </button>
                    )}

                    {/* SOL button */}
                    {prices?.sol && (
                      <button
                        onClick={() => handleCreate('SOL')}
                        disabled={!createTopic.trim() || createLoading}
                        className="group flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
                      >
                        <span className="text-lg">{prices.sol.amount.toFixed(6)} SOL</span>
                      </button>
                    )}

                    {!prices && !pricesLoading && (
                      <p className="text-gray-500 text-sm text-center">{t('lab.create.priceUnavailable')}</p>
                    )}
                    {pricesLoading && (
                      <p className="text-gray-500 text-sm text-center animate-pulse">{t('lab.create.loadingPrices')}</p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Price info */}
            {prices && !createLoading && !createResult && (
              <div className="text-center space-y-1">
                <p className="text-xs text-gray-600">
                  {t('lab.create.priceNote', { base: '$0.10' })}
                </p>
                <p className="text-xs text-gray-500">
                  {t('lab.create.ecosystemFund')}
                </p>
              </div>
            )}
          </div>

          {/* Loading state */}
          {createLoading && (
            <div className="max-w-md mx-auto text-center space-y-4 py-8">
              <div className="inline-block w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
              <p className="text-white font-medium">{t('lab.create.generating')}</p>
              <p className="text-gray-400 text-sm animate-pulse">{createStatus}</p>
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
                  <h3 className="text-white font-bold text-lg">{createResult.title}</h3>
                  {createResult.description && (
                    <p className="text-gray-400 text-sm">{createResult.description}</p>
                  )}
                  {createResult.metadata?.qualityScore && (
                    <p className="text-xs text-gray-500">
                      {t('lab.create.quality')}: {createResult.metadata.qualityScore}/100
                    </p>
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

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    const url = createResult.imageUrl || window.location.href;
                    const text = `${createResult.title} — made with @MemeForgeAI`;
                    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all"
                >
                  {t('lab.create.share')}
                </button>
                <button
                  onClick={() => { setCreateResult(null); setCreateTopic(''); }}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-all"
                >
                  {t('lab.create.tryAnother')}
                </button>
              </div>
            </div>
          )}

          {/* Featured memes showcase */}
          {!createLoading && !createResult && Array.isArray(featuredMeme) && featuredMeme.length > 0 && (
            <div className="max-w-4xl mx-auto">
              <p className="text-center text-xs text-gray-500 mb-3">{t('lab.create.featured')}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {featuredMeme.map((meme, i) => (
                  <div key={meme.id || i} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    {meme.imageUrl && (
                      <img
                        src={meme.imageUrl}
                        alt={meme.title}
                        className="w-full aspect-square object-cover"
                      />
                    )}
                    <div className="p-2">
                      <p className="text-white text-xs font-medium truncate">{meme.title}</p>
                    </div>
                  </div>
                ))}
              </div>
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
                        <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20">{tag}</span>
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
                        <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">{p}</span>
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
                  <div className="flex flex-wrap gap-1 mt-1 text-[10px]">
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {['rate', 'generate', 'catalog'].map(svc => (
              <div key={svc} className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2">
                <p className="text-white font-medium text-sm">{t(`lab.api.${svc}.name`)}</p>
                <p className="text-green-400 text-2xl font-bold">{t(`lab.api.${svc}.price`)}</p>
                <p className="text-gray-500 text-xs">USDC on Base</p>
                {t(`lab.api.${svc}.sla`) !== '\u2014' && (
                  <p className="text-gray-400 text-xs">SLA: {t(`lab.api.${svc}.sla`)}</p>
                )}
                <p className="text-gray-400 text-xs">{t(`lab.api.${svc}.desc`)}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-gray-300">
              {t('lab.api.protocol')}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-white">{t('lab.api.quickStart')}</h4>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(CODE_SNIPPETS[codeTab](API_BASE_URL));
                  setCodeCopied(true);
                  setTimeout(() => setCodeCopied(false), 2000);
                }}
                className="px-3 py-1 rounded text-xs font-medium bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all"
              >
                {codeCopied ? t('common.copied') : t('lab.api.copyCode')}
              </button>
            </div>
            <div className="flex gap-1 mb-1">
              {['rate', 'generate', 'catalog'].map(tab => (
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
              {CODE_SNIPPETS[codeTab](API_BASE_URL)}
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
    </div>
  );
};

export default LabTab;
