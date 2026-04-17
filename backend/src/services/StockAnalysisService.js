const MockData = require('./data/MockDataService');
const { classifyStock } = require('./classification/ClassificationEngine');
const { scoreStock } = require('./scoring/ScoringEngine');
const cache = require('./cache/CacheService');

const ANALYSIS_TTL = 300;

async function buildFundamentals(ticker) {
  // Return mock fundamentals — used when external APIs are unreachable
  const mock = MockData.getFundamentals(ticker);
  if (mock) return { ...mock, _source: 'demo' };

  // Unknown ticker — return neutral defaults
  return {
    currentPrice: null, marketCap: null, currency: 'USD', exchange: null,
    high52w: null, low52w: null, percentFrom52wHigh: null,
    volumeRatio: null, avgVolume: null,
    peRatio: null, forwardPE: null, priceToBook: null, evToEbitda: null,
    fcfYield: null, dividendYield: null,
    revenueGrowthYoY: null, revenueGrowthPrevYoY: null, epsGrowthYoY: null,
    returnOnEquity: null, returnOnAssets: null, grossMargin: null,
    operatingMargin: null, operatingMarginPrev: null, freeCashFlowMargin: null,
    debtToEquity: null, rsi14: null, macdHistogram: null, priceVs200MA: null,
    epsConsistencyScore: 0.5, lastEarningsSurprisePct: null,
    analystTargetPrice: null, analystTargetUpsidePct: null, analystUpgradeScore: null,
    shortInterestRatio: null,
    sector: null, industry: null, name: ticker, description: null,
    _source: 'unknown',
  };
}

async function analyzeStock(ticker) {
  const cacheKey = `analysis:${ticker.toUpperCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const tickerUpper = ticker.toUpperCase();
  const fundamentals = await buildFundamentals(tickerUpper);

  // Compute analystTargetUpsidePct if not already set
  if (fundamentals.analystTargetPrice && fundamentals.currentPrice && !fundamentals.analystTargetUpsidePct) {
    fundamentals.analystTargetUpsidePct =
      (fundamentals.analystTargetPrice - fundamentals.currentPrice) / fundamentals.currentPrice;
  }

  const classification = classifyStock(tickerUpper, fundamentals);
  const result = { ...scoreStock(tickerUpper, classification, fundamentals), fundamentals };

  cache.set(cacheKey, result, ANALYSIS_TTL);
  return result;
}

async function analyzeWatchlist(tickers) {
  const results = await Promise.allSettled(tickers.map(t => analyzeStock(t)));
  return tickers.map((ticker, i) => ({
    ticker,
    ...(results[i].status === 'fulfilled'
      ? results[i].value
      : { error: results[i].reason?.message || 'Analysis failed' }),
  }));
}

module.exports = { analyzeStock, analyzeWatchlist, buildFundamentals };
