"""
ET-AI Backend — In-Memory Application State

Stores session-level state for the hackathon demo:
- Active LLM provider configuration
- Corridor risk scores (populated at startup from seed data)
- Ingested signals history
"""

from typing import Optional


# ---------------------------------------------------------------------------
# LLM Provider State
# ---------------------------------------------------------------------------

_llm_config = {
    "provider": "groq",
    "api_key": None,  # None = use default from env
}


def get_active_llm_config() -> dict:
    """Return the current active LLM provider and key status."""
    return {
        "provider": _llm_config["provider"],
        "api_key": _llm_config["api_key"],
    }


def set_llm_config(provider: str, api_key: Optional[str] = None):
    """Update the active LLM provider and optional API key."""
    valid_providers = {"groq", "openai", "gemini", "claude"}
    if provider not in valid_providers:
        raise ValueError(f"Invalid provider '{provider}'. Must be one of: {valid_providers}")
    _llm_config["provider"] = provider
    _llm_config["api_key"] = api_key


# ---------------------------------------------------------------------------
# Corridor Scores State
# ---------------------------------------------------------------------------

# corridor_name -> {"score": float, "signals": list[dict]}
_corridor_scores: dict[str, dict] = {}

# All ingested signals (for history / recency tracking)
_ingested_signals: list[dict] = []


def get_corridor_scores() -> dict:
    """Return current corridor scores."""
    return _corridor_scores


def set_corridor_scores(scores: dict):
    """Set corridor scores (used during initialization)."""
    global _corridor_scores
    _corridor_scores = scores


def update_corridor_score(corridor_name: str, score: float, signal: dict):
    """Update a single corridor's score and append the signal."""
    if corridor_name in _corridor_scores:
        _corridor_scores[corridor_name]["score"] = min(score, 100)
        _corridor_scores[corridor_name]["signals"].append(signal)
    _ingested_signals.append(signal)


def get_ingested_signals() -> list[dict]:
    """Return all ingested signals."""
    return _ingested_signals
