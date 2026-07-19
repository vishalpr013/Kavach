"""
ET-AI Backend — Deterministic Scoring Engine

All risk scoring is done with deterministic Python math — no LLM calls.
The LLM is only used for extracting structured data from headlines;
the actual scoring, decay, and aggregation happens here.

Scoring formula (from spec):
  corridor_score = base_score + (severity * 8) * recency_weight * source_credibility_weight
  Capped at 100. Decay older signals by ~5 points per simulated "day".
"""

import json
import time
import logging
from pathlib import Path
from typing import Optional

try:
    from .state import get_corridor_scores, set_corridor_scores, update_corridor_score
    from .llm_client import call_llm
except ImportError:
    from state import get_corridor_scores, set_corridor_scores, update_corridor_score
    from llm_client import call_llm

logger = logging.getLogger(__name__)

# Weight constants — clearly documented as illustrative for the hackathon
SEVERITY_MULTIPLIER = 8  # Each severity point contributes 8 base points
RECENCY_DECAY_PER_DAY = 5  # Points of decay per simulated day
DEFAULT_SOURCE_CREDIBILITY = 0.85  # Default credibility weight for all sources (illustrative)


def initialize_corridor_scores(corridors: list[dict]):
    """
    Initialize corridor scores from seed data.
    Sets each corridor to its baseline risk score with an empty signal list.
    """
    scores = {}
    for corridor in corridors:
        scores[corridor["name"]] = {
            "name": corridor["name"],
            "score": corridor["baseline_risk_score"],
            "baseline": corridor["baseline_risk_score"],
            "import_share_pct": corridor["import_share_pct"],
            "description": corridor["description"],
            "lat": corridor["lat"],
            "lng": corridor["lng"],
            "region": corridor.get("region", ""),
            "signals": [],
            "last_updated": time.time(),
        }
    set_corridor_scores(scores)
    logger.info(f"Initialized {len(scores)} corridors with baseline scores")


def compute_corridor_score(
    base_score: float,
    severity: int,
    recency_days: float = 0.0,
    source_credibility: float = DEFAULT_SOURCE_CREDIBILITY,
) -> float:
    """
    Deterministic scoring formula.

    corridor_score = base_score + (severity * 8) * recency_weight * source_credibility_weight
    Capped at 100.

    Args:
        base_score: The corridor's current score before this signal.
        severity: 1-5 severity rating from LLM extraction.
        recency_days: How many simulated days old the signal is (0 = just now).
        source_credibility: 0-1 weight for source trustworthiness.

    Returns:
        Updated score, capped at 100.
    """
    recency_weight = max(0.1, 1.0 - (recency_days * RECENCY_DECAY_PER_DAY / 100))
    score_delta = (severity * SEVERITY_MULTIPLIER) * recency_weight * source_credibility
    new_score = base_score + score_delta
    return min(new_score, 100.0)


def recalculate_corridor_score(corridor_name: str) -> float:
    """
    Recalculate a corridor's score from its baseline + all accumulated signals.
    Applies recency decay to older signals.
    """
    scores = get_corridor_scores()
    if corridor_name not in scores:
        return 0.0

    corridor = scores[corridor_name]
    base = corridor["baseline"]
    accumulated = base

    now = time.time()
    for signal in corridor["signals"]:
        signal_time = signal.get("timestamp", now)
        days_old = (now - signal_time) / 86400  # seconds to days
        severity = signal.get("severity", 1)
        credibility = signal.get("source_credibility", DEFAULT_SOURCE_CREDIBILITY)
        delta = (severity * SEVERITY_MULTIPLIER) * max(0.1, 1.0 - (days_old * RECENCY_DECAY_PER_DAY / 100)) * credibility
        accumulated += delta

    return min(accumulated, 100.0)


