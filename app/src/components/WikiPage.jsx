import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const MEMEYA_TOKEN_CA = 'mPj8dgqLDciVX27vU5efHiodbQhsgK43gGhjQrBpump';

const SECTIONS = ['onboarding', 'howto', 'tokenomics', 'roadmap', 'faq'];

// Convert a UTC hour:minute to the user's local timezone, e.g. "7:55 AM (23:55 UTC)"
const formatLocalTime = (utcHour, utcMinute = 0) => {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), utcHour, utcMinute));
  const h = d.getHours(), m = d.getMinutes();
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  const local = `${h12}:${String(m).padStart(2, '0')} ${period}`;
  const utc = `${utcHour}:${String(utcMinute).padStart(2, '0')} UTC`;
  return `${local} (${utc})`;
};

const WikiPage = () => {
  const { t } = useTranslation();

  // Pre-compute local time strings for UTC events
  const drawTime = formatLocalTime(23, 55);      // lottery draw
  const memeGenTime = formatLocalTime(0, 0);      // new memes generated
  const timeVars = { drawTime, memeGenTime };
  const [activeSection, setActiveSection] = useState('onboarding');
  const [openFaq, setOpenFaq] = useState(null);
  const [caCopied, setCaCopied] = useState(false);
  const sectionRefs = useRef({});

  const copyCA = useCallback(() => {
    navigator.clipboard.writeText(MEMEYA_TOKEN_CA);
    setCaCopied(true);
    setTimeout(() => setCaCopied(false), 2000);
  }, []);

  const navigateHome = () => {
    window.location.hash = '';
  };

  // Track active section on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -60% 0px' }
    );

    SECTIONS.forEach((id) => {
      const el = sectionRefs.current[id];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const tocItems = SECTIONS.map((id) => ({
    id,
    label: t(`wiki.toc.${id}`),
  }));

  const faqItems = [
    { q: t('wiki.faq.q1'), a: t('wiki.faq.a1') },
    { q: t('wiki.faq.q2'), a: t('wiki.faq.a2', timeVars) },
    { q: t('wiki.faq.q3'), a: t('wiki.faq.a3') },
    { q: t('wiki.faq.q4'), a: t('wiki.faq.a4') },
    { q: t('wiki.faq.q5'), a: t('wiki.faq.a5') },
    { q: t('wiki.faq.q6'), a: t('wiki.faq.a6') },
    { q: t('wiki.faq.q7'), a: t('wiki.faq.a7') },
  ];

  const roadmapPhases = [
    {
      phase: t('wiki.roadmap.phase1'),
      title: t('wiki.roadmap.phase1Title'),
      items: [t('wiki.roadmap.phase1Item1'), t('wiki.roadmap.phase1Item2'), t('wiki.roadmap.phase1Item3'), t('wiki.roadmap.phase1Item4')],
      active: true,
    },
    {
      phase: t('wiki.roadmap.phase2'),
      title: t('wiki.roadmap.phase2Title'),
      items: [t('wiki.roadmap.phase2Item1'), t('wiki.roadmap.phase2Item2'), t('wiki.roadmap.phase2Item3')],
    },
    {
      phase: t('wiki.roadmap.phase3'),
      title: t('wiki.roadmap.phase3Title'),
      items: [t('wiki.roadmap.phase3Item1'), t('wiki.roadmap.phase3Item2'), t('wiki.roadmap.phase3Item3')],
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-clip relative">
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
          <a href="#" onClick={(e) => { e.preventDefault(); navigateHome(); }} className="flex items-center space-x-2 md:space-x-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <span className="text-lg md:text-2xl font-bold">M</span>
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                AI MemeForge
              </h1>
              <div className="text-xs text-gray-500 hidden sm:block">{t('wiki.subtitle')}</div>
            </div>
          </a>
        </div>
        <div className="flex items-center space-x-2 md:space-x-4">
          <LanguageSwitcher variant="dropdown" />
          <button
            onClick={navigateHome}
            className="px-4 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-all"
          >
            {t('wiki.backToHome')}
          </button>
        </div>
      </nav>

      {/* Mobile TOC — horizontal scrollable tabs */}
      <div className="lg:hidden relative z-10 sticky top-0 bg-black/90 backdrop-blur-md border-b border-white/10">
        <div className="flex overflow-x-auto gap-1 px-4 py-3 scrollbar-hide">
          {tocItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                activeSection === item.id
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Layout: Sidebar + Content */}
      <div className="relative z-10 max-w-7xl mx-auto flex">
        {/* Desktop Sidebar TOC */}
        <aside className="hidden lg:block w-64 flex-shrink-0 p-6">
          <div className="sticky top-8 space-y-1">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">{t('wiki.tocTitle')}</h3>
            {tocItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeSection === item.id
                    ? 'bg-cyan-500/15 text-cyan-400 border-l-2 border-cyan-400'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 px-4 md:px-8 py-8 md:py-12 space-y-16 md:space-y-24 max-w-4xl">

          {/* Section 1: Onboarding */}
          <section id="onboarding" ref={(el) => (sectionRefs.current.onboarding = el)} className="scroll-mt-24 space-y-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {t('wiki.onboarding.title')}
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                {t('wiki.onboarding.intro')}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <h3 className="text-xl font-bold text-white">{t('wiki.onboarding.whatIsTitle')}</h3>
              <p className="text-gray-400 leading-relaxed">{t('wiki.onboarding.whatIsDesc', timeVars)}</p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <h3 className="text-xl font-bold text-white">{t('wiki.onboarding.whoIsTitle')}</h3>
              <p className="text-gray-400 leading-relaxed">{t('wiki.onboarding.whoIsDesc')}</p>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-yellow-500/10 border border-yellow-500/30 space-y-4">
              <h3 className="text-xl font-bold text-white">{t('wiki.onboarding.buyTitle')}</h3>
              <p className="text-gray-400 leading-relaxed">{t('wiki.onboarding.buyDesc')}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <code className="text-sm font-mono text-yellow-300 bg-black/30 px-3 py-1.5 rounded-lg border border-yellow-500/20 truncate max-w-[240px] md:max-w-none">
                  {MEMEYA_TOKEN_CA}
                </code>
                <button
                  onClick={copyCA}
                  className="px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 hover:bg-yellow-500/30 transition-colors text-sm font-medium flex-shrink-0"
                >
                  {caCopied ? t('common.copied') : t('common.copy')}
                </button>
              </div>
              <a
                href={`https://raydium.io/swap/?inputMint=sol&outputMint=${MEMEYA_TOKEN_CA}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold rounded-xl transition-all duration-200 text-sm"
              >
                {t('wiki.onboarding.buyOnRaydium')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </section>

          {/* Section 2: How-to */}
          <section id="howto" ref={(el) => (sectionRefs.current.howto = el)} className="scroll-mt-24 space-y-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                {t('wiki.howto.title')}
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                {t('wiki.howto.intro')}
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-4">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex gap-4 p-5 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0 font-bold text-black">
                    {step}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">{t(`wiki.howto.step${step}Title`)}</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">{t(`wiki.howto.step${step}Desc`, timeVars)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reward breakdown */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 space-y-4">
              <h3 className="text-xl font-bold text-green-400">{t('wiki.howto.rewardsTitle')}</h3>
              <p className="text-gray-400 leading-relaxed">{t('wiki.howto.rewardsDesc', timeVars)}</p>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="px-4 py-2 bg-green-500/20 rounded-lg text-green-300 font-medium">{t('wiki.howto.reward1')}</span>
                <span className="px-4 py-2 bg-green-500/15 rounded-lg text-green-300 font-medium">{t('wiki.howto.reward2')}</span>
                <span className="px-4 py-2 bg-green-500/10 rounded-lg text-green-300 font-medium">{t('wiki.howto.reward3')}</span>
              </div>
              <p className="text-gray-500 text-sm">{t('wiki.howto.rewardsNote')}</p>
            </div>

            {/* Ticket bonus */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <h3 className="text-xl font-bold text-white">{t('wiki.howto.ticketTitle')}</h3>
              <p className="text-gray-400 leading-relaxed">{t('wiki.howto.ticketDesc')}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                  <div className="text-cyan-400 font-bold text-lg">1-10</div>
                  <div className="text-gray-500">{t('wiki.howto.baseTickets')}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                  <div className="text-purple-400 font-bold text-lg">+1~10</div>
                  <div className="text-gray-500">{t('wiki.howto.streakBonus')}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                  <div className="text-yellow-400 font-bold text-lg">+1~7</div>
                  <div className="text-gray-500">{t('wiki.howto.tokenBonus')}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                  <div className="text-green-400 font-bold text-lg">27</div>
                  <div className="text-gray-500">{t('wiki.howto.maxPerVote')}</div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Tokenomics */}
          <section id="tokenomics" ref={(el) => (sectionRefs.current.tokenomics = el)} className="scroll-mt-24 space-y-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                {t('wiki.tokenomics.title')}
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                {t('wiki.tokenomics.intro')}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <h3 className="text-xl font-bold text-white">{t('wiki.tokenomics.utilityTitle')}</h3>
              <ul className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-400">
                    <span className="text-yellow-400 mt-1">&#9679;</span>
                    <span>{t(`wiki.tokenomics.utility${i}`)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <h3 className="text-xl font-bold text-white">{t('wiki.tokenomics.treasuryTitle')}</h3>
              <p className="text-gray-400 leading-relaxed">{t('wiki.tokenomics.treasuryDesc')}</p>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-yellow-500/10 border border-yellow-500/30 space-y-3">
              <h3 className="text-xl font-bold text-white">{t('wiki.tokenomics.caTitle')}</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <code className="text-sm font-mono text-yellow-300 bg-black/30 px-3 py-1.5 rounded-lg border border-yellow-500/20 truncate max-w-[240px] md:max-w-none">
                  {MEMEYA_TOKEN_CA}
                </code>
                <button
                  onClick={copyCA}
                  className="px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 hover:bg-yellow-500/30 transition-colors text-sm font-medium flex-shrink-0"
                >
                  {caCopied ? t('common.copied') : t('common.copy')}
                </button>
              </div>
            </div>
          </section>

          {/* Section 4: Roadmap */}
          <section id="roadmap" ref={(el) => (sectionRefs.current.roadmap = el)} className="scroll-mt-24 space-y-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {t('wiki.roadmap.title')}
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                {t('wiki.roadmap.intro')}
              </p>
            </div>

            <div className="space-y-6">
              {roadmapPhases.map((phase, idx) => (
                <div
                  key={idx}
                  className={`p-6 rounded-2xl border space-y-4 ${
                    phase.active
                      ? 'bg-purple-500/10 border-purple-500/30'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {phase.active && (
                      <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                    )}
                    <span className={`text-sm font-semibold uppercase tracking-wider ${phase.active ? 'text-purple-400' : 'text-gray-500'}`}>
                      {phase.phase}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white">{phase.title}</h3>
                  <ul className="space-y-2">
                    {phase.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-gray-400 text-sm">
                        <span className={phase.active ? 'text-green-400' : 'text-gray-600'}>
                          {phase.active ? '\u2713' : '\u25CB'}
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Section 5: FAQ */}
          <section id="faq" ref={(el) => (sectionRefs.current.faq = el)} className="scroll-mt-24 space-y-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                {t('wiki.faq.title')}
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                {t('wiki.faq.intro')}
              </p>
            </div>

            <div className="space-y-3">
              {faqItems.map((item, idx) => (
                <div key={idx} className="rounded-xl border border-white/10 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left bg-white/5 hover:bg-white/[0.08] transition-colors"
                  >
                    <span className="font-medium text-white pr-4">{item.q}</span>
                    <svg
                      className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${openFaq === idx ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openFaq === idx && (
                    <div className="px-5 pb-5 bg-white/[0.03]">
                      <p className="text-gray-400 leading-relaxed pt-3 break-words">{item.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Bottom CTA */}
          <section className="text-center bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-white/10 rounded-3xl p-10 md:p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 animate-pulse" />
            <div className="relative z-10">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">{t('wiki.cta.title')}</h3>
              <p className="text-gray-400 mb-6 max-w-xl mx-auto">{t('wiki.cta.desc')}</p>
              <button
                onClick={navigateHome}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold rounded-xl transition-all duration-200 text-lg"
              >
                {t('wiki.cta.button')}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              <p className="mt-4 text-sm text-gray-500">
                {t('wiki.cta.docsNote')}{' '}
                <a href="/docs" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                  {t('wiki.cta.docsLink')}
                </a>
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default WikiPage;
