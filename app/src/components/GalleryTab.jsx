import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import ModalOverlay from './ModalOverlay';
import CommentSection from './CommentSection';
import { useAuth } from '../hooks/useAuth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://memeforge-api-836651762884.asia-southeast1.run.app';

// Origin badge config — provenance labels for meme cards
const ORIGIN_BADGES = {
  // Custom memes from Lab / x402 / ACP
  lab:  { label: 'Lab Experiment', color: '#FACC15', bg: 'rgba(250,204,21,0.15)', border: 'rgba(250,204,21,0.3)' },
  x402: { label: 'Custom Commission', color: '#4ADE80', bg: 'rgba(74,222,128,0.15)', border: 'rgba(74,222,128,0.3)' },
  acp:  { label: 'Agent Commission', color: '#C084FC', bg: 'rgba(192,132,252,0.15)', border: 'rgba(192,132,252,0.3)' },
};

const getOriginBadge = (meme) => {
  const source = meme.metadata?.source;
  if (source && ORIGIN_BADGES[source]) return ORIGIN_BADGES[source];
  if (meme.type === 'custom') return ORIGIN_BADGES.lab; // fallback for custom without source
  return null; // daily memes — "Memeya Original" shown via absence of special badge
};

// Convert rarity averageScore (1-10) to star display (0.5-5 stars)
const getStarRating = (meme) => {
  const avg = meme.rarity?.averageScore;
  if (!avg || avg <= 0) return null;
  const stars = Math.round(avg) / 2; // 1-10 → 0.5-5, rounded to nearest 0.5
  const full = Math.floor(stars);
  const half = stars % 1 >= 0.5;
  return '⭐'.repeat(full) + (half ? '✨' : '');
};

