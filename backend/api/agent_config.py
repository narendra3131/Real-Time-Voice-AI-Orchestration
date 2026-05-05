"""Agent configuration API routes (system prompt)."""

from fastapi import APIRouter
from pydantic import BaseModel

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from config import get_system_prompt, save_system_prompt, DEFAULT_SYSTEM_PROMPT

router = APIRouter(prefix="/api/agent", tags=["agent"])


class PromptRequest(BaseModel):
    prompt: str


class PromptResponse(BaseModel):
    prompt: str


@router.get("/config", response_model=PromptResponse)
async def get_config():
    """Get the current system prompt."""
    return PromptResponse(prompt=get_system_prompt())


@router.put("/config", response_model=PromptResponse)
async def update_config(request: PromptRequest):
    """Update the system prompt."""
    prompt = request.prompt.strip()
    if not prompt:
        prompt = DEFAULT_SYSTEM_PROMPT
    save_system_prompt(prompt)
    return PromptResponse(prompt=prompt)


@router.post("/config/reset", response_model=PromptResponse)
async def reset_config():
    """Reset the system prompt to default."""
    save_system_prompt(DEFAULT_SYSTEM_PROMPT)
    return PromptResponse(prompt=DEFAULT_SYSTEM_PROMPT)
