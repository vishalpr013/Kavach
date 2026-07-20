# Phase 10 - Real Sourced Constants

**Status:** Complete (100%)
**Completed:** 2026-07-20

---

## What Was Built

Phase 10 replaces the remaining illustrative modelling values with sourced, explicit assumptions suitable for presentation and review.

### Reserve Model Constants
- Updated `DAILY_CONSUMPTION_MILLION_BBL` from `5.0` to `5.4`.
- Updated reserve assumptions metadata to cite PPAC, Ministry of Petroleum & Natural Gas, India petroleum consumption around 233 MMT/year for FY 2024-25/FY 2025-26, converted to approximately 5.4 million barrels/day.

### Scenario Model Constants
- Updated `elasticity_factor` from `1.3` to `12.5`.
- The value represents the inverse of crude oil demand elasticity near `-0.08`, cited in IMF oil-demand literature as a longer-run/upper-bound value. IMF sources also show very low short-run oil demand elasticity, supporting an inelastic price-response model.
- Updated assumptions metadata to cite IMF/EIA oil-market literature.

### Corridor Import Shares
- Strait of Hormuz: `0.43`
- Red Sea: `0.30`
- Iran Exports: `0.02`
- Persian Gulf: `0.54`
- Suez Canal: `0.32`
- Cape of Good Hope: `0.08`

Descriptions in `backend/data/corridors.json` now match these revised exposure assumptions.

---

## Completion Status

- [x] Reserve daily consumption constant updated
- [x] Reserve assumptions source updated
- [x] Scenario elasticity multiplier updated
- [x] Scenario assumptions source updated
- [x] Corridor shares and descriptions updated
- [x] `docs/phase-10-real-sourced-constants.md`

---

## How to Verify

1. Start the backend and frontend.
2. Open the Scenario Modeller and run any corridor scenario.
3. Confirm the response assumptions show `elasticity_factor: 12.5`.
4. Run a reserve drawdown and confirm assumptions show `daily_consumption_million_bbl: 5.4`.
5. Open the dashboard and confirm import share labels reflect the revised corridor proportions.
