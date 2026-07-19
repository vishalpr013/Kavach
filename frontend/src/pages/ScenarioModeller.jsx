import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Area, AreaChart,
} from 'recharts';
import {
  Sliders, Play, Loader2, ChevronDown, ChevronUp, Info, ShoppingCart, ArrowRight,
} from 'lucide-react';
import { simulateScenario, getScenarioNarrative, computeDrawdown } from '../api';

const PRESETS = [
  {
    id: 'hormuz_closure',
    label: 'Hormuz Partial Closure',
    corridor: 'Strait of Hormuz',
    capacityLoss: 50,
    duration: 30,
    description: 'Partial blockade of the Strait of Hormuz reducing transit capacity',
  },
  {
    id: 'red_sea_suspension',
    label: 'Red Sea Suspension',
    corridor: 'Red Sea',
    capacityLoss: 80,
    duration: 45,
    description: 'Major shipping suspension through Red Sea / Bab-el-Mandeb',
  },
  {
    id: 'opec_cut',
    label: 'OPEC+ Emergency Cut',
    corridor: 'Persian Gulf',
    capacityLoss: 25,
    duration: 60,
    description: 'OPEC+ surprise production cut affecting Persian Gulf exports',
  },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-700 border border-surface-500 rounded-md px-3 py-2 shadow-lg">
      <p className="font-mono text-[10px] text-text-muted mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-mono text-xs" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function ScenarioModeller() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const corridorParam = searchParams.get('corridor');

  // Scenario state
  const [activePreset, setActivePreset] = useState(null);
  const [capacityLoss, setCapacityLoss] = useState(50);
  const [duration, setDuration] = useState(30);
  const [corridor, setCorridor] = useState(corridorParam || 'Strait of Hormuz');

  // Results
  const [scenarioResult, setScenarioResult] = useState(null);
  const [narrative, setNarrative] = useState(null);
  const [drawdownData, setDrawdownData] = useState(null);
  const [simLoading, setSimLoading] = useState(false);
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [activeTab, setActiveTab] = useState('impact');

  // Auto-select preset based on corridor param
  useEffect(() => {
    if (corridorParam) {
      const preset = PRESETS.find(p => p.corridor === corridorParam);
      if (preset) {
        setActivePreset(preset.id);
        setCapacityLoss(preset.capacityLoss);
        setDuration(preset.duration);
        setCorridor(preset.corridor);
      } else {
        setCorridor(corridorParam);
      }
    }
  }, [corridorParam]);

  // Simulate on slider change (fast, no LLM)
  const runSimulation = useCallback(async () => {
    setSimLoading(true);
    try {
      const scenarioType = activePreset || 'custom';
      const res = await simulateScenario(scenarioType, capacityLoss, duration, corridor);
      setScenarioResult(res.data);

      // Also compute drawdown
      const drawdownRes = await computeDrawdown(
        res.data.refinery_runrate_drop,
        duration,
        'front_loaded'
      );
      setDrawdownData(drawdownRes.data);
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setSimLoading(false);
    }
  }, [activePreset, capacityLoss, duration, corridor]);

  // Run simulation on mount and slider changes
  useEffect(() => {
    runSimulation();
  }, [runSimulation]);

  // Generate narrative (LLM call — only on explicit button press)
  const generateNarrative = async () => {
    if (!scenarioResult) return;
    setNarrativeLoading(true);
    try {
      const res = await getScenarioNarrative({
        scenario_type: activePreset || 'custom',
        corridor,
        capacity_loss_pct: capacityLoss,
        duration_days: duration,
        refinery_runrate_drop: scenarioResult.refinery_runrate_drop,
        fuel_price_impact_pct: scenarioResult.fuel_price_impact_pct,
        power_sector_stress_index: scenarioResult.power_sector_stress_index,
        gdp_stress_estimate_pct: scenarioResult.gdp_stress_estimate_pct,
      });
      setNarrative(res.data);
    } catch (err) {
      console.error('Narrative generation failed:', err);
      setNarrative({ narrative: 'Unable to generate narrative. Please check your LLM configuration.', provider: 'error', model: 'N/A' });
    } finally {
      setNarrativeLoading(false);
    }
  };

  const handlePresetClick = (preset) => {
    setActivePreset(preset.id);
    setCapacityLoss(preset.capacityLoss);
    setDuration(preset.duration);
    setCorridor(preset.corridor);
    setNarrative(null);
  };

  // Chart data
  const impactChartData = useMemo(() => {
    if (!scenarioResult) return [];
    return [
      { name: 'Refinery\nRun-Rate Drop', value: scenarioResult.refinery_runrate_drop, fill: '#E07A3A' },
      { name: 'Fuel Price\nImpact', value: scenarioResult.fuel_price_impact_pct, fill: '#DC4A4A' },
      { name: 'GDP Stress\nEstimate', value: scenarioResult.gdp_stress_estimate_pct, fill: '#D99A2B' },
      { name: 'Supply Gap\n(days)', value: scenarioResult.supply_gap_days, fill: '#D97706' },
    ];
  }, [scenarioResult]);

  const drawdownChartData = useMemo(() => {
    if (!drawdownData?.drawdown_curve) return [];
    return drawdownData.drawdown_curve.map(point => ({
      day: point.day,
      reserve: point.reserve_days_remaining,
      drawRate: point.daily_drawdown_rate,
    }));
  }, [drawdownData]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Preset Selector */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sliders className="w-4 h-4 text-amber-400" />
          <span className="bracket-label">SCENARIO PRESETS</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetClick(preset)}
              className={`card text-left transition-all duration-200 ${
                activePreset === preset.id
                  ? 'border-amber-500/40 bg-amber-500/5'
                  : 'hover:border-surface-400'
              }`}
            >
              <h4 className="font-mono text-xs font-medium text-text-primary mb-1">{preset.label}</h4>
              <p className="text-[11px] text-text-muted leading-relaxed">{preset.description}</p>
              <div className="mt-2 flex gap-2">
                <span className="pill-tag text-[9px]">{preset.capacityLoss}% loss</span>
                <span className="pill-tag text-[9px]">{preset.duration} days</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Sliders + Results Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Controls — left column */}
        <div className="col-span-3 space-y-5">
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <span className="bracket-label">PARAMETERS</span>
            </div>

            {/* Corridor display */}
            <div className="mb-4">
              <label className="font-mono text-[10px] uppercase tracking-widest text-text-muted block mb-1">
                Corridor
              </label>
              <div className="px-3 py-2 bg-surface-800 border border-surface-400 rounded-md font-mono text-xs text-amber-400">
                {corridor}
              </div>
            </div>

            {/* Capacity Loss Slider */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <label className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
                  Capacity Loss
                </label>
                <span className="font-mono text-sm text-amber-400 tabular-nums">{capacityLoss}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                value={capacityLoss}
                onChange={(e) => { setCapacityLoss(Number(e.target.value)); setNarrative(null); }}
                className="w-full h-1.5 bg-surface-500 rounded-full appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[9px] font-mono text-text-muted mt-0.5">
                <span>5%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Duration Slider */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <label className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
                  Duration
                </label>
                <span className="font-mono text-sm text-amber-400 tabular-nums">{duration} days</span>
              </div>
              <input
                type="range"
                min="1"
                max="180"
                value={duration}
                onChange={(e) => { setDuration(Number(e.target.value)); setNarrative(null); }}
                className="w-full h-1.5 bg-surface-500 rounded-full appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[9px] font-mono text-text-muted mt-0.5">
                <span>1 day</span>
                <span>180 days</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              <button
                onClick={generateNarrative}
                disabled={narrativeLoading || !scenarioResult}
                className="w-full px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-md font-mono text-xs uppercase tracking-wider hover:bg-amber-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {narrativeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {narrativeLoading ? 'Generating...' : 'Generate Analysis'}
              </button>

              <button
                onClick={() => navigate(`/procurement?corridor=${encodeURIComponent(corridor)}`)}
                className="w-full px-4 py-2 border border-surface-400 text-text-secondary rounded-md font-mono text-xs uppercase tracking-wider hover:border-amber-500/30 hover:text-amber-400 transition-all flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                View Alternatives
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Charts — right column */}
        <div className="col-span-9 space-y-5">
          {/* Tab bar */}
          <div className="flex items-center gap-1 border-b border-surface-500">
            <button
              onClick={() => setActiveTab('impact')}
              className={`px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors border-b-2 -mb-px ${
                activeTab === 'impact'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-text-muted hover:text-text-secondary'
              }`}
            >
              Cascading Impact
            </button>
            <button
              onClick={() => setActiveTab('reserves')}
              className={`px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors border-b-2 -mb-px ${
                activeTab === 'reserves'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-text-muted hover:text-text-secondary'
              }`}
            >
              Reserve Drawdown
            </button>
          </div>

          {/* Impact Chart Tab */}
          {activeTab === 'impact' && (
            <div className="card animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <span className="bracket-label">CASCADING IMPACT ANALYSIS</span>
                {scenarioResult && (
                  <span className="font-mono text-[10px] text-text-muted">
                    Import share: {scenarioResult.corridor_import_share}%
                  </span>
                )}
              </div>
              {scenarioResult ? (
                <div>
                  {/* Key metrics row */}
                  <div className="grid grid-cols-4 gap-3 mb-6">
                    <div className="bg-surface-800 rounded-md p-3 border border-surface-500">
                      <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted">Refinery Drop</p>
                      <p className="font-mono text-xl font-semibold text-risk-high tabular-nums">
                        {scenarioResult.refinery_runrate_drop.toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-surface-800 rounded-md p-3 border border-surface-500">
                      <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted">Price Impact</p>
                      <p className="font-mono text-xl font-semibold text-risk-critical tabular-nums">
                        +{scenarioResult.fuel_price_impact_pct.toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-surface-800 rounded-md p-3 border border-surface-500">
                      <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted">Power Stress</p>
                      <p className="font-mono text-xl font-semibold text-risk-elevated tabular-nums">
                        {scenarioResult.power_sector_stress_index.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-surface-800 rounded-md p-3 border border-surface-500">
                      <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted">GDP Stress</p>
                      <p className="font-mono text-xl font-semibold text-amber-400 tabular-nums">
                        {scenarioResult.gdp_stress_estimate_pct.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  {/* Bar chart */}
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={impactChartData} barSize={48}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A2F3A" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                        axisLine={{ stroke: '#2A2F3A' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                        axisLine={{ stroke: '#2A2F3A' }}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {impactChartData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                </div>
              )}
            </div>
          )}

          {/* Reserves Tab */}
          {activeTab === 'reserves' && (
            <div className="card animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <span className="bracket-label">STRATEGIC PETROLEUM RESERVE DRAWDOWN</span>
                {drawdownData && (
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-text-muted">
                      Initial: {drawdownData.initial_reserve_days} days
                    </span>
                    {drawdownData.reserve_depleted && (
                      <span className="pill-tag pill-tag-critical text-[9px]">
                        Depleted by day {drawdownData.depletion_day}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {drawdownChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={drawdownChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2F3A" />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      axisLine={{ stroke: '#2A2F3A' }}
                      tickLine={false}
                      label={{ value: 'Day', position: 'insideBottomRight', offset: -5, fill: '#6B7280', fontSize: 10 }}
                    />
                    <YAxis
                      tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      axisLine={{ stroke: '#2A2F3A' }}
                      tickLine={false}
                      label={{ value: 'Reserve (days)', angle: -90, position: 'insideLeft', fill: '#6B7280', fontSize: 10 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="reserve"
                      name="Reserve Days"
                      stroke="#D97706"
                      fill="#D97706"
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                </div>
              )}
            </div>
          )}

          {/* Narrative */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <span className="bracket-label">AI ANALYSIS NARRATIVE</span>
              {narrative?.provider && narrative.provider !== 'error' && (
                <span className="font-mono text-[9px] text-text-muted">
                  via {narrative.provider} · {narrative.model}
                </span>
              )}
            </div>
            {narrativeLoading ? (
              <div className="space-y-2">
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-4 w-5/6 rounded" />
                <div className="skeleton h-4 w-4/6 rounded" />
              </div>
            ) : narrative ? (
              <p className="text-sm text-text-secondary leading-relaxed font-sans">
                {narrative.narrative}
              </p>
            ) : (
              <p className="text-xs text-text-muted italic">
                Click "Generate Analysis" to get an AI-powered narrative assessment of this scenario.
              </p>
            )}
          </div>

          {/* Assumptions Panel */}
          {scenarioResult?.assumptions && (
            <div className="card">
              <button
                onClick={() => setShowAssumptions(!showAssumptions)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-text-muted" />
                  <span className="bracket-label">ASSUMPTIONS USED</span>
                </div>
                {showAssumptions ? (
                  <ChevronUp className="w-4 h-4 text-text-muted" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-text-muted" />
                )}
              </button>
              {showAssumptions && (
                <div className="mt-3 pt-3 border-t border-surface-500 animate-fade-in">
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(scenarioResult.assumptions).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-text-muted uppercase">{key.replace(/_/g, ' ')}</span>
                        <span className="font-mono text-xs text-text-secondary">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
