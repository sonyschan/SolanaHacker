import React, { useState } from 'react';

const Web3Tooltip = ({ term, children, className = "" }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const explanations = {
    'SOL': {
      title: 'SOL Token',
      content: 'SOL is the native cryptocurrency of the Solana blockchain. It\'s like digital money that you can spend, trade, or earn. Current value: ~$200 each.',
      icon: '💰'
    },
    'lottery tickets': {
      title: 'Lottery Tickets',
      content: 'Digital tickets you earn by voting. Each ticket gives you a chance to win SOL prizes. More tickets = higher win chances. Completely free to earn!',
      icon: '🎫'
    },
    'meme battle': {
      title: 'Meme Battle System',
      content: 'Our AI creates 3 crypto memes daily. Community votes decide the winner. Voters earn lottery tickets. Winners get higher "rarity" in the NFT collection.',
      icon: '⚔️'
    },
    'wallet': {
      title: 'Crypto Wallet',
      content: 'Like a digital bank account for cryptocurrency. Popular ones: Phantom, Solflare. Free to download and use. No personal info required.',
      icon: '👛'
    },
    'blockchain': {
      title: 'Blockchain Technology', 
      content: 'A secure, transparent ledger that records all transactions. Think of it as a digital receipt book that everyone can verify but no one can fake.',
      icon: '🔗'
    },
    'NFT': {
      title: 'Non-Fungible Token',
      content: 'A unique digital collectible stored on blockchain. Like trading cards, but digital. Each meme that wins becomes a collectible NFT.',
      icon: '🎨'
    },
    'rarity': {
      title: 'Democratic Rarity System',
      content: 'WORLD FIRST: Community votes determine how rare each NFT becomes. Unlike typical NFTs with pre-set rarity, YOUR votes decide what\'s valuable!',
      icon: '💎'
    },
    'devnet': {
      title: 'Development Network',
      content: 'A test version of Solana blockchain. Safe for testing - no real money involved. Perfect for trying out features risk-free.',
      icon: '🧪'
    }
  };

  const explanation = explanations[term.toLowerCase()];

  if (!explanation) {
    return <span className={className}>{children}</span>;
  }

  return (
    <div className="relative inline-block">
      <span 
        className={`${className} cursor-help underline decoration-dotted decoration-purple-400 hover:decoration-purple-600 transition-colors`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
      >
        {children}
      </span>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-gray-900 text-white rounded-lg px-3 py-2 text-sm max-w-xs shadow-xl">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">{explanation.icon}</span>
              <span className="font-semibold text-purple-300">{explanation.title}</span>
            </div>
            <div className="text-gray-200 leading-relaxed">
              {explanation.content}
            </div>
            
            {/* Arrow pointing down */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
};

// Quick wrapper components for common terms
export const SOLTooltip = ({ children, className }) => (
  <Web3Tooltip term="SOL" className={className}>{children}</Web3Tooltip>
);

export const WalletTooltip = ({ children, className }) => (
  <Web3Tooltip term="wallet" className={className}>{children}</Web3Tooltip>
);

export const TicketsTooltip = ({ children, className }) => (
  <Web3Tooltip term="lottery tickets" className={className}>{children}</Web3Tooltip>
);

export const RarityTooltip = ({ children, className }) => (
  <Web3Tooltip term="rarity" className={className}>{children}</Web3Tooltip>
);

export const BattleTooltip = ({ children, className }) => (
  <Web3Tooltip term="meme battle" className={className}>{children}</Web3Tooltip>
);

export default Web3Tooltip;