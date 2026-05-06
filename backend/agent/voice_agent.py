"""
LiveKit Voice Agent Worker (v1.5.x API).

Standalone process that connects to LiveKit and handles
the voice pipeline: STT → RAG → LLM → TTS.

Run with: python agent/voice_agent.py dev
"""

import asyncio
import json
import logging
import sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

# Ensure parent is on path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from livekit.agents import (
    Agent,
    AgentSession,
    AutoSubscribe,
    JobContext,
    JobProcess,
    RoomInputOptions,
    WorkerOptions,
    cli,
)
from livekit.agents.llm import ChatContext, ChatMessage
from livekit.plugins import deepgram, openai, silero

from config import get_system_prompt, LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET
from knowledge_base.retrieval import search_documents

logger = logging.getLogger("voice-agent")
logger.setLevel(logging.INFO)

# Store room reference for data channel publishing
_room_ref = None

# Thread pool for running blocking RAG calls off the event loop
_rag_executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="rag")


class VoiceAIAgent(Agent):
    """Custom voice agent with RAG capabilities."""

    def __init__(self):
        super().__init__(
            instructions=get_system_prompt(),
            # --- STT: Deepgram Nova-2 with low-latency streaming ---
            stt=deepgram.STT(
                language="en",
                model="nova-2",
            ),
            # --- LLM: GPT-4o-mini tuned for speed ---
            llm=openai.LLM(
                model="gpt-4o-mini",
                temperature=0.7,
            ),
            # --- TTS: OpenAI with fastest voice ---
            tts=openai.TTS(voice="alloy"),
            # --- VAD: Silero with faster cut-in ---
            vad=silero.VAD.load(
                min_silence_duration=0.3,   # was ~0.5s default → faster endpointing
                min_speech_duration=0.1,    # detect speech faster
            ),
        )

    async def on_enter(self):
        """Called when the agent starts. Greet the user."""
        await self.session.say(
            "Hello! I'm your AI assistant. How can I help you today?",
            allow_interruptions=True,
        )

    async def on_user_turn_completed(
        self, turn_ctx: ChatContext, new_message: ChatMessage
    ):
        """
        Called when the user finishes speaking, before LLM responds.
        We inject RAG context from the knowledge base here.
        Runs RAG search in a thread pool to avoid blocking the event loop.
        """
        global _room_ref

        # Extract user text from the new message
        user_msg = new_message.text_content
        if not user_msg:
            return

        logger.info(f"User said: {user_msg[:100]}")

        # Send user transcript to frontend (non-blocking)
        asyncio.ensure_future(self._publish_data({
            "type": "transcript",
            "role": "user",
            "text": user_msg,
        }))

        # Run RAG search in a background thread (non-blocking)
        loop = asyncio.get_event_loop()
        try:
            results = await loop.run_in_executor(
                _rag_executor,
                search_documents,
                user_msg,
                3,  # top_k=3 (was 5) → less context = faster LLM response
            )
        except Exception as e:
            logger.warning(f"RAG search failed: {e}")
            return

        if not results:
            logger.info("RAG: no relevant documents found")
            return

        # Build context string from retrieved chunks
        context_parts = []
        sources = []
        for r in results:
            context_parts.append(r["text"])
            sources.append({
                "text": r["text"][:150] + ("..." if len(r["text"]) > 150 else ""),
                "source": r.get("metadata", {}).get("source", "Unknown"),
                "score": r.get("score", 0),
            })

        context_text = "\n\n---\n\n".join(context_parts)

        # Update agent instructions with RAG context
        base_prompt = get_system_prompt()
        enhanced_instructions = (
            f"{base_prompt}\n\n"
            f"## Relevant Context from Knowledge Base:\n"
            f"{context_text}\n\n"
            f"Use the above context to answer the user's question accurately. "
            f"If the context is relevant, base your answer on it. "
            f"Keep your response concise and conversational."
        )
        await self.update_instructions(enhanced_instructions)

        # Send RAG sources to frontend (non-blocking)
        asyncio.ensure_future(self._publish_data({
            "type": "rag_sources",
            "sources": sources,
        }))

        logger.info(f"RAG: injected {len(results)} chunks for: {user_msg[:80]}")

    async def _publish_data(self, data: dict):
        """Publish data to frontend via LiveKit data channel."""
        global _room_ref
        if _room_ref is None:
            return
        try:
            await _room_ref.local_participant.publish_data(
                json.dumps(data).encode("utf-8"),
                reliable=True,
            )
        except Exception as e:
            logger.debug(f"Data publish error: {e}")


