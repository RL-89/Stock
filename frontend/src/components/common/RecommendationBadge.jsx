import React from 'react';
import clsx from 'clsx';

const CONFIG = {
  BUY: { label: 'BUY', className: 'badge-buy' },
  HOLD: { label: 'HOLD', className: 'badge-hold' },
  AVOID: { label: 'AVOID', className: 'badge-avoid' },
};

export function RecommendationBadge({ recommendation, size = 'sm' }) {
  const cfg = CONFIG[recommendation] || CONFIG.HOLD;
  return (
    <span className={clsx(cfg.className, size === 'lg' && 'text-sm px-3 py-1')}>
      {cfg.label}
    </span>
  );
}
