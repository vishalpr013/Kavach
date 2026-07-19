import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
} from 'react-simple-maps';
import { Globe2, Loader2 } from 'lucide-react';
import { getCorridorScores } from '../api';

// TopoJSON URL for world map
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Corridor positions on map (approximate lat/lng)
const CORRIDOR_MARKERS = [
  { name: 'Strait of Hormuz', coordinates: [56.25, 26.56], labelOffset: [12, -10] },
  { name: 'Red Sea', coordinates: [43.33, 15.58], labelOffset: [-15, 12] },
  { name: 'Iran Exports', coordinates: [53.17, 30.15], labelOffset: [12, -8] },
  { name: 'Persian Gulf', coordinates: [51.00, 26.00], labelOffset: [-20, -12] },
  { name: 'Suez Canal', coordinates: [32.34, 30.46], labelOffset: [-15, -12] },
  { name: 'Cape of Good Hope', coordinates: [18.47, -34.35], labelOffset: [10, 12] },
];

// Major Indian refineries (illustrative positions)
const REFINERIES = [
  { name: 'Jamnagar', coordinates: [70.07, 22.47], capacity: '1.24M bpd' },
  { name: 'Mangalore', coordinates: [74.85, 12.87], capacity: '0.30M bpd' },
  { name: 'Mumbai (BPCL)', coordinates: [72.88, 19.07], capacity: '0.24M bpd' },
  { name: 'Kochi', coordinates: [76.27, 9.93], capacity: '0.31M bpd' },
  { name: 'Paradip', coordinates: [86.63, 20.32], capacity: '0.30M bpd' },
  { name: 'Vizag', coordinates: [83.30, 17.69], capacity: '0.17M bpd' },
];

// Shipping route lines (simplified)
const SHIPPING_ROUTES = [
  { from: [56.25, 26.56], to: [70.07, 22.47], name: 'Hormuz → Jamnagar' },
  { from: [43.33, 15.58], to: [74.85, 12.87], name: 'Red Sea → Mangalore' },
  { from: [32.34, 30.46], to: [72.88, 19.07], name: 'Suez → Mumbai' },
];

function getRiskColor(score) {
  if (score >= 80) return '#DC4A4A';
  if (score >= 60) return '#E07A3A';
  if (score >= 45) return '#D99A2B';
  if (score >= 30) return '#7C8A3E';
  return '#4A7C5C';
}

function getRiskGlow(score) {
  if (score >= 60) return '0 0 12px rgba(220, 74, 74, 0.4)';
  if (score >= 45) return '0 0 8px rgba(217, 154, 43, 0.3)';
  return 'none';
}

export default function DigitalTwin() {
  const navigate = useNavigate();
  const [corridorScores, setCorridorScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [hoveredMarker, setHoveredMarker] = useState(null);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const res = await getCorridorScores();
        const scoreMap = {};
        res.data.corridors.forEach((c) => {
          scoreMap[c.name] = c;
        });
        setCorridorScores(scoreMap);
      } catch (err) {
        console.error('Failed to fetch scores:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchScores();
  }, []);

  const handleCorridorClick = (corridorName) => {
    navigate(`/scenario?corridor=${encodeURIComponent(corridorName)}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-3" />
          <span className="font-mono text-sm text-text-secondary">Loading digital twin...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe2 className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="section-heading">
              Supply Chain <em>Digital Twin</em>
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Live geospatial view — click any corridor to model scenarios
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-risk-critical" />
            <span className="font-mono text-[9px] text-text-muted uppercase">Critical</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-risk-high" />
            <span className="font-mono text-[9px] text-text-muted uppercase">High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-risk-elevated" />
            <span className="font-mono text-[9px] text-text-muted uppercase">Elevated</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-risk-low" />
            <span className="font-mono text-[9px] text-text-muted uppercase">Low</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-amber-500/20 border border-amber-500/40" />
            <span className="font-mono text-[9px] text-text-muted uppercase">Refinery</span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="card p-0 overflow-hidden" style={{ height: '65vh' }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            center: [55, 18],
            scale: 550,
          }}
          style={{ width: '100%', height: '100%' }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#1A1D23"
                  stroke="#2A2F3A"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none' },
                    hover: { fill: '#22262E', outline: 'none' },
                    pressed: { outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>

          {/* Shipping route lines */}
          {SHIPPING_ROUTES.map((route, i) => (
            <Line
              key={i}
              from={route.from}
              to={route.to}
              stroke="#D97706"
              strokeWidth={1}
              strokeDasharray="4 4"
              strokeOpacity={0.3}
            />
          ))}

          {/* Corridor markers */}
          {CORRIDOR_MARKERS.map((marker) => {
            const scoreData = corridorScores[marker.name];
            const score = scoreData?.score || 0;
            const color = getRiskColor(score);
            const isHovered = hoveredMarker === marker.name;

            return (
              <Marker
                key={marker.name}
                coordinates={marker.coordinates}
                onClick={() => handleCorridorClick(marker.name)}
                onMouseEnter={() => setHoveredMarker(marker.name)}
                onMouseLeave={() => setHoveredMarker(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Outer glow ring */}
                <circle
                  r={isHovered ? 14 : 10}
                  fill={color}
                  fillOpacity={0.15}
                  stroke={color}
                  strokeWidth={1}
                  strokeOpacity={0.4}
                  style={{
                    transition: 'all 0.3s ease',
                    filter: getRiskGlow(score),
                  }}
                />
                {/* Inner dot */}
                <circle
                  r={isHovered ? 5 : 4}
                  fill={color}
                  style={{ transition: 'all 0.3s ease' }}
                />

                {/* Label */}
                <text
                  x={marker.labelOffset[0]}
                  y={marker.labelOffset[1]}
                  textAnchor={marker.labelOffset[0] < 0 ? 'end' : 'start'}
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: isHovered ? 11 : 9,
                    fill: isHovered ? '#F59E0B' : '#9CA3AF',
                    fontWeight: isHovered ? 600 : 400,
                    transition: 'all 0.2s ease',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {marker.name}
                </text>

                {/* Score badge on hover */}
                {isHovered && scoreData && (
                  <g>
                    <rect
                      x={marker.labelOffset[0] < 0 ? marker.labelOffset[0] - 40 : marker.labelOffset[0]}
                      y={marker.labelOffset[1] + 4}
                      width={38}
                      height={16}
                      rx={3}
                      fill="#14161A"
                      stroke={color}
                      strokeWidth={0.5}
                    />
                    <text
                      x={marker.labelOffset[0] < 0 ? marker.labelOffset[0] - 21 : marker.labelOffset[0] + 19}
                      y={marker.labelOffset[1] + 15}
                      textAnchor="middle"
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 9,
                        fill: color,
                        fontWeight: 600,
                      }}
                    >
                      {score.toFixed(1)}
                    </text>
                  </g>
                )}
              </Marker>
            );
          })}

          {/* Refinery markers */}
          {REFINERIES.map((refinery) => (
            <Marker key={refinery.name} coordinates={refinery.coordinates}>
              <rect
                x={-4}
                y={-4}
                width={8}
                height={8}
                rx={2}
                fill="#D97706"
                fillOpacity={0.2}
                stroke="#D97706"
                strokeWidth={0.8}
                strokeOpacity={0.5}
              />
              <text
                x={8}
                y={3}
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 7,
                  fill: '#6B7280',
                  letterSpacing: '0.05em',
                }}
              >
                {refinery.name}
              </text>
            </Marker>
          ))}
        </ComposableMap>
      </div>

      {/* Corridor score table below map */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <span className="bracket-label">CORRIDOR STATUS</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {Object.values(corridorScores).map((c) => (
            <button
              key={c.name}
              onClick={() => handleCorridorClick(c.name)}
              className="flex items-center gap-3 p-2 rounded-md bg-surface-800 border border-surface-500 hover:border-amber-500/30 transition-colors text-left"
            >
              <div
                className="w-2 h-8 rounded-full flex-shrink-0"
                style={{ backgroundColor: getRiskColor(c.score) }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-mono text-[10px] text-text-primary truncate">{c.name}</p>
                <p className="font-mono text-[9px] text-text-muted">{c.signal_count} signals</p>
              </div>
              <span
                className="font-mono text-sm font-semibold tabular-nums"
                style={{ color: getRiskColor(c.score) }}
              >
                {c.score.toFixed(1)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
