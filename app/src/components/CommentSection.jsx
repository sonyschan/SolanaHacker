import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getMemeComments, postComment, getCommentCount } from '../services/memeService';

const CommentSection = ({ memeId, walletAddress }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState(null);

  // Fetch comment count on mount
  useEffect(() => {
    if (!memeId) return;
    getCommentCount(memeId).then(res => {
      setCount(res.count || 0);
    });
  }, [memeId]);

  // Fetch full comments when expanded
  useEffect(() => {
    if (!expanded || !memeId) return;
    setLoading(true);
    getMemeComments(memeId).then(res => {
      setComments(res.comments || []);
      setCount(res.comments?.length || res.total || 0);
      setLoading(false);
    });
  }, [expanded, memeId]);

  const handlePost = async () => {
    if (!text.trim() || !walletAddress || posting) return;
    setPosting(true);
    setError(null);

    const result = await postComment(memeId, walletAddress, text.trim());

    if (result.success && result.comment) {
      setComments(prev => [result.comment, ...prev]);
      setCount(prev => prev + 1);
      setText('');
    } else {
      setError(result.error || 'Failed to post comment');
    }
    setPosting(false);
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('comments.justNow');
    if (mins < 60) return t('comments.minutesAgo', { count: mins });
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return t('comments.hoursAgo', { count: hrs });
    const days = Math.floor(hrs / 24);
    return t('comments.daysAgo', { count: days });
  };

  return (
    <div>
      {/* Toggle Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-4 py-2 hover:bg-white/10 transition-colors"
      >
        <span className="text-sm text-gray-300">
          {count > 0 ? (
            <>
              <span className="mr-1.5">{'\uD83D\uDCAC'}</span>
              {t('comments.count', { count })}
            </>
          ) : (
            <>
              <span className="mr-1.5">{'\uD83D\uDCAC'}</span>
              {t('comments.comment')}
            </>
          )}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded Section */}
      {expanded && (
        <div className="mt-2 border border-white/10 rounded-lg overflow-hidden">
          {/* Comment Input (only if authenticated) */}
          {walletAddress ? (
            <div className="p-3 border-b border-white/10 bg-white/5">
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={t('comments.placeholder')}
                maxLength={500}
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500/50"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">{text.length}/500</span>
                <button
                  onClick={handlePost}
                  disabled={!text.trim() || posting}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-sm text-white font-medium transition-colors"
                >
                  {posting ? t('common.posting') : t('common.post')}
                </button>
              </div>
              {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
            </div>
          ) : (
            <div className="p-3 border-b border-white/10 bg-white/5 text-center">
              <p className="text-xs text-gray-400">{t('comments.connectToComment')}</p>
            </div>
          )}

          {/* Comments List */}
          <div className="max-h-[240px] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full mx-auto"></div>
              </div>
            ) : comments.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                {t('comments.beFirst')}
              </div>
            ) : (
              comments.map((c, i) => (
                <div key={c.id || i} className="px-3 py-2 border-b border-white/5 last:border-b-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-purple-400 font-medium">
                      {c.author?.username || 'anon'}
                    </span>
                    <span className="text-xs text-gray-500">{formatTime(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-300 break-words">{c.text}</p>
                </div>
              ))
            )}
          </div>

          {/* Powered by Tapestry */}
          <div className="px-3 py-1.5 bg-white/5 border-t border-white/10">
            <p className="text-[11px] text-gray-600 text-center">
              Powered by <a href="https://usetapestry.dev" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-400">Tapestry</a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
