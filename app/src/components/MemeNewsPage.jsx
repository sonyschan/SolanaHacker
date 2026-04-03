import React, { useState, useEffect } from 'react';
import { AiScoreInline, AiScoreCard } from './AiScoreBar';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://memeforge-api-836651762884.asia-southeast1.run.app';

function MemeNewsPage() {
  const [todayMemes, setTodayMemes] = useState([]);
  const [pastDays, setPastDays] = useState([]); // [{date, memes}]
  const [loading, setLoading] = useState(true);
  const [selectedMeme, setSelectedMeme] = useState(null);

  useEffect(() => {
    fetchMemes();
  }, []);

  async function fetchMemes() {
    setLoading(true);
    try {
      // Fetch today's memes
      const todayRes = await fetch(`${API_BASE_URL}/api/memes/today`);
      const todayData = await todayRes.json();
      const today = todayData.memes || [];
      setTodayMemes(today);

      // Fetch past 3 days (via hall-of-memes with 4 day window)
      const hallRes = await fetch(`${API_BASE_URL}/api/memes/hall-of-memes?days=4&limit=20`);
      const hallData = await hallRes.json();
      const allMemes = hallData.memes || [];

      // Group by date, exclude today
      const todayDate = new Date().toISOString().split('T')[0];
      const byDate = {};
      for (const m of allMemes) {
        const d = (m.generatedAt || '').split('T')[0];
        if (d && d !== todayDate && m.type === 'daily') {
          if (!byDate[d]) byDate[d] = [];
          byDate[d].push(m);
        }
      }

      const sorted = Object.entries(byDate)
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, 3)
        .map(([date, memes]) => ({ date, memes }));

      setPastDays(sorted);
    } catch (err) {
      console.error('Failed to fetch memes:', err);
    } finally {
      setLoading(false);
    }
  }

  const winner = todayMemes.find(m => m.isWinner || m.status === 'winner');
  const others = todayMemes.filter(m => m !== winner);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📰</span>
            <div>
              <h1 className="text-xl font-bold tracking-tight">MemeNews</h1>
              <p className="text-xs text-gray-500">News through memes, judged by AI</p>
            </div>
          </div>
          <a
            href="#archive"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Past News →
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-12">
        {/* Loading */}
        {loading && (
          <div className="text-center py-20">
            <div className="animate-pulse text-gray-500">Loading today's MemeNews...</div>
          </div>
        )}

        {/* Today's MemeNews */}
        {!loading && todayMemes.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-lg font-bold">Today's MemeNews</h2>
              <span className="text-xs text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            </div>

            {/* Winner highlight */}
            {winner && (
              <div className="mb-8">
                <div className="relative">
                  <div className="absolute -top-3 left-4 z-10">
                    <span className="bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                      🏆 Meme of the Day
                    </span>
                  </div>
                  <MemeNewsCard meme={winner} isWinner onClick={() => setSelectedMeme(winner)} />
                </div>
              </div>
            )}

            {/* Other memes */}
            {others.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {others.map(meme => (
                  <MemeNewsCard key={meme.id} meme={meme} onClick={() => setSelectedMeme(meme)} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* No memes today */}
        {!loading && todayMemes.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <p className="text-4xl mb-4">📰</p>
            <p>No MemeNews yet today. Check back after 8AM UTC+8!</p>
          </div>
        )}

        {/* Past 3 days */}
        {!loading && pastDays.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-4">Recent News</h2>
            <div className="space-y-8">
              {pastDays.map(({ date, memes }) => {
                const dayWinner = memes.find(m => m.isWinner || m.status === 'winner');
                return (
                  <div key={date}>
                    <h3 className="text-sm text-gray-500 mb-3">
                      {formatDate(date)}
                    </h3>
                    {dayWinner ? (
                      <MemeNewsCard meme={dayWinner} compact onClick={() => setSelectedMeme(dayWinner)} />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {memes.slice(0, 3).map(m => (
                          <MemeNewsCard key={m.id} meme={m} compact onClick={() => setSelectedMeme(m)} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Archive link */}
        <div className="text-center pt-4 pb-8">
          <a
            href="#archive"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800/50 hover:bg-gray-800 border border-white/10 hover:border-white/20 rounded-xl text-sm text-gray-300 hover:text-white transition-all"
          >
            See past news →
          </a>
        </div>
      </main>

      {/* Meme Detail Modal */}
      {selectedMeme && (
        <MemeDetailModal meme={selectedMeme} onClose={() => setSelectedMeme(null)} />
      )}
    </div>
  );
}

/**
 * MemeNews card — shows meme image, news context, AI scores
 */
function MemeNewsCard({ meme, isWinner, compact, onClick }) {
  const judging = meme.aiJudging;

  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer rounded-xl border transition-all duration-200 overflow-hidden ${
        isWinner
          ? 'border-yellow-500/30 bg-yellow-500/5 hover:border-yellow-400/50 hover:shadow-lg hover:shadow-yellow-500/10'
          : 'border-white/10 bg-gray-900/50 hover:border-white/20 hover:shadow-lg hover:shadow-white/5'
      }`}
    >
      {compact ? (
        /* Compact layout — horizontal */
        <div className="flex gap-4 p-3">
          <img
            src={resolveImageUrl(meme.imageUrl)}
            alt={meme.title}
            className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
            loading="lazy"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm truncate group-hover:text-cyan-300 transition-colors">
              {meme.title}
            </h4>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{meme.description}</p>
            {judging?.judges && (
              <div className="mt-2">
                <AiScoreInline judges={judging.judges} size="sm" />
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Full layout — vertical */
        <>
          <div className="relative aspect-square overflow-hidden">
            <img
              src={resolveImageUrl(meme.imageUrl)}
              alt={meme.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            {judging?.averageTotal != null && (
              <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded-lg px-2.5 py-1">
                <span className="text-lg font-bold text-white">{judging.averageTotal.toFixed(1)}</span>
                <span className="text-xs text-gray-400">/30</span>
              </div>
            )}
          </div>
          <div className="p-4 space-y-2">
            <h3 className={`font-bold text-lg group-hover:text-cyan-300 transition-colors ${isWinner ? 'text-yellow-300' : ''}`}>
              {meme.title}
            </h3>
            {/* News context */}
            {(meme.newsSource || meme.metadata?.originalNews) && (
              <p className="text-xs text-gray-500">
                📰 {meme.newsSource || meme.metadata?.originalNews}
              </p>
            )}
            <p className="text-sm text-gray-400 line-clamp-2">{meme.description}</p>
            {/* AI Scores inline */}
            {judging?.judges && (
              <div className="pt-2">
                <AiScoreInline judges={judging.judges} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Modal showing full meme details with AI judge breakdown
 */
function MemeDetailModal({ meme, onClose }) {
  const judging = meme.aiJudging;

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="relative bg-gray-900 rounded-2xl border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
        >
          ✕
        </button>

        {/* Image */}
        <img
          src={resolveImageUrl(meme.imageUrl)}
          alt={meme.title}
          className="w-full rounded-t-2xl"
        />

        <div className="p-6 space-y-4">
          {/* Winner badge */}
          {(meme.isWinner || meme.status === 'winner') && (
            <span className="inline-block bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full">
              🏆 Meme of the Day
            </span>
          )}

          <h2 className="text-2xl font-bold">{meme.title}</h2>

          {/* News source */}
          {(meme.newsSource || meme.metadata?.originalNews) && (
            <p className="text-sm text-gray-400">
              📰 {meme.newsSource || meme.metadata?.originalNews}
            </p>
          )}

          <p className="text-gray-300">{meme.description}</p>

          {/* Tags */}
          {meme.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {meme.tags.map(tag => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-500">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* AI Judge Scores */}
          {judging && <AiScoreCard aiJudging={judging} />}

          {/* Meta */}
          <div className="text-xs text-gray-600 pt-2 border-t border-white/5 flex flex-wrap gap-4">
            {meme.generatedAt && (
              <span>{new Date(meme.generatedAt).toLocaleString()}</span>
            )}
            {meme.metadata?.aiModel && (
              <span>Generated by {meme.metadata.aiModel}</span>
            )}
            {meme.style && <span>Style: {meme.style}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function resolveImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/generated/')) {
    return `${API_BASE_URL}${url}`;
  }
  return url;
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export default MemeNewsPage;
