import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://memeforge-api-836651762884.asia-southeast1.run.app';

const GalleryTab = () => {
  const [memes, setMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMeme, setSelectedMeme] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'winners'

  useEffect(() => {
    fetchHallOfMemes();
  }, []);

  const fetchHallOfMemes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/memes/hall-of-memes?days=30&limit=50`);
      const result = await response.json();

      if (result.success) {
        setMemes(result.memes || []);
      } else {
        throw new Error(result.error || 'Failed to fetch');
      }
    } catch (err) {
      console.error('Failed to fetch Hall of Memes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const filteredMemes = filter === 'winners'
    ? memes.filter(m => m.isWinner)
    : memes;

  // Group by date for display
  const groupedByDate = filteredMemes.reduce((acc, meme) => {
    const date = meme.date || meme.generatedAt?.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(meme);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">🏛️ Hall of Memes</h2>
        <p className="text-gray-300">Legendary memes from days past</p>

        {/* Filter Tabs */}
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              filter === 'all'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
            }`}
          >
            All Memes
          </button>
          <button
            onClick={() => setFilter('winners')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              filter === 'winners'
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/25'
                : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
            }`}
          >
            🏆 Winners Only
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10 animate-pulse">
              <div className="aspect-square bg-gray-700/50"></div>
              <div className="p-3 md:p-4">
                <div className="h-4 bg-gray-700/50 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-700/50 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-12 bg-red-500/10 border border-red-500/30 rounded-2xl">
          <div className="text-4xl mb-4">😵</div>
          <p className="text-red-300">Failed to load gallery: {error}</p>
          <button
            onClick={fetchHallOfMemes}
            className="mt-4 px-6 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-300 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && memes.length === 0 && (
        <div className="text-center py-16 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl">
          <div className="text-6xl mb-4">🎨</div>
          <h3 className="text-xl font-bold mb-2">No Past Memes Yet</h3>
          <p className="text-gray-400">
            The gallery will fill up as more daily memes are created.
            <br />Check back tomorrow!
          </p>
        </div>
      )}

      {/* Meme Gallery */}
      {!loading && !error && Object.keys(groupedByDate).length > 0 && (
        <div className="space-y-10">
          {Object.entries(groupedByDate)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([date, dayMemes]) => (
              <div key={date}>
                {/* Date Header */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 backdrop-blur-sm border border-cyan-500/30 rounded-lg px-4 py-2">
                    <span className="text-cyan-300 font-medium">📅 {formatDate(date)}</span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/30 to-transparent"></div>
                </div>

                {/* Day's Memes Grid - 2 columns on mobile, 3-4 on desktop */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {dayMemes.map((meme) => (
                    <div
                      key={meme.id}
                      onClick={() => setSelectedMeme(meme)}
                      className={`group relative cursor-pointer bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
                        meme.isWinner
                          ? 'border-yellow-500/50 hover:border-yellow-400 hover:shadow-yellow-500/20'
                          : 'border-white/10 hover:border-cyan-500/50 hover:shadow-cyan-500/20'
                      }`}
                    >
                      {/* Winner Badge */}
                      {meme.isWinner && (
                        <div className="absolute top-2 right-2 z-10 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                          🏆 WINNER
                        </div>
                      )}

                      {/* Image - Square aspect ratio with contain to show full image */}
                      <div className="relative aspect-square bg-gray-800 overflow-hidden">
                        <img
                          src={meme.imageUrl || meme.image}
                          alt={meme.title}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            e.target.src = `https://via.placeholder.com/400x400/1F2937/9CA3AF?text=${encodeURIComponent(meme.title || 'Meme')}`;
                          }}
                        />
                      </div>

                      {/* Content */}
                      <div className="p-3 md:p-4">
                        <h3 className="font-bold text-white text-sm md:text-base truncate group-hover:text-cyan-300 transition-colors">
                          {meme.title}
                        </h3>

                        {/* Stats */}
                        <div className="flex items-center gap-2 md:gap-4 mt-2 text-xs md:text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <span>❤️</span>
                            <span>{meme.votes?.selection?.yes || 0}</span>
                          </span>
                          {meme.finalRarity && (
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              meme.finalRarity === 'legendary' ? 'bg-purple-500/20 text-purple-300' :
                              meme.finalRarity === 'rare' ? 'bg-blue-500/20 text-blue-300' :
                              'bg-gray-500/20 text-gray-300'
                            }`}>
                              {meme.finalRarity}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Meme Detail Modal - Using Portal for proper z-index */}
      {selectedMeme && createPortal(
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 md:p-4"
          style={{ zIndex: 99999 }}
          onClick={() => setSelectedMeme(null)}
        >
          <div
            className="bg-gray-900/95 border border-white/20 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header - Fixed */}
            <div className="flex-shrink-0 flex justify-between items-center p-3 md:p-4 border-b border-white/10">
              <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                {selectedMeme.isWinner && (
                  <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-2 md:px-3 py-1 rounded-full">
                    🏆 DAILY WINNER
                  </span>
                )}
                <span className="text-gray-400 text-sm">
                  {formatDate(selectedMeme.generatedAt)}
                </span>
              </div>
              <button
                onClick={() => setSelectedMeme(null)}
                className="text-gray-400 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center flex-shrink-0"
              >
                ×
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-3 md:p-4">
              {/* Image - Full width, maintain aspect ratio */}
              <div className="bg-gray-800 rounded-xl overflow-hidden mb-4">
                <img
                  src={selectedMeme.imageUrl || selectedMeme.image}
                  alt={selectedMeme.title}
                  className="w-full h-auto max-h-[50vh] object-contain mx-auto"
                  onError={(e) => {
                    e.target.src = `https://via.placeholder.com/600x600/1F2937/9CA3AF?text=${encodeURIComponent(selectedMeme.title || 'Meme')}`;
                  }}
                />
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-white mb-2">{selectedMeme.title}</h2>

              {selectedMeme.description && (
                <p className="text-gray-300 text-sm md:text-base mb-4 line-clamp-3">{selectedMeme.description}</p>
              )}

              {/* Vote Stats */}
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="bg-white/5 rounded-xl p-3 md:p-4 text-center">
                  <div className="text-xl md:text-2xl font-bold text-green-400">
                    {selectedMeme.votes?.selection?.yes || 0}
                  </div>
                  <div className="text-xs md:text-sm text-gray-400">Selection Votes</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 md:p-4 text-center">
                  <div className="text-xl md:text-2xl font-bold text-purple-400">
                    {selectedMeme.finalRarity || 'Pending'}
                  </div>
                  <div className="text-xs md:text-sm text-gray-400">Rarity Level</div>
                </div>
              </div>

              {/* News Source */}
              {selectedMeme.newsSource && (
                <div className="mt-4 text-xs md:text-sm text-gray-500">
                  📰 Inspired by: {selectedMeme.newsSource}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default GalleryTab;
