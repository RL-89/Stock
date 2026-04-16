import { useState, useEffect, useCallback } from 'react';
import { stocksApi } from '../services/api';

export function useWatchlistData(tickers, refreshInterval = 60000) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetch = useCallback(async () => {
    if (!tickers?.length) return;
    try {
      const res = await stocksApi.getWatchlist(tickers);
      setData(res.data || []);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err?.message || 'Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  }, [tickers?.join(',')]);

  useEffect(() => {
    setLoading(true);
    fetch();
    const interval = setInterval(fetch, refreshInterval);
    return () => clearInterval(interval);
  }, [fetch, refreshInterval]);

  return { data, loading, error, lastUpdated, refresh: fetch };
}

export function useStockDetail(ticker) {
  const [data, setData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setError(null);

    Promise.allSettled([
      stocksApi.getStock(ticker),
      stocksApi.getStockProfile(ticker),
    ]).then(([analysis, prof]) => {
      if (analysis.status === 'fulfilled') setData(analysis.value.data);
      if (prof.status === 'fulfilled') setProfile(prof.value.data);
      if (analysis.status === 'rejected') setError(analysis.reason?.message);
    }).finally(() => setLoading(false));
  }, [ticker]);

  return { data, profile, loading, error };
}

export function useBenchmark(tickers, period = '1Y') {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tickers?.length) return;
    setLoading(true);
    stocksApi.getBenchmark(tickers, period)
      .then(res => { setData(res.data); setError(null); })
      .catch(err => setError(err?.message))
      .finally(() => setLoading(false));
  }, [tickers?.join(','), period]);

  return { data, loading, error };
}

export function useMacro() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    stocksApi.getMacro()
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

export function useScreener(filters) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(async (filterParams) => {
    setLoading(true);
    setError(null);
    try {
      const res = await stocksApi.screen(filterParams);
      setResults(res.data || []);
    } catch (err) {
      setError(err?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, error, run };
}
