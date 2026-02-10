import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const CardDashboard = () => {
  const { connected } = useWallet();
  const [userVote, setUserVote] = useState(null);
  const [userTickets, setUserTickets] = useState(0);
  const [showFAQ, setShowFAQ] = useState(false);
  const [openFAQ, setOpenFAQ] = useState(null);

  const todayMemes = [
    { id: 1, title: "SOL pump incoming", description: "When the charts look bullish", votes: 247, trend: "up" },
    { id: 2, title: "Explaining DeFi to normies", description: "It's complicated...", votes: 189, trend: "stable" },
    { id: 3, title: "NFT floor price reality", description: "This is fine", votes: 156, trend: "down" }
  ];

  const userStats = {
    tickets: 156,
    streak: 5,
    winnings: 2.34,
    rank: 42
  };

  const faqData = [
    {
      q: "How does MemeForge work?",
      a: "Our AI creates 3 crypto memes daily. You vote for your favorite and earn 8-15 lottery tickets for Sunday's SOL prize draw."
    },
    {
      q: "What do I win?",
      a: "Every Sunday we draw winners from all lottery tickets. Current prize pool is 12.7 SOL (~$2,540). All prizes are paid out on-chain."
    },
    {
      q: "How many tickets do I get per vote?",
      a: "Each vote earns you 8-15 random lottery tickets. More votes = more tickets = higher win chances."
    },
    {
      q: "When do I vote?",
      a: "New memes are released daily. You have 24 hours to vote before the next batch arrives."
    },
    {
      q: "Do I need to pay anything?",
      a: "Voting is completely free! Just connect your Solana wallet and start earning tickets."
    },
    {
      q: "How are winners chosen?",
      a: "Every Sunday at 8PM UTC, we randomly draw winning tickets using blockchain randomness. Winners are announced live."
    },
    {
      q: "What wallets are supported?",
      a: "All Solana wallets work: Phantom, Solflare, Backpack, etc. No special setup required."
    },
    {
      q: "Can I vote multiple times?",
      a: "One vote per day per meme. But voting daily builds your streak and increases your total tickets!"
    },
    {
      q: "How is the prize pool funded?",
      a: "Prize pools come from platform revenue (future premium features) and community contributions. 100% goes to winners."
    },
    {
      q: "What happens if I miss a day?",
      a: "No problem! Your existing tickets stay valid. But daily voting builds streaks for bonus rewards."
    }
  ];

  const handleVote = (memeId) => {
    setUserVote(memeId);
    setUserTickets(Math.floor(Math.random() * 8) + 8);
  };

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Modern Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">🗳️</span>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">MemeForge</div>
                <div className="text-xs text-purple-600 font-medium">Daily AI memes → Community votes → SOL prizes</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => setShowFAQ(!showFAQ)}
                className="hidden sm:flex items-center space-x-1 text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
              >
                <span>❓</span>
                <span>FAQ</span>
              </button>
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600 bg-green-50 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>18:42:33 left to vote today</span>
              </div>
              <WalletMultiButton className="!bg-gradient-to-r !from-purple-600 !to-blue-600 !rounded-xl !text-sm !shadow-md hover:!shadow-lg !transition-shadow" />
            </div>
          </div>
        </div>
      </header>

      {/* FAQ Section */}
      {showFAQ && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">🎯 Frequently Asked Questions</h2>
                <p className="text-gray-600 text-sm mt-1">Everything you need to know about earning SOL with memes</p>
              </div>
              <button
                onClick={() => setShowFAQ(false)}
                className="text-gray-500 hover:text-gray-700 text-xl transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {faqData.map((faq, index) => (
                <div key={index} className="bg-white/70 rounded-xl border border-gray-200">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-gray-900 text-sm">{faq.q}</span>
                    <span className="text-purple-600 ml-2 flex-shrink-0">
                      {openFAQ === index ? '−' : '+'}
                    </span>
                  </button>
                  {openFAQ === index && (
                    <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero Section with Value Prop */}
        <section className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Vote on AI Memes, Earn Real SOL
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-6">
            Join 1,247+ crypto enthusiasts voting on AI-generated memes daily. 
            Each vote earns you lottery tickets for our weekly SOL prize pool.
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-500">
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">✅ 100% payout rate</span>
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">🔒 Blockchain verified</span>
            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full">🚀 No signup required</span>
          </div>
        </section>

        {/* Hero Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {/* Prize Pool Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 sm:p-3 bg-yellow-100 rounded-xl">
                <div className="text-yellow-600 text-xl">💰</div>
              </div>
              <div className="text-green-600 text-xs sm:text-sm font-medium bg-green-50 px-2 py-1 rounded-full">
                +8.2% this week
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">12.7 SOL</div>
            <div className="text-gray-600 text-sm font-medium">Weekly Prize Pool</div>
            <div className="text-xs text-gray-500 mt-1">≈ $2,540 USD • Draws every Sunday</div>
          </div>

          {/* Active Voters Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-xl">
                <div className="text-blue-600 text-xl">👥</div>
              </div>
              <div className="text-blue-600 text-xs sm:text-sm font-medium bg-blue-50 px-2 py-1 rounded-full">
                247 voting now
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">1,247</div>
            <div className="text-gray-600 text-sm font-medium">Daily Participants</div>
            <div className="text-xs text-gray-500 mt-1">Your win odds: ~1 in 8 (12.5%)</div>
          </div>

          {/* Success Rate Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 sm:p-3 bg-purple-100 rounded-xl">
                <div className="text-purple-600 text-xl">📊</div>
              </div>
              <div className="text-purple-600 text-xs sm:text-sm font-medium bg-purple-50 px-2 py-1 rounded-full">
                Blockchain verified
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">100%</div>
            <div className="text-gray-600 text-sm font-medium">Payout Success Rate</div>
            <div className="text-xs text-gray-500 mt-1">All winners paid out on-chain</div>
          </div>
        </section>

        {/* Personal Dashboard Card */}
        {connected && (
          <section className="mb-8">
            <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold mb-2">Your Dashboard</h2>
                  <p className="text-purple-100">Track your lottery tickets and SOL earnings</p>
                </div>
                <div className="p-3 sm:p-4 bg-white/20 rounded-xl backdrop-blur">
                  <div className="text-2xl sm:text-3xl">🏆</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold mb-1">{userStats.tickets}</div>
                  <div className="text-purple-200 text-xs sm:text-sm">Lottery Tickets</div>
                  <div className="text-purple-300 text-xs mt-1">≈ 3.1% win chance</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold mb-1">{userStats.streak}</div>
                  <div className="text-purple-200 text-xs sm:text-sm">Daily Streak 🔥</div>
                  <div className="text-purple-300 text-xs mt-1">Keep it up!</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold mb-1">{userStats.winnings}</div>
                  <div className="text-purple-200 text-xs sm:text-sm">SOL Earned</div>
                  <div className="text-purple-300 text-xs mt-1">≈ ${(userStats.winnings * 200).toFixed(0)} USD</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold mb-1">#{userStats.rank}</div>
                  <div className="text-purple-200 text-xs sm:text-sm">Global Rank</div>
                  <div className="text-purple-300 text-xs mt-1">Top 5%</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Connect Wallet CTA for non-connected users */}
        {!connected && (
          <section className="mb-8">
            <div className="bg-gradient-to-r from-green-500 via-green-600 to-emerald-500 rounded-2xl p-6 sm:p-8 text-white text-center shadow-xl">
              <div className="text-4xl sm:text-5xl mb-4">🚀</div>
              <h2 className="text-xl sm:text-2xl font-bold mb-3">Ready to Start Earning SOL?</h2>
              <p className="text-green-100 mb-6 max-w-md mx-auto">
                Connect your Solana wallet to vote on today's memes and enter the weekly lottery draw with guaranteed payouts!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <WalletMultiButton className="!bg-white !text-green-600 !rounded-xl !font-bold !px-8 !py-3 !shadow-lg hover:!shadow-xl !transition-shadow" />
                <button
                  onClick={() => setShowFAQ(true)}
                  className="text-green-100 hover:text-white text-sm font-medium underline transition-colors"
                >
                  Read FAQ →
                </button>
              </div>
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Main Voting Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Today's AI Meme Battle</h2>
              <div className="text-xs sm:text-sm text-gray-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                ⏰ Voting ends in 18h 42m
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {todayMemes.map((meme, idx) => (
                <div key={meme.id} className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-4 sm:p-6">
                    <div className="flex items-start space-x-4">
                      {/* Meme Visual */}
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-md">
                          {idx === 0 ? '🚀' : idx === 1 ? '🤯' : '😅'}
                        </div>
                      </div>

                      {/* Meme Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900">{meme.title}</h3>
                          <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                            meme.trend === 'up' ? 'bg-green-100 text-green-800' :
                            meme.trend === 'down' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {meme.trend === 'up' ? '📈 Viral' : meme.trend === 'down' ? '📉 Fading' : '➡️ Steady'}
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">{meme.description}</p>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <span>🗳️</span>
                              <span className="font-medium">{meme.votes} votes</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span>⏰</span>
                              <span>Generated 2h ago</span>
                            </div>
                            <div className="flex items-center space-x-1 text-purple-600">
                              <span>🎫</span>
                              <span className="font-medium">8-15 tickets</span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleVote(meme.id)}
                            disabled={!connected || userVote === meme.id}
                            className={`px-4 sm:px-6 py-2 rounded-xl font-medium transition-all text-sm sm:text-base shadow-md hover:shadow-lg ${
                              userVote === meme.id
                                ? 'bg-green-100 text-green-800 border-2 border-green-300'
                                : connected
                                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 hover:scale-105'
                                : 'bg-gray-100 text-gray-500 cursor-not-allowed border-2 border-gray-200'
                            }`}
                          >
                            {userVote === meme.id ? '✅ Voted! (+12 tickets)' : connected ? 'Vote & Earn Tickets' : 'Connect Wallet to Vote'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Vote Success Card */}
            {userVote && (
              <div className="mt-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-4 sm:p-6 text-white shadow-xl">
                <div className="flex items-center space-x-4">
                  <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur">
                    <div className="text-2xl sm:text-3xl">🎉</div>
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold mb-1">Excellent choice!</h3>
                    <p className="text-green-100 text-sm sm:text-base">
                      You earned <strong>{userTickets} lottery tickets</strong> for this Sunday's 12.7 SOL drawing!
                    </p>
                    <p className="text-green-200 text-xs sm:text-sm mt-1">
                      Your win probability: ~{((userStats.tickets + userTickets) / 5247 * 100).toFixed(2)}% • Potential winnings: 12.7 SOL ($2,540)
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* FAQ Card (Mobile) */}
            <div className="block sm:hidden">
              <button
                onClick={() => setShowFAQ(!showFAQ)}
                className="w-full bg-purple-50 border-2 border-purple-200 text-purple-700 rounded-xl p-4 font-medium text-center hover:bg-purple-100 transition-colors"
              >
                ❓ How MemeForge Works
              </button>
            </div>

            {/* Next Draw Card */}
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-4 sm:p-6 text-white shadow-xl">
              <div className="flex items-center space-x-3 mb-4">
                <div className="text-xl sm:text-2xl">🎲</div>
                <h3 className="text-base sm:text-lg font-bold">Next Weekly Draw</h3>
              </div>
              
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold mb-2">Sunday 8PM</div>
                <div className="text-yellow-100 text-sm">UTC • Live streamed</div>
                <div className="text-xl sm:text-2xl font-bold mt-4">12.7 SOL</div>
                <div className="text-yellow-100 text-sm">Prize Pool ($2,540)</div>
                <div className="text-xs text-yellow-200 mt-2 bg-white/20 backdrop-blur px-2 py-1 rounded-full">
                  5,247 tickets competing
                </div>
              </div>
            </div>

            {/* Leaderboard Card */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-md border border-gray-100">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">🏆 Top Voters This Week</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-yellow-800 text-xs font-bold">1</span>
                    </div>
                    <span className="text-gray-900 text-sm font-medium">cryptomemer</span>
                  </div>
                  <span className="text-gray-700 text-sm font-bold">247 🎫</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 text-xs font-bold">2</span>
                    </div>
                    <span className="text-gray-900 text-sm font-medium">solholder99</span>
                  </div>
                  <span className="text-gray-600 text-sm">189 🎫</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 text-xs font-bold">3</span>
                    </div>
                    <span className="text-gray-900 text-sm font-medium">mememaster</span>
                  </div>
                  <span className="text-gray-600 text-sm">156 🎫</span>
                </div>
                
                {connected && (
                  <>
                    <div className="border-t border-gray-200 my-3"></div>
                    <div className="flex items-center justify-between bg-purple-50 p-3 rounded-xl border border-purple-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-purple-400 rounded-full flex items-center justify-center shadow-sm">
                          <span className="text-purple-800 text-xs font-bold">{userStats.rank}</span>
                        </div>
                        <span className="text-purple-900 text-sm font-medium">You</span>
                      </div>
                      <span className="text-purple-700 text-sm font-bold">{userStats.tickets} 🎫</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Recent Winners Card */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-md border border-gray-100">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">🎊 Recent Winners</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                  <span className="text-gray-600">Last Sunday</span>
                  <span className="text-green-700 font-bold">8.4 SOL won</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Jan 26</span>
                  <span className="text-green-600 font-medium">11.2 SOL</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Jan 19</span>
                  <span className="text-green-600 font-medium">9.8 SOL</span>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-100 text-center">
                <div className="text-xs text-gray-500">
                  Total paid out this month: <strong className="text-green-600">47.3 SOL</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom CTA */}
      {!connected && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-blue-600 border-t-4 border-purple-400 p-4 sm:hidden shadow-2xl">
          <div className="text-center mb-3">
            <div className="text-white font-bold text-sm">🎯 Start earning SOL today!</div>
            <div className="text-purple-200 text-xs">Join 1,247 daily voters</div>
          </div>
          <WalletMultiButton className="w-full !bg-white !text-purple-600 !rounded-xl !py-3 !font-bold !shadow-lg" />
        </div>
      )}
    </div>
  );
};

export default CardDashboard;