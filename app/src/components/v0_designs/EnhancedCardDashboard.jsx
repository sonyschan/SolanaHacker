import React, { useState, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import ProminentWalletConnection from '../ProminentWalletConnection';
import ValuePropositionSection from '../ValuePropositionSection';
import EnhancedVotingSection from '../EnhancedVotingSection';
import WalletConnectionDemo from '../WalletConnectionDemo';
import { SOLTooltip, TicketsTooltip } from '../Web3Tooltip';

const EnhancedCardDashboard = () => {
  const { connected } = useWallet();
  const [showFAQ, setShowFAQ] = useState(false);
  const [openFAQ, setOpenFAQ] = useState(null);
  const votingRef = useRef(null);

  const scrollToVoting = () => {
    if (votingRef.current) {
      votingRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

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
    }
  ];

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Wallet Connection Demo - Shows Current State */}
      <WalletConnectionDemo />

      {/* Navigation Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            {/* Logo - responsive sizing */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm sm:text-lg">🗳️</span>
              </div>
              <div>
                <div className="text-lg sm:text-xl font-bold text-gray-900">MemeForge</div>
                <div className="text-xs text-purple-600 font-medium hidden sm:block">AI Dreams. Humans Decide.</div>
              </div>
            </div>

            {/* Navigation - responsive layout */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => setShowFAQ(!showFAQ)}
                className="flex items-center space-x-1 text-xs sm:text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors px-2 sm:px-3 py-2 rounded-lg hover:bg-purple-50"
              >
                <span>❓</span>
                <span className="hidden sm:inline">FAQ</span>
              </button>
              
              <button
                onClick={scrollToVoting}
                className="hidden md:flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-blue-50"
              >
                <span>🗳️</span>
                <span>Vote Now</span>
              </button>

              {/* Prominent Wallet Connection - now mobile responsive */}
              <ProminentWalletConnection />
            </div>
          </div>
        </div>
      </header>

      {/* Connection Status Banner for First-Time Users */}
      {!connected && (
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white py-3 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex items-center justify-center space-x-2 text-xs sm:text-sm">
              <span className="animate-pulse">⚡</span>
              <span className="font-semibold">Connect your wallet above to start earning SOL prizes!</span>
              <span className="hidden sm:inline">→</span>
              <button 
                onClick={scrollToVoting}
                className="underline hover:no-underline font-medium text-xs sm:text-sm"
              >
                See how it works
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Section - improved mobile layout */}
      {showFAQ && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
            <div className="flex items-start justify-between mb-4 sm:mb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">🎯 FAQ</h2>
                <p className="text-gray-600 text-xs sm:text-sm mt-1">Everything you need to know about earning <SOLTooltip>SOL</SOLTooltip> with memes</p>
              </div>
              <button
                onClick={() => setShowFAQ(false)}
                className="text-gray-500 hover:text-gray-700 text-xl transition-colors p-1"
              >
                ×
              </button>
            </div>
            
            {/* Mobile: single column, Desktop: two columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {faqData.map((faq, index) => (
                <div key={index} className="bg-white/70 rounded-xl border border-gray-200">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full p-3 sm:p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-gray-900 text-xs sm:text-sm pr-2">{faq.q}</span>
                    <span className="text-purple-600 flex-shrink-0">
                      {openFAQ === index ? '−' : '+'}
                    </span>
                  </button>
                  {openFAQ === index && (
                    <div className="px-3 sm:px-4 pb-3 sm:pb-4 text-xs sm:text-sm text-gray-600 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Value Proposition Section - New! */}
      <ValuePropositionSection onScrollToVoting={scrollToVoting} />

      {/* Personal Dashboard for Connected Users - Mobile optimized */}
      {connected && (
        <section className="py-8 sm:py-12 bg-gradient-to-br from-slate-50 to-purple-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold mb-2">🎉 Welcome Back!</h2>
                  <p className="text-purple-100 text-sm sm:text-base">Your personal dashboard - Track your <TicketsTooltip>lottery tickets</TicketsTooltip> and <SOLTooltip>SOL</SOLTooltip> earnings</p>
                </div>
                <div className="p-3 sm:p-4 bg-white/20 rounded-xl sm:rounded-2xl backdrop-blur">
                  <div className="text-2xl sm:text-3xl">🏆</div>
                </div>
              </div>
              
              {/* Responsive stats grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="text-center bg-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 backdrop-blur">
                  <div className="text-2xl sm:text-3xl font-bold mb-1 text-yellow-300">{userStats.tickets}</div>
                  <div className="text-purple-200 text-xs sm:text-sm"><TicketsTooltip>Lottery Tickets</TicketsTooltip></div>
                  <div className="text-purple-300 text-xs mt-1">≈ 3.1% win chance</div>
                </div>
                <div className="text-center bg-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 backdrop-blur">
                  <div className="text-2xl sm:text-3xl font-bold mb-1 text-orange-300">{userStats.streak}</div>
                  <div className="text-purple-200 text-xs sm:text-sm">Daily Streak 🔥</div>
                  <div className="text-purple-300 text-xs mt-1">Keep it up!</div>
                </div>
                <div className="text-center bg-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 backdrop-blur">
                  <div className="text-2xl sm:text-3xl font-bold mb-1 text-green-300">{userStats.winnings}</div>
                  <div className="text-purple-200 text-xs sm:text-sm"><SOLTooltip>SOL</SOLTooltip> Earned</div>
                  <div className="text-purple-300 text-xs mt-1">≈ ${(userStats.winnings * 200).toFixed(0)} USD</div>
                </div>
                <div className="text-center bg-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 backdrop-blur">
                  <div className="text-2xl sm:text-3xl font-bold mb-1 text-blue-300">#{userStats.rank}</div>
                  <div className="text-purple-200 text-xs sm:text-sm">Global Rank</div>
                  <div className="text-purple-300 text-xs mt-1">Top 5%</div>
                </div>
              </div>

              <div className="mt-4 sm:mt-6 text-center">
                <div className="text-purple-200 text-xs sm:text-sm">🎯 Your next vote earns 8-15 more tickets!</div>
                <button 
                  onClick={scrollToVoting}
                  className="mt-2 bg-white/20 hover:bg-white/30 text-white px-4 sm:px-6 py-2 rounded-full font-medium transition-colors backdrop-blur text-sm sm:text-base"
                >
                  Vote Now →
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Enhanced Voting Section */}
      <div ref={votingRef}>
        <EnhancedVotingSection />
      </div>

      {/* Sidebar Content as Full Width Sections - Mobile optimized */}
      <section className="py-8 sm:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            
            {/* Next Draw */}
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-xl">
              <div className="flex items-center space-x-3 mb-4">
                <div className="text-xl sm:text-2xl">🎲</div>
                <h3 className="text-base sm:text-lg font-bold">Next Weekly Draw</h3>
              </div>
              
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold mb-2">Sunday 8PM</div>
                <div className="text-yellow-100 text-xs sm:text-sm">UTC • Live streamed</div>
                <div className="text-xl sm:text-2xl font-bold mt-4"><SOLTooltip>12.7 SOL</SOLTooltip></div>
                <div className="text-yellow-100 text-xs sm:text-sm">Prize Pool ($2,540)</div>
                <div className="text-xs text-yellow-200 mt-2 bg-white/20 backdrop-blur px-2 py-1 rounded-full">
                  5,247 <TicketsTooltip>tickets</TicketsTooltip> competing
                </div>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg border border-gray-100">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">🏆 Top Voters This Week</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 sm:p-3 bg-yellow-50 rounded-xl sm:rounded-2xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-yellow-800 text-xs font-bold">1</span>
                    </div>
                    <span className="text-gray-900 font-medium text-sm">cryptomemer</span>
                  </div>
                  <span className="text-gray-700 font-bold text-sm">247 🎫</span>
                </div>
                
                <div className="flex items-center justify-between p-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 text-xs font-bold">2</span>
                    </div>
                    <span className="text-gray-900 font-medium text-sm">solholder99</span>
                  </div>
                  <span className="text-gray-600 text-sm">189 🎫</span>
                </div>
                
                <div className="flex items-center justify-between p-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 text-xs font-bold">3</span>
                    </div>
                    <span className="text-gray-900 font-medium text-sm">mememaster</span>
                  </div>
                  <span className="text-gray-600 text-sm">156 🎫</span>
                </div>
                
                {connected && (
                  <>
                    <div className="border-t border-gray-200 my-3"></div>
                    <div className="flex items-center justify-between bg-purple-50 p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-purple-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-400 rounded-full flex items-center justify-center shadow-sm">
                          <span className="text-purple-800 text-xs font-bold">{userStats.rank}</span>
                        </div>
                        <span className="text-purple-900 font-medium text-sm">You</span>
                      </div>
                      <span className="text-purple-700 font-bold text-sm">{userStats.tickets} 🎫</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Recent Winners */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg border border-gray-100">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">🎊 Recent Winners</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                  <span className="text-gray-600 text-xs sm:text-sm">Last Sunday</span>
                  <span className="text-green-700 font-bold text-xs sm:text-sm">8.4 <SOLTooltip>SOL</SOLTooltip> won</span>
                </div>
                <div className="flex items-center justify-between p-1">
                  <span className="text-gray-600 text-xs sm:text-sm">Jan 26</span>
                  <span className="text-green-600 font-medium text-xs sm:text-sm">11.2 <SOLTooltip>SOL</SOLTooltip></span>
                </div>
                <div className="flex items-center justify-between p-1">
                  <span className="text-gray-600 text-xs sm:text-sm">Jan 19</span>
                  <span className="text-green-600 font-medium text-xs sm:text-sm">9.8 <SOLTooltip>SOL</SOLTooltip></span>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-100 text-center">
                <div className="text-xs text-gray-500">
                  Total paid out this month: <strong className="text-green-600">47.3 <SOLTooltip>SOL</SOLTooltip></strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EnhancedCardDashboard;