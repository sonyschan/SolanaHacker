import React from 'react';
import SimplifiedSolanaWalletButton, { useSimplifiedSolanaWallet } from './SimplifiedSolanaWallet';

const MobileEnhancedHero = ({ onScrollToVoting }) => {
  const { connected } = useSimplifiedSolanaWallet();

  return (
    <div className="text-center mb-12 relative">
      {/* Background gradient optimized for mobile */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-cyan-900/20 rounded-3xl -z-10"></div>
      
      <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold heading-gradient mb-4 md:mb-6 leading-tight px-4">
        Democratic NFT Rarity
      </h1>
      
      <p className="text-enhanced-medium text-lg md:text-xl leading-relaxed max-w-3xl mx-auto mb-6 md:mb-8 px-4">
        The first platform where <strong className="text-enhanced-high">your votes determine NFT rarity</strong>. 
        AI creates, humans decide what becomes valuable. <strong className="text-purple-400">Earn SOL for every vote!</strong>
      </p>
      
      {/* Mobile-optimized CTA buttons */}
      <div className="flex flex-col space-y-3 mb-6 px-4 max-w-sm mx-auto">
        {connected ? (
          <button
            onClick={onScrollToVoting}
            className="btn-primary-enhanced text-lg py-4 px-6 w-full touch-target"
            style={{ minHeight: '48px' }}
          >
            🗳️ Start Voting Now
          </button>
        ) : (
          <SimplifiedSolanaWalletButton 
            className="btn-primary-enhanced text-lg py-4 px-6 w-full touch-target"
            style={{ minHeight: '48px' }}
          >
            🚀 Connect & Start Earning
          </SimplifiedSolanaWalletButton>
        )}
        
        <button
          onClick={onScrollToVoting}
          className="btn-ghost-enhanced py-3 px-6 w-full touch-target"
          style={{ minHeight: '44px' }}
        >
          👀 Browse Today's Memes
        </button>
      </div>
      
      {/* Mobile-optimized feature highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-sm md:max-w-2xl mx-auto text-enhanced-faint text-sm px-4">
        <div className="flex items-center justify-center space-x-2 py-2">
          <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
          <span>100% On-chain</span>
        </div>
        <div className="flex items-center justify-center space-x-2 py-2">
          <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
          <span>Instant Payouts</span>
        </div>
        <div className="flex items-center justify-center space-x-2 py-2">
          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
          <span>Community Driven</span>
        </div>
      </div>
      
      {/* Connection status for mobile */}
      {connected && (
        <div className="mt-4 px-4">
          <div className="card-glass p-3 bg-green-500/10 border-green-500/30 text-center">
            <div className="text-green-400 text-sm font-bold">✅ Wallet Connected</div>
            <div className="text-green-300 text-xs">Ready to vote and earn SOL!</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileEnhancedHero;