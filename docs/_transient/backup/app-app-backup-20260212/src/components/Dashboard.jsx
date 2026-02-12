import React, { useState } from 'react';
import {
  WrenchScrewdriverIcon,
  TicketIcon,
  BuildingStorefrontIcon,
  WalletIcon,
  StarIcon,
  TrophyIcon,
  SparklesIcon,
  HeartIcon,
  FireIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('forge');
  const [walletConnected, setWalletConnected] = useState(false);

  const tabs = [
    {
      id: 'forge',
      name: 'Forge',
      icon: WrenchScrewdriverIcon,
      description: 'Vote on AI memes to earn lottery tickets'
    },
    {
      id: 'tickets',
      name: 'My Tickets',
      icon: TicketIcon,
      description: 'View your earned tickets and rewards'
    },
    {
      id: 'market',
      name: 'Market',
      icon: BuildingStorefrontIcon,
      description: 'NFT auctions funded by your votes'
    }
  ];

  // Random ticket rewards to encourage participation
  const getRandomTicketReward = () => {
    return Math.floor(Math.random() * 8) + 8; // 8-15 tickets
  };

  // Generate consistent random rewards for demonstration
  const generateTicketHistory = () => {
    return [
      { id: 1, memeId: 1, tickets: 12, hoursAgo: 1 },
      { id: 2, memeId: 2, tickets: 15, hoursAgo: 2 },
      { id: 3, memeId: 3, tickets: 9, hoursAgo: 3 },
      { id: 4, memeId: 4, tickets: 13, hoursAgo: 4 },
      { id: 5, memeId: 5, tickets: 8, hoursAgo: 5 }
    ];
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'forge':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent mb-4">
                🔨 Vote on AI Memes
              </h2>
              <p className="text-gray-300 text-lg">
                Vote for your favorite memes and earn 8-15 lottery tickets per vote!
              </p>
              <div className="flex justify-center mt-4 space-x-4 text-sm text-gray-400">
                <span>💡 Vote → 🎫 Random Tickets (8-15) → 🏆 Win SOL</span>
              </div>
            </div>
            
            {/* Random Reward Notice */}
            <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 backdrop-blur-sm rounded-xl border border-amber-500/20 p-4 mb-6">
              <div className="text-center">
                <SparklesIcon className="h-6 w-6 text-amber-400 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-amber-300 mb-1">🎲 Random Reward System</h3>
                <p className="text-amber-200/80 text-sm">
                  Every vote earns you 8-15 random tickets regardless of rarity! 
                  <br />This encourages fair participation and keeps the excitement high.
                </p>
              </div>
            </div>
            
            {/* Meme Voting Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((meme) => {
                const ticketReward = getRandomTicketReward();
                return (
                  <div key={meme} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:border-purple-500/50 transition-all duration-300 group">
                    <div className="aspect-square bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                      <SparklesIcon className="h-16 w-16 text-purple-400" />
                      <span className="ml-2 text-2xl">🤖</span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-white mb-2">AI Meme #{meme}</h3>
                      <p className="text-gray-400 text-sm mb-2">Generated: 2 hours ago</p>
                      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg p-2 mb-4 border border-green-500/30">
                        <div className="flex items-center justify-center">
                          <TicketIcon className="h-4 w-4 text-green-400 mr-1" />
                          <span className="text-green-300 font-semibold text-sm">
                            Random reward: {ticketReward} tickets
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-yellow-400">
                          <HeartIcon className="h-4 w-4" />
                          <span className="text-sm">{Math.floor(Math.random() * 50)} votes</span>
                        </div>
                        <button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 group-hover:scale-105">
                          Vote
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      
      case 'tickets':
        const ticketHistory = generateTicketHistory();
        const totalTickets = ticketHistory.reduce((sum, entry) => sum + entry.tickets, 0);
        
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent mb-4">
                🎫 My Lottery Tickets
              </h2>
              <p className="text-gray-300 text-lg">
                Your earned tickets from voting. Every vote gives random 8-15 tickets!
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-xl border border-purple-500/30 p-6 text-center">
                <TicketIcon className="h-12 w-12 text-purple-400 mx-auto mb-2" />
                <h3 className="text-2xl font-bold text-white">{totalTickets + 70}</h3>
                <p className="text-gray-300">Total Tickets</p>
              </div>
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-xl border border-yellow-500/30 p-6 text-center">
                <TrophyIcon className="h-12 w-12 text-yellow-400 mx-auto mb-2" />
                <h3 className="text-2xl font-bold text-white">3</h3>
                <p className="text-gray-300">Wins This Month</p>
              </div>
              <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-sm rounded-xl border border-green-500/30 p-6 text-center">
                <CurrencyDollarIcon className="h-12 w-12 text-green-400 mx-auto mb-2" />
                <h3 className="text-2xl font-bold text-white">0.25</h3>
                <p className="text-gray-300">SOL Won</p>
              </div>
            </div>

            {/* Random Reward Explanation */}
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6 mb-6">
              <div className="text-center">
                <SparklesIcon className="h-8 w-8 text-cyan-400 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-cyan-300 mb-2">🎲 Fair Random Rewards</h3>
                <p className="text-cyan-200/80 text-sm leading-relaxed">
                  MemeForge uses a <strong>random ticket system (8-15 per vote)</strong> to ensure fair participation. 
                  <br />Unlike traditional rarity-based systems, everyone has equal opportunity regardless of which meme they vote for.
                  <br />This encourages genuine voting based on preference, not reward optimization!
                </p>
              </div>
            </div>

            {/* Recent Tickets */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <TicketIcon className="h-6 w-6 text-purple-400 mr-2" />
                Recent Tickets Earned
              </h3>
              <div className="space-y-3">
                {ticketHistory.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between py-3 px-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-2 rounded-lg">
                        <SparklesIcon className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Meme Vote #{entry.memeId}</p>
                        <div className="flex items-center mt-1">
                          <TicketIcon className="h-3 w-3 text-green-400 mr-1" />
                          <p className="text-green-400 text-sm font-semibold">Random reward: {entry.tickets} tickets</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-sm">{entry.hoursAgo} hours ago</p>
                      <div className="flex items-center justify-end mt-1">
                        <span className="text-green-400 text-sm font-bold">+{entry.tickets}</span>
                        <TicketIcon className="h-3 w-3 text-green-400 ml-1" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 'market':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent mb-4">
                🛒 NFT Marketplace
              </h2>
              <p className="text-gray-300 text-lg">
                High-rarity memes become NFTs. Auction proceeds fund the lottery prize pool!
              </p>
            </div>

            {/* Featured Auctions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { rarity: 'Legendary', color: 'from-yellow-400 to-orange-500', price: '2.5 SOL', bids: 23 },
                { rarity: 'Epic', color: 'from-purple-400 to-pink-500', price: '1.2 SOL', bids: 15 },
                { rarity: 'Rare', color: 'from-blue-400 to-cyan-500', price: '0.8 SOL', bids: 8 },
                { rarity: 'Uncommon', color: 'from-green-400 to-emerald-500', price: '0.3 SOL', bids: 4 },
                { rarity: 'Common', color: 'from-gray-400 to-slate-500', price: '0.1 SOL', bids: 2 },
                { rarity: 'Epic', color: 'from-purple-400 to-pink-500', price: '1.8 SOL', bids: 19 }
              ].map((nft, index) => (
                <div key={index} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:border-purple-500/50 transition-all duration-300 group">
                  <div className="aspect-square bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center relative">
                    <SparklesIcon className="h-16 w-16 text-purple-400" />
                    <span className="ml-2 text-3xl">🏆</span>
                    <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${nft.color}`}>
                      {nft.rarity}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-white mb-1">Legendary Meme #{index + 1}</h3>
                    <p className="text-gray-400 text-sm mb-3">1,247 votes → NFT</p>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Current Bid:</span>
                        <span className="text-white font-semibold">{nft.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Bids:</span>
                        <span className="text-purple-400">{nft.bids}</span>
                      </div>
                    </div>
                    <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 py-2 rounded-lg text-white font-medium transition-all duration-200 group-hover:scale-105">
                      Place Bid
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Prize Pool Info */}
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6 mt-8">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white mb-2">🏆 Current Prize Pool</h3>
                <p className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-2">
                  12.7 SOL
                </p>
                <p className="text-gray-300 text-sm mb-4">
                  Funded by NFT auction proceeds. Next draw: Sunday 8PM UTC
                </p>
                <div className="flex justify-center space-x-6 text-sm">
                  <div className="flex items-center">
                    <FireIcon className="h-4 w-4 text-orange-400 mr-1" />
                    <span className="text-gray-300">127 participants</span>
                  </div>
                  <div className="flex items-center">
                    <TicketIcon className="h-4 w-4 text-purple-400 mr-1" />
                    <span className="text-gray-300">3,421 total tickets</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <SparklesIcon className="h-8 w-8 text-purple-400 mr-2" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                MemeForge
              </h1>
            </div>
            
            {/* Wallet Connection */}
            <button
              onClick={() => setWalletConnected(!walletConnected)}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                walletConnected
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
              }`}
            >
              <WalletIcon className="h-5 w-5 mr-2" />
              {walletConnected ? 'abc...xyz' : 'Connect Wallet'}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-black/10 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-0">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-4 font-medium transition-all duration-200 border-b-2 ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-white bg-gradient-to-r from-purple-500/10 to-pink-500/10'
                      : 'border-transparent text-gray-300 hover:text-white hover:border-gray-500'
                  }`}
                >
                  <IconComponent className="h-5 w-5 mr-2" />
                  <span className="hidden sm:inline">{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Description */}
      <div className="bg-black/5 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <p className="text-center text-gray-300 text-sm">
            {tabs.find(tab => tab.id === activeTab)?.description}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Dashboard;