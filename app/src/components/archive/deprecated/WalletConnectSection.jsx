import React, { useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const WalletConnectSection = () => {
  const { connected, connecting, publicKey, disconnect } = useWallet();
  const connectingTimeoutRef = useRef(null);

  // Handle stuck connecting state
  useEffect(() => {
    if (!connecting || connected) {
      if (connectingTimeoutRef.current) {
        clearTimeout(connectingTimeoutRef.current);
        connectingTimeoutRef.current = null;
      }
      return;
    }
    
    // Set a timeout to reset stuck connecting state after 15 seconds
    if (connecting && !connected) {
      connectingTimeoutRef.current = setTimeout(() => {
        console.log('Wallet connection timeout - attempting reset');
        if (disconnect) {
          disconnect().catch(console.error);
        }
      }, 15000);
    }

    return () => {
      if (connectingTimeoutRef.current) {
        clearTimeout(connectingTimeoutRef.current);
      }
    };
  }, [connecting, connected, disconnect]);

  const handleResetConnection = async () => {
    try {
      if (disconnect) {
        await disconnect();
      }
      console.log('Wallet state reset');
    } catch (error) {
      console.error('Error resetting wallet:', error);
    }
  };

  if (connected) {
    return (
      <div className="wallet-connect-section bg-green-950 border-2 border-green-800 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-4xl">✅</div>
            <div>
              <div className="text-green-300 font-bold text-xl">Wallet Connected!</div>
              <div className="text-green-200 text-sm">
                {publicKey?.toString().slice(0, 4)}...{publicKey?.toString().slice(-4)}
              </div>
              <div className="text-green-400 text-sm font-medium mt-1">
                Ready to start voting and earning SOL rewards
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-300 mb-1">🎯</div>
            <div className="text-sm text-green-200">You're all set!</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-connect-section bg-gradient-to-r from-blue-900 to-purple-900 border-2 border-blue-600 rounded-xl p-8 mb-8">
      <div className="text-center">
        <div className="text-5xl mb-4">🔗</div>
        <h2 className="text-2xl font-bold text-white mb-3">
          Connect Your Solana Wallet to Start
        </h2>
        <p className="text-blue-200 mb-6 max-w-2xl mx-auto">
          Connect any Solana wallet (Phantom, Solflare, etc.) to start voting on memes and earning SOL rewards. 
          No signup required - your wallet is your account.
        </p>

        {/* Connection benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white bg-opacity-10 rounded-lg p-4">
            <div className="text-2xl mb-2">🗳️</div>
            <div className="text-white font-medium mb-1">Vote on Memes</div>
            <div className="text-blue-200 text-sm">Rate AI-generated content</div>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-4">
            <div className="text-2xl mb-2">🎟️</div>
            <div className="text-white font-medium mb-1">Earn Tickets</div>
            <div className="text-blue-200 text-sm">10-15 tickets per vote</div>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-4">
            <div className="text-2xl mb-2">💰</div>
            <div className="text-white font-medium mb-1">Win SOL</div>
            <div className="text-blue-200 text-sm">Weekly prize drawings</div>
          </div>
        </div>

        {/* Wallet connection button */}
        <div className="space-y-4">
          {connecting ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-3">
                <div className="animate-spin text-2xl">⏳</div>
                <span className="text-white font-medium">Connecting to wallet...</span>
              </div>
              <div className="text-sm text-blue-300">
                Check your wallet extension for a connection request
              </div>
              <button
                onClick={handleResetConnection}
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                Cancel or reset connection
              </button>
            </div>
          ) : (
            <>
              <WalletMultiButton className="!bg-gradient-to-r !from-blue-600 !to-purple-600 hover:!from-blue-700 hover:!to-purple-700 !text-white !font-bold !px-8 !py-4 !rounded-xl !text-lg !transition-all !duration-300 hover:!scale-105 !shadow-xl" />
              
              <div className="text-sm text-blue-200 max-w-md mx-auto">
                <div className="flex items-center justify-center space-x-4 mb-2">
                  <span className="flex items-center space-x-1">
                    <img src="https://phantom.app/img/phantom-icon-purple.svg" alt="Phantom" className="w-4 h-4" onError={(e) => e.target.style.display = 'none'} />
                    <span>Phantom</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <img src="https://solflare.com/img/solflare-logo.svg" alt="Solflare" className="w-4 h-4" onError={(e) => e.target.style.display = 'none'} />
                    <span>Solflare</span>
                  </span>
                  <span>+ more wallets supported</span>
                </div>
                <div className="text-xs text-blue-300">
                  🔒 Secure connection • No personal info required • You control your funds
                </div>
              </div>
            </>
          )}
        </div>

        {/* Trust indicators */}
        <div className="mt-6 border-t border-blue-700 pt-6">
          <div className="text-blue-200 text-sm mb-3">
            <strong className="text-white">Safe & Secure:</strong>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-blue-300">
            <span className="flex items-center space-x-1">
              <span>🔐</span>
              <span>Open source</span>
            </span>
            <span className="flex items-center space-x-1">
              <span>🛡️</span>
              <span>No private key access</span>
            </span>
            <span className="flex items-center space-x-1">
              <span>⚡</span>
              <span>Solana network</span>
            </span>
            <span className="flex items-center space-x-1">
              <span>🏆</span>
              <span>Hackathon project</span>
            </span>
          </div>
        </div>

        {/* Additional troubleshooting info */}
        <div className="mt-4 text-xs text-blue-400">
          <details className="cursor-pointer">
            <summary className="hover:text-blue-300">
              💡 Connection troubleshooting
            </summary>
            <div className="mt-2 text-left bg-blue-950 bg-opacity-50 rounded p-3 max-w-md mx-auto">
              <div className="space-y-2">
                <div>• Make sure your wallet extension is installed and unlocked</div>
                <div>• Refresh the page if connection gets stuck</div>
                <div>• Check that you're on the Devnet in your wallet settings</div>
                <div>• Try a different wallet if one doesn't work</div>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

export default WalletConnectSection;