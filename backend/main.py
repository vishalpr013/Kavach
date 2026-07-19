"""
ET-AI Backend — FastAPI Application Entry Point

Serves the AI-Driven Energy Supply Chain Resilience Platform API.
Batch-processes seed headlines at startup to pre-populate corridor risk scores.
"""

import json
import logging
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv(Path(__file__).parent / ".env")

try:
    from .routes.settings import router as settings_router
    from .routes.signals import router as signals_router
    from .routes.scenarios import router as scenarios_router
    from .routes.procurement import router as procurement_router
    from .routes.reserves import router as reserves_router
    from .state import set_corridor_scores
    from .scoring import initialize_corridor_scores, batch_process_seed_headlines
except ImportError:
    from routes.settings import router as settings_router
    from routes.signals import router as signals_router
    from routes.scenarios import router as scenarios_router
    from routes.procurement import router as procurement_router
    from routes.reserves import router as reserves_router
    from state import set_corridor_scores
    from scoring import initialize_corridor_scores, batch_process_seed_headlines

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

DATA_DIR = Path(__file__).parent / "data"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: load seed data and batch-process headlines via LLM."""
    logger.info("🚀 ET-AI Backend starting up...")

    # Load corridor data and initialize scores
    with open(DATA_DIR / "corridors.json", "r") as f:
        corridors = json.load(f)
    initialize_corridor_scores(corridors)
    logger.info(f"✅ Loaded {len(corridors)} corridors with baseline scores")

    # Batch-process seed headlines (one LLM call for all)
    try:
        with open(DATA_DIR / "seed_news.json", "r") as f:
            seed_headlines = json.load(f)
        await batch_process_seed_headlines(seed_headlines)
        logger.info(f"✅ Batch-processed {len(seed_headlines)} seed headlines")
    except Exception as e:
        logger.warning(f"⚠️ Seed headline processing failed (demo will work, scores at baseline): {e}")

    yield

    logger.info("👋 ET-AI Backend shutting down...")


app = FastAPI(
    title="ET-AI — Energy Supply Chain Resilience Platform",
    description="AI-driven geopolitical risk monitoring and supply chain scenario modelling for India's energy imports.",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(settings_router)
app.include_router(signals_router)
app.include_router(scenarios_router)
app.include_router(procurement_router)
app.include_router(reserves_router)


@app.get("/api/health")
async def health_check():
    """Simple health check endpoint."""
    return {"status": "ok", "service": "ET-AI Backend"}
