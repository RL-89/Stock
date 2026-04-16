const TYPES = {
  GROWTH: 'GROWTH',
  VALUE: 'VALUE',
  MOMENTUM: 'MOMENTUM',
  QUALITY: 'QUALITY',
  TURNAROUND: 'TURNAROUND',
  HYBRID: 'HYBRID',
};

function safeNum(val, fallback = null) {
  const n = parseFloat(val);
  return isNaN(n) ? fallback : n;
}

function scoreGrowth(f) {
  let score = 0;
  const signals = [];

  const revGrowth = safeNum(f.revenueGrowthYoY);
  if (revGrowth !== null) {
    if (revGrowth > 0.25) { score += 3; signals.push(`Revenue growth ${(revGrowth * 100).toFixed(1)}% (strong)`); }
    else if (revGrowth > 0.15) { score += 2; signals.push(`Revenue growth ${(revGrowth * 100).toFixed(1)}%`); }
    else if (revGrowth > 0.08) { score += 1; signals.push(`Revenue growth ${(revGrowth * 100).toFixed(1)}% (moderate)`); }
    else if (revGrowth < 0) { score -= 1; signals.push(`Revenue declining ${(revGrowth * 100).toFixed(1)}%`); }
  }

  const pe = safeNum(f.peRatio);
  if (pe !== null && pe > 0) {
    if (pe > 30) { score += 2; signals.push(`High P/E ${pe.toFixed(1)} (growth premium)`); }
    else if (pe > 20) { score += 1; signals.push(`Elevated P/E ${pe.toFixed(1)}`); }
  }

  const epsGrowth = safeNum(f.epsGrowthYoY);
  if (epsGrowth !== null && epsGrowth > 0.15) {
    score += 2;
    signals.push(`EPS growth ${(epsGrowth * 100).toFixed(1)}%`);
  }

  const divYield = safeNum(f.dividendYield);
  if (divYield === null || divYield < 0.01) {
    score += 1;
    signals.push('Reinvests capital (low/no dividend)');
  }

  return { score, signals };
}

function scoreValue(f) {
  let score = 0;
  const signals = [];

  const pb = safeNum(f.priceToBook);
  if (pb !== null && pb > 0) {
    if (pb < 1.0) { score += 3; signals.push(`P/B ${pb.toFixed(2)} (deep value)`); }
    else if (pb < 1.5) { score += 2; signals.push(`P/B ${pb.toFixed(2)} (undervalued)`); }
    else if (pb < 3.0) { score += 1; signals.push(`P/B ${pb.toFixed(2)}`); }
  }

  const pe = safeNum(f.peRatio);
  if (pe !== null && pe > 0) {
    if (pe < 10) { score += 3; signals.push(`Low P/E ${pe.toFixed(1)} (value signal)`); }
    else if (pe < 15) { score += 2; signals.push(`P/E ${pe.toFixed(1)}`); }
    else if (pe > 35) { score -= 1; }
  }

  const fcfYield = safeNum(f.fcfYield);
  if (fcfYield !== null) {
    if (fcfYield > 0.08) { score += 3; signals.push(`FCF yield ${(fcfYield * 100).toFixed(1)}% (strong)`); }
    else if (fcfYield > 0.05) { score += 2; signals.push(`FCF yield ${(fcfYield * 100).toFixed(1)}%`); }
    else if (fcfYield > 0.03) { score += 1; signals.push(`FCF yield ${(fcfYield * 100).toFixed(1)}%`); }
  }

  const evEbitda = safeNum(f.evToEbitda);
  if (evEbitda !== null && evEbitda > 0) {
    if (evEbitda < 8) { score += 2; signals.push(`EV/EBITDA ${evEbitda.toFixed(1)} (cheap)`); }
    else if (evEbitda < 12) { score += 1; signals.push(`EV/EBITDA ${evEbitda.toFixed(1)}`); }
  }

  return { score, signals };
}

function scoreMomentum(f) {
  let score = 0;
  const signals = [];

  const vs52wHigh = safeNum(f.percentFrom52wHigh);
  if (vs52wHigh !== null) {
    if (vs52wHigh > -0.05) { score += 3; signals.push(`Near 52W high (${(vs52wHigh * 100).toFixed(1)}%)`); }
    else if (vs52wHigh > -0.10) { score += 2; signals.push(`Within 10% of 52W high`); }
    else if (vs52wHigh > -0.20) { score += 1; signals.push(`Moderate pullback from high`); }
    else { score -= 1; signals.push(`${(vs52wHigh * 100).toFixed(1)}% from 52W high`); }
  }

  const rsi = safeNum(f.rsi14);
  if (rsi !== null) {
    if (rsi >= 50 && rsi <= 65) { score += 3; signals.push(`RSI ${rsi.toFixed(1)} (bullish zone)`); }
    else if (rsi >= 40 && rsi < 50) { score += 1; signals.push(`RSI ${rsi.toFixed(1)} (neutral)`); }
    else if (rsi > 75) { score -= 1; signals.push(`RSI ${rsi.toFixed(1)} (overbought)`); }
    else if (rsi < 30) { score -= 1; signals.push(`RSI ${rsi.toFixed(1)} (oversold)`); }
  }

  const volRatio = safeNum(f.volumeRatio);
  if (volRatio !== null && volRatio > 1.5) {
    score += 2;
    signals.push(`Volume surge ${volRatio.toFixed(1)}x average`);
  }

  const priceVs200ma = safeNum(f.priceVs200MA);
  if (priceVs200ma !== null) {
    if (priceVs200ma > 0.05) { score += 2; signals.push(`${(priceVs200ma * 100).toFixed(1)}% above 200-day MA`); }
    else if (priceVs200ma > 0) { score += 1; signals.push('Above 200-day MA'); }
    else { score -= 1; signals.push('Below 200-day MA'); }
  }

  return { score, signals };
}

