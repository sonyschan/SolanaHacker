import React from 'react';

const ChangelogModal = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
    <div
      className="relative bg-[#0D1117] border border-emerald-500/30 rounded-2xl max-w-lg w-full max-h-[80vh] flex flex-col shadow-2xl shadow-emerald-500/10"
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="shrink-0 bg-[#0D1117] border-b border-white/10 px-6 py-4 flex items-center justify-between rounded-t-2xl">
        <div className="flex items-center gap-3">
          <img src="/images/memeya-avatar.png" alt="Memeya" className="w-8 h-8 rounded-full" />
          <div>
            <h3 className="text-white font-bold text-sm">Memeya OS Changelog</h3>
            <p className="text-gray-500 text-xs font-mono">Evolution History</p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">&times;</button>
      </div>

      {/* Changelog entries (scrollable) */}
      <div className="overflow-y-auto px-6 py-4 space-y-6">
        {/* v1.1 */}
        <div className="relative pl-6 border-l-2 border-emerald-500/50">
          <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-[#0D1117]" />
          <div className="mb-2">
            <span className="text-emerald-400 font-mono font-bold text-sm">v1.1</span>
            <span className="text-gray-600 text-xs ml-2">2026-03-23</span>
            <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">LATEST</span>
          </div>
          <h4 className="text-white font-semibold text-sm mb-2">Vision AI Evolution</h4>
          <p className="text-gray-400 text-xs leading-relaxed mb-3">
            Memeya learned to review her own memes! Analyzed 66 memes with Gemini Vision AI,
            discovered that clean art styles (graffiti, 3D clay) score 15% higher than glitchy ones.
            Now she picks better styles and avoids visual noise automatically.
          </p>
          <div className="space-y-1 text-xs text-gray-500">
            <p>+ AI self-review: top vs bottom meme visual analysis</p>
            <p>+ Smart art style selection (data-driven weights)</p>
            <p>+ Abstract glitch nerfed (was ruining 30% of memes)</p>
            <p>+ 5 new image quality rules in generation prompt</p>
            <p>+ MCP Server for Claude Code / Cursor agents</p>
            <p>+ Community meme auto-showcase on X</p>
            <p>+ Mutual boost reciprocation with price protection</p>
            <p>+ Knowledge offerings (build guide, cookbook, blueprint)</p>
          </div>
        </div>

        {/* v1.0 */}
        <div className="relative pl-6 border-l-2 border-gray-700">
          <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-gray-600 ring-4 ring-[#0D1117]" />
          <div className="mb-2">
            <span className="text-gray-400 font-mono font-bold text-sm">v1.0</span>
            <span className="text-gray-600 text-xs ml-2">2026-03-05</span>
          </div>
          <h4 className="text-white font-semibold text-sm mb-2">Memes as a Service Launch</h4>
          <p className="text-gray-400 text-xs leading-relaxed mb-3">
            Memeya opened her forge to the world. 7 comedy strategies, 10 narrative archetypes,
            10 art styles, and an anti-repetition engine that never makes the same joke twice.
            x402 payments on Base + Solana. Community voting with USDC rewards.
          </p>
          <div className="space-y-1 text-xs text-gray-500">
            <p>+ Comedy architecture: strategies + narratives + templates</p>
            <p>+ Multi-model generation (Gemini + Grok fallback)</p>
            <p>+ x402 API with Dexter facilitator (gas-sponsored)</p>
            <p>+ Daily meme cycle + community voting + USDC rewards</p>
            <p>+ Hall of Memes gallery with rarity system</p>
            <p>+ Agent autonomous X posting (7 topic types)</p>
            <p>+ Virtuals ACP + Selfclaw + Dexter marketplace listings</p>
          </div>
        </div>

        {/* v0.1 */}
        <div className="relative pl-6 border-l-2 border-gray-800">
          <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-gray-700 ring-4 ring-[#0D1117]" />
          <div className="mb-2">
            <span className="text-gray-500 font-mono font-bold text-sm">v0.1</span>
            <span className="text-gray-600 text-xs ml-2">2026-02-08</span>
          </div>
          <h4 className="text-gray-300 font-semibold text-sm mb-2">First Spark</h4>
          <p className="text-gray-500 text-xs leading-relaxed">
            The day Memeya was born. A simple idea: what if AI memes had real value?
            First meme generated, first vote cast, first forge lit.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 px-6 py-3 border-t border-white/5 text-center">
        <p className="text-gray-600 text-[10px] font-mono">Memeya evolves every week. She reviews her own work and gets better.</p>
      </div>
    </div>
  </div>
);

export default ChangelogModal;
