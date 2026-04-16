# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: Alpha Engine

Autonomous stock screening and recommendation system. Classifies stocks by investment archetype (Growth, Value, Momentum, Quality, Turnaround, Hybrid), scores them across fundamental + technical dimensions, and outputs BUY / HOLD / AVOID recommendations with conviction scores benchmarked against SPY.

## Commands

### Backend (Node.js + Express) — `cd backend`
```bash
npm install
cp .env.example .env          # then fill in API keys
npm run dev                   # nodemon, port 3001
npm start                     # production
npm test                      # jest
```

### Frontend (React + Vite + Tailwind) — `cd frontend`
```bash
npm install
npm run dev                   # Vite dev server, port 3000, proxies /api → localhost:3001
npm run build                 # production build to dist/
npm run preview               # serve the build locally
```

Both servers must run simultaneously during development. The Vite proxy handles all `/api/*` calls so no CORS config is needed in development.

## Architecture

### Backend Service Graph

```
src/index.js                          Express server + rate limiter + scheduler init
  └── routes/stocks.js                All REST endpoints under /api/stocks
        ├── StockAnalysisService.js   Orchestrates full analysis pipeline per ticker
        │     ├── data/AlphaVantageService.js   Fundamentals, technicals (RSI, MACD, SMA)
        │     ├── data/YahooFinanceService.js   Real-time quotes, price history (yahoo-finance2)
        │     ├── data/FMPService.js            DCF, key metrics, financial ratios
        │     ├── classification/ClassificationEngine.js  Rule-based type assignment
        │     └── scoring/ScoringEngine.js      Type-specific weighted dimension scores
        ├── BenchmarkService.js       Historical price normalization + alpha/Sharpe vs SPY
        └── data/FREDService.js       Macro data (risk-free rate, CPI, Fed Funds)
  └── services/cache/CacheService.js  In-memory TTL cache (singleton)
  └── scheduler/DataRefreshScheduler.js  node-cron: refreshes watchlist 3x per trading day
```

### Classification → Scoring Flow

1. `buildFundamentals(ticker)` in `StockAnalysisService.js` fans out to all data APIs and normalizes ~35 fields into a flat object (nulls for unavailable data).
2. `classifyStock(ticker, fundamentals)` in `ClassificationEngine.js` runs 5 independent scorers (Growth, Value, Momentum, Quality, Turnaround) and picks the highest. If the top two are within 2 points, type becomes HYBRID.
3. `scoreStock(ticker, classification, fundamentals)` in `ScoringEngine.js` applies the type-specific weighted dimension scoring (each sub-score 0–100), producing a final `score` (0–100) and `conviction` (average of classification confidence + score quality).
4. Recommendation thresholds: `score ≥ 75 && conviction ≥ 70` → BUY; `score ≥ 60 && conviction ≥ 50` → BUY; `score ≥ 45` → HOLD; else AVOID.

### Frontend Component Tree

```
App.jsx (BrowserRouter + WatchlistProvider)
  ├── /               Dashboard.jsx
  │     ├── MacroBanner.jsx          SPY quote + FRED macro strip
  │     └── WatchlistRow.jsx         Per-ticker row with ScoreGauge + badges
  ├── /stock/:ticker  StockDetail.jsx
  │     ├── ConvictionCard.jsx       Score, recommendation, classification breakdown
  │     └── IndicatorPanel.jsx       Adaptive sections ordered by classification type
  ├── /screener       Screener.jsx   Filter by sector/rec/class/score/mktcap
  └── /benchmark      BenchmarkChart.jsx  Recharts LineChart, normalized to 100, vs SPY
```

### State & Data Flow (Frontend)

- `WatchlistContext` — persists ticker list to `localStorage`; shared across all views
- `useWatchlistData(tickers)` — polls backend every 2 minutes, stores analysis results
- `useStockDetail(ticker)` — fetches analysis + profile in parallel on route mount
- `useBenchmark(tickers, period)` — fetches historical comparison data
- All hooks use `Promise.allSettled` internally; errors are per-ticker, not global

### API Routes

| Method | Path | Description |
|---|---|---|
| GET | `/api/stocks/watchlist?tickers=AAPL,MSFT` | Batch analyze (defaults to env watchlist) |
| GET | `/api/stocks/:ticker` | Single stock full analysis |
| GET | `/api/stocks/:ticker/profile` | DCF + price target from FMP |
| GET | `/api/stocks/benchmark/compare?tickers=AAPL&period=1Y` | Price history vs SPY |
| GET | `/api/stocks/screener/filter` | Filter watchlist by params |
| GET | `/api/stocks/macro/snapshot` | FRED macro + SPY quote |
| DELETE | `/api/stocks/cache/clear` | Flush in-memory cache |

### Cache Strategy

`CacheService` is a singleton in-memory store with per-key TTL timers. Default TTLs (configurable via env):
- Real-time quotes: 60s (`CACHE_TTL_QUOTES`)
- Fundamentals / analysis: 3600s (`CACHE_TTL_FUNDAMENTALS`)
- Macro data: 86400s (`CACHE_TTL_MACRO`)

Cache keys are namespaced by service prefix (`av:`, `yf:`, `fmp:`, `fred:`, `analysis:`).

## Required Environment Variables

See `backend/.env.example`. The four API keys needed:
- `ALPHA_VANTAGE_API_KEY` — free tier: 25 req/day, 5 req/min
- `FRED_API_KEY` — free, unlimited
- `FMP_API_KEY` — free tier: 250 req/day
- Yahoo Finance — no key needed (uses `yahoo-finance2` npm package)

Free-tier rate limits mean the scheduler will fail if the watchlist has more tickers than the daily quota allows. Keep the watchlist ≤ 10 tickers on free tier.

## Key Conventions

- All monetary values in the `fundamentals` object are raw numbers (no formatting). Use `fmt()` in `frontend/src/utils/format.js` for display.
- Ratios stored as decimals (`returnOnEquity: 0.18` not `18`), percentages also as decimals (`revenueGrowthYoY: 0.15`).
- `null` means data was unavailable; `NaN` should never appear (use `safeNum()` helper).
- The scoring functions score 0–100 per sub-dimension and `clamp()` the result. Adding new metrics: add the sub-score to the dimension's `breakdown` object and include it in the weighted sum.
- Frontend color tokens: `text-buy` (green), `text-avoid` (red), `text-hold`/`text-accent` (amber/indigo) — defined in `tailwind.config.js` and `index.css`.
