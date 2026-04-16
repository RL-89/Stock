import React from 'react';
import { useMacro } from '../../hooks/useStockData';
import { fmt } from '../../utils/format';
import clsx from 'clsx';

export function MacroBanner() {
  const { data, loading } = useMacro();

  if (loading || !data) return null;

  const { macro, spy } = data;

  const items = [
    { label: 'SPY', value: spy?.price ? fmt(spy.price, 'currency') : '—', sub: spy?.changePercent ? `${spy.changePercent >= 0 ? '+' : ''}${spy.changePercent.toFixed(2)}%` : null, positive: spy?.changePercent >= 0 },
    { label: 'Risk-Free Rate', value: macro?.riskFreeRate ? `${(macro.riskFreeRate * 100).toFixed(2)}%` : '—' },
    { label: 'Fed Funds', value: macro?.fedFundsRate ? `${(macro.fedFundsRate * 100).toFixed(2)}%` : '—' },
    { label: 'CPI YoY', value: macro?.cpi?.yoy ? `${macro.cpi.yoy.toFixed(2)}%` : '—' },
  ];

  return (
    <div className="flex items-center gap-6 px-4 py-2 bg-surface-elevated rounded-lg border border-white/5 text-sm overflow-x-auto scrollbar-thin">
      <span className="text-white/30 text-xs font-semibold uppercase tracking-widest flex-shrink-0">Macro</span>
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-2 flex-shrink-0">
          <span className="text-white/40">{item.label}</span>
          <span className="font-mono font-semibold text-white">{item.value}</span>
          {item.sub && (
            <span className={clsx('font-mono text-xs', item.positive ? 'text-buy' : 'text-avoid')}>
              {item.sub}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
