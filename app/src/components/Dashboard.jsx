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
        return <ForgeTab walletAddress={walletAddress} 
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
        return <ForgeTab walletAddress={walletAddress} 
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

      {/* Enhanced Header with MVP indicator - Mobile Responsive */}
      <header className="relative z-10 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-3 md:px-6 py-3 md:py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <span className="text-xl md:text-2xl font-bold">M</span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                    MemeForge
                  </h1>
                  <span className="text-xs bg-green-500/20 text-green-400 px-1.5 md:px-2 py-0.5 md:py-1 rounded font-medium">
                    MVP
                  </span>
                </div>
                <div className="hidden md:block text-xs text-gray-500">AI Meme Democracy Platform</div>
              </div>
            </div>

            {/* Enhanced User Info - Hidden on mobile, shown in tabs area instead */}
            <div className="flex items-center space-x-2 md:space-x-6">
              <div className="hidden lg:flex items-center space-x-6 px-6 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg">
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

      {/* Enhanced Tab Navigation - Mobile Responsive */}
      <nav className="relative z-10 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-2 md:px-6">
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-3 md:px-8 py-3 md:py-4 font-medium transition-all duration-300 border-b-2 relative overflow-hidden group ${
                  activeTab === tab.id
                    ? 'text-cyan-400 border-cyan-400 bg-cyan-500/10'
                    : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
                } ${tab.comingSoon ? 'opacity-60' : ''}`}
              >
                <span className="flex items-center space-x-2 md:space-x-3 relative z-10">
                  <span className="text-lg md:text-xl">{tab.icon}</span>
                  <div className="text-left">
                    <div className="flex items-center space-x-1 md:space-x-2">
                      <span className="text-sm md:text-base whitespace-nowrap">{tab.label}</span>
                      {tab.comingSoon && (
                        <span className="text-xs bg-orange-500/20 text-orange-400 px-1 md:px-2 py-0.5 rounded">
                          Soon
                        </span>
                      )}
                    </div>
                    <div className="hidden md:block text-xs opacity-60">{tab.desc}</div>
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
      <main className="relative z-10 max-w-7xl mx-auto px-3 md:px-6 py-6 md:py-12">
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