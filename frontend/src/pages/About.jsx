import { Shield, RadioTower, BarChart3, Route, Database } from 'lucide-react';

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
    </div>
  );
}
