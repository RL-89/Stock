import React from 'react';
import clsx from 'clsx';
import { ScoreGauge } from '../common/ScoreGauge';
import { RecommendationBadge } from '../common/RecommendationBadge';
import { ClassificationBadge } from '../common/ClassificationBadge';
import { fmt } from '../../utils/format';

export function ConvictionCard({ data }) {
  const { ticker, recommendation, score, conviction, classification, fundamentals } = data;

  return (
    <div className="card space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-mono text-white">{ticker}</h1>
          <p className="text-white/50 text-sm mt-0.5">{fundamentals?.name}</p>
          <p className="text-white/30 text-xs">{fundamentals?.sector} · {fundamentals?.industry}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <RecommendationBadge recommendation={recommendation} size="lg" />
          <ClassificationBadge type={classification?.type} />
        </div>
      </div>

      <div className="flex items-center gap-6 py-4 border-y border-white/5">
        <div className="flex items-center gap-4">
          <ScoreGauge score={score || 0} conviction={conviction} size={80} />
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider">Alpha Score</p>
            <p className="text-2xl font-bold text-white">{score}</p>
            <p className="text-xs text-white/40">{conviction}% conviction</p>
          </div>
        </div>
        <div className="h-12 w-px bg-white/10" />
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Current Price</p>
          <p className="text-2xl font-bold font-mono text-white">
            {fundamentals?.currentPrice ? fmt(fundamentals.currentPrice, 'currency') : '—'}
          </p>
          <p className="text-xs text-white/40">{fundamentals?.exchange}</p>
        </div>
        {fundamentals?.analystTargetPrice && (
          <>
            <div className="h-12 w-px bg-white/10" />
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Target Price</p>
              <p className="text-xl font-bold font-mono text-accent">
                {fmt(fundamentals.analystTargetPrice, 'currency')}
              </p>
              <p className={clsx('text-xs', fundamentals.analystTargetUpsidePct >= 0 ? 'text-buy' : 'text-avoid')}>
                {fundamentals.analystTargetUpsidePct >= 0 ? '+' : ''}
                {(fundamentals.analystTargetUpsidePct * 100).toFixed(1)}% upside
              </p>
            </div>
          </>
        )}
      </div>

      {classification?.indicators?.length > 0 && (
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Key Signals</p>
          <div className="flex flex-wrap gap-2">
            {classification.indicators.map((ind, i) => (
              <span key={i} className="text-xs bg-white/5 text-white/70 px-2 py-1 rounded border border-white/10">
                {ind}
              </span>
            ))}
          </div>
        </div>
      )}

      {classification?.scoreBreakdown && (
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Classification Breakdown</p>
          <div className="space-y-1.5">
            {classification.scoreBreakdown.map(item => (
              <div key={item.type} className="flex items-center gap-3">
                <span className="text-xs text-white/50 w-24">{item.type}</span>
                <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent/60"
                    style={{ width: `${Math.max(0, Math.min(100, (item.score / 14) * 100))}%` }}
                  />
                </div>
                <span className="text-xs text-white/30 w-6 text-right">{item.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
