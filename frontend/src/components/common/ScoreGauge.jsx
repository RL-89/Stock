import React from 'react';
import clsx from 'clsx';

function getColor(score) {
  if (score >= 70) return '#10b981'; // green
  if (score >= 50) return '#f59e0b'; // amber
  return '#ef4444'; // red
}

export function ScoreGauge({ score, conviction, size = 80 }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, score)) / 100;
  const strokeDashoffset = circumference * (1 - pct);
  const color = getColor(score);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-lg font-bold leading-none" style={{ color }}>{score}</span>
        {conviction !== undefined && (
          <span className="text-[10px] text-white/40 mt-0.5">{conviction}%</span>
        )}
      </div>
    </div>
  );
}
