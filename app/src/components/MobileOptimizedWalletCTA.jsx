import React, { useState } from 'react';
import SimplifiedSolanaWalletButton, { useSimplifiedSolanaWallet } from './SimplifiedSolanaWallet';

/**
 * Mobile-first wallet connection CTA that addresses the key UX issues:
 * 1. Makes wallet connection action immediately visible on mobile
 * 2. Provides clear context about what happens after connection
 * 3. Shows disabled buttons with clear explanation why they're disabled
 * 4. Sticky positioning ensures it's always accessible
 */
const MobileOptimizedWalletCTA = ({ onScrollToVoting }) => {
  const { connected } = useSimplifiedSolanaWallet();
  const [isExpanded, setIsExpanded] = useState(!connected);

  if (connected) {
    return null; // Hide this component when wallet is connected
  }

  return (
    <>
      {/* Mobile-optimized sticky wallet connection banner */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-purple-900/95 to-transparent backdrop-blur-lg border-t border-purple-500/30">
        <div className="max-w-md mx-auto">
          {isExpanded ? (
            // Expanded state - shows full explanation
            <div className="card-glass p-6 text-center">
              <div className="mb-4">
                <div className="text-2xl mb-2">👛✨</div>
                <h3 className="text-enhanced-high font-bold text-lg mb-2">
                  Connect to Start Voting
                </h3>
                <p className="text-enhanced-medium text-sm leading-relaxed mb-4">
                  Connect your Solana wallet to vote on AI memes and earn SOL rewards. 
                  Takes just 10 seconds!
                </p>
              </div>
              
              <div className="space-y-3">
                <SimplifiedSolanaWalletButton className="w-full text-base py-4">
                  🚀 Connect Wallet & Start Earning
                </SimplifiedSolanaWalletButton>
                
                <button
                  onClick={() => {
                    setIsExpanded(false);
                    onScrollToVoting();
                  }}
                  className="btn-ghost-enhanced w-full text-sm py-2"
                >
                  👀 Browse Memes First
                </button>
                
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-enhanced-faint text-xs underline"
                >
                  Minimize
                </button>
              </div>
              
              <div className="mt-4 text-enhanced-faint text-xs">
                Supports Phantom, Solflare & more
              </div>
            </div>
          ) : (
            // Collapsed state - shows minimal prompt
            <div className="flex items-center justify-between p-4 card-glass">
              <div className="flex items-center space-x-3">
                <div className="text-xl">👛</div>
                <div>
                  <div className="text-enhanced-high font-semibold text-sm">
                    Connect to Vote
                  </div>
                  <div className="text-enhanced-faint text-xs">
                    Earn SOL rewards
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <SimplifiedSolanaWalletButton className="text-sm px-4 py-2">
                  Connect
                </SimplifiedSolanaWalletButton>
                <button
                  onClick={() => setIsExpanded(true)}
                  className="text-purple-400 text-sm p-2"
                  aria-label="Show more info"
                >
                  ℹ️
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop version - less intrusive */}
      <div className="hidden lg:block fixed bottom-6 right-6 z-50">
        <div className="card-glass p-4 max-w-sm">
          <div className="flex items-center space-x-3">
            <div className="text-xl">👛</div>
            <div className="flex-1">
              <div className="text-enhanced-high font-semibold text-sm mb-1">
                Ready to start voting?
              </div>
              <SimplifiedSolanaWalletButton className="text-sm">
                Connect Wallet
              </SimplifiedSolanaWalletButton>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileOptimizedWalletCTA;