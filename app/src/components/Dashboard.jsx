import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { getMemeyaBalance, formatTokenAmount } from '../services/solanaService';
import ForgeTab from './ForgeTab';
import MemeModal from './MemeModal';
import GalleryTab from './GalleryTab';
import LanguageSwitcher from './LanguageSwitcher';
import ReferralTab from './ReferralTab';
import WorkshopTab from './WorkshopTab';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://memeforge-api-836651762884.asia-southeast1.run.app';

const Dashboard = ({
  userTickets,
  votingStreak,
  lotteryOptIn,
  setLotteryOptIn,
  nftWins = [],
  onDisconnectWallet,
  setUserTickets,
  setVotingStreak,
  walletAddress,
  initialTab
}) => {
  const { t, i18n } = useTranslation();
  const { logout, walletName, shortAddress, hasEmbeddedWallet, exportWallet } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab || 'workshop');
  const [modalMeme, setModalMeme] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [winMemes, setWinMemes] = useState({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showStreakInfo, setShowStreakInfo] = useState(false);
  const [copied, setCopied] = useState(false);
  const [memeyaBalance, setMemeyaBalance] = useState(null);
  const [memeyaBonus, setMemeyaBonus] = useState(0);
  const [rewardWalletUsdc, setRewardWalletUsdc] = useState(null);
  const [rewardEnabled, setRewardEnabled] = useState(null);
  const menuRef = useRef(null);
  const settingsRef = useRef(null);

  const tabs = [
    { id: 'workshop', label: t('dashboard.tabs.workshop'), icon: '\u2692\uFE0F', desc: t('dashboard.tabs.workshopDesc') },
    { id: 'forge', label: t('dashboard.tabs.forge'), icon: '\uD83E\uDD16', desc: t('dashboard.tabs.forgeDesc') },
    { id: 'gallery', label: t('dashboard.tabs.gallery'), icon: '\uD83C\uDFDB\uFE0F', desc: t('dashboard.tabs.galleryDesc') },
    { id: 'tickets', label: t('dashboard.tabs.tickets'), icon: '\uD83C\uDFAB', desc: t('dashboard.tabs.ticketsDesc') },
    { id: 'wins', label: t('dashboard.tabs.wins'), icon: '\uD83C\uDFC6', desc: t('dashboard.tabs.winsDesc') },
    { id: 'referral', label: t('dashboard.tabs.referral'), icon: '\uD83E\uDD1D', desc: t('dashboard.tabs.referralDesc') }
  ];

  // Close hamburger menu or settings dropdown on ESC
  useEffect(() => {
    if (!isMenuOpen && !isSettingsOpen) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isMenuOpen, isSettingsOpen]);

  // Close settings dropdown on click outside
  useEffect(() => {
    if (!isSettingsOpen) return;
    const handleClickOutside = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSettingsOpen]);

  // Fetch $Memeya token balance
  // If user was previously prompted about 10K requirement and 1 hour has passed,
  // refresh via backend (updates Firestore cache for draw-time qualification).
  // Otherwise, use the standard frontend RPC call (display only, no Firestore write).
  useEffect(() => {
    if (!walletAddress) return;
    const REFRESH_COOLDOWN = 60 * 60 * 1000; // 1 hour
    (async () => {
      const promptedAt = localStorage.getItem('memeya_prompted_at');
      const cacheExpired = promptedAt && (Date.now() - parseInt(promptedAt) > REFRESH_COOLDOWN);

      if (cacheExpired) {
        try {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 8000);
          const res = await fetch(`${API_BASE_URL}/api/users/${walletAddress}/refresh-memeya-balance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: ctrl.signal,
          });
          clearTimeout(t);
          const data = await res.json();
          if (data.success) {
            setMemeyaBalance(data.data.balance);
            setMemeyaBonus(data.data.bonus);
            // Clear the frontend balance cache so it picks up the fresh value
            localStorage.removeItem(`memeya_bal_${walletAddress}`);
            // Reset prompted timestamp — ForgeTab will re-set it if still unqualified
            localStorage.removeItem('memeya_prompted_at');
            return;
          }
        } catch (e) {
          console.warn('Balance refresh failed, falling back to RPC:', e.message);
        }
      }

      const result = await getMemeyaBalance(walletAddress);
      if (result) {
        setMemeyaBalance(result.balance);
        setMemeyaBonus(result.bonus);
      }
      // If null (fetch failed), keep memeyaBalance as null → ForgeTab treats as loading
    })();
  }, [walletAddress]);

  // Fetch Memeya reward wallet USDC balance
  useEffect(() => {
    (async () => {
      try {
        const [balRes, cfgRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/rewards/balance`),
          fetch(`${API_BASE_URL}/api/rewards/config`)
        ]);
        const balData = await balRes.json();
        const cfgData = await cfgRes.json();
        if (balData.success) setRewardWalletUsdc(balData.data.usdc);
        if (cfgData.success) setRewardEnabled(cfgData.data.rewardEnabled);
      } catch {}
    })();
  }, []);

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Fetch meme details for wins
  useEffect(() => {
    if (nftWins.length === 0) return;
    const fetchWinMemes = async () => {
      const results = {};
      await Promise.all(nftWins.map(async (win) => {
        try {
          const resp = await fetch(`${API_BASE_URL}/api/memes/${win.memeId}`);
          const data = await resp.json();
          if (data.success && data.meme) results[win.memeId] = data.meme;
        } catch (e) { /* skip */ }
      }));
      setWinMemes(results);
    };
    fetchWinMemes();
  }, [nftWins]);

  // 3-phase countdown: counting → drawing → result → next day
  const [countdown, setCountdown] = useState('');
  const [drawPhase, setDrawPhase] = useState('counting'); // 'counting' | 'drawing' | 'result'
  const [drawResult, setDrawResult] = useState(null);

  useEffect(() => {
    let tickId, pollId;

    const getDrawTime = () => {
      const now = new Date();
      return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 55, 0));
    };

    const pollResult = async () => {
      try {
        const resp = await fetch(`${API_BASE_URL}/api/lottery/current`);
        const data = await resp.json();
        if (data.success && data.data.drawCompleted) {
          setDrawResult(data.data.result);
          setDrawPhase('result');
          clearInterval(pollId);
          // Show result for 8 seconds, then flip to next day
          setTimeout(() => {
            setDrawPhase('counting');
            setDrawResult(null);
          }, 8000);
        }
      } catch (e) { /* keep polling */ }
    };

    const tick = () => {
      const now = new Date();
      const todayDraw = getDrawTime();
      const diff = todayDraw - now;

      if (drawPhase === 'result') return; // frozen during result display

      if (diff > 0) {
        // Phase 1: counting down
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setCountdown(`${h}h ${m}m ${s}s`);
        if (drawPhase !== 'counting') setDrawPhase('counting');
      } else if (diff > -180000) {
        // Phase 2: 0 to 3 min after draw time — drawing in progress
        if (drawPhase !== 'drawing') {
          setDrawPhase('drawing');
          // Start polling every 5s
          pollResult();
          pollId = setInterval(pollResult, 5000);
        }
      } else {
        // >3 min past draw, no result fetched — show next day
        const tomorrow = new Date(todayDraw);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        const nextDiff = tomorrow - now;
        const h = Math.floor(nextDiff / 3600000);
        const m = Math.floor((nextDiff % 3600000) / 60000);
        const s = Math.floor((nextDiff % 60000) / 1000);
        setCountdown(`${h}h ${m}m ${s}s`);
        if (drawPhase !== 'counting') setDrawPhase('counting');
      }
    };

    tick();
    tickId = setInterval(tick, 1000);
    return () => { clearInterval(tickId); clearInterval(pollId); };
  }, [drawPhase]);

  // Enhanced Tickets Tab
  const TicketsTabContent = () => (
    <div className="space-y-8">
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 text-center">
        <div className="text-8xl text-yellow-400 mb-6">{'\uD83C\uDFAB'}</div>
        <div className="text-6xl text-yellow-400 font-bold mb-4">{userTickets}</div>
        <h3 className="text-2xl font-bold mb-4">{t('dashboard.tickets.title')}</h3>
        <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
          {t('dashboard.tickets.desc')}
        </p>

        {/* Ticket Earning Breakdown */}
        <div className="grid md:grid-cols-3 gap-6 mb-8 max-w-3xl mx-auto">
          <div className="bg-white/5 rounded-xl p-6">
            <h4 className="font-bold mb-2 text-cyan-400">{t('dashboard.tickets.baseRoll')}</h4>
            <div className="text-2xl font-bold mb-2">{t('dashboard.tickets.baseRange')}</div>
            <p className="text-sm text-gray-400">{t('dashboard.tickets.baseDesc')}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-6 relative">
            <button
              onClick={() => setShowStreakInfo(true)}
              className="absolute top-3 right-3 w-5 h-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 transition-colors text-xs font-bold"
              title="How streak bonus works"
            >
              !
            </button>
            <h4 className="font-bold mb-2 text-green-400">{t('dashboard.tickets.streakBonus')}</h4>
            <div className="text-2xl font-bold mb-2">+{Math.min(votingStreak, 10)}</div>
            <p className="text-sm text-gray-400">{t('dashboard.tickets.streakDesc', { count: votingStreak })}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-6">
            <h4 className="font-bold mb-2 text-yellow-400">{t('dashboard.tickets.memeyaBonus')}</h4>
            <div className="text-2xl font-bold mb-2">+{memeyaBonus}</div>
            <p className="text-sm text-gray-400">
              {memeyaBalance !== null && memeyaBalance > 0
                ? t('dashboard.tickets.holdingTokens', { amount: formatTokenAmount(memeyaBalance) })
                : t('dashboard.tickets.holdForBonus')}
            </p>
          </div>
        </div>

        {/* $Memeya Token Info */}
        <div className="mb-8 max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-5">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-xl">&#129689;</span>
              <h4 className="font-bold text-yellow-400">{t('dashboard.tickets.memeyaToken')}</h4>
            </div>
            <div className="flex items-center justify-center gap-2 mb-3">
              <code className="text-xs font-mono text-yellow-300 bg-black/30 px-3 py-1.5 rounded-lg border border-yellow-500/20 truncate max-w-[240px] md:max-w-none">
                mPj8dgqLDciVX27vU5efHiodbQhsgK43gGhjQrBpump
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('mPj8dgqLDciVX27vU5efHiodbQhsgK43gGhjQrBpump');
                }}
                className="px-2 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 hover:bg-yellow-500/30 transition-colors text-xs font-medium flex-shrink-0"
              >
                {t('common.copy')}
              </button>
            </div>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-400 mb-3">
              <span className="px-2 py-1 bg-white/5 rounded-full">{t('dashboard.tickets.tenTicket')}</span>
              <span className="px-2 py-1 bg-white/5 rounded-full">{t('dashboard.tickets.oneKTicket')}</span>
              <span className="px-2 py-1 bg-white/5 rounded-full">{t('dashboard.tickets.tenKTicket')}</span>
              <span className="px-2 py-1 bg-white/5 rounded-full">{t('dashboard.tickets.hundredKTicket')}</span>
            </div>
            <div className="text-center">
              <a
                href="https://pump.fun/coin/mPj8dgqLDciVX27vU5efHiodbQhsgK43gGhjQrBpump"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
              >
                {t('home.memeya.buyOnPumpFun')}
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Lottery Strategy - Side by side cards */}
        <div className="mb-8 max-w-2xl mx-auto">
          <h4 className="font-bold text-xl md:text-2xl mb-4 text-purple-400">{t('dashboard.tickets.strategy')}</h4>
          <div className="grid grid-cols-2 gap-4">
            {/* Enter Tonight */}
            <button
              onClick={async () => {
                if (lotteryOptIn) return;
                try {
                  const resp = await fetch(`${API_BASE_URL}/api/lottery/toggle-opt-in`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ walletAddress, optIn: true })
                  });
                  const data = await resp.json();
                  if (data.success) setLotteryOptIn(true);
                } catch (e) { console.error('Toggle failed:', e); }
              }}
              className={`relative rounded-xl p-5 text-left transition-all duration-300 ${
                lotteryOptIn
                  ? 'bg-green-500/10 border-2 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.15)]'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer'
              }`}
            >
              {lotteryOptIn && <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-green-400 animate-pulse" />}
              <div className="text-2xl mb-2">{'\uD83C\uDFB0'}</div>
              <div className={`font-bold text-lg mb-1 ${lotteryOptIn ? 'text-green-400' : 'text-gray-300'}`}>{t('dashboard.tickets.enterTonight')}</div>
              <p className="text-xs text-gray-400 leading-relaxed">
                {t('dashboard.tickets.enterDesc')}
              </p>
            </button>
            {/* Save Tickets */}
            <button
              onClick={async () => {
                if (!lotteryOptIn) return;
                try {
                  const resp = await fetch(`${API_BASE_URL}/api/lottery/toggle-opt-in`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ walletAddress, optIn: false })
                  });
                  const data = await resp.json();
                  if (data.success) setLotteryOptIn(false);
                } catch (e) { console.error('Toggle failed:', e); }
              }}
              className={`relative rounded-xl p-5 text-left transition-all duration-300 ${
                !lotteryOptIn
                  ? 'bg-orange-500/10 border-2 border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.15)]'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer'
              }`}
            >
              {!lotteryOptIn && <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-orange-400 animate-pulse" />}
              <div className="text-2xl mb-2">{'\uD83E\uDDE0'}</div>
              <div className={`font-bold text-lg mb-1 ${!lotteryOptIn ? 'text-orange-400' : 'text-gray-300'}`}>{t('dashboard.tickets.saveTickets')}</div>
              <p className="text-xs text-gray-400 leading-relaxed">
                {t('dashboard.tickets.saveDesc')}
              </p>
            </button>
          </div>
          {/* Status message */}
          <div className={`mt-4 text-sm font-medium text-center py-2 rounded-lg ${
            lotteryOptIn
              ? 'text-green-400 bg-green-500/10'
              : 'text-orange-400 bg-orange-500/10'
          }`}>
            {lotteryOptIn
              ? t('dashboard.tickets.enteringTonight', { count: userTickets })
              : t('dashboard.tickets.savingTickets', { count: userTickets })
            }
          </div>
        </div>

        {/* CTA: Check Winners */}
        <button
          onClick={() => setActiveTab('wins')}
          className="w-full bg-gradient-to-r from-yellow-600/20 to-amber-600/20 hover:from-yellow-600/30 hover:to-amber-600/30 border border-yellow-500/30 hover:border-yellow-500/50 rounded-xl p-4 transition-all duration-300 group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{'\uD83C\uDFC6'}</span>
              <div className="text-left">
                <p className="font-bold text-white group-hover:text-yellow-300 transition-colors">{t('dashboard.tickets.checkWinners')}</p>
                <p className="text-xs text-gray-400">{t('dashboard.tickets.checkWinnersDesc')}</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-yellow-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

      </div>

      {/* Streak Bonus Info Modal */}
      {showStreakInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowStreakInfo(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div
            className="relative bg-gray-900 border border-white/10 rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowStreakInfo(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 transition-all z-10"
            >
              &#10005;
            </button>
            <div className="p-6 md:p-8">
              <h3 className="text-xl font-bold mb-4 text-green-400">{t('dashboard.tickets.streakSystem')}</h3>
              <p className="text-gray-400 text-sm mb-6">{t('dashboard.tickets.streakSystemDesc')}</p>

              <div className="space-y-2 mb-6">
                {[1,2,3,4,5,6,7,8,9,10].map(day => (
                  <div key={day} className="flex items-center gap-3">
                    <span className={`text-sm font-mono w-14 ${votingStreak >= day ? 'text-green-400' : 'text-gray-500'}`}>{t('dashboard.tickets.streakDay', { day })}</span>
                    <div className="flex-1 bg-white/5 rounded-full h-4 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${votingStreak >= day ? 'bg-green-500/60' : 'bg-white/10'}`}
                        style={{ width: `${day * 10}%` }}
                      />
                    </div>
                    <span className={`text-sm font-bold w-8 text-right ${votingStreak >= day ? 'text-green-400' : 'text-gray-500'}`}>+{day}</span>
                  </div>
                ))}
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-gray-400">
                <p className="mb-2"><strong className="text-white">{t('dashboard.tickets.streakHowItWorks')}</strong></p>
                <p>{t('dashboard.tickets.streakExplain')}</p>
              </div>

              <div className="text-center mt-6">
                <button
                  onClick={() => setShowStreakInfo(false)}
                  className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold rounded-xl transition-all duration-200"
                >
                  {t('common.gotIt')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );

  // Winners Tab
  const [winnersView, setWinnersView] = useState('all_winners'); // 'all_winners' | 'my_wins'
  const [recentWinners, setRecentWinners] = useState([]);
  const [winnersLoading, setWinnersLoading] = useState(false);
  const [winsFilter, setWinsFilter] = useState('all'); // 'all' | 'unclaimed' | 'minted'

  // Fetch recent winners when switching to wins tab
  useEffect(() => {
    if (activeTab !== 'wins') return;
    const fetchRecentWinners = async () => {
      setWinnersLoading(true);
      try {
        const resp = await fetch(`${API_BASE_URL}/api/lottery/recent-winners?limit=10`);
        const data = await resp.json();
        if (data.success) setRecentWinners(data.data);
      } catch (e) { console.error('Failed to fetch recent winners:', e); }
      setWinnersLoading(false);
    };
    fetchRecentWinners();
  }, [activeTab]);

  const privateWallet = (w) => w ? w.slice(0, 4) + '...' + w.slice(-4) : '\u2014';

  const WinnersTabContent = () => {
    const myUsdcWins = walletAddress ? recentWinners.flatMap(w => {
      const wins = [];
      if (w.winnerWallet === walletAddress && w.winnerUsdc)
        wins.push({ type: 'meme', date: w.drawId, amount: w.winnerUsdc, txSignature: w.winnerTxSignature, memeTitle: w.memeTitle });
      w.luckyVoters?.forEach(v => {
        if (v.wallet === walletAddress)
          wins.push({ type: 'lucky', date: w.drawId, amount: v.amount, txSignature: v.txSignature, memeTitle: w.memeTitle });
      });
      return wins;
    }) : [];
    const totalUsdcEarned = myUsdcWins.reduce((sum, w) => sum + Number(w.amount || 0), 0);

    const filteredWins = nftWins
      .filter(w => {
        if (winsFilter === 'unclaimed') return !w.claimed;
        if (winsFilter === 'minted') return w.claimed;
        return true;
      })
      .sort((a, b) => (b.selectedAt || '').localeCompare(a.selectedAt || ''));

    const myWinsFilters = [
      { id: 'all', label: t('dashboard.winners.all'), count: nftWins.length },
      { id: 'unclaimed', label: t('dashboard.winners.unclaimed'), count: nftWins.filter(w => !w.claimed).length },
      { id: 'minted', label: t('common.minted'), count: nftWins.filter(w => w.claimed).length }
    ];

    return (
      <div className="space-y-6">
        {/* Top-level view toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{'\uD83C\uDFC6'}</span>
            <h3 className="text-2xl font-bold">{t('dashboard.winners.title')}</h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setWinnersView('all_winners')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                winnersView === 'all_winners'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              {t('dashboard.winners.allWinners')}
            </button>
            <button
              onClick={() => setWinnersView('my_wins')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                winnersView === 'my_wins'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              {t('dashboard.winners.myWins', { count: nftWins.length + myUsdcWins.length })}
            </button>
          </div>
        </div>

        {/* All Winners View */}
        {winnersView === 'all_winners' && (
          winnersLoading ? (
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-12 text-center">
              <div className="text-4xl mb-4 animate-spin">{'\uD83C\uDFB0'}</div>
              <p className="text-gray-400">{t('dashboard.winners.loadingWinners')}</p>
            </div>
          ) : recentWinners.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-12 text-center">
              <div className="text-6xl mb-4 opacity-50">{'\uD83C\uDFAF'}</div>
              <h4 className="text-xl font-bold mb-2">{t('dashboard.winners.noDraws')}</h4>
              <p className="text-gray-400">{t('dashboard.winners.lotteryTime')}</p>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
              {/* Table header */}
              <div className="hidden md:grid grid-cols-12 gap-3 px-6 py-3 bg-white/5 text-sm font-medium text-gray-400 border-b border-white/10">
                <div className="col-span-2">{t('dashboard.winners.date')}</div>
                <div className="col-span-3">{t('dashboard.winners.meme')}</div>
                <div className="col-span-1">{t('dashboard.winners.usdc')}</div>
                <div className="col-span-3">{t('dashboard.winners.winner')}</div>
                <div className="col-span-1">{t('dashboard.winners.votes')}</div>
                <div className="col-span-2 text-right">{t('dashboard.winners.winRate')}</div>
              </div>
              {/* Table rows */}
              {recentWinners.map((w) => {
                const isYou = walletAddress && w.winnerWallet === walletAddress;
                const winRate = w.totalTickets > 0 ? (w.winnerTickets / w.totalTickets * 100).toFixed(1) : '0.0';
                const dateStr = new Date(w.drawId + 'T00:00:00Z').toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' });
                return (
                  <div key={w.drawId} className="border-b border-white/5">
                    {/* Meme Winner Row */}
                    <div
                      className={`grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 px-4 md:px-6 py-4 hover:bg-white/5 transition-colors ${isYou ? 'bg-green-500/5' : ''}`}
                    >
                      {/* Date */}
                      <div className="md:col-span-2 text-sm text-gray-300 flex items-center">
                        <span className="md:hidden text-gray-500 mr-2">{t('dashboard.winners.date')}:</span>{dateStr}
                      </div>
                      {/* Meme */}
                      <div className="md:col-span-3">
                        <button
                          onClick={() => {
                            if (w.memeId) {
                              setModalMeme({ id: w.memeId, title: w.memeTitle, imageUrl: w.memeImageUrl });
                              setIsModalOpen(true);
                            }
                          }}
                          className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left"
                        >
                          {w.memeImageUrl ? (
                            <img src={w.memeImageUrl} alt={w.memeTitle || 'Meme'} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center text-lg flex-shrink-0">{'\uD83C\uDFA8'}</div>
                          )}
                          <span className="text-sm text-cyan-400 truncate">{w.memeTitle || `Meme ${w.memeId?.slice(-6) || '?'}`}</span>
                        </button>
                      </div>
                      {/* USDC */}
                      <div className="md:col-span-1 text-sm flex items-center">
                        <span className="md:hidden text-gray-500 mr-2">{t('dashboard.winners.usdc')}:</span>
                        {w.winnerUsdc ? (
                          w.winnerTxSignature ? (
                            <a href={`https://solscan.io/tx/${w.winnerTxSignature}`} target="_blank" rel="noopener noreferrer" className="text-green-400 font-medium hover:underline">${w.winnerUsdc}</a>
                          ) : (
                            <span className="text-green-400 font-medium">${w.winnerUsdc}</span>
                          )
                        ) : (
                          <span className="text-gray-600">-</span>
                        )}
                      </div>
                      {/* Winner */}
                      <div className="md:col-span-3 flex items-center gap-2">
                        <span className="md:hidden text-gray-500 text-sm mr-1">{t('dashboard.winners.winner')}:</span>
                        <span className="text-xs font-bold text-yellow-400 bg-yellow-500/20 px-1.5 py-0.5 rounded">{t('dashboard.winners.memeTag')}</span>
                        <span className="text-sm font-mono text-gray-300">{privateWallet(w.winnerWallet)}</span>
                        {isYou && <span className="text-xs font-bold text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full">{t('dashboard.winners.you')}</span>}
                      </div>
                      {/* Votes */}
                      <div className="md:col-span-1 text-sm text-gray-300 flex items-center">
                        <span className="md:hidden text-gray-500 mr-2">{t('dashboard.winners.votes')}:</span>
                        {w.winnerTickets} / {w.totalTickets}
                      </div>
                      {/* Win Rate */}
                      <div className="md:col-span-2 text-sm text-right flex items-center justify-end">
                        <span className="md:hidden text-gray-500 mr-2">{t('dashboard.winners.winRate')}:</span>
                        <span className={`font-medium ${parseFloat(winRate) >= 50 ? 'text-green-400' : parseFloat(winRate) >= 20 ? 'text-yellow-400' : 'text-gray-300'}`}>
                          {winRate}%
                        </span>
                      </div>
                    </div>
                    {/* Lucky Voter Rows */}
                    {w.luckyVoters?.map((v, vi) => {
                      const isVoterYou = walletAddress && v.wallet === walletAddress;
                      return (
                        <div
                          key={`${w.drawId}-voter-${vi}`}
                          className={`grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 px-4 md:px-6 py-3 hover:bg-white/5 transition-colors ${isVoterYou ? 'bg-green-500/5' : 'bg-white/[0.02]'}`}
                        >
                          {/* Date - empty */}
                          <div className="md:col-span-2"></div>
                          {/* Meme - empty */}
                          <div className="md:col-span-3"></div>
                          {/* USDC */}
                          <div className="md:col-span-1 text-sm flex items-center">
                            <span className="md:hidden text-gray-500 mr-2">{t('dashboard.winners.usdc')}:</span>
                            {v.txSignature ? (
                              <a href={`https://solscan.io/tx/${v.txSignature}`} target="_blank" rel="noopener noreferrer" className="text-green-400 font-medium hover:underline">${v.amount}</a>
                            ) : (
                              <span className="text-green-400 font-medium">${v.amount}</span>
                            )}
                          </div>
                          {/* Winner */}
                          <div className="md:col-span-3 flex items-center gap-2">
                            <span className="md:hidden text-gray-500 text-sm mr-1">{t('dashboard.winners.winner')}:</span>
                            <span className="text-xs font-bold text-purple-400 bg-purple-500/20 px-1.5 py-0.5 rounded">{t('dashboard.winners.luckyTag')}</span>
                            <span className="text-sm font-mono text-gray-300">{privateWallet(v.wallet)}</span>
                            {isVoterYou && <span className="text-xs font-bold text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full">{t('dashboard.winners.you')}</span>}
                          </div>
                          {/* Votes - N/A for lucky voters (random draw, not ticket-based) */}
                          <div className="md:col-span-1 text-sm text-gray-500 flex items-center">
                            <span className="md:hidden text-gray-500 mr-2">{t('dashboard.winners.votes')}:</span>
                            {'\u2014'}
                          </div>
                          {/* Win Rate - N/A for lucky voters */}
                          <div className="md:col-span-2 text-sm text-right flex items-center justify-end">
                            <span className="md:hidden text-gray-500 mr-2">{t('dashboard.winners.winRate')}:</span>
                            <span className="font-medium text-gray-500">{'\u2014'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* My Wins View */}
        {winnersView === 'my_wins' && (
          <div className="space-y-6">
            {/* Sub-filters */}
            <div className="flex gap-2">
              {myWinsFilters.map(f => (
                <button
                  key={f.id}
                  onClick={() => setWinsFilter(f.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    winsFilter === f.id
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>

            {/* Empty State — only when no NFT wins AND no USDC wins */}
            {nftWins.length === 0 && myUsdcWins.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-12 text-center">
                <div className="text-6xl mb-4 opacity-50">{'\uD83C\uDFAF'}</div>
                <h4 className="text-xl font-bold mb-2">{t('dashboard.winners.noWinsYet')}</h4>
                <p className="text-gray-400 max-w-md mx-auto">{t('dashboard.winners.keepVoting')}</p>
              </div>
            ) : (
              <>
                {/* NFT Wins Grid */}
                {nftWins.length > 0 && (
                  filteredWins.length === 0 ? (
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-12 text-center">
                      <div className="text-5xl mb-4 opacity-50">{winsFilter === 'minted' ? '\uD83C\uDFA8' : '\uD83D\uDCED'}</div>
                      <p className="text-gray-400">{t('dashboard.winners.noFiltered', { filter: winsFilter })}</p>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredWins.map((win, i) => {
                        const meme = winMemes[win.memeId];
                        return (
                          <div key={win.memeId + i} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden hover:border-yellow-500/30 transition-all group">
                            {/* Meme Image */}
                            <div className="aspect-square bg-gray-800 relative">
                              {meme ? (
                                <img
                                  src={meme.imageUrl || meme.image}
                                  alt={meme.title || 'Winning Meme'}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl animate-pulse">{'\uD83C\uDFA8'}</div>
                              )}
                              {/* Status badge */}
                              <div className={`absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full ${
                                win.claimed
                                  ? 'bg-green-500/80 text-white'
                                  : 'bg-yellow-500/80 text-white'
                              }`}>
                                {win.claimed ? t('common.minted') : t('common.claimable')}
                              </div>
                            </div>
                            {/* Info */}
                            <div className="p-4">
                              <h4 className="font-bold text-white truncate">
                                {meme?.title || `Meme ${win.memeId.slice(-6)}`}
                              </h4>
                              <div className="text-xs text-gray-400 mt-1">
                                {t('dashboard.winners.won', { date: new Date(win.selectedAt).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' }) })}
                              </div>
                              {win.drawId && (
                                <div className="text-xs text-gray-500 mt-0.5">{t('dashboard.winners.drawId', { id: win.drawId })}</div>
                              )}
                              {!win.claimed ? (
                                <button
                                  className="mt-3 w-full text-sm font-bold py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white opacity-60 cursor-not-allowed"
                                  disabled
                                  title="NFT minting coming soon"
                                >
                                  {t('dashboard.winners.claimNftSoon')}
                                </button>
                              ) : (
                                <div className="mt-3 w-full text-sm font-bold py-2 rounded-lg bg-green-500/10 text-green-400 text-center border border-green-500/20">
                                  {t('common.minted')}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}

                {/* USDC Rewards Section */}
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{'\uD83D\uDCB0'}</span>
                      <h4 className="text-lg font-bold">{t('dashboard.winners.usdcRewards')}</h4>
                    </div>
                    {totalUsdcEarned > 0 && (
                      <span className="text-sm font-medium text-green-400">{t('dashboard.winners.totalEarned', { amount: totalUsdcEarned })}</span>
                    )}
                  </div>
                  {myUsdcWins.length === 0 ? (
                    <div className="px-6 py-8 text-center">
                      <p className="text-gray-400 text-sm">{t('dashboard.winners.noUsdcRewards')}</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {myUsdcWins.map((win, i) => {
                        const dateStr = new Date(win.date + 'T00:00:00Z').toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' });
                        return (
                          <div key={`${win.date}-${win.type}-${i}`} className="flex items-center gap-3 px-6 py-3 hover:bg-white/5 transition-colors">
                            <span className="text-sm text-gray-400 w-16 flex-shrink-0">{dateStr}</span>
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                              win.type === 'meme'
                                ? 'text-yellow-400 bg-yellow-500/20'
                                : 'text-purple-400 bg-purple-500/20'
                            }`}>
                              {win.type === 'meme' ? t('dashboard.winners.memeTag') : t('dashboard.winners.luckyTag')}
                            </span>
                            {win.txSignature ? (
                              <a href={`https://solscan.io/tx/${win.txSignature}`} target="_blank" rel="noopener noreferrer" className="text-green-400 font-bold hover:underline flex-shrink-0">${win.amount}</a>
                            ) : (
                              <span className="text-green-400 font-bold flex-shrink-0">${win.amount}</span>
                            )}
                            <span className="text-sm text-gray-500 truncate">{win.memeTitle}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* CTA: Invite Friends */}
        <button
          onClick={() => setActiveTab('referral')}
          className="w-full bg-gradient-to-r from-green-600/20 to-emerald-600/20 hover:from-green-600/30 hover:to-emerald-600/30 border border-green-500/30 hover:border-green-500/50 rounded-xl p-4 transition-all duration-300 group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{'\uD83C\uDF81'}</span>
              <div className="text-left">
                <p className="font-bold text-white group-hover:text-green-300 transition-colors">{t('dashboard.winners.inviteFriends')}</p>
                <p className="text-xs text-gray-400">{t('dashboard.winners.inviteFriendsDesc')}</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-green-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'workshop':
        return <WorkshopTab setActiveTab={setActiveTab} />;
      case 'forge':
        return <ForgeTab walletAddress={walletAddress}
          userTickets={userTickets}
          setUserTickets={setUserTickets}
          votingStreak={votingStreak}
          setVotingStreak={setVotingStreak}
          memeyaBalance={memeyaBalance}
          setActiveTab={setActiveTab}
        />;
      case 'gallery':
        return <GalleryTab />;
      case 'tickets':
        return <TicketsTabContent />;
      case 'wins':
        return <WinnersTabContent />;
      case 'referral':
        return <ReferralTab walletAddress={walletAddress} memeyaBalance={memeyaBalance} />;
      default:
        return <ForgeTab walletAddress={walletAddress}
          userTickets={userTickets}
          setUserTickets={setUserTickets}
          votingStreak={votingStreak}
          setVotingStreak={setVotingStreak}
          memeyaBalance={memeyaBalance}
          setActiveTab={setActiveTab}
        />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Enhanced animated background */}
      <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/4 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Enhanced Header - Mobile Responsive */}
      <header className="relative z-20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-3 md:px-6 py-3 md:py-6">
          <div className="flex justify-between items-center">
            <button onClick={() => setActiveTab('forge')} className="flex items-center space-x-2 md:space-x-4 cursor-pointer hover:opacity-80 transition-opacity">
              <img
                src="/images/logo-48.png"
                alt="AI MemeForge Logo"
                className="w-10 h-10 md:w-12 md:h-12 rounded-xl shadow-lg shadow-cyan-500/25"
              />
              <div>
                <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  AI MemeForge
                </h1>
                <div className="hidden md:block text-xs text-gray-500">{t('dashboard.subtitle')}</div>
              </div>
            </button>

            {/* Memeya X link with speech bubble */}
            <a
              href="https://x.com/AiMemeForgeIO"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                if (!isMobile) return;
                e.preventDefault();
                const webUrl = 'https://x.com/AiMemeForgeIO';
                const appUrl = 'twitter://user?screen_name=AiMemeForgeIO';
                const start = Date.now();
                window.location.href = appUrl;
                setTimeout(() => {
                  if (Date.now() - start < 2000) window.open(webUrl, '_blank');
                }, 1500);
              }}
              className="group relative flex items-center gap-2 flex-shrink-0"
              title="@AiMemeForgeIO on X"
            >
              {/* Speech bubble */}
              <div className="hidden md:flex items-center bg-cyan-500/15 border border-cyan-400/30 rounded-full px-3 py-1 group-hover:bg-cyan-500/25 transition-colors">
                <span className="text-xs font-medium text-cyan-300 whitespace-nowrap">{t('dashboard.findMeOnX')}</span>
              </div>
              {/* Avatar */}
              <div className="relative">
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-full overflow-hidden border-2 border-cyan-400/40 group-hover:border-cyan-400/80 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all duration-300">
                  <img src="/images/memeya-avatar.png" alt="Memeya" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-black rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-gray-300" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </div>
              </div>
            </a>

            {/* Desktop User Info + Settings */}
            <div className="hidden md:flex items-center space-x-2 md:space-x-6">
              <div className="hidden lg:flex items-center space-x-6 px-6 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg">
                {memeyaBalance !== null && memeyaBalance > 0 && (
                  <>
                    <div className="text-center">
                      <div className="text-sm text-gray-400">$Memeya</div>
                      <div className="font-bold text-yellow-400 text-lg">{formatTokenAmount(memeyaBalance)}</div>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                  </>
                )}
                <div className="text-center">
                  <div className="text-sm text-gray-400">
                    {drawPhase === 'result' ? t('dashboard.nav.winner') : drawPhase === 'drawing' ? t('dashboard.nav.lottery') : t('dashboard.nav.nextDraw')}
                  </div>
                  {drawPhase === 'drawing' ? (
                    <div className="font-bold text-yellow-400 text-lg animate-pulse">{t('dashboard.nav.drawing')}</div>
                  ) : drawPhase === 'result' && drawResult ? (
                    <div className="font-bold text-green-400 text-lg">
                      {drawResult.winnerWallet
                        ? `${drawResult.winnerWallet.slice(0, 4)}...${drawResult.winnerWallet.slice(-4)}`
                        : 'No winner'}
                    </div>
                  ) : (
                    <div className="font-bold text-orange-400 text-lg font-mono">{countdown}</div>
                  )}
                </div>
              </div>

              {/* Address + Settings Gear */}
              <div className="relative" ref={settingsRef}>
                <div className="flex items-center gap-2">
                  {walletAddress && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-cyan-300 font-mono text-sm">{shortAddress}</span>
                    </div>
                  )}
                  <button
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 transition-all duration-200"
                    title="Settings"
                  >
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>

                {/* Settings Dropdown */}
                {isSettingsOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100] isolate">
                    <div className="py-1">
                      {/* Language */}
                      <div className="px-4 py-3 border-b border-white/10">
                        <LanguageSwitcher variant="inline" />
                      </div>

                      {/* How It Works */}
                      <button
                        onClick={() => { setShowHowItWorks(true); setIsSettingsOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/10 transition-colors"
                      >
                        <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 text-sm font-bold">?</span>
                        <span className="text-sm">{t('dashboard.settings.howItWorks')}</span>
                      </button>

                      {/* Referral Program */}
                      <button
                        onClick={() => { setActiveTab('referral'); setIsSettingsOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/10 transition-colors"
                      >
                        <span className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0 text-sm">{'\uD83E\uDD1D'}</span>
                        <span className="text-sm text-cyan-400">{t('dashboard.settings.referral')}</span>
                      </button>

                      {/* Buy $Memeya */}
                      <a
                        href="https://pump.fun/coin/mPj8dgqLDciVX27vU5efHiodbQhsgK43gGhjQrBpump"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsSettingsOpen(false)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/10 transition-colors"
                      >
                        <span className="w-7 h-7 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0 text-sm">&#129689;</span>
                        <span className="text-sm text-yellow-400">{t('dashboard.settings.buyMemeya')}</span>
                        <svg className="w-3.5 h-3.5 ml-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>

                      {/* GitHub */}
                      <a
                        href="https://github.com/sonyschan/SolanaHacker"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsSettingsOpen(false)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/10 transition-colors"
                      >
                        <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
                        </span>
                        <span className="text-sm">{t('dashboard.settings.github')}</span>
                        <svg className="w-3.5 h-3.5 ml-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>

                      {/* Divider */}
                      <div className="border-t border-white/10 my-1" />

                      {/* Wallet address with copy */}
                      {walletAddress && (
                        <button
                          onClick={copyAddress}
                          className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/10 transition-colors"
                        >
                          <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                            {copied ? (
                              <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </span>
                          <div className="text-left">
                            <div className="text-sm font-mono text-cyan-300">{shortAddress}</div>
                            <div className="text-xs text-gray-500">{copied ? t('common.copied') : t('dashboard.settings.copyAddress')}</div>
                          </div>
                        </button>
                      )}

                      {/* Export Private Key — only for embedded wallet users */}
                      {hasEmbeddedWallet && (
                        <button
                          onClick={async () => {
                            setIsSettingsOpen(false);
                            try { await exportWallet(); } catch (e) { alert('Unable to export wallet. Your wallet may not support key export.'); }
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/10 transition-colors"
                        >
                          <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                          </span>
                          <span className="text-sm">{t('dashboard.settings.exportPrivateKey')}</span>
                        </button>
                      )}

                      {/* Sign Out */}
                      <button
                        onClick={() => { logout(); setIsSettingsOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <span className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </span>
                        <span className="text-sm">{t('common.signOut')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Hamburger menu button - mobile only */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 transition-all duration-200"
              aria-label="Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

      </header>

      {/* Mobile hamburger menu — rendered outside header to avoid z-index stacking */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 md:hidden" onClick={() => setIsMenuOpen(false)} />
          {/* Menu panel */}
          <div
            ref={menuRef}
            className="fixed left-0 right-0 top-[57px] z-50 md:hidden bg-gray-900 border-b border-white/10 shadow-2xl animate-slide-down"
          >
            <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
              {/* Language */}
              <div className="px-3 py-3">
                <LanguageSwitcher variant="inline" />
              </div>

              {/* How It Works */}
              <button
                onClick={() => { setShowHowItWorks(true); setIsMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm font-bold">?</span>
                <span className="text-sm font-medium">{t('dashboard.settings.howItWorks')}</span>
              </button>

              {/* Referral Program */}
              <button
                onClick={() => { setActiveTab('referral'); setIsMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <span className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-sm">{'\uD83E\uDD1D'}</span>
                <span className="text-sm font-medium text-cyan-400">{t('dashboard.settings.referral')}</span>
              </button>

              {/* Buy $Memeya */}
              <a
                href="https://pump.fun/coin/mPj8dgqLDciVX27vU5efHiodbQhsgK43gGhjQrBpump"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMenuOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <span className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-sm">&#129689;</span>
                <span className="text-sm font-medium text-yellow-400">{t('dashboard.settings.buyMemeya')}</span>
                <svg className="w-4 h-4 ml-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>

              {/* GitHub */}
              <a
                href="https://github.com/sonyschan/SolanaHacker"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMenuOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
                </span>
                <span className="text-sm font-medium">{t('dashboard.settings.github')}</span>
                <svg className="w-4 h-4 ml-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>

              {/* Divider */}
              <div className="border-t border-white/10 my-1" />

              {/* Wallet address with copy */}
              {walletAddress && (
                <button
                  onClick={copyAddress}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg bg-white/5"
                >
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-cyan-300 font-mono text-sm">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </span>
                  {walletName && (
                    <span className="text-xs text-gray-500">{walletName}</span>
                  )}
                  {memeyaBalance !== null && memeyaBalance > 0 && (
                    <span className="text-xs text-yellow-400 font-medium">&#129689; {formatTokenAmount(memeyaBalance)}</span>
                  )}
                  <span className="ml-auto text-xs text-gray-500">{copied ? t('common.copied') : t('common.copy')}</span>
                </button>
              )}

              {/* Export Private Key — only for embedded wallet users */}
              {hasEmbeddedWallet && (
                <button
                  onClick={async () => {
                    setIsMenuOpen(false);
                    try { await exportWallet(); } catch (e) { alert('Unable to export wallet. Your wallet may not support key export.'); }
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </span>
                  <span className="text-sm font-medium">{t('dashboard.settings.exportPrivateKey')}</span>
                </button>
              )}

              {/* Sign Out */}
              <button
                onClick={() => { logout(); setIsMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
              >
                <span className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </span>
                <span className="text-sm font-medium">{t('common.signOut')}</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Enhanced Tab Navigation - Mobile Responsive */}
      <nav className="relative z-10 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-2 md:px-6">
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-3 md:px-8 py-3 md:py-4 font-medium transition-all duration-300 border-b-2 relative overflow-hidden group ${
                  activeTab === tab.id
                    ? 'text-cyan-400 border-cyan-400 bg-cyan-500/10'
                    : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="flex items-center space-x-2 md:space-x-3 relative z-10">
                  <span className="text-lg md:text-xl">{tab.icon}</span>
                  <div className="text-left">
                    <div className="flex items-center space-x-1 md:space-x-2">
                      <span className="text-sm md:text-base whitespace-nowrap">{tab.label}</span>
                    </div>
                    <div className="hidden md:block text-xs opacity-60">{tab.desc}</div>
                  </div>
                </span>
                {activeTab === tab.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 animate-pulse" />
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile Draw Countdown Banner */}
      <div className="md:hidden relative z-10">
        <div className="max-w-7xl mx-auto px-3 pt-4">
          <div className="flex items-center justify-between bg-gradient-to-r from-orange-500/10 via-yellow-500/10 to-orange-500/10 border border-orange-400/20 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{'\uD83C\uDFB0'}</span>
              <span className="text-xs font-medium text-gray-300">
                {drawPhase === 'result' ? t('dashboard.nav.winnerAnnounced') : drawPhase === 'drawing' ? t('dashboard.nav.drawingNow') : t('dashboard.nav.nextDraw')}
              </span>
            </div>
            {drawPhase === 'drawing' ? (
              <span className="font-bold text-yellow-400 text-sm animate-pulse">{t('dashboard.nav.drawing')}</span>
            ) : drawPhase === 'result' && drawResult ? (
              <span className="font-bold text-green-400 text-sm">
                {drawResult.winnerWallet ? `${drawResult.winnerWallet.slice(0, 4)}...${drawResult.winnerWallet.slice(-4)}` : 'No winner'}
              </span>
            ) : (
              <span className="font-bold text-orange-400 text-base font-mono">{countdown}</span>
            )}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-3 md:px-6 py-6 md:py-12">
        {renderTabContent()}
      </main>

      {/* Meme Modal */}
      <MemeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalMeme(null);
        }}
        meme={modalMeme}
        walletAddress={walletAddress}
      />

      {/* Wallet info now lives in Workshop tab */}

      {/* How It Works Modal */}
      {showHowItWorks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowHowItWorks(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div
            className="relative bg-gray-900 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowHowItWorks(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 transition-all z-10"
            >
              {'\u2715'}
            </button>

            <div className="p-6 md:p-8 space-y-8">
              {/* Header */}
              <div className="text-center pr-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">{t('dashboard.howItWorks.title')}</h2>
                <p className="text-gray-400">{t('dashboard.howItWorks.desc')}</p>
              </div>

              {/* 4-Step Daily Loop */}
              <div className="space-y-4">
                {[
                  { step: "1", icon: "\uD83E\uDD16", title: t('dashboard.howItWorks.step1Title'), desc: t('dashboard.howItWorks.step1Desc'), color: "from-cyan-400 to-blue-500" },
                  { step: "2", icon: "\uD83D\uDDF3\uFE0F", title: t('dashboard.howItWorks.step2Title'), desc: t('dashboard.howItWorks.step2Desc'), color: "from-purple-400 to-pink-500" },
                  { step: "3", icon: "\uD83C\uDFC6", title: t('dashboard.howItWorks.step3Title'), desc: t('dashboard.howItWorks.step3Desc'), color: "from-yellow-400 to-orange-500" },
                  { step: "4", icon: "\uD83D\uDCB0", title: t('dashboard.howItWorks.step4Title'), desc: t('dashboard.howItWorks.step4Desc'), color: "from-emerald-400 to-teal-500" },
                  { step: "5", icon: "\uD83C\uDFA8", title: t('dashboard.howItWorks.step5Title'), desc: t('dashboard.howItWorks.step5Desc'), color: "from-green-400 to-emerald-500" }
                ].map((item) => (
                  <div key={item.step} className="flex items-start space-x-4">
                    <div className={`w-10 h-10 flex-shrink-0 bg-gradient-to-r ${item.color} rounded-lg flex items-center justify-center`}>
                      <span className="text-lg">{item.icon}</span>
                    </div>
                    <div>
                      <div className={`font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>{item.title}</div>
                      <p className="text-sm text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Ticket Strategy */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h3 className="font-bold text-lg mb-3">{'\uD83E\uDDE0'} {t('dashboard.howItWorks.ticketStrategy')}</h3>
                <p className="text-sm text-gray-400 mb-3">
                  {t('dashboard.howItWorks.ticketStrategyDesc')}
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="font-bold text-cyan-400 mb-1">{'\uD83C\uDFAF'} {t('dashboard.howItWorks.dailyPlayer')}</div>
                    <p className="text-gray-500 text-xs">{t('dashboard.howItWorks.dailyPlayerDesc')}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="font-bold text-purple-400 mb-1">{'\uD83E\uDDE0'} {t('dashboard.howItWorks.accumulator')}</div>
                    <p className="text-gray-500 text-xs">{t('dashboard.howItWorks.accumulatorDesc')}</p>
                  </div>
                </div>
              </div>

              {/* Growth Flywheel */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h3 className="font-bold text-lg mb-3">{'\uD83D\uDD04'} {t('dashboard.howItWorks.whyBetter')}</h3>
                <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
                  <span className="text-green-400 font-medium">{t('dashboard.howItWorks.voteFree')}</span>
                  <span className="text-gray-600">&rarr;</span>
                  <span className="text-cyan-400 font-medium">{t('dashboard.howItWorks.winMemes')}</span>
                  <span className="text-gray-600">&rarr;</span>
                  <span className="text-blue-400 font-medium">{t('dashboard.howItWorks.communityGrows')}</span>
                  <span className="text-gray-600">&rarr;</span>
                  <span className="text-purple-400 font-medium">{t('dashboard.howItWorks.nftsGainValue')}</span>
                  <span className="text-gray-600">&rarr;</span>
                  <span className="text-green-400 font-medium">{t('dashboard.howItWorks.voteMore')}</span>
                </div>
                <p className="text-center text-xs text-gray-500 mt-3">
                  {t('dashboard.howItWorks.only365')}
                </p>
              </div>

              {/* Got it button */}
              <div className="text-center pt-2">
                <button
                  onClick={() => setShowHowItWorks(false)}
                  className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold rounded-xl transition-all duration-200"
                >
                  {t('common.gotIt')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