def prewarm(proc: JobProcess):
    """Pre-warm: called once when the worker process starts."""
    logger.info("Agent worker prewarming...")


async def entrypoint(ctx: JobContext):
    """Main agent entrypoint — runs when a participant joins a room."""
    global _room_ref

    logger.info(f"Agent entrypoint: room={ctx.room.name}")

    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    participant = await ctx.wait_for_participant()
    logger.info(f"Participant joined: {participant.identity}")

    # Store room reference for data channel
    _room_ref = ctx.room

    # Create agent and session with interruption support
    agent = VoiceAIAgent()
    session = AgentSession(
        allow_interruptions=True,          # agent stops when user speaks
    )

    # Listen for speech events to send agent transcripts
    @session.on("agent_state_changed")
    def on_state_changed(ev):
        """Notify frontend of state changes."""
        try:
            state = ev.state if hasattr(ev, "state") else str(ev)
            asyncio.ensure_future(
                ctx.room.local_participant.publish_data(
                    json.dumps({
                        "type": "agent_state",
                        "state": str(state),
                    }).encode("utf-8"),
                    reliable=True,
                )
            )
        except Exception:
            pass

    @session.on("conversation_item_added")
    def on_conversation_item(ev):
        """Send agent transcript when agent finishes speaking."""
        try:
            item = ev.item if hasattr(ev, "item") else ev
            # Robust role check — match any assistant-like role string
            role_str = str(getattr(item, "role", "")).lower()
            is_agent = "assistant" in role_str

            if is_agent:
                text = ""
                if hasattr(item, "text_content"):
                    text = item.text_content or ""
                elif hasattr(item, "content"):
                    text = str(item.content) or ""

                if text:
                    logger.info(f"Agent said: {text[:100]}")
                    asyncio.ensure_future(
                        ctx.room.local_participant.publish_data(
                            json.dumps({
                                "type": "transcript",
                                "role": "agent",
                                "text": text,
                            }).encode("utf-8"),
                            reliable=True,
                        )
                    )
        except Exception as e:
            logger.debug(f"Transcript event error: {e}")

    @session.on("agent_speech_committed")
    def on_agent_speech_committed(ev):
        """
        Fallback: fired when the agent finishes speaking a full utterance.
        Guarantees agent text appears in the transcript even if
        conversation_item_added doesn't fire.
        """
        try:
            text = ""
            if hasattr(ev, "content"):
                text = ev.content
            elif hasattr(ev, "text"):
                text = ev.text
            elif hasattr(ev, "item") and hasattr(ev.item, "text_content"):
                text = ev.item.text_content

            if text:
                logger.info(f"Agent speech committed: {text[:100]}")
                asyncio.ensure_future(
                    ctx.room.local_participant.publish_data(
                        json.dumps({
                            "type": "transcript",
                            "role": "agent",
                            "text": text,
                        }).encode("utf-8"),
                        reliable=True,
                    )
                )
        except Exception as e:
            logger.debug(f"Speech committed event error: {e}")

    # Start the session
    await session.start(
        agent=agent,
        room=ctx.room,
    )

    logger.info("Voice agent session started successfully.")


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
            ws_url=LIVEKIT_URL,
            api_key=LIVEKIT_API_KEY,
            api_secret=LIVEKIT_API_SECRET,
        ),
    )
