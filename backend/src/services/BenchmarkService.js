const YF = require('./data/YahooFinanceService');
const cache = require('./cache/CacheService');

const PERIODS = {
  '1M': { days: 30, label: '1 Month' },
  '3M': { days: 90, label: '3 Months' },
  '6M': { days: 180, label: '6 Months' },
  '1Y': { days: 365, label: '1 Year' },
};

function getPeriodStart(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function normalizeToBase100(prices) {
  if (!prices.length) return [];
  const base = prices[0].close;
  return prices.map(p => ({ ...p, normalized: parseFloat(((p.close / base) * 100).toFixed(2)) }));
}

function computeMetrics(normalizedPrices) {
  if (normalizedPrices.length < 2) return {};
  const returns = [];
  for (let i = 1; i < normalizedPrices.length; i++) {
    returns.push((normalizedPrices[i].close - normalizedPrices[i - 1].close) / normalizedPrices[i - 1].close);
  }
  const totalReturn = (normalizedPrices[normalizedPrices.length - 1].normalized / 100) - 1;
  const avgReturn = returns.reduce((s, r) => s + r, 0) / returns.length;
  const stdDev = Math.sqrt(returns.reduce((s, r) => s + Math.pow(r - avgReturn, 2), 0) / returns.length);
  const sharpe = stdDev > 0 ? (avgReturn * 252) / (stdDev * Math.sqrt(252)) : 0;

  let maxDrawdown = 0;
  let peak = normalizedPrices[0].normalized;
  normalizedPrices.forEach(p => {
    if (p.normalized > peak) peak = p.normalized;
    const drawdown = (peak - p.normalized) / peak;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  });

  return {
    totalReturn: parseFloat((totalReturn * 100).toFixed(2)),
    sharpe: parseFloat(sharpe.toFixed(3)),
    maxDrawdown: parseFloat((maxDrawdown * 100).toFixed(2)),
    volatility: parseFloat((stdDev * Math.sqrt(252) * 100).toFixed(2)),
  };
}

async function getBenchmarkComparison(tickers, period = '1Y') {
  const cacheKey = `benchmark:${tickers.join(',')}:${period}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const periodConfig = PERIODS[period] || PERIODS['1Y'];
  const periodStart = getPeriodStart(periodConfig.days);
  const allTickers = [...new Set([...tickers, 'SPY'])];

  const priceData = await Promise.allSettled(
    allTickers.map(t => YF.getHistoricalPrices(t, periodStart))
  );

  const series = {};
  const metrics = {};

  allTickers.forEach((ticker, i) => {
    if (priceData[i].status === 'fulfilled') {
      const prices = priceData[i].value.filter(p => p.close);
      const normalized = normalizeToBase100(prices);
      series[ticker] = normalized.map(p => ({
        date: p.date instanceof Date ? p.date.toISOString().split('T')[0] : p.date,
        value: p.normalized,
        close: parseFloat(p.close.toFixed(2)),
      }));
      metrics[ticker] = computeMetrics(normalized);
    }
  });

  // Compute alpha for each ticker vs SPY
  if (series['SPY']) {
    allTickers.filter(t => t !== 'SPY').forEach(ticker => {
      if (metrics[ticker] && metrics['SPY']) {
        metrics[ticker].alpha = parseFloat(
          (metrics[ticker].totalReturn - metrics['SPY'].totalReturn).toFixed(2)
        );
        metrics[ticker].beta = null; // Requires full covariance calc
      }
    });
  }

  const result = {
    period,
    periodLabel: periodConfig.label,
    series,
    metrics,
    generatedAt: new Date().toISOString(),
  };

  cache.set(cacheKey, result, 300);
  return result;
}

async function getSpyQuote() {
  const quote = await YF.getQuote('SPY');
  return {
    price: quote.regularMarketPrice,
    change: quote.regularMarketChange,
    changePercent: quote.regularMarketChangePercent,
    ytd: quote.ytdReturn,
  };
}

module.exports = { getBenchmarkComparison, getSpyQuote, PERIODS };
