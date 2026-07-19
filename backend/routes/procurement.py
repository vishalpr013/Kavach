"""
ET-AI Backend — Adaptive Procurement Orchestrator Routes

Endpoints:
  POST /api/rank-alternatives — given a disrupted corridor, rank alternative crude sources/routes

Deterministic weighted ranking (Python), with ONE batched LLM call for
top-3 justification sentences.
"""

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

try:
    from ..llm_client import call_llm
except ImportError:
    from llm_client import call_llm

router = APIRouter(prefix="/api", tags=["procurement"])

DATA_DIR = Path(__file__).parent.parent / "data"

# Ranking weights — explicitly documented
RANKING_WEIGHTS = {
    "price_score": 0.30,
    "tanker_availability": 0.25,
    "congestion_inverse": 0.20,
    "compatibility": 0.25,
}


class RankAlternativesRequest(BaseModel):
    disrupted_corridor: str
    top_n: int = 4


class RankedSupplier(BaseModel):
    id: str
    name: str
    route: str
    crude_grade: str
    spot_price_usd_bbl: float
    tanker_availability_score: float
    port_congestion_score: float
    refinery_grade_compatibility_score: float
    transit_days: int
    composite_score: float
    justification: Optional[str] = None


class RankAlternativesResponse(BaseModel):
    disrupted_corridor: str
    alternatives: list[RankedSupplier]
    ranking_weights: dict
    llm_provider: Optional[str] = None
    llm_model: Optional[str] = None


@router.post("/rank-alternatives", response_model=RankAlternativesResponse)
async def rank_alternatives(request: RankAlternativesRequest):
    """
    Rank alternative crude sources given a disrupted corridor.

    1. Load suppliers from seed data
    2. Compute deterministic weighted score for each
    3. ONE batched LLM call for top-N justification sentences
    """
    # Load suppliers
    with open(DATA_DIR / "suppliers.json", "r") as f:
        suppliers = json.load(f)

    # Normalize scores for fair comparison
    max_price = max(s["spot_price_usd_bbl"] for s in suppliers)
    min_price = min(s["spot_price_usd_bbl"] for s in suppliers)
    price_range = max_price - min_price if max_price != min_price else 1

    ranked = []
    for supplier in suppliers:
        # Price score: lower is better → invert
        price_score = 1.0 - ((supplier["spot_price_usd_bbl"] - min_price) / price_range)

        # Composite weighted score
        composite = (
            RANKING_WEIGHTS["price_score"] * price_score
            + RANKING_WEIGHTS["tanker_availability"] * supplier["tanker_availability_score"]
            + RANKING_WEIGHTS["congestion_inverse"] * (1 - supplier["port_congestion_score"])
            + RANKING_WEIGHTS["compatibility"] * supplier["refinery_grade_compatibility_score"]
        )

        ranked.append({
            **supplier,
            "composite_score": round(composite, 4),
        })

    # Sort by composite score descending
    ranked.sort(key=lambda s: s["composite_score"], reverse=True)
    top_n = ranked[: request.top_n]

    # ONE batched LLM call for justification sentences
    llm_provider = None
    llm_model = None
    try:
        justification_prompt = f"""You are a procurement advisor for India's crude oil imports.
The corridor "{request.disrupted_corridor}" is disrupted. Below are the top {len(top_n)} alternative suppliers ranked by our scoring model.

For EACH supplier, write exactly ONE sentence (max 25 words) explaining why this is a viable alternative given the disruption. Be specific to the supplier's strengths.

Respond with a JSON array of objects: [{{"supplier_id": "...", "justification": "..."}}]

Suppliers (ranked):
{json.dumps([{"id": s["id"], "name": s["name"], "route": s["route"], "crude_grade": s["crude_grade"], "price": s["spot_price_usd_bbl"], "transit_days": s["transit_days"], "composite_score": s["composite_score"]} for s in top_n], indent=2)}

Respond ONLY with valid JSON, no markdown, no preamble."""

        result = await call_llm(
            system_prompt="You are a crude oil procurement advisor.",
            user_prompt=justification_prompt,
            response_format="json",
        )
        llm_provider = result["provider"]
        llm_model = result["model"]

        justifications = json.loads(result["content"])
        if isinstance(justifications, dict):
            for key in ["suppliers", "results", "data", "justifications"]:
                if key in justifications and isinstance(justifications[key], list):
                    justifications = justifications[key]
                    break

        # Map justifications to suppliers
        justification_map = {j["supplier_id"]: j["justification"] for j in justifications if isinstance(j, dict)}
        for supplier in top_n:
            supplier["justification"] = justification_map.get(supplier["id"], None)

    except Exception as e:
        # Graceful fallback — ranking still works, just no justifications
        for supplier in top_n:
            supplier["justification"] = None

    return RankAlternativesResponse(
        disrupted_corridor=request.disrupted_corridor,
        alternatives=[RankedSupplier(**s) for s in top_n],
        ranking_weights=RANKING_WEIGHTS,
        llm_provider=llm_provider,
        llm_model=llm_model,
    )
