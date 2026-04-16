export function fmt(value, type = 'number', opts = {}) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2, ...opts }).format(value);
    case 'pct':
      return `${value >= 0 ? '+' : ''}${(value * 100).toFixed(opts.decimals ?? 2)}%`;
    case 'pct2':
      return `${value >= 0 ? '+' : ''}${value.toFixed(opts.decimals ?? 2)}%`;
    case 'mktcap':
      if (Math.abs(value) >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
      if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
      if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
      return `$${value.toFixed(0)}`;
    case 'ratio':
      return value.toFixed(opts.decimals ?? 2);
    default:
      return value.toFixed(opts.decimals ?? 2);
  }
}

export function pctChange(value) {
  if (value === null || value === undefined) return { label: '—', positive: null };
  const label = `${value >= 0 ? '+' : ''}${(value * 100).toFixed(2)}%`;
  return { label, positive: value >= 0 };
}
