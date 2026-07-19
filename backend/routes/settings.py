"""
ET-AI Backend — LLM Provider Settings Routes

Endpoints:
  POST /api/settings/llm-provider — set active provider + optional API key
  GET  /api/settings/llm-provider — return active provider (never returns actual key)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from ..state import get_active_llm_config, set_llm_config
from ..llm_client import call_llm, _get_default_key

router = APIRouter(prefix="/api/settings", tags=["settings"])


class LLMProviderRequest(BaseModel):
    provider: str  # "groq" | "openai" | "gemini" | "claude"
    api_key: Optional[str] = None


class LLMProviderResponse(BaseModel):
    provider: str
    has_key: bool
    key_source: str  # "default" | "user" | "none"


class TestConnectionResponse(BaseModel):
    success: bool
    provider: str
    message: str


@router.post("/llm-provider", response_model=LLMProviderResponse)
async def set_provider(request: LLMProviderRequest):
    """Set the active LLM provider and optional API key."""
    try:
        set_llm_config(request.provider, request.api_key)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Determine key source
    if request.api_key:
        key_source = "user"
        has_key = True
    elif _get_default_key(request.provider):
        key_source = "default"
        has_key = True
    else:
        key_source = "none"
        has_key = False

    return LLMProviderResponse(
        provider=request.provider,
        has_key=has_key,
        key_source=key_source,
    )


@router.get("/llm-provider", response_model=LLMProviderResponse)
async def get_provider():
    """Return the current active LLM provider (never returns the actual key)."""
    config = get_active_llm_config()
    provider = config["provider"]

    if config["api_key"]:
        key_source = "user"
        has_key = True
    elif _get_default_key(provider):
        key_source = "default"
        has_key = True
    else:
        key_source = "none"
        has_key = False

    return LLMProviderResponse(
        provider=provider,
        has_key=has_key,
        key_source=key_source,
    )


@router.post("/test-connection", response_model=TestConnectionResponse)
async def test_connection():
    """Fire a trivial LLM call to test the current provider/key configuration."""
    config = get_active_llm_config()
    provider = config["provider"]

    try:
        result = await call_llm(
            system_prompt="You are a helpful assistant.",
            user_prompt='Respond with exactly: {"status": "ok"}',
            response_format="json",
        )
        return TestConnectionResponse(
            success=True,
            provider=provider,
            message=f"Connected to {provider} ({result['model']}) successfully.",
        )
    except Exception as e:
        return TestConnectionResponse(
            success=False,
            provider=provider,
            message=f"Connection failed: {str(e)}",
        )
