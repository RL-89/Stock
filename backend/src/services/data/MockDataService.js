// Realistic demo fundamentals + simulated price history.
// Used when external APIs (Yahoo Finance, Alpha Vantage, FMP) are unreachable.

const MOCK_FUNDAMENTALS = {
  AAPL: {
    currentPrice: 210.62, marketCap: 3.18e12, currency: 'USD', exchange: 'NASDAQ',
    high52w: 237.49, low52w: 164.08, dividendYield: 0.005,
    peRatio: 33.1, forwardPE: 28.4, priceToBook: 51.2, evToEbitda: 24.8,
    returnOnEquity: 1.47, returnOnAssets: 0.22, grossMargin: 0.461,
    operatingMargin: 0.314, freeCashFlowMargin: 0.268, debtToEquity: 1.51,
    revenueGrowthYoY: 0.061, revenueGrowthPrevYoY: 0.028, epsGrowthYoY: 0.108,
    rsi14: 48.3, macdHistogram: -0.62, priceVs200MA: -0.043,
    percentFrom52wHigh: -0.114, volumeRatio: 0.92,
    epsConsistencyScore: 0.875, lastEarningsSurprisePct: 0.042,
    analystTargetPrice: 235.0, shortInterestRatio: 0.007,
    sector: 'Technology', industry: 'Consumer Electronics',
    name: 'Apple Inc.', description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
  },
  MSFT: {
    currentPrice: 417.84, marketCap: 3.10e12, currency: 'USD', exchange: 'NASDAQ',
    high52w: 468.35, low52w: 385.58, dividendYield: 0.007,
    peRatio: 35.2, forwardPE: 29.8, priceToBook: 12.8, evToEbitda: 25.6,
    returnOnEquity: 0.382, returnOnAssets: 0.168, grossMargin: 0.694,
    operatingMargin: 0.448, freeCashFlowMargin: 0.312, debtToEquity: 0.31,
    revenueGrowthYoY: 0.158, revenueGrowthPrevYoY: 0.132, epsGrowthYoY: 0.193,
    rsi14: 54.1, macdHistogram: 0.84, priceVs200MA: 0.028,
    percentFrom52wHigh: -0.108, volumeRatio: 1.12,
    epsConsistencyScore: 1.0, lastEarningsSurprisePct: 0.071,
    analystTargetPrice: 500.0, shortInterestRatio: 0.005,
    sector: 'Technology', industry: 'Software—Infrastructure',
    name: 'Microsoft Corporation', description: 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide. Cloud & AI growth driven by Azure.',
  },
  GOOGL: {
    currentPrice: 167.28, marketCap: 2.07e12, currency: 'USD', exchange: 'NASDAQ',
    high52w: 207.05, low52w: 155.63, dividendYield: 0.0,
    peRatio: 21.4, forwardPE: 18.2, priceToBook: 6.9, evToEbitda: 15.3,
    returnOnEquity: 0.295, returnOnAssets: 0.148, grossMargin: 0.572,
    operatingMargin: 0.318, freeCashFlowMargin: 0.241, debtToEquity: 0.09,
    revenueGrowthYoY: 0.124, revenueGrowthPrevYoY: 0.098, epsGrowthYoY: 0.313,
    rsi14: 42.6, macdHistogram: -1.14, priceVs200MA: -0.091,
    percentFrom52wHigh: -0.192, volumeRatio: 1.08,
    epsConsistencyScore: 0.875, lastEarningsSurprisePct: 0.094,
    analystTargetPrice: 210.0, shortInterestRatio: 0.006,
    sector: 'Communication Services', industry: 'Internet Content & Information',
    name: 'Alphabet Inc.', description: 'Alphabet Inc. provides online advertising services, cloud computing, and consumer electronics. Google Search and YouTube are core revenue drivers.',
  },
  AMZN: {
    currentPrice: 196.35, marketCap: 2.10e12, currency: 'USD', exchange: 'NASDAQ',
    high52w: 242.06, low52w: 168.59, dividendYield: 0.0,
    peRatio: 38.7, forwardPE: 28.4, priceToBook: 9.4, evToEbitda: 18.2,
    returnOnEquity: 0.214, returnOnAssets: 0.072, grossMargin: 0.483,
    operatingMargin: 0.111, freeCashFlowMargin: 0.089, debtToEquity: 0.42,
    revenueGrowthYoY: 0.111, revenueGrowthPrevYoY: 0.128, epsGrowthYoY: 0.841,
    rsi14: 39.4, macdHistogram: -2.31, priceVs200MA: -0.118,
    percentFrom52wHigh: -0.189, volumeRatio: 1.24,
    epsConsistencyScore: 0.75, lastEarningsSurprisePct: 0.098,
    analystTargetPrice: 255.0, shortInterestRatio: 0.009,
    sector: 'Consumer Cyclical', industry: 'Internet Retail',
    name: 'Amazon.com, Inc.', description: 'Amazon.com operates as a technology and e-commerce company. AWS is the dominant cloud platform globally with strong margin expansion.',
  },
  NVDA: {
    currentPrice: 875.39, marketCap: 2.15e12, currency: 'USD', exchange: 'NASDAQ',
    high52w: 974.00, low52w: 462.36, dividendYield: 0.0004,
    peRatio: 64.8, forwardPE: 32.1, priceToBook: 37.6, evToEbitda: 55.4,
    returnOnEquity: 0.731, returnOnAssets: 0.511, grossMargin: 0.748,
    operatingMargin: 0.618, freeCashFlowMargin: 0.534, debtToEquity: 0.18,
    revenueGrowthYoY: 1.221, revenueGrowthPrevYoY: 0.842, epsGrowthYoY: 2.681,
    rsi14: 58.2, macdHistogram: 3.42, priceVs200MA: 0.127,
    percentFrom52wHigh: -0.101, volumeRatio: 1.31,
    epsConsistencyScore: 1.0, lastEarningsSurprisePct: 0.185,
    analystTargetPrice: 1100.0, shortInterestRatio: 0.014,
    sector: 'Technology', industry: 'Semiconductors',
    name: 'NVIDIA Corporation', description: 'NVIDIA Corporation designs and manufactures graphics processing units and system-on-chip units. Dominant AI/data center GPU provider.',
  },
  TSLA: {
    currentPrice: 172.45, marketCap: 5.51e11, currency: 'USD', exchange: 'NASDAQ',
    high52w: 414.50, low52w: 138.80, dividendYield: 0.0,
    peRatio: 58.4, forwardPE: 86.2, priceToBook: 9.8, evToEbitda: 44.6,
    returnOnEquity: 0.082, returnOnAssets: 0.041, grossMargin: 0.178,
    operatingMargin: 0.062, freeCashFlowMargin: 0.022, debtToEquity: 0.11,
    revenueGrowthYoY: -0.013, revenueGrowthPrevYoY: 0.189, epsGrowthYoY: -0.711,
    rsi14: 43.7, macdHistogram: -1.84, priceVs200MA: -0.264,
    percentFrom52wHigh: -0.584, volumeRatio: 1.44,
    epsConsistencyScore: 0.375, lastEarningsSurprisePct: -0.082,
    analystTargetPrice: 295.0, shortInterestRatio: 0.038,
    sector: 'Consumer Cyclical', industry: 'Auto Manufacturers',
    name: 'Tesla, Inc.', description: 'Tesla designs, develops, manufactures and sells electric vehicles and energy storage systems.',
  },
  META: {
    currentPrice: 584.69, marketCap: 1.48e12, currency: 'USD', exchange: 'NASDAQ',
    high52w: 638.40, low52w: 392.31, dividendYield: 0.004,
    peRatio: 27.3, forwardPE: 22.8, priceToBook: 8.9, evToEbitda: 18.9,
    returnOnEquity: 0.384, returnOnAssets: 0.194, grossMargin: 0.818,
    operatingMargin: 0.432, freeCashFlowMargin: 0.348, debtToEquity: 0.12,
    revenueGrowthYoY: 0.219, revenueGrowthPrevYoY: 0.241, epsGrowthYoY: 0.511,
    rsi14: 60.4, macdHistogram: 1.21, priceVs200MA: 0.062,
    percentFrom52wHigh: -0.084, volumeRatio: 0.88,
    epsConsistencyScore: 1.0, lastEarningsSurprisePct: 0.127,
    analystTargetPrice: 720.0, shortInterestRatio: 0.007,
    sector: 'Communication Services', industry: 'Internet Content & Information',
    name: 'Meta Platforms, Inc.', description: 'Meta Platforms builds technology to connect people. Facebook, Instagram, and WhatsApp dominate social media with strong advertising monetization.',
  },
  JPM: {
    currentPrice: 228.14, marketCap: 6.52e11, currency: 'USD', exchange: 'NYSE',
    high52w: 280.25, low52w: 184.00, dividendYield: 0.024,
    peRatio: 13.2, forwardPE: 12.4, priceToBook: 2.1, evToEbitda: null,
    returnOnEquity: 0.172, returnOnAssets: 0.012, grossMargin: null,
    operatingMargin: 0.348, freeCashFlowMargin: null, debtToEquity: 1.18,
    revenueGrowthYoY: 0.082, revenueGrowthPrevYoY: 0.214, epsGrowthYoY: 0.044,
    rsi14: 46.8, macdHistogram: -0.74, priceVs200MA: -0.052,
    percentFrom52wHigh: -0.186, volumeRatio: 1.02,
    epsConsistencyScore: 0.875, lastEarningsSurprisePct: 0.051,
    analystTargetPrice: 270.0, shortInterestRatio: 0.008,
    sector: 'Financial Services', industry: 'Banks—Diversified',
    name: 'JPMorgan Chase & Co.', description: 'JPMorgan Chase is a global financial services firm with assets of $3.9 trillion and operations worldwide.',
  },
  V: {
    currentPrice: 322.18, marketCap: 6.78e11, currency: 'USD', exchange: 'NYSE',
    high52w: 365.07, low52w: 256.56, dividendYield: 0.008,
    peRatio: 30.8, forwardPE: 26.4, priceToBook: 14.6, evToEbitda: 23.1,
    returnOnEquity: 0.448, returnOnAssets: 0.184, grossMargin: 0.806,
    operatingMargin: 0.658, freeCashFlowMargin: 0.512, debtToEquity: 0.52,
    revenueGrowthYoY: 0.098, revenueGrowthPrevYoY: 0.114, epsGrowthYoY: 0.124,
    rsi14: 52.1, macdHistogram: 0.28, priceVs200MA: 0.018,
    percentFrom52wHigh: -0.119, volumeRatio: 0.97,
    epsConsistencyScore: 1.0, lastEarningsSurprisePct: 0.038,
    analystTargetPrice: 385.0, shortInterestRatio: 0.006,
    sector: 'Financial Services', industry: 'Credit Services',
    name: 'Visa Inc.', description: 'Visa Inc. operates the world\'s largest retail electronic payments network. The asset-light model generates exceptional free cash flow.',
  },
  JNJ: {
    currentPrice: 152.84, marketCap: 3.67e11, currency: 'USD', exchange: 'NYSE',
    high52w: 175.50, low52w: 144.95, dividendYield: 0.033,
    peRatio: 16.1, forwardPE: 14.8, priceToBook: 5.4, evToEbitda: 11.8,
    returnOnEquity: 0.238, returnOnAssets: 0.082, grossMargin: 0.688,
    operatingMargin: 0.211, freeCashFlowMargin: 0.184, debtToEquity: 0.44,
    revenueGrowthYoY: 0.031, revenueGrowthPrevYoY: 0.068, epsGrowthYoY: -0.104,
    rsi14: 44.3, macdHistogram: -0.38, priceVs200MA: -0.068,
    percentFrom52wHigh: -0.129, volumeRatio: 0.84,
    epsConsistencyScore: 0.625, lastEarningsSurprisePct: 0.018,
    analystTargetPrice: 178.0, shortInterestRatio: 0.009,
    sector: 'Healthcare', industry: 'Drug Manufacturers—General',
    name: 'Johnson & Johnson', description: 'Johnson & Johnson is a global healthcare company operating in pharmaceuticals, MedTech, and consumer health products.',
  },
  SPY: {
    currentPrice: 574.82, marketCap: 5.61e11, currency: 'USD', exchange: 'NYSE',
    high52w: 613.23, low52w: 491.52, dividendYield: 0.013,
    peRatio: 24.1, forwardPE: 21.3, priceToBook: 4.1, evToEbitda: null,
    returnOnEquity: null, returnOnAssets: null, grossMargin: null,
    operatingMargin: null, freeCashFlowMargin: null, debtToEquity: null,
    revenueGrowthYoY: 0.065, revenueGrowthPrevYoY: 0.052, epsGrowthYoY: 0.092,
    rsi14: 49.8, macdHistogram: -0.84, priceVs200MA: -0.018,
    percentFrom52wHigh: -0.062, volumeRatio: 1.04,
    epsConsistencyScore: 0.75, lastEarningsSurprisePct: 0.021,
    analystTargetPrice: null, shortInterestRatio: 0.002,
    sector: 'Index', industry: 'S&P 500 ETF',
    name: 'SPDR S&P 500 ETF Trust', description: 'The SPDR S&P 500 ETF Trust tracks the S&P 500 index, providing diversified exposure to large-cap U.S. equities.',
  },
};

// Generate a realistic price series for benchmark chart
function generatePriceHistory(startPrice, days, trend = 0.0003, volatility = 0.012) {
  const history = [];
  let price = startPrice * (1 - trend * days); // back-calculate start
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    // Skip weekends
    if (d.getDay() === 0 || d.getDay() === 6) continue;

    const dailyReturn = trend + volatility * (Math.random() * 2 - 1);
    price = price * (1 + dailyReturn);
    const open  = price * (1 + volatility * (Math.random() * 0.4 - 0.2));
    const close = price;
    const high  = Math.max(open, close) * (1 + Math.random() * volatility);
    const low   = Math.min(open, close) * (1 - Math.random() * volatility);
    history.push({
      date: d.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low:  parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      adjClose: parseFloat(close.toFixed(2)),
      volume: Math.round(5e6 + Math.random() * 15e6),
    });
  }
  return history;
}

const PRICE_PARAMS = {
  AAPL:  { trend: 0.00020, vol: 0.014 },
  MSFT:  { trend: 0.00035, vol: 0.013 },
  GOOGL: { trend: 0.00018, vol: 0.015 },
  AMZN:  { trend: 0.00022, vol: 0.016 },
  NVDA:  { trend: 0.00120, vol: 0.028 },
  TSLA:  { trend: -0.00040, vol: 0.034 },
  META:  { trend: 0.00065, vol: 0.018 },
  JPM:   { trend: 0.00030, vol: 0.014 },
  V:     { trend: 0.00025, vol: 0.011 },
  JNJ:   { trend: -0.00015, vol: 0.010 },
  SPY:   { trend: 0.00028, vol: 0.010 },
};

const _historyCache = {};

function getHistory(ticker, days = 365) {
  const key = `${ticker}:${days}`;
  if (!_historyCache[key]) {
    const p = PRICE_PARAMS[ticker] || { trend: 0.0002, vol: 0.015 };
    const f = MOCK_FUNDAMENTALS[ticker];
    const startPrice = f ? f.currentPrice : 100;
    _historyCache[key] = generatePriceHistory(startPrice, days, p.trend, p.vol);
  }
  return _historyCache[key];
}

function getFundamentals(ticker) {
  return MOCK_FUNDAMENTALS[ticker.toUpperCase()] || null;
}

function hasMockData(ticker) {
  return ticker.toUpperCase() in MOCK_FUNDAMENTALS;
}

module.exports = { getFundamentals, getHistory, hasMockData, MOCK_FUNDAMENTALS };
