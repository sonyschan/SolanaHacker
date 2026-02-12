import React from 'react';
import WalletConnection from './WalletConnection';

const HomePage = ({ onConnectWallet, walletConnected, connecting }) => {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Enhanced Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        {/* More dynamic gradient orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-cyan-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-500" />
        <div className="absolute top-40 right-1/4 w-64 h-64 bg-green-500/20 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* Enhanced Navigation with better wallet status */}
      <nav className="relative z-10 flex justify-between items-center p-4 md:p-6 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <span className="text-lg md:text-2xl font-bold">M</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              MemeForge
            </h1>
            <div className="text-xs text-gray-500 hidden sm:block">AI-Powered Meme Democracy</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
          {/* Live stats indicator - hidden on mobile */}
          <div className="hidden lg:flex items-center space-x-4 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
              <span className="text-sm text-gray-400">Live</span>
            </div>
            <div className="text-sm">
              <span className="text-cyan-400 font-bold">1,247</span>
              <span className="text-gray-500 ml-1">voters</span>
            </div>
          </div>
          
          {/* Mobile-optimized wallet connection */}
          <div className="flex-shrink-0">
            <WalletConnection variant="primary" className="text-sm md:text-base" />
          </div>
        </div>
      </nav>

      {/* Hero Section - Restructured for better impact */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        
        {/* Main Hero */}
        <div className="text-center mb-24">
          <div className="inline-flex items-center space-x-2 mb-6">
            <div className="px-4 py-2 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-sm text-cyan-400 font-medium">
              ✨ AI-Powered
            </div>
            <div className="px-4 py-2 bg-purple-400/10 border border-purple-400/20 rounded-full text-sm text-purple-400 font-medium">
              🗳️ Democratic
            </div>
            <div className="px-4 py-2 bg-green-400/10 border border-green-400/20 rounded-full text-sm text-green-400 font-medium">
              💰 Rewarding
            </div>
          </div>
          
          <h2 className="text-6xl lg:text-8xl font-bold mb-8 leading-tight">
            <span className="bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              Democracy
            </span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Decides Value
            </span>
          </h2>
          
          <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            The first meme NFT platform where <strong className="text-white">your votes determine rarity</strong>. 
            AI creates, you decide, everyone wins.
          </p>
          
          {/* Enhanced CTA */}
          <div className="flex justify-center mb-16">
            <WalletConnection variant="primary" className="px-8 py-4 text-lg" />
          </div>

          {/* Enhanced Stats Bar with better hierarchy */}
          <div className="bg-gradient-to-r from-white/5 via-white/10 to-white/5 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-5xl mx-auto">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
                Live Platform Stats
              </h3>
              <p className="text-gray-400 text-sm">Real-time community activity</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center group">
                <div className="text-2xl font-bold text-cyan-400 mb-2 group-hover:scale-110 transition-transform">Coming Soon</div>
                <div className="text-sm text-gray-400">Weekly Prize Pool</div>
                <div className="text-xs text-cyan-500 mt-1">NFT 拍賣收益</div>
              </div>
              <div className="text-center group">
                <div className="text-4xl font-bold text-blue-400 mb-2 group-hover:scale-110 transition-transform">0</div>
                <div className="text-sm text-gray-400">Active Voters</div>
                <div className="text-xs text-blue-500 mt-1">即時更新</div>
              </div>
              <div className="text-center group">
                <div className="text-2xl font-bold text-purple-400 mb-2 group-hover:scale-110 transition-transform">Coming Soon</div>
                <div className="text-sm text-gray-400">NFTs Minted</div>
                <div className="text-xs text-purple-500 mt-1">每日 1 個</div>
              </div>
              <div className="text-center group">
                <div className="text-2xl font-bold text-green-400 mb-2 group-hover:scale-110 transition-transform">Coming Soon</div>
                <div className="text-sm text-gray-400">Avg NFT Price</div>
                <div className="text-xs text-green-500 mt-1">24h 均價</div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Value Cycle - 6 Steps with Better Visual Flow */}
        <div className="mb-24">
          <div className="text-center mb-16">
            <h3 className="text-5xl font-bold mb-6">The Value Cycle</h3>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Six steps that create a democratic, rewarding ecosystem where everyone wins
            </p>
          </div>
          
          {/* Visual Flow Steps */}
          <div className="grid md:grid-cols-6 gap-6 mb-16">
            {[
              { 
                step: "1", 
                icon: "🤖", 
                title: "AI Generate", 
                desc: "AI creates 3 memes from trending crypto news",
                color: "from-cyan-400 to-blue-500"
              },
              { 
                step: "2", 
                icon: "❤️", 
                title: "Community Vote", 
                desc: "Vote for your favorite and earn 8-15 tickets",
                color: "from-purple-400 to-pink-500"
              },
              { 
                step: "3", 
                icon: "🏆", 
                title: "Winner Chosen", 
                desc: "Most voted meme wins, rarity decided by votes",
                color: "from-yellow-400 to-orange-500"
              },
              { 
                step: "4", 
                icon: "🎨", 
                title: "NFT Minted", 
                desc: "Daily limit: 1 NFT with community-decided rarity",
                color: "from-green-400 to-emerald-500"
              },
              { 
                step: "5", 
                icon: "🛒", 
                title: "3-Day Auction", 
                desc: "NFT goes to highest bidder in transparent auction",
                color: "from-blue-400 to-indigo-500"
              },
              { 
                step: "6", 
                icon: "🎁", 
                title: "Rewards Distributed", 
                desc: "80% of proceeds to weekly SOL lottery",
                color: "from-pink-400 to-red-500"
              }
            ].map((step, index) => (
              <div key={index} className="relative group">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 group-hover:scale-105">
                  <div className={`w-12 h-12 bg-gradient-to-r ${step.color} rounded-xl flex items-center justify-center mb-4 mx-auto shadow-lg`}>
                    <span className="text-xl">{step.icon}</span>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-bold bg-gradient-to-r ${step.color} bg-clip-text text-transparent mb-2`}>
                      {step.title}
                    </div>
                    <p className="text-xs text-gray-400 leading-tight">{step.desc}</p>
                  </div>
                </div>
                
                {/* Flow arrows */}
                {index < 5 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-20">
                    <div className={`w-6 h-0.5 bg-gradient-to-r ${step.color} opacity-60`} />
                    <div className={`w-2 h-2 bg-gradient-to-r ${step.color} rounded-full absolute -right-1 top-0 transform -translate-y-1/2`} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Value Propositions with better structure */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {/* Zero Entry Cost */}
          <div className="group bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-400/20 rounded-2xl p-8 hover:border-green-400/40 transition-all duration-500">
            <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-green-500/25">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-green-400">Zero Entry Cost</h3>
            <p className="text-gray-400 leading-relaxed mb-4">
              Just vote to participate. No upfront investment, no gas fees for voting. 
              Pure democratic participation.
            </p>
            <div className="text-sm text-green-300 font-medium">
              ✓ Free voting ✓ Instant rewards ✓ Fair distribution
            </div>
          </div>

          {/* Democratic Rarity */}
          <div className="group bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/20 rounded-2xl p-8 hover:border-purple-400/40 transition-all duration-500">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/25">
              <span className="text-2xl">🗳️</span>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-purple-400">Community Decides Value</h3>
            <p className="text-gray-400 leading-relaxed mb-4">
              Your votes determine which memes become NFTs and their rarity levels. 
              No algorithms, pure human preference.
            </p>
            <div className="text-sm text-purple-300 font-medium">
              ✓ Democratic voting ✓ Transparent process ✓ Community ownership
            </div>
          </div>

          {/* Fair Rewards */}
          <div className="group bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 rounded-2xl p-8 hover:border-cyan-400/40 transition-all duration-500">
            <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-cyan-500/25">
              <span className="text-2xl">🎰</span>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-cyan-400">Random Fair Rewards</h3>
            <p className="text-gray-400 leading-relaxed mb-4">
              Earn 8-15 tickets per vote. Random rewards prevent gaming. 
              80% of NFT sales return to community lottery.
            </p>
            <div className="text-sm text-cyan-300 font-medium">
              ✓ Anti-manipulation ✓ Weekly SOL prizes ✓ Growing rewards
            </div>
          </div>
        </div>

        {/* Enhanced Features Grid with Web3 focus */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 rounded-xl p-6 hover:scale-105 transition-all duration-300">
            <div className="text-3xl mb-3">⚡</div>
            <h4 className="font-bold mb-2 text-cyan-400">Solana Speed</h4>
            <p className="text-sm text-gray-400">Sub-second transactions, minimal fees on world's fastest blockchain</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/20 rounded-xl p-6 hover:scale-105 transition-all duration-300">
            <div className="text-3xl mb-3">🤖</div>
            <h4 className="font-bold mb-2 text-purple-400">AI-Generated Content</h4>
            <p className="text-sm text-gray-400">Fresh memes daily from trending crypto news and market sentiment</p>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-400/20 rounded-xl p-6 hover:scale-105 transition-all duration-300">
            <div className="text-3xl mb-3">🎯</div>
            <h4 className="font-bold mb-2 text-green-400">Streak Rewards</h4>
            <p className="text-sm text-gray-400">Daily voting streaks unlock higher ticket multipliers</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-400/20 rounded-xl p-6 hover:scale-105 transition-all duration-300">
            <div className="text-3xl mb-3">📈</div>
            <h4 className="font-bold mb-2 text-orange-400">Transparency</h4>
            <p className="text-sm text-gray-400">All votes, rewards, and transactions visible on-chain</p>
          </div>
        </div>

        {/* Enhanced Final CTA with urgency */}
        <div className="text-center bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-white/10 rounded-3xl p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 animate-pulse" />
          <div className="relative z-10">
            <div className="inline-flex items-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-ping" />
              <span className="text-green-400 font-medium">Live Now</span>
            </div>
            <h3 className="text-4xl font-bold mb-4">Join the Democracy</h3>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto text-lg">
              <strong className="text-white">1,247 voters</strong> are already earning SOL by deciding the next viral crypto memes. 
              Don't miss today's vote!
            </p>
            <div className="space-y-4">
              <WalletConnection variant="primary" className="px-12 py-4 text-xl font-bold" />
              <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <span className="text-green-400">✓</span>
                  <span>Free to start</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-blue-400">✓</span>
                  <span>Instant rewards</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-purple-400">✓</span>
                  <span>Community owned</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;