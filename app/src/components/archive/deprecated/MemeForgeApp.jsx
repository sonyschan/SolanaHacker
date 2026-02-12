import React, { useState, useEffect } from 'react';
import { useSolanaWallet, WalletButton } from './SolanaWalletIntegration';

const MemeForgeApp = () => {
  const [activeTab, setActiveTab] = useState('forge');
  const [votingPhase, setVotingPhase] = useState('memeSelection'); // 'memeSelection' or 'rarityVoting'
  const [currentMemes, setCurrentMemes] = useState([]);
  const [selectedMeme, setSelectedMeme] = useState(null);
  const [userTickets, setUserTickets] = useState(247);
  const [userStreak, setUserStreak] = useState(3);
  const { isConnected } = useSolanaWallet();

  // Mock data for current memes
  useEffect(() => {
    setCurrentMemes([
      {
        id: 1,
        imageUrl: '/api/placeholder/300/300',
        title: 'SOL to the Moon! 🚀',
        votes: 42,
        description: 'When Solana breaks $200 again...'
      },
      {
        id: 2,
        imageUrl: '/api/placeholder/300/300',
        title: 'DeFi Summer 2026',
        votes: 38,
        description: 'The eternal cycle continues'
      },
      {
        id: 3,
        imageUrl: '/api/placeholder/300/300',
        title: 'NFT Flippers Anonymous',
        votes: 35,
        description: 'Support group meeting every Tuesday'
      }
    ]);
  }, []);

  const rarityLevels = [
    { name: 'Common', multiplier: '1x', color: 'bg-gray-500' },
    { name: 'Uncommon', multiplier: '2x', color: 'bg-green-500' },
    { name: 'Rare', multiplier: '5x', color: 'bg-blue-500' },
    { name: 'Epic', multiplier: '10x', color: 'bg-purple-500' },
    { name: 'Legendary', multiplier: '25x', color: 'bg-orange-500' }
  ];

  const handleVoteMeme = (memeId) => {
    if (!isConnected) {
      alert('Please connect your wallet to vote!');
      return;
    }
    
    // Update vote count
    setCurrentMemes(memes => 
      memes.map(meme => 
        meme.id === memeId 
          ? { ...meme, votes: meme.votes + 1 }
          : meme
      )
    );

    // Award tickets (8-15 random based on streak)
    const baseTickets = userStreak >= 5 ? 12 : userStreak >= 2 ? 10 : 8;
    const randomBonus = Math.floor(Math.random() * 6);
    const ticketsEarned = baseTickets + randomBonus;
    setUserTickets(prev => prev + ticketsEarned);

    // Show ticket animation (simplified)
    alert(`🎉 Vote recorded! You earned ${ticketsEarned} tickets!`);
  };

  const handleVoteRarity = (rarity) => {
    if (!isConnected) {
      alert('Please connect your wallet to vote!');
      return;
    }
    
    alert(`🏆 Rarity vote for "${rarity}" recorded! Phase 2 complete.`);
    // In real app, this would advance to next cycle
  };

  const ForgeTab = () => (
    <div className="space-y-6">
      {/* Phase Indicator */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">
              {votingPhase === 'memeSelection' ? 'Phase 1: Choose Your Favorite Meme' : 'Phase 2: Vote on Rarity'}
            </h3>
            <p className="text-purple-100">
              {votingPhase === 'memeSelection' 
                ? 'Vote for the meme that should become today\'s NFT' 
                : `Decide the rarity level for "${selectedMeme?.title}"`}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{userStreak} day streak</div>
            <div className="text-sm">Next: {userStreak >= 5 ? '10-15' : userStreak >= 2 ? '9-12' : '8-10'} tickets</div>
          </div>
        </div>
      </div>

      {votingPhase === 'memeSelection' ? (
        <div className="grid md:grid-cols-3 gap-6">
          {currentMemes.map(meme => (
            <div key={meme.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="h-64 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-4xl">🖼️</span>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg mb-2">{meme.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{meme.description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">{meme.votes} votes</div>
                  <button 
                    onClick={() => handleVoteMeme(meme.id)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                  >
                    Vote 💜
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-2xl font-bold mb-4">Vote on Rarity for: {selectedMeme?.title}</h3>
          <div className="grid md:grid-cols-5 gap-4">
            {rarityLevels.map((rarity, index) => (
              <div key={index} className="text-center">
                <div className={`${rarity.color} text-white p-4 rounded-lg mb-2`}>
                  <div className="text-lg font-bold">{rarity.name}</div>
                  <div className="text-sm">{rarity.multiplier} rewards</div>
                </div>
                <button 
                  onClick={() => handleVoteRarity(rarity.name)}
                  className="w-full bg-gray-100 hover:bg-gray-200 p-2 rounded transition"
                >
                  Vote
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Switch Phase Button (for demo) */}
      <div className="text-center">
        <button 
          onClick={() => {
            if (votingPhase === 'memeSelection') {
              setSelectedMeme(currentMemes[0]);
              setVotingPhase('rarityVoting');
            } else {
              setVotingPhase('memeSelection');
              setSelectedMeme(null);
            }
          }}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
        >
          {votingPhase === 'memeSelection' ? 'Proceed to Phase 2 →' : '← Back to Phase 1'}
        </button>
      </div>
    </div>
  );

  const TicketsTab = () => (
    <div className="space-y-6">
      {/* User Stats */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6 rounded-lg">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold">{userTickets}</div>
            <div className="text-green-100">Total Tickets</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{userStreak}</div>
            <div className="text-green-100">Day Streak</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">12.7</div>
            <div className="text-green-100">SOL Prize Pool</div>
          </div>
        </div>
      </div>

      {/* Prize Distribution */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">Weekly Prize Distribution</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
            <span>🥇 1st Place (40%)</span>
            <span className="font-bold">5.08 SOL</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span>🥈 2nd Place (25%)</span>
            <span className="font-bold">3.18 SOL</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
            <span>🥉 3rd Place (15%)</span>
            <span className="font-bold">1.91 SOL</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
            <span>🎁 4th-10th Place (20%)</span>
            <span className="font-bold">0.36 SOL each</span>
          </div>
        </div>
        <div className="mt-4 text-center">
          <div className="text-sm text-gray-600">Next draw: Sunday 8PM UTC</div>
          <div className="text-sm text-gray-600">Your win probability: {((userTickets / 50000) * 100).toFixed(2)}%</div>
        </div>
      </div>

      {/* Recent Winners */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">Recent Winners</h3>
        <div className="space-y-2">
          <div className="flex justify-between p-2">
            <span>🥇 0x7a2b...f3c1</span>
            <span className="font-bold">5.2 SOL</span>
          </div>
          <div className="flex justify-between p-2">
            <span>🥈 0x9d4e...b8a6</span>
            <span className="font-bold">3.1 SOL</span>
          </div>
          <div className="flex justify-between p-2">
            <span>🥉 0x2c5f...e9d4</span>
            <span className="font-bold">1.9 SOL</span>
          </div>
        </div>
      </div>
    </div>
  );

  const MarketTab = () => (
    <div className="space-y-6">
      {/* Active Auctions */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">Active Auctions</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { id: 1, title: 'Crypto Winter Survival', rarity: 'Epic', currentBid: '2.5 SOL', timeLeft: '2d 14h' },
            { id: 2, title: 'Diamond Hands Forever', rarity: 'Rare', currentBid: '1.2 SOL', timeLeft: '1d 8h' },
            { id: 3, title: 'HODL Gang Strong', rarity: 'Legendary', currentBid: '5.8 SOL', timeLeft: '6h 23m' }
          ].map(auction => (
            <div key={auction.id} className="border rounded-lg p-4">
              <div className="h-40 bg-gray-200 rounded mb-4 flex items-center justify-center">
                <span className="text-gray-500 text-2xl">🖼️</span>
              </div>
              <h4 className="font-bold">{auction.title}</h4>
              <div className={`inline-block px-2 py-1 rounded text-xs text-white mb-2 ${
                auction.rarity === 'Legendary' ? 'bg-orange-500' :
                auction.rarity === 'Epic' ? 'bg-purple-500' :
                auction.rarity === 'Rare' ? 'bg-blue-500' : 'bg-green-500'
              }`}>
                {auction.rarity}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Current Bid:</span>
                  <span className="font-bold">{auction.currentBid}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time Left:</span>
                  <span className="font-bold text-red-600">{auction.timeLeft}</span>
                </div>
                <button className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700">
                  Place Bid
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Market Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold mb-4">Market Activity (24h)</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Total Volume:</span>
              <span className="font-bold">47.3 SOL</span>
            </div>
            <div className="flex justify-between">
              <span>NFTs Sold:</span>
              <span className="font-bold">12</span>
            </div>
            <div className="flex justify-between">
              <span>Avg. Price:</span>
              <span className="font-bold">3.9 SOL</span>
            </div>
            <div className="flex justify-between">
              <span>Active Bids:</span>
              <span className="font-bold">28</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold mb-4">Your Activity</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>NFTs Won:</span>
              <span className="font-bold">2</span>
            </div>
            <div className="flex justify-between">
              <span>Total Spent:</span>
              <span className="font-bold">4.7 SOL</span>
            </div>
            <div className="flex justify-between">
              <span>Active Bids:</span>
              <span className="font-bold">1</span>
            </div>
            <div className="flex justify-between">
              <span>Success Rate:</span>
              <span className="font-bold">67%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-purple-600">MemeForge</h1>
              <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">MVP</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Balance: {userTickets} tickets
              </div>
              <WalletButton />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'forge', label: 'Forge', icon: '⚡' },
              { id: 'tickets', label: 'My Tickets', icon: '🎫' },
              { id: 'market', label: 'Market', icon: '🏪' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-4 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'forge' && <ForgeTab />}
        {activeTab === 'tickets' && <TicketsTab />}
        {activeTab === 'market' && <MarketTab />}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold mb-4">MemeForge</h3>
              <p className="text-sm text-gray-300">
                AI-powered meme NFT voting platform. Democratic rarity, fair rewards.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Value Cycle</h4>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>🤖 AI generates memes</li>
                <li>❤️ Users vote democratically</li>
                <li>🏆 Rarity decided by community</li>
                <li>🎨 NFTs minted automatically</li>
                <li>🛒 Auctions fund prize pool</li>
                <li>🎁 Weekly rewards distributed</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Stats</h4>
              <div className="text-sm text-gray-300 space-y-2">
                <div>Prize Pool: 12.7 SOL</div>
                <div>Active Users: 1,247</div>
                <div>NFTs Minted: 89</div>
                <div>Total Volume: 423.5 SOL</div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-4 text-center text-sm text-gray-400">
            <p>Built on Solana • Powered by AI • Governed by Community</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MemeForgeApp;