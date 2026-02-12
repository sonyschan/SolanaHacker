import React, { useState, useEffect } from 'react';
import memeService from '../services/memeService';
import MemeModal from './MemeModal';
import { 
  EnhancedMemeGridPlaceholder, 
  VotingPhasePlaceholder, 
  RarityVotingPlaceholder,
  RewardPlaceholder
} from './EnhancedVotingPlaceholders';

const ForgeTab = ({ userTickets, votingStreak, setUserTickets, setVotingStreak }) => {
  const [currentPhase, setCurrentPhase] = useState('selection'); // 'selection', 'rarity', 'completed'
  const [selectedMeme, setSelectedMeme] = useState(null);
  const [votes, setVotes] = useState({ meme1: 23, meme2: 31, meme3: 18 });
  const [rarityVotes, setRarityVotes] = useState({ common: 45, rare: 28, legendary: 12 });
  const [showReward, setShowReward] = useState(false);
  const [earnedTickets, setEarnedTickets] = useState(0);
  const [dailyMemes, setDailyMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalMeme, setModalMeme] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch today's memes on component mount
  useEffect(() => {
    const fetchTodaysMemes = async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching today\'s AI-generated memes...');
        
        const result = await memeService.getTodaysMemes();
        console.log('📊 API Response:', result);
        
        if (result.success && result.memes && result.memes.length > 0) {
          console.log('✅ Loaded', result.memes.length, 'AI memes');
          console.log('🖼️ First meme:', result.memes[0]);
          setDailyMemes(result.memes);
          
          // Initialize votes for fetched memes  
          const newVotes = {};
          result.memes.forEach((meme, index) => {
            newVotes[meme.id] = meme.votes?.selection?.yes || Math.floor(Math.random() * 50) + 10;
          });
          setVotes(newVotes);
        } else {
          console.log('⚠️ No memes found, generating new ones...');
          const generateResult = await memeService.generateDailyMemes();
          
          if (generateResult.success && generateResult.memes) {
            setDailyMemes(generateResult.memes);
            const newVotes = {};
            generateResult.memes.forEach((meme, index) => {
              newVotes[meme.id] = Math.floor(Math.random() * 50) + 10;
            });
            setVotes(newVotes);
          } else {
            throw new Error('Failed to generate daily memes');
          }
        }
        
        setError(null);
      } catch (err) {
        console.error('❌ Error loading memes:', err);
        setError(err.message);
        // Use fallback memes
        const fallbackMemes = memeService.getFallbackMemes();
        console.log('🔄 Using fallback memes:', fallbackMemes);
        setDailyMemes(fallbackMemes);
        const newVotes = {};
        fallbackMemes.forEach((meme, index) => {
          newVotes[meme.id] = meme.votes?.selection?.yes || Math.floor(Math.random() * 50) + 10;
        });
        setVotes(newVotes);
      } finally {
        setLoading(false);
      }
    };

    fetchTodaysMemes();
  }, []);

  const rarityOptions = [
    { id: 'common', label: 'Common', color: 'bg-gray-600', icon: '👍', desc: 'Standard quality' },
    { id: 'rare', label: 'Rare', color: 'bg-blue-600', icon: '💎', desc: 'Above average humor' },
    { id: 'legendary', label: 'Legendary', color: 'bg-purple-600', icon: '🏆', desc: 'Exceptional creativity' }
  ];

  const handleVote = (memeId) => {
    setVotes(prev => ({ ...prev, [memeId]: prev[memeId] + 1 }));
    
    // Determine winner and move to rarity phase
    const winner = Object.entries(votes).reduce((a, b) => 
      votes[a[0]] > votes[b[0]] ? a : b
    )[0];
    
    setSelectedMeme(dailyMemes.find(m => m.id === winner));
    setCurrentPhase('rarity');
  };

  const handleRarityVote = (rarity) => {
    setRarityVotes(prev => ({ ...prev, [rarity]: prev[rarity] + 1 }));
    
    // Calculate reward based on streak
    let baseTickets = 8;
    if (votingStreak >= 5) baseTickets = 10;
    else if (votingStreak >= 2) baseTickets = 9;
    
    const randomBonus = Math.floor(Math.random() * 6); // 0-5 bonus
    const totalTickets = baseTickets + randomBonus;
    
    setEarnedTickets(totalTickets);
    setUserTickets(prev => prev + totalTickets);
    setVotingStreak(prev => prev + 1);
    setCurrentPhase('completed');
    setShowReward(true);
    
    // Auto-hide reward after 3 seconds
    setTimeout(() => {
      setShowReward(false);
    }, 3000);
  };

  const resetVoting = () => {
    setCurrentPhase('selection');
    setSelectedMeme(null);
    // Reset vote counts (in production, this would be handled by backend)
    setVotes({ meme1: 23, meme2: 31, meme3: 18 });
    setRarityVotes({ common: 45, rare: 28, legendary: 12 });
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Reward Animation */}
      {showReward && (
        <RewardPlaceholder />
      )}

      {/* Phase 1: Meme Selection */}
      {currentPhase === 'selection' && (
        <div>
          {/* Enhanced Phase Header */}
          <VotingPhasePlaceholder phase="selection" />
          
          {/* Enhanced Status Messages */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              🤖 Today's AI Generated Memes
            </h2>
            <p className="text-gray-300 text-lg">
              Vote for your favorite meme to advance to rarity voting
            </p>
            
            {/* Enhanced MVP Notice */}
            <div className="relative mt-6 inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl blur opacity-30 animate-pulse"></div>
              <div className="relative bg-green-500/10 border border-green-400/30 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-2xl animate-bounce">🚀</span>
                  <span className="text-green-300 font-semibold">Phase 1/2: Meme Selection - Pick the winner!</span>
                </div>
              </div>
            </div>
            
            {/* Enhanced Status indicators */}
            {loading && (
              <div className="mt-6 relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl blur opacity-20 animate-pulse"></div>
                <div className="relative bg-yellow-600/10 border border-yellow-400/30 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-center space-x-3">
                    <div className="flex space-x-1">
                      {[0, 1, 2].map((i) => (
                        <div 
                          key={i}
                          className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        ></div>
                      ))}
                    </div>
                    <span className="text-yellow-300 font-medium">🔄 Loading AI-generated memes...</span>
                  </div>
                </div>
              </div>
            )}
            
            {error && (
              <div className="mt-6 relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl blur opacity-20 animate-pulse"></div>
                <div className="relative bg-red-600/10 border border-red-400/30 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-red-300 animate-bounce">⚠️</span>
                    <span className="text-red-300 font-medium">Using fallback memes (Backend: {error.length > 30 ? error.substring(0, 30) + '...' : error})</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Loading State */}
          {loading ? (
            <EnhancedMemeGridPlaceholder 
              count={3} 
              aiGeneration={true} 
              showStagger={true}
            />
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {dailyMemes.map((meme) => (
                <div key={meme.id} className="relative bg-gradient-to-br from-gray-800/40 via-gray-900/60 to-black/80 backdrop-blur-lg rounded-2xl overflow-hidden border border-purple-500/20 hover:border-purple-400/40 transition-all duration-500 group hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10">
                  {/* Enhanced Background Effects */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent transform -skew-x-12 animate-[slide_4s_ease-in-out_infinite] group-hover:via-purple-400/10"></div>
                  
                  {/* AI Generated Badge */}
                  {meme.metadata?.imageGenerated && (
                    <div className="absolute top-4 right-4 z-20">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-1 rounded-full shadow-lg animate-pulse">
                        <span className="text-white text-xs font-bold">🤖 AI</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Enhanced Image Display */}
                  {meme.imageUrl || meme.image ? (
                    <img
                      src={meme.imageUrl || meme.image}
                      alt={meme.title}
                      className="w-full h-64 object-cover cursor-pointer transition-all duration-300 group-hover:scale-[1.05]"
                      onClick={() => {
                        setModalMeme(meme);
                        setIsModalOpen(true);
                      }}
                      title="Click to enlarge"
                      onError={(e) => {
                        // Enhanced error handling with CSS placeholder
                        e.target.style.display = 'none';
                        const placeholder = document.createElement('div');
                        placeholder.className = 'w-full h-64 bg-gradient-to-br from-purple-600/30 to-pink-600/30 flex items-center justify-center text-white font-bold text-lg cursor-pointer transition-transform duration-300 hover:scale-[1.05]';
                        placeholder.innerHTML = `
                          <div class="text-center p-4">
                            <div class="text-5xl mb-3 animate-bounce">${meme.metadata?.icon || '🖼️'}</div>
                            <div class="text-sm font-semibold">${meme.title}</div>
                            <div class="text-xs text-purple-200 mt-2">Click to view details</div>
                          </div>`;
                        placeholder.onclick = () => {
                          setModalMeme(meme);
                          setIsModalOpen(true);
                        };
                        e.target.parentNode.insertBefore(placeholder, e.target);
                      }}
                    />
                  ) : (
                    // Enhanced CSS Placeholder
                    <div 
                      className="w-full h-64 bg-gradient-to-br from-purple-600/30 to-pink-600/30 flex items-center justify-center text-white font-bold text-lg cursor-pointer transition-all duration-300 group-hover:scale-[1.05] relative overflow-hidden"
                      onClick={() => {
                        setModalMeme(meme);
                        setIsModalOpen(true);
                      }}
                      title="Click to enlarge"
                    >
                      {/* Animated background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[slide_3s_ease-in-out_infinite]"></div>
                      
                      <div className="relative z-10 text-center p-4">
                        <div className="text-5xl mb-3 animate-bounce">{meme.metadata?.icon || '🖼️'}</div>
                        <div className="text-sm font-semibold">{meme.title}</div>
                        <div className="text-xs text-purple-200 mt-2">Click to view details</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Enhanced Card Content */}
                  <div className="relative p-6 z-10">
                    <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      {meme.title}
                    </h3>
                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                      {meme.description || `AI-generated from: ${meme.newsSource}`}
                    </p>
                    
                    {/* Enhanced Metadata badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {meme.metadata?.fallback && (
                        <span className="text-xs bg-orange-600/20 border border-orange-500/30 text-orange-300 px-2 py-1 rounded-full">
                          💾 Fallback
                        </span>
                      )}
                      {meme.metadata?.imageGenerated && (
                        <span className="text-xs bg-green-600/20 border border-green-500/30 text-green-300 px-2 py-1 rounded-full">
                          🤖 AI Generated
                        </span>
                      )}
                      {meme.newsSource && (
                        <span className="text-xs bg-blue-600/20 border border-blue-500/30 text-blue-300 px-2 py-1 rounded-full">
                          📰 {meme.newsSource.substring(0, 12)}...
                        </span>
                      )}
                    </div>
                    
                    {/* Enhanced Vote Display */}
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-6 h-6 bg-red-500/20 border border-red-400/30 rounded-full flex items-center justify-center animate-pulse">
                            <span className="text-xs">❤️</span>
                          </div>
                          <div className="w-6 h-6 bg-yellow-500/20 border border-yellow-400/30 rounded-full flex items-center justify-center animate-pulse">
                            <span className="text-xs">😂</span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-400">
                          <span className="text-white font-bold text-lg">{votes[meme.id] || 0}</span> votes
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Vote Button */}
                    <button
                      onClick={() => handleVote(meme.id)}
                      className="relative w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold overflow-hidden group/btn hover:scale-[1.02] transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25"
                    >
                      {/* Button background animation */}
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                      
                      <span className="relative z-10 flex items-center justify-center space-x-2">
                        <span className="text-lg animate-pulse">❤️</span>
                        <span>Vote for This Meme</span>
                        <span className="opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300">✨</span>
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Phase 2: Rarity Voting */}
      {currentPhase === 'rarity' && selectedMeme && (
        <div>
          {/* Enhanced Phase Header */}
          <VotingPhasePlaceholder phase="rarity" />
          
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              🏆 Winner Selected!
            </h2>
            <p className="text-gray-300 text-lg">Now vote to decide this meme's rarity level</p>
            
            <div className="relative mt-6 inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-30 animate-pulse"></div>
              <div className="relative bg-blue-500/10 border border-blue-400/30 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-2xl animate-bounce">💎</span>
                  <span className="text-blue-300 font-semibold">Phase 2/2: Rarity Decision - Community choice!</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Winning Meme Display */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative bg-gradient-to-br from-yellow-400 to-orange-500 p-1 rounded-2xl animate-pulse">
              <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl overflow-hidden">
                {selectedMeme.imageUrl || selectedMeme.image ? (
                  <img
                    src={selectedMeme.imageUrl || selectedMeme.image}
                    alt={selectedMeme.title}
                    className="w-full h-64 object-cover cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => {
                      setModalMeme(selectedMeme);
                      setIsModalOpen(true);
                    }}
                    title="Click to enlarge"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const placeholder = document.createElement('div');
                      placeholder.className = 'w-full h-64 bg-gradient-to-br from-yellow-400/30 to-orange-500/30 flex items-center justify-center text-white font-bold text-lg cursor-pointer hover:scale-105 transition-transform';
                      placeholder.innerHTML = `<div class="text-center"><div class="text-4xl mb-2">🏆</div><div class="text-sm px-4">${selectedMeme.title}</div></div>`;
                      placeholder.onclick = () => {
                        setModalMeme(selectedMeme);
                        setIsModalOpen(true);
                      };
                      e.target.parentNode.insertBefore(placeholder, e.target);
                    }}
                  />
                ) : (
                  <div 
                    className="w-full h-64 bg-gradient-to-br from-yellow-400/30 to-orange-500/30 flex items-center justify-center text-white font-bold text-lg cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => {
                      setModalMeme(selectedMeme);
                      setIsModalOpen(true);
                    }}
                    title="Click to enlarge"
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-2">🏆</div>
                      <div className="text-sm px-4">{selectedMeme.title}</div>
                    </div>
                  </div>
                )}
                <div className="p-6 text-center">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                    {selectedMeme.title}
                  </h3>
                  <p className="text-sm text-gray-300 mt-2">
                    {selectedMeme.description || `AI-generated from: ${selectedMeme.newsSource}`}
                  </p>
                  
                  {selectedMeme.metadata?.imageGenerated && (
                    <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-2 mt-2">
                      <span className="text-green-300 text-xs">🤖 Real AI Generated Image</span>
                    </div>
                  )}
                  
                  <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-2 mt-3">
                    <span className="text-yellow-300 text-sm">👑 Winning Meme - Community Selected!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Rarity Options */}
          <div className="grid md:grid-cols-3 gap-6">
            {rarityOptions.map((option, index) => (
              <div key={option.id} className="text-center">
                <button
                  onClick={() => handleRarityVote(option.id)}
                  className={`relative w-full ${option.color} bg-opacity-20 border-2 border-opacity-40 rounded-xl p-8 hover:scale-105 transition-all duration-300 hover:bg-opacity-30 group overflow-hidden`}
                  style={{ 
                    borderColor: option.color.replace('bg-', '').replace('-600', ''),
                    animationDelay: `${index * 150}ms`
                  }}
                >
                  {/* Enhanced background animation */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 animate-[slide_2.5s_ease-in-out_infinite]"></div>
                  
                  <div className="relative z-10">
                    <div className="text-5xl mb-4 animate-bounce group-hover:scale-110 transition-transform" style={{ animationDelay: `${index * 100}ms` }}>
                      {option.icon}
                    </div>
                    <div className="font-bold text-xl mb-2">{option.label}</div>
                    <div className="text-sm text-gray-300 mb-3">{option.desc}</div>
                    <div className="text-xs text-gray-400">
                      <span className="font-semibold">{rarityVotes[option.id]}</span> votes
                    </div>
                  </div>
                  
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Phase 3: Completed */}
      {currentPhase === 'completed' && (
        <div>
          <VotingPhasePlaceholder phase="completed" />
          
          <div className="text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                🎉 Voting Complete!
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Thank you for participating in today's meme democracy!
              </p>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-green-600/20 border border-green-500/30 rounded-xl p-6 group hover:scale-105 transition-transform">
                  <div className="text-4xl mb-3 group-hover:animate-bounce">🎫</div>
                  <h3 className="font-bold text-lg mb-1">Tickets Earned</h3>
                  <div className="text-3xl text-green-300 font-bold">{earnedTickets} tickets</div>
                </div>
                
                <div className="bg-purple-600/20 border border-purple-500/30 rounded-xl p-6 group hover:scale-105 transition-transform">
                  <div className="text-4xl mb-3 group-hover:animate-bounce">🔥</div>
                  <h3 className="font-bold text-lg mb-1">Voting Streak</h3>
                  <div className="text-3xl text-purple-300 font-bold">{votingStreak} days</div>
                </div>
              </div>

              {/* Enhanced MVP completion message */}
              <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-6 mb-8 backdrop-blur-sm">
                <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  📅 MVP Phase Complete
                </h3>
                <ul className="text-left space-y-3 text-sm text-gray-300">
                  <li className="flex items-center space-x-2">
                    <span className="text-green-400">✅</span>
                    <span>Your vote helped decide the winning meme</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-green-400">✅</span>
                    <span>Community determined its rarity level</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-green-400">✅</span>
                    <span>AI will generate traits based on image content</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-green-400">✅</span>
                    <span>You earned lottery tickets for participation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-blue-400">📅</span>
                    <span>Weekly lottery simulation: Sunday draws</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-yellow-400">🚀</span>
                    <span>NFT minting & SOL rewards coming in Beta!</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-purple-400">⏰</span>
                    <span>Come back tomorrow for new AI memes!</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={resetVoting}
                className="relative px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-bold overflow-hidden group hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10 flex items-center space-x-2">
                  <span>🔄</span>
                  <span>View Results & Stats</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">✨</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meme Modal */}
      <MemeModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalMeme(null);
        }}
        meme={modalMeme}
      />
    </div>
  );
};

export default ForgeTab;