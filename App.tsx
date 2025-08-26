import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import MarketSummary from './components/MarketSummary';
import StockTable from './components/StockTable';
import Footer from './components/Footer';
import DashboardMetrics from './components/DashboardMetrics';
import { Stock } from './types';

const App: React.FC = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [allStocks, setAllStocks] = useState<Stock[]>([]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Header theme={theme} toggleTheme={toggleTheme} />
      <main className="container mx-auto px-4 py-8">
        <HeroSection />
        <MarketSummary />
        <DashboardMetrics stocks={allStocks} />
        <StockTable onStocksChange={setAllStocks} />
      </main>
      <Footer />
    </div>
  );
};

export default App;