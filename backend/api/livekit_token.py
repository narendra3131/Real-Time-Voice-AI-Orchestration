"""LiveKit token generation API."""

from fastapi import APIRouter
from pydantic import BaseModel
from livekit.api import AccessToken, VideoGrants

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from config import LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL

router = APIRouter(prefix="/api/livekit", tags=["livekit"])


class TokenRequest(BaseModel):
    room_name: str = "voice-agent-room"
    participant_name: str = "user"


class TokenResponse(BaseModel):
    token: str
    url: str
    room_name: str


@router.post("/token", response_model=TokenResponse)
async def create_token(request: TokenRequest):
    """Generate a LiveKit access token for the user to join a room."""
    token = (
        AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
        .with_identity(request.participant_name)
        .with_name(request.participant_name)
        .with_grants(
            VideoGrants(
                room_join=True,
                room=request.room_name,
                can_publish=True,
                can_subscribe=True,
            )
        )
    )

    jwt_token = token.to_jwt()
    return TokenResponse(
        token=jwt_token,
        url=LIVEKIT_URL,
        room_name=request.room_name,
    )
