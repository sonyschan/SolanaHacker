import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

const WalletConnectionDemo = () => {
  const { connected, publicKey, connecting } = useWallet();

  if (connecting) {
    return (
      <div className="fixed top-16 sm:top-20 left-2 sm:left-4 bg-blue-100 border-2 border-blue-300 rounded-lg p-3 sm:p-4 z-40 shadow-lg max-w-xs sm:max-w-sm">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-blue-800 font-medium text-sm">Connecting...</span>
        </div>
        <div className="text-blue-600 text-xs mt-1">Check your wallet extension</div>
      </div>
    );
  }

  if (connected && publicKey) {
    return (
      <div className="fixed top-16 sm:top-20 left-2 sm:left-4 bg-green-100 border-2 border-green-300 rounded-lg p-3 sm:p-4 z-40 shadow-lg max-w-xs sm:max-w-sm">
        <div className="text-green-800 font-bold mb-2 text-sm">✅ Wallet Connected!</div>
        <div className="text-green-700 text-xs sm:text-sm">
          <div><strong>Address:</strong> {publicKey.toString().slice(0, 6)}...</div>
          <div className="mt-2 text-xs">
            You can now:
            <ul className="mt-1 ml-3 text-xs">
              <li>• Vote on memes</li>
              <li>• Earn tickets</li>
              <li>• Win SOL prizes</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // On mobile, don't show this demo box to avoid interference
  // Only show on desktop where there's more space
  return (
    <div className="fixed top-20 left-4 bg-orange-100 border-2 border-orange-300 rounded-lg p-4 z-40 shadow-lg max-w-sm hidden sm:block">
      <div className="text-orange-800 font-bold mb-2">⚠️ Wallet Not Connected</div>
      <div className="text-orange-700 text-sm">
        <div className="mb-2">Connect your wallet to:</div>
        <ul className="text-xs ml-4">
          <li>• Vote on daily memes</li>
          <li>• Earn lottery tickets</li>
          <li>• See personal stats</li>
          <li>• Win SOL prizes</li>
        </ul>
        <div className="mt-2 text-orange-600 font-medium">
          👆 Click "Connect Wallet" above
        </div>
      </div>
    </div>
  );
};

export default WalletConnectionDemo;