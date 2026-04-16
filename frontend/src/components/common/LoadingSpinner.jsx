import React from 'react';

export function LoadingSpinner({ size = 'md', label }) {
  const s = size === 'sm' ? 16 : size === 'lg' ? 48 : 32;
  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={s} height={s} viewBox="0 0 24 24" className="animate-spin text-accent">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
        <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      {label && <p className="text-white/50 text-sm">{label}</p>}
    </div>
  );
}
