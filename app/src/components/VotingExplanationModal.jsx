import React from 'react';

const VotingExplanationModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-600">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <div>
            <h2 className="text-2xl font-bold text-white">🗳️ How Voting Works</h2>
            <p className="text-blue-300 text-sm font-medium">Fair, Random, Rewarding</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Revolutionary Concept */}
          <div className="bg-purple-950 border border-purple-800 rounded-lg p-5">
            <h3 className="text-lg font-bold text-purple-300 mb-3 flex items-center">
              🌟 Revolutionary Concept
            </h3>
            <p className="text-gray-200 text-sm leading-relaxed">
              MemeForge is the <strong>world's first platform</strong> where NFT rarity is determined by 
              human consensus, not algorithms. Every meme becomes a unique 1/1 NFT, but its rarity 
              level is decided by thousands of voters like you.
            </p>
          </div>

          {/* Fair Reward System */}
          <div className="bg-green-950 border border-green-800 rounded-lg p-5">
            <h3 className="text-lg font-bold text-green-300 mb-3 flex items-center">
              🎯 Fair Reward System
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-white font-medium mb-2">🎲 Random Rewards (No Bias)</h4>
                <p className="text-gray-200 text-sm mb-3">
                  Every vote earns random lottery tickets regardless of what you choose. This eliminates 
                  strategic voting and ensures authentic opinions.
                </p>
                <div className="grid grid-cols-3 gap-3 text-center text-sm">
                  <div className="bg-gray-800 rounded p-3">
                    <div className="text-gray-300 font-bold">Days 1-3</div>
                    <div className="text-green-300">8-12 tickets</div>
                  </div>
                  <div className="bg-gray-800 rounded p-3">
                    <div className="text-blue-300 font-bold">Days 4-7</div>
                    <div className="text-green-300">9-13 tickets</div>
                  </div>
                  <div className="bg-gray-800 rounded p-3">
                    <div className="text-purple-300 font-bold">Day 8+</div>
                    <div className="text-green-300">10-15 tickets</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-white font-medium mb-2">🔥 Participation Rewards</h4>
                <p className="text-gray-200 text-sm">
                  Vote daily to build your streak and unlock higher reward ranges. Consistent 
                  participation is rewarded with better lottery ticket odds.
                </p>
              </div>
            </div>
          </div>

          {/* Voting Process */}
          <div className="bg-blue-950 border border-blue-800 rounded-lg p-5">
            <h3 className="text-lg font-bold text-blue-300 mb-3">
              📋 How to Vote
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                <div>
                  <div className="text-white font-medium">Connect Your Wallet</div>
                  <div className="text-gray-300">Use Phantom, Solflare, or any Solana wallet</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                <div>
                  <div className="text-white font-medium">Rate the Daily Meme</div>
                  <div className="text-gray-300">Choose Common, Rare, or Legendary based on your honest opinion</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                <div>
                  <div className="text-white font-medium">Earn Random Rewards</div>
                  <div className="text-gray-300">Get lottery tickets instantly, amount based on your voting streak</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>
                <div>
                  <div className="text-white font-medium">Win Real SOL</div>
                  <div className="text-gray-300">Weekly drawings award actual Solana cryptocurrency to ticket holders</div>
                </div>
              </div>
            </div>
          </div>

          {/* What Makes It Fair */}
          <div className="bg-yellow-950 border border-yellow-800 rounded-lg p-5">
            <h3 className="text-lg font-bold text-yellow-300 mb-3">
              ⚖️ Why This System is Fair
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="text-white font-medium mb-2">✅ No Strategic Voting</h4>
                <p className="text-gray-300">
                  Random rewards mean you can't game the system. Vote with your genuine opinion.
                </p>
              </div>
              <div>
                <h4 className="text-white font-medium mb-2">✅ Equal Opportunity</h4>
                <p className="text-gray-300">
                  Everyone gets the same reward ranges. No whale advantage or insider benefits.
                </p>
              </div>
              <div>
                <h4 className="text-white font-medium mb-2">✅ Loyalty Rewarded</h4>
                <p className="text-gray-300">
                  Daily voters unlock better ranges without affecting fairness for newcomers.
                </p>
              </div>
              <div>
                <h4 className="text-white font-medium mb-2">✅ Transparent Process</h4>
                <p className="text-gray-300">
                  All votes are public, lottery drawings are verifiable on-chain.
                </p>
              </div>
            </div>
          </div>

          {/* Example Scenarios */}
          <div className="bg-gray-750 rounded-lg p-5 border border-gray-600">
            <h3 className="text-lg font-bold text-gray-200 mb-3">
              📊 Example Scenarios
            </h3>
            <div className="space-y-4 text-sm">
              
              <div className="bg-gray-800 rounded p-4">
                <h4 className="text-green-300 font-medium mb-2">Scenario 1: New Voter</h4>
                <p className="text-gray-300 mb-2">
                  Sarah votes "Legendary" on her first day. She earns 11 random tickets (8-12 range).
                  Even though 80% of people voted "Common", her reward is the same as if she had voted with the majority.
                </p>
                <div className="text-yellow-300 text-xs">
                  ✨ No penalty for minority opinion, encouraging honest evaluation
                </div>
              </div>

              <div className="bg-gray-800 rounded p-4">
                <h4 className="text-blue-300 font-medium mb-2">Scenario 2: Veteran Voter</h4>
                <p className="text-gray-300 mb-2">
                  Mike has voted daily for 10 days. Today he votes "Rare" and earns 14 tickets (10-15 range).
                  His streak bonus rewards consistency without creating unfair advantages for new users.
                </p>
                <div className="text-yellow-300 text-xs">
                  ✨ Participation rewarded while maintaining fairness
                </div>
              </div>

            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg p-6 border border-blue-500/30">
            <h3 className="text-xl font-bold text-white mb-2">Ready to Start Voting?</h3>
            <p className="text-gray-300 text-sm mb-4">
              Join thousands of voters shaping the future of AI-generated meme NFTs
            </p>
            <button
              onClick={onClose}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-6 py-3 rounded-lg transition-all duration-300"
            >
              Got It! Let's Vote 🗳️
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default VotingExplanationModal;