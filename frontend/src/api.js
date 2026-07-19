import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30s for LLM calls
});

// ---- Health ----
export const healthCheck = () => api.get('/health');

// ---- Settings ----
export const getLLMProvider = () => api.get('/settings/llm-provider');
export const setLLMProvider = (provider, apiKey = null) =>
  api.post('/settings/llm-provider', { provider, api_key: apiKey });
export const testConnection = () => api.post('/settings/test-connection');

// ---- Signals & Corridors ----
export const ingestSignal = (headline) =>
  api.post('/ingest-signal', { headline });
export const getCorridorScores = () => api.get('/corridor-scores');

// ---- Scenarios ----
export const simulateScenario = (scenarioType, capacityLossPct, durationDays, corridor = null) =>
  api.post('/simulate-scenario', {
    scenario_type: scenarioType,
    capacity_loss_pct: capacityLossPct,
    duration_days: durationDays,
    corridor,
  });
export const getScenarioNarrative = (params) =>
  api.post('/scenario-narrative', params);

// ---- Procurement ----
export const rankAlternatives = (disruptedCorridor, topN = 4) =>
  api.post('/rank-alternatives', {
    disrupted_corridor: disruptedCorridor,
    top_n: topN,
  });

// ---- Reserves ----
export const computeDrawdown = (gapSizePct, gapDurationDays, strategy = 'front_loaded') =>
  api.post('/reserve-drawdown', {
    gap_size_pct: gapSizePct,
    gap_duration_days: gapDurationDays,
    drawdown_strategy: strategy,
  });

export default api;
