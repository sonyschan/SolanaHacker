import React, { useState } from 'react';

const CryptoExplainer = () => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-blue-900/20 rounded-xl p-4 border border-blue-500/30 text-center">
      <h4 className="text-blue-300 font-bold mb-2 flex items-center justify-center space-x-2">
        <span>🪙</span>
        <span>What is SOL?</span>
      </h4>
      
      <p className="text-gray-200 text-sm mb-3">
        SOL is Solana's cryptocurrency - like Bitcoin but faster and cheaper. 1 SOL ≈ $200 USD
      </p>
      
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="text-blue-300 underline text-sm hover:text-blue-200"
      >
        {showDetails ? 'Hide details' : 'New to crypto? Learn more'}
      </button>
      
      {showDetails && (
        <div className="mt-3 p-3 bg-gray-800/50 rounded-lg text-left text-sm space-y-2">
          <div>
            <strong className="text-blue-300">What is SOL?</strong>
            <p className="text-gray-200">Solana's digital currency, like digital cash that can be sent instantly worldwide</p>
          </div>
          
          <div>
            <strong className="text-blue-300">How do I get it?</strong>
            <p className="text-gray-200">You earn it free by voting! No need to buy anything first</p>
          </div>
          
          <div>
            <strong className="text-blue-300">What can I do with it?</strong>
            <p className="text-gray-200">Keep it, trade for USD, or use in other Solana apps</p>
          </div>
          
          <div className="p-2 bg-green-900/30 rounded text-center">
            <span className="text-green-300 text-xs font-bold">
              💡 Best part: You earn SOL just by voting on memes!
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CryptoExplainer;