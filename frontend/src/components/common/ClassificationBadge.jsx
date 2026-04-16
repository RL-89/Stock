import React from 'react';
import clsx from 'clsx';

const COLORS = {
  GROWTH: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  VALUE: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  MOMENTUM: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  QUALITY: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  TURNAROUND: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  HYBRID: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
};

export function ClassificationBadge({ type }) {
  if (!type) return null;
  return (
    <span className={clsx(
      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
      COLORS[type] || COLORS.HYBRID
    )}>
      {type}
    </span>
  );
}
