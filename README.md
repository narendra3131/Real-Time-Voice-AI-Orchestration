# 🎙️ Real-Time Voice AI Orchestration

An end-to-end real-time voice agent where a user can talk to the AI agent over WebRTC (via LiveKit) and the agent answers using prompt instructions and RAG over uploaded documents during the call.

---

## 🏗️ Architecture

```
User (Browser) → React Frontend → LiveKit Cloud (WebRTC) → Agent Worker
                                                              ↓
                                                    Deepgram STT (streaming)
                                                              ↓
                                                    ChromaDB RAG retrieval
                                                              ↓
                                                    OpenAI GPT-4o-mini (LLM)
                                                              ↓
                                                    OpenAI TTS (streaming)
                                                              ↓
                                                    Audio back to User
```

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, LiveKit React SDK |
| Backend API | Python 3.10+, FastAPI, Uvicorn |
| Voice Pipeline | LiveKit Agents SDK v1.5.x |
| Speech-to-Text | Deepgram Nova-2 (streaming) |
| LLM | OpenAI GPT-4o-mini |
| Text-to-Speech | OpenAI TTS (alloy voice) |
| Embeddings | OpenAI text-embedding-3-small |
| Vector Store | ChromaDB (local persistence) |
| RAG | Custom chunking + cosine similarity search |

---

## 📋 Features

- ✅ **Real-time voice conversation** via WebRTC (LiveKit Cloud)
- ✅ **Document upload** for knowledge base (PDF, DOCX, TXT, MD, CSV)
- ✅ **RAG-enhanced responses** — agent answers from uploaded documents
- ✅ **Editable system prompt** — customize agent behavior on the fly
- ✅ **Live transcript** — real-time user and agent speech displayed
- ✅ **RAG sources panel** — shows retrieved document chunks with relevance scores
- ✅ **Audio visualizer** — animated orb changes color by agent state
- ✅ **Responsive design** — works on desktop, tablet, and mobile
- ✅ **Docker support** — docker-compose for containerized deployment

---

## 🔐 Environment Variables

Create a `.env` file in the project root (see `.env.example`):

