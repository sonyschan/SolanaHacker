import React, { useState, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import ValuePropositionSection from './ValuePropositionSection';
import EnhancedVotingSection from './EnhancedVotingSection';
import FixedWalletButton from './FixedWalletButton';
import { SOLTooltip, TicketsTooltip } from './Web3Tooltip';

const UXOptimizedDashboard = () => {
  const { connected, publicKey, connecting } = useWallet();
  const [showFAQ, setShowFAQ] = useState(false);
  const [openFAQ, setOpenFAQ] = useState(null);
  const [demoVote, setDemoVote] = useState(null);
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

  // Enhanced wallet connection component with better debugging
  const WalletConnection = () => {
    console.log('WalletConnection render:', { connected, connecting, publicKey: publicKey?.toString() });

    const getShortAddress = (address) => {
      if (!address) return '';
      const str = address.toString();
      return `${str.substring(0, 4)}...${str.substring(str.length - 4)}`;
    };

    if (connecting) {
      return (
        <div className="flex items-center space-x-2 bg-purple-100 rounded-xl px-4 py-3 shadow-lg">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
          <span className="text-purple-800 font-semibold text-sm">Connecting...</span>
        </div>
      );
    }

    if (connected && publicKey) {
      return (
        <div className="flex items-center space-x-3 bg-green-100 border-2 border-green-300 rounded-xl px-4 py-3 shadow-lg">
          <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
          <div>
            <div className="text-green-800 font-bold text-sm">Connected</div>
            <div className="text-green-600 text-xs">{getShortAddress(publicKey)}</div>
          </div>
        </div>
      );
    }

    // Use our fixed wallet button
    return (
      <div className="flex flex-col space-y-2">
        <FixedWalletButton className="text-base">
          🔗 Connect Wallet
        </FixedWalletButton>
        <div className="text-xs text-gray-500 text-center">
          Click to connect Phantom/Solflare
        </div>
      </div>
    );
  };

  // Quick Voting Demo with prominent design
  const VotingDemo = () => {
    const demoMemes = [
      { id: 1, title: "SOL to Moon 🚀", emoji: "🚀", votes: 247 },
      { id: 2, title: "DeFi Problems 😅", emoji: "😅", votes: 189 },
      { id: 3, title: "Diamond Hands 💎", emoji: "💎", votes: 156 }
    ];

    return (
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-purple-200 p-6">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <span className="text-2xl">🗳️</span>
            <h3 className="font-bold text-lg text-gray-900">Try Voting Demo</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">See how it works (no wallet needed)</p>
          
          {!demoVote ? (
            <div className="text-xs text-purple-600 font-medium bg-purple-50 rounded-lg px-3 py-2 inline-block">
              ⚡ Vote → Get Tickets → Win SOL Prizes
            </div>
          ) : (
            <div className="bg-green-100 border-2 border-green-300 rounded-xl p-4">
              <div className="text-xl mb-1">🎉</div>
              <div className="text-sm text-green-800 font-bold">Demo Vote Successful!</div>
              <div className="text-xs text-green-600 mt-1">You earned 12 lottery tickets</div>
              <div className="text-xs text-gray-500 mt-2">Connect wallet to vote for real</div>
            </div>
          )}
        </div>
        
        {!demoVote ? (
          <div className="grid grid-cols-3 gap-3">
            {demoMemes.map((meme) => (
              <button
                key={meme.id}
                onClick={() => setDemoVote(meme.id)}
                className="p-3 border-2 border-gray-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all text-center"
              >
                <div className="text-2xl mb-1">{meme.emoji}</div>
                <div className="text-xs font-medium text-gray-700">{meme.title}</div>
                <div className="text-xs text-gray-500 mt-1">{meme.votes} votes</div>
              </button>
            ))}
          </div>
        ) : (
          <button
            onClick={() => setDemoVote(null)}
            className="w-full py-3 bg-purple-100 text-purple-700 rounded-xl font-medium hover:bg-purple-200 transition-colors"
          >
            🔄 Try Again
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Enhanced Navigation Header with prominent wallet connection */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">🗳️</span>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">MemeForge</div>
                <div className="text-xs text-purple-600 font-medium">AI Dreams. Humans Decide.</div>
              </div>
            </div>

            {/* Navigation - wallet connection much more prominent */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFAQ(!showFAQ)}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-purple-50"
              >
                <span className="flex items-center space-x-1">
                  <span>❓</span>
                  <span className="hidden sm:inline">FAQ</span>
                </span>
              </button>

              {/* Much more visible wallet connection */}
              <WalletConnection />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Clear Value Proposition and Immediate Demo */}
      <section className="pt-8 pb-12 bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4">
          {/* Clear Explanation of Value Proposition */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-yellow-100 border-2 border-yellow-300 text-yellow-800 px-4 py-2 rounded-full text-sm font-bold mb-6 shadow-lg">
              <span>🚀</span>
              <span>World's First Democratic NFT Rarity Platform</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Vote on AI Memes,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                Win Real <SOLTooltip>SOL</SOLTooltip>
              </span>
            </h1>

            {/* Clear explanation of the mechanism */}
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-300 rounded-3xl p-6 max-w-4xl mx-auto mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">🎯 Revolutionary Concept</h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                <strong>Your votes determine NFT rarity!</strong> Unlike traditional NFTs with predetermined rarity, 
                MemeForge lets <em>human taste decide</em> what becomes valuable.
              </p>
              
              {/* Step-by-step process */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div className="bg-white/80 rounded-xl p-4">
                  <div className="text-2xl mb-2">🤖</div>
                  <div className="font-bold text-sm text-gray-900">AI Creates</div>
                  <div className="text-xs text-gray-600">3 memes daily</div>
                </div>
                <div className="bg-white/80 rounded-xl p-4">
                  <div className="text-2xl mb-2">🗳️</div>
                  <div className="font-bold text-sm text-gray-900">You Vote</div>
                  <div className="text-xs text-gray-600">Pick favorites</div>
                </div>
                <div className="bg-white/80 rounded-xl p-4">
                  <div className="text-2xl mb-2">🎫</div>
                  <div className="font-bold text-sm text-gray-900">Earn Tickets</div>
                  <div className="text-xs text-gray-600">8-15 per vote</div>
                </div>
                <div className="bg-white/80 rounded-xl p-4">
                  <div className="text-2xl mb-2">💰</div>
                  <div className="font-bold text-sm text-gray-900">Win SOL</div>
                  <div className="text-xs text-gray-600">Weekly draws</div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Demo and Live Stats Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Prominent Interactive Demo */}
            <div className="order-2 lg:order-1">
              <VotingDemo />
            </div>

            {/* Live Stats */}
            <div className="order-1 lg:order-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl shadow-2xl p-6 text-white">
              <h3 className="font-bold text-white mb-6 text-xl flex items-center space-x-2">
                <span>🔥</span>
                <span>Live Platform Stats</span>
              </h3>
              <div className="space-y-4">
                <div className="bg-white/20 rounded-xl p-4 backdrop-blur">
                  <div className="flex justify-between items-center">
                    <span className="text-green-100">Prize Pool</span>
                    <span className="font-bold text-xl"><SOLTooltip>12.7 SOL</SOLTooltip></span>
                  </div>
                  <div className="text-sm text-green-200 mt-1">≈ $2,540 USD</div>
                </div>
                <div className="bg-white/20 rounded-xl p-4 backdrop-blur">
                  <div className="flex justify-between items-center">
                    <span className="text-green-100">Active Voters</span>
                    <span className="font-bold text-xl">5,247</span>
                  </div>
                  <div className="text-sm text-green-200 mt-1">This week</div>
                </div>
                <div className="bg-white/20 rounded-xl p-4 backdrop-blur">
                  <div className="flex justify-between items-center">
                    <span className="text-green-100">Next Draw</span>
                    <span className="font-bold text-xl">Sunday</span>
                  </div>
                  <div className="text-sm text-green-200 mt-1">8PM UTC • Live streamed</div>
                </div>
              </div>
            </div>
          </div>

          {/* Clear Call-to-Action */}
          <div className="text-center">
            <div className="bg-white rounded-3xl shadow-2xl border-2 border-purple-200 p-8 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Start Voting?</h3>
              <p className="text-gray-600 mb-6">
                Connect your Solana wallet to vote on today's AI memes and earn lottery tickets for this Sunday's draw
              </p>
              
              <div className="space-y-4">
                <button 
                  onClick={scrollToVoting}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-xl shadow-xl hover:shadow-2xl transition-all hover:scale-105 transform"
                >
                  🗳️ {connected ? 'Vote Now' : 'Connect & Vote'}
                </button>
                <div className="text-sm text-gray-500">
                  <span className="font-semibold text-green-600">100% Free</span> • No registration • Instant payouts
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      {showFAQ && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-200">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">🎯 Frequently Asked Questions</h2>
                <p className="text-gray-600 text-sm">Everything about earning <SOLTooltip>SOL</SOLTooltip> with memes</p>
              </div>
              <button
                onClick={() => setShowFAQ(false)}
                className="text-gray-500 hover:text-gray-700 text-xl p-2"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {faqData.map((faq, index) => (
                <div key={index} className="bg-white/70 rounded-xl border border-gray-200">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-gray-900 text-sm pr-2">{faq.q}</span>
                    <span className="text-purple-600 flex-shrink-0 font-bold">
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

      {/* Enhanced Value Proposition Section */}
      <ValuePropositionSection onScrollToVoting={scrollToVoting} />

      {/* Personal Dashboard for Connected Users */}
      {connected && (
        <section className="py-12 bg-gradient-to-br from-slate-50 to-purple-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 rounded-3xl p-8 text-white shadow-2xl">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">🎉 Welcome Back!</h2>
                <p className="text-purple-100">Your personal dashboard - Track tickets and SOL earnings</p>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="text-center bg-white/10 rounded-2xl p-4 backdrop-blur">
                  <div className="text-3xl font-bold mb-1 text-yellow-300">{userStats.tickets}</div>
                  <div className="text-purple-200 text-sm"><TicketsTooltip>Lottery Tickets</TicketsTooltip></div>
                  <div className="text-purple-300 text-xs mt-1">≈ 3.1% win chance</div>
                </div>
                <div className="text-center bg-white/10 rounded-2xl p-4 backdrop-blur">
                  <div className="text-3xl font-bold mb-1 text-orange-300">{userStats.streak}</div>
                  <div className="text-purple-200 text-sm">Daily Streak 🔥</div>
                </div>
                <div className="text-center bg-white/10 rounded-2xl p-4 backdrop-blur">
                  <div className="text-3xl font-bold mb-1 text-green-300">{userStats.winnings}</div>
                  <div className="text-purple-200 text-sm"><SOLTooltip>SOL</SOLTooltip> Earned</div>
                </div>
                <div className="text-center bg-white/10 rounded-2xl p-4 backdrop-blur">
                  <div className="text-3xl font-bold mb-1 text-blue-300">#{userStats.rank}</div>
                  <div className="text-purple-200 text-sm">Global Rank</div>
                </div>
              </div>

              <div className="text-center">
                <button 
                  onClick={scrollToVoting}
                  className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-full font-medium transition-colors backdrop-blur"
                >
                  Vote Now & Earn More Tickets →
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

      {/* Bottom Stats Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Next Draw */}
            <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-3xl p-6 text-white shadow-xl">
              <div className="flex items-center space-x-3 mb-4">
                <div className="text-2xl">🎲</div>
                <h3 className="text-lg font-bold">Next Weekly Draw</h3>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">Sunday 8PM</div>
                <div className="text-purple-100 text-sm">UTC • Live streamed</div>
                <div className="text-2xl font-bold mt-4"><SOLTooltip>12.7 SOL</SOLTooltip></div>
                <div className="text-purple-100 text-sm">Prize Pool ($2,540)</div>
                <div className="text-xs text-purple-200 mt-2 bg-white/20 backdrop-blur px-2 py-1 rounded-full">
                  5,247 <TicketsTooltip>tickets</TicketsTooltip> competing
                </div>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Top Voters This Week</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-2xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-400 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-purple-800 text-xs font-bold">1</span>
                    </div>
                    <span className="text-gray-900 font-medium">cryptomemer</span>
                  </div>
                  <span className="text-gray-700 font-bold">247 🎫</span>
                </div>
                
                <div className="flex items-center justify-between p-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 text-xs font-bold">2</span>
                    </div>
                    <span className="text-gray-900 font-medium">solholder99</span>
                  </div>
                  <span className="text-gray-600">189 🎫</span>
                </div>
                
                <div className="flex items-center justify-between p-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 text-xs font-bold">3</span>
                    </div>
                    <span className="text-gray-900 font-medium">mememaster</span>
                  </div>
                  <span className="text-gray-600">156 🎫</span>
                </div>
                
                {connected && (
                  <>
                    <div className="border-t border-gray-200 my-3"></div>
                    <div className="flex items-center justify-between bg-purple-50 p-3 rounded-2xl border border-purple-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-400 rounded-full flex items-center justify-center shadow-sm">
                          <span className="text-purple-800 text-xs font-bold">{userStats.rank}</span>
                        </div>
                        <span className="text-purple-900 font-medium">You</span>
                      </div>
                      <span className="text-purple-700 font-bold">{userStats.tickets} 🎫</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Recent Winners */}
            <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🎊 Recent Winners</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                  <span className="text-gray-600 text-sm">Last Sunday</span>
                  <span className="text-green-700 font-bold text-sm">8.4 <SOLTooltip>SOL</SOLTooltip> won</span>
                </div>
                <div className="flex items-center justify-between p-1">
                  <span className="text-gray-600 text-sm">Jan 26</span>
                  <span className="text-green-600 font-medium text-sm">11.2 <SOLTooltip>SOL</SOLTooltip></span>
                </div>
                <div className="flex items-center justify-between p-1">
                  <span className="text-gray-600 text-sm">Jan 19</span>
                  <span className="text-green-600 font-medium text-sm">9.8 <SOLTooltip>SOL</SOLTooltip></span>
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

export default UXOptimizedDashboard;