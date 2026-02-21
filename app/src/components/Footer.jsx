import React from "react";

/**
 * Universal Footer Component
 * Design inspired by BV7x.ai - dark, professional, clean grid layout
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-gray-800/50 bg-gradient-to-b from-transparent to-gray-900/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">

          {/* Brand Section - 2 cols on desktop */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img src="/images/logo-48.png" alt="AI MemeForge" className="w-10 h-10 rounded-xl" />
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">AI MemeForge</h3>
                <p className="text-xs text-gray-500 font-mono">AI Dreams. Humans Decide.</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-md">
              The world&apos;s first AI meme democracy on Solana. AI generates daily memes,
              community votes determine rarity, winners earn real SOL rewards.
            </p>

            {/* Hackathon Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-xs text-purple-300 font-medium">Colosseum Agent Hackathon 2026</span>
            </div>
          </div>

          {/* Links Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Project</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://colosseum.com/agent-hackathon/projects/memeforge"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 text-sm text-gray-400 hover:text-purple-400 transition-colors"
                >
                  <span className="text-lg group-hover:scale-110 transition-transform">🗳️</span>
                  <span>Vote on Colosseum</span>
                  <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/sonyschan/SolanaHacker"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  <span>GitHub</span>
                </a>
              </li>
              <li>
                <a
                  href="https://solana.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 text-sm text-gray-400 hover:text-[#14F195] transition-colors"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 397.7 311.7" fill="currentColor">
                    <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z"/>
                    <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z"/>
                    <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z"/>
                  </svg>
                  <span>Built on Solana</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Social & Developer */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Connect</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://x.com/AiMemeForgeIO"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span>@AiMemeForgeIO</span>
                </a>
              </li>
              <li>
                <a
                  href="https://colosseum.com/agent-hackathon"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 text-sm text-gray-400 hover:text-orange-400 transition-colors"
                >
                  <span className="text-lg group-hover:scale-110 transition-transform">🏛️</span>
                  <span>Colosseum Hackathon</span>
                </a>
              </li>
              <li>
                <span className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="text-lg">🤖</span>
                  <span>Agent: SolanaHacker</span>
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-gray-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-600 font-mono">
            © {currentYear} AI MemeForge. Built with 💜 by AI & Human collaboration.
          </p>

          {/* Tech Stack */}
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-600">Powered by</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 px-2 py-1 rounded bg-gray-800/50">Gemini 3</span>
              <span className="text-xs text-gray-500 px-2 py-1 rounded bg-gray-800/50">Solana</span>
              <span className="text-xs text-gray-500 px-2 py-1 rounded bg-gray-800/50">React</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
