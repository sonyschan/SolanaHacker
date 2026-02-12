import React, { useState, useEffect } from 'react';
import memeService from '../services/memeService';
import MemeModal from './MemeModal';

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
      {/* Reward Animation */}
      {showReward && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-8 text-center animate-bounce">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold mb-2">Vote Successful!</h3>
            <p className="text-lg">You earned <span className="font-bold text-yellow-300">{earnedTickets} tickets</span>!</p>
            <p className="text-sm text-purple-200 mt-2">Voting streak: {votingStreak} days</p>
          </div>
        </div>
      )}

      {/* Phase 1: Meme Selection */}
      {currentPhase === 'selection' && (
        <div>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">🤖 Today's AI Generated Memes</h2>
            <p className="text-gray-300">Vote for your favorite meme to advance to rarity voting</p>
            <div className="bg-blue-600 bg-opacity-20 border border-blue-600 rounded-lg p-4 mt-4 inline-block">
              <span className="text-blue-300">💡 Phase 1/2: Meme Selection - Pick the winner!</span>
            </div>
            
            {/* Status indicators */}
            {loading && (
              <div className="bg-yellow-600 bg-opacity-20 border border-yellow-600 rounded-lg p-3 mt-4 inline-block">
                <span className="text-yellow-300">🔄 Loading AI-generated memes...</span>
              </div>
            )}
            
            {error && (
              <div className="bg-red-600 bg-opacity-20 border border-red-600 rounded-lg p-3 mt-4 inline-block">
                <span className="text-red-300">⚠️ Using fallback memes (Backend: {error})</span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {dailyMemes.map((meme) => (
                <div key={meme.id} className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl overflow-hidden border border-white border-opacity-20 hover:scale-105 transition-transform">
                  <img
                    src={meme.imageUrl || meme.image}
                    alt={meme.title}
                    className="w-full h-64 object-cover cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => {
                      setModalMeme(meme);
                      setIsModalOpen(true);
                    }}
                    title="Click to enlarge"
                    onError={(e) => {
                      // Fallback image if AI-generated image fails to load
                      e.target.src = `https://via.placeholder.com/400x300/8B5CF6/FFFFFF?text=${encodeURIComponent(meme.title)}`;
                    }}
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">{meme.title}</h3>
                    <p className="text-gray-300 text-sm mb-4">
                      {meme.description || `AI-generated from: ${meme.newsSource}`}
                    </p>
                    
                    {/* Metadata badges */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {meme.metadata?.fallback && (
                        <span className="text-xs bg-orange-600 bg-opacity-20 text-orange-300 px-2 py-1 rounded">
                          Fallback
                        </span>
                      )}
                      {meme.metadata?.imageGenerated && (
                        <span className="text-xs bg-green-600 bg-opacity-20 text-green-300 px-2 py-1 rounded">
                          AI Generated
                        </span>
                      )}
                      {meme.newsSource && (
                        <span className="text-xs bg-blue-600 bg-opacity-20 text-blue-300 px-2 py-1 rounded">
                          {meme.newsSource.substring(0, 20)}...
                        </span>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-sm text-gray-400">
                        Current votes: <span className="text-white font-bold">{votes[meme.id] || 0}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleVote(meme.id)}
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold hover:scale-105 transition-transform"
                    >
                      ❤️ Vote for This Meme
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
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">🏆 Winner Selected!</h2>
            <p className="text-gray-300">Now vote to decide this meme's NFT rarity level</p>
            <div className="bg-green-600 bg-opacity-20 border border-green-600 rounded-lg p-4 mt-4 inline-block">
              <span className="text-green-300">💎 Phase 2/2: Rarity Decision - This NFT will be minted!</span>
            </div>
          </div>

          {/* Winning Meme Display */}
          <div className="max-w-md mx-auto mb-8">
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-1 rounded-2xl">
              <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl overflow-hidden">
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
                    e.target.src = `https://via.placeholder.com/400x300/F59E0B/FFFFFF?text=${encodeURIComponent(selectedMeme.title)}`;
                  }}
                />
                <div className="p-6 text-center">
                  <h3 className="text-xl font-bold">{selectedMeme.title}</h3>
                  <p className="text-sm text-gray-300">
                    {selectedMeme.description || `AI-generated from: ${selectedMeme.newsSource}`}
                  </p>
                  
                  {/* Show AI generation info */}
                  {selectedMeme.metadata?.imageGenerated && (
                    <div className="bg-green-600 bg-opacity-20 border border-green-600 rounded-lg p-2 mt-2">
                      <span className="text-green-300 text-xs">🤖 Real AI Generated Image</span>
                    </div>
                  )}
                  
                  <div className="bg-yellow-500 bg-opacity-20 border border-yellow-500 rounded-lg p-2 mt-3">
                    <span className="text-yellow-300 text-sm">👑 Winning Meme - Will be minted as NFT</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rarity Options - MVP Spec: 3 Options Only */}
          <div className="grid md:grid-cols-3 gap-6">
            {rarityOptions.map((option) => (
              <div key={option.id} className="text-center">
                <button
                  onClick={() => handleRarityVote(option.id)}
                  className={`w-full ${option.color} bg-opacity-20 border-2 border-opacity-40 rounded-xl p-8 hover:scale-105 transition-transform hover:bg-opacity-30`}
                  style={{ borderColor: option.color.replace('bg-', '').replace('-600', '') }}
                >
                  <div className="text-4xl mb-3">{option.icon}</div>
                  <div className="font-bold text-xl mb-2">{option.label}</div>
                  <div className="text-sm text-gray-300 mb-3">{option.desc}</div>
                  <div className="text-xs text-gray-400">
                    {rarityVotes[option.id]} votes
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Phase 3: Completed */}
      {currentPhase === 'completed' && (
        <div className="text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold mb-6">🎉 Voting Complete!</h2>
            <p className="text-xl text-gray-300 mb-8">
              Thank you for participating in today's meme democracy!
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-green-600 bg-opacity-20 border border-green-600 rounded-xl p-6">
                <div className="text-3xl mb-2">🎫</div>
                <h3 className="font-bold text-lg mb-1">Tickets Earned</h3>
                <div className="text-2xl text-green-300">{earnedTickets} tickets</div>
              </div>
              
              <div className="bg-purple-600 bg-opacity-20 border border-purple-600 rounded-xl p-6">
                <div className="text-3xl mb-2">🔥</div>
                <h3 className="font-bold text-lg mb-1">Voting Streak</h3>
                <div className="text-2xl text-purple-300">{votingStreak} days</div>
              </div>
            </div>

            <div className="bg-yellow-600 bg-opacity-20 border border-yellow-600 rounded-xl p-6 mb-8">
              <h3 className="text-xl font-bold mb-3">📅 Next Steps</h3>
              <ul className="text-left space-y-2 text-sm text-gray-300">
                <li>• Your winning meme will be minted as an NFT</li>
                <li>• NFT auction starts in 24 hours, lasting 3 days</li>
                <li>• 80% of auction proceeds go to weekly lottery</li>
                <li>• Weekly drawing: Sunday 8PM UTC</li>
                <li>• Come back tomorrow for new memes to vote on!</li>
              </ul>
            </div>

            <button
              onClick={resetVoting}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-bold hover:scale-105 transition-transform"
            >
              🔄 View Results & Stats
            </button>
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