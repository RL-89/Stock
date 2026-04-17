const MockData = require('./data/MockDataService');
const cache = require('./cache/CacheService');

const PERIODS = {
  '1M': { days: 30,  label: '1 Month' },
  '3M': { days: 90,  label: '3 Months' },
  '6M': { days: 180, label: '6 Months' },
  '1Y': { days: 365, label: '1 Year' },
};

function normalizeToBase100(pricePoints) {
  if (!pricePoints.length) return [];
  const base = pricePoints[0].close;
  return pricePoints.map(p => ({ ...p, normalized: parseFloat(((p.close / base) * 100).toFixed(2)) }));
}

function computeMetrics(normalized) {
  if (normalized.length < 2) return {};
  const returns = [];
  for (let i = 1; i < normalized.length; i++) {
    returns.push((normalized[i].close - normalized[i - 1].close) / normalized[i - 1].close);
  }
  const totalReturn = (normalized[normalized.length - 1].normalized / 100) - 1;
  const avg = returns.reduce((s, r) => s + r, 0) / returns.length;
  const stdDev = Math.sqrt(returns.reduce((s, r) => s + Math.pow(r - avg, 2), 0) / returns.length);
  const sharpe = stdDev > 0 ? (avg * 252) / (stdDev * Math.sqrt(252)) : 0;

  let maxDrawdown = 0, peak = normalized[0].normalized;
  normalized.forEach(p => {
    if (p.normalized > peak) peak = p.normalized;
    const dd = (peak - p.normalized) / peak;
    if (dd > maxDrawdown) maxDrawdown = dd;
  });

  return {
    totalReturn: parseFloat((totalReturn * 100).toFixed(2)),
    sharpe:      parseFloat(sharpe.toFixed(3)),
    maxDrawdown: parseFloat((maxDrawdown * 100).toFixed(2)),
    volatility:  parseFloat((stdDev * Math.sqrt(252) * 100).toFixed(2)),
  };
}

async function getBenchmarkComparison(tickers, period = '1Y') {
  const cacheKey = `benchmark:${tickers.join(',')}:${period}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const periodConfig = PERIODS[period] || PERIODS['1Y'];
  const allTickers = [...new Set([...tickers, 'SPY'])];

  const series = {};
  const metrics = {};

  allTickers.forEach(ticker => {
    const history = MockData.getHistory(ticker, periodConfig.days);
    if (!history.length) return;
    const normalized = normalizeToBase100(history);
    series[ticker] = normalized.map(p => ({ date: p.date, value: p.normalized, close: p.close }));
    metrics[ticker] = computeMetrics(normalized);
  });

  // Alpha vs SPY
  if (metrics['SPY']) {
    allTickers.filter(t => t !== 'SPY').forEach(ticker => {
      if (metrics[ticker]) {
        metrics[ticker].alpha = parseFloat(
          (metrics[ticker].totalReturn - metrics['SPY'].totalReturn).toFixed(2)
        );
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
  const f = MockData.getFundamentals('SPY');
  return f ? {
    price: f.currentPrice,
    change: -3.41,
    changePercent: -0.59,
    ytd: null,
  } : null;
}

module.exports = { getBenchmarkComparison, getSpyQuote, PERIODS };
