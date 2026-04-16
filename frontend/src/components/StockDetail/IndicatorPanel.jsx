import React from 'react';
import clsx from 'clsx';
import { fmt } from '../../utils/format';

function Stat({ label, value, positive, negative, highlight }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="stat-label">{label}</span>
      <span className={clsx(
        'stat-value font-mono',
        positive === true && 'text-buy',
        positive === false && 'text-avoid',
        highlight && 'text-accent'
      )}>
        {value ?? '—'}
      </span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="card">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">{children}</div>
    </div>
  );
}

export function IndicatorPanel({ data }) {
  const { fundamentals: f, classification } = data;
  const type = classification?.primaryType;

  const valuationSection = (
    <Section title="Valuation">
      <Stat label="P/E (TTM)" value={f?.peRatio ? fmt(f.peRatio, 'ratio') : null} />
      <Stat label="Forward P/E" value={f?.forwardPE ? fmt(f.forwardPE, 'ratio') : null} />
      <Stat label="P/B" value={f?.priceToBook ? fmt(f.priceToBook, 'ratio') : null} />
      <Stat label="EV/EBITDA" value={f?.evToEbitda ? fmt(f.evToEbitda, 'ratio') : null} />
      <Stat label="FCF Yield" value={f?.fcfYield !== null ? `${(f.fcfYield * 100).toFixed(1)}%` : null} positive={f?.fcfYield > 0.05} />
      <Stat label="Div. Yield" value={f?.dividendYield !== null ? `${(f.dividendYield * 100).toFixed(2)}%` : null} />
    </Section>
  );

  const growthSection = (
    <Section title="Growth">
      <Stat label="Revenue Growth YoY" value={f?.revenueGrowthYoY !== null ? `${(f.revenueGrowthYoY * 100).toFixed(1)}%` : null} positive={f?.revenueGrowthYoY > 0.15} negative={f?.revenueGrowthYoY < 0} />
      <Stat label="EPS Growth YoY" value={f?.epsGrowthYoY !== null ? `${(f.epsGrowthYoY * 100).toFixed(1)}%` : null} positive={f?.epsGrowthYoY > 0.15} />
      <Stat label="Gross Margin" value={f?.grossMargin !== null ? `${(f.grossMargin * 100).toFixed(1)}%` : null} positive={f?.grossMargin > 0.40} />
      <Stat label="Operating Margin" value={f?.operatingMargin !== null ? `${(f.operatingMargin * 100).toFixed(1)}%` : null} positive={f?.operatingMargin > 0.15} />
      <Stat label="FCF Margin" value={f?.freeCashFlowMargin !== null ? `${(f.freeCashFlowMargin * 100).toFixed(1)}%` : null} />
    </Section>
  );

  const qualitySection = (
    <Section title="Quality & Balance Sheet">
      <Stat label="ROE" value={f?.returnOnEquity !== null ? `${(f.returnOnEquity * 100).toFixed(1)}%` : null} positive={f?.returnOnEquity > 0.15} />
      <Stat label="ROA" value={f?.returnOnAssets !== null ? `${(f.returnOnAssets * 100).toFixed(1)}%` : null} positive={f?.returnOnAssets > 0.05} />
      <Stat label="Debt/Equity" value={f?.debtToEquity ? fmt(f.debtToEquity, 'ratio') : null} positive={f?.debtToEquity < 0.5} negative={f?.debtToEquity > 2} />
      <Stat label="EPS Consistency" value={f?.epsConsistencyScore !== null ? `${Math.round(f.epsConsistencyScore * 100)}%` : null} positive={f?.epsConsistencyScore > 0.7} />
      <Stat label="Last Earnings Beat" value={f?.lastEarningsSurprisePct !== null ? `${f.lastEarningsSurprisePct >= 0 ? '+' : ''}${(f.lastEarningsSurprisePct * 100).toFixed(1)}%` : null} positive={f?.lastEarningsSurprisePct > 0} negative={f?.lastEarningsSurprisePct < 0} />
    </Section>
  );

  const technicalSection = (
    <Section title="Technical">
      <Stat label="RSI (14)" value={f?.rsi14 ? fmt(f.rsi14, 'ratio', { decimals: 1 }) : null} positive={f?.rsi14 >= 50 && f?.rsi14 <= 65} negative={f?.rsi14 > 75 || f?.rsi14 < 30} />
      <Stat label="MACD Histogram" value={f?.macdHistogram ? fmt(f.macdHistogram, 'ratio', { decimals: 3 }) : null} positive={f?.macdHistogram > 0} negative={f?.macdHistogram < 0} />
      <Stat label="vs 200-day MA" value={f?.priceVs200MA !== null ? `${f.priceVs200MA >= 0 ? '+' : ''}${(f.priceVs200MA * 100).toFixed(1)}%` : null} positive={f?.priceVs200MA > 0} negative={f?.priceVs200MA < -0.05} />
      <Stat label="From 52W High" value={f?.percentFrom52wHigh !== null ? `${(f.percentFrom52wHigh * 100).toFixed(1)}%` : null} positive={f?.percentFrom52wHigh > -0.05} />
      <Stat label="Volume Ratio" value={f?.volumeRatio ? `${f.volumeRatio.toFixed(2)}x` : null} positive={f?.volumeRatio > 1.5} />
    </Section>
  );

  const analystSection = (
    <Section title="Analyst">
      <Stat label="Price Target" value={f?.analystTargetPrice ? fmt(f.analystTargetPrice, 'currency') : null} highlight />
      <Stat label="Upside to Target" value={f?.analystTargetUpsidePct !== null ? `${f.analystTargetUpsidePct >= 0 ? '+' : ''}${(f.analystTargetUpsidePct * 100).toFixed(1)}%` : null} positive={f?.analystTargetUpsidePct > 0.10} negative={f?.analystTargetUpsidePct < 0} />
      <Stat label="Short Interest" value={f?.shortInterestRatio !== null ? `${(f.shortInterestRatio * 100).toFixed(1)}%` : null} />
    </Section>
  );

  // Adaptive layout based on classification type
  const layouts = {
    GROWTH: [growthSection, technicalSection, valuationSection, qualitySection, analystSection],
    VALUE: [valuationSection, qualitySection, growthSection, technicalSection, analystSection],
    MOMENTUM: [technicalSection, growthSection, valuationSection, qualitySection, analystSection],
    QUALITY: [qualitySection, growthSection, valuationSection, technicalSection, analystSection],
    TURNAROUND: [growthSection, qualitySection, technicalSection, valuationSection, analystSection],
  };

  const sections = layouts[type] || [valuationSection, growthSection, qualitySection, technicalSection, analystSection];

  return <div className="space-y-4">{sections}</div>;
}
