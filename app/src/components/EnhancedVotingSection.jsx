import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const EnhancedVotingSection = () => {
  const { connected } = useWallet();
  const [userVote, setUserVote] = useState(null);
  const [userTickets, setUserTickets] = useState(0);
  const [isVoting, setIsVoting] = useState(false);

  const todayMemes = [
    { 
      id: 1, 
      title: "SOL to the Moon! 🚀", 
      description: "When you see that green candle", 
      votes: 247, 
      trend: "up",
      category: "Bullish",
      emoji: "🚀"
    },
    { 
      id: 2, 
      title: "DeFi Life Explained", 
      description: "\"It's not gambling, it's yield farming\"", 
      votes: 189, 
      trend: "stable",
      category: "Relatable", 
      emoji: "🤯"
    },
    { 
      id: 3, 
      title: "Diamond Hands Reality", 
      description: "Holding through the dip like...", 
      votes: 156, 
      trend: "down",
      category: "Emotional",
      emoji: "💎"
    }
  ];

  const handleVote = async (memeId) => {
    if (!connected || isVoting || userVote) return;
    
    try {
      setIsVoting(true);
      
      // Show immediate visual feedback
      setUserVote(memeId);
      
      // Simulate vote processing with delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate ticket rewards
      const ticketsEarned = Math.floor(Math.random() * 8) + 8;
      setUserTickets(ticketsEarned);
      
      // In a real app, this would call:
      // await submitVote(memeId);
      // await updateUserStats();
      
      console.log(`✅ Vote submitted for meme ${memeId}, earned ${ticketsEarned} tickets`);
      
    } catch (error) {
      console.error('Vote failed:', error);
      // Reset on error
      setUserVote(null);
      setUserTickets(0);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <section className="py-12 sm:py-20 bg-gradient-to-br from-slate-50 to-blue-50" id="voting-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <span>⏰</span>
            <span>Voting ends in 18h 42m</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Today's Meme Battle
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Vote for your favorite AI-generated crypto meme and earn lottery tickets for this Sunday's SOL prize draw
          </p>
        </div>

        {/* Voting Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-12">
          {todayMemes.map((meme, idx) => (
            <div key={meme.id} className="group relative">
              {/* Meme Card */}
              <div className={`relative bg-white rounded-3xl shadow-lg border-2 transition-all duration-300 overflow-hidden ${
                userVote === meme.id 
                  ? 'border-green-500 shadow-green-100 shadow-2xl transform scale-105' 
                  : 'border-gray-200 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-100'
              }`}>
                
                {/* Vote Success Badge */}
                {userVote === meme.id && (
                  <div className="absolute -top-3 -right-3 bg-green-500 text-white p-2 rounded-full shadow-lg z-10">
                    <span className="text-lg">✅</span>
                  </div>
                )}

                <div className="p-6 sm:p-8">
                  {/* Meme Visual & Category */}
                  <div className="text-center mb-6">
                    <div className={`w-24 h-24 mx-auto rounded-3xl flex items-center justify-center text-4xl shadow-lg mb-4 ${
                      idx === 0 ? 'bg-gradient-to-br from-green-100 to-emerald-200' :
                      idx === 1 ? 'bg-gradient-to-br from-blue-100 to-cyan-200' :
                      'bg-gradient-to-br from-purple-100 to-pink-200'
                    }`}>
                      {meme.emoji}
                    </div>
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      meme.trend === 'up' ? 'bg-green-100 text-green-800' :
                      meme.trend === 'down' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {meme.category} • {meme.trend === 'up' ? '📈 Trending' : meme.trend === 'down' ? '📉 Fading' : '➡️ Steady'}
                    </div>
                  </div>

                  {/* Meme Content */}
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{meme.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{meme.description}</p>
                  </div>

                  {/* Stats */}
                  <div className="flex justify-center items-center space-x-4 text-sm text-gray-500 mb-6">
                    <div className="flex items-center space-x-1">
                      <span>🗳️</span>
                      <span className="font-medium">{meme.votes}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>🎫</span>
                      <span className="font-medium text-purple-600">8-15 tickets</span>
                    </div>
                  </div>

                  {/* Vote Button - ENHANCED with better feedback */}
                  <div className="text-center">
                    {connected ? (
                      <button
                        onClick={() => handleVote(meme.id)}
                        disabled={userVote && userVote !== meme.id}
                        className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-200 relative overflow-hidden ${
                          userVote === meme.id
                            ? 'bg-green-500 text-white shadow-lg'
                            : userVote
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : isVoting
                            ? 'bg-gray-400 text-white cursor-wait'
                            : `bg-gradient-to-r ${
                                idx === 0 ? 'from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600' :
                                idx === 1 ? 'from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600' :
                                'from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                              } text-white shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95`
                        }`}
                        style={{
                          transform: userVote === meme.id ? 'scale(1.05)' : 
                                   isVoting ? 'scale(0.98)' : 'scale(1)'
                        }}
                      >
                        {userVote === meme.id 
                          ? `✅ Voted! (+${userTickets} tickets)`
                          : userVote 
                          ? 'Already Voted' 
                          : isVoting
                          ? '⏳ Processing Vote...'
                          : '🗳️ Vote & Earn Tickets'
                        }
                      </button>
                    ) : (
                      <div className="text-center">
                        <WalletMultiButton className="w-full !bg-gradient-to-r !from-purple-600 !to-blue-600 !rounded-2xl !py-4 !text-lg !font-bold" />
                        <p className="text-gray-500 text-xs mt-2">Connect to vote</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Vote Success Celebration */}
        {userVote && (
          <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-3xl p-8 text-white text-center shadow-2xl animate-bounce">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold mb-2">Excellent Choice!</h3>
            <p className="text-green-100 text-lg mb-4">
              You earned <strong>{userTickets} lottery tickets</strong> for this Sunday's 12.7 SOL drawing!
            </p>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 inline-block">
              <div className="text-sm text-green-100 mb-1">Your estimated win probability</div>
              <div className="text-2xl font-bold">~2.8%</div>
              <div className="text-xs text-green-200">Potential winnings: 12.7 SOL ($2,540)</div>
            </div>
            
            {/* Share Success */}
            <div className="mt-4">
              <button className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-full font-medium transition-colors backdrop-blur text-sm">
                🔗 Share Your Vote
              </button>
            </div>
          </div>
        )}

        {/* Bottom CTA for non-connected users */}
        {!connected && (
          <div className="text-center mt-12">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-8 text-white shadow-2xl">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold mb-2">Ready to Start Earning?</h3>
              <p className="text-purple-100 mb-6 max-w-md mx-auto">
                Connect your Solana wallet to vote on memes and enter the weekly lottery with guaranteed payouts
              </p>
              <WalletMultiButton className="!bg-white !text-purple-600 !rounded-2xl !px-8 !py-4 !text-lg !font-bold !shadow-lg hover:!bg-gray-100 !transition-colors" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default EnhancedVotingSection;