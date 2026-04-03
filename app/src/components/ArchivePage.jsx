import React, { useState, useEffect } from 'react';
import { AiScoreInline } from './AiScoreBar';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://memeforge-api-836651762884.asia-southeast1.run.app';

const PAGE_SIZE = 12;

function ArchivePage() {
  const [memes, setMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchMemes();
  }, []);

  async function fetchMemes() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/memes/hall-of-memes?days=365&limit=200`);
      const data = await res.json();
      const all = (data.memes || []).filter(m => m.type === 'daily');
      setMemes(all);
      setHasMore(all.length > PAGE_SIZE);
    } catch (err) {
      console.error('Failed to fetch archive:', err);
    } finally {
      setLoading(false);
    }
  }

  // Group by date, show winners first
  const byDate = {};
  for (const m of memes) {
    const d = (m.generatedAt || '').split('T')[0];
    if (d) {
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push(m);
    }
  }

  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));
  const pagedDates = sortedDates.slice(0, page * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">← Back</a>
            <h1 className="text-xl font-bold">MemeNews Archive</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {loading && (
          <div className="text-center py-20">
            <div className="animate-pulse text-gray-500">Loading archive...</div>
          </div>
        )}

        {!loading && (
          <div className="space-y-8">
            {pagedDates.map(date => {
              const dayMemes = byDate[date];
              const winner = dayMemes.find(m => m.isWinner || m.status === 'winner');
              const display = winner || dayMemes[0];

              return (
                <div key={date} className="flex gap-4 items-start border-b border-white/5 pb-6">
                  {/* Date */}
                  <div className="flex-shrink-0 w-20 text-right">
                    <div className="text-sm font-bold text-gray-400">{formatShortDate(date)}</div>
                  </div>

                  {/* Meme thumbnail */}
                  {display && (
                    <img
                      src={resolveImageUrl(display.imageUrl)}
                      alt={display.title}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                      loading="lazy"
                    />
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm truncate">{display?.title || 'Untitled'}</h3>
                      {(display?.isWinner || display?.status === 'winner') && (
                        <span className="text-xs text-yellow-500">🏆</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                      {display?.newsSource || display?.metadata?.originalNews || display?.description}
                    </p>
                    {display?.aiJudging?.judges && (
                      <div className="mt-1.5">
                        <AiScoreInline judges={display.aiJudging.judges} size="sm" />
                      </div>
                    )}
                    {/* Count of memes that day */}
                    <span className="text-xs text-gray-600 mt-1 inline-block">
                      {dayMemes.length} meme{dayMemes.length > 1 ? 's' : ''} generated
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load more */}
        {!loading && pagedDates.length < sortedDates.length && (
          <div className="text-center pt-8">
            <button
              onClick={() => setPage(p => p + 1)}
              className="px-6 py-2 bg-gray-800/50 hover:bg-gray-800 border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white transition-all"
            >
              Load more
            </button>
          </div>
        )}

        {!loading && memes.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            No archived news yet.
          </div>
        )}
      </main>
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

function formatShortDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default ArchivePage;