function scoreQuality(f) {
  let score = 0;
  const signals = [];

  const roe = safeNum(f.returnOnEquity);
  if (roe !== null) {
    if (roe > 0.25) { score += 3; signals.push(`ROE ${(roe * 100).toFixed(1)}% (excellent)`); }
    else if (roe > 0.15) { score += 2; signals.push(`ROE ${(roe * 100).toFixed(1)}%`); }
    else if (roe > 0.10) { score += 1; signals.push(`ROE ${(roe * 100).toFixed(1)}% (moderate)`); }
    else if (roe < 0) { score -= 2; signals.push(`Negative ROE ${(roe * 100).toFixed(1)}%`); }
  }

  const debtEquity = safeNum(f.debtToEquity);
  if (debtEquity !== null) {
    if (debtEquity < 0.3) { score += 3; signals.push(`Low D/E ${debtEquity.toFixed(2)} (fortress balance sheet)`); }
    else if (debtEquity < 0.5) { score += 2; signals.push(`D/E ${debtEquity.toFixed(2)}`); }
    else if (debtEquity < 1.0) { score += 1; signals.push(`D/E ${debtEquity.toFixed(2)} (manageable)`); }
    else { score -= 1; signals.push(`High leverage D/E ${debtEquity.toFixed(2)}`); }
  }

  const grossMargin = safeNum(f.grossMargin);
  if (grossMargin !== null) {
    if (grossMargin > 0.60) { score += 3; signals.push(`Gross margin ${(grossMargin * 100).toFixed(1)}% (exceptional)`); }
    else if (grossMargin > 0.40) { score += 2; signals.push(`Gross margin ${(grossMargin * 100).toFixed(1)}%`); }
    else if (grossMargin > 0.20) { score += 1; signals.push(`Gross margin ${(grossMargin * 100).toFixed(1)}%`); }
  }

  const epsConsistency = safeNum(f.epsConsistencyScore);
  if (epsConsistency !== null && epsConsistency > 0.7) {
    score += 2;
    signals.push('Consistent EPS growth track record');
  }

  return { score, signals };
}

function scoreTurnaround(f) {
  let score = 0;
  const signals = [];

  const earningsSurprise = safeNum(f.lastEarningsSurprisePct);
  if (earningsSurprise !== null) {
    if (earningsSurprise > 0.15) { score += 3; signals.push(`Earnings beat by ${(earningsSurprise * 100).toFixed(1)}%`); }
    else if (earningsSurprise > 0.05) { score += 2; signals.push(`Earnings beat by ${(earningsSurprise * 100).toFixed(1)}%`); }
    else if (earningsSurprise > 0) { score += 1; signals.push('Slight earnings beat'); }
    else { score -= 1; signals.push('Earnings miss'); }
  }

  const revenueGrowth = safeNum(f.revenueGrowthYoY);
  const prevRevenueGrowth = safeNum(f.revenueGrowthPrevYoY);
  if (revenueGrowth !== null && prevRevenueGrowth !== null && revenueGrowth > prevRevenueGrowth) {
    score += 2;
    signals.push('Revenue growth accelerating');
  }

  const shortInterest = safeNum(f.shortInterestRatio);
  if (shortInterest !== null && shortInterest > 0.15) {
    score += 1;
    signals.push(`High short interest ${(shortInterest * 100).toFixed(1)}% (squeeze potential)`);
  }

  return { score, signals };
}

function classifyStock(ticker, fundamentals) {
  const scores = {
    [TYPES.GROWTH]: scoreGrowth(fundamentals),
    [TYPES.VALUE]: scoreValue(fundamentals),
    [TYPES.MOMENTUM]: scoreMomentum(fundamentals),
    [TYPES.QUALITY]: scoreQuality(fundamentals),
    [TYPES.TURNAROUND]: scoreTurnaround(fundamentals),
  };

  const sorted = Object.entries(scores)
    .map(([type, result]) => ({ type, score: result.score, signals: result.signals }))
    .sort((a, b) => b.score - a.score);

  const top = sorted[0];
  const second = sorted[1];
  const totalMaxScore = 14;

  const confidence = Math.min(100, Math.max(0, Math.round((top.score / totalMaxScore) * 100)));

  let type = top.type;
  let indicators = top.signals;

  // Hybrid: two types within 2 points of each other
  if (top.score - second.score <= 2 && top.score > 3) {
    type = TYPES.HYBRID;
    indicators = [...new Set([...top.signals, ...second.signals])].slice(0, 6);
  }

  return {
    type,
    primaryType: top.type,
    secondaryType: second.type,
    confidence,
    indicators,
    scoreBreakdown: sorted,
  };
}

module.exports = { classifyStock, TYPES };
