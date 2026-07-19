# Phase 2 — Disruption Scenario Modeller

**Status:** ✅ Complete (100%)
**Completed:** 2026-07-19

---

## What Was Built

Phase 2 implements the Disruption Scenario Modeller (Module 2), allowing users to simulate "what-if" geopolitical disruptions in energy transit corridors and evaluate their cascading downstream economic impacts under transparent mathematical assumptions.

### Backend Implementation
1. **Scenario Simulation Endpoint (`POST /api/simulate-scenario`)**:
   - Implements a fully deterministic mathematical model in Python (no slow or expensive LLM calls).
   - Simulates cascading impacts on the Indian energy economy:
     - **Refinery Run-Rate Drop**: `capacity_loss_pct * corridor_import_share`
     - **Fuel Price Impact**: `refinery_runrate_drop * elasticity_factor (1.3)`
     - **Power Sector Stress Index**: `f(fuel_price_impact, duration)` using weights and duration normalization
     - **GDP Stress Estimate**: `fuel_price_impact * sensitivity_factor (0.15) * (duration / 30)`
     - **Total Supply Gap**: Cumulative oil gap in millions of barrels.
   - Includes a full `assumptions` block in the JSON response, exposing the constants used in calculations.
2. **Scenario Narrative Endpoint (`POST /api/scenario-narrative`)**:
   - Uses a structured prompt (`backend/prompts/scenario_narrative.txt`) to translate computed simulation results into a 3-4 sentence plain-English operational explanation.
   - Run on-demand (only when a user explicitly runs/triggers the analysis), preventing API abuse or delays during slider adjustments.

### Frontend Implementation (`frontend/src/pages/ScenarioModeller.jsx`)
- **Interactive Controls Panel**:
   - Preset buttons for Hormuz Partial Closure, Red Sea Suspension, and OPEC+ Emergency Cut to quickly pre-fill parameters.
   - Real-time Sliders for Capacity Loss (%) and Duration (days).
   - Instantly recalculates and refreshes metrics and charts on every slider tick (since it calls the fast, deterministic backend simulation).
- **Visualization and Transparency**:
   - Recharts horizontal/vertical bar charts plotting Refinery Run-Rate Drop, Fuel Price Impact, GDP Stress, and Supply Gap side-by-side.
   - **Assumptions Panel**: Exposes active model constants (`elasticity_factor`, `power_sector_weight`, etc.) directly to the user to build analytical trust.
   - **Drawdown Integration**: Integrated a tab for Module 4's Strategic Petroleum Reserve drawdown visualization.
   - **AI Narrative Box**: Triggers the `/api/scenario-narrative` LLM request via a "Generate Analysis" button with a skeleton loading state.

---

## Completion Status

- [x] `routes/scenarios.py` — `/api/simulate-scenario`, `/api/scenario-narrative`
- [x] Deterministic cascading impact formulas in Python
- [x] Expose all model constants in an explicit `assumptions` object
- [x] Scenario UI: presets, parameters, sliders, cascading charts, assumptions dropdown
- [x] AI narrative generator with skeleton loading states (triggered on-demand only)
- [x] `docs/phase-2-scenario-modeller.md`

---

## How to Verify

1. Run the frontend and backend servers.
2. Navigate to `http://localhost:5173/scenario` or click **Scenarios** in the sidebar.
3. Click a preset button (e.g. *Hormuz Partial Closure*). Notice the parameters are pre-filled, and the metrics adjust.
4. Drag the **Capacity Loss** slider to `70%`. Notice that the cascading impact values and charts update instantly on release/drag.
5. Expand the **Assumptions Used** panel to check the active coefficients.
6. Click **Generate Analysis**. A skeleton loader will show for a moment, and then the AI narrative summary will appear, detailing the operational impact of a 70% capacity drop.
