import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import LabTab from './LabTab';

const PublicLabPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 flex justify-between items-center p-4 md:p-6 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
          <a href="#" className="flex items-center space-x-2 md:space-x-3 group">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <span className="text-lg md:text-2xl font-bold">M</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                AI MemeForge
              </h1>
            </div>
          </a>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
          <a
            href="#"
            className="hidden sm:inline-flex items-center px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            {t('common.back')}
          </a>
          <LanguageSwitcher variant="dropdown" />
        </div>
      </nav>

      {/* Lab Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <LabTab publicMode={true} />
      </div>
    </div>
  );
};

export default PublicLabPage;
