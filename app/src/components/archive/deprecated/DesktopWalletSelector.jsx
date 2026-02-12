import React, { useState, useEffect } from 'react';

const DesktopWalletSelector = ({ isOpen, onClose, onSelectWallet, isConnecting }) => {
  const [hoveredWallet, setHoveredWallet] = useState(null);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const walletOptions = [
    {
      name: 'Phantom',
      id: 'phantom',
      icon: '👻',
      description: 'Most popular Solana wallet',
      installed: window.solana?.isPhantom,
      installUrl: 'https://phantom.app/',
      gradient: 'from-purple-600 to-indigo-600'
    },
    {
      name: 'Solflare', 
      id: 'solflare',
      icon: '☀️',
      description: 'Feature-rich Solana wallet',
      installed: window.solflare?.isSolflare,
      installUrl: 'https://solflare.com/',
      gradient: 'from-yellow-500 to-orange-600'
    },
    {
      name: 'OKX Wallet',
      id: 'okx',
      icon: '⭕',
      description: 'Multi-chain wallet',
      installed: window.okxwallet?.solana,
      installUrl: 'https://www.okx.com/web3',
      gradient: 'from-blue-500 to-cyan-600'
    },
    {
      name: 'Coinbase Wallet',
      id: 'coinbase',
      icon: '🔵',
      description: 'Trusted by millions',
      installed: window.coinbaseSolana,
      installUrl: 'https://wallet.coinbase.com/',
      gradient: 'from-indigo-500 to-blue-600'
    }
  ];

  const installedWallets = walletOptions.filter(w => w.installed);
  const notInstalledWallets = walletOptions.filter(w => !w.installed);

  const handleWalletClick = async (wallet) => {
    if (wallet.installed) {
      await onSelectWallet(wallet.id);
    } else {
      window.open(wallet.installUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-gradient-to-br from-gray-900/95 to-purple-900/95 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-xl mb-1">Connect Your Wallet</h3>
              <p className="text-gray-400 text-sm">Choose your preferred Solana wallet</p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Installed Wallets */}
          {installedWallets.length > 0 && (
            <div className="mb-6">
              <h4 className="text-white font-medium text-sm mb-3 flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                Detected Wallets
              </h4>
              <div className="space-y-3">
                {installedWallets.map((wallet) => (
                  <button
                    key={wallet.id}
                    onClick={() => handleWalletClick(wallet)}
                    onMouseEnter={() => setHoveredWallet(wallet.id)}
                    onMouseLeave={() => setHoveredWallet(null)}
                    disabled={isConnecting}
                    className={`w-full p-4 rounded-xl border transition-all duration-200 ${
                      hoveredWallet === wallet.id
                        ? 'border-purple-400/60 bg-purple-500/10 shadow-lg transform scale-[1.02]'
                        : 'border-white/20 hover:border-white/40 bg-white/5'
                    } ${isConnecting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${wallet.gradient} flex items-center justify-center mr-4`}>
                        <span className="text-2xl">{wallet.icon}</span>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-white font-medium">{wallet.name}</div>
                        <div className="text-gray-400 text-sm">{wallet.description}</div>
                      </div>
                      <div className="flex items-center text-green-400">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                        <span className="text-sm font-medium">Ready</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Not Installed Wallets */}
          {notInstalledWallets.length > 0 && (
            <div>
              <h4 className="text-gray-400 font-medium text-sm mb-3 flex items-center">
                <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
                Available Wallets
              </h4>
              <div className="space-y-3">
                {notInstalledWallets.map((wallet) => (
                  <button
                    key={wallet.id}
                    onClick={() => handleWalletClick(wallet)}
                    onMouseEnter={() => setHoveredWallet(wallet.id)}
                    onMouseLeave={() => setHoveredWallet(null)}
                    className={`w-full p-4 rounded-xl border transition-all duration-200 ${
                      hoveredWallet === wallet.id
                        ? 'border-gray-500/60 bg-gray-600/10 shadow-lg transform scale-[1.02]'
                        : 'border-gray-600/40 hover:border-gray-500/60 bg-gray-700/20'
                    } cursor-pointer`}
                  >
                    <div className="flex items-center">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${wallet.gradient} opacity-60 flex items-center justify-center mr-4`}>
                        <span className="text-2xl">{wallet.icon}</span>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-gray-300 font-medium">{wallet.name}</div>
                        <div className="text-gray-500 text-sm">{wallet.description}</div>
                      </div>
                      <div className="flex items-center text-blue-400">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm font-medium">Install</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No wallets detected message */}
          {installedWallets.length === 0 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-2xl">👛</span>
              </div>
              <h4 className="text-white font-medium mb-2">No Wallets Found</h4>
              <p className="text-gray-400 text-sm mb-4">
                Install a Solana wallet to connect to MemeForge
              </p>
              <div className="text-gray-500 text-xs">
                Don't have a wallet? We recommend starting with Phantom.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <div className="text-purple-400 text-sm">ℹ️</div>
              <div className="text-purple-200 text-xs leading-relaxed">
                <strong>New to Solana?</strong> Wallets are secure apps that hold your crypto. 
                They're like digital bank accounts but you control them completely.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopWalletSelector;