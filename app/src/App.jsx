import React, { useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import HomePage from "./components/HomePage";
import Dashboard from "./components/Dashboard";
import AgentPage from "./components/AgentPage";
import WikiPage from "./components/WikiPage";
import PublicGalleryPage from "./components/PublicGalleryPage";
import PublicLabPage from "./components/PublicLabPage";
import Footer from "./components/Footer";
import "./index.css";
import "./styles/placeholders.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://memeforge-api-836651762884.asia-southeast1.run.app";

function App() {
  const { authenticated, ready, walletAddress } = useAuth();
  const [currentView, setCurrentView] = useState("home");
  const [userTickets, setUserTickets] = useState(0);
  const [votingStreak, setVotingStreak] = useState(0);
  const [lotteryOptIn, setLotteryOptIn] = useState(true);
  const [nftWins, setNftWins] = useState([]);
  const [userDataLoading, setUserDataLoading] = useState(false);

  // Capture ?ref= URL param on mount (supports both referral IDs and wallet addresses)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (!ref) return;

    const cleanUrl = () => {
      const url = new URL(window.location.href);
      url.searchParams.delete('ref');
      window.history.replaceState({}, '', url.pathname + url.hash);
    };

    if (/^[a-zA-Z0-9]{3,8}$/.test(ref) && !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(ref)) {
      // Short referral ID — resolve to wallet via API
      fetch(`${API_BASE_URL}/api/referral/${ref}`)
        .then(r => r.json())
        .then(data => {
          if (data.success && data.wallet) {
            localStorage.setItem('pendingReferrer', data.wallet);
          }
        })
        .catch(console.error)
        .finally(cleanUrl);
    } else if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(ref)) {
      // Raw wallet address (backward compat)
      localStorage.setItem('pendingReferrer', ref);
      cleanUrl();
    } else {
      cleanUrl();
    }
  }, []);

  // Fetch user data from API when wallet connects
  useEffect(() => {
    console.log("App useEffect: authenticated=", authenticated, "walletAddress=", walletAddress);

    const fetchUserData = async () => {
      if (!authenticated || !walletAddress) {
        console.log("Skipping user fetch: not authenticated");
        return;
      }

      setUserDataLoading(true);

      try {
        console.log("Fetching user data:", walletAddress);
        const response = await fetch(`${API_BASE_URL}/api/users/${walletAddress}`);
        const data = await response.json();

        if (data.success && data.user) {
          setUserTickets(data.user.weeklyTickets || 0);
          setVotingStreak(data.user.streakDays || 0);
          setLotteryOptIn(data.user.lotteryOptIn !== false);
          setNftWins(data.user.nftWins || []);

          // Auto-submit pending referrer if user has none
          if (!data.user.referredBy) {
            const pendingRef = localStorage.getItem('pendingReferrer');
            if (pendingRef && pendingRef !== walletAddress) {
              try {
                const refRes = await fetch(`${API_BASE_URL}/api/users/${walletAddress}/set-referrer`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ referrerWallet: pendingRef })
                });
                const refData = await refRes.json();
                if (refData.success) {
                  console.log('Referrer set automatically:', pendingRef);
                  localStorage.removeItem('pendingReferrer');
                }
              } catch (e) {
                console.error('Auto set-referrer failed:', e);
              }
            }
          } else {
            // Already has referrer, clear pending
            localStorage.removeItem('pendingReferrer');
          }
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setUserDataLoading(false);
      }
    };

    fetchUserData();
  }, [authenticated, walletAddress]);

  // Auto-switch to dashboard when authenticated, respect hash routes
  useEffect(() => {
    const urlHash = window.location.hash;
    if (urlHash === "#agent") {
      setCurrentView("agent");
    } else if (urlHash === "#wiki") {
      setCurrentView("wiki");
    } else if (urlHash === "#gallery") {
      setCurrentView("gallery");
    } else if (urlHash === "#lab") {
      setCurrentView(authenticated && walletAddress ? "dashboard" : "lab");
    } else if (authenticated && walletAddress) {
      setCurrentView("dashboard");
    } else {
      setCurrentView("home");
    }
  }, [authenticated, walletAddress]);

  // Listen for hash changes to support direct dashboard navigation
  useEffect(() => {
    const handleHashChange = () => {
      const urlHash = window.location.hash;
      if (urlHash === "#agent") {
        setCurrentView("agent");
      } else if (urlHash === "#wiki") {
        setCurrentView("wiki");
      } else if (urlHash === "#gallery") {
        setCurrentView("gallery");
      } else if (urlHash === "#lab") {
        setCurrentView(authenticated && walletAddress ? "dashboard" : "lab");
      } else if (urlHash === "#invite" || urlHash === "#dashboard") {
        setCurrentView(authenticated && walletAddress ? "dashboard" : "home");
      } else if (urlHash === "" || urlHash === "#") {
        setCurrentView(authenticated && walletAddress ? "dashboard" : "home");
      }
      window.scrollTo(0, 0);
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [authenticated, walletAddress]);

  // Show nothing until Privy is ready
  if (!ready) {
    return null;
  }

  return (
    <div className="app min-h-screen flex flex-col">
      <div className="flex-grow">
        {currentView === "agent" ? (
          <AgentPage />
        ) : currentView === "wiki" ? (
          <WikiPage />
        ) : currentView === "gallery" ? (
          <PublicGalleryPage />
        ) : currentView === "lab" ? (
          <PublicLabPage />
        ) : currentView === "home" ? (
          <HomePage
            walletConnected={authenticated}
          />
        ) : (
          <Dashboard
            userTickets={userTickets}
            votingStreak={votingStreak}
            lotteryOptIn={lotteryOptIn}
            setLotteryOptIn={setLotteryOptIn}
            nftWins={nftWins}
            setUserTickets={setUserTickets}
            setVotingStreak={setVotingStreak}
            walletAddress={walletAddress}
            userDataLoading={userDataLoading}
            initialTab={window.location.hash === '#invite' ? 'referral' : window.location.hash === '#lab' ? 'lab' : undefined}
          />
        )}
      </div>
      <Footer />
    </div>
  );
}

export default App;
