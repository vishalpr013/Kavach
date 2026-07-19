"""
ET-AI Backend — Strategic Reserve Optimisation Routes

Endpoints:
  POST /api/reserve-drawdown — compute SPR drawdown schedule during a simulated supply gap

Fully deterministic — no LLM calls. India's SPR provides ~9.5 days of national
consumption cover (from the problem statement).
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api", tags=["reserves"])

# India's Strategic Petroleum Reserve — from problem statement
SPR_DAYS_COVER = 9.5  # days of national consumption
DAILY_CONSUMPTION_MILLION_BBL = 5.0  # Illustrative — India's approximate daily consumption


class DrawdownRequest(BaseModel):
    gap_size_pct: float  # % of supply that is lost (0-100)
    gap_duration_days: int  # How many days the gap lasts
    drawdown_strategy: str = "front_loaded"  # "linear" or "front_loaded"


class DrawdownPoint(BaseModel):
    day: int
    reserve_days_remaining: float
    daily_drawdown_rate: float
    cumulative_drawn: float


class DrawdownResponse(BaseModel):
    gap_size_pct: float
    gap_duration_days: int
    strategy: str
    initial_reserve_days: float
    total_supply_gap_bbl_millions: float
    drawdown_curve: list[DrawdownPoint]
    reserve_depleted: bool
    depletion_day: Optional[int] = None
    assumptions: dict


@router.post("/reserve-drawdown", response_model=DrawdownResponse)
async def compute_drawdown(request: DrawdownRequest):
    """
    Compute SPR drawdown schedule.

    Deterministic formula:
    - Linear: constant daily drawdown rate = gap_size / gap_duration
    - Front-loaded: higher initial rate (60% in first third), then tapering

    Returns a day-by-day curve of reserve levels.
    """
    gap_fraction = request.gap_size_pct / 100.0

    # Total supply gap in million barrels
    daily_gap_mbl = DAILY_CONSUMPTION_MILLION_BBL * gap_fraction
    total_gap_mbl = daily_gap_mbl * request.gap_duration_days

    # SPR capacity in million barrels
    spr_capacity_mbl = SPR_DAYS_COVER * DAILY_CONSUMPTION_MILLION_BBL

    drawdown_curve = []
    reserve_remaining = SPR_DAYS_COVER
    cumulative_drawn = 0.0
    depleted = False
    depletion_day = None

    for day in range(request.gap_duration_days + 1):
        if day == 0:
            # Day 0: initial state
            drawdown_curve.append(DrawdownPoint(
                day=day,
                reserve_days_remaining=round(reserve_remaining, 3),
                daily_drawdown_rate=0,
                cumulative_drawn=0,
            ))
            continue

        if request.drawdown_strategy == "front_loaded":
            # Front-loaded: 60% of total drawn in first third, rest spread over remaining
            one_third = max(1, request.gap_duration_days // 3)
            if day <= one_third:
                # Front-loaded phase: higher rate
                front_total = 0.6 * total_gap_mbl
                daily_draw_mbl = front_total / one_third
            else:
                # Tapering phase
                remaining_days = request.gap_duration_days - one_third
                back_total = 0.4 * total_gap_mbl
                daily_draw_mbl = back_total / max(1, remaining_days)
        else:
            # Linear: constant rate
            daily_draw_mbl = total_gap_mbl / request.gap_duration_days

        # Convert drawn barrels to days of consumption
        daily_draw_days = daily_draw_mbl / DAILY_CONSUMPTION_MILLION_BBL
        reserve_remaining -= daily_draw_days
        cumulative_drawn += daily_draw_mbl

        if reserve_remaining <= 0 and not depleted:
            depleted = True
            depletion_day = day
            reserve_remaining = 0

        drawdown_curve.append(DrawdownPoint(
            day=day,
            reserve_days_remaining=round(max(reserve_remaining, 0), 3),
            daily_drawdown_rate=round(daily_draw_mbl, 3),
            cumulative_drawn=round(cumulative_drawn, 3),
        ))

    return DrawdownResponse(
        gap_size_pct=request.gap_size_pct,
        gap_duration_days=request.gap_duration_days,
        strategy=request.drawdown_strategy,
        initial_reserve_days=SPR_DAYS_COVER,
        total_supply_gap_bbl_millions=round(total_gap_mbl, 2),
        drawdown_curve=drawdown_curve,
        reserve_depleted=depleted,
        depletion_day=depletion_day,
        assumptions={
            "spr_days_cover": SPR_DAYS_COVER,
            "daily_consumption_million_bbl": DAILY_CONSUMPTION_MILLION_BBL,
            "front_load_ratio": 0.6,
            "source": "SPR cover from problem statement (9.5 days). Daily consumption illustrative.",
        },
    )
