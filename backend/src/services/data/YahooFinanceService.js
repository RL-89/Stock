const cache = require('../cache/CacheService');

let yf;
async function getYF() {
  if (!yf) {
    yf = (await import('yahoo-finance2')).default;
  }
  return yf;
}

const TTL_QUOTES = () => parseInt(process.env.CACHE_TTL_QUOTES || 60);
const TTL_HISTORY = () => parseInt(process.env.CACHE_TTL_FUNDAMENTALS || 3600);

async function getQuote(ticker) {
  const key = `yf:quote:${ticker}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const lib = await getYF();
  const data = await lib.quote(ticker);
  cache.set(key, data, TTL_QUOTES());
  return data;
}

async function getQuoteSummary(ticker, modules = ['summaryDetail', 'defaultKeyStatistics', 'financialData', 'earnings']) {
  const key = `yf:summary:${ticker}:${modules.join(',')}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const lib = await getYF();
  const data = await lib.quoteSummary(ticker, { modules });
  cache.set(key, data, TTL_HISTORY());
  return data;
}

async function getHistoricalPrices(ticker, period1, period2 = new Date(), interval = '1d') {
  const key = `yf:hist:${ticker}:${period1}:${interval}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const lib = await getYF();
  const data = await lib.historical(ticker, { period1, period2, interval });
  cache.set(key, data, TTL_HISTORY());
  return data;
}

async function getMultipleQuotes(tickers) {
  const results = await Promise.allSettled(tickers.map(t => getQuote(t)));
  return tickers.reduce((acc, ticker, i) => {
    acc[ticker] = results[i].status === 'fulfilled' ? results[i].value : null;
    return acc;
  }, {});
}

module.exports = {
  getQuote,
  getQuoteSummary,
  getHistoricalPrices,
  getMultipleQuotes,
};
