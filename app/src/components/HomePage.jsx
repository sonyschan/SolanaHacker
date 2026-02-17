import React, { useState, useEffect } from 'react';
import WalletConnection from './WalletConnection';

const HomePage = ({ onConnectWallet, walletConnected, connecting }) => {
  const [weeklyVoters, setWeeklyVoters] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("https://memeforge-api-836651762884.asia-southeast1.run.app/api/stats");
        const data = await response.json();
        if (data.success) {
          setWeeklyVoters(data.stats.weeklyVoters || 0);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen text-stone-700 overflow-hidden relative" style={{ backgroundColor: 'var(--morandi-cream)' }}>
      {/* Ultra-muted Morandi background */}
      <div className="absolute inset-0 bg-gradient-to-br from-stone-200/40 via-neutral-100/30 to-amber-100/20">
        <div className="absolute inset-0 bg-grid-morandi" />
        {/* Very subtle floating elements */}
        <div className="absolute top-20 left-20 w-72 h-72 rounded-full blur-3xl animate-gentle-float" style={{ backgroundColor: 'rgba(168, 166, 144, 0.08)' }} />
        <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full blur-3xl animate-gentle-float delay-1000" style={{ backgroundColor: 'rgba(181, 161, 157, 0.10)' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl animate-gentle-float delay-500" style={{ backgroundColor: 'rgba(155, 136, 116, 0.06)' }} />
        <div className="absolute top-40 right-1/4 w-64 h-64 rounded-full blur-3xl animate-gentle-float delay-2000" style={{ backgroundColor: 'rgba(150, 163, 150, 0.08)' }} />
      </div>

      {/* Ultra-muted Morandi Navigation */}
      <nav className="relative z-10 flex justify-between items-center p-4 md:p-6 backdrop-blur-sm border-b" style={{ borderColor: 'rgba(168, 161, 154, 0.2)' }}>
        <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shadow-morandi-soft" style={{ background: 'linear-gradient(135deg, var(--morandi-soft-clay), var(--morandi-mushroom))' }}>
            <span className="text-lg md:text-2xl font-bold text-stone-100">M</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold text-gradient-morandi">
              AI MemeForge
            </h1>
            <div className="text-xs hidden sm:block" style={{ color: 'var(--morandi-mushroom)' }}>AI-Powered Meme Democracy</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
          {/* Live stats indicator - ultra muted */}
          <div className="hidden lg:flex items-center space-x-4 px-4 py-2 glass-morphism-morandi rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: 'var(--morandi-pale-green)' }}></div>
              <span className="text-sm" style={{ color: 'var(--morandi-mushroom)' }}>Live</span>
            </div>
            <div className="text-sm">
              <span className="font-bold" style={{ color: 'var(--morandi-soft-brown)' }}>{weeklyVoters}</span>
              <span className="ml-1" style={{ color: 'var(--morandi-mushroom)' }}>voters</span>
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
            <div className="px-4 py-2 rounded-full text-sm font-medium shadow-morandi-soft" style={{ backgroundColor: 'rgba(168, 166, 144, 0.15)', border: '1px solid rgba(168, 166, 144, 0.25)', color: 'var(--morandi-muted-olive)' }}>
              ✨ AI-Powered
            </div>
            <div className="px-4 py-2 rounded-full text-sm font-medium shadow-morandi-rose" style={{ backgroundColor: 'rgba(181, 161, 157, 0.15)', border: '1px solid rgba(181, 161, 157, 0.25)', color: 'var(--morandi-dusty-rose)' }}>
              🗳️ Democratic
            </div>
            <div className="px-4 py-2 rounded-full text-sm font-medium shadow-morandi-sage" style={{ backgroundColor: 'rgba(150, 163, 150, 0.15)', border: '1px solid rgba(150, 163, 150, 0.25)', color: 'var(--morandi-pale-green)' }}>
              💰 Rewarding
            </div>
          </div>
          
          <h2 className="text-6xl lg:text-8xl font-bold mb-8 leading-tight">
            <span style={{ color: 'var(--morandi-mushroom)' }}>
              Democracy
            </span>
            <br />
            <span className="text-gradient-morandi">
              Decides Value
            </span>
          </h2>
          
          <p className="text-xl mb-12 max-w-3xl mx-auto leading-relaxed" style={{ color: 'var(--morandi-soft-brown)' }}>
            The first meme NFT platform where <strong style={{ color: 'var(--morandi-mushroom)' }}>your votes determine rarity</strong>. 
            AI creates, you decide, everyone wins.
          </p>
          
          {/* Enhanced CTA */}
          <div className="flex justify-center mb-16">
            <WalletConnection variant="primary" className="px-8 py-4 text-lg" />
          </div>

          {/* Morandi Stats Bar */}
          <div className="glass-morphism-morandi rounded-2xl p-8 max-w-5xl mx-auto shadow-morandi-soft">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gradient-morandi mb-2">
                Live Platform Stats
              </h3>
              <p className="text-sm" style={{ color: 'var(--morandi-soft-brown)' }}>Real-time community activity</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center group">
                <div className="text-2xl font-bold mb-2 group-hover:scale-110 transition-transform" style={{ color: 'var(--morandi-soft-brown)' }}>Coming Soon</div>
                <div className="text-sm" style={{ color: 'var(--morandi-mushroom)' }}>Weekly Prize Pool</div>
                <div className="text-xs mt-1" style={{ color: 'var(--morandi-soft-clay)' }}>NFT Auction Revenue</div>
              </div>
              <div className="text-center group">
                <div className="text-4xl font-bold mb-2 group-hover:scale-110 transition-transform" style={{ color: 'var(--morandi-dusty-rose)' }}>0</div>
                <div className="text-sm" style={{ color: 'var(--morandi-mushroom)' }}>Active Voters</div>
                <div className="text-xs mt-1" style={{ color: 'var(--morandi-dusty-rose)' }}>Real-time update</div>
              </div>
              <div className="text-center group">
                <div className="text-2xl font-bold mb-2 group-hover:scale-110 transition-transform" style={{ color: 'var(--morandi-mushroom)' }}>Coming Soon</div>
                <div className="text-sm" style={{ color: 'var(--morandi-mushroom)' }}>NFTs Minted</div>
                <div className="text-xs mt-1" style={{ color: 'var(--morandi-warm-gray)' }}>1 per day</div>
              </div>
              <div className="text-center group">
                <div className="text-2xl font-bold mb-2 group-hover:scale-110 transition-transform" style={{ color: 'var(--morandi-pale-green)' }}>Coming Soon</div>
                <div className="text-sm" style={{ color: 'var(--morandi-mushroom)' }}>Avg NFT Price</div>
                <div className="text-xs mt-1" style={{ color: 'var(--morandi-muted-olive)' }}>24h average</div>
              </div>
            </div>
          </div>
        </div>

        {/* Morandi Value Cycle */}
        <div className="mb-24">
          <div className="text-center mb-16">
            <h3 className="text-5xl font-bold mb-6" style={{ color: 'var(--morandi-mushroom)' }}>The Value Cycle</h3>
            <p className="text-xl max-w-3xl mx-auto" style={{ color: 'var(--morandi-soft-brown)' }}>
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
                colorVar: "var(--morandi-soft-brown)"
              },
              { 
                step: "2", 
                icon: "❤️", 
                title: "Community Vote", 
                desc: "Vote for your favorite and earn 8-15 tickets",
                colorVar: "var(--morandi-dusty-rose)"
              },
              { 
                step: "3", 
                icon: "🏆", 
                title: "Winner Chosen", 
                desc: "Most voted meme wins, rarity decided by votes",
                colorVar: "var(--morandi-soft-clay)"
              },
              { 
                step: "4", 
                icon: "🎨", 
                title: "NFT Minted", 
                desc: "Daily limit: 1 NFT with community-decided rarity",
                colorVar: "var(--morandi-pale-green)"
              },
              { 
                step: "5", 
                icon: "🛒", 
                title: "3-Day Auction", 
                desc: "NFT goes to highest bidder in transparent auction",
                colorVar: "var(--morandi-mushroom)"
              },
              { 
                step: "6", 
                icon: "🎁", 
                title: "Rewards Distributed", 
                desc: "80% of proceeds to weekly SOL lottery",
                colorVar: "var(--morandi-sage)"
              }
            ].map((step, index) => (
              <div key={index} className="relative group">
                <div className="glass-morphism-morandi rounded-xl p-6 hover:shadow-morandi-soft transition-all duration-300 group-hover:scale-105">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 mx-auto shadow-morandi-soft" style={{ backgroundColor: step.colorVar }}>
                    <span className="text-xl text-stone-100">{step.icon}</span>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold mb-2" style={{ color: step.colorVar }}>
                      {step.title}
                    </div>
                    <p className="text-xs leading-tight" style={{ color: 'var(--morandi-mushroom)' }}>{step.desc}</p>
                  </div>
                </div>
                
                {/* Flow arrows */}
                {index < 5 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-20">
                    <div className="w-6 h-0.5 opacity-40" style={{ backgroundColor: step.colorVar }} />
                    <div className="w-2 h-2 rounded-full absolute -right-1 top-0 transform -translate-y-1/2 opacity-40" style={{ backgroundColor: step.colorVar }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Morandi Value Propositions */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {/* Zero Entry Cost */}
          <div className="group glass-morphism-morandi rounded-2xl p-8 transition-all duration-500 shadow-morandi-sage" style={{ border: '1px solid rgba(150, 163, 150, 0.2)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-morandi-soft" style={{ backgroundColor: 'var(--morandi-pale-green)' }}>
              <span className="text-2xl text-stone-100">⚡</span>
            </div>
            <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--morandi-pale-green)' }}>Zero Entry Cost</h3>
            <p className="leading-relaxed mb-4" style={{ color: 'var(--morandi-soft-brown)' }}>
              Just vote to participate. No upfront investment, no gas fees for voting. 
              Pure democratic participation.
            </p>
            <div className="text-sm font-medium" style={{ color: 'var(--morandi-muted-olive)' }}>
              ✓ Free voting ✓ Instant rewards ✓ Fair distribution
            </div>
          </div>

          {/* Democratic Rarity */}
          <div className="group glass-morphism-morandi rounded-2xl p-8 transition-all duration-500 shadow-morandi-rose" style={{ border: '1px solid rgba(181, 161, 157, 0.2)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-morandi-soft" style={{ backgroundColor: 'var(--morandi-dusty-rose)' }}>
              <span className="text-2xl text-stone-100">🗳️</span>
            </div>
            <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--morandi-dusty-rose)' }}>Community Decides Value</h3>
            <p className="leading-relaxed mb-4" style={{ color: 'var(--morandi-soft-brown)' }}>
              Your votes determine which memes become NFTs and their rarity levels. 
              No algorithms, pure human preference.
            </p>
            <div className="text-sm font-medium" style={{ color: 'var(--morandi-soft-clay)' }}>
              ✓ Democratic voting ✓ Transparent process ✓ Community ownership
            </div>
          </div>

          {/* Fair Rewards */}
          <div className="group glass-morphism-morandi rounded-2xl p-8 transition-all duration-500 shadow-morandi-soft" style={{ border: '1px solid rgba(155, 136, 116, 0.2)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-morandi-soft" style={{ backgroundColor: 'var(--morandi-soft-brown)' }}>
              <span className="text-2xl text-stone-100">🎰</span>
            </div>
            <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--morandi-soft-brown)' }}>Random Fair Rewards</h3>
            <p className="leading-relaxed mb-4" style={{ color: 'var(--morandi-soft-brown)' }}>
              Earn 8-15 tickets per vote. Random rewards prevent gaming. 
              80% of NFT sales return to community lottery.
            </p>
            <div className="text-sm font-medium" style={{ color: 'var(--morandi-mushroom)' }}>
              ✓ Anti-manipulation ✓ Weekly SOL prizes ✓ Growing rewards
            </div>
          </div>
        </div>

        {/* Morandi Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="glass-morphism-morandi rounded-xl p-6 hover:scale-105 transition-all duration-300 shadow-morandi-soft" style={{ border: '1px solid rgba(155, 136, 116, 0.15)' }}>
            <div className="text-3xl mb-3">⚡</div>
            <h4 className="font-bold mb-2" style={{ color: 'var(--morandi-soft-brown)' }}>Solana Speed</h4>
            <p className="text-sm" style={{ color: 'var(--morandi-mushroom)' }}>Sub-second transactions, minimal fees on world's fastest blockchain</p>
          </div>

          <div className="glass-morphism-morandi rounded-xl p-6 hover:scale-105 transition-all duration-300 shadow-morandi-rose" style={{ border: '1px solid rgba(181, 161, 157, 0.15)' }}>
            <div className="text-3xl mb-3">🤖</div>
            <h4 className="font-bold mb-2" style={{ color: 'var(--morandi-dusty-rose)' }}>AI-Generated Content</h4>
            <p className="text-sm" style={{ color: 'var(--morandi-mushroom)' }}>Fresh memes daily from trending crypto news and market sentiment</p>
          </div>

          <div className="glass-morphism-morandi rounded-xl p-6 hover:scale-105 transition-all duration-300 shadow-morandi-sage" style={{ border: '1px solid rgba(150, 163, 150, 0.15)' }}>
            <div className="text-3xl mb-3">🎯</div>
            <h4 className="font-bold mb-2" style={{ color: 'var(--morandi-pale-green)' }}>Streak Rewards</h4>
            <p className="text-sm" style={{ color: 'var(--morandi-mushroom)' }}>Daily voting streaks unlock higher ticket multipliers</p>
          </div>

          <div className="glass-morphism-morandi rounded-xl p-6 hover:scale-105 transition-all duration-300 shadow-morandi-soft" style={{ border: '1px solid rgba(160, 139, 126, 0.15)' }}>
            <div className="text-3xl mb-3">📈</div>
            <h4 className="font-bold mb-2" style={{ color: 'var(--morandi-soft-clay)' }}>Transparency</h4>
            <p className="text-sm" style={{ color: 'var(--morandi-mushroom)' }}>All votes, rewards, and transactions visible on-chain</p>
          </div>
        </div>

        {/* Morandi Final CTA */}
        <div className="text-center glass-morphism-morandi rounded-3xl p-12 relative overflow-hidden shadow-morandi-soft">
          <div className="absolute inset-0 animate-pulse" style={{ background: 'linear-gradient(90deg, rgba(168, 161, 154, 0.03), rgba(181, 161, 157, 0.05))' }} />
          <div className="relative z-10">
            <div className="inline-flex items-center space-x-2 mb-4">
              <div className="w-3 h-3 rounded-full animate-ping" style={{ backgroundColor: 'var(--morandi-pale-green)' }} />
              <span className="font-medium" style={{ color: 'var(--morandi-pale-green)' }}>Live Now</span>
            </div>
            <h3 className="text-4xl font-bold mb-4" style={{ color: 'var(--morandi-mushroom)' }}>Join the Democracy</h3>
            <p className="mb-8 max-w-2xl mx-auto text-lg" style={{ color: 'var(--morandi-soft-brown)' }}>
              <strong style={{ color: 'var(--morandi-mushroom)' }}>{weeklyVoters} voters</strong> is ready to earn SOL by deciding the next viral crypto memes. 
              Don't miss today's vote!
            </p>
            <div className="space-y-4">
              <WalletConnection variant="primary" className="px-12 py-4 text-xl font-bold" />
              <div className="flex items-center justify-center space-x-6 text-sm" style={{ color: 'var(--morandi-soft-brown)' }}>
                <div className="flex items-center space-x-2">
                  <span style={{ color: 'var(--morandi-pale-green)' }}>✓</span>
                  <span>Free to start</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span style={{ color: 'var(--morandi-dusty-rose)' }}>✓</span>
                  <span>Instant rewards</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span style={{ color: 'var(--morandi-soft-brown)' }}>✓</span>
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