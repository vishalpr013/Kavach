# Phase 4 — Adaptive Procurement Orchestrator

**Status:** ✅ Complete (100%)
**Completed:** 2026-07-19

---

## What Was Built

Phase 4 implements the Adaptive Procurement Orchestrator (Module 3), which dynamically evaluates and ranks alternative crude sources and shipping routes when primary corridors are disrupted.

### Backend Implementation
1. **Weighted Multi-Criteria Decision Analysis (MCDA)**:
   - Evaluates alternative routes based on 4 criteria with explicit weights (returned in the response):
     - **Price (30%)**: Normalized spot price (inverse logic so lower price is ranked higher).
     - **Tanker Availability (25%)**: Real-time availability score.
     - **Port Congestion (20%)**: Inverse congestion score (lower congestion is ranked higher).
     - **Refinery Compatibility (25%)**: Chemical grade compatibility.
2. **Rank Alternatives Endpoint (`POST /api/rank-alternatives`)**:
   - Computes composite scores for all suppliers, sorting them descending.
   - Generates customized justification text for the top 4 alternatives using **ONE batched LLM call** (avoiding multiple requests).
   - Fully supports a graceful fallback if the LLM key is missing, maintaining ranking math on screen with silent default values.

### Frontend Implementation (`frontend/src/pages/Procurement.jsx`)
- **Ranked Alternative Cards**:
   - Renders suppliers ordered by composite MCDA score.
   - Showcases individual breakdown indicators: spot price, transit times, tanker availability, and port congestion.
   - Highlights the `#1` overall best alternative route with a "TOP RANKED" badge and amber borders.
   - Displays the LLM-generated paragraph explaining the strategic viability of each option.
- **Corridor Control & Linkage**:
   - Integrates a dropdown to switch the target disrupted corridor.
   - Receives redirection from the Scenario Modeller page via URL parameters (`/procurement?corridor=...`).

---

## Completion Status

- [x] `routes/procurement.py` — MCDA logic and `/api/rank-alternatives`
- [x] Single-call batched LLM prompt for alternative supplier justifications
- [x] Graceful fallback mapping if LLM requests fail or hit rate limits
- [x] Procurement UI: ranked card list, composite score bar, individual metrics, LLM copy
- [x] Integration link: click "View Alternatives" from Scenario Modeller to redirect
- [x] `docs/phase-4-procurement-orchestrator.md`

---

## How to Verify

1. Run the frontend and backend.
2. Go to `http://localhost:5173/scenario`, select a preset, and click **View Alternatives**.
3. Confirm you are navigated to the **Procurement** page, and the dropdown matches the disrupted corridor.
4. Verify the listed crude options show calculated composite scores (e.g. *Saudi Arabia (Spot)* or *UAE (Murban)* showing scores out of 100).
5. Verify the description text is visible under each supplier card (justification lines, e.g., explaining why transit days or compatibility make this source suitable).
