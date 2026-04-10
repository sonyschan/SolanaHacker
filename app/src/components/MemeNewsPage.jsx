import React, { useState, useEffect, useRef } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://memeforge-api-836651762884.asia-southeast1.run.app';

const JUDGE_CONFIG = {
  chatgpt: { name: 'GPT-4o', color: '#10a37f', icon: '◆' },
  gemini:  { name: 'Gemini', color: '#4285f4', icon: '◆' },
  grok:    { name: 'Grok',   color: '#f97316', icon: '◆' },
};

function MemeNewsPage() {
  const [todayMemes, setTodayMemes] = useState([]);
  const [pastDays, setPastDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeme, setSelectedMeme] = useState(null);

  useEffect(() => { fetchMemes(); }, []);

  async function fetchMemes() {
    setLoading(true);
    try {
      const [todayRes, hallRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/memes/today`),
        fetch(`${API_BASE_URL}/api/memes/hall-of-memes?days=5&limit=30`)
      ]);
      const todayData = await todayRes.json();
      setTodayMemes(todayData.memes || []);

      const hallData = await hallRes.json();
      const todayDate = new Date(Date.now() + 8 * 3600000).toISOString().split('T')[0];
      const byDate = {};
      for (const m of (hallData.memes || [])) {
        const d = (m.generatedAt || '').split('T')[0];
        if (d && d !== todayDate && m.type === 'daily') {
          if (!byDate[d]) byDate[d] = [];
          byDate[d].push(m);
        }
      }
      setPastDays(
        Object.entries(byDate).sort(([a], [b]) => b.localeCompare(a)).slice(0, 3).map(([date, memes]) => ({ date, memes }))
      );
    } catch (err) {
      console.error('Failed to fetch memes:', err);
    } finally {
      setLoading(false);
    }
  }

  const winner = todayMemes.find(m => m.isWinner || m.status === 'winner');
  const runners = todayMemes.filter(m => m !== winner);
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Source+Serif+4:opsz,wght@8..60,300;8..60,400;8..60,600&family=JetBrains+Mono:wght@400;600&display=swap');
        .mn-page { font-family: 'Source Serif 4', Georgia, serif; background: #0a0a0b; color: #e8e4df; font-size: 17px; line-height: 1.65; }
        .mn-display { font-family: 'Playfair Display', Georgia, serif; }
        .mn-mono { font-family: 'JetBrains Mono', monospace; }
        .mn-rule { border-top: 1px solid rgba(255,255,255,0.08); }
        .mn-rule-thick { border-top: 3px double rgba(255,255,255,0.15); }
        .mn-rule-gold { border-top: 2px solid rgba(234,179,8,0.3); }
        .mn-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .mn-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
        .mn-img-hover { transition: transform 0.4s ease; }
        .mn-card:hover .mn-img-hover { transform: scale(1.03); }
        .mn-score-pill { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 5px; font-size: 13px; letter-spacing: 0.5px; }
        .mn-fade-in { animation: mnFadeIn 0.6s ease both; }
        .mn-fade-in-delay-1 { animation-delay: 0.1s; }
        .mn-fade-in-delay-2 { animation-delay: 0.2s; }
        .mn-fade-in-delay-3 { animation-delay: 0.3s; }
        @keyframes mnFadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .mn-dim-bar { height: 4px; border-radius: 2px; background: rgba(255,255,255,0.06); overflow: hidden; }
        .mn-dim-fill { height: 100%; border-radius: 2px; transition: width 0.8s ease; }
      `}</style>

      <div className="mn-page min-h-screen">
        {/* Masthead */}
        <header className="mn-rule-thick pt-4 pb-3 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="mn-display text-4xl md:text-5xl font-black tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                  MemeNews
                </h1>
                <p className="text-xs mt-0.5" style={{ color: '#6b6560', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                  AI-Generated · AI-Judged · Daily
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: '#6b6560' }}>{todayStr}</p>
                <a href="#archive" className="text-xs hover:underline" style={{ color: '#8b8580' }}>
                  Archive →
                </a>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 pb-16">
          {/* Loading */}
          {loading && (
            <div className="py-32 text-center">
              <div className="mn-display text-lg italic" style={{ color: '#4a4540' }}>Loading today's edition...</div>
            </div>
          )}

          {/* ══ TODAY'S MEMENEWS ══ */}
          {!loading && todayMemes.length > 0 && (
            <div className="mn-fade-in">
              {/* Section label */}
              <div className="mn-rule mt-6 pt-3 mb-6">
                <span className="mn-mono text-xs uppercase tracking-[0.2em]" style={{ color: '#5a5550' }}>
                  Today's Edition
                </span>
              </div>

              {/* Winner hero */}
              {winner && (
                <div className="mn-fade-in cursor-pointer mn-card rounded-xl overflow-hidden mb-8"
                     style={{ background: 'linear-gradient(135deg, rgba(234,179,8,0.04) 0%, rgba(0,0,0,0) 60%)' }}
                     onClick={() => setSelectedMeme(winner)}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                    {/* Image */}
                    <div className="overflow-hidden aspect-square lg:aspect-auto">
                      <img src={resolveImageUrl(winner.imageUrl)} alt={winner.title}
                           className="mn-img-hover w-full h-full object-cover" />
                    </div>

                    {/* Content */}
                    <div className="p-6 lg:p-8 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="mn-mono text-xs uppercase tracking-[0.15em] px-2 py-0.5 rounded"
                              style={{ background: 'rgba(234,179,8,0.15)', color: '#eab308', border: '1px solid rgba(234,179,8,0.2)' }}>
                          Meme of the Day
                        </span>
                        {winner.aiJudging && (
                          <span className="mn-mono text-xs px-2 py-0.5 rounded"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <span style={{ color: '#eab308', fontWeight: 700 }}>{winner.aiJudging.averageTotal?.toFixed(1)}</span>
                            <span style={{ color: '#4a4540' }}>/30</span>
                          </span>
                        )}
                      </div>

                      <h2 className="mn-display text-3xl md:text-4xl font-bold mb-3" style={{ lineHeight: 1.15, color: '#f5f0eb' }}>
                        {winner.title}
                      </h2>

                      {(winner.newsSource || winner.metadata?.originalNews) && (
                        <p className="text-base mb-4" style={{ color: '#8b8580', lineHeight: 1.5 }}>
                          {winner.newsSource || winner.metadata?.originalNews}
                        </p>
                      )}

                      <p className="text-base mb-5" style={{ color: '#a09890', lineHeight: 1.6 }}>
                        {winner.description}
                      </p>

                      {/* AI Judges */}
                      {winner.aiJudging?.judges && (
                        <div className="mn-rule pt-4">
                          <p className="mn-mono text-xs uppercase tracking-[0.2em] mb-3" style={{ color: '#5a5550' }}>
                            AI Judge Panel
                          </p>
                          <JudgeScoresRow judges={winner.aiJudging.judges} />
                          {winner.aiJudging.dimensionAverages && (
                            <DimensionBars dims={winner.aiJudging.dimensionAverages} className="mt-4" />
                          )}
                        </div>
                      )}

                      {/* Share button */}
                      <ShareToXButton meme={winner} className="mt-5" />
                    </div>
                  </div>
                </div>
              )}

              {/* Runner-ups */}
              {runners.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {runners.map((meme, i) => (
                    <div key={meme.id}
                         className={`mn-card mn-fade-in mn-fade-in-delay-${i + 1} cursor-pointer rounded-lg overflow-hidden border`}
                         style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
                         onClick={() => setSelectedMeme(meme)}>
                      <div className="flex gap-0">
                        <div className="relative w-32 md:w-40 flex-shrink-0 overflow-hidden">
                          <img src={resolveImageUrl(meme.imageUrl)} alt={meme.title}
                               className="mn-img-hover w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 p-4">
                          <h3 className="mn-display font-bold text-base mb-1" style={{ color: '#d5d0cb' }}>
                            {meme.title}
                          </h3>
                          {(meme.newsSource || meme.metadata?.originalNews) && (
                            <p className="text-xs mb-2 line-clamp-1" style={{ color: '#6b6560' }}>
                              {meme.newsSource || meme.metadata?.originalNews}
                            </p>
                          )}
                          {meme.aiJudging?.judges && (
                            <JudgeScoresInline judges={meme.aiJudging.judges} avg={meme.aiJudging.averageTotal} />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No winner yet — show all 3 in a grid */}
              {!winner && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {todayMemes.map((meme, i) => (
                    <div key={meme.id}
                         className={`mn-card mn-fade-in mn-fade-in-delay-${i + 1} cursor-pointer rounded-lg overflow-hidden border`}
                         style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
                         onClick={() => setSelectedMeme(meme)}>
                      <div className="relative aspect-square overflow-hidden">
                        <img src={resolveImageUrl(meme.imageUrl)} alt={meme.title}
                             className="mn-img-hover w-full h-full object-cover" />
                      </div>
                      <div className="p-4">
                        <h3 className="mn-display font-bold text-base mb-1">{meme.title}</h3>
                        <p className="text-xs line-clamp-2" style={{ color: '#6b6560' }}>{meme.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* No memes */}
          {!loading && todayMemes.length === 0 && (
            <div className="py-32 text-center">
              <p className="mn-display text-xl italic mb-2" style={{ color: '#4a4540' }}>No edition yet today.</p>
              <p className="text-sm" style={{ color: '#3a3530' }}>Check back after 8:00 AM UTC+8</p>
            </div>
          )}

          {/* ══ PAST DAYS ══ */}
          {!loading && pastDays.length > 0 && (
            <div>
              <div className="mn-rule-thick mt-4 pt-3 mb-6">
                <span className="mn-mono text-xs uppercase tracking-[0.2em]" style={{ color: '#5a5550' }}>
                  Recent Editions
                </span>
              </div>

              <div className="space-y-4">
                {pastDays.map(({ date, memes }) => {
                  const dayWinner = memes.find(m => m.isWinner || m.status === 'winner');
                  const show = dayWinner || memes[0];
                  if (!show) return null;

                  return (
                    <div key={date} className="mn-card cursor-pointer flex gap-4 items-start py-3 mn-rule"
                         onClick={() => setSelectedMeme(show)}>
                      <div className="flex-shrink-0 w-16 pt-1">
                        <p className="mn-mono text-xs font-semibold" style={{ color: '#6b6560' }}>
                          {formatShortDate(date)}
                        </p>
                      </div>
                      <img src={resolveImageUrl(show.imageUrl)} alt={show.title}
                           className="w-16 h-16 rounded object-cover flex-shrink-0" loading="lazy" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="mn-display font-bold text-sm truncate" style={{ color: '#d5d0cb' }}>
                            {show.title}
                          </h4>
                          {(show.isWinner || show.status === 'winner') && (
                            <span className="text-[10px]" style={{ color: '#eab308' }}>★</span>
                          )}
                        </div>
                        <p className="text-xs line-clamp-1 mt-0.5" style={{ color: '#5a5550' }}>
                          {show.newsSource || show.metadata?.originalNews || show.description}
                        </p>
                        {show.aiJudging?.judges && (
                          <div className="mt-1.5">
                            <JudgeScoresInline judges={show.aiJudging.judges} avg={show.aiJudging.averageTotal} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-center mt-8">
                <a href="#archive" className="mn-mono text-xs uppercase tracking-[0.15em] px-5 py-2.5 rounded-lg border hover:border-white/20 transition-colors"
                   style={{ borderColor: 'rgba(255,255,255,0.08)', color: '#6b6560' }}>
                  View Full Archive →
                </a>
              </div>
            </div>
          )}
        </main>

        {/* Detail Modal */}
        {selectedMeme && (
          <MemeDetailModal meme={selectedMeme} onClose={() => setSelectedMeme(null)} />
        )}
      </div>
    </>
  );
}

/* ── Judge Score Components ─────────────────────────────────── */

function JudgeScoresRow({ judges }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(JUDGE_CONFIG).map(([key, { name, color }]) => {
        const j = judges[key];
        if (!j || j.status === 'error') return (
          <span key={key} className="mn-score-pill" style={{ background: 'rgba(255,255,255,0.03)', color: '#4a4540' }}>
            {name}: —
          </span>
        );
        return (
          <span key={key} className="mn-score-pill mn-mono" style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
            <span style={{ color: `${color}99` }}>{name}</span>
            <span style={{ color, fontWeight: 600 }}>{j.total?.toFixed(1)}</span>
          </span>
        );
      })}
    </div>
  );
}

function JudgeScoresInline({ judges, avg }) {
  return (
    <div className="mn-mono flex items-center gap-2 text-xs">
      {Object.entries(JUDGE_CONFIG).map(([key, { name, color }]) => {
        const j = judges[key];
        if (!j || j.status === 'error') return null;
        return (
          <span key={key}>
            <span style={{ color: `${color}88` }}>{name.split('-')[0]}:</span>
            <span style={{ color, fontWeight: 600 }}>{j.total?.toFixed(1)}</span>
          </span>
        );
      })}
      {avg != null && (
        <span style={{ color: '#5a5550', marginLeft: 2 }}>
          avg {avg.toFixed(1)}
        </span>
      )}
    </div>
  );
}

function DimensionBars({ dims, className = '' }) {
  const dimensions = [
    { key: 'visual_quality', label: 'Visual', color: '#8b5cf6' },
    { key: 'news_clarity',   label: 'News',   color: '#3b82f6' },
    { key: 'meme_impact',    label: 'Impact',  color: '#eab308' },
  ];
  return (
    <div className={`flex gap-4 ${className}`}>
      {dimensions.map(({ key, label, color }) => {
        const val = dims[key] || 0;
        return (
          <div key={key} className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="mn-mono text-[10px]" style={{ color: '#5a5550' }}>{label}</span>
              <span className="mn-mono text-[10px]" style={{ color }}>{val.toFixed(1)}</span>
            </div>
            <div className="mn-dim-bar">
              <div className="mn-dim-fill" style={{ width: `${(val / 10) * 100}%`, backgroundColor: color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Detail Modal ───────────────────────────────────────────── */

function MemeDetailModal({ meme, onClose }) {
  const judging = meme.aiJudging;

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(5,5,5,0.9)', backdropFilter: 'blur(12px)' }} />
      <div className="relative rounded-xl overflow-hidden max-w-2xl w-full max-h-[90vh] overflow-y-auto"
           style={{ background: '#111110', border: '1px solid rgba(255,255,255,0.06)' }}
           onClick={(e) => e.stopPropagation()}>

        <button onClick={onClose}
                className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-full text-sm transition-colors"
                style={{ background: 'rgba(0,0,0,0.6)', color: '#6b6560' }}>
          ✕
        </button>

        <img src={resolveImageUrl(meme.imageUrl)} alt={meme.title} className="w-full" />

        <div className="p-6 space-y-4">
          {(meme.isWinner || meme.status === 'winner') && (
            <span className="mn-mono text-xs uppercase tracking-[0.15em] px-2 py-0.5 rounded inline-block"
                  style={{ background: 'rgba(234,179,8,0.12)', color: '#eab308', border: '1px solid rgba(234,179,8,0.2)' }}>
              Meme of the Day
            </span>
          )}

          <h2 className="mn-display text-3xl font-bold" style={{ color: '#f5f0eb' }}>{meme.title}</h2>

          {(meme.newsSource || meme.metadata?.originalNews) && (
            <p className="text-sm" style={{ color: '#6b6560' }}>
              {meme.newsSource || meme.metadata?.originalNews}
            </p>
          )}

          <p style={{ color: '#a09890', lineHeight: 1.6 }}>{meme.description}</p>

          {meme.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {meme.tags.map(tag => (
                <span key={tag} className="mn-mono text-xs px-2 py-0.5 rounded"
                      style={{ background: 'rgba(255,255,255,0.04)', color: '#5a5550' }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Judge scores card */}
          {judging && (
            <div className="mn-rule pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="mn-mono text-xs uppercase tracking-[0.2em]" style={{ color: '#5a5550' }}>
                  AI Judge Panel
                </span>
                <span className="mn-mono text-lg font-bold" style={{ color: '#f5f0eb' }}>
                  {judging.averageTotal?.toFixed(1)}
                  <span className="text-xs" style={{ color: '#4a4540' }}>/30</span>
                </span>
              </div>

              {judging.dimensionAverages && <DimensionBars dims={judging.dimensionAverages} />}

              {judging.judges && (
                <div className="space-y-3 mn-rule pt-3">
                  {Object.entries(JUDGE_CONFIG).map(([key, { name, color }]) => {
                    const j = judging.judges[key];
                    if (!j || j.status === 'error') return null;
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="mn-mono text-xs font-semibold" style={{ color }}>{name}</span>
                          <div className="mn-mono text-xs flex gap-3" style={{ color: '#5a5550' }}>
                            <span>VQ:{j.visual_quality}</span>
                            <span>NC:{j.news_clarity}</span>
                            <span>MI:{j.meme_impact}</span>
                            <span style={{ color: '#a09890', fontWeight: 600 }}>{j.total?.toFixed(1)}</span>
                          </div>
                        </div>
                        {j.reasoning && (
                          <p className="text-xs italic" style={{ color: '#4a4540', lineHeight: 1.5 }}>
                            "{j.reasoning}"
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <ShareToXButton meme={meme} className="mt-2" />

          <div className="mn-rule pt-3 mn-mono text-[10px] flex flex-wrap gap-4" style={{ color: '#3a3530' }}>
            {meme.generatedAt && <span>{new Date(meme.generatedAt).toLocaleString()}</span>}
            {meme.metadata?.aiModel && <span>Generated by {meme.metadata.aiModel}</span>}
            {meme.style && <span>Style: {meme.style}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Share Button ──────────────────────────────────────────── */

function ShareToXButton({ meme, className = '' }) {
  const judging = meme.aiJudging || {};
  const avg = judging.averageTotal?.toFixed(1) || '';
  const scoreTag = avg ? ` (${avg}/30)` : '';
  const isWinner = meme.isWinner || meme.status === 'winner';

  const text = isWinner
    ? `\u{1F3C6} Meme of the Day: "${meme.title}"${scoreTag}\n\nAI-judged by GPT-4o, Gemini & Grok\n\n`
    : `"${meme.title}"${scoreTag} on MemeNews\n\n`;

  const url = `https://aimemeforge.io`;
  const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

  return (
    <a
      href={intentUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`mn-mono inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${className}`}
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#a09890',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
        e.currentTarget.style.color = '#f5f0eb';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
        e.currentTarget.style.color = '#a09890';
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
      Share on X
    </a>
  );
}

/* ── Utilities ──────────────────────────────────────────────── */

function resolveImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/generated/')) return `${API_BASE_URL}${url}`;
  return url;
}

function formatShortDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default MemeNewsPage;
