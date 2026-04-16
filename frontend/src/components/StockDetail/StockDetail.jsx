import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStockDetail } from '../../hooks/useStockData';
import { ConvictionCard } from './ConvictionCard';
import { IndicatorPanel } from './IndicatorPanel';
import { LoadingSpinner } from '../common/LoadingSpinner';

export function StockDetail() {
  const { ticker } = useParams();
  const { data, profile, loading, error } = useStockDetail(ticker?.toUpperCase());

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <LoadingSpinner size="lg" label={`Analyzing ${ticker?.toUpperCase()}...`} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card text-center py-12">
        <p className="text-avoid mb-4">{error}</p>
        <Link to="/" className="text-accent text-sm hover:underline">← Back to Dashboard</Link>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      <Link to="/" className="text-white/40 text-sm hover:text-white transition-colors">
        ← Dashboard
      </Link>

      <ConvictionCard data={data} />

      {profile?.dcf && (
        <div className="card">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">DCF Valuation</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="stat-label">DCF Fair Value</p>
              <p className="stat-value font-mono text-accent">
                ${parseFloat(profile.dcf.dcf || 0).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="stat-label">Current Price</p>
              <p className="stat-value font-mono">${parseFloat(profile.dcf.price || 0).toFixed(2)}</p>
            </div>
            {profile.dcf.dcf && profile.dcf.price && (
              <div>
                <p className="stat-label">DCF Upside</p>
                <p className={`stat-value font-mono ${parseFloat(profile.dcf.dcf) > parseFloat(profile.dcf.price) ? 'text-buy' : 'text-avoid'}`}>
                  {((parseFloat(profile.dcf.dcf) / parseFloat(profile.dcf.price) - 1) * 100).toFixed(1)}%
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <IndicatorPanel data={data} />

      {data.fundamentals?.description && (
        <div className="card">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-3">About</h3>
          <p className="text-white/60 text-sm leading-relaxed line-clamp-4">
            {data.fundamentals.description}
          </p>
        </div>
      )}
    </div>
  );
}
