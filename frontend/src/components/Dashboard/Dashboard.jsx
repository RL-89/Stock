import React, { useState } from 'react';
import { useWatchlist } from '../../context/WatchlistContext';
import { useWatchlistData } from '../../hooks/useStockData';
import { WatchlistRow } from './WatchlistRow';
import { MacroBanner } from './MacroBanner';
import { LoadingSpinner } from '../common/LoadingSpinner';

const SORT_OPTIONS = [
  { value: 'score', label: 'Score' },
  { value: 'conviction', label: 'Conviction' },
  { value: 'recommendation', label: 'Recommendation' },
  { value: 'ticker', label: 'Ticker' },
];

const REC_ORDER = { BUY: 0, HOLD: 1, AVOID: 2 };

export function Dashboard() {
  const { watchlist, addTicker, removeTicker } = useWatchlist();
  const { data, loading, error, lastUpdated, refresh } = useWatchlistData(watchlist, 120000);
  const [sortBy, setSortBy] = useState('score');
  const [filterRec, setFilterRec] = useState('ALL');
  const [addInput, setAddInput] = useState('');

  const sorted = [...data]
    .filter(s => filterRec === 'ALL' || s.recommendation === filterRec)
    .sort((a, b) => {
      if (sortBy === 'score') return (b.score || 0) - (a.score || 0);
      if (sortBy === 'conviction') return (b.conviction || 0) - (a.conviction || 0);
      if (sortBy === 'recommendation') return (REC_ORDER[a.recommendation] ?? 3) - (REC_ORDER[b.recommendation] ?? 3);
      return a.ticker.localeCompare(b.ticker);
    });

  const counts = data.reduce((acc, s) => {
    if (s.recommendation) acc[s.recommendation] = (acc[s.recommendation] || 0) + 1;
    return acc;
  }, {});

  function handleAdd(e) {
    e.preventDefault();
    if (addInput.trim()) {
      addTicker(addInput.trim());
      setAddInput('');
    }
  }

  return (
    <div className="space-y-4">
      <MacroBanner />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Watchlist</h1>
          {lastUpdated && (
            <p className="text-xs text-white/30 mt-0.5">Updated {lastUpdated.toLocaleTimeString()}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Summary pills */}
          {['BUY', 'HOLD', 'AVOID'].map(r => (
            <button
              key={r}
              onClick={() => setFilterRec(filterRec === r ? 'ALL' : r)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                r === 'BUY' ? 'border-buy/30 text-buy hover:bg-buy/10' :
                r === 'HOLD' ? 'border-hold/30 text-hold hover:bg-hold/10' :
                'border-avoid/30 text-avoid hover:bg-avoid/10'
              } ${filterRec === r ? (r === 'BUY' ? 'bg-buy/10' : r === 'HOLD' ? 'bg-hold/10' : 'bg-avoid/10') : ''}`}
            >
              {counts[r] || 0} {r}
            </button>
          ))}
          <button
            onClick={refresh}
            className="text-xs text-white/40 hover:text-white border border-white/10 px-3 py-1 rounded-full transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">Sort by</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-surface-elevated text-white text-xs border border-white/10 rounded px-2 py-1"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <form onSubmit={handleAdd} className="flex items-center gap-2">
            <input
              value={addInput}
              onChange={e => setAddInput(e.target.value.toUpperCase())}
              placeholder="Add ticker..."
              className="bg-surface-elevated text-white text-xs border border-white/10 rounded px-3 py-1 w-28 placeholder:text-white/30 focus:outline-none focus:border-accent/50"
            />
            <button type="submit" className="text-xs bg-accent/20 text-accent border border-accent/30 px-3 py-1 rounded hover:bg-accent/30 transition-colors">
              Add
            </button>
          </form>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner label="Analyzing stocks..." />
          </div>
        )}

        {error && (
          <div className="px-4 py-6 text-center text-avoid text-sm">{error}</div>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['Ticker', 'Classification', 'Signal', 'Score', 'Price', 'Rev. Growth', 'Mkt Cap', ''].map(h => (
                    <th key={h} className="py-2 px-4 text-left text-xs text-white/30 font-medium uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map(stock => (
                  <WatchlistRow key={stock.ticker} stock={stock} onRemove={removeTicker} />
                ))}
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-white/30 text-sm">
                      No stocks match the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
