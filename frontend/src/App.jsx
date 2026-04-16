import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { WatchlistProvider } from './context/WatchlistContext';
import { Dashboard } from './components/Dashboard/Dashboard';
import { StockDetail } from './components/StockDetail/StockDetail';
import { Screener } from './components/Screener/Screener';
import { BenchmarkChart } from './components/Benchmark/BenchmarkChart';

function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `text-sm px-3 py-1.5 rounded-lg transition-colors ${
          isActive ? 'bg-accent/20 text-accent' : 'text-white/50 hover:text-white'
        }`
      }
    >
      {label}
    </NavLink>
  );
}

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-surface">
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-surface/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-accent font-bold text-lg tracking-tight">⚡ Alpha Engine</span>
          </div>
          <div className="flex items-center gap-1">
            <NavItem to="/" label="Dashboard" />
            <NavItem to="/screener" label="Screener" />
            <NavItem to="/benchmark" label="Benchmark" />
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <WatchlistProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/stock/:ticker" element={<StockDetail />} />
          <Route path="/screener" element={<Screener />} />
          <Route path="/benchmark" element={<BenchmarkChart />} />
        </Routes>
      </Layout>
    </WatchlistProvider>
  );
}
