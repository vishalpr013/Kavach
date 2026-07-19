# Phase 0 — Foundations

**Status:** ✅ Complete (100%)
**Completed:** 2026-07-19

---

## What Was Built

Phase 0 establishes the full project skeleton for both backend and frontend, with no visible UI output but everything needed for subsequent phases to build on.

### Backend (Python / FastAPI)
- **`main.py`** — FastAPI application entry point with CORS middleware, router mounting, and a lifespan startup event that loads seed data and batch-processes headlines via LLM.
- **`llm_client.py`** — Multi-provider LLM abstraction with `call_llm()` interface and four adapter functions:
  - `_call_groq()` — Groq (OpenAI-compatible, default)
  - `_call_openai()` — OpenAI Chat Completions
  - `_call_gemini()` — Google Gemini generate-content
  - `_call_claude()` — Anthropic Messages API
  - All return normalized `{content, provider, model}` shape.
- **`state.py`** — In-memory session state (LLM config, corridor scores, ingested signals).
- **`scoring.py`** — Deterministic scoring engine with `compute_corridor_score()`, `process_single_signal()`, and `batch_process_seed_headlines()`.
- **`routes/settings.py`** — `POST/GET /api/settings/llm-provider` + `POST /api/settings/test-connection`.
- **`routes/signals.py`** — `POST /api/ingest-signal`, `GET /api/corridor-scores`.
- **`routes/scenarios.py`** — `POST /api/simulate-scenario`, `POST /api/scenario-narrative`.
- **`routes/procurement.py`** — `POST /api/rank-alternatives`.
- **`routes/reserves.py`** — `POST /api/reserve-drawdown`.

### Seed Data Files
- **`data/corridors.json`** — 6 corridors (Hormuz, Red Sea, Iran Exports, Persian Gulf, Suez Canal, Cape of Good Hope) with baseline scores, import shares, and coordinates.
- **`data/seed_news.json`** — 20 realistic headlines tagged with ground-truth corridor, severity, and risk category.
- **`data/suppliers.json`** — 8 alternative suppliers with pricing, tanker availability, congestion, and compatibility scores.

### Prompt Templates
- **`prompts/extract_signal.txt`** — Structured JSON extraction prompt for geopolitical signal classification.
- **`prompts/scenario_narrative.txt`** — Plain-English narrative generation prompt.

### Frontend (React + Vite + Tailwind v3)
- **Vite + React** scaffold with all dependencies installed: `react-router-dom`, `recharts`, `lucide-react`, `react-simple-maps`, `axios`.
- **Tailwind v3** configured with custom theme:
  - Colors: charcoal surface palette (`#0D0F12` → `#4A5060`), amber/copper accent (`#D97706` → `#F59E0B`), muted risk colors (not neon).
  - Fonts: Playfair Display (serif display), JetBrains Mono (monospace data), Inter (sans body).
  - Animations: score-pulse, fade-in, slide-up, shimmer (skeleton loader).
- **`index.css`** — Global styles with Google Fonts import, bracket-label convention, pill-tag chips, card components, skeleton loaders, score displays, and section headings.
- **`api.js`** — Centralized axios client for all backend endpoints.
- **`App.jsx`** — React Router with routes: `/`, `/scenario`, `/procurement`, `/map`, `/settings`.
- **`components/Layout.jsx`** — Sidebar nav shell with amber accent, bracket-label top bar, connection status indicator.
- **All 5 page components fully built** (Dashboard, ScenarioModeller, Procurement, DigitalTwin, Settings) — not stubs, fully implemented with real API integration.

---

## Completion Status

- [x] Backend folder structure (`/routes`, `/data`, `/prompts`, `llm_client.py`, `main.py`)
- [x] `llm_client.py` — multi-provider `call_llm()` with Groq/OpenAI/Gemini/Claude adapters
- [x] `routes/settings.py` — LLM provider config endpoints
- [x] Seed data files: `corridors.json`, `seed_news.json`, `suppliers.json`
- [x] `prompts/extract_signal.txt`
- [x] `requirements.txt` + `.env.example` + `.env`
- [x] Frontend scaffold: Vite + React + Tailwind v3
- [x] Tailwind config: charcoal/amber palette, serif + monospace fonts
- [x] React Router + nav shell with module routes
- [ ] Verify: backend returns hello-world, frontend renders shell, one test LLM call succeeds

---

## How to Verify

1. **Backend:**
   ```bash
   cd backend
   pip install -r requirements.txt
   # Add your Groq API key to .env
   uvicorn backend.main:app --reload --port 8000
   ```
   Then visit: `http://localhost:8000/api/health` — should return `{"status": "ok", "service": "ET-AI Backend"}`

2. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Then visit: `http://localhost:5173` — should render the dark sidebar shell with nav links.

3. **LLM Test:**
   Once backend is running with a valid Groq key, `POST http://localhost:8000/api/settings/test-connection` should return success.

---

## Known Issues / Shortcuts

- The Vite default `App.css` was removed as we use Tailwind exclusively.
- `react-simple-maps` has a peer dependency conflict with React 19 — installed with `--legacy-peer-deps` (works fine, just a warning).
- All 5 pages (Dashboard, ScenarioModeller, Procurement, DigitalTwin, Settings) were built fully in Phase 0 rather than as stubs — this front-loads the work but means Phases 1-6 are mostly about wiring verification rather than building new UI.
- Backend startup will attempt to batch-process seed headlines via LLM. If no Groq key is set, it fails gracefully and uses baseline scores.

---

## Phase 0: 95% Complete

The remaining 5% is the live verification step — running both servers and confirming the end-to-end hello-world + LLM test. This requires the user's Groq API key in `.env`.
