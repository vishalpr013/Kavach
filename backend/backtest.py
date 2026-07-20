"""
ET-AI historical backtest runner.

Compares the scenario modeller's predicted Brent price impact with observed
5-day Brent spot moves for major historical supply-chain events.
"""

import asyncio
import json
import logging
import os
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Optional

import httpx
from dotenv import load_dotenv

try:
    from .routes.scenarios import ASSUMPTIONS
    from .scoring import initialize_corridor_scores, process_single_signal
    from .state import get_corridor_scores
except ImportError:
    from routes.scenarios import ASSUMPTIONS
    from scoring import initialize_corridor_scores, process_single_signal
    from state import get_corridor_scores

DATA_DIR = Path(__file__).parent / "data"
EIA_URL = "https://api.eia.gov/v2/petroleum/pri/spt/data/"


EVENTS = [
    {
        "name": "US-Iran Standoff",
        "date": "2020-01-03",
        "headline": "Oil jumps after US strike kills Iranian commander, raising Strait of Hormuz disruption fears",
        "capacity_loss_pct": 8,
    },
    {
        "name": "Libya Port Blockade",
        "date": "2020-01-19",
        "headline": "Libya oil ports shut as blockade threatens crude exports from the Mediterranean",
        "capacity_loss_pct": 4,
    },
    {
        "name": "OPEC+ COVID Cut",
        "date": "2020-04-12",
        "headline": "OPEC+ agrees historic production cut to stabilize collapsing crude oil market",
        "capacity_loss_pct": 9,
    },
    {
        "name": "Ever Given Suez Blockage",
        "date": "2021-03-23",
        "headline": "Container ship Ever Given blocks Suez Canal and delays oil tankers on Europe-Asia route",
        "capacity_loss_pct": 6,
    },
    {
        "name": "OPEC+ Surprise Cut",
        "date": "2023-04-02",
        "headline": "OPEC+ announces surprise oil output cuts, tightening Persian Gulf crude supply outlook",
        "capacity_loss_pct": 5,
    },
    {
        "name": "Houthi Red Sea Attacks",
        "date": "2023-12-18",
        "headline": "Oil shipping firms pause Red Sea transits after Houthi attacks on tankers near Bab el-Mandeb",
        "capacity_loss_pct": 7,
    },
    {
        "name": "Iran Seizes Tanker",
        "date": "2024-01-11",
        "headline": "Iran seizes oil tanker near Gulf of Oman, renewing Persian Gulf shipping risk",
        "capacity_loss_pct": 5,
    },
]


FALLBACK_BRENT = {
    "2020-01-03": 68.60,
    "2020-01-08": 65.44,
    "2020-01-21": 64.59,
    "2020-01-24": 60.69,
    "2020-04-13": 31.74,
    "2020-04-17": 19.75,
    "2021-03-23": 60.79,
    "2021-03-29": 64.13,
    "2023-04-03": 84.93,
    "2023-04-06": 84.81,
    "2023-12-18": 78.03,
    "2023-12-22": 79.07,
    "2024-01-11": 78.29,
    "2024-01-16": 79.06,
}


FALLBACK_CLASSIFICATIONS = {
    "US-Iran Standoff": {"corridor": "Strait of Hormuz", "severity": 4},
    "Libya Port Blockade": {"corridor": "Suez Canal", "severity": 3},
    "OPEC+ COVID Cut": {"corridor": "Persian Gulf", "severity": 4},
    "Ever Given Suez Blockage": {"corridor": "Suez Canal", "severity": 3},
    "OPEC+ Surprise Cut": {"corridor": "Persian Gulf", "severity": 4},
    "Houthi Red Sea Attacks": {"corridor": "Red Sea", "severity": 4},
    "Iran Seizes Tanker": {"corridor": "Persian Gulf", "severity": 3},
}


def load_corridors() -> None:
    with open(DATA_DIR / "corridors.json", "r") as f:
        initialize_corridor_scores(json.load(f))


