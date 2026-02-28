import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', label: 'EN' },
  { code: 'zh-CN', label: '\u7b80\u4f53' },
  { code: 'zh-TW', label: '\u7e41\u9ad4' },
];

/**
 * LanguageSwitcher
 * variant="dropdown" — globe icon dropdown (for nav bars)
 * variant="inline"   — horizontal buttons (for settings menus)
 */
const LanguageSwitcher = ({ variant = 'dropdown' }) => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const changeLang = (code) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-1.5">
        {languages.map((lng) => (
          <button
            key={lng.code}
            onClick={() => changeLang(lng.code)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              i18n.language === lng.code || (lng.code === 'en' && i18n.language.startsWith('en'))
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {lng.label}
          </button>
        ))}
      </div>
    );
  }

  // Dropdown variant
  return (
    <div className="relative z-50" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
        title="Language"
      >
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-36 bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100]">
          {languages.map((lng) => (
            <button
              key={lng.code}
              onClick={() => changeLang(lng.code)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                i18n.language === lng.code || (lng.code === 'en' && i18n.language.startsWith('en'))
                  ? 'bg-cyan-500/10 text-cyan-400'
                  : 'text-gray-300 hover:bg-white/10'
              }`}
            >
              {lng.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
