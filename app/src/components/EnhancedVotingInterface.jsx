import React, { useState, useEffect } from 'react';
import memeService from '../services/memeService';

const EnhancedVotingInterface = ({ onVote, userVote, connected, userTickets, consecutiveDays = 1 }) => {
  const [selectedMeme, setSelectedMeme] = useState(0);
  const [voteAnimation, setVoteAnimation] = useState(false);
  const [previewMode, setPreviewMode] = useState(true);
  const [todaysMemes, setTodaysMemes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backendConnected, setBackendConnected] = useState(false);

  // Load today's memes from API
  useEffect(() => {
    const loadTodaysMemes = async () => {
      setLoading(true);
      try {
        console.log('🔄 Loading today\'s memes...');
        
        // First test backend connection
        const connectionTest = await memeService.testConnections();
        setBackendConnected(connectionTest.success && !connectionTest.fallback);
        
        if (connectionTest.success && !connectionTest.fallback) {
          console.log('✅ Backend connected, fetching real memes');
        } else {
          console.log('⚠️ Backend disconnected, using fallback memes');
        }
        
        // Get today's memes (will fallback if needed)
        const result = await memeService.getTodaysMemes();
        
        if (result.success && result.memes && result.memes.length > 0) {
          console.log(`✅ Loaded ${result.memes.length} memes`);
          // Transform API format to component format
          const transformedMemes = result.memes.map(meme => ({
            id: meme.id,
            image: meme.imageUrl,
            title: meme.title,
            description: meme.description,
            currentVotes: {
              common: meme.votes?.rarity?.common || 0,
              rare: meme.votes?.rarity?.rare || 0,
              legendary: meme.votes?.rarity?.legendary || 0
            },
            trend: meme.metadata?.fallback ? 'fallback' : 'hot',
            newsSource: meme.newsSource,
            generatedAt: meme.generatedAt,
            aiGenerated: !meme.metadata?.fallback
          }));
          setTodaysMemes(transformedMemes);
        } else {
          console.log('❌ Failed to load memes, using fallback');
          setTodaysMemes(getSampleMemes());
        }
        
      } catch (error) {
        console.error('Error loading today\'s memes:', error);
        setTodaysMemes(getSampleMemes());
      } finally {
        setLoading(false);
      }
    };

    loadTodaysMemes();
  }, []);

  // Fallback sample memes if API fails
  const getSampleMemes = () => [
    {
      id: 'sample-1',
      image: '/generated/meme-preview-ai-emotions.png',
      title: 'AI Trying to Understand Emotions',
      description: 'When AI attempts to comprehend human feelings',
      currentVotes: { common: 89, rare: 156, legendary: 203 },
      trend: 'trending_up',
      aiGenerated: false
    },
    {
      id: 'sample-2', 
      image: '/generated/meme-preview-crypto-hodl.png',
      title: 'Diamond Hands HODL',
      description: 'Crypto veterans when the market dips',
      currentVotes: { common: 134, rare: 267, legendary: 445 },
      trend: 'hot',
      aiGenerated: false
    },
    {
      id: 'sample-3',
      image: '/generated/meme-preview-voting-choices.png',
      title: 'Modern Decision Making', 
      description: 'Choosing between too many options',
      currentVotes: { common: 67, rare: 123, legendary: 89 },
      trend: 'new',
      aiGenerated: false
    }
  ];

  // Use real memes if loaded, otherwise fallback
  const activeMemes = todaysMemes || getSampleMemes();

  const currentMeme = activeMemes[selectedMeme];

  const handleVoteClick = (voteType) => {
    if (!connected) {
      // Scroll to wallet connection
      document.querySelector('.wallet-connect-section')?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center' 
      });
      return;
    }

    setVoteAnimation(true);
    setPreviewMode(false);
    onVote(voteType);
    
    setTimeout(() => setVoteAnimation(false), 1500);
  };

  const getVoteColor = (voteType) => {
    switch(voteType) {
      case 'common': return 'from-gray-500 to-gray-600';
      case 'rare': return 'from-blue-500 to-blue-600';
      case 'legendary': return 'from-purple-500 to-purple-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getVoteIcon = (voteType) => {
    switch(voteType) {
      case 'common': return '👍';
      case 'rare': return '💎';
      case 'legendary': return '🏆';
      default: return '👍';
    }
  };

  const getTotalVotes = () => {
    const votes = currentMeme.currentVotes;
    return votes.common + votes.rare + votes.legendary;
  };

  const getVotePercentage = (voteType) => {
    const total = getTotalVotes();
    return total > 0 ? Math.round((currentMeme.currentVotes[voteType] / total) * 100) : 0;
  };

  // Calculate expected ticket range based on consecutive days
  const getTicketRange = () => {
    if (consecutiveDays >= 8) {
      return "10-15 tickets";
    } else if (consecutiveDays >= 4) {
      return "9-13 tickets";
    } else {
      return "8-12 tickets";
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      
      {/* Header with meme navigation */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <span className="mr-3">🗳️</span>
            Vote Before Minting
          </h2>
          <p className="text-blue-300 text-sm font-medium">
            AI Dreams. Humans Decide. NFT Gets Minted.
          </p>
        </div>
        
        {/* Meme selector */}
        <div className="flex space-x-2">
          {activeMemes.map((meme, index) => (
            <button
              key={meme.id}
              onClick={() => setSelectedMeme(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                selectedMeme === index 
                  ? 'bg-blue-400 ring-2 ring-blue-300' 
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Pre-mint Process Explanation */}
      <div className="mb-6 bg-purple-950 border border-purple-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">⚡</span>
            <div>
              <div className="text-purple-200 font-medium">Pre-mint Democracy</div>
              <div className="text-purple-300 text-sm">
                Vote now → Determine rarity → Then NFT gets minted
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-purple-200 font-bold">23:15:42</div>
            <div className="text-purple-300 text-xs">until minting</div>
          </div>
        </div>
      </div>

      {/* Fair Rewards Explanation */}
      <div className="mb-6 bg-green-950 border border-green-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🎯</span>
            <div>
              <div className="text-green-200 font-medium">Fair Voting System</div>
              <div className="text-green-300 text-sm">
                All voters earn {getTicketRange()} • No rarity bias • Equal chances!
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-green-200 font-bold">{consecutiveDays} days</div>
            <div className="text-green-300 text-xs">voting streak</div>
          </div>
        </div>
        
        {consecutiveDays >= 4 && (
          <div className="mt-3 pt-3 border-t border-green-700">
            <div className="text-xs text-green-300">
              🎉 Streak bonus active! Keep voting daily to unlock higher ticket ranges
            </div>
          </div>
        )}
      </div>

      {/* Meme Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        
        {/* Meme Image */}
        <div className="relative">
          <div className="aspect-square bg-gray-900 rounded-lg overflow-hidden border border-gray-600">
            <img 
              src={currentMeme.image}
              alt={currentMeme.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to placeholder if generated image fails
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23374151'/%3E%3Ctext x='50%25' y='45%25' text-anchor='middle' fill='%23fff' font-size='24'%3E🤖 AI Meme%3C/text%3E%3Ctext x='50%25' y='60%25' text-anchor='middle' fill='%239CA3AF' font-size='16'%3EGenerated Daily%3C/text%3E%3C/svg%3E";
              }}
            />
          </div>
          
          {/* AI Generated Badge */}
          <div className="absolute top-3 left-3">
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
              <span>🤖</span>
              <span>AI Generated</span>
            </span>
          </div>

          {/* Trend badge */}
          <div className="absolute top-3 right-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              currentMeme.trend === 'hot' ? 'bg-red-600 text-white' :
              currentMeme.trend === 'trending_up' ? 'bg-green-600 text-white' :
              'bg-blue-600 text-white'
            }`}>
              {currentMeme.trend === 'hot' ? '🔥 Hot' :
               currentMeme.trend === 'trending_up' ? '📈 Trending' :
               '✨ New'}
            </span>
          </div>

          {/* Vote count overlay */}
          <div className="absolute bottom-3 right-3 bg-black bg-opacity-70 text-white px-3 py-1 rounded-lg text-sm font-medium">
            {getTotalVotes().toLocaleString()} votes
          </div>
          
          {/* Pre-mint status */}
          <div className="absolute bottom-3 left-3 bg-purple-600 bg-opacity-90 text-white px-3 py-1 rounded-lg text-sm font-medium">
            🔄 Pre-mint
          </div>
        </div>

        {/* Meme Info & Current Results */}
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">{currentMeme.title}</h3>
            <p className="text-gray-300 mb-4">{currentMeme.description}</p>
          </div>

          {/* Live voting results */}
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-600">
            <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
              📊 Live Pre-mint Voting
              <span className="ml-2 text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                LIVE
              </span>
            </h4>
            
            <div className="space-y-3">
              {['legendary', 'rare', 'common'].map((voteType) => (
                <div key={voteType} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getVoteIcon(voteType)}</span>
                    <span className="text-sm font-medium text-white capitalize">
                      {voteType}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-3 flex-1 ml-4">
                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full bg-gradient-to-r ${getVoteColor(voteType)} transition-all duration-1000`}
                        style={{ width: `${getVotePercentage(voteType)}%` }}
                      />
                    </div>
                    <div className="text-sm text-gray-300 min-w-[60px] text-right">
                      {getVotePercentage(voteType)}% 
                      <span className="text-xs text-gray-400 ml-1">
                        ({currentMeme.currentVotes[voteType]})
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Winning prediction */}
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="text-xs text-gray-300">
                <strong>Current winning rarity:</strong> {
                  getVotePercentage('legendary') > 60 ? 'Legendary 🏆' :
                  getVotePercentage('rare') > getVotePercentage('common') ? 'Rare 💎' :
                  'Common 👍'
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      {!connected && (
        <div className="mb-6 bg-yellow-950 border border-yellow-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🔗</span>
              <div>
                <div className="text-yellow-200 font-medium">Connect Wallet to Vote</div>
                <div className="text-yellow-300 text-sm">
                  Join {getTotalVotes().toLocaleString()} people shaping NFT rarity
                </div>
              </div>
            </div>
            <button 
              onClick={() => document.querySelector('.wallet-connect-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
            >
              Connect Now
            </button>
          </div>
        </div>
      )}

      {/* Voting Buttons - Following MVP Spec: 3 Rarity Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { type: 'common', label: 'Common', icon: '👍', desc: 'Standard quality' },
          { type: 'rare', label: 'Rare', icon: '💎', desc: 'Above average humor' },
          { type: 'legendary', label: 'Legendary', icon: '🏆', desc: 'Exceptional creativity' }
        ].map((vote) => (
          <button
            key={vote.type}
            onClick={() => handleVoteClick(vote.type)}
            disabled={!connected || userVote !== null}
            className={`relative p-6 rounded-xl border-2 transition-all duration-300 ${
              userVote === vote.type
                ? `border-${vote.type === 'common' ? 'gray' : vote.type === 'rare' ? 'blue' : 'purple'}-400 bg-${vote.type === 'common' ? 'gray' : vote.type === 'rare' ? 'blue' : 'purple'}-950`
                : connected && userVote === null
                ? `border-gray-600 hover:border-${vote.type === 'common' ? 'gray' : vote.type === 'rare' ? 'blue' : 'purple'}-400 hover:bg-${vote.type === 'common' ? 'gray' : vote.type === 'rare' ? 'blue' : 'purple'}-950 hover:scale-105 cursor-pointer`
                : 'border-gray-700 bg-gray-800 opacity-60 cursor-not-allowed'
            } ${voteAnimation && userVote === vote.type ? 'animate-pulse' : ''}`}
          >
            {/* Vote success indicator */}
            {userVote === vote.type && (
              <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg">
                ✓
              </div>
            )}

            <div className="text-center">
              <div className="text-4xl mb-3">{vote.icon}</div>
              <div className={`text-xl font-bold mb-2 ${
                vote.type === 'common' ? 'text-gray-200' :
                vote.type === 'rare' ? 'text-blue-300' :
                'text-purple-300'
              }`}>
                {vote.label}
              </div>
              <div className="text-sm text-gray-300 mb-3">{vote.desc}</div>
              <div className="text-xs text-gray-400 mb-1">
                {currentMeme.currentVotes[vote.type]} votes
              </div>
              
              {connected && userVote === null && (
                <div className="text-xs text-blue-300 font-medium">
                  Click to vote
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Vote Success Message */}
      {userVote && userTickets && (
        <div className="bg-green-950 border border-green-800 rounded-lg p-6 text-center">
          <div className="text-4xl mb-4">🎉</div>
          <div className="text-green-300 font-bold text-xl mb-2">
            Vote Cast Successfully!
          </div>
          <div className="text-white mb-3">
            You earned <strong className="text-yellow-400">{userTickets} lottery tickets</strong>
            <span className="text-green-300 text-sm ml-2">(Random reward!)</span>
          </div>
          <div className="text-sm text-gray-300 mb-3">
            Your vote for <strong className="capitalize text-white">{userVote}</strong> will help determine this NFT's rarity.
          </div>
          
          {/* Streak info */}
          <div className="bg-blue-900 border border-blue-700 rounded p-3 mt-4">
            <div className="text-blue-200 text-sm">
              🔥 <strong>{consecutiveDays} day voting streak</strong>
              {consecutiveDays >= 4 && " • Bonus rewards unlocked!"}
            </div>
            <div className="text-blue-300 text-xs mt-1">
              Keep voting daily to increase your reward range
            </div>
          </div>
          
          <div className="text-sm text-gray-300 mt-3">
            NFT will be minted tomorrow with community-chosen rarity!
          </div>
        </div>
      )}

      {/* Next meme countdown */}
      <div className="text-center text-gray-400 text-sm">
        ⏰ Next AI meme & voting session: <strong className="text-white">23:15:42</strong>
      </div>
    </div>
  );
};

export default EnhancedVotingInterface;