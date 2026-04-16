const AV = require('./data/AlphaVantageService');
const YF = require('./data/YahooFinanceService');
const FRED = require('./data/FREDService');
const FMP = require('./data/FMPService');
const { classifyStock } = require('./classification/ClassificationEngine');
const { scoreStock } = require('./scoring/ScoringEngine');
const cache = require('./cache/CacheService');

const ANALYSIS_TTL = 300; // 5 minutes

function safeNum(val) {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function computeEpsConsistency(quarterlyEarnings) {
  if (!Array.isArray(quarterlyEarnings) || quarterlyEarnings.length < 4) return 0.5;
  const beats = quarterlyEarnings.slice(0, 8).filter(q => {
    const reported = safeNum(q.reportedEPS);
    const estimated = safeNum(q.estimatedEPS);
    return reported !== null && estimated !== null && reported >= estimated;
  });
  return beats.length / Math.min(8, quarterlyEarnings.length);
}

async function buildFundamentals(ticker) {
  const [overview, quote, summary, fmpKeyMetrics, fmpGrowth, fmpRatios, avRsi, avMacd, avSma200] =
    await Promise.allSettled([
      AV.getOverview(ticker),
      YF.getQuote(ticker),
      YF.getQuoteSummary(ticker, ['summaryDetail', 'defaultKeyStatistics', 'financialData', 'earnings']),
      FMP.getKeyMetrics(ticker, 4).catch(() => null),
      FMP.getGrowthMetrics(ticker, 4).catch(() => null),
      FMP.getFinancialRatios(ticker, 4).catch(() => null),
      AV.getRSI(ticker).catch(() => null),
      AV.getMACD(ticker).catch(() => null),
      AV.getSMA(ticker, 'daily', 200).catch(() => null),
    ]);

  const ov = overview.status === 'fulfilled' ? overview.value : {};
  const q = quote.status === 'fulfilled' ? quote.value : {};
  const sm = summary.status === 'fulfilled' ? summary.value : {};
  const km = fmpKeyMetrics.status === 'fulfilled' && fmpKeyMetrics.value?.[0] ? fmpKeyMetrics.value[0] : {};
  const gr = fmpGrowth.status === 'fulfilled' && fmpGrowth.value?.[0] ? fmpGrowth.value[0] : {};
  const gr2 = fmpGrowth.status === 'fulfilled' && fmpGrowth.value?.[1] ? fmpGrowth.value[1] : {};
  const ra = fmpRatios.status === 'fulfilled' && fmpRatios.value?.[0] ? fmpRatios.value[0] : {};

  const fd = sm.financialData || {};
  const sd = sm.summaryDetail || {};
  const ks = sm.defaultKeyStatistics || {};
  const earnings = sm.earnings || {};

  // Technical indicators
  let rsi14 = null, macdHistogram = null, priceVs200MA = null;

  if (avRsi.status === 'fulfilled' && avRsi.value) {
    const rsiData = avRsi.value['Technical Analysis: RSI'];
    if (rsiData) {
      const latest = Object.values(rsiData)[0];
      rsi14 = safeNum(latest?.RSI);
    }
  }

  if (avMacd.status === 'fulfilled' && avMacd.value) {
    const macdData = avMacd.value['Technical Analysis: MACD'];
    if (macdData) {
      const latest = Object.values(macdData)[0];
      macdHistogram = safeNum(latest?.MACD_Hist);
    }
  }

  if (avSma200.status === 'fulfilled' && avSma200.value) {
    const smaData = avSma200.value['Technical Analysis: SMA'];
    if (smaData) {
      const latest = Object.values(smaData)[0];
      const sma200 = safeNum(latest?.SMA);
      const currentPrice = safeNum(q.regularMarketPrice);
      if (sma200 && currentPrice) {
        priceVs200MA = (currentPrice - sma200) / sma200;
      }
    }
  }

  // Price from 52W high
  const currentPrice = safeNum(q.regularMarketPrice);
  const high52w = safeNum(q.fiftyTwoWeekHigh || sd.fiftyTwoWeekHigh?.raw);
  const percentFrom52wHigh = (currentPrice && high52w) ? (currentPrice - high52w) / high52w : null;

  // Volume ratio (current vs avg)
  const avgVolume = safeNum(q.averageDailyVolume10Day || q.averageVolume);
  const curVolume = safeNum(q.regularMarketVolume);
  const volumeRatio = (avgVolume && curVolume) ? curVolume / avgVolume : null;

  // Earnings consistency
  const quarterlyEarnings = earnings.earningsChart?.quarterly || [];
  const epsConsistencyScore = computeEpsConsistency(quarterlyEarnings);

  // Last earnings surprise
  const lastQ = quarterlyEarnings[0];
  const lastEarningsSurprisePct = (lastQ?.actual?.raw && lastQ?.estimate?.raw)
    ? (lastQ.actual.raw - lastQ.estimate.raw) / Math.abs(lastQ.estimate.raw)
    : null;

  // Analyst target
  const analystTargetPrice = safeNum(fd.targetMeanPrice?.raw || q.targetMeanPrice);
  const analystTargetUpsidePct = (analystTargetPrice && currentPrice)
    ? (analystTargetPrice - currentPrice) / currentPrice
    : null;

  // Operating margin prev year
  const operatingMargin = safeNum(fd.operatingMargins?.raw || ov.OperatingMarginTTM);
  const operatingMarginPrev = safeNum(ra.operatingProfitMargin || null);

  return {
    // Price / market
    currentPrice,
    marketCap: safeNum(q.marketCap || sd.marketCap?.raw),
    currency: q.currency || 'USD',
    exchange: q.fullExchangeName,

    // 52W
    high52w,
    low52w: safeNum(q.fiftyTwoWeekLow || sd.fiftyTwoWeekLow?.raw),
    percentFrom52wHigh,

    // Volume
    volumeRatio,
    avgVolume,

    // Valuation
    peRatio: safeNum(q.trailingPE || sd.trailingPE?.raw || ov.PERatio),
    forwardPE: safeNum(q.forwardPE || sd.forwardPE?.raw || ov.ForwardPE),
    priceToBook: safeNum(ks.priceToBook?.raw || km.pbRatio || ov.PriceToBookRatio),
    evToEbitda: safeNum(ks.enterpriseToEbitda?.raw || km.evToEbitda || ov.EVToEBITDA),
    fcfYield: safeNum(km.fcfYield || null),
    dividendYield: safeNum(sd.dividendYield?.raw || q.trailingAnnualDividendYield || ov.DividendYield),

    // Growth
    revenueGrowthYoY: safeNum(fd.revenueGrowth?.raw || gr.revenueGrowth || ov.QuarterlyRevenueGrowthYOY),
    revenueGrowthPrevYoY: safeNum(gr2.revenueGrowth || null),
    epsGrowthYoY: safeNum(ks.earningsQuarterlyGrowth?.raw || gr.epsgrowth || ov.QuarterlyEarningsGrowthYOY),

    // Quality
    returnOnEquity: safeNum(fd.returnOnEquity?.raw || km.roe || ov.ReturnOnEquityTTM),
    returnOnAssets: safeNum(fd.returnOnAssets?.raw || km.roa || ov.ReturnOnAssetsTTM),
    grossMargin: safeNum(fd.grossMargins?.raw || ra.grossProfitMargin || ov.GrossProfitTTM),
    operatingMargin,
    operatingMarginPrev,
    freeCashFlowMargin: safeNum(km.fcfPerShare ? km.fcfPerShare / (currentPrice || 1) : null),
    debtToEquity: safeNum(fd.debtToEquity?.raw ? fd.debtToEquity.raw / 100 : km.debtToEquity || ov.DebtToEquityRatio),

    // Technical
    rsi14,
    macdHistogram,
    priceVs200MA,

    // Earnings
    epsConsistencyScore,
    lastEarningsSurprisePct,

    // Analyst
    analystTargetPrice,
    analystTargetUpsidePct,
    analystUpgradeScore: null, // requires premium API

    // Short interest
    shortInterestRatio: safeNum(ks.shortPercentOfFloat?.raw || ov.ShortRatio),

    // Meta
    sector: ov.Sector || q.sector,
    industry: ov.Industry || q.industry,
    name: ov.Name || q.longName || q.shortName,
    description: ov.Description,
  };
}

async function analyzeStock(ticker) {
  const cacheKey = `analysis:${ticker.toUpperCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const tickerUpper = ticker.toUpperCase();
  const fundamentals = await buildFundamentals(tickerUpper);
  const classification = classifyStock(tickerUpper, fundamentals);
  const score = scoreStock(tickerUpper, classification, fundamentals);

  const result = {
    ...score,
    fundamentals,
  };

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
