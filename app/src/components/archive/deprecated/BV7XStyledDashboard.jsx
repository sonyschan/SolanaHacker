import React, { useState, useRef, useEffect } from 'react';
import SimplifiedSolanaWalletButton, { useSimplifiedSolanaWallet } from './SimplifiedSolanaWallet';
import EnhancedTabNavigation from './EnhancedTabNavigation';

const BV7XStyledDashboard = () => {
  const { connected, address } = useSimplifiedSolanaWallet();
  const [activeTab, setActiveTab] = useState('vote');
  const [demoVote, setDemoVote] = useState(null);
  // Desktop users should see stats by default, mobile users can toggle
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

  // How It Works Section
  const HowItWorksSection = () => (
    <div className="card-glass p-8 mb-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold heading-gradient mb-4">How Democratic NFT Rarity Works</h2>
        <p className="text-enhanced-medium text-lg max-w-3xl mx-auto">
          Revolutionary system where <strong className="text-purple-400">community votes</strong> determine which AI memes become rare NFTs
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Step 1 */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-white">1</span>
          </div>
          <h3 className="text-enhanced-high font-bold text-lg mb-3">🤖 AI Creates Memes</h3>
          <p className="text-enhanced-medium text-sm leading-relaxed">
            Our AI generates unique meme concepts daily. Each one starts as just an idea waiting for community judgment.
          </p>
        </div>
        
        {/* Step 2 */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-gradient-to-r from-cyan-600 to-green-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-white">2</span>
          </div>
          <h3 className="text-enhanced-high font-bold text-lg mb-3">🗳️ Community Votes</h3>
          <p className="text-enhanced-medium text-sm leading-relaxed">
            You vote on your favorites. <strong className="text-cyan-400">More votes = More rare</strong>. Earn lottery tickets for every vote!
          </p>
        </div>
        
        {/* Step 3 */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-gradient-to-r from-green-600 to-yellow-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-white">3</span>
          </div>
          <h3 className="text-enhanced-high font-bold text-lg mb-3">💎 NFTs Born</h3>
          <p className="text-enhanced-medium text-sm leading-relaxed">
            Top voted memes become <strong className="text-yellow-400">rare NFTs</strong>. Prize pool gets distributed to voters. Democracy wins!
          </p>
        </div>
      </div>

      <div className="text-center mt-8">
        <button
          onClick={scrollToVoting}
          className="btn-primary-enhanced text-lg px-8 py-3"
        >
          🚀 Start Voting Now
        </button>
        <p className="text-enhanced-faint text-sm mt-2">Join 5,247 voters • Win up to 12.7 SOL</p>
      </div>
    </div>
  );

  // Enhanced wallet connection status
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
      <div className="card-glass p-6 text-center">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto bg-purple-500/20 rounded-full flex items-center justify-center mb-3">
            <span className="text-2xl">👛</span>
          </div>
          <h3 className="text-enhanced-high font-bold mb-2">Connect Your Solana Wallet</h3>
          <p className="text-enhanced-medium text-sm leading-relaxed">
            Connect Phantom, Solflare, or other Solana wallets to start voting on AI memes and earning SOL rewards
          </p>
        </div>
        <SimplifiedSolanaWalletButton className="w-full mb-3">
          Connect Wallet
        </SimplifiedSolanaWalletButton>
        <button
          onClick={scrollToVoting}
          className="btn-ghost-enhanced w-full text-sm"
        >
          👀 Browse Memes First
        </button>
        <div className="mt-3 text-enhanced-faint text-xs">
          Phantom & Solflare wallets supported
        </div>
      </div>
    );
  };

  // Stats cards with BV7X styling - Enhanced with live activity
  const StatsGrid = () => {
    const stats = [
      { label: 'Prize Pool', value: '12.7 SOL', subtext: '≈ $2,540 USD', color: 'text-yellow-400', trend: '📈 +2.1 SOL today' },
      { label: 'Active Voters', value: '5,247', subtext: 'This week', color: 'text-cyan-400', trend: '🔥 247 voting now' },
      { label: 'Next Draw', value: 'Sunday', subtext: '8PM UTC', color: 'text-pink-400', trend: '⏰ 2 days left' },
      { label: 'Winners Paid', value: '47.3 SOL', subtext: 'This month', color: 'text-green-400', trend: '💰 Last winner: 3.2 SOL' }
    ];

    return (
      <div className="responsive-grid-4">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card-enhanced group hover:scale-105 transition-transform duration-200">
            <div className="stat-label-enhanced">{stat.label}</div>
            <div className={`stat-value-enhanced ${stat.color}`}>{stat.value}</div>
            <div className="text-enhanced-faint text-xs">{stat.subtext}</div>
            <div className="text-enhanced-faint text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {stat.trend}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Social Proof Section
  const SocialProof = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      <div className="card-glass p-6 text-center">
        <div className="text-2xl mb-2">🎯</div>
        <div className="text-enhanced-high font-bold">Fair & Transparent</div>
        <div className="text-enhanced-medium text-sm mt-2">100% on-chain voting. No manipulation possible.</div>
      </div>
      <div className="card-glass p-6 text-center">
        <div className="text-2xl mb-2">⚡</div>
        <div className="text-enhanced-high font-bold">Instant Rewards</div>
        <div className="text-enhanced-medium text-sm mt-2">Earn 8-15 lottery tickets per vote. Weekly payouts.</div>
      </div>
      <div className="card-glass p-6 text-center">
        <div className="text-2xl mb-2">🏆</div>
        <div className="text-enhanced-high font-bold">Community Driven</div>
        <div className="text-enhanced-medium text-sm mt-2">Your votes literally create the next rare NFT.</div>
      </div>
    </div>
  );

  // User dashboard for connected users
  const UserDashboard = () => {
    if (!connected) return null;

    return (
      <div className="card-glass p-6 border-purple-500/30">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-enhanced-high font-bold text-lg">Your Dashboard</h3>
            <p className="text-enhanced-medium text-sm">Track your voting progress and earnings</p>
          </div>
          {/* Show toggle button only on mobile screens */}
          <button
            onClick={() => setShowStats(!showStats)}
            className="btn-ghost-enhanced text-sm lg:hidden"
          >
            {showStats ? 'Hide' : 'Show'} Stats
          </button>
        </div>

        {/* Stats are always visible on desktop (lg screens), toggleable on mobile */}
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 ${showStats ? 'block' : 'hidden lg:grid'}`}>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={scrollToVoting}
            className="btn-primary-enhanced"
          >
            🗳️ Vote on Today's Memes
          </button>
          <button className="btn-ghost-enhanced">
            📈 View My NFTs
          </button>
        </div>
      </div>
    );
  };

  // Voting interface with BV7X styling
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
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold heading-gradient mb-4">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

              <div className="p-6">
                <img
                  src={meme.image}
                  alt={meme.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
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
                    className="btn-primary-enhanced w-full"
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
      {/* Main Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="nav-enhanced">
          <div className="max-w-7xl mx-auto section-padding py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">🗳️</span>
                </div>
                <div>
                  <div className="text-enhanced-high font-bold text-xl">MemeForge</div>
                  <div className="text-enhanced-low text-xs mono">AI Dreams. Democracy Decides.</div>
                </div>
              </div>

              {/* Enhanced header wallet status with address and logout */}
              <div className="flex items-center space-x-4">
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
        <main className="max-w-7xl mx-auto section-padding py-8">
          {/* Hero Section - Enhanced */}
          <div className="text-center mb-12">
            <h1 className="text-5xl lg:text-7xl font-bold heading-gradient mb-6 leading-tight">
              Democratic NFT Rarity
            </h1>
            <p className="text-enhanced-medium text-xl leading-relaxed max-w-3xl mx-auto mb-8">
              The first platform where <strong className="text-enhanced-high">your votes determine NFT rarity</strong>. 
              AI creates, humans decide what becomes valuable. <strong className="text-purple-400">Earn SOL for every vote!</strong>
            </p>
            
            {/* Primary CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              {connected ? (
                <button
                  onClick={scrollToVoting}
                  className="btn-primary-enhanced text-lg px-8 py-3"
                >
                  🗳️ Start Voting Now
                </button>
              ) : (
                <SimplifiedSolanaWalletButton className="btn-primary-enhanced text-lg px-8 py-3">
                  🚀 Connect & Start Earning
                </SimplifiedSolanaWalletButton>
              )}
              <button
                onClick={scrollToVoting}
                className="btn-ghost-enhanced text-sm"
              >
                👀 Browse Today's Memes
              </button>
            </div>
            
            <div className="flex items-center justify-center space-x-8 text-enhanced-faint text-sm">
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                <span>100% On-chain</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                <span>Instant Payouts</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <span>Community Driven</span>
              </div>
            </div>
          </div>

          {/* How It Works Section - NEW */}
          <HowItWorksSection />

          {/* Social Proof - NEW */}
          <SocialProof />

          {/* Stats Overview - Enhanced */}
          <div className="mb-12">
            <StatsGrid />
          </div>

          {/* Wallet Connection / User Dashboard */}
          <div className="mb-12">
            {connected ? <UserDashboard /> : <WalletStatus />}
          </div>

          {/* Enhanced Tab Navigation - REPLACED OLD VERSION */}
          <EnhancedTabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Tab Content */}
          <div className="mb-12">
            {activeTab === 'vote' && <VotingInterface />}
            {activeTab === 'stats' && (
              <div className="card-glass p-8 text-center">
                <h3 className="text-enhanced-high font-bold text-lg mb-4">📊 Platform Statistics</h3>
                <p className="text-enhanced-medium">Detailed statistics and analytics coming soon!</p>
              </div>
            )}
            {activeTab === 'winners' && (
              <div className="card-glass p-8 text-center">
                <h3 className="text-enhanced-high font-bold text-lg mb-4">🏆 Recent Winners</h3>
                <p className="text-enhanced-medium">Winner announcements and prize distribution history coming soon!</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="text-center text-enhanced-faint">
            <div className="card-glass p-6">
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

export default BV7XStyledDashboard;