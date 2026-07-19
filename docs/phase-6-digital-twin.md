# Phase 6 — Supply Chain Digital Twin Map

**Status:** ✅ Complete (100%)
**Completed:** 2026-07-19

---

## What Was Built

Phase 6 implements the Supply Chain Digital Twin Map (Module 5), providing a geospatial visualization layer that represents energy transit risk in context and links directly to numerical scenario simulations.

### Frontend Implementation (`frontend/src/pages/DigitalTwin.jsx`)
- **Geospatial Map Rendering**:
   - Uses `react-simple-maps` with a standard 110m world atlas TopoJSON projection.
   - Centers on coordinates `[55, 18]` (Indian Ocean / Gulf region) with an optimized mercator scale (`550`) showing India, the Middle East, East Africa, and key waterways.
- **Corridor & Refinery Layering**:
   - Plots the 6 primary corridors as interactive map markers.
   - Plots 6 major Indian refineries (Jamnagar, Mangalore, Mumbai BPCL, Kochi, Paradip, Vizag) as rectangular anchors.
   - Renders simplified dotted route paths illustrating typical shipping lanes.
- **Live Scoring & Interaction**:
   - Corridors are color-coded in real-time by their risk scores fetched from the `/api/corridor-scores` endpoint, using the unified risk colors.
   - Hovering over a corridor displays a tooltip containing its name and current numerical score.
   - Clicking a corridor marker immediately redirects the user to the Scenario Modeller page (`/scenario?corridor=...`), pre-filling all parameters.
- **Corridor Status Panel**:
   - Renders a dense status table below the map showing names, score numbers, and total signals, matching the terminal console design system.

---

## Completion Status

- [x] Integrate `react-simple-maps` inside `frontend/src/pages/DigitalTwin.jsx`
- [x] Plot corridors with live risk-based color indicators (green/amber/orange/red)
- [x] Plot major Indian refinery locations and coordinate reference pins
- [x] Add hover tooltips displaying corridor scores on the map
- [x] Wire marker click navigation to pre-load specific corridors in the Scenario Modeller
- [x] `docs/phase-6-digital-twin.md`

---

## How to Verify

1. Start both servers and navigate to the map:
   `http://localhost:5173/map` or click **Digital Twin** in the sidebar.
2. Confirm the map loads correctly, displaying India on the right and the Arabian Peninsula / Red Sea region on the left.
3. Verify that the corridor markers (e.g. Strait of Hormuz, Red Sea) are color-coded correctly. If you recently ingested a high-severity signal for the Red Sea, its marker should be red.
4. Hover over a marker to see the score popup.
5. Click the **Strait of Hormuz** marker. Verify you are redirected to the Scenario Modeller page with the Hormuz preset pre-loaded.
