import React, { useState, useEffect } from "react";
import MemeNewsPage from "./components/MemeNewsPage";
import ArchivePage from "./components/ArchivePage";
import Footer from "./components/Footer";
import "./index.css";
import "./styles/placeholders.css";

function App() {
  const [currentView, setCurrentView] = useState("home");

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === "#archive") {
        setCurrentView("archive");
      } else {
        setCurrentView("home");
      }
      window.scrollTo(0, 0);
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <div className="app min-h-screen flex flex-col">
      <div className="flex-grow">
        {currentView === "archive" ? (
          <ArchivePage />
        ) : (
          <MemeNewsPage />
        )}
      </div>
      <Footer />
    </div>
  );
}

export default App;
