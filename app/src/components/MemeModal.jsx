import React, { useEffect, useState } from 'react';
import ModalOverlay from './ModalOverlay';

const MemeModal = ({ isOpen, onClose, meme, memes = [], currentIndex = 0, onNavigate, votedMemeId, onVote }) => {
  const [copied, setCopied] = useState(false);

  const getShareUrl = () => {
    if (!meme?.id) return '';
    return `https://aimemeforge.io/meme/${meme.id}`;
  };

  const handleCopyLink = async () => {
    const url = getShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShareToX = () => {
    const url = getShareUrl();
    const text = `${meme.title} - Vote on AI MemeForge!`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  };

  // Handle keyboard navigation (ESC, Left/Right arrows)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
      // Arrow navigation only if we have memes array and onNavigate callback
      if (onNavigate && memes.length > 1) {
        if (event.keyCode === 37) { // Left arrow
          const newIndex = currentIndex > 0 ? currentIndex - 1 : memes.length - 1;
          onNavigate(newIndex);
        } else if (event.keyCode === 39) { // Right arrow
          const newIndex = currentIndex < memes.length - 1 ? currentIndex + 1 : 0;
          onNavigate(newIndex);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, onNavigate, memes.length, currentIndex]);

  // Reset copied state when meme changes
  useEffect(() => {
    setCopied(false);
  }, [meme?.id]);

  if (!meme) return null;

  const showVoting = typeof onVote === 'function';

  return (
    <ModalOverlay
      isOpen={isOpen}
      onClose={onClose}
      className="relative w-full max-w-4xl max-h-[85vh] bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-2xl overflow-y-auto"
    >
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
      <div className="p-4 md:p-6 pr-14 md:pr-16 border-b border-white/10">
        <div className="flex items-start justify-between gap-2 md:gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg md:text-2xl font-bold text-white mb-1 md:mb-2 truncate">{meme.title}</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              {meme.votes && meme.votes.selection && (
                <span>{meme.votes.selection.yes + meme.votes.selection.no} votes</span>
              )}
              {meme.sentiment && (
                <span className={`px-2 py-1 rounded ${
                  meme.sentiment === 'Bullish' ? 'bg-green-500/20 text-green-400' :
                  meme.sentiment === 'Frustrated' ? 'bg-red-500/20 text-red-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {typeof meme.sentiment === 'object' ? JSON.stringify(meme.sentiment) : meme.sentiment}
                </span>
              )}
            </div>
          </div>
          {/* Navigation Counter in header */}
          {onNavigate && memes.length > 1 && (
            <div className="bg-white/10 text-white text-sm px-3 py-1 rounded-full whitespace-nowrap">
              {currentIndex + 1} / {memes.length}
            </div>
          )}
        </div>
      </div>

      {/* Image Display */}
      <div className="p-4 md:p-6">
        <div className="flex justify-center">
          {meme.imageUrl ? (
            <img
              src={meme.imageUrl}
              alt={meme.title}
              className="max-w-full max-h-[50vh] md:max-h-[60vh] object-contain rounded-lg shadow-2xl"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}

          {/* Fallback display */}
          <div
            className="flex-col items-center justify-center bg-gray-800/50 rounded-lg p-8 min-h-[300px] hidden"
            style={{ display: meme.imageUrl ? 'none' : 'flex' }}
          >
            <div className="text-8xl mb-4">{meme.image}</div>
            <p className="text-gray-400">Click anywhere outside to close</p>
          </div>
        </div>
      </div>

      {/* Voting Section (shown when onVote prop is provided) */}
      {showVoting && (
        <div className="px-4 md:px-6 pb-4">
          {/* Description */}
          {(meme.description || meme.newsSource) && (
            <p className="text-gray-300 text-sm mb-4">
              {meme.description || `AI-generated from: ${meme.newsSource}`}
            </p>
          )}

          {/* NFT Traits - Row 1: AI Generated + Style */}
          <div className="flex flex-wrap gap-1 mb-2">
            {meme.metadata?.imageGenerated && (
              <span className="text-xs bg-green-600 bg-opacity-20 text-green-300 px-2 py-1 rounded">
                AI Generated
              </span>
            )}
            {meme.style && (
              <span className="text-xs bg-purple-600 bg-opacity-20 text-purple-300 px-2 py-1 rounded">
                {meme.style}
              </span>
            )}
          </div>

          {/* NFT Traits - Row 2: News Source */}
          <div className="flex flex-wrap gap-1 mb-2">
            {meme.newsSource && (
              <span className="text-xs bg-blue-600 bg-opacity-20 text-blue-300 px-2 py-1 rounded">
                {meme.newsSource}
              </span>
            )}
          </div>

          {/* NFT Traits - Row 3: Tags */}
          {meme.tags && meme.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {meme.tags.map((tag, idx) => (
                <span key={idx} className="text-xs bg-cyan-600 bg-opacity-20 text-cyan-300 px-2 py-1 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Vote Count */}
          <div className="text-sm text-gray-400 mb-4">
            Current votes: <span className="text-white font-bold">{meme.votes?.selection?.yes || 0}</span>
          </div>

          {/* Vote Button - 3 states */}
          {votedMemeId == null ? (
            <button
              onClick={() => onVote(meme.id)}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold hover:scale-105 transition-transform text-white"
            >
              ❤️ Vote for This Meme
            </button>
          ) : votedMemeId === meme.id ? (
            <button
              disabled
              className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg font-semibold cursor-not-allowed opacity-90 text-white"
            >
              ✅ You Voted This Meme
            </button>
          ) : (
            <button
              disabled
              className="w-full py-3 bg-gray-600 rounded-lg font-semibold cursor-not-allowed opacity-50 text-white"
            >
              Not Voted
            </button>
          )}
        </div>
      )}

      {/* Share Buttons */}
      <div className="px-4 md:px-6 pb-4">
        <div className="flex items-center justify-center gap-2 md:gap-3">
          {/* Share to X Button */}
          <button
            onClick={handleShareToX}
            className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-gray-800 border border-white/20 rounded-lg transition-all duration-200 hover:scale-105"
          >
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span className="text-white text-sm font-medium">Share</span>
          </button>

          {/* Copy Link Button */}
          <button
            onClick={handleCopyLink}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 ${
              copied
                ? 'bg-green-500/20 border border-green-500/50'
                : 'bg-white/5 hover:bg-white/10 border border-white/20'
            }`}
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-400 text-sm font-medium">Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-300 text-sm font-medium">Copy Link</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal Footer */}
      {meme.source && (
        <div className="px-4 md:px-6 pb-3 md:pb-4">
          <div className="bg-white/5 rounded-lg p-3 md:p-4">
            <p className="text-xs text-gray-400 truncate">Source: {meme.source}</p>
          </div>
        </div>
      )}

      {/* Helper Text */}
      <div className="px-4 md:px-6 pb-3 md:pb-4">
        <p className="text-xs text-gray-500 text-center">
          {onNavigate && memes.length > 1
            ? 'Swipe or use arrows to navigate'
            : 'Tap outside to close'}
        </p>
      </div>

      {/* Navigation Buttons (only if we have multiple memes) */}
      {onNavigate && memes.length > 1 && (
        <>
          {/* Previous Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const newIndex = currentIndex > 0 ? currentIndex - 1 : memes.length - 1;
              onNavigate(newIndex);
            }}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Next Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const newIndex = currentIndex < memes.length - 1 ? currentIndex + 1 : 0;
              onNavigate(newIndex);
            }}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </ModalOverlay>
  );
};

export default MemeModal;
