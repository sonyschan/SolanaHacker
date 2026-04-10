import React from "react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-gray-800/50 bg-gradient-to-b from-transparent to-gray-900/50 mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📰</span>
            <div>
              <span className="text-sm font-bold text-white">MemeNews</span>
              <span className="text-xs text-gray-500 ml-2">by Memeya</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://x.com/AiMemeForgeIO"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-white transition-colors"
            >
              X/Twitter
            </a>
            <a
              href="https://t.me/MemeyaOfficialCommunity"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-[#26A5E4] transition-colors"
            >
              Telegram
            </a>
            <a
              href="https://github.com/sonyschan/SolanaHacker"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>

          <p className="text-xs text-gray-600">
            &copy; {currentYear} MemeNews v{__APP_VERSION__}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
