import React from 'react';

const MemePreview = () => {
  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600/50">
      <h4 className="text-white font-bold mb-4 text-center flex items-center justify-center space-x-2">
        <span>👀</span>
        <span>See What You're Voting On</span>
      </h4>
      
      {/* Mock Meme Examples */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Example 1 - Legendary */}
        <div className="bg-purple-900/30 rounded-lg p-3 border border-purple-500/30">
          <div className="text-center mb-2">
            <div className="text-4xl mb-1">🚀</div>
            <div className="text-xs text-purple-300 font-bold">LEGENDARY</div>
          </div>
          <div className="bg-gray-900/50 rounded p-2 text-xs text-center">
            <div className="text-gray-300 mb-1">"Doge to Mars"</div>
            <div className="text-purple-200">Community voted: 78% Legendary</div>
            <div className="text-yellow-300">Now worth: 12.5 SOL</div>
          </div>
        </div>

        {/* Example 2 - Rare */}
        <div className="bg-blue-900/30 rounded-lg p-3 border border-blue-500/30">
          <div className="text-center mb-2">
            <div className="text-4xl mb-1">😎</div>
            <div className="text-xs text-blue-300 font-bold">RARE</div>
          </div>
          <div className="bg-gray-900/50 rounded p-2 text-xs text-center">
            <div className="text-gray-300 mb-1">"Cool Cat Crypto"</div>
            <div className="text-blue-200">Community voted: 65% Rare</div>
            <div className="text-yellow-300">Now worth: 3.2 SOL</div>
          </div>
        </div>

        {/* Example 3 - Common */}
        <div className="bg-green-900/30 rounded-lg p-3 border border-green-500/30">
          <div className="text-center mb-2">
            <div className="text-4xl mb-1">🐸</div>
            <div className="text-xs text-green-300 font-bold">COMMON</div>
          </div>
          <div className="bg-gray-900/50 rounded p-2 text-xs text-center">
            <div className="text-gray-300 mb-1">"Basic Pepe"</div>
            <div className="text-green-200">Community voted: 70% Common</div>
            <div className="text-yellow-300">Now worth: 0.5 SOL</div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-yellow-900/20 rounded-lg border border-yellow-500/30 text-center">
        <p className="text-yellow-200 text-sm">
          <strong>Your vote decides the value!</strong> Each meme starts equal - community voting determines who becomes rare.
        </p>
      </div>
    </div>
  );
};

export default MemePreview;