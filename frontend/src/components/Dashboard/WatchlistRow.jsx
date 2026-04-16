import React from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { RecommendationBadge } from '../common/RecommendationBadge';
import { ClassificationBadge } from '../common/ClassificationBadge';
import { ScoreGauge } from '../common/ScoreGauge';
import { fmt } from '../../utils/format';

export function WatchlistRow({ stock, onRemove }) {
  if (stock.error) {
    return (
      <tr className="border-b border-white/5">
        <td className="py-3 px-4 font-mono font-semibold text-white/60">{stock.ticker}</td>
        <td colSpan={7} className="py-3 px-4 text-avoid text-sm">{stock.error}</td>
      </tr>
    );
  }

  const { ticker, recommendation, score, conviction, classification, fundamentals } = stock;
  const price = fundamentals?.currentPrice;
  const changeYoY = fundamentals?.revenueGrowthYoY;

  return (
    <tr className="border-b border-white/5 hover:bg-white/3 transition-colors group">
      <td className="py-3 px-4">
        <Link to={`/stock/${ticker}`} className="flex items-center gap-3 hover:text-accent transition-colors">
          <div>
            <div className="font-mono font-semibold text-white">{ticker}</div>
            <div className="text-xs text-white/40 truncate max-w-[120px]">{fundamentals?.name}</div>
          </div>
        </Link>
      </td>
      <td className="py-3 px-4">
        <ClassificationBadge type={classification?.type} />
      </td>
      <td className="py-3 px-4">
        <RecommendationBadge recommendation={recommendation} />
      </td>
      <td className="py-3 px-4">
        <ScoreGauge score={score || 0} conviction={conviction} size={56} />
      </td>
      <td className="py-3 px-4 font-mono text-right">
        {price ? fmt(price, 'currency') : '—'}
      </td>
      <td className="py-3 px-4 text-right">
        {changeYoY !== null && changeYoY !== undefined ? (
          <span className={clsx('font-mono text-sm', changeYoY >= 0 ? 'text-buy' : 'text-avoid')}>
            {changeYoY >= 0 ? '+' : ''}{(changeYoY * 100).toFixed(1)}%
          </span>
        ) : '—'}
      </td>
      <td className="py-3 px-4 text-right text-white/60 text-sm">
        {fundamentals?.marketCap ? fmt(fundamentals.marketCap, 'mktcap') : '—'}
      </td>
      <td className="py-3 px-4 text-right">
        {onRemove && (
          <button
            onClick={() => onRemove(ticker)}
            className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-avoid text-xs px-2 py-1 rounded transition-all"
          >
            ✕
          </button>
        )}
      </td>
    </tr>
  );
}
