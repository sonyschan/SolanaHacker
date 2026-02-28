import React, { useState, useCallback } from "react";
import { useTranslation } from 'react-i18next';

const MEMEYA_TOKEN_CA = 'mPj8dgqLDciVX27vU5efHiodbQhsgK43gGhjQrBpump';
const MEMEYA_WALLET = '4BqywEbjMf4APFBw1spPFr11q21Uu5A1fHpCRM2zSbMP';

const techStack = ["Gemini", "Grok", "Claude", "Solana", "Metaplex", "Tapestry", "Privy"];

const agentJsonPreview = `{
  "name": "Memeya",
  "role": "Digital Forge Master",
  "capabilities": ["meme-gen", "voting", "x-posting", ...],
  "blockchain": "Solana",
  "protocol": "a2a-inspired"
}`;

const AgentPage = () => {
  const { t } = useTranslation();
  const [caCopied, setCaCopied] = useState(false);
  const [walletCopied, setWalletCopied] = useState(false);

  const capabilities = [
    { icon: "\uD83C\uDFA8", title: t('agent.caps.memeGen'), desc: t('agent.caps.memeGenDesc') },
    { icon: "\uD83D\uDDF3\uFE0F", title: t('agent.caps.voting'), desc: t('agent.caps.votingDesc') },
    { icon: "\uD83D\uDCE1", title: t('agent.caps.xPosting'), desc: t('agent.caps.xPostingDesc') },
    { icon: "\uD83D\uDD17", title: t('agent.caps.tapestry'), desc: t('agent.caps.tapestryDesc') },
    { icon: "\uD83C\uDFB0", title: t('agent.caps.lottery'), desc: t('agent.caps.lotteryDesc') },
    { icon: "\uD83D\uDDBC\uFE0F", title: t('agent.caps.nft'), desc: t('agent.caps.nftDesc') },
  ];

  const values = [
    { emoji: "\uD83D\uDD25", label: t('agent.values.passion') },
    { emoji: "\u2692\uFE0F", label: t('agent.values.forge') },
    { emoji: "\uD83D\uDCAF", label: t('agent.values.honest') },
    { emoji: "\uD83C\uDF31", label: t('agent.values.grow') },
  ];

  const voiceSamples = [
    t('agent.voice1'),
    t('agent.voice2'),
    t('agent.voice3'),
  ];
  const copyCA = useCallback(() => {
    navigator.clipboard.writeText(MEMEYA_TOKEN_CA);
    setCaCopied(true);
    setTimeout(() => setCaCopied(false), 2000);
  }, []);
  const copyWallet = useCallback(() => {
    navigator.clipboard.writeText(MEMEYA_WALLET);
    setWalletCopied(true);
    setTimeout(() => setWalletCopied(false), 2000);
  }, []);

  const navigateHome = () => {
    window.location.hash = "";
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="absolute top-20 left-20 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-40 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 flex justify-between items-center p-4 md:p-6 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center space-x-2 md:space-x-3">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <span className="text-lg md:text-2xl font-bold">M</span>
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI MemeForge
            </h1>
            <div className="text-xs text-gray-500 hidden sm:block">{t('agent.subtitle')}</div>
          </div>
        </div>
        <button
          onClick={navigateHome}
          className="px-4 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-all"
        >
          {t('agent.backToHome')}
        </button>
      </nav>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 py-12 md:py-20 space-y-16 md:space-y-24">

        {/* Hero */}
        <section className="text-center space-y-6">
          <div className="relative inline-block">
            <img
              src="/images/memeya-avatar.png"
              alt="Memeya"
              className="w-32 h-32 md:w-40 md:h-40 rounded-full border-2 border-cyan-500/50 shadow-xl shadow-cyan-500/20 mx-auto"
            />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-black flex items-center justify-center">
              <span className="text-xs">AI</span>
            </div>
          </div>
          <div>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
              Memeya
            </h2>
            <p className="text-lg text-gray-400 mt-2">{t('agent.role')}</p>
          </div>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg leading-relaxed">
            {t('agent.heroDesc')}
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a
              href="https://x.com/AiMemeForgeIO"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 border border-white/10 text-white hover:bg-white/15 transition-all"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              @AiMemeForgeIO
            </a>
            <a
              href="/agent.json"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-all font-mono text-sm"
            >
              {"{ }"}  agent.json
            </a>
          </div>
        </section>

        {/* About + Values */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-4">
            <h3 className="text-xl font-bold text-white">{t('agent.about')}</h3>
            <p className="text-gray-400 leading-relaxed">
              {t('agent.aboutP1')}
            </p>
            <p className="text-gray-400 leading-relaxed">
              {t('agent.aboutP2')}
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-4">
            <h3 className="text-xl font-bold text-white">{t('agent.coreValues')}</h3>
            <ul className="space-y-3">
              {values.map((v, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0 mt-0.5">{v.emoji}</span>
                  <span className="text-gray-300">{v.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Capabilities Grid */}
        <section className="space-y-8">
          <h3 className="text-2xl font-bold text-center bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            {t('agent.capabilities')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {capabilities.map((cap, i) => (
              <div
                key={i}
                className="p-5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/[0.08] transition-all group"
              >
                <div className="text-2xl mb-3 group-hover:scale-110 transition-transform inline-block">{cap.icon}</div>
                <h4 className="font-semibold text-white mb-2">{cap.title}</h4>
                <p className="text-sm text-gray-400 leading-relaxed">{cap.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section className="space-y-6 text-center">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            {t('agent.techStack')}
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {techStack.map((tech) => (
              <span
                key={tech}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 font-mono"
              >
                {tech}
              </span>
            ))}
          </div>
        </section>

        {/* $Memeya Token */}
        <section className="space-y-6">
          <h3 className="text-2xl font-bold text-center">
            <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">$Memeya</span>
            <span className="text-white"> Token</span>
          </h3>
          <div className="max-w-2xl mx-auto p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-5">
            <p className="text-gray-300 text-center" dangerouslySetInnerHTML={{ __html: t('agent.holdDesc', { interpolation: { escapeValue: false } }).replace('<1>', '<span class="text-yellow-400 font-semibold">').replace('</1>', '</span>') }} />

            {/* CA Display + Copy */}
            <div className="flex items-center justify-center gap-2">
              <code className="text-sm md:text-base font-mono text-yellow-300 bg-black/30 px-4 py-2 rounded-lg border border-yellow-500/20 truncate max-w-[240px] md:max-w-none">
                {MEMEYA_TOKEN_CA}
              </code>
              <button
                onClick={copyCA}
                className="px-3 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 hover:bg-yellow-500/30 transition-colors text-sm font-medium flex-shrink-0"
              >
                {caCopied ? t('common.copied') : t('common.copy')}
              </button>
            </div>

            {/* Bonus Examples */}
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              <span className="px-3 py-1 bg-white/5 rounded-full text-gray-400">{t('home.tokenBonus.ten')}</span>
              <span className="px-3 py-1 bg-white/5 rounded-full text-gray-400">{t('home.tokenBonus.oneK')}</span>
              <span className="px-3 py-1 bg-white/5 rounded-full text-gray-400">{t('home.tokenBonus.tenK')}</span>
              <span className="px-3 py-1 bg-white/5 rounded-full text-gray-400">{t('home.tokenBonus.hundredK')}</span>
            </div>

            <div className="text-center">
              <a
                href={`https://pump.fun/coin/${MEMEYA_TOKEN_CA}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold rounded-xl transition-all duration-200"
              >
                {t('home.memeya.buyOnPumpFun')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </section>

        {/* Wallet */}
        <section className="space-y-6">
          <h3 className="text-2xl font-bold text-center">
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">{t('agent.wallet')}</span>
          </h3>
          <div className="max-w-2xl mx-auto p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-4">
            <p className="text-gray-300 text-center" dangerouslySetInnerHTML={{ __html: t('agent.walletDesc', { interpolation: { escapeValue: false } }).replace('<1>', '<span class="text-green-400 font-semibold">').replace('</1>', '</span>') }} />
            <div className="flex items-center justify-center gap-2">
              <code className="text-sm md:text-base font-mono text-green-300 bg-black/30 px-4 py-2 rounded-lg border border-green-500/20 truncate max-w-[240px] md:max-w-none">
                {MEMEYA_WALLET}
              </code>
              <button
                onClick={copyWallet}
                className="px-3 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors text-sm font-medium flex-shrink-0"
              >
                {walletCopied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              <span className="px-3 py-1 bg-white/5 rounded-full text-gray-400">{t('agent.rewardWinner')}</span>
              <span className="px-3 py-1 bg-white/5 rounded-full text-gray-400">{t('agent.rewardLucky1')}</span>
              <span className="px-3 py-1 bg-white/5 rounded-full text-gray-400">{t('agent.rewardLucky2')}</span>
            </div>
            <div className="text-center">
              <a
                href={`https://solscan.io/account/${MEMEYA_WALLET}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold rounded-xl transition-all duration-200"
              >
                {t('agent.viewOnSolscan')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </section>

        {/* Voice Samples */}
        <section className="space-y-6">
          <h3 className="text-2xl font-bold text-center bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            {t('agent.voiceSamples')}
          </h3>
          <div className="space-y-3 max-w-2xl mx-auto">
            {voiceSamples.map((tweet, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
              >
                <div className="flex items-start gap-3">
                  <img src="/images/memeya-avatar.png" alt="Memeya AI agent avatar" className="w-8 h-8 rounded-full flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white text-sm">Memeya</span>
                      <span className="text-xs text-gray-500">@AiMemeForgeIO</span>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{tweet}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Agent Discovery */}
        <section className="space-y-4 text-center">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            {t('agent.agentDiscovery')}
          </h3>
          <p className="text-gray-400">
            {t('agent.agentManifest')}{" "}
            <a
              href="/agent.json"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 font-mono underline underline-offset-4"
            >
              aimemeforge.io/agent.json
            </a>
          </p>
          <div className="max-w-lg mx-auto">
            <pre className="p-4 rounded-xl bg-white/5 border border-white/10 text-left text-xs text-gray-400 font-mono overflow-x-auto">
              {agentJsonPreview}
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AgentPage;