const GalleryTab = () => {
  const { t, i18n } = useTranslation();
  const { walletAddress } = useAuth();
  const [memes, setMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMeme, setSelectedMeme] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'winners'
  const [copied, setCopied] = useState(false);
  const [visibleDays, setVisibleDays] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRarities, setSelectedRarities] = useState(new Set());
  const DAYS_PER_PAGE = 10;

  const RARITIES = [
    { key: 'legendary', color: '#FF8000', bg: 'rgba(255,128,0,0.2)' },
    { key: 'epic',      color: '#A335EE', bg: 'rgba(163,53,238,0.2)' },
    { key: 'rare',      color: '#0070DD', bg: 'rgba(0,112,221,0.2)' },
    { key: 'uncommon',  color: '#1EFF00', bg: 'rgba(30,255,0,0.2)' },
    { key: 'common',    color: '#A9A9A9', bg: 'rgba(169,169,169,0.2)' },
  ];

  const toggleRarity = (key) => {
    setSelectedRarities(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setVisibleDays(DAYS_PER_PAGE);
  };

  const matchesSearch = (meme, query) => {
    const q = query.toLowerCase();
    return meme.tags?.some(tag => tag.toLowerCase().includes(q)) ||
           meme.title?.toLowerCase().includes(q);
  };

  const getMatchingTags = (meme, query) => {
    if (!query || !meme.tags) return [];
    const q = query.toLowerCase();
    return meme.tags.filter(tag => tag.toLowerCase().includes(q));
  };

  // Share helpers
  const getShareUrl = (meme) => {
    if (!meme?.id) return '';
    return `https://aimemeforge.io/meme/${meme.id}`;
  };

  const handleCopyLink = async () => {
    const url = getShareUrl(selectedMeme);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShareToX = () => {
    const url = getShareUrl(selectedMeme);
    const text = `${selectedMeme.title} - Check out this meme on AI MemeForge!`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    fetchHallOfMemes();
  }, []);

  // Reset copied state when modal closes
  useEffect(() => {
    if (!selectedMeme) setCopied(false);
  }, [selectedMeme]);

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
    return date.toLocaleDateString(i18n.language, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const filteredMemes = (filter === 'winners'
    ? memes.filter(m => m.isWinner)
    : memes
  ).filter(m => !searchQuery || matchesSearch(m, searchQuery))
   .filter(m => selectedRarities.size === 0 || selectedRarities.has(m.finalRarity));

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
        <h2 className="text-3xl font-bold mb-4">{'\uD83C\uDFDB\uFE0F'} {t('gallery.title')}</h2>
        <p className="text-gray-300">{t('gallery.desc')}</p>

        {/* Filter Tabs */}
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={() => { setFilter('all'); setVisibleDays(DAYS_PER_PAGE); }}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              filter === 'all'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
            }`}
          >
            {t('gallery.allMemes')}
          </button>
          <button
            onClick={() => { setFilter('winners'); setVisibleDays(DAYS_PER_PAGE); }}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              filter === 'winners'
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/25'
                : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
            }`}
          >
            {t('gallery.topVoted')}
          </button>
        </div>

        {/* Search Input */}
        <div className="relative max-w-md mx-auto mt-4">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setVisibleDays(DAYS_PER_PAGE); }}
            placeholder={t('gallery.searchPlaceholder')}
            className="w-full pl-10 pr-9 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-white"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Rarity Filter */}
        <div className="flex flex-wrap justify-center gap-2 mt-3">
          {RARITIES.map(({ key, color, bg }) => (
            <button
              key={key}
              onClick={() => toggleRarity(key)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                selectedRarities.has(key)
                  ? 'scale-105 shadow-lg'
                  : 'opacity-60 hover:opacity-90'
              }`}
              style={{
                backgroundColor: selectedRarities.has(key) ? bg : 'transparent',
                borderColor: color + (selectedRarities.has(key) ? '' : '40'),
                color,
              }}
            >
              {selectedRarities.has(key) && '\u2713 '}{t(`gallery.rarity.${key}`)}
            </button>
          ))}
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
          <div className="text-4xl mb-4">{'\uD83D\uDE35'}</div>
          <p className="text-red-300">{t('gallery.loadError', { error })}</p>
          <button
            onClick={fetchHallOfMemes}
            className="mt-4 px-6 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-300 transition-colors"
          >
            {t('common.retry')}
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && memes.length === 0 && (
        <div className="text-center py-16 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl">
          <div className="text-6xl mb-4">{'\uD83C\uDFA8'}</div>
          <h3 className="text-xl font-bold mb-2">{t('gallery.emptyTitle')}</h3>
          <p className="text-gray-400" dangerouslySetInnerHTML={{ __html: t('gallery.emptyDesc') }} />
        </div>
      )}

      {/* No Search Results */}
      {!loading && !error && memes.length > 0 && filteredMemes.length === 0 && (
        <div className="text-center py-12 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl">
          <div className="text-4xl mb-3">{'\uD83D\uDD0D'}</div>
          <h3 className="text-lg font-bold text-white mb-1">{t('gallery.noResults')}</h3>
          {searchQuery && <p className="text-gray-400 text-sm">{t('gallery.noResultsDesc', { query: searchQuery })}</p>}
          <div className="flex justify-center gap-3 mt-4">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-5 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-cyan-300 text-sm transition-colors"
              >
                {t('gallery.clearSearch')}
              </button>
            )}
            {selectedRarities.size > 0 && (
              <button
                onClick={() => setSelectedRarities(new Set())}
                className="px-5 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-300 text-sm transition-colors"
              >
                {t('gallery.clearFilters')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Meme Gallery */}
      {!loading && !error && filteredMemes.length > 0 && (
        <>
          {/* Winners Only - Compact flat grid without date grouping */}
          {filter === 'winners' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {filteredMemes
                .sort((a, b) => (b.generatedAt || '').localeCompare(a.generatedAt || ''))
                .map((meme) => (
                  <div
                    key={meme.id}
                    onClick={() => setSelectedMeme(meme)}
                    className="group relative cursor-pointer bg-white/5 backdrop-blur-md rounded-xl overflow-hidden border border-yellow-500/30 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:border-yellow-400 hover:shadow-yellow-500/20"
                  >
                    {/* Winner Badge */}
                    <div className="absolute top-1.5 right-1.5 z-10 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg">
                      {'\uD83C\uDFC6'}
                    </div>

                    {/* Date Badge */}
                    <div className="absolute top-1.5 left-1.5 z-10 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                      {formatDate(meme.generatedAt)}
                    </div>

                    {/* Origin Badge */}
                    {(() => { const ob = getOriginBadge(meme); return ob ? (
                      <div className="absolute top-7 left-1.5 z-10 text-[9px] font-medium px-1.5 py-0.5 rounded backdrop-blur-sm"
                        style={{ backgroundColor: ob.bg, color: ob.color, border: `1px solid ${ob.border}` }}>
                        {ob.label}
                      </div>
                    ) : null; })()}

                    {/* Image */}
                    <div className="relative aspect-square bg-gray-800 overflow-hidden">
                      {meme.nftOwner && (
                        <div className="absolute bottom-1.5 left-1.5 z-10 bg-purple-600/80 text-white text-[9px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                          {t('gallery.owned', { address: `${meme.nftOwner.walletAddress.slice(0, 4)}...${meme.nftOwner.walletAddress.slice(-4)}` })}
                        </div>
                      )}
                      <img
                        src={meme.imageUrl || meme.image}
                        alt={meme.title}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src = `https://via.placeholder.com/200x200/1F2937/9CA3AF?text=${encodeURIComponent(meme.title || 'Meme')}`;
                        }}
                      />
                    </div>

                    {/* Compact Content */}
                    <div className="p-2">
                      <h3 className="font-bold text-white text-xs truncate group-hover:text-yellow-300 transition-colors">
                        {meme.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                        {getStarRating(meme) && <span>{getStarRating(meme)}</span>}
                        {meme.finalRarity && (
                          <span className="px-1.5 py-0.5 rounded" style={{
                            backgroundColor: meme.finalRarity === 'legendary' ? 'rgba(255,128,0,0.2)' :
                              meme.finalRarity === 'epic' ? 'rgba(163,53,238,0.2)' :
                              meme.finalRarity === 'rare' ? 'rgba(0,112,221,0.2)' :
                              meme.finalRarity === 'uncommon' ? 'rgba(30,255,0,0.2)' :
                              'rgba(169,169,169,0.2)',
                            color: meme.finalRarity === 'legendary' ? '#FF8000' :
                              meme.finalRarity === 'epic' ? '#A335EE' :
                              meme.finalRarity === 'rare' ? '#0070DD' :
                              meme.finalRarity === 'uncommon' ? '#1EFF00' :
                              '#A9A9A9'
                          }}>
                            {meme.finalRarity}
                          </span>
                        )}
                      </div>
                      {searchQuery && getMatchingTags(meme, searchQuery).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {getMatchingTags(meme, searchQuery).map(tag => (
                            <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            /* All Memes - Grouped by date */
            <div className="space-y-10">
              {(() => {
                const sortedDates = Object.entries(groupedByDate)
                  .sort(([a], [b]) => b.localeCompare(a));
                const visibleDates = sortedDates.slice(0, visibleDays);
                const hasMore = sortedDates.length > visibleDays;
                return (<>
              {visibleDates.map(([date, dayMemes]) => (
                  <div key={date}>
                    {/* Date Header */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 backdrop-blur-sm border border-cyan-500/30 rounded-lg px-4 py-2">
                        <span className="text-cyan-300 font-medium">{'\uD83D\uDCC5'} {formatDate(date)}</span>
                      </div>
                      <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/30 to-transparent"></div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                      {dayMemes.map((meme) => (
                        <div
                          key={meme.id}
                          onClick={() => setSelectedMeme(meme)}
                          className={`group relative cursor-pointer bg-white/5 backdrop-blur-md rounded-xl overflow-hidden border transition-all duration-300 hover:scale-[1.03] hover:shadow-xl ${
                            meme.isWinner
                              ? 'border-yellow-500/50 hover:border-yellow-400 hover:shadow-yellow-500/20'
                              : 'border-white/10 hover:border-cyan-500/50 hover:shadow-cyan-500/20'
                          }`}
                        >
                          {/* Winner Badge */}
                          {meme.isWinner && (
                            <div className="absolute top-2 right-2 z-10 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                              #1
                            </div>
                          )}

                          {/* Origin Badge */}
                          {(() => { const ob = getOriginBadge(meme); return ob ? (
                            <div className="absolute top-2 left-2 z-10 text-[10px] font-medium px-2 py-0.5 rounded backdrop-blur-sm"
                              style={{ backgroundColor: ob.bg, color: ob.color, border: `1px solid ${ob.border}` }}>
                              {ob.label}
                            </div>
                          ) : null; })()}

                          <div className="relative aspect-square bg-gray-800 overflow-hidden">
                            {meme.nftOwner && (
                              <div className="absolute bottom-2 left-2 z-10 bg-purple-600/80 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">
                                {t('gallery.owned', { address: `${meme.nftOwner.walletAddress.slice(0, 4)}...${meme.nftOwner.walletAddress.slice(-4)}` })}
                              </div>
                            )}
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
                          <div className="p-2">
                            <h3 className="font-bold text-white text-xs truncate group-hover:text-cyan-300 transition-colors">
                              {meme.title}
                            </h3>

                            {/* Stats */}
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                              {getStarRating(meme) && <span>{getStarRating(meme)}</span>}
                              {meme.finalRarity && (
                                <span className="px-1.5 py-0.5 rounded" style={{
                                  backgroundColor: meme.finalRarity === 'legendary' ? 'rgba(255,128,0,0.2)' :
                                    meme.finalRarity === 'epic' ? 'rgba(163,53,238,0.2)' :
                                    meme.finalRarity === 'rare' ? 'rgba(0,112,221,0.2)' :
                                    meme.finalRarity === 'uncommon' ? 'rgba(30,255,0,0.2)' :
                                    'rgba(169,169,169,0.2)',
                                  color: meme.finalRarity === 'legendary' ? '#FF8000' :
                                    meme.finalRarity === 'epic' ? '#A335EE' :
                                    meme.finalRarity === 'rare' ? '#0070DD' :
                                    meme.finalRarity === 'uncommon' ? '#1EFF00' :
                                    '#A9A9A9'
                                }}>
                                  {meme.finalRarity}
                                </span>
                              )}
                            </div>
                            {searchQuery && getMatchingTags(meme, searchQuery).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {getMatchingTags(meme, searchQuery).map(tag => (
                                  <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
              ))}
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => setVisibleDays(prev => prev + DAYS_PER_PAGE)}
                    className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-cyan-500/50 rounded-xl text-gray-300 hover:text-white transition-all duration-300"
                  >
                    {t('gallery.loadMore', { count: sortedDates.length - visibleDays })}
                  </button>
                </div>
              )}
                </>);
              })()}
            </div>
          )}
        </>
      )}

      {/* Meme Detail Modal */}
      <ModalOverlay
        isOpen={!!selectedMeme}
        onClose={() => setSelectedMeme(null)}
        backdropOpacity="bg-black/80"
        zIndex={60}
        className="bg-gray-900/95 border border-white/20 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
      >
        {selectedMeme && (
          <>
            {/* Modal Header - Fixed */}
            <div className="flex-shrink-0 flex justify-between items-center p-3 md:p-4 border-b border-white/10">
              <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                {selectedMeme.isWinner && (
                  <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-2 md:px-3 py-1 rounded-full">
                    {t('gallery.mostVoted')}
                  </span>
                )}
                {(() => { const ob = getOriginBadge(selectedMeme); return ob ? (
                  <span className="text-xs font-medium px-2 py-1 rounded-full"
                    style={{ backgroundColor: ob.bg, color: ob.color, border: `1px solid ${ob.border}` }}>
                    {ob.label}
                  </span>
                ) : null; })()}
                <span className="text-gray-400 text-sm">
                  {formatDate(selectedMeme.generatedAt)}
                </span>
              </div>
              <button
                onClick={() => setSelectedMeme(null)}
                className="text-gray-400 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center flex-shrink-0"
              >
                {'\u00D7'}
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-3 md:p-4">
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
                  <div className="text-xl md:text-2xl font-bold text-yellow-400">
                    {getStarRating(selectedMeme) || '—'}
                  </div>
                  <div className="text-xs md:text-sm text-gray-400">{t('gallery.selectionVotes')}</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 md:p-4 text-center">
                  <div className="text-xl md:text-2xl font-bold" style={{
                    color: selectedMeme.finalRarity === 'legendary' ? '#FF8000' :
                      selectedMeme.finalRarity === 'epic' ? '#A335EE' :
                      selectedMeme.finalRarity === 'rare' ? '#0070DD' :
                      selectedMeme.finalRarity === 'uncommon' ? '#1EFF00' :
                      '#A9A9A9'
                  }}>
                    {selectedMeme.finalRarity || t('common.pending')}
                  </div>
                  <div className="text-xs md:text-sm text-gray-400">{t('gallery.rarityLevel')}</div>
                </div>
              </div>

              {/* NFT Owner Info */}
              {selectedMeme.nftOwner && (
                <div className="mt-4 bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-purple-400 font-bold text-sm">{t('gallery.nftOwner')}</span>
                  </div>
                  <div className="text-white text-sm font-mono break-all">
                    {selectedMeme.nftOwner.walletAddress}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {t('gallery.wonOn', { date: new Date(selectedMeme.nftOwner.selectedAt).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' }) })}
                  </div>
                </div>
              )}

              {/* Comments Section (Tapestry) */}
              {selectedMeme.id && (
                <div className="mt-4">
                  <CommentSection memeId={selectedMeme.id} walletAddress={walletAddress} />
                </div>
              )}

              {/* News Source */}
              {selectedMeme.newsSource && (
                <div className="mt-4 text-xs md:text-sm text-gray-500">
                  {'\uD83D\uDCF0'} {t('gallery.inspiredBy', { source: selectedMeme.newsSource })}
                </div>
              )}

              {/* Share Buttons */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={handleShareToX}
                    className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-gray-800 border border-white/20 rounded-lg transition-all duration-200 hover:scale-105"
                  >
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    <span className="text-white text-sm font-medium">{t('common.share')}</span>
                  </button>

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
                        <span className="text-green-400 text-sm font-medium">{t('common.copied')}</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="text-gray-300 text-sm font-medium">{t('common.copyLink')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </ModalOverlay>
    </div>
  );
};

export default GalleryTab;
