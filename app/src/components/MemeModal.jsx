import React, { useEffect, useCallback } from 'react';

const MemeModal = ({ isOpen, onClose, meme, memes = [], currentIndex = 0, onNavigate }) => {
  // Navigation handlers
  const canNavigate = memes.length > 1 && onNavigate;

  const goToPrevious = useCallback(() => {
    if (!canNavigate) return;
    const newIndex = currentIndex === 0 ? memes.length - 1 : currentIndex - 1;
    onNavigate(newIndex);
  }, [canNavigate, currentIndex, memes.length, onNavigate]);

  const goToNext = useCallback(() => {
    if (!canNavigate) return;
    const newIndex = currentIndex === memes.length - 1 ? 0 : currentIndex + 1;
    onNavigate(newIndex);
  }, [canNavigate, currentIndex, memes.length, onNavigate]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'ArrowLeft') {
        goToPrevious();
      } else if (event.key === 'ArrowRight') {
        goToNext();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, goToPrevious, goToNext]);

  if (!isOpen || !meme) return null;

  // Get the current meme (either from prop or from memes array)
  const displayMeme = memes.length > 0 ? memes[currentIndex] : meme;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Previous Button */}
      {canNavigate && (
        <button
          onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
          className="absolute left-4 z-20 w-12 h-12 bg-black/50 hover:bg-purple-600/70 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 group"
          title="Previous (←)"
        >
          <svg className="w-6 h-6 text-white group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Next Button */}
      {canNavigate && (
        <button
          onClick={(e) => { e.stopPropagation(); goToNext(); }}
          className="absolute right-4 z-20 w-12 h-12 bg-black/50 hover:bg-purple-600/70 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 group"
          title="Next (→)"
        >
          <svg className="w-6 h-6 text-white group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Modal Content */}
      <div className="relative z-10 max-w-4xl max-h-[90vh] mx-4 bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden animate-in fade-in duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white mb-2 pr-12">{displayMeme.title}</h2>
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            {displayMeme.votes && displayMeme.votes.selection && (
              <span>{displayMeme.votes.selection.yes || 0} votes</span>
            )}
            {displayMeme.style && (
              <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400">
                {displayMeme.style}
              </span>
            )}
            {displayMeme.sentiment && (
              <span className={`px-2 py-1 rounded ${
                displayMeme.sentiment === 'Bullish' ? 'bg-green-500/20 text-green-400' :
                displayMeme.sentiment === 'Frustrated' ? 'bg-red-500/20 text-red-400' :
                'bg-blue-500/20 text-blue-400'
              }`}>
                {typeof displayMeme.sentiment === 'object' ? JSON.stringify(displayMeme.sentiment) : displayMeme.sentiment}
              </span>
            )}
          </div>
        </div>

        {/* Image Display */}
        <div className="p-6">
          <div className="flex justify-center">
            {displayMeme.imageUrl ? (
              <img
                src={displayMeme.imageUrl}
                alt={displayMeme.title}
                className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-2xl"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}

            {/* Fallback display */}
            <div
              className="flex-col items-center justify-center bg-gray-800/50 rounded-lg p-8 min-h-[300px] hidden"
              style={{ display: displayMeme.imageUrl ? 'none' : 'flex' }}
            >
              <div className="text-8xl mb-4">{displayMeme.image}</div>
              <p className="text-gray-400">Click anywhere outside to close</p>
            </div>
          </div>
        </div>

        {/* Description */}
        {displayMeme.description && (
          <div className="px-6 pb-4">
            <p className="text-gray-300 text-sm">{displayMeme.description}</p>
          </div>
        )}

        {/* Tags */}
        {displayMeme.tags && displayMeme.tags.length > 0 && (
          <div className="px-6 pb-4">
            <div className="flex flex-wrap gap-2">
              {displayMeme.tags.map((tag, idx) => (
                <span key={idx} className="text-xs bg-cyan-600/20 text-cyan-300 px-2 py-1 rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Pagination Dots */}
        {canNavigate && (
          <div className="px-6 pb-4 flex justify-center space-x-2">
            {memes.map((_, idx) => (
              <button
                key={idx}
                onClick={() => onNavigate(idx)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  idx === currentIndex
                    ? 'bg-purple-500 scale-110'
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
                title={`Meme ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Modal Footer */}
        {displayMeme.newsSource && (
          <div className="px-6 pb-4">
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-xs text-gray-400">News Source: {displayMeme.newsSource}</p>
            </div>
          </div>
        )}

        {/* Helper Text */}
        <div className="px-6 pb-4">
          <p className="text-xs text-gray-500 text-center">
            {canNavigate ? 'Use ← → arrows to navigate • ' : ''}Press ESC or click outside to close
          </p>
        </div>
      </div>
    </div>
  );
};

export default MemeModal;
