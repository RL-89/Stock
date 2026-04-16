const axios = require('axios');
const cache = require('../cache/CacheService');

const BASE_URL = 'https://api.stlouisfed.org/fred/series/observations';
const API_KEY = () => process.env.FRED_API_KEY || 'demo';
const TTL = () => parseInt(process.env.CACHE_TTL_MACRO || 86400);

async function fetchSeries(seriesId, limit = 1) {
  const key = `fred:${seriesId}:${limit}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const { data } = await axios.get(BASE_URL, {
    params: {
      series_id: seriesId,
      api_key: API_KEY(),
      file_type: 'json',
      sort_order: 'desc',
      limit,
    },
    timeout: 10000,
  });

  cache.set(key, data.observations, TTL());
  return data.observations;
}

async function getRiskFreeRate() {
  // 3-Month Treasury Bill Secondary Market Rate
  const obs = await fetchSeries('DTB3');
  const latest = obs.find(o => o.value !== '.');
  return latest ? parseFloat(latest.value) / 100 : 0.05;
}

async function getCPI() {
  // Consumer Price Index for All Urban Consumers
  const obs = await fetchSeries('CPIAUCSL', 2);
  if (obs.length < 2) return null;
  const [current, previous] = obs.filter(o => o.value !== '.');
  return {
    current: parseFloat(current.value),
    previous: parseFloat(previous.value),
    yoy: ((parseFloat(current.value) - parseFloat(previous.value)) / parseFloat(previous.value)) * 100,
  };
}

async function getFedFundsRate() {
  const obs = await fetchSeries('FEDFUNDS');
  const latest = obs.find(o => o.value !== '.');
  return latest ? parseFloat(latest.value) / 100 : 0.05;
}

async function getMacroSnapshot() {
  const [riskFreeRate, cpi, fedFunds] = await Promise.allSettled([
    getRiskFreeRate(),
    getCPI(),
    getFedFundsRate(),
  ]);

  return {
    riskFreeRate: riskFreeRate.status === 'fulfilled' ? riskFreeRate.value : 0.05,
    cpi: cpi.status === 'fulfilled' ? cpi.value : null,
    fedFundsRate: fedFunds.status === 'fulfilled' ? fedFunds.value : 0.05,
  };
}

module.exports = { getRiskFreeRate, getCPI, getFedFundsRate, getMacroSnapshot };
