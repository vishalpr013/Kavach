# Phase 9 - Historical Backtesting

**Status:** Complete (100%)
**Completed:** 2026-07-20

---

## What Was Built

Phase 9 adds a standalone historical backtest script that compares the scenario modeller's predicted Brent price impact against observed 5-day Brent spot price moves for major supply-chain and geopolitical events.

### Backend Implementation (`backend/backtest.py`)
- Loads corridor data and initializes the same in-memory score model used by the API.
- Defines seven historical events across Hormuz, Suez, Red Sea, Persian Gulf, OPEC+, and Libya disruption contexts.
- Attempts to classify each event headline with the existing `process_single_signal()` path.
- Falls back to deterministic local classifications when no LLM key is configured, so the script runs out of the box.
- Attempts to fetch Brent daily spot prices from EIA API v2 when `EIA_API_KEY` is configured.
- Falls back to a local Brent spot price cache covering the event windows.
- Prints an aligned text table with event, corridor, predicted impact, actual impact, and absolute error.

---

## Completion Status

- [x] Standalone backtest runner
- [x] EIA API v2 integration path
- [x] Local price fallback data
- [x] Offline classification fallback
- [x] Prediction-versus-actual error table
- [x] `docs/phase-9-historical-backtesting.md`

---

## How to Verify

1. From the repository root, run:
   ```bash
   python backend/backtest.py
   ```
2. Confirm the script prints a table even without `backend/.env`.
3. Optional: add `EIA_API_KEY` to `backend/.env` and rerun to use live EIA price data.
