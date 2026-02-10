import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Link } from 'react-router-dom';
import { 
  SparklesIcon, 
  TrophyIcon, 
  CurrencyDollarIcon,
  UserGroupIcon,
  LightBulbIcon,
  GiftIcon
} from '@heroicons/react/24/outline';
import EnhancedWalletButton from './ui/EnhancedWalletButton';

const HomePage = () => {
  const { connected } = useWallet();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4 rounded-full">
                <SparklesIcon className="h-16 w-16 text-white" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                MemeForge
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto">
              Vote on AI-generated memes and win <span className="text-yellow-400 font-bold">real SOL rewards!</span>
              <br />
              No trading, no complexity - just fun memes and prizes! 🎭✨
            </p>

            {/* Value Proposition Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <TrophyIcon className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Vote & Win</h3>
                <p className="text-gray-300 text-sm">
                  Vote for your favorite meme and get a chance to win <strong>0.01-0.1 SOL</strong> instantly!
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <GiftIcon className="h-12 w-12 text-pink-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibent text-white mb-2">Weekly Lottery</h3>
                <p className="text-gray-300 text-sm">
                  Winning memes become <strong>exclusive NFTs</strong> in our weekly lottery. Win big prizes!
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <UserGroupIcon className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Community Power</h3>
                <p className="text-gray-300 text-sm">
                  <strong>You decide</strong> what becomes valuable! Community votes determine NFT rarity.
                </p>
              </div>
            </div>

            {/* Example Memes Section */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-white mb-8">
                <LightBulbIcon className="h-8 w-8 inline-block mr-2 text-yellow-400" />
                AI Creates, You Choose Winners
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <img 
                    src="/generated/example-meme-winner.png" 
                    alt="Example winning meme"
                    className="w-full h-64 object-cover rounded-lg mb-4"
                  />
                  <div className="text-center">
                    <div className="bg-yellow-500 text-black px-4 py-2 rounded-full inline-block mb-2 font-bold">
                      🏆 WEEKLY WINNER
                    </div>
                    <p className="text-gray-300">
                      This meme won 1,247 votes and became this week's exclusive NFT!
                      Winner received <span className="text-yellow-400 font-bold">0.05 SOL</span>
                    </p>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <img 
                    src="/generated/example-meme-confused.png" 
                    alt="Example meme candidate"
                    className="w-full h-64 object-cover rounded-lg mb-4"
                  />
                  <div className="text-center">
                    <div className="bg-blue-500 text-white px-4 py-2 rounded-full inline-block mb-2 font-bold">
                      🗳️ VOTE NOW
                    </div>
                    <p className="text-gray-300">
                      Will this be next week's winner? 
                      <br />Vote and earn <span className="text-yellow-400 font-bold">0.01-0.1 SOL</span> for participating!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* How it Works */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 mb-12 max-w-4xl mx-auto border border-white/20">
              <h2 className="text-3xl font-bold text-white mb-8">How to Earn SOL</h2>
              <div className="grid md:grid-cols-4 gap-6 text-center">
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-12 h-12 rounded-full mx-auto flex items-center justify-center font-bold text-white text-xl">1</div>
                  <h3 className="text-white font-semibold">Connect Wallet</h3>
                  <p className="text-gray-400 text-sm">Quick and secure Phantom/Solflare connection</p>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-12 h-12 rounded-full mx-auto flex items-center justify-center font-bold text-white text-xl">2</div>
                  <h3 className="text-white font-semibold">Vote on Memes</h3>
                  <p className="text-gray-400 text-sm">Choose your favorite from AI-generated memes</p>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-green-500 to-blue-500 w-12 h-12 rounded-full mx-auto flex items-center justify-center font-bold text-white text-xl">3</div>
                  <h3 className="text-white font-semibold">Earn Instantly</h3>
                  <p className="text-gray-400 text-sm">Get 0.01-0.1 SOL reward for every vote</p>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-yellow-500 to-green-500 w-12 h-12 rounded-full mx-auto flex items-center justify-center font-bold text-white text-xl">4</div>
                  <h3 className="text-white font-semibold">Win Big</h3>
                  <p className="text-gray-400 text-sm">Weekly winners get exclusive NFTs + lottery entry</p>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="space-y-6">
              {connected ? (
                <Link 
                  to="/vote" 
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold text-xl rounded-full transition-all duration-200 transform hover:scale-105"
                >
                  <TrophyIcon className="h-6 w-6 mr-2" />
                  Start Voting & Earning!
                </Link>
              ) : (
                <div className="space-y-4">
                  <EnhancedWalletButton 
                    variant="primary"
                    className="text-xl px-8 py-4"
                  >
                    Connect Wallet to Start Earning!
                  </EnhancedWalletButton>
                  <p className="text-gray-400">
                    Connect your Solana wallet to start earning SOL from meme voting!
                  </p>
                </div>
              )}
              
              <div className="flex items-center justify-center space-x-8 text-gray-400 flex-wrap">
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-5 w-5 mr-1 text-yellow-400" />
                  <span className="text-sm">Instant SOL rewards</span>
                </div>
                <div className="flex items-center">
                  <UserGroupIcon className="h-5 w-5 mr-1 text-blue-400" />
                  <span className="text-sm">Community driven</span>
                </div>
                <div className="flex items-center">
                  <SparklesIcon className="h-5 w-5 mr-1 text-purple-400" />
                  <span className="text-sm">AI powered</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;