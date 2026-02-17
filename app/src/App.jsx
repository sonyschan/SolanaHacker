import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import HomePage from "./components/HomePage";
import Dashboard from "./components/Dashboard";
import Footer from "./components/Footer";
import "./index.css";
import "./styles/placeholders.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://memeforge-api-836651762884.asia-southeast1.run.app";

function App() {
  const { connected, connecting, publicKey } = useWallet();
  const [currentView, setCurrentView] = useState("home");
  const [userTickets, setUserTickets] = useState(0);
  const [votingStreak, setVotingStreak] = useState(0);
  const [userDataLoading, setUserDataLoading] = useState(false);
  // 預設使用賽博朋克主題
  const [currentTheme, setCurrentTheme] = useState("cyberpunk");

  // 監聽 URL 參數，決定使用哪個主題
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const theme = urlParams.get('theme');
    
    if (theme === 'morandi') {
      setCurrentTheme('morandi');
    } else {
      // 無參數或其他參數都使用賽博朋克主題
      setCurrentTheme('cyberpunk');
    }
  }, []);

  // 監聽 URL 變化
  useEffect(() => {
    const handleUrlChange = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const theme = urlParams.get('theme');
      
      if (theme === 'morandi' && currentTheme !== 'morandi') {
        setCurrentTheme('morandi');
        window.location.reload(); // 重新載入以套用新主題
      } else if (theme !== 'morandi' && currentTheme !== 'cyberpunk') {
        setCurrentTheme('cyberpunk');
        window.location.reload(); // 重新載入以套用新主題
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, [currentTheme]);

  // Fetch user data from API when wallet connects - v2 fix
  useEffect(() => {
    console.log("🔍 App useEffect: connected=", connected, "publicKey=", publicKey?.toBase58());

    const fetchUserData = async () => {
      if (!connected || !publicKey) {
        console.log("⏭️ Skipping user fetch: not connected");
        return;
      }

      const walletAddress = publicKey.toBase58();
      setUserDataLoading(true);

      try {
        console.log("📊 獲取用戶數據:", walletAddress);
        const response = await fetch(`${API_BASE_URL}/api/users/${walletAddress}`);
        const data = await response.json();

        if (data.success && data.user) {
          setUserTickets(data.user.weeklyTickets || 0);
          setVotingStreak(data.user.streakDays || 0);
          console.log("✅ 用戶數據:", {
            tickets: data.user.weeklyTickets,
            streak: data.user.streakDays
          });
        }
      } catch (error) {
        console.error("❌ 獲取用戶數據失敗:", error);
        // Keep default values (0) on error
      } finally {
        setUserDataLoading(false);
      }
    };

    fetchUserData();
  }, [connected, publicKey]);

  // Auto-switch to dashboard when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      setCurrentView("dashboard");
    } else {
      // For testing: Allow dashboard view without wallet connection
      // In production, remove this and only show dashboard when connected
      const urlHash = window.location.hash;
      if (urlHash === "#dashboard") {
        setCurrentView("dashboard");
      } else {
        setCurrentView("home");
      }
    }
  }, [connected, publicKey]);

  // Listen for hash changes to support direct dashboard navigation
  useEffect(() => {
    const handleHashChange = () => {
      const urlHash = window.location.hash;
      if (urlHash === "#dashboard") {
        setCurrentView("dashboard");
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Mock wallet connection (for backward compatibility)
  const connectWallet = () => {
    // This will be handled by the real wallet connection now
    console.log("Use WalletConnection component instead");
  };

  const disconnectWallet = () => {
    // This will be handled by the real wallet disconnection now
    console.log("Use WalletConnection component instead");
  };

  // 主題切換函數
  const switchTheme = (theme) => {
    const url = new URL(window.location);
    if (theme === 'morandi') {
      url.searchParams.set('theme', 'morandi');
    } else {
      url.searchParams.delete('theme');
    }
    window.history.pushState({}, '', url);
    window.location.reload();
  };

  return (
    <div className={`app min-h-screen flex flex-col ${currentTheme === 'morandi' ? 'theme-morandi' : 'theme-cyberpunk'}`}>
      {/* 添加 Aurora 背景效果 (僅賽博朋克主題) */}
      {currentTheme === 'cyberpunk' && <div className="aurora-bg"></div>}
      
      {/* 主題切換按鈕 */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => switchTheme(currentTheme === 'morandi' ? 'cyberpunk' : 'morandi')}
          className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
            currentTheme === 'morandi'
              ? 'bg-stone-200 text-stone-700 hover:bg-stone-300'
              : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
          }`}
        >
          {currentTheme === 'morandi' ? '🌌 Cyberpunk' : '🎨 Morandi'}
        </button>
      </div>
      
      <div className="flex-grow">
        {currentView === "home" ? (
          <HomePage 
            onConnectWallet={connectWallet}
            walletConnected={connected}
            connecting={connecting}
            currentTheme={currentTheme}
          />
        ) : (
          <Dashboard
            userTickets={userTickets}
            votingStreak={votingStreak}
            onDisconnectWallet={disconnectWallet}
            setUserTickets={setUserTickets}
            setVotingStreak={setVotingStreak}
            walletAddress={publicKey?.toBase58()}
            userDataLoading={userDataLoading}
            currentTheme={currentTheme}
          />
        )}
      </div>
      <Footer />
    </div>
  );
}

export default App;