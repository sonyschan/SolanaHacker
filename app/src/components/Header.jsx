import React from 'react';

const Header = () => {
  return (
    <header className="bg-gray-800 border-b border-gray-700 shadow-xl">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="text-3xl">🎨</div>
            <div>
              <h1 className="text-2xl font-bold text-white">MemeForge</h1>
              <p className="text-gray-300 text-sm">AI-Powered Meme NFTs</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#meme" className="text-gray-300 hover:text-white transition-colors font-medium">
              Today's Meme
            </a>
            <a href="#vote" className="text-gray-300 hover:text-white transition-colors font-medium">
              Vote
            </a>
            <a href="#lottery" className="text-gray-300 hover:text-white transition-colors font-medium">
              Lottery
            </a>
            <a href="#stats" className="text-gray-300 hover:text-white transition-colors font-medium">
              Stats
            </a>
          </nav>

          {/* Status Indicator */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 bg-green-500/10 border border-green-500/30 rounded-full px-3 py-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-300 text-sm font-medium">Live</span>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-white font-semibold text-sm">Daily Auction</div>
              <div className="text-gray-400 text-xs">Ends at midnight UTC</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;