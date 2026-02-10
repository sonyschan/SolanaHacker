import React, { useState, useRef, useEffect } from 'react';
import SimplifiedSolanaWalletButton, { useSimplifiedSolanaWallet } from './SimplifiedSolanaWallet';
import EnhancedTabNavigation from './EnhancedTabNavigation';
import MobileEnhancedHero from './MobileEnhancedHero';
import Web3ConceptExplainer from './Web3ConceptExplainer';
import ProductFlowGuide from './ProductFlowGuide';

const UXEnhancedDashboard = () => {
  const { connected, address } = useSimplifiedSolanaWallet();
  const [activeTab, setActiveTab] = useState('vote');
  const [demoVote, setDemoVote] = useState(null);
  const [showStats, setShowStats] = useState(true);
  const votingRef = useRef(null);

  // Aurora background effect
  useEffect(() => {
    const createAurora = () => {
      const aurora = document.createElement('div');
      aurora.className = 'aurora-bg';
      document.body.appendChild(aurora);
      return () => document.body.removeChild(aurora);
    };

    const cleanup = createAurora();
    return cleanup;
  }, []);

  // Smooth scroll to voting section
  const scrollToVoting = () => {
    setActiveTab('vote');
    setTimeout(() => {
      if (votingRef.current) {
        votingRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  };

  const userStats = {
    tickets: 156,
    streak: 5,
    winnings: 2.34,
    rank: 42,
    totalVotes: 23,
    winChance: 3.1
  };

  const mockMemes = [
    { 
      id: 1, 
      title: "When SOL hits $1000", 
      image: "/generated/sample-meme-1-crypto-confusion.png",
      votes: 1247,
      trending: true
    },
    { 
      id: 2, 
      title: "DeFi Confusion 101", 
      image: "/generated/sample-meme-2-sol-pump.png",
      votes: 892,
      trending: false
    },
    { 
      id: 3, 
      title: "Diamond Hands Forever", 
      image: "/generated/sample-meme-3-discord-mod.png",
      votes: 654,
      trending: false
    }
  ];

  // Stats cards with enhanced mobile responsiveness
  const StatsGrid = () => {
    const stats = [
      { label: 'Prize Pool', value: '12.7 SOL', subtext: '≈ $2,540 USD', color: 'text-yellow-400', trend: '📈 +2.1 SOL today' },
      { label: 'Active Voters', value: '5,247', subtext: 'This week', color: 'text-cyan-400', trend: '🔥 247 voting now' },
      { label: 'Next Draw', value: 'Sunday', subtext: '8PM UTC', color: 'text-pink-400', trend: '⏰ 2 days left' },
      { label: 'Winners Paid', value: '47.3 SOL', subtext: 'This month', color: 'text-green-400', trend: '💰 Last winner: 3.2 SOL' }
    ];

    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card-enhanced group hover:scale-105 transition-transform duration-200">
            <div className="stat-label-enhanced text-xs lg:text-sm">{stat.label}</div>
            <div className={`stat-value-enhanced ${stat.color} text-lg lg:text-xl`}>{stat.value}</div>
            <div className="text-enhanced-faint text-xs">{stat.subtext}</div>
            <div className="text-enhanced-faint text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {stat.trend}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Enhanced user dashboard for connected users
  const UserDashboard = () => {
    if (!connected) return null;

    return (
      <div className="card-glass p-4 lg:p-6 border-purple-500/30">
        <div className="flex items-center justify-between mb-4 lg:mb-6">
          <div>
            <h3 className="text-enhanced-high font-bold text-lg">Your Dashboard</h3>
            <p className="text-enhanced-medium text-sm">Track your voting progress and earnings</p>
          </div>
          <button
            onClick={() => setShowStats(!showStats)}
            className="btn-ghost-enhanced text-sm lg:hidden"
          >
            {showStats ? 'Hide' : 'Show'} Stats
          </button>
        </div>

        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4 lg:mb-6 ${showStats ? 'block' : 'hidden lg:grid'}`}>
          <div className="stat-card-enhanced">
            <div className="stat-label-enhanced">Tickets</div>
            <div className="stat-value-enhanced text-purple-400">{userStats.tickets}</div>
            <div className="text-enhanced-faint text-xs">{userStats.winChance}% win chance</div>
          </div>
          <div className="stat-card-enhanced">
            <div className="stat-label-enhanced">Streak</div>
            <div className="stat-value-enhanced text-orange-400">{userStats.streak} 🔥</div>
            <div className="text-enhanced-faint text-xs">Daily votes</div>
          </div>
          <div className="stat-card-enhanced">
            <div className="stat-label-enhanced">SOL Earned</div>
            <div className="stat-value-enhanced text-green-400">{userStats.winnings}</div>
            <div className="text-enhanced-faint text-xs">This month</div>
          </div>
          <div className="stat-card-enhanced">
            <div className="stat-label-enhanced">Global Rank</div>
            <div className="stat-value-enhanced text-blue-400">#{userStats.rank}</div>
            <div className="text-enhanced-faint text-xs">of {userStats.totalVotes}k voters</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
          <button
            onClick={scrollToVoting}
            className="btn-primary-enhanced py-3"
          >
            🗳️ Vote on Today's Memes
          </button>
          <button className="btn-ghost-enhanced py-3">
            🏆 View My NFTs & Auctions
          </button>
        </div>
      </div>
    );
  };

  // Enhanced wallet connection with mobile optimization
  const WalletStatus = () => {
    if (connected && address) {
      return (
        <div className="card-glass p-4 border-green-500/30 bg-green-500/10">
          <div className="flex items-center justify-center">
            <SimplifiedSolanaWalletButton 
              variant="ghost" 
              className="w-full" 
              showAddress={true}
            >
              Connected
            </SimplifiedSolanaWalletButton>
          </div>
        </div>
      );
    }

    return (
      <div className="card-glass p-4 lg:p-6 text-center">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto bg-purple-500/20 rounded-full flex items-center justify-center mb-3">
            <span className="text-2xl">👛</span>
          </div>
          <h3 className="text-enhanced-high font-bold mb-2">Connect Your Solana Wallet</h3>
          <p className="text-enhanced-medium text-sm leading-relaxed">
            Connect Phantom, Solflare, or other Solana wallets to start voting on AI memes and earning SOL rewards
          </p>
        </div>
        <SimplifiedSolanaWalletButton className="w-full mb-3 py-3" style={{ minHeight: '48px' }}>
          Connect Wallet
        </SimplifiedSolanaWalletButton>
        <button
          onClick={scrollToVoting}
          className="btn-ghost-enhanced w-full text-sm py-2"
        >
          👀 Browse Memes First
        </button>
        <div className="mt-3 text-enhanced-faint text-xs">
          Phantom & Solflare wallets supported
        </div>
      </div>
    );
  };

  // Enhanced voting interface with better mobile UX
  const VotingInterface = () => {
    const handleVote = (memeId) => {
      if (!connected) {
        alert('Please connect your Solana wallet first!');
        return;
      }
      setDemoVote(memeId);
      setTimeout(() => setDemoVote(null), 3000);
    };

    return (
      <div className="space-y-6" ref={votingRef}>
        <div className="text-center mb-6 lg:mb-8">
          <h2 className="text-3xl lg:text-4xl font-bold heading-gradient mb-4">
            Today's AI Memes
          </h2>
          <p className="text-enhanced-medium text-lg mb-4">
            Vote for your favorite and earn 8-15 lottery tickets
          </p>
          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-enhanced-medium">247 voting now</span>
            </div>
            <div className="text-enhanced-faint">•</div>
            <div className="text-enhanced-medium">3 hours left to vote</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {mockMemes.map((meme) => (
            <div 
              key={meme.id} 
              className={`card-glass card-interactive relative overflow-hidden ${
                demoVote === meme.id ? 'border-green-500/50 bg-green-500/10' : ''
              }`}
            >
              {meme.trending && (
                <div className="absolute top-4 left-4 z-10">
                  <div className="status-info-enhanced">
                    🔥 Trending
                  </div>
                </div>
              )}

              <div className="p-4 lg:p-6">
                <img
                  src={meme.image}
                  alt={meme.title}
                  className="w-full h-40 lg:h-48 object-cover rounded-lg mb-4"
                />
                
                <h3 className="text-enhanced-high font-bold mb-2">{meme.title}</h3>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-enhanced-low text-sm">
                    {meme.votes.toLocaleString()} votes
                  </p>
                  <div className="text-enhanced-faint text-xs">
                    {Math.floor(Math.random() * 50) + 10} voting now
                  </div>
                </div>

                {demoVote === meme.id ? (
                  <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-center">
                    <div className="text-green-400 font-bold mb-1">🎉 Vote Recorded!</div>
                    <div className="text-green-300 text-sm">+12 lottery tickets earned</div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleVote(meme.id)}
                    className="btn-primary-enhanced w-full py-3"
                    style={{ minHeight: '48px' }}
                    disabled={!connected}
                  >
                    🗳️ Vote & Earn ({connected ? '+8-15 tickets' : 'Connect Wallet'})
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {demoVote && (
          <div className="card-glass p-6 bg-green-500/10 border-green-500/30 text-center">
            <h3 className="text-green-400 font-bold text-lg mb-2">Vote Successful! 🎉</h3>
            <p className="text-enhanced-medium">
              You earned <strong className="text-green-400">12 lottery tickets</strong> for Sunday's draw.
              Keep voting daily to build your streak and increase your win chances!
            </p>
            <div className="mt-4">
              <button className="btn-ghost-enhanced mr-3">
                🎯 Vote on More
              </button>
              <button className="btn-ghost-enhanced">
                📊 View My Stats
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen relative">
      <div className="relative z-10">
        {/* Enhanced Header - Mobile Optimized */}
        <header className="nav-enhanced">
          <div className="max-w-7xl mx-auto section-padding py-3 lg:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 lg:space-x-4">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg lg:text-xl">🗳️</span>
                </div>
                <div>
                  <div className="text-enhanced-high font-bold text-lg lg:text-xl">MemeForge</div>
                  <div className="text-enhanced-low text-xs mono hidden lg:block">AI Dreams. Democracy Decides.</div>
                </div>
              </div>

              <div className="flex items-center space-x-3 lg:space-x-4">
                <SimplifiedSolanaWalletButton 
                  variant="ghost" 
                  className="text-sm" 
                  showAddress={connected}
                >
                  {connected ? '' : 'Connect'}
                </SimplifiedSolanaWalletButton>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto section-padding py-6 lg:py-8">
          
          {/* OPTIMIZATION 1: Enhanced Mobile Hero Section */}
          <MobileEnhancedHero onScrollToVoting={scrollToVoting} />

          {/* OPTIMIZATION 2: Web3 Concept Explanation */}
          <Web3ConceptExplainer onScrollToVoting={scrollToVoting} />

          {/* OPTIMIZATION 3: Product Flow Guide (including auctions) */}
          <ProductFlowGuide />

          {/* Enhanced Stats Overview */}
          <div className="mb-8 lg:mb-12">
            <StatsGrid />
          </div>

          {/* Wallet Connection / User Dashboard */}
          <div className="mb-8 lg:mb-12">
            {connected ? <UserDashboard /> : <WalletStatus />}
          </div>

          {/* Enhanced Tab Navigation */}
          <EnhancedTabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Tab Content */}
          <div className="mb-8 lg:mb-12">
            {activeTab === 'vote' && <VotingInterface />}
            {activeTab === 'stats' && (
              <div className="card-glass p-6 lg:p-8 text-center">
                <h3 className="text-enhanced-high font-bold text-lg mb-4">📊 Platform Statistics</h3>
                <p className="text-enhanced-medium">Detailed statistics and analytics coming soon!</p>
              </div>
            )}
            {activeTab === 'winners' && (
              <div className="card-glass p-6 lg:p-8 text-center">
                <h3 className="text-enhanced-high font-bold text-lg mb-4">🏆 Recent Winners</h3>
                <p className="text-enhanced-medium">Winner announcements and prize distribution history coming soon!</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="text-center text-enhanced-faint">
            <div className="card-glass p-4 lg:p-6">
              <p className="text-sm">
                MemeForge - Where AI creativity meets human judgment
              </p>
              <div className="mt-2 text-xs">
                Built on Solana • Open Source • Community Owned
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default UXEnhancedDashboard;