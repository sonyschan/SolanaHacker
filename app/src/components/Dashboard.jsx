import React, { useState, useEffect } from 'react';
import WalletConnection from './WalletConnection';
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
  const [activeTab, setActiveTab] = useState('forge');
  const [modalMeme, setModalMeme] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [winMemes, setWinMemes] = useState({});

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
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/5 rounded-xl p-6">
            <h4 className="font-bold mb-2 text-cyan-400">Base Roll</h4>
            <div className="text-2xl font-bold mb-2">1-10</div>
            <p className="text-sm text-gray-400">Random tickets per vote</p>
          </div>
          <div className="bg-white/5 rounded-xl p-6">
            <h4 className="font-bold mb-2 text-green-400">Streak Bonus</h4>
            <div className="text-2xl font-bold mb-2">+{Math.min(votingStreak, 10)}</div>
            <p className="text-sm text-gray-400">{votingStreak} day{votingStreak !== 1 ? 's' : ''} consecutive (max +10)</p>
          </div>
          <div className="bg-white/5 rounded-xl p-6">
            <h4 className="font-bold mb-2 text-purple-400">Lottery Status</h4>
            <button
              onClick={async () => {
                const newOptIn = !lotteryOptIn;
                try {
                  const resp = await fetch(`${API_BASE_URL}/api/lottery/toggle-opt-in`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ walletAddress, optIn: newOptIn })
                  });
                  const data = await resp.json();
                  if (data.success) setLotteryOptIn(newOptIn);
                } catch (e) { console.error('Toggle failed:', e); }
              }}
              className={`text-lg font-bold mb-2 px-4 py-1 rounded-lg transition-all ${
                lotteryOptIn
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              }`}
            >
              {lotteryOptIn ? 'Participating' : 'Accumulating'}
            </button>
            <p className="text-sm text-gray-400 mt-1">
              {lotteryOptIn ? 'Tickets reset after draw' : 'Saving tickets'}
            </p>
          </div>
        </div>

        {/* Streak Bonus Infographic */}
        <div className="mb-8">
          <img
            src="/images/streak-bonus-chart.png"
            alt="Streak Bonus System: Base 1-10 tickets + streak bonus up to +10. Vote daily to earn more. Miss a day and streak resets to Day 1."
            className="w-full max-w-3xl mx-auto rounded-xl border border-white/10"
          />
        </div>

        {/* Strategy Tip */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-left max-w-2xl mx-auto">
          <h4 className="font-bold text-lg mb-2">Strategy Tip</h4>
          <p className="text-sm text-gray-400">
            <span className="text-green-400 font-medium">Participating:</span> Your tickets enter today's draw — if you win, you own the meme. Tickets reset to 0 after the draw.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            <span className="text-orange-400 font-medium">Accumulating:</span> Your tickets carry over each day. Enter later with better odds when you see a meme you love.
          </p>
        </div>

      </div>

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
      <header className="relative z-10 backdrop-blur-sm border-b border-white/10">
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

            {/* How It Works icon */}
            <button
              onClick={() => setShowHowItWorks(true)}
              className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 transition-all duration-200 ml-2"
              title="How It Works"
            >
              <span className="text-sm font-bold">?</span>
            </button>

            {/* Enhanced User Info - Hidden on mobile, shown in tabs area instead */}
            <div className="flex items-center space-x-2 md:space-x-6">
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

              <WalletConnection variant="secondary" showAddress={true} />
            </div>
          </div>
        </div>
      </header>

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