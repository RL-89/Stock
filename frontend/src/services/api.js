import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

api.interceptors.response.use(
  res => res.data,
  err => Promise.reject(err.response?.data?.error || err)
);

export const stocksApi = {
  getWatchlist: (tickers) =>
    api.get('/stocks/watchlist', { params: tickers ? { tickers: tickers.join(',') } : {} }),

  getStock: (ticker) =>
    api.get(`/stocks/${ticker}`),

  getStockProfile: (ticker) =>
    api.get(`/stocks/${ticker}/profile`),

  getBenchmark: (tickers, period = '1Y') =>
    api.get('/stocks/benchmark/compare', { params: { tickers: tickers.join(','), period } }),

  screen: (filters) =>
    api.get('/stocks/screener/filter', { params: filters }),

  getMacro: () =>
    api.get('/stocks/macro/snapshot'),

  getCacheStats: () =>
    api.get('/stocks/cache/stats'),

  clearCache: () =>
    api.delete('/stocks/cache/clear'),
};
