import React from 'react';

const SimpleExplainer = () => {
  return (
    <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-2xl p-6 border border-purple-500/30 text-center">
      <h3 className="text-xl sm:text-2xl font-bold text-yellow-300 mb-4">
        🤔 What makes MemeForge different?
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Traditional NFTs */}
        <div className="bg-red-900/30 rounded-xl p-4 border border-red-500/30">
          <h4 className="font-bold text-red-300 mb-3 text-lg">❌ Other NFT Projects</h4>
          <div className="space-y-2 text-sm text-gray-200">
            <p><strong>Step 1:</strong> Mint 10,000 NFTs first</p>
            <p><strong>Step 2:</strong> Algorithm pre-decides: "100 will be rare, 1 will be legendary"</p>
            <p><strong>Step 3:</strong> You buy random NFT and hope it's valuable</p>
            <p className="text-red-300 font-bold">Problem: Ugly NFTs can be "legendary" just by luck!</p>
          </div>
        </div>

        {/* MemeForge */}
        <div className="bg-green-900/30 rounded-xl p-4 border border-green-500/30">
          <h4 className="font-bold text-green-300 mb-3 text-lg">✅ MemeForge</h4>
          <div className="space-y-2 text-sm text-gray-200">
            <p><strong>Step 1:</strong> AI creates 1 meme (not NFT yet!)</p>
            <p><strong>Step 2:</strong> Community votes: "Common? Rare? Legendary?"</p>
            <p><strong>Step 3:</strong> NFT minted with the voted rarity</p>
            <p className="text-green-300 font-bold">Result: Only truly great memes become legendary!</p>
          </div>
        </div>
      </div>

      {/* Simple Example */}
      <div className="bg-yellow-900/20 rounded-xl p-4 border border-yellow-500/30">
        <h4 className="text-yellow-300 font-bold mb-2 text-lg">
          📝 Real Example: How "Doge in Space" became Legendary
        </h4>
        <div className="text-gray-200 text-sm text-left sm:text-center">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-gray-800/50 p-2 rounded">
              <div className="font-bold text-blue-300">1. AI creates meme</div>
              <div>"Doge in Space" image</div>
              <div className="text-gray-400">(No NFT exists yet)</div>
            </div>
            <div className="bg-gray-800/50 p-2 rounded">
              <div className="font-bold text-green-300">2. Community votes</div>
              <div>956 people voted "Legendary"</div>
              <div className="text-gray-400">(78% of all votes)</div>
            </div>
            <div className="bg-gray-800/50 p-2 rounded">
              <div className="font-bold text-purple-300">3. NFT minted</div>
              <div>Legendary rarity locked in</div>
              <div className="text-gray-400">Now worth 12.5 SOL!</div>
            </div>
          </div>
        </div>
      </div>

      {/* Your Benefit */}
      <div className="mt-4 p-4 bg-blue-900/20 rounded-xl border border-blue-500/30">
        <p className="text-blue-300 font-bold mb-2">💰 How you benefit:</p>
        <p className="text-gray-200 text-sm">
          Every vote earns you lottery tickets. Weekly draws give away <strong className="text-yellow-300">real SOL prizes</strong> to active voters - regardless of how you vote!
        </p>
      </div>
    </div>
  );
};

export default SimpleExplainer;