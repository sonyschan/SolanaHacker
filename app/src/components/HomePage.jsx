import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import WalletConnection from './WalletConnection';
import LanguageSwitcher from './LanguageSwitcher';
import { useAuth } from '../hooks/useAuth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://memeforge-api-836651762884.asia-southeast1.run.app';
const MEMEYA_TOKEN_CA = 'mPj8dgqLDciVX27vU5efHiodbQhsgK43gGhjQrBpump';

const TICKER_TAGS = {
  news_digest: { tag: 'SCANNING', color: 'text-blue-400' },
  crypto_commentary: { tag: 'SCANNING', color: 'text-blue-400' },
  meme_spotlight: { tag: 'FORGING', color: 'text-purple-400' },
  meme_forge: { tag: 'FORGING', color: 'text-purple-400' },
  winner_announcement: { tag: 'EARNING', color: 'text-yellow-400' },
  reward_recap: { tag: 'EARNING', color: 'text-yellow-400' },
  community_response: { tag: 'LISTENING', color: 'text-cyan-400' },
  comment_review: { tag: 'LISTENING', color: 'text-cyan-400' },
  dev_update: { tag: 'BUILDING', color: 'text-green-400' },
  feature_showtime: { tag: 'BUILDING', color: 'text-green-400' },
  personal_vibe: { tag: 'VIBING', color: 'text-gray-400' },
  token_spotlight: { tag: 'TRACKING', color: 'text-yellow-400' },
  meme_design: { tag: 'THINKING', color: 'text-violet-400' },
};

const getTickerTag = (topic) => TICKER_TAGS[topic] || { tag: 'VIBING', color: 'text-gray-400' };

const toLocalHHMM = (time, dateStr) => {
  if (!time || !dateStr) return '';
  try {
    const d = new Date(`${dateStr}T${time}+08:00`);
    return isNaN(d.getTime()) ? time.slice(0, 5) : d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch { return time.slice(0, 5); }
};

const RARITY_COLORS = {
  legendary: { color: '#FF8000', bg: 'rgba(255,128,0,0.2)' },
  epic: { color: '#A335EE', bg: 'rgba(163,53,238,0.2)' },
  rare: { color: '#0070DD', bg: 'rgba(0,112,221,0.2)' },
  uncommon: { color: '#1EFF00', bg: 'rgba(30,255,0,0.2)' },
  common: { color: '#A9A9A9', bg: 'rgba(169,169,169,0.2)' },
};

const HomePage = ({ onConnectWallet, walletConnected, connecting }) => {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const [weeklyVoters, setWeeklyVoters] = useState(0);
  const [totalMemes, setTotalMemes] = useState(0);
  const [caCopied, setCaCopied] = useState(false);
  const [workshop, setWorkshop] = useState(null);
  const [tickerIdx, setTickerIdx] = useState(0);
  const [featuredMemes, setFeaturedMemes] = useState([]);

  const copyCA = useCallback(() => {
    navigator.clipboard.writeText(MEMEYA_TOKEN_CA);
    setCaCopied(true);
    setTimeout(() => setCaCopied(false), 2000);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/stats`);
        const data = await response.json();
        if (data.success) {
          setWeeklyVoters(data.stats.weeklyVoters || 0);
          setTotalMemes(data.stats.totalMemes || 0);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };
    fetchStats();
  }, []);

  // Fetch featured memes for homepage gallery
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/memes/hall-of-memes?days=14&limit=20`);
        const data = await res.json();
        if (data.success && data.memes) {
          // Prioritize winners, fill with highest-voted
          const winners = data.memes.filter(m => m.isWinner);
          const nonWinners = data.memes.filter(m => !m.isWinner)
            .sort((a, b) => (b.votes?.selection?.yes || 0) - (a.votes?.selection?.yes || 0));
          const combined = [...winners, ...nonWinners].slice(0, 8);
          setFeaturedMemes(combined);
        }
      } catch (err) {
        console.error("Failed to fetch featured memes:", err);
      }
    };
    fetchFeatured();
  }, []);

  // Fetch Memeya workshop activity for homepage ticker
  useEffect(() => {
    const load = () => {
      fetch(`${API_BASE_URL}/api/memeya/workshop`)
        .then(r => r.json())
        .then(setWorkshop)
        .catch(() => {});
    };
    load();
    const timer = setInterval(load, 120000);
    return () => clearInterval(timer);
  }, []);

  // Rotate ticker entries (newest first)
  const tickerEntries = workshop?.entries?.length ? [...workshop.entries].reverse() : [];
  useEffect(() => {
    if (tickerEntries.length <= 1) return;
    const timer = setInterval(() => {
      setTickerIdx(prev => (prev + 1) % tickerEntries.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [tickerEntries.length]);

  const safeTickerIdx = tickerEntries.length ? tickerIdx % tickerEntries.length : 0;
  const currentTickerEntry = tickerEntries[safeTickerIdx];
  const tickerTag = currentTickerEntry ? getTickerTag(currentTickerEntry.topic) : null;
  const isChinese = i18n.language?.startsWith('zh');
  const tickerText = currentTickerEntry
    ? (isChinese ? (currentTickerEntry.text_zh || currentTickerEntry.text || '') : (currentTickerEntry.text_en || currentTickerEntry.text || ''))
    : '';

  const API_SERVICES = [
    { key: 'rate', price: '$0.005', sla: '~10s', color: 'cyan' },
    { key: 'generate', price: '$0.10', sla: '~60s', color: 'purple' },
    { key: 'catalog', price: 'Free', sla: null, color: 'green' },
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="absolute top-20 left-20 w-72 h-72 bg-cyan-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-500" />
        <div className="absolute top-40 right-1/4 w-64 h-64 bg-green-500/20 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 flex justify-between items-center p-4 md:p-6 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <span className="text-lg md:text-2xl font-bold">M</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI MemeForge
            </h1>
            <div className="text-xs text-gray-500 hidden sm:block">{t('home.tagline')}</div>
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
          <a
            href="#gallery"
            className="hidden sm:inline-flex items-center px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            {t('home.nav.gallery')}
          </a>
          <a
            href="#wiki"
            className="hidden sm:inline-flex items-center px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            {t('footer.wiki')}
          </a>

          <LanguageSwitcher variant="dropdown" />

          <div className="flex-shrink-0">
            <WalletConnection variant="primary" className="text-sm md:text-base" />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24">

        <div className="text-center mb-20 md:mb-28">
          <div className="inline-flex items-center space-x-2 mb-6 flex-wrap justify-center gap-2">
            <div className="px-4 py-2 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-sm text-cyan-400 font-medium">
              {t('home.hero.badges.aiCrafted')}
            </div>
            <div className="px-4 py-2 bg-green-400/10 border border-green-400/20 rounded-full text-sm text-green-400 font-medium">
              {t('home.hero.badges.humanVerified')}
            </div>
            <div className="px-4 py-2 bg-purple-400/10 border border-purple-400/20 rounded-full text-sm text-purple-400 font-medium">
              {t('home.hero.badges.payPerUse')}
            </div>
          </div>

          <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-4 leading-tight">
            <span className="bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              {t('home.hero.title')}
            </span>
          </h2>
          <p className="text-2xl md:text-3xl lg:text-4xl font-bold mb-8 tracking-wide bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            {t('home.hero.subtitle')}
          </p>

          {/* Memeya Activity Ticker */}
          {currentTickerEntry && (
            <div className="max-w-2xl mx-auto mb-8">
              <div className="flex items-center gap-3 bg-[#0D1117]/80 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 font-mono text-sm homepage-scanline">
                <img
                  src="/images/memeya-avatar.png"
                  alt="Memeya"
                  className="w-8 h-8 rounded-full ring-2 ring-green-500/30 flex-shrink-0"
                />
                <div className="flex items-center gap-2 min-w-0 overflow-hidden homepage-ticker-line" key={safeTickerIdx}>
                  <span className="text-green-500/70 flex-shrink-0">{'>'}</span>
                  <span className="text-gray-600 flex-shrink-0 hidden sm:inline">
                    [{toLocalHHMM(currentTickerEntry.time, workshop?.date)}]
                  </span>
                  <span className={`flex-shrink-0 text-xs font-bold ${tickerTag.color}`}>
                    {tickerTag.tag}
                  </span>
                  <span className="text-gray-400 truncate">{tickerText}</span>
                  <span className="text-green-500/70 homepage-ticker-cursor flex-shrink-0">&#9608;</span>
                </div>
              </div>
            </div>
          )}

          {/* Ecosystem block — voting + badges */}
          <div className="max-w-3xl mx-auto mb-8">
            <p className="text-lg md:text-xl text-gray-400 leading-relaxed mb-4">
              {t('home.hero.descLine1')}{' '}
              <button
                onClick={login}
                className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-4 decoration-cyan-400/30 hover:decoration-cyan-400/60 transition-colors cursor-pointer"
              >
                {t('home.hero.ctaSignIn')}
              </button>
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 flex-wrap gap-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-green-400">&#10003;</span>
                <span>{t('home.hero.noFees')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-cyan-400">&#10003;</span>
                <span>{t('home.hero.oneNFT')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-purple-400">&#10003;</span>
                <span>{t('home.hero.youOwn')}</span>
              </div>
            </div>
          </div>

          {/* Developer block — API */}
          <p className="text-lg md:text-xl text-gray-400 leading-relaxed max-w-3xl mx-auto mb-12">
            {t('home.hero.descLine2')}{' '}
            <a href="#gallery" className="text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-4 decoration-purple-400/30 hover:decoration-purple-400/60 transition-colors">
              {t('home.hero.browseGallery')}
            </a>
          </p>
        </div>

        {/* Featured Gallery */}
        {featuredMemes.length > 0 && (
          <div className="mb-20 md:mb-28">
            <div className="text-center mb-10">
              <h3 className="text-4xl md:text-5xl font-bold mb-4">{t('home.featured.title')}</h3>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                {t('home.featured.desc')}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
              {featuredMemes.map(meme => {
                const rarity = RARITY_COLORS[meme.finalRarity] || RARITY_COLORS.common;
                return (
                  <a
                    key={meme.id}
                    href="#gallery"
                    className="group relative bg-white/5 backdrop-blur-md rounded-xl overflow-hidden border border-white/10 hover:border-cyan-500/50 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-cyan-500/10"
                  >
                    {meme.isWinner && (
                      <div className="absolute top-2 right-2 z-10 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg">
                        #1
                      </div>
                    )}
                    <div className="aspect-square bg-gray-800 overflow-hidden">
                      <img
                        src={meme.imageUrl || meme.image}
                        alt={meme.title}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => {
                          e.target.src = `https://via.placeholder.com/300x300/1F2937/9CA3AF?text=${encodeURIComponent(meme.title || 'Meme')}`;
                        }}
                      />
                    </div>
                    <div className="p-2">
                      <h4 className="font-bold text-white text-xs truncate group-hover:text-cyan-300 transition-colors">
                        {meme.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                        <span>{'\u2764\uFE0F'} {meme.votes?.selection?.yes || 0}</span>
                        {meme.finalRarity && (
                          <span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: rarity.bg, color: rarity.color }}>
                            {meme.finalRarity}
                          </span>
                        )}
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>

            <div className="text-center mt-8">
              <a
                href="#gallery"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-cyan-500/50 rounded-xl text-gray-300 hover:text-white transition-all duration-200"
              >
                {t('home.featured.viewAll')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        )}

        {/* API Services */}
        <div className="mb-20 md:mb-28">
          <div className="text-center mb-10">
            <h3 className="text-4xl md:text-5xl font-bold mb-4">{t('home.api.title')}</h3>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              {t('home.api.desc')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
            {API_SERVICES.map(svc => (
              <div key={svc.key} className={`bg-white/5 border border-white/10 rounded-xl p-6 text-center hover:border-${svc.color}-500/50 transition-all duration-300`}>
                <p className="text-white font-semibold text-sm mb-2">{t(`lab.api.${svc.key}.name`)}</p>
                <p className="text-green-400 text-3xl font-bold mb-1">{svc.price}</p>
                <p className="text-gray-500 text-xs mb-3">USDC on Base</p>
                {svc.sla && <p className="text-gray-400 text-xs mb-2">SLA: {svc.sla}</p>}
                <p className="text-gray-400 text-xs">{t(`lab.api.${svc.key}.desc`)}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-6">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-gray-300 mb-6">
              {t('home.api.protocol')}
            </span>
          </div>

          <div className="text-center">
            <a
              href="#lab"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all duration-200"
            >
              {t('home.api.cta')}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>

        {/* Daily Loop — How It Works */}
        <div className="mb-20 md:mb-28">
          <div className="text-center mb-12">
            <h3 className="text-4xl md:text-5xl font-bold mb-4">{t('home.howItWorks.title')}</h3>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              {t('home.howItWorks.desc')}
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <img
              src="/images/how-it-works.jpg"
              alt="How It Works: 1. AI Creates 3 memes, 2. You Vote for your favorite, 3. Daily Winner selected, 4. Claim as Solana NFT"
              className="hidden md:block w-full rounded-2xl"
              loading="lazy"
            />
            <img
              src="/images/how-it-works-mobile.jpg"
              alt="How It Works: 1. AI Creates 3 memes, 2. You Vote for your favorite, 3. Daily Winner selected, 4. Claim as Solana NFT"
              className="md:hidden w-full max-w-sm mx-auto rounded-2xl"
              loading="lazy"
            />
          </div>
        </div>

        {/* $Memeya Token Banner */}
        <div className="mb-20 md:mb-28">
          <div className="max-w-3xl mx-auto bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-yellow-500/10 border border-yellow-500/30 rounded-2xl p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 animate-pulse" />
            <div className="relative z-10">
              <div className="text-4xl mb-3">&#129689;</div>
              <h3 className="text-2xl md:text-3xl font-bold mb-2">
                <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">$Memeya</span>
                <span className="text-white"> {t('home.memeya.officialToken')}</span>
              </h3>
              <p className="text-gray-400 mb-6 max-w-xl mx-auto">{t('home.memeya.holdBonus')}</p>

              {/* CA Display */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <code className="text-sm md:text-base font-mono text-yellow-300 bg-black/30 px-4 py-2 rounded-lg border border-yellow-500/20 truncate max-w-[280px] md:max-w-none">
                  {MEMEYA_TOKEN_CA}
                </code>
                <button
                  onClick={copyCA}
                  className="px-3 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 hover:bg-yellow-500/30 transition-colors text-sm font-medium flex-shrink-0"
                >
                  {caCopied ? t('common.copied') : t('common.copy')}
                </button>
              </div>

              <a
                href={`https://pump.fun/coin/${MEMEYA_TOKEN_CA}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold rounded-xl transition-all duration-200"
              >
                {t('home.memeya.buyOnPumpFun')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-white/10 rounded-3xl p-10 md:p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 animate-pulse" />
          <div className="relative z-10">
            <div className="inline-flex items-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-ping" />
              <span className="text-green-400 font-medium">{t('home.cta.liveNow')}</span>
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-4">{t('home.cta.title')}</h3>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto text-base md:text-lg">
              {t('home.cta.desc')}
            </p>
            <div className="space-y-4">
              <WalletConnection variant="primary" className="px-12 py-4 text-xl font-bold" />

              {/* Live stats */}
              <div className="flex items-center justify-center space-x-6 md:space-x-8 text-sm text-gray-500 flex-wrap gap-y-2 mt-6">
                {weeklyVoters > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-cyan-400 font-bold">{weeklyVoters}</span>
                    <span>{t('home.cta.votersThisWeek')}</span>
                  </div>
                )}
                {totalMemes > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-purple-400 font-bold">{totalMemes}</span>
                    <span>{t('home.cta.memesCreated')}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <span className="text-green-400 font-bold">365/yr</span>
                  <span>{t('home.cta.maxNFTs')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ticker animations */}
      <style>{`
        .homepage-ticker-line {
          animation: hpTickerFadeIn 0.6s ease-out;
        }
        @keyframes hpTickerFadeIn {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .homepage-ticker-cursor {
          animation: hpTickerBlink 1s step-end infinite;
        }
        @keyframes hpTickerBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .homepage-scanline {
          position: relative;
        }
        .homepage-scanline::after {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent 0px, transparent 1px,
            rgba(255,255,255,0.015) 1px, rgba(255,255,255,0.015) 2px
          );
          pointer-events: none;
          border-radius: inherit;
        }
      `}</style>
    </div>
  );
};

export default HomePage;
