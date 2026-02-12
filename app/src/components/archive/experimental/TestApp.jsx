import React from 'react';
import { SimplifiedSolanaWalletProvider } from './components/SimplifiedSolanaWallet';
import ProfessionalVotingInterface from './components/ProfessionalVotingInterface';

// Test version of ProfessionalVotingInterface with mocked wallet
const TestProfessionalVotingInterface = () => {
  const [votedMemes, setVotedMemes] = React.useState(new Map());
  const [userTickets, setUserTickets] = React.useState(156);
  const [animatingGauges, setAnimatingGauges] = React.useState(new Map());
  const [timeLeft, setTimeLeft] = React.useState({
    hours: 3,
    minutes: 24,
    seconds: 15
  });

  // Mock wallet state (always connected for testing)
  const mockWallet = {
    connected: true,
    address: 'ABC123...XYZ789',
    walletName: 'Test Wallet'
  };

  // Mock voting data for each meme
  const [memeVotes, setMemeVotes] = React.useState({
    1: { common: 89, rare: 156, legendary: 203 },
    2: { common: 134, rare: 267, legendary: 445 },
    3: { common: 67, rare: 123, legendary: 89 }
  });

  // Countdown timer
  React.useEffect(() => {
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

  // Test stats (simplified)
  const stats = [
    { label: 'Active Voters', value: '5,247', subtext: 'This week', icon: '👥' },
    { label: 'Next Draw', value: 'Sunday', subtext: '8PM UTC', icon: '🗓️' },
    { label: 'Your Tickets', value: userTickets.toString(), subtext: '3.1% win chance', icon: '🎫' }
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
    console.log(`🧪 TEST: Voting ${voteType} on meme ${memeId}`);
    
    const meme = mockMemes.find(m => m.id === memeId);
    if (!meme) return;

    // Update user's vote
    setVotedMemes(prev => new Map([...prev, [memeId, voteType]]));
    
    // Get ticket reward amount
    const ticketReward = meme.ticketReward[voteType];
    
    // Update ticket count
    setUserTickets(prev => prev + ticketReward);
    
    // Show success message
    alert(`🎉 Vote recorded! +${ticketReward} tickets earned`);
    
    // Trigger gauge animation
    setAnimatingGauges(prev => new Map([...prev, [memeId, voteType]]));
    
    // Update vote counts
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
      {/* Test Mode Banner */}
      <div className="fixed top-4 right-4 z-50 bg-yellow-600 text-white px-3 py-1 rounded text-sm">
        🧪 TEST MODE - Wallet Connected
      </div>
      
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
            
            <div className="bg-green-600 text-white font-medium px-4 py-2 rounded-lg flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-300 rounded-full"></div>
              <span>Test Wallet Connected</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
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

        {/* Test Success Message */}
        <div className="mb-8 bg-green-600/10 border border-green-600/20 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-400 mr-3">✅</div>
            <div>
              <div className="text-green-300 font-medium">MVP Test Mode Active</div>
              <div className="text-green-400 text-sm">Wallet connection bypassed. All voting functions enabled for testing.</div>
            </div>
          </div>
        </div>

        {/* Meme Voting Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {mockMemes.map((meme) => {
            const userVote = votedMemes.get(meme.id);
            const totalVotes = getTotalVotes(meme.id);
            
            return (
              <div key={meme.id} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                
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
                  <div className="w-full h-48 bg-zinc-800 hidden items-center justify-center text-zinc-500">
                    🖼️ {meme.title}
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
                      Live voting
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
                      <div className="text-green-400 text-xs">🔥 Rarity forged successfully!</div>
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
                            className="p-3 rounded-lg text-xs font-medium transition-all hover:scale-105 border bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-600 hover:border-zinc-500"
                          >
                            <div className="text-lg mb-1">{vote.icon}</div>
                            <div className="text-xs mb-1">{vote.label}</div>
                            <div className="text-xs text-zinc-400">
                              +{meme.ticketReward[vote.type]}
                            </div>
                          </button>
                        ))}
                      </div>
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
                <span className="text-zinc-300">Test mode active</span>
              </div>
              <div className="text-zinc-600">•</div>
              <div className="text-zinc-400">All functions enabled</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function TestApp() {
  const isTestMode = window.location.search.includes('test=true');
  
  if (isTestMode) {
    return <TestProfessionalVotingInterface />;
  }

  // Normal production mode
  return (
    <SimplifiedSolanaWalletProvider>
      <ProfessionalVotingInterface />
    </SimplifiedSolanaWalletProvider>
  );
}

export default TestApp;