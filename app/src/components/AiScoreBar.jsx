import React from 'react';

const JUDGE_LABELS = {
  chatgpt: { name: 'GPT', color: '#10a37f' },
  gemini: { name: 'Gemini', color: '#4285f4' },
  grok: { name: 'Grok', color: '#f97316' }
};

/**
 * Inline AI score display: GPT: 8.8 | Gemini: 7.3 | Grok: 9.2
 */
export function AiScoreInline({ judges, size = 'md' }) {
  if (!judges) return null;

  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className={`flex items-center gap-2 ${textSize} font-mono`}>
      {Object.entries(JUDGE_LABELS).map(([key, { name, color }]) => {
        const judge = judges[key];
        if (!judge || judge.status === 'error') {
          return (
            <span key={key} className="text-gray-600">
              {name}: --
            </span>
          );
        }
        return (
          <span key={key}>
            <span className="text-gray-400">{name}:</span>{' '}
            <span style={{ color }} className="font-bold">{judge.total?.toFixed(1)}</span>
          </span>
        );
      })}
    </div>
  );
}

/**
 * Detailed score card with dimension breakdown
 */
export function AiScoreCard({ aiJudging }) {
  if (!aiJudging) return null;

  const { judges, averageTotal, dimensionAverages } = aiJudging;

  return (
    <div className="bg-gray-900/50 rounded-xl border border-white/10 p-4 space-y-3">
      {/* Average total */}
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-sm">AI Judge Score</span>
        <span className="text-2xl font-bold text-white">{averageTotal?.toFixed(1)}<span className="text-gray-500 text-sm">/30</span></span>
      </div>

      {/* Dimension averages */}
      {dimensionAverages && (
        <div className="space-y-2">
          <DimensionBar label="Visual Quality" value={dimensionAverages.visual_quality} color="#8b5cf6" />
          <DimensionBar label="News Clarity" value={dimensionAverages.news_clarity} color="#3b82f6" />
          <DimensionBar label="Meme Impact" value={dimensionAverages.meme_impact} color="#f59e0b" />
        </div>
      )}

      {/* Per-judge scores */}
      {judges && (
        <div className="pt-2 border-t border-white/5 space-y-1.5">
          {Object.entries(JUDGE_LABELS).map(([key, { name, color }]) => {
            const judge = judges[key];
            if (!judge || judge.status === 'error') {
              return (
                <div key={key} className="flex items-center justify-between text-xs text-gray-600">
                  <span>{name}</span>
                  <span>Error</span>
                </div>
              );
            }
            return (
              <div key={key} className="flex items-center justify-between text-xs">
                <span style={{ color }} className="font-medium">{name}</span>
                <div className="flex gap-3 text-gray-400">
                  <span>VQ:{judge.visual_quality}</span>
                  <span>NC:{judge.news_clarity}</span>
                  <span>MI:{judge.meme_impact}</span>
                  <span className="text-white font-bold ml-1">{judge.total?.toFixed(1)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reasoning */}
      {judges && (
        <div className="pt-2 border-t border-white/5 space-y-1">
          {Object.entries(JUDGE_LABELS).map(([key, { name, color }]) => {
            const judge = judges[key];
            if (!judge?.reasoning) return null;
            return (
              <p key={key} className="text-xs text-gray-500">
                <span style={{ color }} className="font-medium">{name}:</span>{' '}
                {judge.reasoning}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DimensionBar({ label, value, color }) {
  const pct = Math.min(100, (value / 10) * 100);
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-mono">{value?.toFixed(1)}</span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default AiScoreInline;
