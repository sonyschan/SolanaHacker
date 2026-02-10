import React, { useState } from 'react';

const SOLExplainer = () => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-blue-900/20 rounded-xl p-6 border border-blue-500/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-blue-300 flex items-center">
          💎 What is SOL?
        </h3>
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          {showDetails ? 'Hide' : 'Learn More'}
        </button>
      </div>
      
      <div className="space-y-4">
        <div className="text-white">
          <p className="text-base font-semibold mb-2">
            SOL is real cryptocurrency you can spend or save
          </p>
          <div className="text-sm text-gray-300">
            Current value: <span className="text-green-300 font-semibold">$200 per SOL</span>
          </div>
        </div>

        {showDetails && (
          <div className="space-y-3 text-sm text-gray-300 border-t border-blue-500/20 pt-4">
            <div className="flex items-start space-x-3">
              <span className="text-blue-400">💳</span>
              <div>
                <strong className="text-white">Cash Out:</strong> Sell on Coinbase, Binance, or other exchanges for real money
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <span className="text-blue-400">🛒</span>
              <div>
                <strong className="text-white">Spend:</strong> Use for NFTs, DeFi, games, and other crypto services
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <span className="text-blue-400">🏦</span>
              <div>
                <strong className="text-white">Save:</strong> Keep in your wallet as investment (SOL has grown 50x+ in past years)
              </div>
            </div>
            
            <div className="bg-green-900/20 rounded-lg p-3 border border-green-500/20 mt-4">
              <div className="text-green-300 font-semibold text-xs">
                💰 MemeForge Prize Example
              </div>
              <div className="text-gray-300 text-xs">
                Win 8.7 SOL = $1,740 USD real money
              </div>
            </div>
          </div>
        )}
        
        <div className="text-center">
          <div className="text-yellow-300 font-semibold text-sm">
            🎯 Weekly Prize Pool: 47.3 SOL
          </div>
          <div className="text-gray-400 text-xs">
            ≈ $9,460 USD distributed to winners
          </div>
        </div>
      </div>
    </div>
  );
};

export default SOLExplainer;