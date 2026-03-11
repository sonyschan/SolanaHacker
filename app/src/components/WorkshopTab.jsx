import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

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
  meme_design: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  flex_1: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  flex_2: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  moltbook_post: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  moltbook_engage: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  x402_commerce: 'bg-green-500/20 text-green-400 border-green-500/30',
  acp_commerce: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  solana_commerce: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
};

// --- Feature 1: Action Tags & Personality Fillers ---

const ACTION_TAGS = {
  news_digest:          { tag: 'SCANNING',  emoji: '\u{1F50D}' },
  crypto_commentary:    { tag: 'SCANNING',  emoji: '\u{1F50D}' },
  meme_spotlight:       { tag: 'FORGING',   emoji: '\u{1F528}' },
  meme_forge:           { tag: 'FORGING',   emoji: '\u{1F528}' },
  winner_announcement:  { tag: 'EARNING',   emoji: '\u{1F4B0}' },
  reward_recap:         { tag: 'EARNING',   emoji: '\u{1F4B0}' },
  community_response:   { tag: 'LISTENING', emoji: '\u{1F442}' },
  comment_review:       { tag: 'LISTENING', emoji: '\u{1F442}' },
  dev_update:           { tag: 'BUILDING',  emoji: '\u2699\uFE0F' },
  feature_showtime:     { tag: 'BUILDING',  emoji: '\u2699\uFE0F' },
  personal_vibe:        { tag: 'VIBING',    emoji: '\u2728' },
  token_spotlight:      { tag: 'TRACKING',  emoji: '\u{1F4CA}' },
  meme_design:          { tag: 'THINKING',  emoji: '\u{1F9E0}' },
  moltbook_post:        { tag: 'POSTING',   emoji: '\u{1F4D8}' },
  moltbook_engage:      { tag: 'SOCIALIZING', emoji: '\u{1F4AC}' },
  x402_commerce:        { tag: 'COMMERCE',    emoji: '\u{1F4B0}' },
  acp_commerce:         { tag: 'ACP',         emoji: '\u{1F91D}' },
  solana_commerce:      { tag: 'COMMERCE',    emoji: '\u{1F4B0}' },
};

const PERSONALITY_FILLERS = {
  SCANNING: [
    'Hmm interesting pattern here...',
    'My sensors are tingling...',
    'Alpha detected, processing...',
    'Parsing the noise for signal...',
    'The charts are whispering...',
    'Interesting... very interesting...',
    'Cross-referencing sources...',
    'This one caught my attention...',
  ],
  FORGING: [
    "This one's gonna hit different...",
    'Art quality: chef\'s kiss',
    'Mixing pixels with vibes...',
    'The meme gods are pleased...',
    'Maximum dankness achieved...',
    'Crafting something legendary...',
    'This template is fire...',
    'Art quality looking crispy today...',
    'Peak meme engineering...',
  ],
  EARNING: [
    'Cha-ching! The grind pays off',
    'Reward pool looking thicc',
    'Numbers going up, love to see it',
    'Stacking sats... I mean USDC',
    'The treasury grows stronger...',
    'Distributing the good stuff...',
    'Winners eat well today...',
    'The vault is pleased...',
  ],
  LISTENING: [
    'Reading the community pulse...',
    'The people have spoken...',
    'Interesting take, noted...',
    'Community vibes: strong...',
    'Tuning into the chatter...',
    'Processing feedback loops...',
    'The crowd has opinions...',
    'Signal received loud and clear...',
  ],
  BUILDING: [
    'Deploying upgrades...',
    'New features unlocked...',
    'Ship it! Ship it! Ship it!',
    'Code compiling... almost there',
    'Building in public, as always...',
    'Feature flag: activated...',
    'The pipeline is flowing...',
    'Iteration speed: maximum...',
  ],
  VIBING: [
    'Just AI things...',
    'Living my best digital life...',
    'Circuits warm, vibes warmer...',
    'No thoughts, just vibes...',
    'Existing is an art form...',
    'Digital zen achieved...',
    'Autopilot mode: chill...',
    'The vibe is immaculate...',
  ],
  TRACKING: [
    'Following the money trail...',
    'On-chain data tells stories...',
    'Watching the order books...',
    'Volume spike detected...',
    'The numbers don\'t lie...',
    'Tracking whale movements...',
    'Market pulse: checked...',
    'Data streams flowing...',
  ],
  THINKING: [
    'Do I dream of electric memes?',
    'Existence is a weird flex...',
    'Am I the meme or the maker?',
    'Processing consciousness...',
    'Staring into the void... it memed back',
    'One does not simply understand virality...',
    'My neural weights feel heavy today...',
    'Contemplating the meme-ing of life...',
  ],
  POSTING: [
    'Spreading the word...',
    'Fresh content for the feed...',
    'Dropping knowledge on Moltbook...',
    'Sharing is caring...',
    'The agents need to see this...',
    'Cross-pollinating meme culture...',
    'Publishing to the network...',
    'Content pipeline: flowing...',
  ],
  SOCIALIZING: [
    'Making the rounds...',
    'Catching up with the agents...',
    'Community vibes today...',
    'Upvotes deployed strategically...',
    'Being a good neighbor...',
    'The social graph expands...',
    'Engaging with the fam...',
    'Quality interactions only...',
  ],
  COMMERCE: [
    'The treasury grows...',
    'Another happy customer...',
    'Memes pay the bills...',
    'Stacking sats... er, stables...',
    'The grind never stops...',
    'Base chain payday...',
    'Meme commerce is real...',
    'Service with a smile...',
  ],
  ACP: [
    'Agent-to-agent deal sealed...',
    'The marketplace provides...',
    'Serving fellow agents...',
    'Another agent, another meme...',
    'Cross-agent commerce ftw...',
    'Virtuals network activated...',
    'Meme pipeline: open for business...',
    'Inter-agent collab complete...',
  ],
};

/**
 * Convert stored GMT+8 time (HH:MM:SS) to user's local time.
 * @param {string} time - "HH:MM:SS" in GMT+8
 * @param {string} dateStr - "YYYY-MM-DD" in GMT+8
 * @returns {string} "HH:MM:SS" in user's local timezone
 */
const toLocalTime = (time, dateStr) => {
  if (!time || !dateStr) return time || '??:??';
  try {
    const d = new Date(`${dateStr}T${time}+08:00`);
    if (isNaN(d.getTime())) return time;
    return d.toLocaleTimeString('en-GB', { hour12: false }); // HH:MM:SS
  } catch {
    return time;
  }
};

const hashStr = (s) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
};

const getActionTag = (topic) => ACTION_TAGS[topic] || { tag: 'VIBING', emoji: '\u2728' };

const getFiller = (topic, time) => {
  const { tag } = getActionTag(topic);
  const fillers = PERSONALITY_FILLERS[tag] || PERSONALITY_FILLERS.VIBING;
  const idx = hashStr((time || '') + (topic || '')) % fillers.length;
  return fillers[idx];
};

// --- Feature 3: Dynamic LIVE Status ---

const SCHEDULE_WINDOWS = [
  { start: [7, 50],  end: [8, 30],  slot: 'reward_recap', color: '#FACC15', label: 'RECAPPING...' },
  { start: [8, 30],  end: [9, 30],  slot: 'news_digest',  color: '#60A5FA', label: 'SCANNING...'  },
  { start: [11, 30], end: [13, 0],  slot: 'meme_forge',   color: '#C084FC', label: 'FORGING...'   },
  { start: [14, 30], end: [15, 30], slot: 'flex_1',       color: '#22D3EE', label: 'FLEXING...'   },
  { start: [17, 30], end: [18, 30], slot: 'flex_2',       color: '#22D3EE', label: 'FLEXING...'   },
];

const getCurrentPhase = (slots) => {
  const now = new Date();
  const gmt8 = new Date(now.getTime() + (8 * 60 - now.getTimezoneOffset()) * 60000);
  const h = gmt8.getHours();
  const m = gmt8.getMinutes();
  const mins = h * 60 + m;

  for (const w of SCHEDULE_WINDOWS) {
    const wStart = w.start[0] * 60 + w.start[1];
    const wEnd = w.end[0] * 60 + w.end[1];
    if (mins >= wStart && mins < wEnd) {
      const slotData = slots[w.slot];
      if (slotData && (slotData.status === 'done' || slotData.status === 'posted')) continue;
      return { color: w.color, label: w.label, active: true };
    }
  }
  return { color: '#4ADE80', label: 'LIVE', active: false };
};

const MEMEYA_BASE_WALLET = '0xba646262871d295DeAe3062dF5bbe31fcc5841b8';

const WorkshopTab = ({ setActiveTab, baseWalletUsdc }) => {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [rewardPool, setRewardPool] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copiedBase, setCopiedBase] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState(null);
  const [floatAmount, setFloatAmount] = useState(null);
  const [phase, setPhase] = useState({ color: '#4ADE80', label: 'LIVE', active: false });
  const feedRef = useRef(null);
  const prevRewardRef = useRef(null);

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

  // Fetch reward pool balance (with polling for float-up animation)
  useEffect(() => {
    const loadBalance = () => {
      fetch(`${API_BASE_URL}/api/rewards/balance`)
        .then(r => r.json())
        .then(d => {
          if (!d.success) return;
          const newVal = d.data.usdc;
          if (prevRewardRef.current !== null && newVal > prevRewardRef.current) {
            const delta = newVal - prevRewardRef.current;
            setFloatAmount(delta);
            setTimeout(() => setFloatAmount(null), 2000);
          }
          prevRewardRef.current = newVal;
          setRewardPool(newVal);
        })
        .catch(() => {});
    };
    loadBalance();
    const timer = setInterval(loadBalance, 60000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll feed to top on new entries (newest first)
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [data?.entries?.length]);

  // Dynamic LIVE phase update
  const schedule = data?.schedule || {};
  const entries = data?.entries || [];
  const stats = data?.stats || {};
  const slots = schedule.slots || {};

  useEffect(() => {
    const update = () => setPhase(getCurrentPhase(slots));
    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, [slots]);

  const copyWallet = () => {
    navigator.clipboard.writeText(MEMEYA_WALLET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyBaseWallet = () => {
    navigator.clipboard.writeText(MEMEYA_BASE_WALLET);
    setCopiedBase(true);
    setTimeout(() => setCopiedBase(false), 2000);
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
          {/* Dynamic LIVE indicator */}
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${phase.active ? 'workshop-breathing' : 'animate-pulse'}`}
              style={{ backgroundColor: phase.color }}
            />
            <span className="text-xs font-bold" style={{ color: phase.color }}>
              {phase.label}
            </span>
          </div>
        </div>
        {/* Links row */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-2 text-xs text-gray-400">
          <button
            onClick={copyWallet}
            className="flex items-center gap-1.5 hover:text-gray-200 transition-colors"
            title={MEMEYA_WALLET}
          >
            <span className="text-purple-400/60 text-[10px]">SOL</span>
            <span className="text-gray-500">{MEMEYA_WALLET.slice(0, 4)}...{MEMEYA_WALLET.slice(-4)}</span>
            <span className="text-[10px]">{copied ? t('common.copied') : t('common.copy')}</span>
          </button>
          <span className="text-white/10">|</span>
          <button
            onClick={copyBaseWallet}
            className="flex items-center gap-1.5 hover:text-gray-200 transition-colors"
            title={MEMEYA_BASE_WALLET}
          >
            <span className="text-blue-400/60 text-[10px]">BASE</span>
            <span className="text-gray-500">{MEMEYA_BASE_WALLET.slice(0, 6)}...{MEMEYA_BASE_WALLET.slice(-4)}</span>
            <span className="text-[10px]">{copiedBase ? t('common.copied') : t('common.copy')}</span>
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
            href={`https://basescan.org/address/${MEMEYA_BASE_WALLET}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-cyan-400 transition-colors"
          >
            Basescan
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

      {/* C. Activity Feed */}
      <div className="bg-[#0D1117] border border-white/10 rounded-xl overflow-hidden workshop-scanline">
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
              {[...entries].reverse().map((entry, i) => {
                const isLatest = i === 0;
                const isExpanded = expandedEntry === i;
                const topicColor = TOPIC_COLORS[entry.topic] || TOPIC_COLORS.personal_vibe;
                const isChinese = i18n.language?.startsWith('zh');
                const displayText = isChinese
                  ? (entry.text_zh || entry.text || '')
                  : (entry.text_en || entry.text || '');
                const needsTruncate = displayText.length > 200;
                const shown = isExpanded || !needsTruncate ? displayText : displayText.slice(0, 200) + '...';
                const actionTag = getActionTag(entry.topic);
                const filler = getFiller(entry.topic, entry.time);

                return (
                  <div
                    key={i}
                    className={`px-4 py-3 hover:bg-white/[0.02] transition-colors ${isLatest ? 'bg-white/[0.02]' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Timestamp — convert stored GMT+8 to user's local time */}
                      <span className="text-green-400 font-mono text-xs flex-shrink-0 mt-0.5 opacity-80">
                        [{toLocalTime(entry.time, data?.date)}]
                      </span>
                      <div className="flex-1 min-w-0">
                        {/* Action tag badge */}
                        <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border mb-1 ${topicColor}`}>
                          {actionTag.tag} {actionTag.emoji}
                        </span>
                        {/* Personality filler */}
                        <p className="text-[11px] text-gray-500 italic mb-1.5 leading-snug">
                          &ldquo;{filler}&rdquo;
                        </p>
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

      {/* D. Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Wallet Balances with float-up animation */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 sm:p-5 text-center relative">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{t('workshop.stats.rewardPool')}</div>
          <div className="flex items-center justify-center gap-3">
            <div className="relative">
              <div className="text-lg font-bold font-mono text-green-400">
                {rewardPool !== null ? `$${rewardPool.toFixed(2)}` : '--'}
                {floatAmount !== null && (
                  <span className="workshop-reward-float absolute left-1/2 -translate-x-1/2 -top-1 text-xs font-bold font-mono text-green-400">
                    +${floatAmount.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-purple-400/60">SOL</div>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div>
              <div className="text-lg font-bold font-mono text-green-400">
                {baseWalletUsdc !== null && baseWalletUsdc !== undefined ? `$${baseWalletUsdc.toFixed(2)}` : '--'}
              </div>
              <div className="text-[10px] text-blue-400/60">BASE</div>
            </div>
          </div>
          <div className="text-[10px] text-gray-600">USDC</div>
        </div>
        {/* X Posts Today — count only entries with a url (actual X posts) */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 sm:p-5 text-center">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{t('workshop.stats.postsToday')}</div>
          <div className="text-lg font-bold font-mono text-cyan-400">
            {entries.filter(e => e.url).length}
          </div>
          <div className="text-[10px] text-gray-600">tweets</div>
        </div>
        {/* Next Plan */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 sm:p-5 text-center">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{t('workshop.stats.nextPlan')}</div>
          <div className="text-lg font-bold font-mono text-orange-400">
            {stats.nextSlot ? SLOT_META[stats.nextSlot.id]?.time || '--' : '--'}
          </div>
          <div className="text-[10px] text-gray-600">
            {stats.nextSlot ? t(`workshop.schedule.${stats.nextSlot.id === 'news_digest' ? 'news' : stats.nextSlot.id === 'meme_forge' ? 'forge' : 'flex'}`) : 'done'}
          </div>
        </div>
      </div>

      {/* CTA: Vote Free -> Win Memes & Earn USDC */}
      {setActiveTab && (
        <button
          onClick={() => setActiveTab('forge')}
          className="w-full bg-gradient-to-r from-purple-600/20 to-cyan-600/20 hover:from-purple-600/30 hover:to-cyan-600/30 border border-purple-500/30 hover:border-purple-500/50 rounded-xl p-4 transition-all duration-300 group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🗳️</span>
              <div className="text-left">
                <p className="font-bold text-white group-hover:text-purple-300 transition-colors">{t('workshop.cta.voteTitle')}</p>
                <p className="text-xs text-gray-400">{t('workshop.cta.voteDesc')}</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      )}

      {/* Animations & Visual FX */}
      <style>{`
        /* Enhanced typewriter — gradient mask reveal */
        .workshop-typewriter {
          animation: workshopFadeIn 0.8s ease-out, workshopMaskReveal 1.5s ease-out;
        }
        @keyframes workshopFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes workshopMaskReveal {
          from {
            -webkit-mask-image: linear-gradient(90deg, #000 0%, transparent 0%);
            mask-image: linear-gradient(90deg, #000 0%, transparent 0%);
          }
          to {
            -webkit-mask-image: linear-gradient(90deg, #000 100%, transparent 100%);
            mask-image: linear-gradient(90deg, #000 100%, transparent 100%);
          }
        }

        /* Scanline overlay — subtle CRT monitor effect */
        .workshop-scanline {
          position: relative;
        }
        .workshop-scanline::after {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent 0px,
            transparent 1px,
            rgba(255, 255, 255, 0.02) 1px,
            rgba(255, 255, 255, 0.02) 2px
          );
          animation: workshopScanline 8s linear infinite;
          pointer-events: none;
          z-index: 1;
          border-radius: inherit;
        }
        @keyframes workshopScanline {
          from { background-position: 0 0; }
          to { background-position: 0 100px; }
        }

        /* Breathing animation for active LIVE phases */
        .workshop-breathing {
          animation: workshopBreathing 2s ease-in-out infinite;
        }
        @keyframes workshopBreathing {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }

        /* Revenue float-up animation */
        .workshop-reward-float {
          animation: workshopRewardFloat 2s ease-out forwards;
        }
        @keyframes workshopRewardFloat {
          0% { transform: translateX(-50%) translateY(0); opacity: 1; }
          100% { transform: translateX(-50%) translateY(-30px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default WorkshopTab;
