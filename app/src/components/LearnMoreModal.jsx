import React from 'react';

const LearnMoreModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-600">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-yellow-300 flex items-center space-x-2">
              <span>🎓</span>
              <span>NFT Rarity Explained</span>
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* What are NFTs and Rarity? */}
          <div>
            <h3 className="text-xl font-bold text-blue-300 mb-4 flex items-center space-x-2">
              <span>💎</span>
              <span>What is NFT Rarity?</span>
            </h3>
            <div className="bg-gray-700/50 rounded-xl p-4 text-gray-200">
              <p className="mb-3">
                <strong>NFT</strong> = Non-Fungible Token (a unique digital collectible on blockchain)
              </p>
              <p className="mb-3">
                <strong>Rarity</strong> = How rare/special an NFT is compared to others in the collection
              </p>
              <p>
                Think of it like trading cards: Common cards are everywhere, Legendary cards are super rare and valuable!
              </p>
            </div>
          </div>

          {/* Traditional vs MemeForge */}
          <div>
            <h3 className="text-xl font-bold text-purple-300 mb-4 flex items-center space-x-2">
              <span>⚖️</span>
              <span>Traditional vs MemeForge</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Traditional */}
              <div className="bg-red-900/20 rounded-xl p-4 border border-red-500/30">
                <h4 className="text-red-300 font-bold mb-3 flex items-center space-x-2">
                  <span>🤖</span>
                  <span>Traditional NFT Collections</span>
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="bg-gray-800/50 p-3 rounded">
                    <div className="font-bold text-red-200 mb-1">How it works:</div>
                    <p>Computer algorithm pre-decides: "1% will be Legendary, 5% Rare, 94% Common" → Then mints NFTs</p>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded">
                    <div className="font-bold text-red-200 mb-1">Problems:</div>
                    <ul className="list-disc list-inside space-y-1">
                      <li>You might get an "ugly Legendary" NFT</li>
                      <li>A beautiful "Common" NFT is stuck being common</li>
                      <li>No community input on what's actually valuable</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* MemeForge */}
              <div className="bg-green-900/20 rounded-xl p-4 border border-green-500/30">
                <h4 className="text-green-300 font-bold mb-3 flex items-center space-x-2">
                  <span>👥</span>
                  <span>MemeForge (Revolutionary!)</span>
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="bg-gray-800/50 p-3 rounded">
                    <div className="font-bold text-green-200 mb-1">How it works:</div>
                    <p>AI creates meme → Community votes on rarity → NFT minted with voted rarity</p>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded">
                    <div className="font-bold text-green-200 mb-1">Benefits:</div>
                    <ul className="list-disc list-inside space-y-1">
                      <li>If it's truly amazing → Community votes Legendary</li>
                      <li>If it's just okay → Community votes Common</li>
                      <li>Rarity reflects actual human opinion!</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Real Example */}
          <div className="bg-yellow-900/20 rounded-xl p-4 border border-yellow-500/30">
            <h3 className="text-yellow-300 font-bold mb-3 flex items-center space-x-2">
              <span>🎯</span>
              <span>Real Example: "Doge in Space" Timeline</span>
            </h3>
            <div className="text-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-gray-800/50 p-3 rounded text-center">
                  <div className="text-blue-300 font-bold mb-1">🤖 12:00 AM</div>
                  <div className="text-sm">AI creates "Doge in Space" meme</div>
                  <div className="text-xs text-gray-400 mt-1">(No NFT exists yet)</div>
                </div>
                <div className="bg-gray-800/50 p-3 rounded text-center">
                  <div className="text-green-300 font-bold mb-1">🗳️ All Day</div>
                  <div className="text-sm">1,234 people vote: 956 chose "Legendary"</div>
                  <div className="text-xs text-gray-400 mt-1">(78% voted Legendary)</div>
                </div>
                <div className="bg-gray-800/50 p-3 rounded text-center">
                  <div className="text-purple-300 font-bold mb-1">⚡ 11:59 PM</div>
                  <div className="text-sm">NFT minted as Legendary</div>
                  <div className="text-xs text-gray-400 mt-1">(Now worth 12.5 SOL!)</div>
                </div>
              </div>
            </div>
          </div>

          {/* How You Benefit */}
          <div className="bg-blue-900/20 rounded-xl p-4 border border-blue-500/30">
            <h3 className="text-blue-300 font-bold mb-3 flex items-center space-x-2">
              <span>💰</span>
              <span>How You Benefit</span>
            </h3>
            <div className="text-gray-200 text-sm space-y-2">
              <p><strong>Every vote earns you random lottery tickets:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Vote "Common" → Random 8-12 tickets</li>
                <li>Vote "Rare" → Random 8-12 tickets</li>
                <li>Vote "Legendary" → Random 8-12 tickets</li>
              </ul>
              <p className="mt-3"><strong>Weekly lottery draws:</strong> Win real SOL prizes!</p>
              <p className="text-xs text-gray-400 mt-1">*Random rewards prevent strategic voting</p>
            </div>
          </div>

          {/* Why This Matters */}
          <div className="bg-purple-900/20 rounded-xl p-4 border border-purple-500/30">
            <h3 className="text-purple-300 font-bold mb-3 flex items-center space-x-2">
              <span>🌟</span>
              <span>Why This is Revolutionary</span>
            </h3>
            <div className="text-gray-200 text-sm space-y-2">
              <p><strong>For the first time in NFT history:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Rarity is decided BEFORE minting, not pre-programmed</li>
                <li>Every person has equal voice in determining value</li>
                <li>No hidden algorithms or predetermined odds</li>
                <li>True democratic process for digital collectibles</li>
              </ul>
              <p className="mt-3 font-bold text-purple-200">
                You're not just collecting NFTs - you're helping create NFT history!
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 bg-gray-900/50">
          <button 
            onClick={onClose}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
          >
            Got It! Let's Start Voting 🗳️
          </button>
        </div>

      </div>
    </div>
  );
};

export default LearnMoreModal;