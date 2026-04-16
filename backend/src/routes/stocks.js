const express = require('express');
const router = express.Router();
const { analyzeStock, analyzeWatchlist } = require('../services/StockAnalysisService');
const { getBenchmarkComparison, getSpyQuote, PERIODS } = require('../services/BenchmarkService');
const { getMacroSnapshot } = require('../services/data/FREDService');
const { getProfile, getDCF, getPriceTarget } = require('../services/data/FMPService');
const cache = require('../services/cache/CacheService');

const DEFAULT_WATCHLIST = () =>
  (process.env.DEFAULT_WATCHLIST || 'AAPL,MSFT,GOOGL,AMZN,NVDA,TSLA,META,JPM,V,JNJ,SPY')
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

// GET /api/stocks/watchlist
router.get('/watchlist', async (req, res, next) => {
  try {
    const tickers = req.query.tickers
      ? req.query.tickers.split(',').map(t => t.trim().toUpperCase()).filter(Boolean)
      : DEFAULT_WATCHLIST();

    const results = await analyzeWatchlist(tickers);
    res.json({ data: results, count: results.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/stocks/:ticker
router.get('/:ticker', async (req, res, next) => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    const result = await analyzeStock(ticker);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/stocks/:ticker/profile
router.get('/:ticker/profile', async (req, res, next) => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    const [profile, dcf, priceTarget] = await Promise.allSettled([
      getProfile(ticker),
      getDCF(ticker),
      getPriceTarget(ticker),
    ]);
    res.json({
      data: {
        profile: profile.status === 'fulfilled' ? profile.value : null,
        dcf: dcf.status === 'fulfilled' ? dcf.value : null,
        priceTarget: priceTarget.status === 'fulfilled' ? priceTarget.value : null,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/stocks/benchmark?tickers=AAPL,MSFT&period=1Y
router.get('/benchmark/compare', async (req, res, next) => {
  try {
    const tickers = req.query.tickers
      ? req.query.tickers.split(',').map(t => t.trim().toUpperCase()).filter(Boolean)
      : DEFAULT_WATCHLIST().slice(0, 5);
    const period = PERIODS[req.query.period] ? req.query.period : '1Y';
    const result = await getBenchmarkComparison(tickers, period);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/stocks/screener?sector=Technology&minScore=70&recommendation=BUY&minMarketCap=1000000000
router.get('/screener/filter', async (req, res, next) => {
  try {
    const { sector, recommendation, classification, minScore, maxScore, minMarketCap } = req.query;
    const allTickers = DEFAULT_WATCHLIST();
    const results = await analyzeWatchlist(allTickers);

    let filtered = results.filter(r => !r.error);

    if (sector) filtered = filtered.filter(r => r.fundamentals?.sector?.toLowerCase() === sector.toLowerCase());
    if (recommendation) filtered = filtered.filter(r => r.recommendation === recommendation.toUpperCase());
    if (classification) filtered = filtered.filter(r => r.classification?.type === classification.toUpperCase());
    if (minScore) filtered = filtered.filter(r => r.score >= parseInt(minScore));
    if (maxScore) filtered = filtered.filter(r => r.score <= parseInt(maxScore));
    if (minMarketCap) filtered = filtered.filter(r => r.fundamentals?.marketCap >= parseFloat(minMarketCap));

    filtered.sort((a, b) => (b.score || 0) - (a.score || 0));

    res.json({ data: filtered, count: filtered.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/stocks/macro/snapshot
router.get('/macro/snapshot', async (req, res, next) => {
  try {
    const [macro, spy] = await Promise.allSettled([getMacroSnapshot(), getSpyQuote()]);
    res.json({
      data: {
        macro: macro.status === 'fulfilled' ? macro.value : null,
        spy: spy.status === 'fulfilled' ? spy.value : null,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/stocks/cache/stats
router.get('/cache/stats', (req, res) => {
  res.json({ data: cache.stats() });
});

// DELETE /api/stocks/cache/clear
router.delete('/cache/clear', (req, res) => {
  cache.clear();
  res.json({ message: 'Cache cleared' });
});

module.exports = router;
