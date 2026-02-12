import React, { useState } from 'react';

const VotingDemoSection = ({ onScrollToVoting }) => {
  const [demoVote, setDemoVote] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [ticketsEarned, setTicketsEarned] = useState(0);

  // Simulate the improved ticket system for demo
  const simulateTicketsEarned = (consecutiveDays = 3) => {
    let baseMin, baseMax;
    
    if (consecutiveDays >= 8) {
      baseMin = 10;
      baseMax = 15;
    } else if (consecutiveDays >= 4) {
      baseMin = 9;
      baseMax = 13;
    } else {
      baseMin = 8;
      baseMax = 12;
    }
    
    return Math.floor(Math.random() * (baseMax - baseMin + 1)) + baseMin;
  };

  const handleDemoVote = (voteType) => {
    setDemoVote(voteType);
    const tickets = simulateTicketsEarned();
    setTicketsEarned(tickets);
    setShowSuccess(true);
    
    setTimeout(() => {
      setShowSuccess(false);
      setTimeout(() => setDemoVote(null), 500);
    }, 2000);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-white mb-4">
          🎮 Try the Voting System
        </h2>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          See exactly how voting works! Rate this AI-generated meme and experience the interface before connecting your wallet.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800 rounded-xl border-2 border-blue-600 p-8">
          
          {/* Demo Header */}
          <div className="text-center mb-6">
            <div className="inline-block bg-blue-900 text-blue-200 px-4 py-2 rounded-full text-sm font-medium mb-4">
              🧪 INTERACTIVE DEMO
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Rate This AI Meme</h3>
            <p className="text-gray-300 text-sm">
              Click any button to see how voting works
            </p>
          </div>

          {/* Meme Display */}
          <div className="mb-8">
            <div className="aspect-square bg-gray-900 rounded-lg overflow-hidden border border-gray-600 mb-4">
              <img 
                src="/generated/meme-preview-ai-confusion.png"
                alt="Demo meme for voting"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden w-full h-full flex-col items-center justify-center text-gray-400">
                <div className="text-6xl mb-4">🤖</div>
                <div className="text-xl font-medium text-center">AI-Generated Meme</div>
                <div className="text-sm text-gray-500 mt-2">When AI tries to understand humor</div>
              </div>
            </div>
            
            <div className="text-center">
              <h4 className="text-lg font-medium text-white mb-2">
                "When AI tries to understand human humor"
              </h4>
              <p className="text-gray-400 text-sm">
                Generated today by AI • Your vote determines its rarity level
              </p>
            </div>
          </div>

          {/* Voting Buttons - Updated with no specific ticket numbers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { 
                type: 'common', 
                label: 'Common', 
                icon: '👍', 
                color: 'gray',
                reward: 'Random tickets',
                desc: 'Standard meme'
              },
              { 
                type: 'rare', 
                label: 'Rare', 
                icon: '💎', 
                color: 'blue',
                reward: 'Random tickets',
                desc: 'Above average'
              },
              { 
                type: 'legendary', 
                label: 'Legendary', 
                icon: '🏆', 
                color: 'purple',
                reward: 'Random tickets',
                desc: 'Exceptional quality'
              }
            ].map((vote) => (
              <button
                key={vote.type}
                onClick={() => handleDemoVote(vote.type)}
                disabled={showSuccess}
                className={`relative p-6 rounded-xl border-2 transition-all duration-300 ${
                  demoVote === vote.type
                    ? `border-${vote.color}-400 bg-${vote.color}-950 scale-105`
                    : showSuccess
                    ? 'border-gray-600 bg-gray-800 opacity-60'
                    : `border-gray-600 hover:border-${vote.color}-400 hover:bg-${vote.color}-950 hover:scale-105 cursor-pointer`
                }`}
              >
                {demoVote === vote.type && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg">
                    ✓
                  </div>
                )}
                
                <div className="text-center">
                  <div className="text-4xl mb-3">{vote.icon}</div>
                  <div className={`text-xl font-bold mb-2 ${
                    vote.type === 'common' ? 'text-gray-200' :
                    vote.type === 'rare' ? 'text-blue-300' :
                    'text-purple-300'
                  }`}>
                    {vote.label}
                  </div>
                  <div className="text-white font-bold text-sm mb-1">{vote.reward}</div>
                  <div className="text-gray-300 text-xs">{vote.desc}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Success Message - Updated with random tickets */}
          {showSuccess && (
            <div className="bg-green-950 border border-green-800 rounded-lg p-6 text-center mb-6 transition-all">
              <div className="text-4xl mb-3">🎉</div>
              <div className="text-green-300 font-bold text-xl mb-2">
                Demo Vote Cast!
              </div>
              <div className="text-white mb-2">
                You would earn <strong className="text-yellow-400">
                  {ticketsEarned} lottery tickets
                </strong> (random range: 8-12)
              </div>
              <div className="text-sm text-green-200">
                Connect your wallet to vote on real memes and earn SOL rewards!
              </div>
            </div>
          )}

          {/* Updated Explanation - Focus on fairness and participation */}
          <div className="bg-blue-950 border border-blue-800 rounded-lg p-6 mb-6">
            <div className="text-blue-300 font-medium mb-3 flex items-center">
              <span className="mr-2">💡</span>
              Fair Voting System
            </div>
            <div className="text-blue-100 text-sm space-y-2">
              <p>• <strong>Equal Opportunity:</strong> All voting choices give the same random reward range (8-12 tickets)</p>
              <p>• <strong>Participation Bonus:</strong> Vote daily to unlock better ticket ranges (up to 10-15)</p>
              <p>• <strong>Community Consensus:</strong> Most votes determine the final NFT rarity level</p>
              <p>• <strong>No Bias:</strong> Vote honestly - your reward doesn't depend on picking the "winner"</p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <button
              onClick={onScrollToVoting}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all duration-300 hover:scale-105 mb-4"
            >
              🚀 Vote on Real Memes & Earn SOL
            </button>
            <div className="text-gray-300 text-sm">
              Connect wallet → Vote on today's memes → Earn lottery tickets → Win SOL rewards
            </div>
          </div>
        </div>
      </div>

      {/* Visual Stats */}
      <div className="mt-12 max-w-4xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-2xl font-bold text-blue-400 mb-1">1,247</div>
            <div className="text-xs text-gray-300">votes today</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-2xl font-bold text-green-400 mb-1">47.3</div>
            <div className="text-xs text-gray-300">SOL prize pool</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-2xl font-bold text-purple-400 mb-1">3</div>
            <div className="text-xs text-gray-300">new memes daily</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-2xl font-bold text-yellow-400 mb-1">24h</div>
            <div className="text-xs text-gray-300">voting period</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VotingDemoSection;