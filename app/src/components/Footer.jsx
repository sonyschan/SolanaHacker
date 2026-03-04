import React from "react";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();
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
                <p className="text-xs text-gray-500 font-mono">{t('footer.tagline')}</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-md">
              {t('footer.desc')}
            </p>

            {/* Hackathon Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-xs text-purple-300 font-medium">{t('footer.hackathon')}</span>
            </div>
          </div>

          {/* Links Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('footer.project')}</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="#wiki"
                  className="group flex items-center gap-2 text-sm text-gray-400 hover:text-cyan-400 transition-colors"
                >
                  <span className="text-lg group-hover:scale-110 transition-transform">{'\uD83D\uDCD6'}</span>
                  <span>{t('footer.wiki')}</span>
                </a>
              </li>
              <li>
                <a
                  href="#invite"
                  className="group flex items-center gap-2 text-sm text-gray-400 hover:text-cyan-400 transition-colors"
                >
                  <span className="text-lg group-hover:scale-110 transition-transform">{'\uD83E\uDD1D'}</span>
                  <span>{t('footer.referral')}</span>
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
                  <span>{t('footer.github')}</span>
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
                  <span>{t('footer.builtOnSolana')}</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Social & Developer */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('footer.connect')}</h4>
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
                  href="https://t.me/MemeyaOfficialCommunity"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 text-sm text-gray-400 hover:text-[#26A5E4] transition-colors"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  <span>{t('footer.telegramCommunity')}</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.moltbook.com/u/memeya"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 text-sm text-gray-400 hover:text-emerald-400 transition-colors"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                  <span>{t('footer.moltbook')}</span>
                </a>
              </li>
              <li>
                <a
                  href="#agent"
                  className="group flex items-center gap-2 text-sm text-gray-400 hover:text-purple-400 transition-colors"
                >
                  <span className="text-lg group-hover:scale-110 transition-transform">{'\uD83C\uDFDB\uFE0F'}</span>
                  <span>{t('footer.hackathon')}</span>
                </a>
              </li>
              <li>
                <a
                  href="#agent"
                  className="group flex items-center gap-2 text-sm text-gray-400 hover:text-cyan-400 transition-colors"
                >
                  <span className="text-lg group-hover:scale-110 transition-transform">{'\uD83E\uDD16'}</span>
                  <span>{t('footer.meetMemeya')}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-gray-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-600 font-mono">
            {t('footer.copyright', { year: currentYear })}
          </p>

          {/* Tech Stack */}
          <div className="flex flex-wrap items-center gap-2 md:gap-4">
            <span className="text-xs text-gray-600">{t('footer.poweredBy')}</span>
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <span className="text-xs text-gray-500 px-2 py-1 rounded bg-gray-800/50">Gemini</span>
              <span className="text-xs text-gray-500 px-2 py-1 rounded bg-gray-800/50">Grok</span>
              <span className="text-xs text-gray-500 px-2 py-1 rounded bg-gray-800/50">Claude</span>
              <span className="text-xs text-gray-500 px-2 py-1 rounded bg-gray-800/50">Solana</span>
              <span className="text-xs text-gray-500 px-2 py-1 rounded bg-gray-800/50">Base</span>
              <span className="text-xs text-gray-500 px-2 py-1 rounded bg-gray-800/50">Privy</span>
              <span className="text-xs text-gray-500 px-2 py-1 rounded bg-gray-800/50">Crossmint</span>
              <span className="text-xs text-gray-500 px-2 py-1 rounded bg-gray-800/50">Tapestry</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
