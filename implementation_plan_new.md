# ET-AI: AI-Driven Energy Supply Chain Resilience Platform — Phases 8, 9, 10 Implementation Plan

This plan details the design and implementation steps for completing Phase 8 (Live RSS Ingestion), Phase 9 (Historical Backtesting), and Phase 10 (Real Sourced Constants) of the ET-AI Platform.

---

## Proposed Changes

### Phase 8 — Live RSS Ingestion

We will add the ability to poll live RSS feeds for energy/geopolitical news, process only new headlines through our geopolitical risk extraction agent, and update the dashboard dynamically.

#### [MODIFY] [state.py](file:///e:/VISHAL%20PRAJAPATI/TECH/Projects/ET-AI/backend/state.py)
- Introduce a seen-headlines hash set `_seen_headlines` to prevent duplicate processing of RSS headlines.
- Implement helper methods:
  - `is_headline_seen(headline: str) -> bool`
  - `mark_headline_seen(headline: str)`
  - `clear_seen_headlines()` (to support clean demo state resets)

#### [NEW] [ingestion.py](file:///e:/VISHAL%20PRAJAPATI/TECH/Projects/ET-AI/backend/ingestion.py)
- Create a helper module using `feedparser` to fetch entries from 3 feeds:
  1. OilPrice.com Main Feed: `https://oilprice.com/rss/main`
  2. Rigzone Latest News Feed: `https://www.rigzone.com/news/rss/rigzone_latest.aspx`
  3. MarketWatch Top Stories: `http://feeds.marketwatch.com/marketwatch/topstories` (with keyword filters like "oil", "energy", "petroleum", "gas", "OPEC", "Hormuz", "Red Sea", "refinement" to ensure relevant energy/supply chain content)
- Include error handling (try/except) so failures in individual RSS feeds do not crash the endpoint.

#### [MODIFY] [signals.py](file:///e:/VISHAL%20PRAJAPATI/TECH/Projects/ET-AI/backend/routes/signals.py)
- Add new endpoint `POST /api/poll-live-feed` that:
  1. Calls the ingestion helper to get current headlines.
  2. Filters out headlines already marked as seen.
  3. Sequentially passes each new headline through the existing `process_single_signal(headline)` pipeline.
  4. Returns the list of newly ingested signals and the updated corridor scores.
- Update `/api/reset-demo-state` to clear the seen-headlines set.

#### [MODIFY] [api.js](file:///e:/VISHAL%20PRAJAPATI/TECH/Projects/ET-AI/frontend/src/api.js)
- Add Axios endpoint for `pollLiveFeed()`.

#### [MODIFY] [Dashboard.jsx](file:///e:/VISHAL%20PRAJAPATI/TECH/Projects/ET-AI/frontend/src/pages/Dashboard.jsx)
- Add a "Poll Live Feed" button near the "Reset Demo" button.
- Integrate polling state indicators (loading/spinner) and show summary notifications (e.g., "Ingested 3 new live signals").
- Update the corridor lists and summary counts dynamically after polling.

---

### Phase 9 — Historical Backtest Framework

We will build a standalone script to compare our scenario modeller's price impact predictions against actual daily Brent spot price movements following major historical geopolitical events.

#### [NEW] [backtest.py](file:///e:/VISHAL%20PRAJAPATI/TECH/Projects/ET-AI/backend/backtest.py)
- Load an EIA API key from `backend/.env` using the `EIA_API_KEY` variable.
- Implement EIA API v2 query to fetch Brent Spot Price data:
  - Base URL: `https://api.eia.gov/v2/petroleum/pri/spt/data/`
  - Parameters: `frequency=daily`, `data[0]=value`, `facets[series][]=RBRTE`
- Create a local fallback dataset containing historical daily Brent spot prices for the relevant date ranges. This ensures the script runs out of the box even if the EIA API key is not configured.
- Define 6–8 major historical events with actual headlines and dates, such as:
  1. OPEC+ Surprise Cut (April 2, 2023)
  2. Houthi Red Sea Attacks (December 18, 2023)
  3. Ever Given Suez Canal Blockage (March 23, 2021)
  4. US-Iran Standoff (January 3, 2020)
  5. OPEC+ historic COVID supply cut (April 12, 2020)
  6. Libya Port Blockade (January 19, 2020)
- For each event:
  1. Pass the headline through `process_single_signal()`.
  2. Use the extracted severity and corridor import share to run the scenario modeller's price impact formula.
  3. Fetch the actual Brent spot prices on the day of the event and 5 days after the event.
  4. Calculate the actual % price change vs. our predicted impact percentage.
- Output a formatted text/ASCII table to standard output: Event Name, Headline, Predicted Impact, Actual Impact, and Delta (Absolute Error).

---

### Phase 10 — Real Sourced Constants

We will replace the illustrative parameters in the modeling files with real-world cited values.

#### [MODIFY] [reserves.py](file:///e:/VISHAL%20PRAJAPATI/TECH/Projects/ET-AI/backend/routes/reserves.py)
- Replace `DAILY_CONSUMPTION_MILLION_BBL = 5.0` with `5.4` million barrels per day.
- Citation source: Petroleum Planning & Analysis Cell (PPAC), India, Ministry of Petroleum & Natural Gas (FY 2024-25 / FY 2025-26 consumption figures ~233 MMT/annum).
- Update the assumptions metadata dictionary to return this reference.

#### [MODIFY] [scenarios.py](file:///e:/VISHAL%20PRAJAPATI/TECH/Projects/ET-AI/backend/routes/scenarios.py)
- Replace `elasticity_factor = 1.3` with `12.5` (or a calibrated price-to-supply elasticity multiplier representing the inverse of the short-run price elasticity of demand for crude oil, which is approximately `-0.08` according to IMF/EIA estimates). A 1% drop in supply results in a 12.5% increase in crude price.
- Update assumptions metadata to explicitly cite IMF/EIA short-run oil demand elasticity reports (-0.08).

#### [MODIFY] [corridors.json](file:///e:/VISHAL%20PRAJAPATI/TECH/Projects/ET-AI/backend/data/corridors.json)
- Update `import_share_pct` values with actual PPAC/customs mix data:
  - Strait of Hormuz: `0.43` (43% of crude imports transit here)
  - Red Sea: `0.30` (30% transit, reflecting Russia and other European imports)
  - Iran Exports: `0.02` (2% or less due to sanctions)
  - Persian Gulf: `0.54` (54% combined share from Middle East suppliers)
  - Suez Canal: `0.32` (32% transit)
  - Cape of Good Hope: `0.08` (8% transit, showing increased rerouting)
- Update corridor descriptions to reflect these revised proportions.

---

## Verification Plan

### Phase 8 Ingestion Verification
- Run backend and click the "Poll Live Feed" button in the frontend.
- Verify that only new headlines are processed, and the seen-headlines hash set prevents duplicate LLM calls on subsequent polls.
- Inspect backend logging to confirm gracefulness when handling failed RSS feeds.

### Phase 9 Backtesting Verification
- Run `backend/backtest.py` via python CLI.
- Confirm the script runs, outputs a clean, aligned table, and gracefully falls back to local cached price data if the EIA API key is not configured.

### Phase 10 Verification
- Verify that the updated constants are reflected in the Scenarios and Reserves tabs in the UI.
- Verify that the assumptions card displays the updated PPAC and IMF/EIA source citations.

---

## Open Questions

> [!NOTE]
> Since we do not want to fail if the user's EIA key is empty, the fallback to pre-cached data in the backtester is the primary mechanism to run the script. We will proceed with this robust approach.
