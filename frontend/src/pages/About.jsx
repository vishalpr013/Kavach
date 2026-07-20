import { Shield, RadioTower, BarChart3, Route, Database, Table2 } from 'lucide-react';

const modules = [
  {
    label: 'Risk Intelligence',
    icon: RadioTower,
    body: 'Ingests manual headlines and live RSS feeds, extracts geopolitical signals, and updates corridor risk scores.',
  },
  {
    label: 'Scenario Modeller',
    icon: BarChart3,
    body: 'Turns capacity loss, duration, and import exposure into refinery, fuel price, power, GDP, and reserve stress estimates.',
  },
  {
    label: 'Procurement & Routing',
    icon: Route,
    body: 'Ranks alternate crude suppliers and links corridor disruptions to operational response options.',
  },
  {
    label: 'Transparent Assumptions',
    icon: Database,
    body: 'Keeps constants, caps, import shares, backtesting limits, and model boundaries visible for demo scrutiny.',
  },
];

const backtestRows = [
  {
    event: 'US-Iran Standoff',
    corridor: 'Strait of Hormuz',
    predicted: '3.58%',
    actual: '-4.61%',
    error: '8.18%',
  },
  {
    event: 'Libya Port Blockade',
    corridor: 'Suez Canal',
    predicted: '1.00%',
    actual: '-6.04%',
    error: '7.04%',
  },
  {
    event: 'OPEC+ COVID Cut',
    corridor: 'Persian Gulf',
    predicted: '5.05%',
    actual: '-37.78%',
    error: '42.83%',
    boundary: true,
  },
  {
    event: 'Ever Given Suez Blockage',
    corridor: 'Suez Canal',
    predicted: '1.50%',
    actual: '5.49%',
    error: '4.00%',
  },
  {
    event: 'OPEC+ Surprise Cut',
    corridor: 'Persian Gulf',
    predicted: '2.81%',
    actual: '-0.14%',
    error: '2.95%',
  },
  {
    event: 'Houthi Red Sea Attacks',
    corridor: 'Red Sea',
    predicted: '2.18%',
    actual: '1.33%',
    error: '0.85%',
  },
  {
    event: 'Iran Seizes Tanker',
    corridor: 'Persian Gulf',
    predicted: '2.11%',
    actual: '0.98%',
    error: '1.12%',
  },
];

export default function About() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
          <Shield className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h2 className="section-heading">
            Kavach <em>Energy Resilience</em>
          </h2>
          <p className="text-sm text-text-secondary mt-2 max-w-3xl leading-relaxed">
            Kavach is a decision-support terminal for import-dependent energy systems. It combines live geopolitical signal ingestion,
            deterministic corridor risk scoring, scenario simulation, reserve drawdown planning, procurement ranking, and a geospatial
            digital twin into one demo-ready workflow.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {modules.map(({ label, icon: Icon, body }) => (
          <div key={label} className="card min-h-[150px]">
            <div className="flex items-center gap-2 mb-3">
              <Icon className="w-4 h-4 text-amber-400" />
              <span className="bracket-label">{label}</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">{body}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col xl:flex-row gap-4">
        <div className="card min-w-0 xl:flex-[1.4]">
          <span className="bracket-label">DEMO FLOW</span>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {[
              'Poll live feeds or paste a headline',
              'Review updated corridor risk',
              'Click a corridor into Scenario Modeller',
              'Check Reserve Drawdown stress',
              'Review procurement alternatives',
              'Inspect the Digital Twin map',
            ].map((step, index) => (
              <div key={step} className="flex min-h-[58px] items-center gap-3 rounded-md border border-surface-500 bg-surface-800 p-3">
                <span className="font-mono text-xs text-amber-400 tabular-nums shrink-0">{String(index + 1).padStart(2, '0')}</span>
                <span className="text-xs text-text-secondary leading-snug">{step}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card min-w-0 xl:flex-1">
          <span className="bracket-label">MODEL BOUNDARY</span>
          <p className="text-xs text-text-secondary leading-relaxed mt-4">
            The core model is supply-side. It is designed for corridor disruption, capacity loss, import-share exposure, and logistics
            response. Demand-collapse events, such as the COVID-era OPEC+ case, are treated as a known boundary rather than hidden error.
          </p>
          <div className="divider" />
          <div className="flex flex-wrap gap-2">
            <span className="pill-tag">Elasticity 1.3</span>
            <span className="pill-tag">80% fuel cap</span>
            <span className="pill-tag">15% GDP cap</span>
            <span className="pill-tag">Backtested</span>
          </div>
        </div>
      </div>

      <div className="card min-w-0">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Table2 className="w-4 h-4 text-amber-400" />
              <span className="bracket-label">MODEL VALIDATION</span>
            </div>
            <p className="mt-3 max-w-3xl text-xs leading-relaxed text-text-secondary">
              Historical backtest comparing the scenario modeller's predicted Brent 5-day impact against observed Brent spot moves.
              Values are embedded as a static validation table for demos, with no live endpoint required.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="pill-tag">7 historical events</span>
            <span className="pill-tag">Local Brent fallback</span>
            <span className="pill-tag">5-day window</span>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-lg border border-surface-500">
          <table className="min-w-full border-collapse text-left">
            <thead className="bg-surface-800">
              <tr>
                <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted">Event</th>
                <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted">Corridor</th>
                <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted">Predicted</th>
                <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted">Actual</th>
                <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted">Abs Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-500 bg-surface-700">
              {backtestRows.map(row => (
                <tr key={row.event} className={row.boundary ? 'bg-risk-critical/5' : 'hover:bg-surface-600/60'}>
                  <td className="px-3 py-3 align-top">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-text-primary">{row.event}</span>
                      {row.boundary && (
                        <span className="w-fit rounded border border-risk-critical/30 bg-risk-critical/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-risk-critical">
                          Demand boundary
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 align-top font-mono text-xs text-text-secondary">{row.corridor}</td>
                  <td className="px-3 py-3 text-right align-top font-mono text-xs text-amber-400">{row.predicted}</td>
                  <td className="px-3 py-3 text-right align-top font-mono text-xs text-text-secondary">{row.actual}</td>
                  <td className={`px-3 py-3 text-right align-top font-mono text-xs ${row.boundary ? 'text-risk-critical' : 'text-text-secondary'}`}>
                    {row.error}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-text-muted">
          The large OPEC+ COVID miss is retained intentionally because the model is calibrated for supply disruption, not demand collapse.
        </p>
      </div>
    </div>
  );
}
