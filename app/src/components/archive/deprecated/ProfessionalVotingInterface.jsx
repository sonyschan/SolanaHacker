import React, { useState, useEffect } from 'react';
import SimplifiedSolanaWalletButton, { useSimplifiedSolanaWallet } from './SimplifiedSolanaWallet';
import RarityGauge from './RarityGauge';
import { useRewardToast } from './RewardToast';
import JackpotCounter from './JackpotCounter';

const ProfessionalVotingInterface = () => {
  const { connected, address } = useSimplifiedSolanaWallet();
  const [votedMemes, setVotedMemes] = useState(new Map()); // Changed to Map to store vote type
  const [userTickets, setUserTickets] = useState(156);
  const [animatingGauges, setAnimatingGauges] = useState(new Map()); // Track animations
  const [timeLeft, setTimeLeft] = useState({
    hours: 3,
    minutes: 24,
    seconds: 15
  });

  // Reward toast system
  const { showReward, ToastContainer } = useRewardToast();

  // Mock voting data for each meme
  const [memeVotes, setMemeVotes] = useState({
    1: { common: 89, rare: 156, legendary: 203 },
    2: { common: 134, rare: 267, legendary: 445 },
    3: { common: 67, rare: 123, legendary: 89 }
  });

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        }
        
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Simulate other users voting
  useEffect(() => {
    const interval = setInterval(() => {
      setMemeVotes(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(memeId => {
          const rarityTypes = ['common', 'rare', 'legendary'];
          const randomRarity = rarityTypes[Math.floor(Math.random() * 3)];
          if (Math.random() > 0.7) { // 30% chance of new vote
            updated[memeId] = {
              ...updated[memeId],
              [randomRarity]: updated[memeId][randomRarity] + 1
            };
          }
        });
        return updated;
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const stats = [
    {
      label: 'Active Voters',
      value: '5,247',
      subtext: 'This week',
      icon: '👥'
    },
    {
      label: 'Next Draw',
      value: 'Sunday',
      subtext: '8PM UTC',
      icon: '🗓️'
    },
    {
      label: 'Your Tickets',
      value: connected ? userTickets.toString() : '0',
      subtext: connected ? '3.1% win chance' : 'Connect wallet',
      icon: '🎫'
    }
  ];

  const mockMemes = [
    {
      id: 1,
      title: "When SOL hits $1000",
      image: "/generated/sample-meme-1-crypto-confusion.png",
      trending: true,
      ticketReward: { common: 8, rare: 12, legendary: 16 }
    },
    {
      id: 2,
      title: "DeFi Confusion 101",
      image: "/generated/sample-meme-2-sol-pump.png",
      trending: false,
      ticketReward: { common: 10, rare: 14, legendary: 18 }
    },
    {
      id: 3,
      title: "Diamond Hands Forever",
      image: "/generated/sample-meme-3-discord-mod.png",
      trending: false,
      ticketReward: { common: 6, rare: 10, legendary: 14 }
    }
  ];

  const handleVote = (memeId, voteType) => {
    if (!connected) {
      alert('Please connect your Solana wallet first to vote!');
      return;
    }

    const meme = mockMemes.find(m => m.id === memeId);
    if (!meme) return;

    // Update user's vote
    setVotedMemes(prev => new Map([...prev, [memeId, voteType]]));
    
    // Get ticket reward amount
    const ticketReward = meme.ticketReward[voteType];
    
    // Update ticket count
    setUserTickets(prev => prev + ticketReward);
    
    // Show reward toast animation
    showReward(ticketReward);
    
    // Trigger gauge animation
    setAnimatingGauges(prev => new Map([...prev, [memeId, voteType]]));
    
    // Update vote counts (simulate real-time update)
    setMemeVotes(prev => ({
      ...prev,
      [memeId]: {
        ...prev[memeId],
        [voteType]: prev[memeId][voteType] + 1
      }
    }));

    // Reset animation after delay
    setTimeout(() => {
      setAnimatingGauges(prev => {
        const newMap = new Map([...prev]);
        newMap.delete(memeId);
        return newMap;
      });
    }, 1500);
  };

  const getTotalVotes = (memeId) => {
    const votes = memeVotes[memeId];
    return votes.common + votes.rare + votes.legendary;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Reward Toast System */}
      <ToastContainer />
      
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">🗳️</span>
              </div>
              <div>
                <div className="text-white font-bold text-xl">MemeForge</div>
                <div className="text-zinc-400 text-sm">AI Dreams. Democracy Decides.</div>
              </div>
            </div>
            
            {/* Jackpot Counter in Header */}
            <div className="hidden lg:block">
              <JackpotCounter />
            </div>
            
            <SimplifiedSolanaWalletButton 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {connected ? (address ? `${address.slice(0, 4)}...${address.slice(-4)}` : 'Connected') : 'Connect Wallet'}
            </SimplifiedSolanaWalletButton>
          </div>
          
          {/* Mobile Jackpot Counter */}
          <div className="lg:hidden mt-4 flex justify-center">
            <JackpotCounter />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Wallet Connection Alert */}
        {!connected && (
          <div className="mb-8 bg-blue-600/10 border border-blue-600/20 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-blue-400 mr-3">ℹ️</div>
              <div>
                <div className="text-blue-300 font-medium">Connect your wallet to start voting</div>
                <div className="text-blue-400 text-sm">Vote on meme rarity to earn lottery tickets and win SOL rewards</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Header Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-zinc-400 text-sm">{stat.label}</span>
                <span className="text-lg">{stat.icon}</span>
              </div>
              <div className="text-white font-bold text-xl mb-1">{stat.value}</div>
              <div className="text-zinc-500 text-xs">{stat.subtext}</div>
            </div>
          ))}
        </div>

        {/* Countdown Timer */}
        <div className="text-center mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">Today's AI Memes</h1>
          <div className="inline-flex items-center bg-zinc-900 border border-zinc-800 rounded-lg px-6 py-3">
            <span className="text-zinc-400 mr-4">Voting ends in:</span>
            <div className="flex items-center space-x-2 text-white font-mono">
              <div className="bg-zinc-800 px-3 py-1 rounded">
                {String(timeLeft.hours).padStart(2, '0')}
              </div>
              <span>:</span>
              <div className="bg-zinc-800 px-3 py-1 rounded">
                {String(timeLeft.minutes).padStart(2, '0')}
              </div>
              <span>:</span>
              <div className="bg-zinc-800 px-3 py-1 rounded">
                {String(timeLeft.seconds).padStart(2, '0')}
              </div>
            </div>
          </div>
        </div>

        {/* Rarity Voting Explanation */}
        <div className="mb-8 bg-gradient-to-r from-purple-950/30 to-blue-950/30 border border-purple-800/50 rounded-lg p-6">
          <div className="flex items-center justify-center mb-4">
            <h2 className="text-xl font-bold text-purple-200 flex items-center">
              <span className="mr-3">⚡</span>
              Forge the Rarity, Shape the Value
            </h2>
          </div>
          <div className="text-center text-purple-300 text-sm max-w-2xl mx-auto">
            Your votes determine each meme's rarity before minting. Watch the gauge move as the community 
            decides whether this meme becomes Common 👍, Rare 💎, or Legendary 🏆 NFT!
          </div>
        </div>

        {/* Meme Voting Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {mockMemes.map((meme) => {
            const userVote = votedMemes.get(meme.id);
            const animatingTo = animatingGauges.get(meme.id);
            const totalVotes = getTotalVotes(meme.id);
            
            return (
              <div
                key={meme.id}
                className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-700 transition-colors"
              >
                {/* Trending Badge */}
                {meme.trending && (
                  <div className="relative">
                    <div className="absolute top-4 left-4 z-10">
                      <div className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium">
                        🔥 Trending
                      </div>
                    </div>
                  </div>
                )}

                {/* Meme Image */}
                <div className="relative">
                  <img
                    src={meme.image}
                    alt={meme.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div
                    className="w-full h-48 bg-zinc-800 hidden items-center justify-center text-zinc-500"
                  >
                    🖼️ Meme Image
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4">
                  <h3 className="text-white font-semibold mb-2">{meme.title}</h3>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-zinc-400 text-sm">
                      {totalVotes.toLocaleString()} votes
                    </span>
                    <div className="flex items-center text-xs text-zinc-500">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                      {Math.floor(Math.random() * 20) + 5} forging now
                    </div>
                  </div>

                  {/* Rarity Gauge */}
                  <div className="mb-4 bg-zinc-800/50 rounded-lg p-4">
                    <div className="text-center mb-2">
                      <div className="text-sm text-zinc-300 font-medium mb-3">Rarity Consensus</div>
                      <RarityGauge 
                        currentVotes={memeVotes[meme.id]}
                        animateToVote={animatingTo}
                        size="md"
                        className="mx-auto"
                      />
                    </div>
                  </div>

                  {/* Vote Buttons or Success State */}
                  {userVote ? (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                      <div className="text-green-400 font-medium text-sm mb-1">
                        ✅ Voted {userVote.charAt(0).toUpperCase() + userVote.slice(1)}!
                      </div>
                      <div className="text-green-300 text-xs mb-2">
                        +{meme.ticketReward[userVote]} lottery tickets earned
                      </div>
                      <div className="text-green-400 text-xs flex items-center justify-center">
                        <span className="mr-1">🔥</span>
                        You're forging this meme's rarity!
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-xs text-zinc-400 text-center">
                        Vote on rarity to earn tickets:
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { type: 'common', label: 'Common', icon: '👍', color: 'gray' },
                          { type: 'rare', label: 'Rare', icon: '💎', color: 'blue' },
                          { type: 'legendary', label: 'Legendary', icon: '🏆', color: 'purple' }
                        ].map((vote) => (
                          <button
                            key={vote.type}
                            onClick={() => handleVote(meme.id, vote.type)}
                            className={`p-3 rounded-lg text-xs font-medium transition-all hover:scale-105 border ${
                              connected 
                                ? `bg-zinc-800 hover:bg-${vote.color}-900/30 text-${vote.color}-300 border-${vote.color}-600/30 hover:border-${vote.color}-500`
                                : 'bg-zinc-700 text-zinc-400 cursor-not-allowed border-zinc-600'
                            }`}
                            disabled={!connected}
                          >
                            <div className="text-lg mb-1">{vote.icon}</div>
                            <div className="text-xs mb-1">{vote.label}</div>
                            <div className="text-xs text-zinc-400">
                              +{meme.ticketReward[vote.type]}
                            </div>
                          </button>
                        ))}
                      </div>
                      {!connected && (
                        <div className="text-xs text-zinc-500 text-center mt-2">
                          Connect wallet to vote and earn tickets
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Stats */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center bg-zinc-900 border border-zinc-800 rounded-lg px-6 py-3">
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-zinc-300">247 forging rarity now</span>
              </div>
              <div className="text-zinc-600">•</div>
              <div className="text-zinc-400">
                Next draw: Sunday 8PM UTC
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalVotingInterface;