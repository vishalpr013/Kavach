"""
ET-AI Backend — Signal Ingestion & Corridor Scores Routes

Endpoints:
  POST /api/ingest-signal  — process a single headline through LLM + scoring
  GET  /api/corridor-scores — return current per-corridor risk scores
    POST /api/reset-demo-state — reset scores/signals to clean baseline
"""

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

try:
        from ..state import get_corridor_scores, get_ingested_signals, reset_ingested_signals
        from ..scoring import process_single_signal, initialize_corridor_scores, batch_process_seed_headlines
except ImportError:
        from state import get_corridor_scores, get_ingested_signals, reset_ingested_signals
        from scoring import process_single_signal, initialize_corridor_scores, batch_process_seed_headlines

router = APIRouter(prefix="/api", tags=["signals"])
DATA_DIR = Path(__file__).parent.parent / "data"


class IngestSignalRequest(BaseModel):
    headline: str


class ExtractedSignal(BaseModel):
    headline: str
    corridor: str
    risk_category: str
    severity: int
    confidence: float
    one_line_reasoning: str
    updated_score: Optional[float] = None
    previous_score: Optional[float] = None
    llm_provider: str
    llm_model: str


class CorridorScore(BaseModel):
    name: str
    score: float
    baseline: float
    import_share_pct: float
    description: str
    signal_count: int
    region: str


class ResetDemoStateRequest(BaseModel):
    include_seed_headlines: bool = False


class ResetDemoStateResponse(BaseModel):
    message: str
    include_seed_headlines: bool
    corridor_count: int
    total_signals: int


@router.post("/ingest-signal", response_model=ExtractedSignal)
async def ingest_signal(request: IngestSignalRequest):
    """
    Process a single news headline:
    1. LLM extracts corridor, risk_category, severity, confidence (ONE call)
    2. Deterministic scoring formula updates the corridor's score
    """
    if not request.headline.strip():
        raise HTTPException(status_code=400, detail="Headline cannot be empty")

    try:
        signal = await process_single_signal(request.headline.strip())
        return ExtractedSignal(**signal)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Signal processing failed: {str(e)}")


@router.get("/corridor-scores")
async def get_scores():
    """Return current risk scores for all corridors."""
    scores = get_corridor_scores()

    result = []
    for name, data in scores.items():
        result.append(CorridorScore(
            name=data["name"],
            score=round(data["score"], 1),
            baseline=data["baseline"],
            import_share_pct=data["import_share_pct"],
            description=data["description"],
            signal_count=len(data["signals"]),
            region=data.get("region", ""),
        ))

    # Sort by score descending (highest risk first)
    result.sort(key=lambda c: c.score, reverse=True)
    return {"corridors": result}


@router.post("/reset-demo-state", response_model=ResetDemoStateResponse)
async def reset_demo_state(request: ResetDemoStateRequest):
    """
    Reset runtime state for demos so score movement is visible again.

    By default, resets to corridor baselines only (no seed signals).
    Optionally re-applies seed headlines if include_seed_headlines is true.
    """
    try:
        with open(DATA_DIR / "corridors.json", "r") as f:
            corridors = json.load(f)

        initialize_corridor_scores(corridors)
        reset_ingested_signals()

        if request.include_seed_headlines:
            with open(DATA_DIR / "seed_news.json", "r") as f:
                seed_headlines = json.load(f)
            await batch_process_seed_headlines(seed_headlines)

        scores = get_corridor_scores()
        total_signals = sum(len(corridor["signals"]) for corridor in scores.values())

        return ResetDemoStateResponse(
            message="Demo state reset successfully.",
            include_seed_headlines=request.include_seed_headlines,
            corridor_count=len(scores),
            total_signals=total_signals,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Demo state reset failed: {str(e)}")
