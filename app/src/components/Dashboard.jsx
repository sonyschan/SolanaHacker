import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import ForgeTab from './ForgeTab';
import MemeModal from './MemeModal';
import GalleryTab from './GalleryTab';

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
  walletAddress
}) => {
  const { logout, walletName, shortAddress, hasEmbeddedWallet, exportWallet } = useAuth();
  const [activeTab, setActiveTab] = useState('forge');
  const [modalMeme, setModalMeme] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [winMemes, setWinMemes] = useState({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showStreakInfo, setShowStreakInfo] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);
  const settingsRef = useRef(null);

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

  const tabs = [
    { id: 'forge', label: 'Forge', icon: '🤖', desc: 'Vote on today\'s memes' },
    { id: 'gallery', label: 'Gallery', icon: '🏛️', desc: 'Hall of Memes' },
    { id: 'tickets', label: 'Tickets', icon: '🎫', desc: 'Manage entries' },
    { id: 'wins', label: 'Winners', icon: '🏆', desc: 'Check who won' }
  ];

  // Enhanced Tickets Tab
  const TicketsTabContent = () => (
    <div className="space-y-8">
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 text-center">
        <div className="text-8xl text-yellow-400 mb-6">🎫</div>
        <div className="text-6xl text-yellow-400 font-bold mb-4">{userTickets}</div>
        <h3 className="text-2xl font-bold mb-4">Your Lottery Tickets</h3>
        <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
          Each ticket gives you one weighted entry in the daily meme lottery.
          Tickets are earned by voting on memes - no purchase necessary!
        </p>

        {/* Ticket Earning Breakdown */}
        <div className="grid md:grid-cols-3 gap-6 mb-8 max-w-3xl mx-auto">
          <div className="bg-white/5 rounded-xl p-6">
            <h4 className="font-bold mb-2 text-cyan-400">Base Roll</h4>
            <div className="text-2xl font-bold mb-2">1-10</div>
            <p className="text-sm text-gray-400">Random tickets per vote</p>
          </div>
          <div className="bg-white/5 rounded-xl p-6 relative">
            <button
              onClick={() => setShowStreakInfo(true)}
              className="absolute top-3 right-3 w-5 h-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 transition-colors text-xs font-bold"
              title="How streak bonus works"
            >
              !
            </button>
            <h4 className="font-bold mb-2 text-green-400">Streak Bonus</h4>
            <div className="text-2xl font-bold mb-2">+{Math.min(votingStreak, 10)}</div>
            <p className="text-sm text-gray-400">{votingStreak} day{votingStreak !== 1 ? 's' : ''} consecutive (max +10)</p>
          </div>
          <div className="bg-white/5 rounded-xl p-6">
            <h4 className="font-bold mb-2 text-yellow-400">$Memeya Bonus</h4>
            <div className="text-2xl font-bold mb-2">+0</div>
            <p className="text-sm text-gray-400">Hold tokens for bonus tickets</p>
          </div>
        </div>

        {/* $Memeya Token Info */}
        <div className="mb-8 max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-5">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-xl">&#129689;</span>
              <h4 className="font-bold text-yellow-400">$Memeya Token</h4>
            </div>
            <div className="flex items-center justify-center gap-2 mb-3">
              <code className="text-xs font-mono text-yellow-300 bg-black/30 px-3 py-1.5 rounded-lg border border-yellow-500/20 truncate max-w-[240px] md:max-w-none">
                983j5C4udenB89Wh8Z7ebcgtqeEAUp2uprnbrLvHpump
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('983j5C4udenB89Wh8Z7ebcgtqeEAUp2uprnbrLvHpump');
                }}
                className="px-2 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 hover:bg-yellow-500/30 transition-colors text-xs font-medium flex-shrink-0"
              >
                Copy
              </button>
            </div>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-400 mb-3">
              <span className="px-2 py-1 bg-white/5 rounded-full">10 = +1 ticket</span>
              <span className="px-2 py-1 bg-white/5 rounded-full">1K = +3</span>
              <span className="px-2 py-1 bg-white/5 rounded-full">10K = +4</span>
              <span className="px-2 py-1 bg-white/5 rounded-full">100K = +5</span>
            </div>
            <div className="text-center">
              <a
                href="https://pump.fun/coin/983j5C4udenB89Wh8Z7ebcgtqeEAUp2uprnbrLvHpump"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
              >
                Buy on PumpFun
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Lottery Strategy - Side by side cards */}
        <div className="mb-8 max-w-2xl mx-auto">
          <h4 className="font-bold text-xl md:text-2xl mb-4 text-purple-400">Your Lottery Strategy</h4>
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
              <div className="text-2xl mb-2">🎰</div>
              <div className={`font-bold text-lg mb-1 ${lotteryOptIn ? 'text-green-400' : 'text-gray-300'}`}>Enter Tonight</div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Use all your tickets in tonight's draw. Win = you own the meme. Tickets reset to 0 after draw.
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
              <div className="text-2xl mb-2">🧠</div>
              <div className={`font-bold text-lg mb-1 ${!lotteryOptIn ? 'text-orange-400' : 'text-gray-300'}`}>Save Tickets</div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Carry tickets over each day. Enter later with better odds when you see a meme you love.
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
              ? `${userTickets} ticket${userTickets !== 1 ? 's' : ''} entering tonight's draw`
              : `Saving ${userTickets} ticket${userTickets !== 1 ? 's' : ''} for a future draw`
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
              <h3 className="text-xl font-bold mb-4 text-green-400">Streak Bonus System</h3>
              <p className="text-gray-400 text-sm mb-6">Vote daily to build your streak. Each consecutive day adds bonus tickets, up to +10.</p>

              <div className="space-y-2 mb-6">
                {[1,2,3,4,5,6,7,8,9,10].map(day => (
                  <div key={day} className="flex items-center gap-3">
                    <span className={`text-sm font-mono w-14 ${votingStreak >= day ? 'text-green-400' : 'text-gray-500'}`}>Day {day}</span>
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
                <p className="mb-2"><strong className="text-white">How it works:</strong></p>
                <p>Vote every day to increase your streak. Miss a day and it resets to Day 1. The streak bonus stacks with your base roll (1-10) and $Memeya token bonus.</p>
              </div>

              <div className="text-center mt-6">
                <button
                  onClick={() => setShowStreakInfo(false)}
                  className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold rounded-xl transition-all duration-200"
                >
                  Got it!
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

  const privateWallet = (w) => w ? w.slice(0, 4) + '...' + w.slice(-4) : '—';

  const WinnersTabContent = () => {
    const filteredWins = nftWins
      .filter(w => {
        if (winsFilter === 'unclaimed') return !w.claimed;
        if (winsFilter === 'minted') return w.claimed;
        return true;
      })
      .sort((a, b) => (b.selectedAt || '').localeCompare(a.selectedAt || ''));

    const myWinsFilters = [
      { id: 'all', label: 'All', count: nftWins.length },
      { id: 'unclaimed', label: 'Unclaimed', count: nftWins.filter(w => !w.claimed).length },
      { id: 'minted', label: 'Minted', count: nftWins.filter(w => w.claimed).length }
    ];

    return (
      <div className="space-y-6">
        {/* Top-level view toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            <h3 className="text-2xl font-bold">Winners</h3>
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
              All Winners
            </button>
            <button
              onClick={() => setWinnersView('my_wins')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                winnersView === 'my_wins'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              My Wins ({nftWins.length})
            </button>
          </div>
        </div>

        {/* All Winners View */}
        {winnersView === 'all_winners' && (
          winnersLoading ? (
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-12 text-center">
              <div className="text-4xl mb-4 animate-spin">🎰</div>
              <p className="text-gray-400">Loading winners...</p>
            </div>
          ) : recentWinners.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-12 text-center">
              <div className="text-6xl mb-4 opacity-50">🎯</div>
              <h4 className="text-xl font-bold mb-2">No draws yet</h4>
              <p className="text-gray-400">Lottery runs daily at 23:55 UTC</p>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
              {/* Table header */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-white/5 text-sm font-medium text-gray-400 border-b border-white/10">
                <div className="col-span-2">Date</div>
                <div className="col-span-3">Meme</div>
                <div className="col-span-3">Winner</div>
                <div className="col-span-2">Votes</div>
                <div className="col-span-2">Win Rate</div>
              </div>
              {/* Table rows */}
              {recentWinners.map((w) => {
                const isYou = walletAddress && w.winnerWallet === walletAddress;
                const winRate = w.totalTickets > 0 ? (w.winnerTickets / w.totalTickets * 100).toFixed(1) : '0.0';
                const dateStr = new Date(w.drawId + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                return (
                  <div
                    key={w.drawId}
                    className={`grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 md:px-6 py-4 border-b border-white/5 hover:bg-white/5 transition-colors ${isYou ? 'bg-green-500/5' : ''}`}
                  >
                    {/* Date */}
                    <div className="md:col-span-2 text-sm text-gray-300">
                      <span className="md:hidden text-gray-500 mr-2">Date:</span>{dateStr}
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
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity text-left"
                      >
                        {w.memeImageUrl ? (
                          <img src={w.memeImageUrl} alt={w.memeTitle || 'Meme'} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center text-lg flex-shrink-0">🎨</div>
                        )}
                        <span className="text-sm text-cyan-400 truncate">{w.memeTitle || `Meme ${w.memeId?.slice(-6) || '?'}`}</span>
                      </button>
                    </div>
                    {/* Winner */}
                    <div className="md:col-span-3 flex items-center gap-2">
                      <span className="md:hidden text-gray-500 text-sm mr-1">Winner:</span>
                      <span className="text-sm font-mono text-gray-300">{privateWallet(w.winnerWallet)}</span>
                      {isYou && <span className="text-xs font-bold text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full">(You)</span>}
                    </div>
                    {/* Votes */}
                    <div className="md:col-span-2 text-sm text-gray-300">
                      <span className="md:hidden text-gray-500 mr-2">Votes:</span>
                      {w.winnerTickets} / {w.totalTickets}
                    </div>
                    {/* Win Rate */}
                    <div className="md:col-span-2 text-sm">
                      <span className="md:hidden text-gray-500 mr-2">Win Rate:</span>
                      <span className={`font-medium ${parseFloat(winRate) >= 50 ? 'text-green-400' : parseFloat(winRate) >= 20 ? 'text-yellow-400' : 'text-gray-300'}`}>
                        {winRate}%
                      </span>
                    </div>
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
            {nftWins.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-12 text-center">
                <div className="text-6xl mb-4 opacity-50">🎯</div>
                <h4 className="text-xl font-bold mb-2">No wins yet</h4>
                <p className="text-gray-400 max-w-md mx-auto">Keep voting to earn tickets! Win the daily draw to own a meme and mint it as an NFT.</p>
              </div>
            ) : filteredWins.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-12 text-center">
                <div className="text-5xl mb-4 opacity-50">{winsFilter === 'minted' ? '🎨' : '📭'}</div>
                <p className="text-gray-400">No {winsFilter} memes yet.</p>
              </div>
            ) : (
              /* Wins Grid */
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
                          <div className="w-full h-full flex items-center justify-center text-4xl animate-pulse">🎨</div>
                        )}
                        {/* Status badge */}
                        <div className={`absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full ${
                          win.claimed
                            ? 'bg-green-500/80 text-white'
                            : 'bg-yellow-500/80 text-white'
                        }`}>
                          {win.claimed ? 'Minted' : 'Claimable'}
                        </div>
                      </div>
                      {/* Info */}
                      <div className="p-4">
                        <h4 className="font-bold text-white truncate">
                          {meme?.title || `Meme ${win.memeId.slice(-6)}`}
                        </h4>
                        <div className="text-xs text-gray-400 mt-1">
                          Won {new Date(win.selectedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        {win.drawId && (
                          <div className="text-xs text-gray-500 mt-0.5">Draw #{win.drawId}</div>
                        )}
                        {!win.claimed ? (
                          <button
                            className="mt-3 w-full text-sm font-bold py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white opacity-60 cursor-not-allowed"
                            disabled
                            title="NFT minting coming soon"
                          >
                            Claim NFT (Soon)
                          </button>
                        ) : (
                          <div className="mt-3 w-full text-sm font-bold py-2 rounded-lg bg-green-500/10 text-green-400 text-center border border-green-500/20">
                            Minted
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'forge':
        return <ForgeTab walletAddress={walletAddress}
          userTickets={userTickets}
          setUserTickets={setUserTickets}
          votingStreak={votingStreak}
          setVotingStreak={setVotingStreak}
        />;
      case 'gallery':
        return <GalleryTab />;
      case 'tickets':
        return <TicketsTabContent />;
      case 'wins':
        return <WinnersTabContent />;
      default:
        return <ForgeTab walletAddress={walletAddress}
          userTickets={userTickets}
          setUserTickets={setUserTickets}
          votingStreak={votingStreak}
          setVotingStreak={setVotingStreak}
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
                <div className="hidden md:block text-xs text-gray-500">AI Meme Democracy Platform</div>
              </div>
            </button>

            {/* Memeya X link - deep links to X app on mobile */}
            <a
              href="https://x.com/AiMemeForgeIO"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                if (!isMobile) return; // desktop: normal link behavior
                e.preventDefault();
                const webUrl = 'https://x.com/AiMemeForgeIO';
                const appUrl = 'twitter://user?screen_name=AiMemeForgeIO';
                const start = Date.now();
                window.location.href = appUrl;
                setTimeout(() => {
                  // If still here after 1.5s, app didn't open — fall back to web
                  if (Date.now() - start < 2000) window.open(webUrl, '_blank');
                }, 1500);
              }}
              className="w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden border border-white/20 hover:border-cyan-400/50 hover:shadow-[0_0_10px_rgba(34,211,238,0.2)] transition-all duration-200 flex-shrink-0"
              title="@AiMemeForgeIO on X"
            >
              <img src="/images/memeya-avatar.png" alt="Memeya" className="w-full h-full object-cover" />
            </a>

            {/* Desktop User Info + Settings */}
            <div className="hidden md:flex items-center space-x-2 md:space-x-6">
              <div className="hidden lg:flex items-center space-x-6 px-6 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg">
                <div className="text-center">
                  <div className="text-sm text-gray-400">Tickets</div>
                  {userTickets !== null ? (
                    <div className="font-bold text-cyan-400 text-lg">{userTickets}</div>
                  ) : (
                    <div className="placeholder-text text-shimmer w-12 h-6 bg-cyan-400/30 rounded mx-auto"></div>
                  )}
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <div className="text-sm text-gray-400">Streak</div>
                  {votingStreak !== null ? (
                    <div className="font-bold text-green-400 text-lg">{votingStreak} days</div>
                  ) : (
                    <div className="placeholder-text text-shimmer w-16 h-6 bg-green-400/30 rounded mx-auto"></div>
                  )}
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <div className="text-sm text-gray-400">
                    {drawPhase === 'result' ? 'Winner' : drawPhase === 'drawing' ? 'Lottery' : 'Next Draw'}
                  </div>
                  {drawPhase === 'drawing' ? (
                    <div className="font-bold text-yellow-400 text-lg animate-pulse">Drawing...</div>
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
                            <div className="text-xs text-gray-500">{copied ? 'Copied!' : 'Copy address'}</div>
                          </div>
                        </button>
                      )}

                      {/* Export Private Key — only for embedded wallet users */}
                      {hasEmbeddedWallet && (
                        <button
                          onClick={() => { exportWallet(); setIsSettingsOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/10 transition-colors"
                        >
                          <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                          </span>
                          <span className="text-sm">Export Private Key</span>
                        </button>
                      )}

                      {/* Divider */}
                      <div className="border-t border-white/10 my-1" />

                      {/* How It Works */}
                      <button
                        onClick={() => { setShowHowItWorks(true); setIsSettingsOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/10 transition-colors"
                      >
                        <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 text-sm font-bold">?</span>
                        <span className="text-sm">How It Works</span>
                      </button>

                      {/* Vote on Colosseum */}
                      <a
                        href="https://www.colosseum.org/projects/explore/ai-memeforge"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsSettingsOpen(false)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/10 transition-colors"
                      >
                        <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 text-sm">🏛️</span>
                        <span className="text-sm">Vote on Colosseum</span>
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
                        <span className="text-sm">GitHub</span>
                        <svg className="w-3.5 h-3.5 ml-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>

                      {/* Divider */}
                      <div className="border-t border-white/10 my-1" />

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
                        <span className="text-sm">Sign Out</span>
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
                  <span className="ml-auto text-xs text-gray-500">{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              )}

              {/* Export Private Key — only for embedded wallet users */}
              {hasEmbeddedWallet && (
                <button
                  onClick={() => { exportWallet(); setIsMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </span>
                  <span className="text-sm font-medium">Export Private Key</span>
                </button>
              )}

              {/* How It Works */}
              <button
                onClick={() => { setShowHowItWorks(true); setIsMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm font-bold">?</span>
                <span className="text-sm font-medium">How It Works</span>
              </button>

              {/* Vote on Colosseum */}
              <a
                href="https://www.colosseum.org/projects/explore/ai-memeforge"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMenuOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm">🏛️</span>
                <span className="text-sm font-medium">Vote on Colosseum</span>
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
                <span className="text-sm font-medium">GitHub</span>
                <svg className="w-4 h-4 ml-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>

              {/* Divider */}
              <div className="border-t border-white/10 my-1" />

              {/* Disconnect */}
              <button
                onClick={() => { logout(); setIsMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
              >
                <span className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </span>
                <span className="text-sm font-medium">Disconnect</span>
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
      />

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
              ✕
            </button>

            <div className="p-6 md:p-8 space-y-8">
              {/* Header */}
              <div className="text-center pr-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">How It Works</h2>
                <p className="text-gray-400">A simple daily loop — completely free to participate.</p>
              </div>

              {/* 4-Step Daily Loop */}
              <div className="space-y-4">
                {[
                  { step: "1", icon: "🤖", title: "AI Creates", desc: "Every day, AI generates 3 fresh memes from trending crypto news.", color: "from-cyan-400 to-blue-500" },
                  { step: "2", icon: "🗳️", title: "You Vote", desc: "Pick your favorite meme. You earn lottery tickets (1-10 base + streak bonus) just for voting — free, no gas.", color: "from-purple-400 to-pink-500" },
                  { step: "3", icon: "🏆", title: "Daily Winner", desc: "The most-voted meme wins. A weighted lottery picks one voter as the owner.", color: "from-yellow-400 to-orange-500" },
                  { step: "4", icon: "🎨", title: "Claim NFT", desc: "The winner can mint their meme as a Solana pNFT — true ownership, forever.", color: "from-green-400 to-emerald-500" }
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
                <h3 className="font-bold text-lg mb-3">🧠 Ticket Strategy</h3>
                <p className="text-sm text-gray-400 mb-3">
                  You can choose when to enter the lottery. Skip days to save tickets, then enter with better odds when you see a meme you love.
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="font-bold text-cyan-400 mb-1">🎯 Daily Player</div>
                    <p className="text-gray-500 text-xs">Enter every day with your daily tickets. Consistent small chances.</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="font-bold text-purple-400 mb-1">🧠 Accumulator</div>
                    <p className="text-gray-500 text-xs">Save tickets across days. Enter once with 70+ tickets to dominate.</p>
                  </div>
                </div>
              </div>

              {/* Growth Flywheel */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h3 className="font-bold text-lg mb-3">🔄 Why It Gets Better</h3>
                <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
                  <span className="text-green-400 font-medium">Vote free</span>
                  <span className="text-gray-600">&rarr;</span>
                  <span className="text-cyan-400 font-medium">Win memes</span>
                  <span className="text-gray-600">&rarr;</span>
                  <span className="text-blue-400 font-medium">Community grows</span>
                  <span className="text-gray-600">&rarr;</span>
                  <span className="text-purple-400 font-medium">NFTs gain value</span>
                  <span className="text-gray-600">&rarr;</span>
                  <span className="text-green-400 font-medium">Vote more</span>
                </div>
                <p className="text-center text-xs text-gray-500 mt-3">
                  Only 365 NFTs per year. The earlier you collect, the more you have when the ecosystem grows.
                </p>
              </div>

              {/* Got it button */}
              <div className="text-center pt-2">
                <button
                  onClick={() => setShowHowItWorks(false)}
                  className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold rounded-xl transition-all duration-200"
                >
                  Got it!
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