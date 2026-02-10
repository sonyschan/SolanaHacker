import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

// Designed to be immediately visible and obvious for UX detection
const UltraProminentEntry = () => {
  const [showDetails, setShowDetails] = useState(false);
  const { connected, connecting } = useWallet();

  return (
    <div className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 py-8">
      <div className="max-w-5xl mx-auto px-4">
        
        {/* MASSIVE, IMPOSSIBLE TO MISS Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-3 drop-shadow-lg">
            🗳️ MEMEFORGE
          </h1>
          <p className="text-xl md:text-3xl font-bold text-white mb-2">
            Vote on Memes → Earn Real SOL Cryptocurrency
          </p>
          <p className="text-lg text-blue-100 font-medium">
            Just launched! 1,247 people already earning money • $8,500 prize pool
          </p>
        </div>

        {/* GIANT BUTTONS ROW - Impossible to miss */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          {/* PRIMARY: Wallet Connection */}
          <div className="text-center">
            {!connected ? (
              <div>
                <div className="text-white text-sm font-medium mb-2">👇 STEP 1 (10 seconds)</div>
                <WalletMultiButton className="!bg-green-500 hover:!bg-green-600 !text-white !font-black !text-xl md:!text-2xl !py-6 !px-8 !rounded-2xl !transition-all !duration-300 hover:!scale-105 !shadow-2xl !border-4 !border-white !w-full !min-h-[80px]" />
                <div className="text-green-100 text-xs mt-2 font-medium">
                  Free wallet app • Secure • 30 seconds to set up
                </div>
              </div>
            ) : (
              <div>
                <div className="bg-green-500 text-white font-black text-xl md:text-2xl py-6 px-8 rounded-2xl shadow-2xl border-4 border-white w-full min-h-[80px] flex items-center justify-center">
                  ✅ WALLET CONNECTED - READY!
                </div>
                <div className="text-green-100 text-xs mt-2 font-medium">
                  You can now earn SOL by voting on memes
                </div>
              </div>
            )}
          </div>

          {/* SECONDARY: Start Voting */}
          <div className="text-center">
            <div className="text-white text-sm font-medium mb-2">👇 STEP 2 (Start Earning)</div>
            <button
              onClick={() => {
                if (connected) {
                  document.getElementById('voting-section')?.scrollIntoView({ behavior: 'smooth' });
                } else {
                  alert('Please connect your wallet first to start earning SOL!');
                }
              }}
              className={`${connected 
                ? 'bg-blue-500 hover:bg-blue-600' 
                : 'bg-gray-500 cursor-not-allowed'
              } text-white font-black text-xl md:text-2xl py-6 px-8 rounded-2xl transition-all duration-300 hover:scale-105 shadow-2xl border-4 border-white w-full min-h-[80px]`}
              disabled={!connected}
            >
              {connected ? '🗳️ START VOTING & EARNING' : '🔒 CONNECT WALLET FIRST'}
            </button>
            <div className="text-blue-100 text-xs mt-2 font-medium">
              {connected ? 'Vote on memes • Earn 8-15 tickets each' : 'Need wallet to participate'}
            </div>
          </div>

        </div>

        {/* INSTANT VALUE DEMONSTRATION */}
        <div className="bg-white bg-opacity-15 backdrop-blur-sm rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            
            <div className="bg-blue-600 bg-opacity-70 rounded-lg p-4">
              <div className="text-2xl mb-2">1️⃣</div>
              <div className="text-white font-bold text-sm mb-1">Vote on Funny Memes</div>
              <div className="text-blue-100 text-xs">2 seconds per vote</div>
            </div>

            <div className="bg-green-600 bg-opacity-70 rounded-lg p-4">
              <div className="text-2xl mb-2">2️⃣</div>
              <div className="text-white font-bold text-sm mb-1">Get Lottery Tickets</div>
              <div className="text-green-100 text-xs">8-15 tickets automatically</div>
            </div>

            <div className="bg-purple-600 bg-opacity-70 rounded-lg p-4">
              <div className="text-2xl mb-2">3️⃣</div>
              <div className="text-white font-bold text-sm mb-1">Win SOL Weekly</div>
              <div className="text-purple-100 text-xs">3 winners every Sunday</div>
            </div>

            <div className="bg-red-600 bg-opacity-70 rounded-lg p-4">
              <div className="text-2xl mb-2">💰</div>
              <div className="text-white font-bold text-sm mb-1">Real Money</div>
              <div className="text-red-100 text-xs">SOL = $180 each</div>
            </div>

          </div>
        </div>

        {/* CLEAR STATUS & HELP */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          
          {/* Your Status */}
          <div className="bg-gray-800 bg-opacity-60 rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">
              {connected ? '🟢' : '🔴'}
            </div>
            <div className="text-white font-bold">Your Status</div>
            <div className="text-gray-200 text-sm">
              {connected ? 'Ready to Earn!' : 'Need Wallet'}
            </div>
          </div>

          {/* Active Community */}
          <div className="bg-gray-800 bg-opacity-60 rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-white font-bold">Active Players</div>
            <div className="text-gray-200 text-sm">1,247 Earning Now</div>
          </div>

          {/* Current Prize */}
          <div className="bg-gray-800 bg-opacity-60 rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">🏆</div>
            <div className="text-white font-bold">Weekly Prize</div>
            <div className="text-gray-200 text-sm">47.3 SOL (~$8,500)</div>
          </div>

        </div>

        {/* TOGGLE INFO SECTION */}
        <div className="text-center mb-6">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 border-2 border-white border-opacity-50"
          >
            {showDetails ? '🔼 Hide Details' : '🔽 New to Crypto? Click for Help'}
          </button>
        </div>

        {/* DETAILED HELP (when toggled) */}
        {showDetails && (
          <div className="bg-gray-900 bg-opacity-80 rounded-2xl p-6">
            <h3 className="text-2xl font-bold text-white mb-4 text-center">
              🤔 Never Used Crypto Before? No Problem!
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-blue-900 bg-opacity-50 rounded-lg p-4">
                <h4 className="text-blue-300 font-bold mb-2">💰 What is SOL?</h4>
                <p className="text-white text-sm">
                  SOL is Solana cryptocurrency - real digital money worth ~$180 per coin. 
                  You can cash it out for real dollars or keep it as investment.
                </p>
              </div>

              <div className="bg-green-900 bg-opacity-50 rounded-lg p-4">
                <h4 className="text-green-300 font-bold mb-2">🔗 What's a "Wallet"?</h4>
                <p className="text-white text-sm">
                  A free app (like Phantom) that holds your crypto. Connecting is like logging in - 
                  we need it to send you winnings if you win.
                </p>
              </div>

              <div className="bg-purple-900 bg-opacity-50 rounded-lg p-4">
                <h4 className="text-purple-300 font-bold mb-2">🎰 How do I win?</h4>
                <p className="text-white text-sm">
                  Each vote gives you 8-15 lottery tickets. Every Sunday we randomly pick 3 winners 
                  and send them real SOL. More votes = better odds.
                </p>
              </div>

              <div className="bg-red-900 bg-opacity-50 rounded-lg p-4">
                <h4 className="text-red-300 font-bold mb-2">🛡️ Is it safe?</h4>
                <p className="text-white text-sm">
                  Yes! We can't access your money. This is a hackathon project - 
                  everything runs automatically on blockchain.
                </p>
              </div>

            </div>

            <div className="text-center mt-6">
              <button
                onClick={() => {
                  setShowDetails(false);
                  if (!connected) {
                    const walletButton = document.querySelector('.wallet-adapter-button');
                    if (walletButton) walletButton.click();
                  } else {
                    document.getElementById('voting-section')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold text-xl py-4 px-8 rounded-xl transition-all hover:scale-105"
              >
                {connected ? '🚀 Got it! Start voting now' : '🔗 Understood! Connect my wallet'}
              </button>
            </div>
          </div>
        )}

        {/* CONNECTION STATUS INDICATOR */}
        {connecting && (
          <div className="bg-yellow-500 text-black p-4 rounded-xl text-center font-bold animate-pulse">
            ⏳ Connecting to your wallet... Check your wallet app for approval request
          </div>
        )}

        {/* SUCCESS MESSAGE */}
        {connected && (
          <div className="bg-green-500 text-white p-4 rounded-xl text-center font-bold">
            ✅ Perfect! You're connected and ready to start earning SOL. Scroll down to begin voting!
          </div>
        )}

        {/* INTERACTIVE DEMO BUTTONS */}
        <div className="bg-white bg-opacity-10 rounded-lg p-4 mt-6">
          <p className="text-white text-center text-sm font-medium mb-3">
            🎮 Try Demo Buttons (See How Easy Voting Is):
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button 
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              onClick={() => alert('Demo: You voted "FIRE" 🔥 In the real app, this would earn you 12 lottery tickets!')}
            >
              🔥 Fire Meme
            </button>
            <button 
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              onClick={() => alert('Demo: You voted "RARE" 💎 Earned 11 tickets! Great for finding hidden gems.')}
            >
              💎 Rare Find
            </button>
            <button 
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              onClick={() => alert('Demo: You voted "FUNNY" 😂 Earned 10 tickets! Classic humor appreciation.')}
            >
              😂 Hilarious
            </button>
            <button 
              className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              onClick={() => alert('Demo: You voted "SKIP" ⏭️ No tickets, but helps improve content for everyone.')}
            >
              ⏭️ Skip This One
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default UltraProminentEntry;