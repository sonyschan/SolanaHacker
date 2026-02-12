import React, { useState } from 'react';

const SOLExplainerModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <>
      {/* Trigger Button/Link */}
      <button
        onClick={openModal}
        className="text-blue-400 hover:text-blue-300 text-sm underline font-medium"
      >
        What is SOL? 💡
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-600 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-600">
              <h2 className="text-xl font-bold text-white flex items-center">
                <span className="mr-2">💰</span>
                What is SOL?
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              
              {/* Basic Explanation */}
              <div className="bg-blue-950 border border-blue-800 rounded-lg p-4">
                <h3 className="text-blue-200 font-bold mb-3 flex items-center">
                  <span className="mr-2">⚡</span>
                  SOL = Solana Cryptocurrency
                </h3>
                <p className="text-blue-100 text-sm leading-relaxed">
                  SOL is the native cryptocurrency of the Solana blockchain - like Bitcoin or Ethereum, 
                  but faster and cheaper. When you win SOL on MemeForge, you're earning real digital money 
                  that has actual value and can be traded or spent.
                </p>
              </div>

              {/* Current Value */}
              <div className="bg-green-950 border border-green-800 rounded-lg p-4">
                <h3 className="text-green-200 font-bold mb-3 flex items-center">
                  <span className="mr-2">💵</span>
                  Current SOL Value (Approx.)
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-green-100 text-sm">1 SOL ≈</span>
                    <span className="text-green-300 font-bold">$180 USD</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-green-100 text-sm">Prize Pool (47.3 SOL) ≈</span>
                    <span className="text-green-300 font-bold">$8,514 USD</span>
                  </div>
                </div>
                <p className="text-green-200 text-xs mt-3">
                  💡 Prices fluctuate like stocks, but SOL has real market value
                </p>
              </div>

              {/* What You Can Do With SOL */}
              <div className="bg-purple-950 border border-purple-800 rounded-lg p-4">
                <h3 className="text-purple-200 font-bold mb-3 flex items-center">
                  <span className="mr-2">🎯</span>
                  What You Can Do With SOL
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-2">
                    <span className="text-purple-400 mt-1">💱</span>
                    <div className="text-purple-100">
                      <strong>Trade for Cash:</strong> Convert to USD, EUR, or other currencies
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-purple-400 mt-1">🛍️</span>
                    <div className="text-purple-100">
                      <strong>Buy Things:</strong> Many services accept crypto payments
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-purple-400 mt-1">💎</span>
                    <div className="text-purple-100">
                      <strong>Hold as Investment:</strong> Like digital gold that can appreciate
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-purple-400 mt-1">🔄</span>
                    <div className="text-purple-100">
                      <strong>Use in DeFi:</strong> Earn interest or trade other cryptos
                    </div>
                  </div>
                </div>
              </div>

              {/* Safety & Legitimacy */}
              <div className="bg-yellow-950 border border-yellow-800 rounded-lg p-4">
                <h3 className="text-yellow-200 font-bold mb-3 flex items-center">
                  <span className="mr-2">🔒</span>
                  Is This Safe & Legitimate?
                </h3>
                <div className="space-y-3 text-sm text-yellow-100">
                  <div className="flex items-start space-x-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <div><strong>Established Network:</strong> Solana is a top-10 blockchain with billions in value</div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <div><strong>Real Exchanges:</strong> SOL trades on Coinbase, Binance, and other major platforms</div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <div><strong>Your Wallet:</strong> You control your SOL completely - we can't take it back</div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <div><strong>Transparent:</strong> All transactions are public on the blockchain</div>
                  </div>
                </div>
              </div>

              {/* How Payouts Work */}
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <h3 className="text-white font-bold mb-3 flex items-center">
                  <span className="mr-2">📤</span>
                  How You Receive SOL Prizes
                </h3>
                <div className="space-y-2 text-sm text-gray-200">
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-400">1.</span>
                    <span>Connect your Solana wallet (Phantom, Solflare, etc.)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-400">2.</span>
                    <span>Vote on memes to earn lottery tickets</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-400">3.</span>
                    <span>Weekly lottery automatically selects winners</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-400">4.</span>
                    <span>SOL sent directly to your wallet address</span>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-400">
                  💡 You own your wallet and SOL completely - no middleman required
                </div>
              </div>

              {/* Call to Action */}
              <div className="text-center pt-4">
                <button
                  onClick={closeModal}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-6 py-3 rounded-lg transition-colors duration-200"
                >
                  Got It! Let's Start Earning 🚀
                </button>
                <div className="text-gray-400 text-xs mt-2">
                  Ready to vote on memes and win real cryptocurrency
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SOLExplainerModal;