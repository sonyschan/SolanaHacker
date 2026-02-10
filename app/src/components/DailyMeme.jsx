import React from 'react';

const DailyMeme = () => {
  // Mock daily meme data
  const todaysMeme = {
    id: "meme-2026-02-07",
    imageUrl: "https://picsum.photos/800/800?random=42", // Higher resolution placeholder
    title: "When SOL hits $300 but your portfolio is still down",
    aiPrompt: "A confused penguin wearing a top hat, standing in front of a green chart, digital art style",
    traits: [
      { name: "Background", value: "Crypto Charts" },
      { name: "Character", value: "Confused Penguin" },
      { name: "Accessory", value: "Diamond Top Hat" },
      { name: "Expression", value: "Bewildered" },
      { name: "Style", value: "Digital Art" },
      { name: "Rarity", value: "TBD", special: true } // Special human-voted trait
    ],
    currentBid: 1.2,
    totalBids: 23,
    auctionEndsIn: "14:35:22"
  };

  const getTraitColor = (trait) => {
    if (trait.special) {
      return 'text-yellow-300 bg-yellow-500/20 border-yellow-500/30';
    }
    return 'text-gray-300 bg-gray-500/20 border-gray-500/30';
  };

  return (
    <div className="card-elevated p-4 sm:p-6 lg:p-8 card-interactive">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
        <div className="flex-1">
          <h2 className="heading-lg text-high-contrast flex items-center mb-2 sm:mb-3">
            <span className="mr-2 text-3xl sm:text-4xl">🎨</span>
            Today's Unique Meme NFT
          </h2>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="badge-live">
              🔴 LIVE AUCTION
            </span>
            <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border border-purple-500/30">
              1/1 Unique NFT
            </span>
            <span className="text-gray-400 text-xs sm:text-sm">
              February 7, 2026
            </span>
          </div>
        </div>
        
        {/* Auction Info - Mobile optimized */}
        <div className="bg-gray-700/50 rounded-xl p-3 sm:p-4 text-center border border-gray-600/50 min-w-fit">
          <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-1">
            ⚡ {todaysMeme.currentBid} SOL
          </div>
          <div className="text-gray-300 text-xs sm:text-sm mb-2">
            💰 {todaysMeme.totalBids} bids • ⏰ {todaysMeme.auctionEndsIn}
          </div>
          <button className="btn-primary text-sm w-full">
            Place Bid
          </button>
        </div>
      </div>

      {/* Main Content - Responsive Layout */}
      <div className="responsive-grid-2 gap-6 sm:gap-8">
        
        {/* Meme Image - Improved presentation */}
        <div className="relative order-1">
          <div className="relative overflow-hidden rounded-2xl border-2 border-gray-600/50 shadow-2xl group">
            <div className="aspect-square bg-gray-700/30 loading-shimmer">
              <img 
                src={todaysMeme.imageUrl} 
                alt={todaysMeme.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                onLoad={(e) => {
                  e.target.parentElement.classList.remove('loading-shimmer');
                }}
              />
            </div>
            
            {/* Image Overlays */}
            <div className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-black/80 backdrop-blur-sm rounded-lg px-2 sm:px-3 py-1">
              <span className="text-white text-xs sm:text-sm font-semibold flex items-center">
                <span className="mr-1">🤖</span>
                AI Generated
              </span>
            </div>
            
            <div className="absolute top-3 sm:top-4 left-3 sm:left-4 bg-purple-600/90 backdrop-blur-sm rounded-lg px-2 sm:px-3 py-1 border border-purple-400/50">
              <span className="text-white text-xs sm:text-sm font-semibold">1/1 Unique</span>
            </div>
            
            {/* Title Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-3 sm:p-4">
              <h3 className="text-white font-bold text-base sm:text-lg lg:text-xl leading-tight">
                {todaysMeme.title}
              </h3>
            </div>
          </div>
          
          {/* Mobile: Quick Auction Actions */}
          <div className="sm:hidden mt-4 flex gap-3">
            <button className="btn-primary flex-1 text-sm">
              <span className="mr-1">💎</span>
              Place Bid
            </button>
            <button className="btn-secondary text-sm px-4">
              <span>❤️</span>
            </button>
            <button className="btn-secondary text-sm px-4">
              <span>📤</span>
            </button>
          </div>
        </div>

        {/* Meme Details - Improved spacing */}
        <div className="space-y-4 sm:space-y-6 order-2">
          
          {/* AI Prompt */}
          <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600/50">
            <h4 className="text-medium-contrast font-semibold mb-3 flex items-center text-sm sm:text-base">
              <span className="mr-2 text-lg sm:text-xl">🎭</span>
              AI Creation Prompt
            </h4>
            <p className="text-gray-300 text-xs sm:text-sm italic leading-relaxed">
              "{todaysMeme.aiPrompt}"
            </p>
          </div>

          {/* NFT Traits - Responsive Grid */}
          <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600/50">
            <h4 className="text-medium-contrast font-semibold mb-4 flex items-center text-sm sm:text-base">
              <span className="mr-2 text-lg sm:text-xl">🏷️</span>
              NFT Traits (1/1 Unique)
            </h4>
            <div className="space-y-2 sm:space-y-3">
              {todaysMeme.traits.map((trait, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-gray-800/50 rounded-lg border border-gray-600/30 space-y-1 sm:space-y-0">
                  <span className="text-gray-300 font-medium text-sm sm:text-base">{trait.name}</span>
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
                    <span className="text-white font-semibold text-sm sm:text-base">{trait.value}</span>
                    {trait.special ? (
                      <div className="flex flex-col sm:items-end">
                        <span className={`text-xs px-2 sm:px-3 py-1 rounded-full border ${getTraitColor(trait)}`}>
                          Voting in Progress
                        </span>
                        <span className="text-yellow-200 text-xs mt-1 font-semibold">
                          🌟 Human-Decided
                        </span>
                      </div>
                    ) : (
                      <span className={`text-xs px-2 sm:px-3 py-1 rounded-full border ${getTraitColor(trait)}`}>
                        Fixed Trait
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Innovation Highlight */}
            <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <p className="text-yellow-200 text-xs sm:text-sm font-semibold leading-relaxed">
                ⭐ <strong>Revolutionary:</strong> The "Rarity" trait will be permanently determined by community voting consensus!
              </p>
            </div>
          </div>

          {/* Auction Rules - Collapsed on mobile */}
          <div className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-xl p-4 border border-purple-400/20">
            <h4 className="text-medium-contrast font-semibold mb-3 flex items-center text-sm sm:text-base">
              <span className="mr-2 text-lg sm:text-xl">🏆</span>
              Auction & Revenue Split
            </h4>
            <div className="text-gray-200 text-xs sm:text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <span className="mr-2">⏰</span>
                  <span>Ends at midnight UTC</span>
                </span>
                <span className="text-green-400 font-semibold">{todaysMeme.auctionEndsIn}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <span className="mr-2">🎰</span>
                  <span>To weekly lottery pool</span>
                </span>
                <span className="text-blue-400 font-semibold">50%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <span className="mr-2">🎨</span>
                  <span>Tomorrow's meme creation</span>
                </span>
                <span className="text-purple-400 font-semibold">30%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <span className="mr-2">⚙️</span>
                  <span>Platform development</span>
                </span>
                <span className="text-pink-400 font-semibold">20%</span>
              </div>
            </div>
          </div>

          {/* Desktop: Auction Actions */}
          <div className="hidden sm:flex gap-3">
            <button className="btn-primary flex-1">
              <span className="mr-2">💎</span>
              Place Bid
            </button>
            <button className="btn-secondary">
              <span className="mr-2">❤️</span>
              Favorite
            </button>
            <button className="btn-secondary">
              <span className="mr-2">📤</span>
              Share
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DailyMeme;