async def process_single_signal(headline: str) -> dict:
    """
    Process a single headline through the LLM for extraction,
    then apply deterministic scoring.

    Returns the extracted signal with updated corridor score.
    """
    # Load the extraction prompt template
    prompt_path = Path(__file__).parent / "prompts" / "extract_signal.txt"
    with open(prompt_path, "r") as f:
        prompt_template = f.read()

    prompt = prompt_template.replace("{headline}", headline)

    # ONE LLM call for extraction
    result = await call_llm(
        system_prompt="You are a geopolitical risk analyst. Extract structured risk data from headlines.",
        user_prompt=prompt,
        response_format="json",
    )

    # Parse the LLM's JSON response
    try:
        extracted = json.loads(result["content"])
    except json.JSONDecodeError:
        logger.error(f"Failed to parse LLM response as JSON: {result['content']}")
        raise ValueError("LLM returned invalid JSON for signal extraction")

    # Build signal record
    signal = {
        "headline": headline,
        "corridor": extracted.get("corridor", "Other"),
        "risk_category": extracted.get("risk_category", "diplomatic"),
        "severity": int(extracted.get("severity", 1)),
        "confidence": float(extracted.get("confidence", 0.5)),
        "one_line_reasoning": extracted.get("one_line_reasoning", ""),
        "source_credibility": DEFAULT_SOURCE_CREDIBILITY,
        "timestamp": time.time(),
        "llm_provider": result["provider"],
        "llm_model": result["model"],
    }

    # Apply deterministic scoring
    scores = get_corridor_scores()
    corridor_name = signal["corridor"]
    if corridor_name in scores:
        current_score = scores[corridor_name]["score"]
        new_score = compute_corridor_score(
            base_score=current_score,
            severity=signal["severity"],
            recency_days=0.0,
            source_credibility=signal["source_credibility"],
        )
        update_corridor_score(corridor_name, new_score, signal)
        signal["updated_score"] = new_score
        signal["previous_score"] = current_score
    else:
        signal["updated_score"] = None
        signal["previous_score"] = None

    return signal


async def batch_process_seed_headlines(seed_headlines: list[dict]):
    """
    Batch-process all seed headlines in ONE LLM call at startup.
    This pre-populates corridor scores before the demo starts.

    Uses a batched prompt that returns a JSON array of all extractions.
    """
    headlines_text = "\n".join(
        [f"{i+1}. {h['headline']}" for i, h in enumerate(seed_headlines)]
    )

    batch_prompt = f"""You are a geopolitical risk analyst for an energy supply chain intelligence system.
Given the following {len(seed_headlines)} news headlines, classify EACH one. 
Respond with a JSON array containing one object per headline, in order.

Each object must follow this schema:
{{
  "headline_index": integer (1-based, matching the headline number),
  "corridor": one of ["Strait of Hormuz", "Red Sea", "Iran Exports", "Persian Gulf", "Suez Canal", "Other"],
  "risk_category": one of ["sanctions", "military/maritime incident", "price shock", "capacity disruption", "diplomatic"],
  "severity": integer 1-5 (1=minor/rhetorical, 5=active supply-threatening event),
  "confidence": float 0-1,
  "one_line_reasoning": string, max 20 words
}}

Respond ONLY with a valid JSON array, no markdown, no preamble.

Headlines:
{headlines_text}"""

    result = await call_llm(
        system_prompt="You are a geopolitical risk analyst. Extract structured risk data from multiple headlines in batch.",
        user_prompt=batch_prompt,
        response_format="json",
    )

    try:
        # Parse the batch response — handle both array and object with array
        content = result["content"].strip()
        parsed = json.loads(content)

        # Some providers wrap the array in an object
        if isinstance(parsed, dict):
            # Try common wrapper keys
            for key in ["headlines", "results", "data", "extractions"]:
                if key in parsed and isinstance(parsed[key], list):
                    parsed = parsed[key]
                    break

        if not isinstance(parsed, list):
            raise ValueError(f"Expected JSON array, got {type(parsed)}")

        extractions = parsed
    except (json.JSONDecodeError, ValueError) as e:
        logger.error(f"Failed to parse batch LLM response: {e}")
        logger.error(f"Raw response: {result['content'][:500]}")
        return  # Fail gracefully — dashboard will show baseline scores

    # Apply each extraction to the scoring engine
    scores = get_corridor_scores()
    now = time.time()

    for i, extraction in enumerate(extractions):
        severity = int(extraction.get("severity", 1))
        corridor_name = extraction.get("corridor", "Other")

        # Simulate slight time spread so signals have different recency
        simulated_timestamp = now - (len(extractions) - i) * 3600  # 1 hour apart

        signal = {
            "headline": seed_headlines[i]["headline"] if i < len(seed_headlines) else "",
            "corridor": corridor_name,
            "risk_category": extraction.get("risk_category", "diplomatic"),
            "severity": severity,
            "confidence": float(extraction.get("confidence", 0.5)),
            "one_line_reasoning": extraction.get("one_line_reasoning", ""),
            "source_credibility": DEFAULT_SOURCE_CREDIBILITY,
            "timestamp": simulated_timestamp,
            "llm_provider": result["provider"],
            "llm_model": result["model"],
            "is_seed": True,
        }

        if corridor_name in scores:
            current_score = scores[corridor_name]["score"]
            new_score = compute_corridor_score(
                base_score=current_score,
                severity=severity,
                recency_days=(now - simulated_timestamp) / 86400,
                source_credibility=DEFAULT_SOURCE_CREDIBILITY,
            )
            update_corridor_score(corridor_name, new_score, signal)

    logger.info(f"Batch-processed {len(extractions)} seed headlines successfully")
