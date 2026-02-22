import React, { useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import HomePage from "./components/HomePage";
import Dashboard from "./components/Dashboard";
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
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setUserDataLoading(false);
      }
    };

    fetchUserData();
  }, [authenticated, walletAddress]);

  // Auto-switch to dashboard when authenticated
  useEffect(() => {
    if (authenticated && walletAddress) {
      setCurrentView("dashboard");
    } else {
      const urlHash = window.location.hash;
      if (urlHash === "#dashboard") {
        setCurrentView("dashboard");
      } else {
        setCurrentView("home");
      }
    }
  }, [authenticated, walletAddress]);

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

  // Show nothing until Privy is ready
  if (!ready) {
    return null;
  }

  return (
    <div className="app min-h-screen flex flex-col">
      <div className="flex-grow">
        {currentView === "home" ? (
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
          />
        )}
      </div>
      <Footer />
    </div>
  );
}

export default App;
