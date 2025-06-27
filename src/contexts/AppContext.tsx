
import React, { createContext, useContext, useState, useEffect } from 'react';
import { StockRecommendation } from '@/types/stock-matcher';

interface SwipeStats {
  totalSwipes: number;
  matches: number;
  passes: number;
  matchRate: number;
}

interface AppContextType {
  watchlist: StockRecommendation[];
  addToWatchlist: (stock: StockRecommendation) => void;
  removeFromWatchlist: (ticker: string) => void;
  isInWatchlist: (ticker: string) => boolean;
  swipeStats: SwipeStats;
  updateSwipeStats: (isMatch: boolean) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [watchlist, setWatchlist] = useState<StockRecommendation[]>([]);
  const [swipeStats, setSwipeStats] = useState<SwipeStats>({
    totalSwipes: 0,
    matches: 0,
    passes: 0,
    matchRate: 0
  });
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedWatchlist = localStorage.getItem('stockMatcher_watchlist');
    const savedStats = localStorage.getItem('stockMatcher_swipeStats');
    const savedDarkMode = localStorage.getItem('stockMatcher_darkMode');

    if (savedWatchlist) {
      setWatchlist(JSON.parse(savedWatchlist));
    }
    if (savedStats) {
      setSwipeStats(JSON.parse(savedStats));
    }
    if (savedDarkMode) {
      setIsDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const addToWatchlist = (stock: StockRecommendation) => {
    const newWatchlist = [...watchlist, stock];
    setWatchlist(newWatchlist);
    localStorage.setItem('stockMatcher_watchlist', JSON.stringify(newWatchlist));
  };

  const removeFromWatchlist = (ticker: string) => {
    const newWatchlist = watchlist.filter(stock => stock.ticker !== ticker);
    setWatchlist(newWatchlist);
    localStorage.setItem('stockMatcher_watchlist', JSON.stringify(newWatchlist));
  };

  const isInWatchlist = (ticker: string) => {
    return watchlist.some(stock => stock.ticker === ticker);
  };

  const updateSwipeStats = (isMatch: boolean) => {
    const newStats = {
      totalSwipes: swipeStats.totalSwipes + 1,
      matches: swipeStats.matches + (isMatch ? 1 : 0),
      passes: swipeStats.passes + (isMatch ? 0 : 1),
      matchRate: 0
    };
    newStats.matchRate = newStats.totalSwipes > 0 ? (newStats.matches / newStats.totalSwipes) * 100 : 0;
    
    setSwipeStats(newStats);
    localStorage.setItem('stockMatcher_swipeStats', JSON.stringify(newStats));
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('stockMatcher_darkMode', JSON.stringify(newDarkMode));
  };

  return (
    <AppContext.Provider value={{
      watchlist,
      addToWatchlist,
      removeFromWatchlist,
      isInWatchlist,
      swipeStats,
      updateSwipeStats,
      isDarkMode,
      toggleDarkMode
    }}>
      {children}
    </AppContext.Provider>
  );
};
