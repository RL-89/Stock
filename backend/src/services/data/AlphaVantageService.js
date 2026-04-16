const axios = require('axios');
const cache = require('../cache/CacheService');

const BASE_URL = 'https://www.alphavantage.co/query';
const API_KEY = () => process.env.ALPHA_VANTAGE_API_KEY || 'demo';
const TTL_FUNDAMENTALS = () => parseInt(process.env.CACHE_TTL_FUNDAMENTALS || 3600);
const TTL_QUOTES = () => parseInt(process.env.CACHE_TTL_QUOTES || 60);

async function fetch(params) {
  const key = `av:${JSON.stringify(params)}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const { data } = await axios.get(BASE_URL, {
    params: { ...params, apikey: API_KEY() },
    timeout: 15000,
  });

  if (data['Note'] || data['Information']) {
    throw new Error(`Alpha Vantage rate limit: ${data['Note'] || data['Information']}`);
  }

  const ttl = params.function?.includes('QUOTE') ? TTL_QUOTES() : TTL_FUNDAMENTALS();
  cache.set(key, data, ttl);
  return data;
}

async function getOverview(ticker) {
  return fetch({ function: 'OVERVIEW', symbol: ticker });
}

async function getIncomeStatement(ticker) {
  return fetch({ function: 'INCOME_STATEMENT', symbol: ticker });
}

async function getBalanceSheet(ticker) {
  return fetch({ function: 'BALANCE_SHEET', symbol: ticker });
}

async function getCashFlow(ticker) {
  return fetch({ function: 'CASH_FLOW', symbol: ticker });
}

async function getEarnings(ticker) {
  return fetch({ function: 'EARNINGS', symbol: ticker });
}

async function getDailyPrices(ticker, outputsize = 'compact') {
  return fetch({ function: 'TIME_SERIES_DAILY_ADJUSTED', symbol: ticker, outputsize });
}

async function getGlobalQuote(ticker) {
  return fetch({ function: 'GLOBAL_QUOTE', symbol: ticker });
}

async function getRSI(ticker, interval = 'daily', timePeriod = 14) {
  return fetch({
    function: 'RSI',
    symbol: ticker,
    interval,
    time_period: timePeriod,
    series_type: 'close',
  });
}

async function getMACD(ticker, interval = 'daily') {
  return fetch({
    function: 'MACD',
    symbol: ticker,
    interval,
    series_type: 'close',
  });
}

async function getSMA(ticker, interval = 'daily', timePeriod = 50) {
  return fetch({
    function: 'SMA',
    symbol: ticker,
    interval,
    time_period: timePeriod,
    series_type: 'close',
  });
}

module.exports = {
  getOverview,
  getIncomeStatement,
  getBalanceSheet,
  getCashFlow,
  getEarnings,
  getDailyPrices,
  getGlobalQuote,
  getRSI,
  getMACD,
  getSMA,
};
