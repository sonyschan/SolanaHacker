import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { formatTokenAmount } from '../services/solanaService';
import MemeCard from './MemeCard';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://memeforge-api-836651762884.asia-southeast1.run.app';

// Pie chart colors — top 10 slots + user + others
const PIE_COLORS = [
  '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444',
  '#ec4899', '#3b82f6', '#14b8a6', '#f97316', '#a855f7'
];
const USER_COLOR = '#22c55e';
const OTHERS_COLOR = '#374151';

const TicketPieChart = ({ drawId, walletAddress, t }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDistribution = async () => {
      try {
        const walletParam = walletAddress ? `?wallet=${walletAddress}` : '';
        const resp = await fetch(`${API_BASE_URL}/api/lottery/distribution/${drawId}${walletParam}`);
        const json = await resp.json();
        if (json.success) setData(json.data);
      } catch (e) { console.error('Failed to fetch distribution:', e); }
      setLoading(false);
    };
    fetchDistribution();
  }, [drawId, walletAddress]);

  if (loading) return <div className="text-center py-4 text-gray-500 text-sm">Loading...</div>;
  if (!data) return null;

  // Build pie segments: top holders + optional user (if outside top 10) + others
  const segments = [];
  data.topHolders.forEach((h, i) => {
    segments.push({
      label: h.isUser ? `${h.wallet} ${t('dashboard.winners.you')}` : h.wallet,
      tickets: h.tickets,
      color: h.isUser ? USER_COLOR : PIE_COLORS[i % PIE_COLORS.length],
      isUser: h.isUser
    });
  });
  if (data.userEntry) {
    segments.push({
      label: `${data.userEntry.wallet} ${t('dashboard.winners.you')}`,
      tickets: data.userEntry.tickets,
      color: USER_COLOR,
      isUser: true
    });
  }
  if (data.othersTickets > 0) {
    segments.push({
      label: t('dashboard.winners.others', { count: data.othersCount }),
      tickets: data.othersTickets,
      color: OTHERS_COLOR,
      isUser: false
    });
  }

  // SVG donut chart
  const total = data.totalTickets;
  const radius = 80;
  const cx = 100, cy = 100;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;

  const arcs = segments.map((seg, i) => {
    const fraction = seg.tickets / total;
    const dashLength = fraction * circumference;
    const dashOffset = -accumulatedOffset;
    accumulatedOffset += dashLength;
    return (
      <circle
        key={i}
        cx={cx} cy={cy} r={radius}
        fill="none"
        stroke={seg.color}
        strokeWidth={seg.isUser ? 28 : 24}
        strokeDasharray={`${dashLength} ${circumference - dashLength}`}
        strokeDashoffset={dashOffset}
        className={seg.isUser ? 'drop-shadow-[0_0_6px_rgba(34,197,94,0.5)]' : ''}
      />
    );
  });

  // User stats for center text
  const userSeg = segments.find(s => s.isUser);
  const userPercent = userSeg ? (userSeg.tickets / total * 100).toFixed(1) : null;

  return (
    <div className="flex flex-col md:flex-row items-center gap-6 py-4 px-4 md:px-8">
      {/* Donut chart */}
      <div className="flex-shrink-0">
        <svg width="200" height="200" viewBox="0 0 200 200">
          {arcs}
          <text x={cx} y={cy - 8} textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
            {data.totalParticipants}
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" fill="#9ca3af" fontSize="11">
            {t('dashboard.winners.participants', { count: data.totalParticipants })}
          </text>
        </svg>
      </div>
      {/* Legend */}
      <div className="flex-1 w-full">
        {userSeg && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-sm">
            <span className="text-green-400 font-bold">
              {t('dashboard.winners.yourTickets', { tickets: userSeg.tickets, percent: userPercent })}
            </span>
            {data.userEntry && (
              <span className="text-gray-400 ml-2">
                {t('dashboard.winners.rank', { rank: data.userEntry.rank, total: data.totalParticipants })}
              </span>
            )}
            {data.userInTop10 && (
              <span className="text-gray-400 ml-2">
                {t('dashboard.winners.rank', {
                  rank: data.topHolders.findIndex(h => h.isUser) + 1,
                  total: data.totalParticipants
                })}
              </span>
            )}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          {segments.map((seg, i) => (
            <div key={i} className={`flex items-center gap-2 text-xs py-1 px-2 rounded ${seg.isUser ? 'bg-green-500/5' : ''}`}>
              <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: seg.color }} />
              <span className={`truncate ${seg.isUser ? 'text-green-400 font-medium' : 'text-gray-300'}`}>{seg.label}</span>
              <span className="text-gray-500 ml-auto flex-shrink-0">{seg.tickets} ({(seg.tickets / total * 100).toFixed(1)}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const LotteryTab = ({
  userTickets,
  votingStreak,
  lotteryOptIn,
  setLotteryOptIn,
  memeyaBonus,
  memeyaBalance,
  walletAddress,
  nftWins = [],
  setActiveTab,
  onOpenMemeModal
}) => {
  const { t, i18n } = useTranslation();

  // Tickets state
  const [showStreakInfo, setShowStreakInfo] = useState(false);

  // Winners state
  const [winnersView, setWinnersView] = useState('all_winners');
  const [recentWinners, setRecentWinners] = useState([]);
  const [winnersLoading, setWinnersLoading] = useState(false);
  const [winsFilter, setWinsFilter] = useState('all');
  const [winMemes, setWinMemes] = useState({});
  const [expandedDraw, setExpandedDraw] = useState(null);

  // Fetch recent winners on mount
  useEffect(() => {
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
  }, []);

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

  const privateWallet = (w) => w ? w.slice(0, 4) + '...' + w.slice(-4) : '\u2014';

  // My USDC wins computed from recentWinners
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
    <div className="space-y-8">
      {/* ===== TICKET SUMMARY SECTION ===== */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 text-center">
        <div className="text-5xl text-yellow-400 mb-4">{'\uD83C\uDFAB'}</div>
        <div className="text-6xl text-yellow-400 font-bold font-mono mb-2">{userTickets}</div>
        <h3 className="text-2xl font-extrabold tracking-tight mb-3">{t('dashboard.tickets.title')}</h3>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">
          {t('dashboard.tickets.desc')}
        </p>

        {/* Ticket Earning Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 max-w-3xl mx-auto">
          <div className="bg-white/5 rounded-xl p-6">
            <h4 className="font-bold mb-2 text-cyan-400">{t('dashboard.tickets.baseRoll')}</h4>
            <div className="text-2xl font-bold font-mono mb-2">{t('dashboard.tickets.baseRange')}</div>
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
            <div className="text-2xl font-bold font-mono mb-2">+{Math.min(votingStreak, 10)}</div>
            <p className="text-sm text-gray-400">{t('dashboard.tickets.streakDesc', { count: votingStreak })}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-6">
            <h4 className="font-bold mb-2 text-yellow-400">{t('dashboard.tickets.memeyaBonus')}</h4>
            <div className="text-2xl font-bold font-mono mb-2">+{memeyaBonus}</div>
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
          <h4 className="font-extrabold text-xl md:text-2xl mb-4 text-purple-400 tracking-tight">{t('dashboard.tickets.strategy')}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {/* ===== WINNERS SECTION ===== */}
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
                            if (w.memeId && onOpenMemeModal) {
                              onOpenMemeModal({ id: w.memeId, title: w.memeTitle, imageUrl: w.memeImageUrl });
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
                      {/* Votes — clickable to expand pie chart (only if snapshot exists) */}
                      <div className="md:col-span-1 text-sm text-gray-300 flex items-center">
                        <span className="md:hidden text-gray-500 mr-2">{t('dashboard.winners.votes')}:</span>
                        {w.hasTicketSnapshot ? (
                          <button
                            onClick={() => setExpandedDraw(expandedDraw === w.drawId ? null : w.drawId)}
                            className="hover:text-cyan-400 transition-colors cursor-pointer flex items-center gap-1"
                            title={t('dashboard.winners.tapToSeeOdds')}
                          >
                            {w.winnerTickets} / {w.totalTickets}
                            <svg className={`w-3 h-3 transition-transform ${expandedDraw === w.drawId ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        ) : (
                          <span>{w.winnerTickets} / {w.totalTickets}</span>
                        )}
                      </div>
                      {/* Win Rate */}
                      <div className="md:col-span-2 text-sm text-right flex items-center justify-end">
                        <span className="md:hidden text-gray-500 mr-2">{t('dashboard.winners.winRate')}:</span>
                        <span className={`font-medium ${parseFloat(winRate) >= 50 ? 'text-green-400' : parseFloat(winRate) >= 20 ? 'text-yellow-400' : 'text-gray-300'}`}>
                          {winRate}%
                        </span>
                      </div>
                    </div>
                    {/* Ticket Distribution Pie Chart (expanded) */}
                    {expandedDraw === w.drawId && (
                      <div className="border-t border-white/5 bg-white/[0.02]">
                        <TicketPieChart drawId={w.drawId} walletAddress={walletAddress} t={t} />
                      </div>
                    )}
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
                          {/* Votes - N/A for lucky voters */}
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

            {/* Empty State */}
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
                          <MemeCard
                            key={win.memeId + i}
                            meme={meme || { title: `Meme ${win.memeId.slice(-6)}` }}
                            hoverColor="yellow"
                          >
                            <div className={`mt-1 inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                              win.claimed
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {win.claimed ? t('common.minted') : t('common.claimable')}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {t('dashboard.winners.won', { date: new Date(win.selectedAt).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' }) })}
                            </div>
                            {win.drawId && (
                              <div className="text-xs text-gray-500 mt-0.5">{t('dashboard.winners.drawId', { id: win.drawId })}</div>
                            )}
                            {!win.claimed ? (
                              <button
                                className="mt-2 w-full text-sm font-bold py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white opacity-60 cursor-not-allowed"
                                disabled
                                title="NFT minting coming soon"
                              >
                                {t('dashboard.winners.claimNftSoon')}
                              </button>
                            ) : (
                              <div className="mt-2 w-full text-sm font-bold py-2 rounded-lg bg-green-500/10 text-green-400 text-center border border-green-500/20">
                                {t('common.minted')}
                              </div>
                            )}
                          </MemeCard>
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
          className="w-full bg-gradient-to-r from-purple-600/20 to-cyan-600/20 hover:from-purple-600/30 hover:to-cyan-600/30 border border-purple-500/30 hover:border-purple-500/50 rounded-xl p-4 transition-all duration-300 group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{'\uD83C\uDF81'}</span>
              <div className="text-left">
                <p className="font-bold text-white group-hover:text-purple-300 transition-colors">{t('dashboard.winners.inviteFriends')}</p>
                <p className="text-xs text-gray-400">{t('dashboard.winners.inviteFriendsDesc')}</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </div>
    </div>
  );
};

export default LotteryTab;
