import React, { createContext, useContext, useState, useCallback } from 'react';

const DEFAULT_WATCHLIST = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'JPM', 'V', 'JNJ'];

const WatchlistContext = createContext(null);

export function WatchlistProvider({ children }) {
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem('alpha-engine-watchlist');
      return saved ? JSON.parse(saved) : DEFAULT_WATCHLIST;
    } catch {
      return DEFAULT_WATCHLIST;
    }
  });

  const save = useCallback((list) => {
    setWatchlist(list);
    localStorage.setItem('alpha-engine-watchlist', JSON.stringify(list));
  }, []);

  const addTicker = useCallback((ticker) => {
    const upper = ticker.toUpperCase().trim();
    if (upper && !watchlist.includes(upper)) {
      save([...watchlist, upper]);
    }
  }, [watchlist, save]);

  const removeTicker = useCallback((ticker) => {
    save(watchlist.filter(t => t !== ticker));
  }, [watchlist, save]);

  return (
    <WatchlistContext.Provider value={{ watchlist, addTicker, removeTicker }}>
      {children}
    </WatchlistContext.Provider>
  );
}

export const useWatchlist = () => useContext(WatchlistContext);
