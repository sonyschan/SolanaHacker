import React, { useState } from 'react';

const MarketTab = () => {
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState('');

  // Mock data - in production would come from Solana programs
  const activeAuctions = [
    {
      id: 1,
      title: 'Solana Season',
      image: 'https://via.placeholder.com/300x300/EC4899/FFFFFF?text=Solana+Season',
      rarity: 'Epic',
      rarityColor: 'bg-purple-600',
      currentBid: 1.2,
      bidder: 'ABC...xyz',
      timeLeft: '2d 14h 23m',
      bidCount: 15,
      description: 'Fast transactions, faster gains',
      traits: ['Crypto', 'Bullish', 'Speed', 'Solana']
    },
    {
      id: 2,
      title: 'Bitcoin to 100K?',
      image: 'https://via.placeholder.com/300x300/F59E0B/FFFFFF?text=Bitcoin+100K',
      rarity: 'Rare',
      rarityColor: 'bg-blue-600',
      currentBid: 0.8,
      bidder: 'DEF...abc',
      timeLeft: '1d 8h 45m',
      bidCount: 23,
      description: 'When your portfolio hits different...',
      traits: ['Bitcoin', 'Moon', 'HODL', 'Price']
    },
    {
      id: 3,
      title: 'NFT Apes Forever',
      image: 'https://via.placeholder.com/300x300/10B981/FFFFFF?text=NFT+Apes',
      rarity: 'Legendary',
      rarityColor: 'bg-yellow-600',
      currentBid: 2.5,
      bidder: 'GHI...def',
      timeLeft: '18h 12m',
      bidCount: 31,
      description: 'Diamond hands forever',
      traits: ['NFT', 'Apes', 'Diamond Hands', 'Forever']
    }
  ];

  const recentSales = [
    { title: 'Doge to Mars', price: 1.8, buyer: 'JKL...ghi', date: '2026-02-08', rarity: 'Epic' },
    { title: 'Ethereum Merge', price: 3.2, buyer: 'MNO...jkl', date: '2026-02-07', rarity: 'Legendary' },
    { title: 'DeFi Summer', price: 0.9, buyer: 'PQR...mno', date: '2026-02-06', rarity: 'Rare' },
    { title: 'Crypto Winter', price: 0.4, buyer: 'STU...pqr', date: '2026-02-05', rarity: 'Uncommon' }
  ];

  const handleBid = (auctionId) => {
    if (!bidAmount || parseFloat(bidAmount) <= 0) return;
    
    // In production, this would interact with Solana program
    console.log(`Bidding ${bidAmount} SOL on auction ${auctionId}`);
    
    // Mock update - in production would come from blockchain
    const updatedAuctions = activeAuctions.map(auction => 
      auction.id === auctionId 
        ? { ...auction, currentBid: parseFloat(bidAmount), bidCount: auction.bidCount + 1 }
        : auction
    );
    
    setBidAmount('');
    setSelectedAuction(null);
    
    // Show success message (could be a toast)
    alert(`Bid of ${bidAmount} SOL submitted successfully!`);
  };

  const getRarityColor = (rarity) => {
    switch (rarity.toLowerCase()) {
      case 'common': return 'bg-gray-600';
      case 'uncommon': return 'bg-green-600';
      case 'rare': return 'bg-blue-600';
      case 'epic': return 'bg-purple-600';
      case 'legendary': return 'bg-yellow-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="space-y-8">
      {/* Market Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-600 to-emerald-600 bg-opacity-20 border border-green-600 border-opacity-40 rounded-xl p-6 text-center">
          <div className="text-3xl mb-2">💎</div>
          <h3 className="font-bold text-lg mb-1">Active Auctions</h3>
          <div className="text-3xl font-bold text-green-300">{activeAuctions.length}</div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-cyan-600 bg-opacity-20 border border-blue-600 border-opacity-40 rounded-xl p-6 text-center">
          <div className="text-3xl mb-2">📈</div>
          <h3 className="font-bold text-lg mb-1">Total Volume</h3>
          <div className="text-3xl font-bold text-blue-300">47.3 SOL</div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-pink-600 bg-opacity-20 border border-purple-600 border-opacity-40 rounded-xl p-6 text-center">
          <div className="text-3xl mb-2">🏆</div>
          <h3 className="font-bold text-lg mb-1">Avg Price</h3>
          <div className="text-3xl font-bold text-purple-300">1.2 SOL</div>
        </div>

        <div className="bg-gradient-to-br from-orange-600 to-red-600 bg-opacity-20 border border-orange-600 border-opacity-40 rounded-xl p-6 text-center">
          <div className="text-3xl mb-2">🔥</div>
          <h3 className="font-bold text-lg mb-1">NFTs Minted</h3>
          <div className="text-3xl font-bold text-orange-300">89</div>
        </div>
      </div>

      {/* Active Auctions */}
      <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-8 border border-white border-opacity-20">
        <h2 className="text-2xl font-bold mb-6">🔥 Active Auctions</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {activeAuctions.map((auction) => (
            <div key={auction.id} className="bg-gray-800 bg-opacity-50 rounded-xl overflow-hidden border border-gray-600 border-opacity-50 hover:scale-105 transition-transform">
              <img
                src={auction.image}
                alt={auction.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold">{auction.title}</h3>
                  <span className={`${auction.rarityColor} bg-opacity-20 border border-opacity-40 px-2 py-1 rounded text-xs font-bold`}
                        style={{ borderColor: auction.rarityColor.replace('bg-', '').replace('-600', '') }}>
                    {auction.rarity}
                  </span>
                </div>
                
                <p className="text-sm text-gray-300 mb-4">{auction.description}</p>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Current bid:</span>
                    <span className="font-bold text-yellow-300">{auction.currentBid} SOL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Bids:</span>
                    <span className="text-sm">{auction.bidCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Time left:</span>
                    <span className="text-sm text-red-300">{auction.timeLeft}</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setSelectedAuction(auction)}
                    className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold hover:scale-105 transition-transform"
                  >
                    💰 Place Bid
                  </button>
                  <button className="px-4 py-2 bg-gray-600 bg-opacity-30 border border-gray-600 rounded-lg hover:bg-gray-600 hover:bg-opacity-50 transition-all">
                    👁️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bid Modal */}
      {selectedAuction && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-600 rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Place Bid</h3>
              <p className="text-gray-300">{selectedAuction.title}</p>
              <p className="text-sm text-gray-400">Current bid: {selectedAuction.currentBid} SOL</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Your Bid (SOL)</label>
                <input
                  type="number"
                  step="0.1"
                  min={selectedAuction.currentBid * 1.05}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder={`Minimum: ${(selectedAuction.currentBid * 1.05).toFixed(1)}`}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Minimum bid: {(selectedAuction.currentBid * 1.05).toFixed(1)} SOL (+5%)
                </p>
              </div>

              <div className="bg-yellow-600 bg-opacity-20 border border-yellow-600 border-opacity-40 rounded-lg p-4">
                <p className="text-sm text-yellow-300">
                  ⚠️ Your SOL will be held in escrow. If outbid, funds are automatically returned (minus gas fees).
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedAuction(null)}
                  className="flex-1 py-3 bg-gray-600 bg-opacity-30 border border-gray-600 rounded-lg hover:bg-gray-600 hover:bg-opacity-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleBid(selectedAuction.id)}
                  disabled={!bidAmount || parseFloat(bidAmount) < selectedAuction.currentBid * 1.05}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  Confirm Bid
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Sales */}
      <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-8 border border-white border-opacity-20">
        <h2 className="text-2xl font-bold mb-6">📊 Recent Sales</h2>
        <div className="space-y-4">
          {recentSales.map((sale, index) => (
            <div key={index} className="bg-gray-800 bg-opacity-30 rounded-lg p-4 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 ${getRarityColor(sale.rarity)} rounded-full`}></div>
                <div>
                  <div className="font-medium">{sale.title}</div>
                  <div className="text-sm text-gray-400">{sale.rarity} • {sale.date}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-green-300 font-bold">{sale.price} SOL</div>
                <div className="text-xs text-gray-400">{sale.buyer}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How Auctions Work */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 bg-opacity-20 border border-blue-600 border-opacity-40 rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">🏛️ How Auctions Work</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl mb-3">⏰</div>
            <h3 className="font-bold mb-2">3-Day Auctions</h3>
            <p className="text-sm text-gray-300">
              Each NFT auctions for exactly 3 days. Highest bidder wins when timer expires.
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">💰</div>
            <h3 className="font-bold mb-2">5% Minimum Increase</h3>
            <p className="text-sm text-gray-300">
              New bids must be at least 5% higher than current bid. SOL held in escrow.
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">🏆</div>
            <h3 className="font-bold mb-2">80% to Prize Pool</h3>
            <p className="text-sm text-gray-300">
              80% of final sale price goes to weekly lottery. 20% for platform operations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketTab;