import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://memeforge-api-836651762884.asia-southeast1.run.app';

const MEMEYA_WALLET = '4BqywEbjMf4APFBw1spPFr11q21Uu5A1fHpCRM2zSbMP';

const SLOT_META = {
  reward_recap: { time: '08:00', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  news_digest:  { time: '09:00', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  meme_forge:   { time: '12:00', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  flex_1:       { time: '15:00', color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  flex_2:       { time: '18:00', color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
};

const TOPIC_COLORS = {
  news_digest: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  meme_spotlight: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  meme_forge: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  winner_announcement: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  reward_recap: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  community_response: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  comment_review: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  personal_vibe: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  crypto_commentary: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  dev_update: 'bg-green-500/20 text-green-400 border-green-500/30',
  feature_showtime: 'bg-green-500/20 text-green-400 border-green-500/30',
  token_spotlight: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  flex_1: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  flex_2: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
};

const WorkshopTab = () => {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [rewardPool, setRewardPool] = useState(null);
  const [copied, setCopied] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState(null);
  const feedRef = useRef(null);

  // Fetch workshop data
  useEffect(() => {
    const load = () => {
      fetch(`${API_BASE_URL}/api/memeya/workshop`)
        .then(r => r.json())
        .then(setData)
        .catch(() => {});
    };
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch reward pool balance
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/rewards/balance`)
      .then(r => r.json())
      .then(d => { if (d.success) setRewardPool(d.data.usdc); })
      .catch(() => {});
  }, []);

  // Auto-scroll feed to bottom on new entries
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [data?.entries?.length]);

  const schedule = data?.schedule || {};
  const entries = data?.entries || [];
  const stats = data?.stats || {};
  const slots = schedule.slots || {};

  const copyWallet = () => {
    navigator.clipboard.writeText(MEMEYA_WALLET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSlotStatus = (slotId, slot) => {
    if (!slot) return 'pending';
    return slot.status || 'pending';
  };

  const StatusDot = ({ status }) => {
    switch (status) {
      case 'done':
      case 'posted':
        return <span className="text-green-400 text-xs">&#10003;</span>;
      case 'pending':
        return <span className="w-2.5 h-2.5 rounded-full bg-gray-500/50 border border-gray-500/50 inline-block" />;
      case 'next':
      case 'ready':
        return <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block animate-pulse" />;
      case 'missed':
        return <span className="text-red-400/50 text-xs">&#10007;</span>;
      case 'skipped':
        return <span className="text-gray-500 text-xs">&mdash;</span>;
      case 'external':
        return <span className="text-yellow-400 text-xs">&#10003;</span>;
      default:
        return <span className="w-2.5 h-2.5 rounded-full bg-gray-600 inline-block" />;
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">

      {/* A. Terminal Header Bar */}
      <div className="bg-[#0D1117] border border-white/10 rounded-xl overflow-hidden font-mono">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <img src="/images/memeya-avatar.png" alt="Memeya" className="w-6 h-6 rounded-full" />
            <span className="text-sm text-gray-300 font-bold">{t('workshop.terminal.title')}</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full border border-cyan-500/30">{t('workshop.terminal.version')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400">{t('workshop.terminal.live')}</span>
          </div>
        </div>
        {/* Links row */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-2 text-xs text-gray-400">
          <button
            onClick={copyWallet}
            className="flex items-center gap-1.5 hover:text-gray-200 transition-colors"
            title={MEMEYA_WALLET}
          >
            <span className="text-gray-500">{MEMEYA_WALLET.slice(0, 4)}...{MEMEYA_WALLET.slice(-4)}</span>
            <span className="text-[10px]">{copied ? t('common.copied') : t('common.copy')}</span>
          </button>
          <span className="text-white/10">|</span>
          <a
            href={`https://solscan.io/account/${MEMEYA_WALLET}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-cyan-400 transition-colors"
          >
            Solscan
          </a>
          <span className="text-white/10">|</span>
          <a
            href="https://x.com/AiMemeForgeIO"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-cyan-400 transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            @AiMemeForgeIO
          </a>
        </div>
      </div>

      {/* B. Today's Schedule — Slot Timeline */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 md:p-5">
        <h3 className="text-sm font-bold text-gray-300 mb-4">{t('workshop.schedule.title')}</h3>
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-1">
          {Object.entries(SLOT_META).map(([slotId, meta], i, arr) => {
            const slot = slots[slotId];
            const status = getSlotStatus(slotId, slot);
            const label = t(`workshop.schedule.${slotId === 'reward_recap' ? 'recap' : slotId === 'news_digest' ? 'news' : slotId === 'meme_forge' ? 'forge' : 'flex'}`);
            return (
              <React.Fragment key={slotId}>
                <div className="flex flex-col items-center min-w-[60px] flex-shrink-0">
                  <StatusDot status={status} />
                  <span className={`text-[10px] mt-1.5 font-medium ${meta.color}`}>{meta.time}</span>
                  <span className="text-[10px] text-gray-500 mt-0.5">{label}</span>
                </div>
                {i < arr.length - 1 && (
                  <div className="flex-1 min-w-[16px] h-px bg-white/10 mt-[-12px]" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* C. Activity Feed */}
      <div className="bg-[#0D1117] border border-white/10 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <h3 className="text-sm font-bold text-gray-300 font-mono">{t('workshop.feed.title')}</h3>
          {entries.length > 0 && (
            <span className="text-[10px] text-gray-500 font-mono">{entries.length} entries</span>
          )}
        </div>
        <div
          ref={feedRef}
          className="max-h-[400px] overflow-y-auto"
          style={{ scrollBehavior: 'smooth' }}
        >
          {entries.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <div className="text-3xl mb-3 opacity-40">&#9881;</div>
              <p className="text-sm text-gray-500 font-mono">{t('workshop.feed.empty')}</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {entries.map((entry, i) => {
                const isLatest = i === entries.length - 1;
                const isExpanded = expandedEntry === i;
                const topicColor = TOPIC_COLORS[entry.topic] || TOPIC_COLORS.personal_vibe;
                const displayText = entry.text || '';
                const needsTruncate = displayText.length > 200;
                const shown = isExpanded || !needsTruncate ? displayText : displayText.slice(0, 200) + '...';

                return (
                  <div
                    key={i}
                    className={`px-4 py-3 hover:bg-white/[0.02] transition-colors ${isLatest ? 'bg-white/[0.02]' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Timestamp */}
                      <span className="text-green-400 font-mono text-xs flex-shrink-0 mt-0.5 opacity-80">
                        [{entry.time || '??:??'}]
                      </span>
                      <div className="flex-1 min-w-0">
                        {/* Topic badge */}
                        <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border mb-1.5 ${topicColor}`}>
                          {entry.topic || 'other'}
                        </span>
                        {/* Content */}
                        <p className={`text-sm text-gray-300 leading-relaxed break-words ${isLatest ? 'workshop-typewriter' : ''}`}>
                          {shown}
                        </p>
                        {needsTruncate && (
                          <button
                            onClick={() => setExpandedEntry(isExpanded ? null : i)}
                            className="text-[10px] text-cyan-400 hover:text-cyan-300 mt-1"
                          >
                            {isExpanded ? 'less' : 'more'}
                          </button>
                        )}
                        {/* X link */}
                        {entry.url && (
                          <a
                            href={entry.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-gray-500 hover:text-cyan-400 mt-1.5 transition-colors"
                          >
                            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                            View on X
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* D. Stats Footer */}
      <div className="grid grid-cols-3 gap-3">
        {/* Reward Pool */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 text-center">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{t('workshop.stats.rewardPool')}</div>
          <div className="text-lg font-bold text-green-400">
            {rewardPool !== null ? `$${rewardPool.toFixed(0)}` : '--'}
          </div>
          <div className="text-[10px] text-gray-600">USDC</div>
        </div>
        {/* Posts Today */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 text-center">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{t('workshop.stats.postsToday')}</div>
          <div className="text-lg font-bold text-cyan-400">
            {stats.postsToday || entries.length || 0}
          </div>
          <div className="text-[10px] text-gray-600">tweets</div>
        </div>
        {/* Next Slot */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 text-center">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{t('workshop.stats.nextSlot')}</div>
          <div className="text-lg font-bold text-orange-400">
            {stats.nextSlot ? SLOT_META[stats.nextSlot.id]?.time || '--' : '--'}
          </div>
          <div className="text-[10px] text-gray-600">
            {stats.nextSlot ? t(`workshop.schedule.${stats.nextSlot.id === 'news_digest' ? 'news' : stats.nextSlot.id === 'meme_forge' ? 'forge' : 'flex'}`) : 'done'}
          </div>
        </div>
      </div>

      {/* Typewriter animation */}
      <style>{`
        .workshop-typewriter {
          animation: workshopFadeIn 0.8s ease-out;
        }
        @keyframes workshopFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default WorkshopTab;
