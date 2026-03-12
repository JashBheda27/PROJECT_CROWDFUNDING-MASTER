import React, { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Sidebar, Navbar } from './components';
import { CampaignDetails, CreateCampaign, Home, Profile , Stats , CampaignFinance , Search } from './pages';

const App = () => {
  const [darkMode, setDarkMode] = useState(false);

  // Load saved theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") setDarkMode(true);
  }, []);

  // Apply theme globally
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  return (
    <div className="relative sm:-8 p-4 bg-white dark:bg-[#13131a] min-h-screen flex flex-row transition-colors duration-300">
      
      {/* Sidebar */}
      <div className="sm:flex hidden mr-10 relative">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 max-sm:w-full max-w-[1280px] mx-auto sm:pr-5">
        
        {/* Pass toggle to Navbar */}
        <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/create-campaign" element={<CreateCampaign />} />
          <Route path="/campaign-details/:id" element={<CampaignDetails />} />
          <Route path="/campaign-finance" element={<CampaignFinance />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/search/:query" element={<Search />} />
        </Routes>

      </div>
    </div>
  );
};

export default App;