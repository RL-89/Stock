import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useWatchlist } from '../../context/WatchlistContext';
import { useBenchmark } from '../../hooks/useStockData';
import { LoadingSpinner } from '../common/LoadingSpinner';
import clsx from 'clsx';

const PERIODS = ['1M', '3M', '6M', '1Y'];
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

function buildChartData(series) {
  if (!series || Object.keys(series).length === 0) return [];
  const tickers = Object.keys(series);
  const allDates = [...new Set(tickers.flatMap(t => series[t].map(p => p.date)))].sort();

  return allDates.map(date => {
    const point = { date };
    tickers.forEach(t => {
      const match = series[t].find(p => p.date === date);
      if (match) point[t] = match.value;
    });
    return point;
  });
}

function MetricCard({ ticker, metrics, color, isSPY }) {
  const m = metrics[ticker];
  if (!m) return null;
  return (
    <div className={clsx('card', isSPY && 'border-white/15')}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-3 h-1 rounded-full" style={{ backgroundColor: color }} />
        <span className="font-mono font-semibold text-sm text-white">{ticker}</span>
        {isSPY && <span className="text-xs text-white/30">(benchmark)</span>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="stat-label">Total Return</p>
          <p className={clsx('text-lg font-bold font-mono', m.totalReturn >= 0 ? 'text-buy' : 'text-avoid')}>
            {m.totalReturn >= 0 ? '+' : ''}{m.totalReturn?.toFixed(2)}%
          </p>
        </div>
        {m.alpha !== undefined && (
          <div>
            <p className="stat-label">Alpha vs SPY</p>
            <p className={clsx('text-lg font-bold font-mono', m.alpha >= 0 ? 'text-buy' : 'text-avoid')}>
              {m.alpha >= 0 ? '+' : ''}{m.alpha?.toFixed(2)}%
            </p>
          </div>
        )}
        <div>
          <p className="stat-label">Sharpe</p>
          <p className="text-sm font-mono text-white">{m.sharpe?.toFixed(2)}</p>
        </div>
        <div>
          <p className="stat-label">Max Drawdown</p>
          <p className="text-sm font-mono text-avoid">-{m.maxDrawdown?.toFixed(2)}%</p>
        </div>
        <div>
          <p className="stat-label">Volatility (ann.)</p>
          <p className="text-sm font-mono text-white">{m.volatility?.toFixed(2)}%</p>
        </div>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-elevated border border-white/10 rounded-lg p-3 text-xs">
      <p className="text-white/50 mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-mono text-white">{p.value?.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

export function BenchmarkChart() {
  const { watchlist } = useWatchlist();
  const [period, setPeriod] = useState('1Y');
  const [selectedTickers, setSelectedTickers] = useState(watchlist.slice(0, 4));
  const { data, loading, error } = useBenchmark([...selectedTickers, 'SPY'], period);

  const chartData = data ? buildChartData(data.series) : [];
  const allTickers = data ? Object.keys(data.series) : [];

  function toggleTicker(ticker) {
    if (ticker === 'SPY') return;
    setSelectedTickers(prev =>
      prev.includes(ticker) ? prev.filter(t => t !== ticker) : [...prev, ticker].slice(0, 6)
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Portfolio vs S&P 500</h1>
        <div className="flex items-center gap-1 bg-surface-elevated rounded-lg p-1 border border-white/5">
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={clsx(
                'px-3 py-1 text-xs rounded transition-colors',
                period === p ? 'bg-accent text-white' : 'text-white/50 hover:text-white'
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-2 mb-4">
          {watchlist.map(ticker => (
            <button
              key={ticker}
              onClick={() => toggleTicker(ticker)}
              className={clsx(
                'text-xs px-2 py-1 rounded border transition-colors font-mono',
                selectedTickers.includes(ticker)
                  ? 'bg-accent/20 text-accent border-accent/30'
                  : 'bg-white/5 text-white/40 border-white/10 hover:text-white'
              )}
            >
              {ticker}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner label="Loading price data..." />
          </div>
        )}

        {error && (
          <div className="text-center text-avoid text-sm py-12">{error}</div>
        )}

        {!loading && !error && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                tickFormatter={d => d?.slice(5)}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                tickFormatter={v => `${v.toFixed(0)}`}
                domain={['auto', 'auto']}
                width={45}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}
              />
              {allTickers.filter(t => t === 'SPY').map(() => (
                <Line key="SPY" type="monotone" dataKey="SPY" stroke="#ffffff40" strokeWidth={2} dot={false} strokeDasharray="4 4" />
              ))}
              {allTickers.filter(t => t !== 'SPY').map((ticker, i) => (
                <Line key={ticker} type="monotone" dataKey={ticker} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {['SPY', ...selectedTickers].map((ticker, i) => (
            <MetricCard
              key={ticker}
              ticker={ticker}
              metrics={data.metrics}
              color={ticker === 'SPY' ? '#ffffff40' : COLORS[(i - 1) % COLORS.length]}
              isSPY={ticker === 'SPY'}
            />
          ))}
        </div>
      )}
    </div>
  );
}
