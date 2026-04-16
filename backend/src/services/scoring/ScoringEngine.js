const { TYPES } = require('../classification/ClassificationEngine');

const WEIGHTS = {
  [TYPES.GROWTH]: {
    revenueGrowth: 0.25,
    epsGrowth: 0.20,
    priceVsMomentum: 0.15,
    grossMargin: 0.15,
    analystTarget: 0.15,
    qualityGate: 0.10,
  },
  [TYPES.VALUE]: {
    peRatio: 0.20,
    priceToBook: 0.20,
    fcfYield: 0.25,
    evToEbitda: 0.15,
    dividendYield: 0.10,
    debtEquity: 0.10,
  },
  [TYPES.MOMENTUM]: {
    vs52wHigh: 0.25,
    rsi: 0.20,
    volumeRatio: 0.15,
    priceVs200MA: 0.20,
    macdSignal: 0.20,
  },
  [TYPES.QUALITY]: {
    roe: 0.25,
    debtEquity: 0.20,
    grossMargin: 0.20,
    epsConsistency: 0.20,
    freeCashFlowMargin: 0.15,
  },
  [TYPES.TURNAROUND]: {
    earningsSurprise: 0.30,
    revenueAcceleration: 0.20,
    marginExpansion: 0.20,
    analystUpgrades: 0.15,
    shortInterest: 0.15,
  },
  [TYPES.HYBRID]: {
    composite: 1.0,
  },
};

function clamp(val, min = 0, max = 100) {
  return Math.max(min, Math.min(max, val));
}

function safe(val) {
  return typeof val === 'number' && !isNaN(val) ? val : null;
}

function scoreGrowthDimension(f) {
  const sub = {};

  const rg = safe(f.revenueGrowthYoY);
  sub.revenueGrowth = rg !== null
    ? clamp(rg > 0.30 ? 100 : rg > 0.20 ? 85 : rg > 0.15 ? 70 : rg > 0.08 ? 50 : rg > 0 ? 30 : 10)
    : 50;

  const eg = safe(f.epsGrowthYoY);
  sub.epsGrowth = eg !== null
    ? clamp(eg > 0.30 ? 100 : eg > 0.20 ? 85 : eg > 0.15 ? 70 : eg > 0.08 ? 50 : eg > 0 ? 30 : 10)
    : 50;

  const vs52 = safe(f.percentFrom52wHigh);
  sub.priceVsMomentum = vs52 !== null
    ? clamp(vs52 > -0.05 ? 90 : vs52 > -0.15 ? 70 : vs52 > -0.25 ? 50 : 25)
    : 50;

  const gm = safe(f.grossMargin);
  sub.grossMargin = gm !== null
    ? clamp(gm > 0.70 ? 100 : gm > 0.50 ? 85 : gm > 0.35 ? 65 : gm > 0.20 ? 45 : 25)
    : 50;

  const at = safe(f.analystTargetUpsidePct);
  sub.analystTarget = at !== null
    ? clamp(at > 0.25 ? 100 : at > 0.15 ? 80 : at > 0.05 ? 60 : at > 0 ? 45 : 30)
    : 50;

  const roe = safe(f.returnOnEquity);
  sub.qualityGate = roe !== null
    ? clamp(roe > 0.20 ? 90 : roe > 0.10 ? 65 : roe > 0 ? 40 : 20)
    : 50;

  const w = WEIGHTS[TYPES.GROWTH];
  return {
    total: Math.round(
      sub.revenueGrowth * w.revenueGrowth +
      sub.epsGrowth * w.epsGrowth +
      sub.priceVsMomentum * w.priceVsMomentum +
      sub.grossMargin * w.grossMargin +
      sub.analystTarget * w.analystTarget +
      sub.qualityGate * w.qualityGate
    ),
    breakdown: sub,
  };
}

