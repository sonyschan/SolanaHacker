import React, { useState } from 'react';
import WalletConnection from './WalletConnection';
import ForgeTab from './ForgeTab';

const Dashboard = ({ 
  userTickets, 
  votingStreak, 
  onDisconnectWallet,
  setUserTickets,
  setVotingStreak,
  walletAddress
}) => {
  const [activeTab, setActiveTab] = useState('forge');
  const [votingPhase, setVotingPhase] = useState('selection'); // 'selection', 'rarity', 'completed'
  const [selectedMeme, setSelectedMeme] = useState(null);
  const [hasVotedToday, setHasVotedToday] = useState(false);

  const tabs = [
    { id: 'forge', label: 'Forge', icon: '🤖', desc: 'Vote on today\'s memes' },
    { id: 'tickets', label: 'My Tickets', icon: '🎫', desc: 'Lottery entries' },
    { id: 'market', label: 'Market', icon: '🛒', desc: 'NFT auctions' }
  ];

  // Enhanced Forge Tab with proper 6-step cycle implementation
  const ForgeTabContent = () => {
    const memes = [
      { 
        id: 1, 
        title: "SOL to Jupiter 🚀", 
        votes: 127, 
        image: "🚀💰", 
        sentiment: "Bullish",
        source: "Twitter trending: #SOLToTheMoon"
      },
      { 
        id: 2, 
        title: "ETH Gas Fees Again? 😅", 
        votes: 98, 
        image: "⛽💸", 
        sentiment: "Frustrated",
        source: "Reddit r/ethereum complaints"
      },
      { 
        id: 3, 
        title: "DeFi Summer Returns", 
        votes: 156, 
        image: "☀️📈", 
        sentiment: "Optimistic",
        source: "CoinDesk: DeFi TVL surge"
      }
    ];

    const rarityLevels = [
      { name: 'Common', multiplier: '1x', votes: 45, color: 'gray' },
      { name: 'Uncommon', multiplier: '1.5x', votes: 32, color: 'green' },
      { name: 'Rare', multiplier: '2x', votes: 28, color: 'blue' },
      { name: 'Epic', multiplier: '3x', votes: 18, color: 'purple' },
      { name: 'Legendary', multiplier: '5x', votes: 12, color: 'yellow' }
    ];

    const handleMemeVote = (meme) => {
      setSelectedMeme(meme);
      setVotingPhase('rarity');
      
      // Reward tickets for meme selection
      const newTickets = Math.floor(Math.random() * 8) + 8; // 8-15 tickets
      setUserTickets(prev => prev + newTickets);
      
      // Show immediate feedback
      document.getElementById('ticket-animation').classList.add('animate-bounce');
      setTimeout(() => {
        document.getElementById('ticket-animation')?.classList.remove('animate-bounce');
      }, 1000);
    };

    const handleRarityVote = (rarity) => {
      setVotingPhase('completed');
      setHasVotedToday(true);
      setVotingStreak(prev => prev + 1);
      
      // Additional tickets for rarity vote
      const bonusTickets = Math.floor(Math.random() * 5) + 3; // 3-7 bonus tickets
      setUserTickets(prev => prev + bonusTickets);
      
      // Success animation
      setTimeout(() => {
        setVotingPhase('selection');
        setSelectedMeme(null);
        setHasVotedToday(false);
      }, 5000);
    };

    if (votingPhase === 'completed') {
      return (
        <div className="space-y-8">
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-3xl font-bold text-green-400 mb-4">Vote Completed!</h3>
            <p className="text-gray-300 mb-6">
              You voted for <strong className="text-white">"{selectedMeme?.title}"</strong> and helped decide its rarity.
            </p>
            <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-2xl text-cyan-400 font-bold">+{Math.floor(Math.random() * 8) + 8}</div>
                <div className="text-sm text-gray-400">Tickets Earned</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-2xl text-green-400 font-bold">{votingStreak}</div>
                <div className="text-sm text-gray-400">Day Streak</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-2xl text-purple-400 font-bold">24h</div>
                <div className="text-sm text-gray-400">Next Vote</div>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Come back tomorrow for new memes to vote on!
            </p>
          </div>
        </div>
      );
    }

    if (votingPhase === 'rarity') {
      return (
        <div className="space-y-8">
          {/* Selected Meme Display */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-4">🏆 Winner Selected!</h3>
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 rounded-xl p-6 max-w-md mx-auto">
                <div className="text-6xl mb-4">{selectedMeme?.image}</div>
                <h4 className="text-xl font-bold mb-2">{selectedMeme?.title}</h4>
                <p className="text-sm text-gray-400 mb-2">{selectedMeme?.votes} votes</p>
                <p className="text-xs text-yellow-400">{selectedMeme?.source}</p>
              </div>
            </div>

            {/* Rarity Voting */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h4 className="text-xl font-bold mb-6 text-center">
                🎯 Vote for NFT Rarity Level
              </h4>
              <p className="text-center text-gray-400 mb-6">
                Your vote determines this meme's rarity and reward multiplier
              </p>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {rarityLevels.map((rarity, index) => (
                  <button
                    key={rarity.name}
                    onClick={() => handleRarityVote(rarity)}
                    className={`p-4 rounded-lg font-semibold text-sm transition-all duration-300 hover:scale-105 border-2 ${
                      rarity.color === 'gray' ? 'bg-gray-600 hover:bg-gray-500 border-gray-400' :
                      rarity.color === 'green' ? 'bg-green-600 hover:bg-green-500 border-green-400' :
                      rarity.color === 'blue' ? 'bg-blue-600 hover:bg-blue-500 border-blue-400' :
                      rarity.color === 'purple' ? 'bg-purple-600 hover:bg-purple-500 border-purple-400' :
                      'bg-yellow-600 hover:bg-yellow-500 border-yellow-400'
                    }`}
                  >
                    <div className="text-lg mb-2">{rarity.name}</div>
                    <div className="text-xs mt-1 opacity-60">{rarity.votes} votes</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default: Meme Selection Phase
    return (
      <div className="space-y-8">
        {/* Daily Meme Battle */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-ping" />
              <span className="text-green-400 font-medium">Live Voting</span>
            </div>
            <h3 className="text-3xl font-bold mb-4">Today's Meme Battle 🥊</h3>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Vote for your favorite AI-generated meme. The winner becomes today's NFT!
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {memes.map((meme) => (
              <div key={meme.id} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 group">
                <div className="text-center">
                  {/* Replace emoji with actual image */}
                  {meme.imageUrl ? (
                    <img 
                      src={meme.imageUrl} 
                      alt={meme.title}
                      className="w-full h-64 object-cover rounded-lg mb-4 group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">{meme.image}</div>
                  )}
                  <h4 className="font-bold mb-2">{meme.title}</h4>
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-400">{meme.votes} votes</p>
                    <div className={`inline-block px-2 py-1 rounded text-xs ${
                      meme.sentiment === 'Bullish' ? 'bg-green-500/20 text-green-400' :
                      meme.sentiment === 'Frustrated' ? 'bg-red-500/20 text-red-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {meme.sentiment}
                    </div>
                    <p className="text-xs text-gray-500">{meme.source}</p>
                  </div>
                  <button 
                    onClick={() => handleMemeVote(meme)}
                    disabled={hasVotedToday}
                    className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg font-semibold hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group-hover:shadow-lg group-hover:shadow-cyan-500/25"
                  >
                    {hasVotedToday ? 'Already Voted' : 'Vote & Earn Tickets'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Voting Progress */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold">Voting Progress</h4>
              <span className="text-sm text-gray-400">Phase 1/2</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Total Votes Cast</span>
                <span className="text-cyan-400 font-bold">{memes.reduce((a, b) => a + b.votes, 0)}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full" style={{width: '67%'}} />
              </div>
              <p className="text-xs text-gray-500">Voting closes in 18h 42m</p>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Dashboard */}
        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl text-cyan-400 font-bold" id="ticket-animation">{userTickets}</div>
              <div className="text-2xl">🎫</div>
            </div>
            <div className="text-gray-400 text-sm">Total Tickets</div>
            <div className="text-cyan-300 text-xs mt-1">Each = 1 lottery entry</div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-400/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl text-green-400 font-bold">{votingStreak}</div>
              <div className="text-2xl">🔥</div>
            </div>
            <div className="text-gray-400 text-sm">Day Streak</div>
            <div className="text-green-300 text-xs mt-1">
              +{Math.min(votingStreak + 1, 15)} tickets tomorrow
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl text-purple-400 font-bold">12.7</div>
              <div className="text-2xl">🏆</div>
            </div>
            <div className="text-gray-400 text-sm">SOL Prize Pool</div>
            <div className="text-purple-300 text-xs mt-1">Weekly lottery</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-400/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl text-orange-400 font-bold">89</div>
              <div className="text-2xl">🎨</div>
            </div>
            <div className="text-gray-400 text-sm">NFTs Minted</div>
            <div className="text-orange-300 text-xs mt-1">1 per day limit</div>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Tickets Tab
  const TicketsTabContent = () => (
    <div className="space-y-8">
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 text-center">
        <div className="text-8xl text-yellow-400 mb-6">🎫</div>
        <div className="text-6xl text-yellow-400 font-bold mb-4">{userTickets}</div>
        <h3 className="text-2xl font-bold mb-4">Your Lottery Tickets</h3>
        <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
          Each ticket gives you one entry in the weekly SOL lottery. 
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
            <h4 className="font-bold mb-2 text-purple-400">Weekly Prize</h4>
            <div className="text-2xl font-bold mb-2">12.7 SOL</div>
            <p className="text-sm text-gray-400">Current lottery pool</p>
          </div>
        </div>

        <button className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg font-semibold hover:scale-105 transition-all duration-300 shadow-lg shadow-yellow-500/25">
          Check Last Week's Winners
        </button>
        
        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-400/20 rounded-lg">
          <p className="text-sm text-yellow-400">
            🗓️ Next lottery draw: Sunday at 12:00 UTC
          </p>
        </div>
      </div>

      {/* Lottery History */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
        <h4 className="text-xl font-bold mb-4">Recent Winners</h4>
        <div className="space-y-3">
          {[
            { week: 'Week 12', winner: '7vQx...k2P9', amount: '11.3 SOL', tickets: 1247 },
            { week: 'Week 11', winner: '9mR4...xL8A', amount: '9.8 SOL', tickets: 892 },
            { week: 'Week 10', winner: '3nK7...vM5B', amount: '13.1 SOL', tickets: 1456 }
          ].map((draw, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <div>
                <div className="font-medium">{draw.week}</div>
                <div className="text-sm text-gray-400">{draw.winner}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-green-400">{draw.amount}</div>
                <div className="text-xs text-gray-400">{draw.tickets} total tickets</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Enhanced Market Tab
  const MarketTabContent = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h3 className="text-3xl font-bold mb-4">🛒 NFT Marketplace</h3>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Community-voted meme NFTs with transparent auctions. 
          All sales feed back into the prize pool.
        </p>
      </div>

      {/* Live Auctions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { 
            id: 1, 
            title: "Legendary SOL Rocket", 
            rarity: "Legendary", 
            currentBid: "2.4 SOL", 
            image: "🚀🌙",
            timeLeft: "2h 15m",
            bidders: 12,
            votes: 234
          },
          { 
            id: 2, 
            title: "Epic DeFi Summer", 
            rarity: "Epic", 
            currentBid: "1.2 SOL", 
            image: "☀️📈",
            timeLeft: "1d 8h",
            bidders: 8,
            votes: 187
          },
          { 
            id: 3, 
            title: "Rare Gas Fee Pain", 
            rarity: "Rare", 
            currentBid: "0.8 SOL", 
            image: "⛽😢",
            timeLeft: "6h 42m",
            bidders: 15,
            votes: 156
          },
        ].map((nft) => (
          <div key={nft.id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 group">
            <div className="text-center">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">{nft.image}</div>
              <h4 className="font-bold mb-2">{nft.title}</h4>
              <div className={`inline-block px-3 py-1 rounded-lg text-sm font-medium mb-3 ${
                nft.rarity === 'Legendary' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-400/30' :
                nft.rarity === 'Epic' ? 'bg-purple-500/20 text-purple-400 border border-purple-400/30' :
                'bg-blue-500/20 text-blue-400 border border-blue-400/30'
              }`}>
                {nft.rarity}
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="text-2xl font-bold text-green-400">{nft.currentBid}</div>
                <div className="text-sm text-gray-400">{nft.bidders} bidders</div>
                <div className="text-xs text-gray-500">{nft.votes} community votes</div>
              </div>

              <div className="bg-white/5 rounded-lg p-3 mb-4">
                <div className="text-sm text-gray-400 mb-1">Auction ends in</div>
                <div className="font-bold text-orange-400">{nft.timeLeft}</div>
              </div>

              <button className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:scale-105 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-purple-500/25">
                Place Bid
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Market Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white/5 rounded-xl p-6 text-center">
          <div className="text-3xl text-cyan-400 font-bold mb-2">89</div>
          <div className="text-gray-400 text-sm">Total NFTs</div>
        </div>
        <div className="bg-white/5 rounded-xl p-6 text-center">
          <div className="text-3xl text-green-400 font-bold mb-2">0.8</div>
          <div className="text-gray-400 text-sm">Avg Price (SOL)</div>
        </div>
        <div className="bg-white/5 rounded-xl p-6 text-center">
          <div className="text-3xl text-purple-400 font-bold mb-2">67.3</div>
          <div className="text-gray-400 text-sm">Total Volume (SOL)</div>
        </div>
        <div className="bg-white/5 rounded-xl p-6 text-center">
          <div className="text-3xl text-orange-400 font-bold mb-2">80%</div>
          <div className="text-gray-400 text-sm">To Prize Pool</div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'forge':
        return <ForgeTab 
          userTickets={userTickets}
          setUserTickets={setUserTickets}
          votingStreak={votingStreak}
          setVotingStreak={setVotingStreak}
        />;
      case 'tickets':
        return <TicketsTabContent />;
      case 'market':
        return <MarketTabContent />;
      default:
        return <ForgeTab 
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
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/4 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Enhanced Header with better user info */}
      <header className="relative z-10 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <span className="text-2xl font-bold">M</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  MemeForge
                </h1>
                <div className="text-xs text-gray-500">Dashboard</div>
              </div>
            </div>
            
            {/* Enhanced User Info */}
            <div className="flex items-center space-x-6">
              <div className="hidden md:flex items-center space-x-6 px-6 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg">
                <div className="text-center">
                  <div className="text-sm text-gray-400">Tickets</div>
                  <div className="font-bold text-cyan-400 text-lg">{userTickets}</div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <div className="text-sm text-gray-400">Streak</div>
                  <div className="font-bold text-green-400 text-lg">{votingStreak} days</div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <div className="text-sm text-gray-400">Prize Pool</div>
                  <div className="font-bold text-purple-400 text-lg">12.7 SOL</div>
                </div>
              </div>
              
              <WalletConnection variant="secondary" showAddress={true} />
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Tab Navigation */}
      <nav className="relative z-10 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-8 py-4 font-medium transition-all duration-300 border-b-2 relative overflow-hidden group ${
                  activeTab === tab.id
                    ? 'text-cyan-400 border-cyan-400 bg-cyan-500/10'
                    : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="flex items-center space-x-3 relative z-10">
                  <span className="text-xl">{tab.icon}</span>
                  <div className="text-left">
                    <div>{tab.label}</div>
                    <div className="text-xs opacity-60">{tab.desc}</div>
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
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {renderTabContent()}
      </main>
    </div>
  );
};

export default Dashboard;