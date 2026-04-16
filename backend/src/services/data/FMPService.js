const axios = require('axios');
const cache = require('../cache/CacheService');

const BASE_URL = 'https://financialmodelingprep.com/api/v3';
const API_KEY = () => process.env.FMP_API_KEY || 'demo';
const TTL = () => parseInt(process.env.CACHE_TTL_FUNDAMENTALS || 3600);

async function fetchFMP(path, params = {}) {
  const key = `fmp:${path}:${JSON.stringify(params)}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const { data } = await axios.get(`${BASE_URL}${path}`, {
    params: { ...params, apikey: API_KEY() },
    timeout: 15000,
  });

  cache.set(key, data, TTL());
  return data;
}

async function getDCF(ticker) {
  return fetchFMP(`/discounted-cash-flow/${ticker}`);
}

async function getFinancialRatios(ticker, limit = 4) {
  return fetchFMP(`/ratios/${ticker}`, { limit });
}

async function getKeyMetrics(ticker, limit = 4) {
  return fetchFMP(`/key-metrics/${ticker}`, { limit });
}

async function getEnterpriseValue(ticker, limit = 4) {
  return fetchFMP(`/enterprise-values/${ticker}`, { limit });
}

async function getGrowthMetrics(ticker, limit = 4) {
  return fetchFMP(`/financial-growth/${ticker}`, { limit });
}

async function getProfile(ticker) {
  const data = await fetchFMP(`/profile/${ticker}`);
  return Array.isArray(data) ? data[0] : data;
}

async function getAnalystRatings(ticker) {
  return fetchFMP(`/analyst-stock-recommendations/${ticker}`, { limit: 5 });
}

async function getPriceTarget(ticker) {
  const data = await fetchFMP(`/price-target-consensus/${ticker}`);
  return Array.isArray(data) ? data[0] : data;
}

module.exports = {
  getDCF,
  getFinancialRatios,
  getKeyMetrics,
  getEnterpriseValue,
  getGrowthMetrics,
  getProfile,
  getAnalystRatings,
  getPriceTarget,
};
