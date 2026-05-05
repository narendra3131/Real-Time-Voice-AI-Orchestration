"""Shared configuration for the backend."""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / ".env")

# LiveKit
LIVEKIT_URL = os.getenv("LIVEKIT_URL", "ws://localhost:7880")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY", "devkey")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET", "secret")

# OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# Deepgram
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY", "")

# Paths
BACKEND_PORT = int(os.getenv("BACKEND_PORT", "8000"))
CHROMA_PERSIST_DIR = str(ROOT_DIR / os.getenv("CHROMA_PERSIST_DIR", "./chroma_data"))
UPLOAD_DIR = str(ROOT_DIR / os.getenv("UPLOAD_DIR", "./uploads"))
PROMPT_FILE = str(ROOT_DIR / os.getenv("PROMPT_FILE", "./config/system_prompt.txt"))

# Ensure directories exist
os.makedirs(CHROMA_PERSIST_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.dirname(PROMPT_FILE), exist_ok=True)

DEFAULT_SYSTEM_PROMPT = (
    "You are a helpful, friendly AI assistant. Answer questions clearly and concisely. "
    "When you have knowledge base context, use it to provide accurate answers. "
    "Keep responses conversational since you are speaking via voice."
)


def get_system_prompt() -> str:
    """Read the current system prompt from file."""
    try:
        with open(PROMPT_FILE, "r", encoding="utf-8") as f:
            prompt = f.read().strip()
            return prompt if prompt else DEFAULT_SYSTEM_PROMPT
    except FileNotFoundError:
        return DEFAULT_SYSTEM_PROMPT


def save_system_prompt(prompt: str) -> None:
    """Save the system prompt to file."""
    with open(PROMPT_FILE, "w", encoding="utf-8") as f:
        f.write(prompt)
