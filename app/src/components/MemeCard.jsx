import React from 'react';
import { useTranslation } from 'react-i18next';

// ── Shared utilities ──────────────────────────────────────────────────

export const RARITY_COLORS = {
  legendary: { color: '#FF8000', bg: 'rgba(255,128,0,0.2)' },
  epic:      { color: '#A335EE', bg: 'rgba(163,53,238,0.2)' },
  rare:      { color: '#0070DD', bg: 'rgba(0,112,221,0.2)' },
  uncommon:  { color: '#1EFF00', bg: 'rgba(30,255,0,0.2)' },
  common:    { color: '#A9A9A9', bg: 'rgba(169,169,169,0.2)' },
};

export const ORIGIN_BADGES = {
  lab:  { label: 'Lab Experiment',    color: '#FACC15', bg: 'rgba(250,204,21,0.15)', border: 'rgba(250,204,21,0.3)' },
  x402: { label: 'Custom Commission', color: '#4ADE80', bg: 'rgba(74,222,128,0.15)', border: 'rgba(74,222,128,0.3)' },
  acp:  { label: 'Agent Commission',  color: '#C084FC', bg: 'rgba(192,132,252,0.15)', border: 'rgba(192,132,252,0.3)' },
};

export const getOriginBadge = (meme) => {
  const source = meme.metadata?.source;
  if (source && ORIGIN_BADGES[source]) return ORIGIN_BADGES[source];
  if (meme.type === 'custom') return ORIGIN_BADGES.lab;
  return null;
};

export const getStarRating = (meme) => {
  const avg = meme.rarity?.averageScore || meme.rarityScore;
  if (!avg || avg <= 0) return null;
  const stars = Math.round(avg) / 2;
  const full = Math.floor(stars);
  const half = stars % 1 >= 0.5;
  return '\u2B50'.repeat(full) + (half ? '\u2728' : '');
};

// ── Hover theme presets ───────────────────────────────────────────────

const HOVER_THEMES = {
  yellow: {
    border: 'border-yellow-500/30',
    hover: 'hover:border-yellow-400 hover:shadow-yellow-500/20',
    title: 'group-hover:text-yellow-300',
  },
  cyan: {
    border: 'border-white/10',
    hover: 'hover:border-cyan-500/50 hover:shadow-cyan-500/20',
    title: 'group-hover:text-cyan-300',
  },
  indigo: {
    border: 'border-white/10',
    hover: 'hover:border-indigo-500/50',
    title: 'group-hover:text-indigo-300',
  },
};

// ── Component ─────────────────────────────────────────────────────────

const MemeCard = ({
  meme,
  variant = 'compact',
  onClick,
  href,
  showBadges = {},
  hoverColor = 'cyan',
  imageFit,
  voteCount,
  children,
}) => {
  const { t, i18n } = useTranslation();

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(i18n.language, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  // ── Detailed variant (ForgeTab) ─────────────────────────────────────
  if (variant === 'detailed') {
    return (
      <div className="bg-gray-900/95 backdrop-blur-md rounded-2xl overflow-hidden border border-white border-opacity-20 hover:scale-105 transition-transform">
        <img
          src={meme.imageUrl || meme.image}
          alt={meme.title}
          className="w-full aspect-[4/3] object-cover cursor-pointer hover:scale-105 transition-transform"
          onClick={onClick}
          title="Click to enlarge"
          onError={(e) => {
            e.target.src = `https://via.placeholder.com/400x300/8B5CF6/FFFFFF?text=${encodeURIComponent(meme.title)}`;
          }}
        />
        <div className="p-6">
          <h3 className="text-xl font-bold mb-2">{meme.title}</h3>
          <p className="text-gray-300 text-sm mb-4">
            {meme.description || `AI-generated from: ${meme.newsSource}`}
          </p>

          {/* Metadata tags */}
          <div className="flex flex-wrap gap-1 mb-2">
            {meme.metadata?.imageGenerated && (
              <span className="text-xs bg-green-600 bg-opacity-20 text-green-300 px-2 py-1 rounded">
                {meme.metadata?.aiModel?.includes('grok') ? 'Grok' : 'Gemini'}
              </span>
            )}
            {meme.style && (
              <span className="text-xs bg-purple-600 bg-opacity-20 text-purple-300 px-2 py-1 rounded">
                {meme.style}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1 mb-2">
            {meme.newsSource && (
              <span className="text-xs bg-blue-600 bg-opacity-20 text-blue-300 px-2 py-1 rounded">
                {meme.newsSource}
              </span>
            )}
          </div>
          {meme.tags && meme.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {meme.tags.map((tag, idx) => (
                <span key={idx} className="text-xs bg-cyan-600 bg-opacity-20 text-cyan-300 px-2 py-1 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {voteCount !== undefined && (
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-gray-400">
                {t('forge.phase1.currentVotes')}<span className="text-white font-bold">{voteCount}</span>
              </div>
            </div>
          )}

          {children}
        </div>
      </div>
    );
  }

  // ── Compact variant ─────────────────────────────────────────────────
  const theme = HOVER_THEMES[hoverColor] || HOVER_THEMES.cyan;
  const stars = getStarRating(meme);
  const rarity = RARITY_COLORS[meme.finalRarity];
  const originBadge = showBadges.origin ? getOriginBadge(meme) : null;
  const fit = imageFit || 'object-contain';
  const imgSrc = meme.imageUrl || meme.image;

  const cardContent = (
    <>
      {/* Winner Badge */}
      {showBadges.winner && (
        <div className="absolute top-1.5 right-1.5 z-10 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg">
          {'\uD83C\uDFC6'}
        </div>
      )}

      {/* Date Badge */}
      {showBadges.date && meme.generatedAt && (
        <div className="absolute top-1.5 left-1.5 z-10 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
          {formatDate(meme.generatedAt)}
        </div>
      )}

      {/* Origin Badge */}
      {originBadge && (
        <div
          className={`absolute ${showBadges.date && meme.generatedAt ? 'top-7' : 'top-2'} left-1.5 z-10 text-[9px] font-medium px-1.5 py-0.5 rounded backdrop-blur-sm`}
          style={{ backgroundColor: originBadge.bg, color: originBadge.color, border: `1px solid ${originBadge.border}` }}
        >
          {originBadge.label}
        </div>
      )}

      {/* Image */}
      <div className="relative aspect-square bg-gray-800 overflow-hidden">
        {showBadges.nftOwner && meme.nftOwner && (
          <div className="absolute bottom-1.5 left-1.5 z-10 bg-purple-600/80 text-white text-[9px] px-1.5 py-0.5 rounded backdrop-blur-sm">
            {t('gallery.owned', { address: `${meme.nftOwner.walletAddress.slice(0, 4)}...${meme.nftOwner.walletAddress.slice(-4)}` })}
          </div>
        )}
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={meme.title}
            className={`w-full h-full ${fit} group-hover:scale-105 transition-transform duration-500`}
            loading="lazy"
            onError={(e) => {
              e.target.src = `https://via.placeholder.com/300x300/1F2937/9CA3AF?text=${encodeURIComponent(meme.title || 'Meme')}`;
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">{'\uD83C\uDFA8'}</div>
        )}
      </div>

      {/* Content */}
      <div className="p-2">
        <h3 className={`font-bold text-white text-xs truncate ${theme.title} transition-colors`}>
          {meme.title}
        </h3>
        {(stars || rarity) && (
          <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
            {stars && <span>{stars}</span>}
            {rarity && (
              <span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: rarity.bg, color: rarity.color }}>
                {meme.finalRarity}
              </span>
            )}
          </div>
        )}
        {children}
      </div>
    </>
  );

  const baseClasses = `group relative bg-white/5 backdrop-blur-md rounded-xl overflow-hidden border transition-all duration-300 hover:scale-[1.03] hover:shadow-xl ${theme.border} ${theme.hover}`;

  if (href) {
    return <a href={href} className={baseClasses}>{cardContent}</a>;
  }

  return (
    <div
      onClick={onClick}
      className={`${baseClasses} ${onClick ? 'cursor-pointer' : ''}`}
    >
      {cardContent}
    </div>
  );
};

export default MemeCard;
