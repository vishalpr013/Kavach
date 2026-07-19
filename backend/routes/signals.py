"""
ET-AI Backend — Signal Ingestion & Corridor Scores Routes

Endpoints:
  POST /api/ingest-signal  — process a single headline through LLM + scoring
  GET  /api/corridor-scores — return current per-corridor risk scores
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

try:
    from ..state import get_corridor_scores, get_ingested_signals
    from ..scoring import process_single_signal
except ImportError:
    from state import get_corridor_scores, get_ingested_signals
    from scoring import process_single_signal

router = APIRouter(prefix="/api", tags=["signals"])


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
