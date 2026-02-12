import React, { useState } from 'react';
import WalletConnection from './WalletConnection';
import ForgeTab from './ForgeTab';
import MemeModal from './MemeModal';

const Dashboard = ({ 
  userTickets, 
  votingStreak, 
  onDisconnectWallet,
  setUserTickets,
  setVotingStreak,
  walletAddress
}) => {
  const [activeTab, setActiveTab] = useState('forge');
  const [modalMeme, setModalMeme] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tabs = [
    { id: 'forge', label: 'Forge', icon: '🤖', desc: 'Vote on today\'s memes' },
    { id: 'tickets', label: 'My Tickets', icon: '🎫', desc: 'Lottery entries' },
    { id: 'market', label: 'Market', icon: '🛒', desc: 'NFT auctions (Coming Soon)', comingSoon: true }
  ];

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
            <div className="text-2xl font-bold mb-2">Coming Soon</div>
            <p className="text-sm text-gray-400">Simulation mode</p>
          </div>
        </div>

        {/* MVP Notice */}
        <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-400">
            🚀 <strong>MVP Version</strong>: Real SOL rewards coming in Beta release!
          </p>
        </div>

        <button className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg font-semibold hover:scale-105 transition-all duration-300 shadow-lg shadow-yellow-500/25">
          Simulate Weekly Draw
        </button>
        
        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-400/20 rounded-lg">
          <p className="text-sm text-yellow-400">
            🗓️ Simulation draw: Every Sunday (MVP testing mode)
          </p>
        </div>
      </div>

      {/* Lottery History - Simulation Mode */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xl font-bold">Recent Winners</h4>
          <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">
            Simulation
          </span>
        </div>
        <div className="space-y-3">
          {[
            { week: 'Week 12', winner: '7vQx...k2P9', amount: 'Simulation', tickets: 1247 },
            { week: 'Week 11', winner: '9mR4...xL8A', amount: 'Simulation', tickets: 892 },
            { week: 'Week 10', winner: '3nK7...vM5B', amount: 'Simulation', tickets: 1456 }
          ].map((draw, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <div>
                <div className="font-medium">{draw.week}</div>
                <div className="text-sm text-gray-400">{draw.winner}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-orange-400">{draw.amount}</div>
                <div className="text-xs text-gray-400">{draw.tickets} total tickets</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Enhanced Market Tab - Coming Soon
  const MarketTabContent = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h3 className="text-3xl font-bold mb-4">🛒 NFT Marketplace</h3>
        <div className="bg-purple-500/10 border border-purple-400/20 rounded-lg p-4 mb-4 inline-block">
          <span className="text-purple-400 font-semibold">🚧 Coming Soon in Beta Release!</span>
        </div>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Community-voted meme NFTs with transparent auctions. 
          All sales feed back into the prize pool.
        </p>
      </div>

      {/* Preview Features - Disabled/Coming Soon */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-50">
        {[
          { 
            id: 1, 
            title: "Legendary SOL Rocket", 
            rarity: "Legendary", 
            currentBid: "Coming Soon", 
            image: "🚀🌙",
            timeLeft: "Beta Release",
            bidders: "--",
            votes: 234
          },
          { 
            id: 2, 
            title: "Epic DeFi Summer", 
            rarity: "Epic", 
            currentBid: "Coming Soon", 
            image: "☀️📈",
            timeLeft: "Beta Release",
            bidders: "--",
            votes: 187
          },
          { 
            id: 3, 
            title: "Rare Gas Fee Pain", 
            rarity: "Rare", 
            currentBid: "Coming Soon", 
            image: "⛽😢",
            timeLeft: "Beta Release",
            bidders: "--",
            votes: 156
          },
        ].map((nft) => (
          <div key={nft.id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 relative">
            {/* Coming Soon Overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
              <div className="text-center">
                <div className="text-4xl mb-2">🚧</div>
                <div className="font-bold text-lg">Coming Soon</div>
                <div className="text-sm text-gray-300">Beta Release</div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-6xl mb-4">{nft.image}</div>
              <h4 className="font-bold mb-2">{nft.title}</h4>
              <div className={`inline-block px-3 py-1 rounded-lg text-sm font-medium mb-3 ${
                nft.rarity === 'Legendary' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-400/30' :
                nft.rarity === 'Epic' ? 'bg-purple-500/20 text-purple-400 border border-purple-400/30' :
                'bg-blue-500/20 text-blue-400 border border-blue-400/30'
              }`}>
                {nft.rarity}
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="text-2xl font-bold text-purple-400">{nft.currentBid}</div>
                <div className="text-sm text-gray-400">{nft.bidders} bidders</div>
                <div className="text-xs text-gray-500">{nft.votes} community votes</div>
              </div>

              <div className="bg-white/5 rounded-lg p-3 mb-4">
                <div className="text-sm text-gray-400 mb-1">Available in</div>
                <div className="font-bold text-purple-400">{nft.timeLeft}</div>
              </div>

              <button disabled className="w-full py-3 bg-purple-500/20 rounded-lg font-semibold cursor-not-allowed">
                NFT Minting Coming Soon
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Market Stats - Preview Mode */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white/5 rounded-xl p-6 text-center relative">
          <div className="absolute top-2 right-2">
            <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">Preview</span>
          </div>
          <div className="text-3xl text-cyan-400 font-bold mb-2">0</div>
          <div className="text-gray-400 text-sm">Total NFTs</div>
          <div className="text-xs text-gray-500 mt-1">Minting in Beta</div>
        </div>
        <div className="bg-white/5 rounded-xl p-6 text-center relative">
          <div className="absolute top-2 right-2">
            <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">Preview</span>
          </div>
          <div className="text-3xl text-green-400 font-bold mb-2">--</div>
          <div className="text-gray-400 text-sm">Avg Price (SOL)</div>
          <div className="text-xs text-gray-500 mt-1">Coming Soon</div>
        </div>
        <div className="bg-white/5 rounded-xl p-6 text-center relative">
          <div className="absolute top-2 right-2">
            <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">Preview</span>
          </div>
          <div className="text-3xl text-purple-400 font-bold mb-2">--</div>
          <div className="text-gray-400 text-sm">Total Volume (SOL)</div>
          <div className="text-xs text-gray-500 mt-1">Coming Soon</div>
        </div>
        <div className="bg-white/5 rounded-xl p-6 text-center relative">
          <div className="absolute top-2 right-2">
            <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">Preview</span>
          </div>
          <div className="text-3xl text-orange-400 font-bold mb-2">80%</div>
          <div className="text-gray-400 text-sm">To Prize Pool</div>
          <div className="text-xs text-gray-500 mt-1">Beta Feature</div>
        </div>
      </div>

      {/* Beta Info Box */}
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-2xl p-8 text-center">
        <div className="text-6xl mb-4">🚀</div>
        <h3 className="text-2xl font-bold mb-4">NFT Marketplace Coming in Beta</h3>
        <p className="text-gray-300 mb-6">
          NFT minting, auctions, and real SOL rewards will be available in the Beta release. 
          For now, enjoy voting and earning tickets!
        </p>
        <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-2xl text-cyan-400 font-bold">🎨</div>
            <div className="text-sm text-gray-400 mt-1">NFT Minting</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-2xl text-green-400 font-bold">💰</div>
            <div className="text-sm text-gray-400 mt-1">SOL Auctions</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-2xl text-purple-400 font-bold">🏆</div>
            <div className="text-sm text-gray-400 mt-1">Real Rewards</div>
          </div>
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

      {/* Enhanced Header with MVP indicator */}
      <header className="relative z-10 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <span className="text-2xl font-bold">M</span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                    MemeForge
                  </h1>
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded font-medium">
                    MVP
                  </span>
                </div>
                <div className="text-xs text-gray-500">AI Meme Democracy Platform</div>
              </div>
            </div>
            
            {/* Enhanced User Info */}
            <div className="flex items-center space-x-6">
              <div className="hidden md:flex items-center space-x-6 px-6 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg">
                <div className="text-center">
                  <div className="text-sm text-gray-400">Tickets</div>
                  {userTickets !== null ? (
                    <div className="font-bold text-cyan-400 text-lg">{userTickets}</div>
                  ) : (
                    <div className="placeholder-text text-shimmer w-12 h-6 bg-cyan-400/30 rounded mx-auto"></div>
                  )}
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <div className="text-sm text-gray-400">Streak</div>
                  {votingStreak !== null ? (
                    <div className="font-bold text-green-400 text-lg">{votingStreak} days</div>
                  ) : (
                    <div className="placeholder-text text-shimmer w-16 h-6 bg-green-400/30 rounded mx-auto"></div>
                  )}
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <div className="text-sm text-gray-400">Prize Pool</div>
                  <div className="font-bold text-orange-400 text-lg">Coming Soon</div>
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
                } ${tab.comingSoon ? 'opacity-60' : ''}`}
              >
                <span className="flex items-center space-x-3 relative z-10">
                  <span className="text-xl">{tab.icon}</span>
                  <div className="text-left">
                    <div className="flex items-center space-x-2">
                      <span>{tab.label}</span>
                      {tab.comingSoon && (
                        <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">
                          Soon
                        </span>
                      )}
                    </div>
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

      {/* Meme Modal */}
      <MemeModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalMeme(null);
        }}
        meme={modalMeme}
      />
    </div>
  );
};

export default Dashboard;