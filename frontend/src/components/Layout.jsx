import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  ShoppingCart,
  Globe2,
  Info,
  Settings,
  Shield,
  Zap,
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'RISK INTEL', icon: Activity, shortLabel: 'RISK' },
  { path: '/scenario', label: 'SCENARIOS', icon: BarChart3, shortLabel: 'SIM' },
  { path: '/procurement', label: 'PROCUREMENT', icon: ShoppingCart, shortLabel: 'PROC' },
  { path: '/map', label: 'DIGITAL TWIN', icon: Globe2, shortLabel: 'MAP' },
  { path: '/about', label: 'ABOUT', icon: Info, shortLabel: 'ABOUT' },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-surface-900 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-surface-800 border-r border-surface-500 flex flex-col fixed h-screen z-30">
        {/* Logo / Brand */}
        <div className="px-4 py-5 border-b border-surface-500">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h1 className="font-display text-base font-semibold text-text-primary tracking-tight">
                Kavach
              </h1>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-text-muted">
                supply chain resilience
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-mono uppercase tracking-wider transition-all duration-200 group ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-700 border border-transparent'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
              {path === '/' && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-risk-critical animate-pulse" />
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section — status + settings */}
        <div className="px-2 pb-3 space-y-1 border-t border-surface-500 pt-3">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-mono uppercase tracking-wider transition-all duration-200 ${
                isActive
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-text-muted hover:text-text-secondary hover:bg-surface-700 border border-transparent'
              }`
            }
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </NavLink>

          {/* Connection status indicator */}
          <div className="px-3 py-2 flex items-center gap-2">
            <Zap className="w-3 h-3 text-risk-low" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-text-muted">
              Groq · Online
            </span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-56">
        {/* Top bar */}
        <header className="h-12 bg-surface-800/80 backdrop-blur-sm border-b border-surface-500 flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="bracket-label">
              {location.pathname === '/' && 'CORRIDOR RISK DASHBOARD'}
              {location.pathname === '/scenario' && 'DISRUPTION SCENARIO MODELLER'}
              {location.pathname === '/procurement' && 'PROCUREMENT ORCHESTRATOR'}
              {location.pathname === '/map' && 'SUPPLY CHAIN DIGITAL TWIN'}
              {location.pathname === '/about' && 'ABOUT KAVACH'}
              {location.pathname === '/settings' && 'SYSTEM SETTINGS'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider">
              India Energy Supply Chain
            </span>
            <div className="w-px h-4 bg-surface-500" />
            <span className="font-mono text-[10px] text-amber-400 tabular-nums">
              {new Date().toLocaleTimeString('en-US', { hour12: false })}
            </span>
          </div>
        </header>

        {/* Page content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
