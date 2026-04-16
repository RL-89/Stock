import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useScreener } from '../../hooks/useStockData';
import { RecommendationBadge } from '../common/RecommendationBadge';
import { ClassificationBadge } from '../common/ClassificationBadge';
import { ScoreGauge } from '../common/ScoreGauge';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { fmt } from '../../utils/format';
import clsx from 'clsx';

const SECTORS = ['', 'Technology', 'Healthcare', 'Financials', 'Consumer Cyclical', 'Industrials', 'Energy', 'Communication Services', 'Consumer Defensive', 'Real Estate', 'Utilities', 'Basic Materials'];
const RECOMMENDATIONS = ['', 'BUY', 'HOLD', 'AVOID'];
const CLASSIFICATIONS = ['', 'GROWTH', 'VALUE', 'MOMENTUM', 'QUALITY', 'TURNAROUND', 'HYBRID'];

export function Screener() {
  const { results, loading, error, run } = useScreener();
  const [filters, setFilters] = useState({
    sector: '',
    recommendation: '',
    classification: '',
    minScore: '',
    maxScore: '',
    minMarketCap: '',
  });

  function setFilter(key, val) {
    setFilters(prev => ({ ...prev, [key]: val }));
  }

  function handleRun() {
    const params = {};
    if (filters.sector) params.sector = filters.sector;
    if (filters.recommendation) params.recommendation = filters.recommendation;
    if (filters.classification) params.classification = filters.classification;
    if (filters.minScore) params.minScore = filters.minScore;
    if (filters.maxScore) params.maxScore = filters.maxScore;
    if (filters.minMarketCap) params.minMarketCap = filters.minMarketCap;
    run(params);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-white">Stock Screener</h1>

      <div className="card space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="stat-label block mb-1">Sector</label>
            <select value={filters.sector} onChange={e => setFilter('sector', e.target.value)} className="w-full bg-surface-elevated text-white text-xs border border-white/10 rounded px-2 py-2">
              {SECTORS.map(s => <option key={s} value={s}>{s || 'All Sectors'}</option>)}
            </select>
          </div>
          <div>
            <label className="stat-label block mb-1">Signal</label>
            <select value={filters.recommendation} onChange={e => setFilter('recommendation', e.target.value)} className="w-full bg-surface-elevated text-white text-xs border border-white/10 rounded px-2 py-2">
              {RECOMMENDATIONS.map(r => <option key={r} value={r}>{r || 'All'}</option>)}
            </select>
          </div>
          <div>
            <label className="stat-label block mb-1">Classification</label>
            <select value={filters.classification} onChange={e => setFilter('classification', e.target.value)} className="w-full bg-surface-elevated text-white text-xs border border-white/10 rounded px-2 py-2">
              {CLASSIFICATIONS.map(c => <option key={c} value={c}>{c || 'All'}</option>)}
            </select>
          </div>
          <div>
            <label className="stat-label block mb-1">Min Score</label>
            <input type="number" min={0} max={100} value={filters.minScore} onChange={e => setFilter('minScore', e.target.value)} placeholder="0" className="w-full bg-surface-elevated text-white text-xs border border-white/10 rounded px-2 py-2 placeholder:text-white/30 focus:outline-none focus:border-accent/50" />
          </div>
          <div>
            <label className="stat-label block mb-1">Max Score</label>
            <input type="number" min={0} max={100} value={filters.maxScore} onChange={e => setFilter('maxScore', e.target.value)} placeholder="100" className="w-full bg-surface-elevated text-white text-xs border border-white/10 rounded px-2 py-2 placeholder:text-white/30 focus:outline-none focus:border-accent/50" />
          </div>
          <div>
            <label className="stat-label block mb-1">Min Mkt Cap ($B)</label>
            <input type="number" min={0} value={filters.minMarketCap} onChange={e => setFilter('minMarketCap', e.target.value ? String(parseFloat(e.target.value) * 1e9) : '')} placeholder="e.g. 10" className="w-full bg-surface-elevated text-white text-xs border border-white/10 rounded px-2 py-2 placeholder:text-white/30 focus:outline-none focus:border-accent/50" />
          </div>
        </div>
        <button
          onClick={handleRun}
          disabled={loading}
          className="bg-accent hover:bg-accent/80 disabled:opacity-50 text-white text-sm font-semibold px-6 py-2 rounded-lg transition-colors"
        >
          {loading ? 'Screening...' : 'Run Screen'}
        </button>
      </div>

      {error && <p className="text-avoid text-sm">{error}</p>}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner label="Running screen..." />
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="card overflow-hidden p-0">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <p className="text-sm text-white/60">{results.length} result{results.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['Ticker', 'Classification', 'Signal', 'Score', 'Price', 'Mkt Cap', 'ROE', 'Rev. Growth'].map(h => (
                    <th key={h} className="py-2 px-4 text-left text-xs text-white/30 font-medium uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map(stock => (
                  <tr key={stock.ticker} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="py-3 px-4">
                      <Link to={`/stock/${stock.ticker}`} className="hover:text-accent transition-colors">
                        <div className="font-mono font-semibold text-white">{stock.ticker}</div>
                        <div className="text-xs text-white/40">{stock.fundamentals?.name}</div>
                      </Link>
                    </td>
                    <td className="py-3 px-4"><ClassificationBadge type={stock.classification?.type} /></td>
                    <td className="py-3 px-4"><RecommendationBadge recommendation={stock.recommendation} /></td>
                    <td className="py-3 px-4"><ScoreGauge score={stock.score || 0} conviction={stock.conviction} size={50} /></td>
                    <td className="py-3 px-4 font-mono text-sm">{stock.fundamentals?.currentPrice ? fmt(stock.fundamentals.currentPrice, 'currency') : '—'}</td>
                    <td className="py-3 px-4 text-sm text-white/60">{stock.fundamentals?.marketCap ? fmt(stock.fundamentals.marketCap, 'mktcap') : '—'}</td>
                    <td className="py-3 px-4">
                      {stock.fundamentals?.returnOnEquity !== null && stock.fundamentals?.returnOnEquity !== undefined ? (
                        <span className={clsx('text-sm font-mono', stock.fundamentals.returnOnEquity > 0.15 ? 'text-buy' : 'text-white/60')}>
                          {(stock.fundamentals.returnOnEquity * 100).toFixed(1)}%
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-3 px-4">
                      {stock.fundamentals?.revenueGrowthYoY !== null && stock.fundamentals?.revenueGrowthYoY !== undefined ? (
                        <span className={clsx('text-sm font-mono', stock.fundamentals.revenueGrowthYoY >= 0 ? 'text-buy' : 'text-avoid')}>
                          {stock.fundamentals.revenueGrowthYoY >= 0 ? '+' : ''}{(stock.fundamentals.revenueGrowthYoY * 100).toFixed(1)}%
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && results.length === 0 && (
        <div className="card text-center py-12 text-white/30 text-sm">
          Run a screen to see results.
        </div>
      )}
    </div>
  );
}