| Variable | Description | Where to get it |
|---|---|---|
| `LIVEKIT_URL` | LiveKit Cloud WebSocket URL | [LiveKit Cloud Console](https://cloud.livekit.io/) |
| `LIVEKIT_API_KEY` | LiveKit API Key | LiveKit Cloud Console → Settings → Keys |
| `LIVEKIT_API_SECRET` | LiveKit API Secret | LiveKit Cloud Console → Settings → Keys |
| `OPENAI_API_KEY` | OpenAI API Key | [OpenAI Platform](https://platform.openai.com/api-keys) |
| `DEEPGRAM_API_KEY` | Deepgram API Key | [Deepgram Console](https://console.deepgram.com/) |

```env
# .env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
OPENAI_API_KEY=sk-your-openai-key
DEEPGRAM_API_KEY=your_deepgram_key
```

---

## 🚀 Setup Steps

### Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **npm** or **yarn**
- API Keys: OpenAI, Deepgram, LiveKit Cloud (see above)

### 1. Clone the Repository

```bash
git clone https://github.com/narendra3131/Real-Time-Voice-AI-Orchestration.git
cd Real-Time-Voice-AI-Orchestration
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your actual API keys
```

### 3. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
cd ..
```

### 4. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

---

## ▶️ How to Run

**You need 3 terminals running simultaneously:**

### Terminal 1: Backend API Server

```bash
cd backend
python main.py
```

The FastAPI server starts at **http://localhost:8000**.

### Terminal 2: LiveKit Agent Worker

```bash
cd backend
python agent/voice_agent.py dev
```

The agent worker connects to **LiveKit Cloud** and waits for participants. You should see:
```
registered worker {"url": "wss://your-project.livekit.cloud", "region": "..."}
```

### Terminal 3: Frontend Dev Server

```bash
cd frontend
npm run dev
```

The React app starts at **http://localhost:5173**.

### 🎉 Using the App

1. Open **http://localhost:5173** in your browser
2. Go to **Knowledge Base** → upload documents (PDF, DOCX, TXT, etc.)
3. Go to **System Prompt** → customize the agent's behavior (optional)
4. Go to **Voice Agent** → click **Start Call**
5. Speak into your mic — the agent will respond using your documents!
6. Watch the **Live Transcript** and **RAG Sources** panels on the right

---

## 🔊 How to Run LiveKit

### Option A: LiveKit Cloud (Recommended)

1. Sign up at [https://cloud.livekit.io](https://cloud.livekit.io)
2. Create a new project
3. Go to **Settings → Keys** to get your `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET`
4. Add these to your `.env` file

### Option B: Local LiveKit Server

1. Install LiveKit CLI:
   ```bash
   # macOS
   brew install livekit

   # Windows (via Go)
   go install github.com/livekit/livekit-server@latest
   ```

2. Start the local server:
   ```bash
   livekit-server --dev
   ```

3. Update `.env`:
   ```env
   LIVEKIT_URL=ws://localhost:7880
   LIVEKIT_API_KEY=devkey
   LIVEKIT_API_SECRET=secret
   ```

---

## 🐳 Docker

```bash
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |

---

## 📁 Project Structure

```
Real-Time-Voice-AI-Orchestration/
├── backend/
│   ├── main.py                    # FastAPI server (CORS, routes)
│   ├── config.py                  # Environment vars, path management
│   ├── requirements.txt           # Python dependencies
│   ├── agent/
│   │   └── voice_agent.py         # LiveKit agent worker (STT→RAG→LLM→TTS)
│   ├── knowledge_base/
│   │   ├── ingestion.py           # Document parsing, chunking, embedding
│   │   ├── retrieval.py           # Vector similarity search
│   │   └── vector_store.py        # ChromaDB singleton wrapper
│   └── api/
│       ├── documents.py           # Upload/list/delete documents
│       ├── agent_config.py        # System prompt CRUD
│       └── livekit_token.py       # LiveKit token generation
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx                # Main app with LiveKit room connection
│       ├── App.css                # Responsive app layout
│       ├── index.css              # Design system tokens
│       ├── services/api.js        # Axios API client
│       └── components/
│           ├── Layout/            # Sidebar + responsive navigation
│           ├── VoiceAgent/        # Voice call UI + audio visualizer
│           ├── KnowledgeBase/     # Drag-drop document upload
│           ├── PromptEditor/      # System prompt editor
│           ├── Transcript/        # Live conversation transcript
│           └── RAGSources/        # Retrieved document chunks display
├── config/
│   ├── system_prompt.txt          # Default system prompt
│   └── documents.json             # Document registry
├── .env.example                   # Environment template
├── docker-compose.yml             # Docker deployment
└── README.md
```

---

## ⚠️ Known Limitations & Tradeoffs

| Limitation | Details |
|---|---|
| **Single Knowledge Base** | All documents share one collection — no multi-tenant/multi-agent support |
| **English Only** | STT (Deepgram) and TTS (OpenAI) are configured for English |
| **System Prompt Timing** | Prompt changes take effect on the next call, not during an active call |
| **File Size Limit** | Maximum upload size is 20MB per document |
| **LiveKit Cloud Required** | Requires a LiveKit Cloud account or local LiveKit server |
| **No Authentication** | No user login/auth — designed as a single-user demo |
| **ChromaDB Local** | Vector store is local (not distributed) — suitable for demos, not production scale |
| **Python 3.10+** | LiveKit Agents SDK requires Python 3.10 or later |
| **Silero VAD Warning** | On slower machines, you may see "inference is slower than realtime" — this is non-blocking |
| **Custom Chunker** | Uses a simple recursive text splitter instead of LangChain to avoid heavy dependency chains (tensorflow/transformers) |

---

## 📝 License

MIT
