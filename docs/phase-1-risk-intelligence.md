# Phase 1 — Geopolitical Risk Intelligence Agent

**Status:** ✅ Complete (100%)
**Completed:** 2026-07-19

---

## What Was Built

Phase 1 implements the Geopolitical Risk Intelligence Agent (Module 1), enabling continuous monitoring of geopolitical risk signals and real-time corridor risk score calculations.

### Backend Implementation
1. **Extraction Prompt (`backend/prompts/extract_signal.txt`)**: Structurizes natural language news headlines into a specific JSON schema classifying `corridor`, `risk_category`, `severity` (1-5), `confidence`, and `one_line_reasoning`.
2. **Deterministic Scoring Formula (`backend/scoring.py` & `backend/routes/signals.py`)**:
   - Computes risk score as:
     `corridor_score = base_score + (severity * 8) * recency_weight * source_credibility_weight`
     - Capped at `100.0`
     - Decays older signals dynamically over time.
   - `/api/corridor-scores` returns current scores, sorted highest risk first.
   - `/api/ingest-signal` accepts a headline, extracts parameters using the active LLM, updates the corridor score, and logs the signal.
3. **Startup Batch Processing (`backend/scoring.py` & `backend/main.py`)**:
   - Batch-processes all 20 seed headlines in `data/seed_news.json` on startup in a single LLM call to establish a pre-loaded baseline.
   - Gracefully falls back to baseline values if no LLM key is configured.

### Frontend Dashboard (`frontend/src/pages/Dashboard.jsx`)
- **Key Metrics Overview**: Real-time display of total High Risk corridors, Average Risk Score, total signals ingested, and total monitored corridors.
- **Corridor Risk Assessment**: Grid of monitored corridors with color-coded risk levels (`CRITICAL` in red, `HIGH` in orange-red, `ELEVATED` in amber, `MODERATE` in olive, `LOW` in desaturated green), import share percentages, signal counts, and progress bars.
- **Live Signal Ingestion**: A prominent input field for demo presenters to paste a news headline. Submitting triggers real-time extraction, animates the corresponding corridor card with a scale/fade animation, and updates the score instantly.

---

## Completion Status

- [x] `routes/signals.py` — `/api/ingest-signal`, `/api/corridor-scores`
- [x] Deterministic scoring engine with severity weights, credibility, and decay
- [x] Startup batch seed headline processing in single LLM call
- [x] Dashboard UI: corridor cards, color-coded scores, live headline input
- [x] Real-time headline ingestion visual updates (scale/pulse animation on score update)
- [x] `docs/phase-1-risk-intelligence.md`

---

## How to Verify

1. Ensure the backend server is running:
   ```bash
   uvicorn backend.main:app --reload --port 8000
   ```
2. Navigate to the frontend in a web browser:
   `http://localhost:5173/`
3. Check the corridor list. They will show baseline risk scores (e.g., Strait of Hormuz at `45.0`, Red Sea at `55.0`) if no API key was available at startup, or updated scores if an API key was loaded.
4. Go to **Settings** in the sidebar, input a valid Groq API key, click **Save**, and click **Test Connection** to confirm LLM connectivity.
5. Return to **Risk Intel** (Dashboard) and paste a fresh headline in the live input box, e.g.:
   > *"Houthi drone strikes commercial vessel in Southern Red Sea, causing minor hull damage"*
6. Click **Ingest**. You will see the LLM analysis output below the input box, the Red Sea corridor card will pulse, and its score will instantly increase.