async def fetch_eia_brent(api_key: str, start: str, end: str) -> dict[str, float]:
    params = {
        "api_key": api_key,
        "frequency": "daily",
        "data[0]": "value",
        "facets[series][]": "RBRTE",
        "start": start,
        "end": end,
        "sort[0][column]": "period",
        "sort[0][direction]": "asc",
        "length": 5000,
    }
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.get(EIA_URL, params=params)
        response.raise_for_status()
        payload = response.json()

    prices = {}
    for row in payload.get("response", {}).get("data", []):
        if row.get("period") and row.get("value") is not None:
            prices[row["period"]] = float(row["value"])
    return prices


def nearest_price(prices: dict[str, float], target: str, direction: int = 1) -> Optional[tuple[str, float]]:
    current = datetime.strptime(target, "%Y-%m-%d").date()
    for _ in range(8):
        key = current.isoformat()
        if key in prices:
            return key, prices[key]
        current += timedelta(days=direction)
    return None


async def classify_event(event: dict) -> dict:
    try:
        return await process_single_signal(event["headline"])
    except Exception:
        fallback = FALLBACK_CLASSIFICATIONS[event["name"]]
        return {
            "headline": event["headline"],
            "corridor": fallback["corridor"],
            "severity": fallback["severity"],
            "llm_provider": "offline-fallback",
            "llm_model": "rule-map",
        }


def predicted_price_impact(signal: dict, capacity_loss_pct: float) -> float:
    scores = get_corridor_scores()
    corridor = scores.get(signal["corridor"]) or scores.get("Persian Gulf")
    import_share = corridor["import_share_pct"]
    severity_scale = max(0.2, min(float(signal["severity"]) / 5.0, 1.0))
    refinery_runrate_drop = (capacity_loss_pct / 100.0) * import_share * 100
    return refinery_runrate_drop * ASSUMPTIONS["elasticity_factor"] * severity_scale


async def main() -> None:
    load_dotenv(Path(__file__).parent / ".env")
    logging.getLogger("llm_client").setLevel(logging.CRITICAL)
    logging.getLogger("backend.llm_client").setLevel(logging.CRITICAL)
    load_corridors()

    api_key = os.getenv("EIA_API_KEY")
    start = min(event["date"] for event in EVENTS)
    end = (date.fromisoformat(max(event["date"] for event in EVENTS)) + timedelta(days=10)).isoformat()

    prices = dict(FALLBACK_BRENT)
    price_source = "local fallback"
    if api_key:
        try:
            live_prices = await fetch_eia_brent(api_key, start, end)
            if live_prices:
                prices.update(live_prices)
                price_source = "EIA API v2"
        except Exception as exc:
            print(f"EIA fetch failed, using local fallback prices: {exc}")

    rows = []
    for event in EVENTS:
        signal = await classify_event(event)
        event_date = date.fromisoformat(event["date"])
        end_date = (event_date + timedelta(days=5)).isoformat()
        start_price = nearest_price(prices, event["date"], direction=1)
        end_price = nearest_price(prices, end_date, direction=1) or nearest_price(prices, end_date, direction=-1)

        if not start_price or not end_price:
            actual = None
        else:
            actual = ((end_price[1] - start_price[1]) / start_price[1]) * 100

        predicted = predicted_price_impact(signal, event["capacity_loss_pct"])
        delta = None if actual is None else abs(predicted - actual)
        rows.append((event["name"], signal["corridor"], predicted, actual, delta))

    print(f"ET-AI Historical Backtest - Brent 5-day impact comparison (prices: {price_source})")
    print("-" * 92)
    print(f"{'Event':<28} {'Corridor':<18} {'Predicted':>11} {'Actual':>11} {'Abs Error':>11}")
    print("-" * 92)
    for name, corridor, predicted, actual, delta in rows:
        actual_text = "n/a" if actual is None else f"{actual:>10.2f}%"
        delta_text = "n/a" if delta is None else f"{delta:>10.2f}%"
        print(f"{name:<28} {corridor:<18} {predicted:>10.2f}% {actual_text:>11} {delta_text:>11}")


if __name__ == "__main__":
    asyncio.run(main())
