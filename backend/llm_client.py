"""
ET-AI Backend — Multi-Provider LLM Client

Provides a single `call_llm()` interface that abstracts over Groq, OpenAI,
Google Gemini, and Anthropic Claude. All adapters return the same normalized
output shape so nothing downstream needs to know which provider ran.

Default provider: Groq, using DEFAULT_GROQ_API_KEY from environment.
"""

import os
import json
import logging
from typing import Optional

logger = logging.getLogger(__name__)


async def call_llm(
    system_prompt: str,
    user_prompt: str,
    provider: Optional[str] = None,
    api_key: Optional[str] = None,
    response_format: Optional[str] = "json",
) -> dict:
    """
    Unified LLM call interface.

    Args:
        system_prompt: System-level instruction for the LLM.
        user_prompt: User-level prompt / input.
        provider: One of "groq", "openai", "gemini", "claude". Defaults to active provider.
        api_key: API key override. If None, uses the session or default key.
        response_format: "json" for JSON mode, "text" for plain text.

    Returns:
        {"content": str, "provider": str, "model": str}
    """
    from .state import get_active_llm_config

    active_config = get_active_llm_config()
    provider = provider or active_config["provider"]
    api_key = api_key or active_config.get("api_key")

    # Resolve default key from environment if none provided
    if not api_key:
        api_key = _get_default_key(provider)

    if not api_key:
        raise ValueError(
            f"No API key available for provider '{provider}'. "
            f"Please provide a key via the settings panel."
        )

    adapter = _ADAPTERS.get(provider)
    if not adapter:
        raise ValueError(f"Unknown LLM provider: '{provider}'. Must be one of: groq, openai, gemini, claude")

    try:
        result = await adapter(api_key, system_prompt, user_prompt, response_format)
        return result
    except Exception as e:
        logger.error(f"LLM call failed (provider={provider}): {e}")
        raise


def _get_default_key(provider: str) -> Optional[str]:
    """Retrieve the default API key for a provider from environment variables."""
    env_map = {
        "groq": "DEFAULT_GROQ_API_KEY",
        "openai": "DEFAULT_OPENAI_API_KEY",
        "gemini": "DEFAULT_GEMINI_API_KEY",
        "claude": "DEFAULT_CLAUDE_API_KEY",
    }
    env_var = env_map.get(provider)
    if env_var:
        return os.environ.get(env_var)
    return None


# ---------------------------------------------------------------------------
# Provider Adapters
# Each accepts (api_key, system_prompt, user_prompt, response_format)
# and returns {"content": str, "provider": str, "model": str}
# ---------------------------------------------------------------------------


async def _call_groq(
    api_key: str, system_prompt: str, user_prompt: str, response_format: str
) -> dict:
    """Groq adapter — uses OpenAI-compatible chat completions endpoint."""
    from groq import AsyncGroq

    client = AsyncGroq(api_key=api_key)

    kwargs = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.2,
        "max_tokens": 2048,
    }

    if response_format == "json":
        kwargs["response_format"] = {"type": "json_object"}

    response = await client.chat.completions.create(**kwargs)
    content = response.choices[0].message.content

    return {
        "content": content,
        "provider": "groq",
        "model": response.model,
    }


async def _call_openai(
    api_key: str, system_prompt: str, user_prompt: str, response_format: str
) -> dict:
    """OpenAI adapter — standard chat completions."""
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=api_key)

    kwargs = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.2,
        "max_tokens": 2048,
    }

    if response_format == "json":
        kwargs["response_format"] = {"type": "json_object"}

    response = await client.chat.completions.create(**kwargs)
    content = response.choices[0].message.content

    return {
        "content": content,
        "provider": "openai",
        "model": response.model,
    }


async def _call_gemini(
    api_key: str, system_prompt: str, user_prompt: str, response_format: str
) -> dict:
    """Google Gemini adapter — generate-content endpoint."""
    from google import genai

    client = genai.Client(api_key=api_key)

    config = {
        "temperature": 0.2,
        "max_output_tokens": 2048,
    }

    if response_format == "json":
        config["response_mime_type"] = "application/json"

    response = await client.aio.models.generate_content(
        model="gemini-2.0-flash",
        contents=f"{system_prompt}\n\n{user_prompt}",
        config=config,
    )
    content = response.text

    return {
        "content": content,
        "provider": "gemini",
        "model": "gemini-2.0-flash",
    }


async def _call_claude(
    api_key: str, system_prompt: str, user_prompt: str, response_format: str
) -> dict:
    """Anthropic Claude adapter — Messages API."""
    from anthropic import AsyncAnthropic

    client = AsyncAnthropic(api_key=api_key)

    # Claude doesn't have a native JSON mode — we instruct via system prompt
    effective_system = system_prompt
    if response_format == "json":
        effective_system += "\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown fences, no preamble, no explanation."

    response = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2048,
        system=effective_system,
        messages=[
            {"role": "user", "content": user_prompt},
        ],
    )
    content = response.content[0].text

    return {
        "content": content,
        "provider": "claude",
        "model": response.model,
    }


# Adapter registry
_ADAPTERS = {
    "groq": _call_groq,
    "openai": _call_openai,
    "gemini": _call_gemini,
    "claude": _call_claude,
}
