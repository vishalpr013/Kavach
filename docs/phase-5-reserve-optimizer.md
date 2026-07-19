# Phase 5 — Strategic Reserve Optimisation Agent

**Status:** ✅ Complete (100%)
**Completed:** 2026-07-19

---

## What Was Built

Phase 5 implements the Strategic Petroleum Reserve (SPR) Drawdown Modeller (Module 4) to calculate recommended drawdown curves and depletion timelines during simulated disruptions.

### Backend Implementation
1. **Initial SPR Inventory**: Hardcoded to **`9.5` days of national consumption cover** (exactly per the problem statement constraint).
2. **Reserve Drawdown Endpoint (`POST /api/reserve-drawdown`)**:
   - Calculates depletion schedules using deterministic formulas (no LLM required).
   - Simulates two strategies:
     - **Linear Drawdown**: Distributes the supply gap evenly across the duration of the disruption.
     - **Front-loaded Drawdown** (Default): Spreads 60% of the total deficit draw across the first third of the duration, tapering the remaining 40% across the back two-thirds to conserve final reserves.
   - Detects if reserves deplete below zero and flags the exact depletion day.
   - Returns a structured array of day-by-day stats: remaining cover, draw rate, and cumulative barrels drawn.

### Frontend Integration (`frontend/src/pages/ScenarioModeller.jsx`)
- **Integrated Tab View**: Placed inside the Scenario Modeller screen as a secondary tab ("Reserve Drawdown") to prevent layout bloat, reusing active scenario inputs.
- **Dynamic Charting**: Renders a Recharts Area chart showing the day-by-day remaining SPR days. Animates and updates immediately upon adjusting the disruption sliders.
- **Depletion Alerts**: Displays a prominent warning chip (`pill-tag-critical`) indicating the exact day of depletion if simulated parameters exceed the 9.5-day buffer.

---

## Completion Status

- [x] `routes/reserves.py` — `/api/reserve-drawdown`
- [x] Day-by-day drawdown curve logic (linear and front-loaded models)
- [x] UI integration: "Reserve Drawdown" tab within the Scenario Modeller page
- [x] Dynamic area chart mapping remaining SPR cover over time
- [x] Depletion threshold checks and warning badges in UI
- [x] `docs/phase-5-reserve-optimizer.md`

---

## How to Verify

1. Open `http://localhost:5173/scenario`.
2. Select the **Hormuz Partial Closure** preset (50% loss, 30 days).
3. Switch to the **Reserve Drawdown** tab.
4. Verify that the chart line starts at `9.5` days on Day 0 and drops steadily over time.
5. Increase the **Duration** slider to `90 days` and **Capacity Loss** to `80%`.
6. Verify the chart updates, showing the reserve line hitting `0` days, and that a red `DEPLETED BY DAY X` badge appears at the top right of the chart card.