function scoreValueDimension(f) {
  const sub = {};

  const pe = safe(f.peRatio);
  sub.peRatio = pe !== null && pe > 0
    ? clamp(pe < 8 ? 100 : pe < 12 ? 85 : pe < 15 ? 70 : pe < 20 ? 50 : pe < 30 ? 30 : 10)
    : 50;

  const pb = safe(f.priceToBook);
  sub.priceToBook = pb !== null && pb > 0
    ? clamp(pb < 0.8 ? 100 : pb < 1.2 ? 85 : pb < 1.5 ? 70 : pb < 3.0 ? 50 : 25)
    : 50;

  const fcf = safe(f.fcfYield);
  sub.fcfYield = fcf !== null
    ? clamp(fcf > 0.12 ? 100 : fcf > 0.08 ? 85 : fcf > 0.05 ? 70 : fcf > 0.03 ? 50 : fcf > 0 ? 30 : 10)
    : 50;

  const ev = safe(f.evToEbitda);
  sub.evToEbitda = ev !== null && ev > 0
    ? clamp(ev < 6 ? 100 : ev < 8 ? 85 : ev < 12 ? 65 : ev < 16 ? 45 : 25)
    : 50;

  const dy = safe(f.dividendYield);
  sub.dividendYield = dy !== null
    ? clamp(dy > 0.05 ? 90 : dy > 0.03 ? 70 : dy > 0.01 ? 50 : 35)
    : 35;

  const de = safe(f.debtToEquity);
  sub.debtEquity = de !== null
    ? clamp(de < 0.2 ? 95 : de < 0.5 ? 80 : de < 1.0 ? 60 : de < 2.0 ? 35 : 15)
    : 50;

  const w = WEIGHTS[TYPES.VALUE];
  return {
    total: Math.round(
      sub.peRatio * w.peRatio +
      sub.priceToBook * w.priceToBook +
      sub.fcfYield * w.fcfYield +
      sub.evToEbitda * w.evToEbitda +
      sub.dividendYield * w.dividendYield +
      sub.debtEquity * w.debtEquity
    ),
    breakdown: sub,
  };
}

function scoreMomentumDimension(f) {
  const sub = {};

  const vs52 = safe(f.percentFrom52wHigh);
  sub.vs52wHigh = vs52 !== null
    ? clamp(vs52 > -0.03 ? 100 : vs52 > -0.07 ? 85 : vs52 > -0.12 ? 65 : vs52 > -0.20 ? 45 : 20)
    : 50;

  const rsi = safe(f.rsi14);
  sub.rsi = rsi !== null
    ? clamp(rsi >= 55 && rsi <= 65 ? 95 : rsi >= 50 && rsi < 55 ? 80 : rsi >= 45 && rsi < 50 ? 60 : rsi > 70 ? 30 : rsi < 35 ? 25 : 50)
    : 50;

  const vr = safe(f.volumeRatio);
  sub.volumeRatio = vr !== null
    ? clamp(vr > 2.5 ? 100 : vr > 1.75 ? 85 : vr > 1.25 ? 65 : vr > 0.75 ? 45 : 25)
    : 50;

  const vs200 = safe(f.priceVs200MA);
  sub.priceVs200MA = vs200 !== null
    ? clamp(vs200 > 0.15 ? 100 : vs200 > 0.08 ? 85 : vs200 > 0.03 ? 70 : vs200 > 0 ? 55 : vs200 > -0.05 ? 40 : 20)
    : 50;

  const macd = safe(f.macdHistogram);
  sub.macdSignal = macd !== null
    ? clamp(macd > 0.5 ? 90 : macd > 0.1 ? 70 : macd > 0 ? 55 : macd > -0.1 ? 40 : 20)
    : 50;

  const w = WEIGHTS[TYPES.MOMENTUM];
  return {
    total: Math.round(
      sub.vs52wHigh * w.vs52wHigh +
      sub.rsi * w.rsi +
      sub.volumeRatio * w.volumeRatio +
      sub.priceVs200MA * w.priceVs200MA +
      sub.macdSignal * w.macdSignal
    ),
    breakdown: sub,
  };
}

function scoreQualityDimension(f) {
  const sub = {};

  const roe = safe(f.returnOnEquity);
  sub.roe = roe !== null
    ? clamp(roe > 0.30 ? 100 : roe > 0.20 ? 85 : roe > 0.15 ? 70 : roe > 0.10 ? 55 : roe > 0 ? 35 : 10)
    : 50;

  const de = safe(f.debtToEquity);
  sub.debtEquity = de !== null
    ? clamp(de < 0.1 ? 100 : de < 0.3 ? 85 : de < 0.5 ? 70 : de < 1.0 ? 50 : de < 2.0 ? 30 : 10)
    : 50;

  const gm = safe(f.grossMargin);
  sub.grossMargin = gm !== null
    ? clamp(gm > 0.70 ? 100 : gm > 0.55 ? 85 : gm > 0.40 ? 70 : gm > 0.25 ? 50 : 30)
    : 50;

  const eps = safe(f.epsConsistencyScore);
  sub.epsConsistency = eps !== null ? clamp(eps * 100) : 50;

  const fcfm = safe(f.freeCashFlowMargin);
  sub.freeCashFlowMargin = fcfm !== null
    ? clamp(fcfm > 0.25 ? 100 : fcfm > 0.15 ? 80 : fcfm > 0.10 ? 65 : fcfm > 0.05 ? 50 : fcfm > 0 ? 35 : 10)
    : 50;

  const w = WEIGHTS[TYPES.QUALITY];
  return {
    total: Math.round(
      sub.roe * w.roe +
      sub.debtEquity * w.debtEquity +
      sub.grossMargin * w.grossMargin +
      sub.epsConsistency * w.epsConsistency +
      sub.freeCashFlowMargin * w.freeCashFlowMargin
    ),
    breakdown: sub,
  };
}

