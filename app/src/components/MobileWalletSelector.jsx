/**
 * MobileWalletSelector - Deep link to wallet apps for mobile browser users
 * Opens current site in wallet in-app browser for proper connection
 *
 * IMPORTANT: If already inside a wallet in-app browser, we should NOT use deep links
 */

import ModalOverlay from './ModalOverlay';

// Wallet configurations with deep link formats
const WALLETS = [
  {
    id: "phantom",
    name: "Phantom",
    icon: "👻",
    color: "#AB9FF2",
    getDeepLink: (url) =>
      `https://phantom.app/ul/browse/${encodeURIComponent(url)}?ref=${encodeURIComponent(window.location.origin)}`,
    // Detect if we are inside Phantom in-app browser
    isInApp: () => typeof window !== "undefined" && window.phantom?.solana?.isPhantom,
  },
  {
    id: "solflare",
    name: "Solflare",
    icon: "🔥",
    color: "#FC822B",
    getDeepLink: (url) =>
      `https://solflare.com/ul/v1/browse/${encodeURIComponent(url)}?ref=${encodeURIComponent(window.location.origin)}`,
    isInApp: () => typeof window !== "undefined" && window.solflare?.isSolflare,
  },
  {
    id: "okx",
    name: "OKX Wallet",
    icon: "⬡",
    color: "#000000",
    getDeepLink: (url) => {
      // Use direct okx:// protocol
      return `okx://wallet/dapp/url?dappUrl=${encodeURIComponent(url)}`;
    },
    isInApp: () => typeof window !== "undefined" && (window.okxwallet?.solana || window.okexchain),
  },
];

// Detect if we are inside ANY wallet in-app browser
export function isInsideWalletBrowser() {
  if (typeof window === "undefined") return false;

  // Check for common wallet providers
  const hasPhantom = window.phantom?.solana?.isPhantom;
  const hasSolflare = window.solflare?.isSolflare;
  const hasOKX = window.okxwallet?.solana || window.okexchain;
  const hasBackpack = window.backpack;
  const hasTrust = window.trustwallet;

  return !!(hasPhantom || hasSolflare || hasOKX || hasBackpack || hasTrust);
}

// Helper to detect mobile browser (but NOT wallet in-app browser)
export function isMobileBrowser() {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  return isMobile;
}

// Should we show mobile wallet selector?
// YES if: mobile browser AND NOT inside wallet app
export function shouldShowMobileWalletSelector() {
  return isMobileBrowser() && !isInsideWalletBrowser();
}

export function MobileWalletSelector({ isOpen, onClose }) {
  const currentUrl = window.location.href;

  const handleWalletClick = (wallet) => {
    // If already inside this wallet app, just close and let adapter handle it
    if (wallet.isInApp && wallet.isInApp()) {
      console.log(`Already inside ${wallet.name}, closing selector`);
      onClose();
      return;
    }

    const deepLink = wallet.getDeepLink(currentUrl);
    console.log(`Opening ${wallet.name} deep link:`, deepLink);
    window.location.href = deepLink;
  };

  return (
    <ModalOverlay
      isOpen={isOpen}
      onClose={onClose}
      backdropOpacity="bg-black/80"
      zIndex={60}
      className="bg-gray-900 border border-white/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Connect Wallet</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center"
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
            className="w-full flex items-center justify-between p-4 rounded-xl border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all bg-gray-800/50"
            style={{ borderLeftColor: wallet.color, borderLeftWidth: "3px" }}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{wallet.icon}</span>
              <span className="font-medium text-white">{wallet.name}</span>
            </div>
            <span className="text-gray-400">→</span>
          </button>
        ))}
      </div>

      <p className="text-gray-500 text-xs text-center mt-6">
        Wallet not installed? The link will take you to the app store.
      </p>
    </ModalOverlay>
  );
}

export default MobileWalletSelector;
