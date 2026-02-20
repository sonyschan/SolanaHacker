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
  onDisconnectWallet,
  setUserTickets,
  setVotingStreak,
  walletAddress
}) => {
  const [activeTab, setActiveTab] = useState('forge');
  const [modalMeme, setModalMeme] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const getNextDraw = () => {
      const now = new Date();
      const draw = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 55, 0));
      if (now >= draw) draw.setUTCDate(draw.getUTCDate() + 1);
      return draw;
    };
    const tick = () => {
      const diff = getNextDraw() - new Date();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const tabs = [
    { id: 'forge', label: 'Forge', icon: '🤖', desc: 'Vote on today\'s memes' },
    { id: 'gallery', label: 'Gallery', icon: '🏛️', desc: 'Hall of Memes' },
    { id: 'tickets', label: 'My Tickets', icon: '🎫', desc: 'Lottery entries' },
    { id: 'market', label: 'Market', icon: '🛒', desc: 'NFT auctions (Coming Soon)', comingSoon: true }
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
            <h4 className="font-bold mb-2 text-cyan-400">Daily Vote</h4>
            <div className="text-2xl font-bold mb-2">8-15</div>
            <p className="text-sm text-gray-400">Random tickets per vote</p>
          </div>
          <div className="bg-white/5 rounded-xl p-6">
            <h4 className="font-bold mb-2 text-green-400">Streak Bonus</h4>
            <div className="text-2xl font-bold mb-2">+{Math.min(votingStreak, 10)}</div>
            <p className="text-sm text-gray-400">Extra tickets for consistency</p>
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

        {/* Strategy Tip */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-left max-w-2xl mx-auto">
          <h4 className="font-bold text-lg mb-2">Strategy Tip</h4>
          <p className="text-sm text-gray-400">
            <span className="text-green-400 font-medium">Participating:</span> Your tickets enter today's draw — if you win, you own the meme NFT. Tickets reset to 0 after the draw.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            <span className="text-orange-400 font-medium">Accumulating:</span> Your tickets carry over each day. Enter later with better odds when you see a meme you love.
          </p>
        </div>

      </div>

      {/* Market Stats - Preview Mode */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white/5 rounded-xl p-6 text-center relative">
          <div className="absolute top-2 right-2">
            <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">Preview</span>
          </div>
          <div className="text-3xl text-cyan-400 font-bold mb-2">0</div>
          <div className="text-gray-400 text-sm">Total NFTs</div>
          <div className="text-xs text-gray-500 mt-1">Minting in Beta</div>
        </div>
        <div className="bg-white/5 rounded-xl p-6 text-center relative">
          <div className="absolute top-2 right-2">
            <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">Preview</span>
          </div>
          <div className="text-3xl text-green-400 font-bold mb-2">--</div>
          <div className="text-gray-400 text-sm">Avg Price (SOL)</div>
          <div className="text-xs text-gray-500 mt-1">Coming Soon</div>
        </div>
        <div className="bg-white/5 rounded-xl p-6 text-center relative">
          <div className="absolute top-2 right-2">
            <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">Preview</span>
          </div>
          <div className="text-3xl text-purple-400 font-bold mb-2">--</div>
          <div className="text-gray-400 text-sm">Total Volume (SOL)</div>
          <div className="text-xs text-gray-500 mt-1">Coming Soon</div>
        </div>
        <div className="bg-white/5 rounded-xl p-6 text-center relative">
          <div className="absolute top-2 right-2">
            <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">Preview</span>
          </div>
          <div className="text-3xl text-orange-400 font-bold mb-2">80%</div>
          <div className="text-gray-400 text-sm">To Prize Pool</div>
          <div className="text-xs text-gray-500 mt-1">Beta Feature</div>
        </div>
      </div>

      {/* Beta Info Box */}
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-2xl p-8 text-center">
        <div className="text-6xl mb-4">🚀</div>
        <h3 className="text-2xl font-bold mb-4">NFT Marketplace Coming in Beta</h3>
        <p className="text-gray-300 mb-6">
          NFT minting, auctions, and real SOL rewards will be available in the Beta release. 
          For now, enjoy voting and earning tickets!
        </p>
        <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-2xl text-cyan-400 font-bold">🎨</div>
            <div className="text-sm text-gray-400 mt-1">NFT Minting</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-2xl text-green-400 font-bold">💰</div>
            <div className="text-sm text-gray-400 mt-1">SOL Auctions</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-2xl text-purple-400 font-bold">🏆</div>
            <div className="text-sm text-gray-400 mt-1">Real Rewards</div>
          </div>
        </div>
      </div>
    </div>
  );

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
      case 'market':
        return (<div className="text-center py-20"><div className="text-6xl mb-4">🛒</div><h2 className="text-2xl font-bold mb-2">NFT Market Coming Soon</h2><p className="text-gray-400">NFT minting and auctions will be available in Beta</p></div>);
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
                  <div className="text-sm text-gray-400">Next Draw</div>
                  <div className="font-bold text-orange-400 text-lg font-mono">{countdown}</div>
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
                } ${tab.comingSoon ? 'opacity-60' : ''}`}
              >
                <span className="flex items-center space-x-2 md:space-x-3 relative z-10">
                  <span className="text-lg md:text-xl">{tab.icon}</span>
                  <div className="text-left">
                    <div className="flex items-center space-x-1 md:space-x-2">
                      <span className="text-sm md:text-base whitespace-nowrap">{tab.label}</span>
                      {tab.comingSoon && (
                        <span className="text-xs bg-orange-500/20 text-orange-400 px-1 md:px-2 py-0.5 rounded">
                          Soon
                        </span>
                      )}
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
                  { step: "2", icon: "🗳️", title: "You Vote", desc: "Pick your favorite meme. You earn 8-15 lottery tickets just for voting — free, no gas.", color: "from-purple-400 to-pink-500" },
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
                    <p className="text-gray-500 text-xs">Enter every day with 8-15 tickets. Consistent small chances.</p>
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