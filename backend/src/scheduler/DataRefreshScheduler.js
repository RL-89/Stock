const cron = require('node-cron');
const { analyzeWatchlist } = require('../services/StockAnalysisService');
const cache = require('../services/cache/CacheService');

const DEFAULT_WATCHLIST = () =>
  (process.env.DEFAULT_WATCHLIST || 'AAPL,MSFT,GOOGL,AMZN,NVDA,TSLA,META,JPM,V,JNJ,SPY')
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

let isRunning = false;

async function refreshWatchlist() {
  if (isRunning) {
    console.log('[Scheduler] Refresh already in progress, skipping');
    return;
  }
  isRunning = true;
  const tickers = DEFAULT_WATCHLIST();
  console.log(`[Scheduler] Refreshing ${tickers.length} tickers: ${tickers.join(', ')}`);

  try {
    await analyzeWatchlist(tickers);
    console.log('[Scheduler] Refresh complete');
  } catch (err) {
    console.error('[Scheduler] Refresh error:', err.message);
  } finally {
    isRunning = false;
  }
}

function start() {
  // Daily refresh at 6:30 AM EST (after pre-market opens)
  cron.schedule('30 6 * * 1-5', refreshWatchlist, { timezone: 'America/New_York' });

  // Mid-day refresh at 12:00 PM EST
  cron.schedule('0 12 * * 1-5', refreshWatchlist, { timezone: 'America/New_York' });

  // Post-market refresh at 5:00 PM EST
  cron.schedule('0 17 * * 1-5', refreshWatchlist, { timezone: 'America/New_York' });

  console.log('[Scheduler] Data refresh jobs registered');

  // Warm cache on startup
  setTimeout(refreshWatchlist, 5000);
}

module.exports = { start, refreshWatchlist };
