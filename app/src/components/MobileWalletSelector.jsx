/**
 * MobileWalletSelector - Deep link to wallet apps for mobile browser users
 * Opens current site in wallet's in-app browser for proper connection
 */

import { useState } from 'react';

// Wallet configurations with deep link formats
const WALLETS = [
  {
    id: 'phantom',
    name: 'Phantom',
    icon: '👻',
    color: '#AB9FF2',
    getDeepLink: (url, ref) =>
      `https://phantom.app/ul/browse/${encodeURIComponent(url)}?ref=${encodeURIComponent(ref)}`,
  },
  {
    id: 'solflare',
    name: 'Solflare',
    icon: '🔥',
    color: '#FC822B',
    getDeepLink: (url, ref) =>
      `https://solflare.com/ul/v1/browse/${encodeURIComponent(url)}?ref=${encodeURIComponent(ref)}`,
  },
  {
    id: 'okx',
    name: 'OKX Wallet',
    icon: '⬡',
    color: '#000000',
    getDeepLink: (url) => {
      const deepLink = `okx://wallet/dapp/url?dappUrl=${encodeURIComponent(url)}`;
      return `https://web3.okx.com/download?deeplink=${encodeURIComponent(deepLink)}`;
    },
  },
];

export function MobileWalletSelector({ isOpen, onClose }) {
  if (!isOpen) return null;

  const currentUrl = window.location.href;
  const refUrl = window.location.origin;

  const handleWalletClick = (wallet) => {
    const deepLink = wallet.getDeepLink(currentUrl, refUrl);
    window.location.href = deepLink;
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Connect Wallet</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <p className="text-gray-400 text-sm mb-6">
          Select your wallet to open this site in the wallet browser
        </p>

        <div className="space-y-3">
          {WALLETS.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => handleWalletClick(wallet)}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all"
              style={{ borderLeftColor: wallet.color, borderLeftWidth: '3px' }}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{wallet.icon}</span>
                <span className="font-medium">{wallet.name}</span>
              </div>
              <span className="text-gray-400">→</span>
            </button>
          ))}
        </div>

        <p className="text-gray-500 text-xs text-center mt-6">
          Wallet not installed? The link will take you to the app store.
        </p>
      </div>
    </div>
  );
}

// Helper to detect mobile browser
export function isMobileBrowser() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export default MobileWalletSelector;
