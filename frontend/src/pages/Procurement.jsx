import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShoppingCart, TrendingUp, Ship, Fuel, Loader2, AlertTriangle,
} from 'lucide-react';
import { rankAlternatives } from '../api';

function getScoreColor(score) {
  if (score >= 0.8) return 'text-risk-low';
  if (score >= 0.6) return 'text-risk-moderate';
  if (score >= 0.4) return 'text-risk-elevated';
  return 'text-risk-high';
}

function getScoreBarColor(score) {
  if (score >= 0.8) return 'bg-risk-low';
  if (score >= 0.6) return 'bg-risk-moderate';
  if (score >= 0.4) return 'bg-risk-elevated';
  return 'bg-risk-high';
}

export default function Procurement() {
  const [searchParams] = useSearchParams();
  const corridorParam = searchParams.get('corridor') || 'Strait of Hormuz';

  const [corridor, setCorridor] = useState(corridorParam);
  const [alternatives, setAlternatives] = useState([]);
  const [rankingWeights, setRankingWeights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [llmInfo, setLlmInfo] = useState(null);

  const fetchAlternatives = async () => {
    setLoading(true);
    try {
      const res = await rankAlternatives(corridor);
      setAlternatives(res.data.alternatives);
      setRankingWeights(res.data.ranking_weights);
      setLlmInfo({ provider: res.data.llm_provider, model: res.data.llm_model });
    } catch (err) {
      console.error('Failed to fetch alternatives:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlternatives();
  }, [corridor]);

  const corridors = [
    'Strait of Hormuz', 'Red Sea', 'Iran Exports', 'Persian Gulf', 'Suez Canal',
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="section-heading">
              Procurement <em>Alternatives</em>
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Ranked alternative crude sources for disrupted corridor
            </p>
          </div>
        </div>

        {/* Corridor selector */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Disrupted:</span>
          <select
            value={corridor}
            onChange={(e) => setCorridor(e.target.value)}
            className="bg-surface-700 border border-surface-400 rounded-md px-3 py-1.5 text-xs font-mono text-amber-400 focus:outline-none focus:border-amber-500/50 cursor-pointer"
          >
            {corridors.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Ranking Weights */}
      {rankingWeights && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <span className="bracket-label">RANKING WEIGHTS</span>
          </div>
          <div className="flex items-center gap-6">
            {Object.entries(rankingWeights).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-text-muted uppercase">
                  {key.replace(/_/g, ' ')}:
                </span>
                <span className="font-mono text-xs text-amber-400">{(value * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alternatives List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-36 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {alternatives.map((supplier, index) => (
            <div
              key={supplier.id}
              className={`card transition-all duration-200 ${
                index === 0 ? 'border-amber-500/30 bg-amber-500/[0.03]' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Rank badge */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  index === 0 ? 'bg-amber-500/15 border border-amber-500/30' : 'bg-surface-600 border border-surface-400'
                }`}>
                  <span className={`font-mono text-lg font-bold ${
                    index === 0 ? 'text-amber-400' : 'text-text-muted'
                  }`}>
                    {index + 1}
                  </span>
                </div>

                {/* Supplier info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="font-mono text-sm font-medium text-text-primary">
                      {supplier.name}
                    </h3>
                    {index === 0 && (
                      <span className="pill-tag text-[9px] border-amber-500/40 text-amber-400 bg-amber-500/5">
                        TOP RANKED
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mb-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Ship className="w-3 h-3 text-text-muted" />
                      <span className="font-mono text-[10px] text-text-secondary">{supplier.route}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Fuel className="w-3 h-3 text-text-muted" />
                      <span className="font-mono text-[10px] text-text-secondary">{supplier.crude_grade}</span>
                    </div>
                  </div>

                  {/* Score metrics */}
                  <div className="grid grid-cols-5 gap-3 mb-3">
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted">Price</p>
                      <p className="font-mono text-sm text-text-primary">${supplier.spot_price_usd_bbl}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted">Tanker Avail</p>
                      <p className="font-mono text-sm text-text-primary">{(supplier.tanker_availability_score * 100).toFixed(0)}%</p>
                    </div>
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted">Congestion</p>
                      <p className="font-mono text-sm text-text-primary">{(supplier.port_congestion_score * 100).toFixed(0)}%</p>
                    </div>
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted">Compat.</p>
                      <p className="font-mono text-sm text-text-primary">{(supplier.refinery_grade_compatibility_score * 100).toFixed(0)}%</p>
                    </div>
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted">Transit</p>
                      <p className="font-mono text-sm text-text-primary">{supplier.transit_days}d</p>
                    </div>
                  </div>

                  {/* Justification */}
                  {supplier.justification && (
                    <div className="bg-surface-800 rounded-md px-3 py-2 border border-surface-500">
                      <p className="text-xs text-text-secondary italic leading-relaxed">
                        "{supplier.justification}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Composite score */}
                <div className="flex-shrink-0 text-right">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted mb-1">Score</p>
                  <p className={`score-display ${getScoreColor(supplier.composite_score)}`}>
                    {(supplier.composite_score * 100).toFixed(1)}
                  </p>
                  <div className="w-16 h-1.5 bg-surface-500 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getScoreBarColor(supplier.composite_score)}`}
                      style={{ width: `${supplier.composite_score * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LLM attribution */}
      {llmInfo?.provider && (
        <div className="flex items-center gap-2 text-text-muted">
          <span className="font-mono text-[9px] uppercase tracking-widest">
            Justifications via {llmInfo.provider} · {llmInfo.model}
          </span>
        </div>
      )}
    </div>
  );
}
