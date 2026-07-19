import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  TrendingUp,
  Send,
  RefreshCw,
  Radio,
  ArrowRight,
  Clock,
  Loader2,
} from 'lucide-react';
import { getCorridorScores, ingestSignal, resetDemoState } from '../api';

// Risk level thresholds and colors
function getRiskLevel(score) {
  if (score >= 80) return { level: 'CRITICAL', color: 'risk-critical', pillClass: 'pill-tag-critical', bg: 'bg-risk-critical' };
  if (score >= 60) return { level: 'HIGH', color: 'risk-high', pillClass: 'pill-tag-high', bg: 'bg-risk-high' };
  if (score >= 45) return { level: 'ELEVATED', color: 'risk-elevated', pillClass: 'pill-tag-elevated', bg: 'bg-risk-elevated' };
  if (score >= 30) return { level: 'MODERATE', color: 'risk-moderate', pillClass: 'pill-tag-moderate', bg: 'bg-risk-moderate' };
  return { level: 'LOW', color: 'risk-low', pillClass: 'pill-tag-low', bg: 'bg-risk-low' };
}

function getRiskBarColor(score) {
  if (score >= 80) return 'bg-risk-critical';
  if (score >= 60) return 'bg-risk-high';
  if (score >= 45) return 'bg-risk-elevated';
  if (score >= 30) return 'bg-risk-moderate';
  return 'bg-risk-low';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [corridors, setCorridors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [headline, setHeadline] = useState('');
  const [ingesting, setIngesting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [lastSignal, setLastSignal] = useState(null);
  const [resetMessage, setResetMessage] = useState('');
  const [animatingCorridor, setAnimatingCorridor] = useState(null);

  const fetchScores = useCallback(async () => {
    try {
      const res = await getCorridorScores();
      setCorridors(res.data.corridors);
    } catch (err) {
      console.error('Failed to fetch corridor scores:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScores();
    // Poll every 30 seconds for freshness
    const interval = setInterval(fetchScores, 30000);
    return () => clearInterval(interval);
  }, [fetchScores]);

  const handleIngestSignal = async (e) => {
    e.preventDefault();
    if (!headline.trim() || ingesting) return;

    setIngesting(true);
    setLastSignal(null);
    setResetMessage('');

    try {
      const res = await ingestSignal(headline.trim());
      setLastSignal(res.data);
      setAnimatingCorridor(res.data.corridor);
      setHeadline('');

      // Refresh scores
      await fetchScores();

      // Clear animation after 2 seconds
      setTimeout(() => setAnimatingCorridor(null), 2000);
    } catch (err) {
      console.error('Signal ingestion failed:', err);
      setLastSignal({ error: err.response?.data?.detail || 'Failed to process headline' });
    } finally {
      setIngesting(false);
    }
  };

  const handleCorridorClick = (corridorName) => {
    navigate(`/scenario?corridor=${encodeURIComponent(corridorName)}`);
  };

  const handleResetDemo = async () => {
    if (resetting) return;

    setResetting(true);
    setLastSignal(null);
    setResetMessage('');

    try {
      await resetDemoState(false);
      await fetchScores();
      setAnimatingCorridor(null);
      setResetMessage('Demo state reset to baseline. Ingest a headline to show live score movement.');
    } catch (err) {
      console.error('Demo state reset failed:', err);
      setLastSignal({ error: err.response?.data?.detail || 'Failed to reset demo state' });
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
          <span className="font-mono text-sm text-text-secondary">Loading corridor intelligence...</span>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  // Summary stats
  const highRiskCount = corridors.filter(c => c.score >= 60).length;
  const avgScore = corridors.length > 0 ? (corridors.reduce((sum, c) => sum + c.score, 0) / corridors.length).toFixed(1) : 0;
  const totalSignals = corridors.reduce((sum, c) => sum + c.signal_count, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header stats row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-risk-critical/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-risk-critical" />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">High Risk</p>
            <p className="score-display text-risk-critical">{highRiskCount}</p>
          </div>
        </div>

        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Avg Score</p>
            <p className="score-display text-amber-400">{avgScore}</p>
          </div>
        </div>

        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Radio className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Signals</p>
            <p className="score-display text-text-primary">{totalSignals}</p>
          </div>
        </div>

        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-risk-low/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-risk-low" />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Corridors</p>
            <p className="score-display text-text-primary">{corridors.length}</p>
          </div>
        </div>
      </div>

      {/* Live Signal Input — KEY DEMO MOMENT */}
      <div className="card border-amber-500/20 bg-surface-700/50">
        <div className="flex items-center gap-2 mb-3">
          <Radio className="w-4 h-4 text-amber-400" />
          <span className="bracket-label">LIVE SIGNAL INGESTION</span>
        </div>
        <form onSubmit={handleIngestSignal} className="flex gap-3">
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="Paste a news headline to analyze risk impact in real time..."
            className="flex-1 bg-surface-800 border border-surface-400 rounded-md px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 font-sans transition-colors"
            disabled={ingesting}
          />
          <button
            type="submit"
            disabled={ingesting || !headline.trim()}
            className="px-5 py-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-md font-mono text-xs uppercase tracking-wider hover:bg-amber-500/20 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {ingesting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {ingesting ? 'Analyzing...' : 'Ingest'}
          </button>
        </form>

        {/* Signal result feedback */}
        {lastSignal && !lastSignal.error && (
          <div className="mt-3 p-3 bg-surface-800 rounded-md border border-surface-500 animate-slide-up">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`pill-tag ${getRiskLevel(lastSignal.updated_score || 0).pillClass}`}>
                {lastSignal.corridor}
              </span>
              <span className="pill-tag">{lastSignal.risk_category}</span>
              <span className="font-mono text-xs text-text-secondary">
                Severity: <span className="text-amber-400">{lastSignal.severity}/5</span>
              </span>
              <span className="font-mono text-xs text-text-secondary">
                Confidence: <span className="text-amber-400">{(lastSignal.confidence * 100).toFixed(0)}%</span>
              </span>
              {lastSignal.previous_score != null && lastSignal.updated_score != null && (
                <span className="font-mono text-xs text-risk-high">
                  Score: {lastSignal.previous_score.toFixed(1)} → {lastSignal.updated_score.toFixed(1)}
                </span>
              )}
            </div>
            {lastSignal.one_line_reasoning && (
              <p className="mt-2 text-xs text-text-secondary italic">
                "{lastSignal.one_line_reasoning}"
              </p>
            )}
          </div>
        )}

        {lastSignal?.error && (
          <div className="mt-3 p-3 bg-risk-critical/5 border border-risk-critical/20 rounded-md">
            <p className="text-xs text-risk-critical font-mono">{lastSignal.error}</p>
          </div>
        )}

        {resetMessage && (
          <div className="mt-3 p-3 bg-risk-low/5 border border-risk-low/20 rounded-md">
            <p className="text-xs text-risk-low font-mono">{resetMessage}</p>
          </div>
        )}
      </div>

      {/* Corridor Risk Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="bracket-label">CORRIDOR RISK ASSESSMENT</span>
            <span className="font-mono text-[10px] text-text-muted ml-2">
              Click to model scenarios
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleResetDemo}
              disabled={resetting}
              className="flex items-center gap-1.5 text-text-muted hover:text-risk-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {resetting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              <span className="font-mono text-[10px] uppercase tracking-wider">Reset Demo</span>
            </button>
            <button
              onClick={fetchScores}
              className="flex items-center gap-1.5 text-text-muted hover:text-amber-400 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="font-mono text-[10px] uppercase tracking-wider">Refresh</span>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {corridors.map((corridor) => {
            const risk = getRiskLevel(corridor.score);
            const isAnimating = animatingCorridor === corridor.name;

            return (
              <div
                key={corridor.name}
                onClick={() => handleCorridorClick(corridor.name)}
                className={`card-interactive group flex items-center gap-4 transition-all duration-300 ${
                  isAnimating ? 'animate-score-pulse border-amber-500/50 bg-amber-500/5' : ''
                }`}
              >
                {/* Risk level indicator */}
                <div className={`w-1 h-14 rounded-full ${risk.bg} flex-shrink-0`} />

                {/* Corridor info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-mono text-sm font-medium text-text-primary truncate">
                      {corridor.name}
                    </h3>
                    <span className={`pill-tag text-[10px] ${risk.pillClass}`}>
                      {risk.level}
                    </span>
                    {corridor.signal_count > 0 && (
                      <span className="font-mono text-[10px] text-text-muted">
                        {corridor.signal_count} signals
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted truncate">{corridor.description}</p>
                </div>

                {/* Score bar */}
                <div className="w-40 flex-shrink-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] text-text-muted">
                      Import share: {(corridor.import_share_pct * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 bg-surface-500 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${getRiskBarColor(corridor.score)}`}
                      style={{ width: `${corridor.score}%` }}
                    />
                  </div>
                </div>

                {/* Score display */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`score-display text-${risk.color} ${isAnimating ? 'animate-score-pulse' : ''}`}>
                    {corridor.score.toFixed(1)}
                  </span>
                  <ArrowRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Context footer */}
      <div className="divider" />
      <div className="flex items-center gap-4 text-text-muted">
        <span className="font-mono text-[10px] uppercase tracking-wider">
          India sources ~88% of crude oil from imports
        </span>
        <span className="text-surface-400">|</span>
        <span className="font-mono text-[10px] uppercase tracking-wider">
          40–45% transits Strait of Hormuz
        </span>
        <span className="text-surface-400">|</span>
        <span className="font-mono text-[10px] uppercase tracking-wider">
          SPR cover: 9.5 days
        </span>
      </div>
    </div>
  );
}