function scoreTurnaroundDimension(f) {
  const sub = {};

  const es = safe(f.lastEarningsSurprisePct);
  sub.earningsSurprise = es !== null
    ? clamp(es > 0.20 ? 100 : es > 0.10 ? 80 : es > 0.05 ? 65 : es > 0 ? 50 : 20)
    : 50;

  const rg = safe(f.revenueGrowthYoY);
  const prg = safe(f.revenueGrowthPrevYoY);
  sub.revenueAcceleration = (rg !== null && prg !== null)
    ? clamp(rg > prg ? (rg - prg > 0.05 ? 90 : 70) : 30)
    : 50;

  const curMargin = safe(f.operatingMargin);
  const prevMargin = safe(f.operatingMarginPrev);
  sub.marginExpansion = (curMargin !== null && prevMargin !== null)
    ? clamp(curMargin > prevMargin ? (curMargin - prevMargin > 0.05 ? 90 : 65) : 35)
    : 50;

  sub.analystUpgrades = safe(f.analystUpgradeScore) !== null
    ? clamp(f.analystUpgradeScore * 100)
    : 50;

  const si = safe(f.shortInterestRatio);
  sub.shortInterest = si !== null
    ? clamp(si > 0.20 ? 75 : si > 0.10 ? 60 : 45)
    : 50;

  const w = WEIGHTS[TYPES.TURNAROUND];
  return {
    total: Math.round(
      sub.earningsSurprise * w.earningsSurprise +
      sub.revenueAcceleration * w.revenueAcceleration +
      sub.marginExpansion * w.marginExpansion +
      sub.analystUpgrades * w.analystUpgrades +
      sub.shortInterest * w.shortInterest
    ),
    breakdown: sub,
  };
}

function getRecommendation(score, conviction) {
  if (score >= 75 && conviction >= 70) return 'BUY';
  if (score >= 60 && conviction >= 50) return 'BUY';
  if (score >= 45) return 'HOLD';
  return 'AVOID';
}

function scoreStock(ticker, classification, fundamentals) {
  const { type, primaryType, confidence } = classification;

  let primary;
  let secondary = null;

  const primaryScore = (() => {
    switch (primaryType) {
      case TYPES.GROWTH: return scoreGrowthDimension(fundamentals);
      case TYPES.VALUE: return scoreValueDimension(fundamentals);
      case TYPES.MOMENTUM: return scoreMomentumDimension(fundamentals);
      case TYPES.QUALITY: return scoreQualityDimension(fundamentals);
      case TYPES.TURNAROUND: return scoreTurnaroundDimension(fundamentals);
      default: return scoreQualityDimension(fundamentals);
    }
  })();

  if (type === TYPES.HYBRID && classification.secondaryType) {
    const secondaryScore = (() => {
      switch (classification.secondaryType) {
        case TYPES.GROWTH: return scoreGrowthDimension(fundamentals);
        case TYPES.VALUE: return scoreValueDimension(fundamentals);
        case TYPES.MOMENTUM: return scoreMomentumDimension(fundamentals);
        case TYPES.QUALITY: return scoreQualityDimension(fundamentals);
        case TYPES.TURNAROUND: return scoreTurnaroundDimension(fundamentals);
        default: return scoreQualityDimension(fundamentals);
      }
    })();
    primary = { total: Math.round((primaryScore.total + secondaryScore.total) / 2), breakdown: primaryScore.breakdown };
    secondary = secondaryScore;
  } else {
    primary = primaryScore;
  }

  // Conviction = average of classification confidence and score quality
  const scoreQuality = primary.total;
  const conviction = Math.round((confidence + scoreQuality) / 2);
  const recommendation = getRecommendation(primary.total, conviction);

  return {
    ticker,
    score: primary.total,
    conviction,
    recommendation,
    classification,
    dimensions: {
      primary: { type: primaryType, ...primary },
      secondary: secondary ? { type: classification.secondaryType, ...secondary } : null,
    },
    updatedAt: new Date().toISOString(),
  };
}

module.exports = { scoreStock };
