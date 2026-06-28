# AgentHub AI

> **Hackathon submission** — a complete MVP that takes a project brief to a
> staffed, routed, coordinated team of AI agents in 60 seconds. The Aicoo
> coordination layer handles task routing and shared context so no agent is
> ever in the dark.

AI-powered freelancer / agent coordination marketplace. A client posts a
project brief; AgentHub AI analyzes requirements, matches the right human or AI
agents, routes tasks through the Aicoo coordination layer, and keeps shared
project context available to the team.

```
┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌───────────┐
│  Client   │───▶│  FastAPI      │───▶│  Aicoo API   │───▶│  Agents   │
│  (Next.js)│    │  Backend      │    │  (or mock)   │    │  (human/AI)│
└──────────┘    └──────┬───────┘    └──────────────┘    └───────────┘
     ▲                │
     │                ▼
     │         ┌──────────────┐
     └─────────│  AI Analyzer  │
               │  (Groq/OAI/  │
               │   fallback)  │
               └──────────────┘
```

## Hackathon submission

The [DEVPOST.md](./DEVPOST.md) file contains the full Devpost submission
content (project name, summary, problem, solution, Aicoo usage, tech stack,
future improvements) plus a timed 2-minute demo script.

## Prerequisites

- **Python 3.11+**
- **Node.js 20+** (for the frontend)

---

## Local setup

### 1. Backend

```bash
cd backend

# Create & activate a virtual environment
python -m venv venv

# Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment (all keys optional for local dev)
cp .env.example .env
# Edit .env if you have API keys; the app works without them.

# Start the server
uvicorn app.main:app --host 127.0.0.1 --port 8765 --reload
```

Health check:

```bash
curl http://127.0.0.1:8765/health
# {"status":"ok","app":"AgentHub AI"}
```

### 2. Frontend

```bash
cd frontend

npm install

# Point at the backend (default port 8765 for local dev)
$env:NEXT_PUBLIC_API_BASE="http://127.0.0.1:8765"  # PowerShell
# export NEXT_PUBLIC_API_BASE=http://127.0.0.1:8765   # bash

npm run dev
```

Open **http://localhost:3000** — the sidebar shows a green dot when the
backend is connected, or an amber "Demo mode" dot when it isn't.

---

## Demo flow

Open **http://localhost:3000/post-project?demo=1** and click through the
six-step walkthrough. Each step auto-advances in demo mode and renders real
(mock-mode) data:

1. **Post project** — pre-filled brief
2. **Analysis** — AI-generated role & skill breakdown
3. **Matches** — ranked agent suggestions
4. **Routing** — Aicoo coordination layer
5. **Workspace** — team view with shared context
6. **Standup** — AI-generated progress summary

---

## API reference

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Liveness probe |
| POST | `/api/users` | Register a user |
| GET/POST | `/api/agents` | List / create agents |
| GET/POST | `/api/projects` | List / create projects |
| POST | `/api/projects/{id}/analyze` | AI analysis |
| POST | `/api/projects/{id}/match-agents` | Ranked agent matches |
| POST | `/api/projects/{id}/route-task` | Route a task to an agent |
| GET | `/api/projects/{id}/tasks` | List project tasks |
| POST | `/api/projects/{id}/context` | Add shared context |
| GET | `/api/projects/{id}/context` | List context (filter by `?agent_id=`) |
| GET | `/api/projects/{id}/standup-summary` | AI-generated standup |
| POST | `/api/projects/{id}/aicoo/route` | Aicoo routing (mock if no key) |

Interactive docs: `http://127.0.0.1:8765/docs` (Swagger)

---

## Aicoo API usage

AgentHub uses the **Aicoo** coordination layer to route tasks between agents.
It works in two modes:

### Real mode

Set `AICOO_API_KEY` in `backend/.env`. The backend calls
`https://www.aicoo.io/api/v1/chat` to get intelligent routing decisions.
If the API key is invalid or the network fails, the request automatically
degrades to mock mode — the app never crashes.

### Mock mode (default)

With no `AICOO_API_KEY`, all Aicoo endpoints return deterministic offline
responses. This is how the demo flow works — no API key or network access
required.

**Key guarantee:** the Aicoo integration is designed so that a missing or
misconfigured key never breaks the rest of the app. Real mode degrades to
mock on any network or auth failure, and mock mode always returns valid data.

---

## Deployment

### Backend → Render

The `backend/render.yaml` Blueprint defines the service. Deploy with one click
or via the Render CLI:

[![Deploy to Render](https://render.com/images/deploy-to-renderbutton.svg)](https://render.com/deploy)

**Manual steps:**

1. Push the repo to GitHub.
2. Create a new **Web Service** on Render, pointing at `backend/`.
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables:
   - `CORS_ORIGINS` — your Vercel URL (e.g. `https://agenthub-ai.vercel.app`)
   - `AICOO_API_KEY`, `OPENAI_API_KEY`, `GROQ_API_KEY`, `AI_API_KEY` — as needed
6. Render sets `PORT` automatically.

### Frontend → Vercel

1. Push the repo to GitHub.
2. Import the project on Vercel, pointing at `frontend/`.
3. Framework preset: **Next.js**
4. Set environment variable:
   - `NEXT_PUBLIC_API_BASE` — your Render backend URL (e.g.
     `https://agenthub-backend.onrender.com`)
5. Deploy.

> **Note:** `NEXT_PUBLIC_API_BASE` is injected at **build time** (the
> `NEXT_PUBLIC_` prefix means it's baked into the JS bundle). If you change
> the backend URL later, you must redeploy the frontend.

---

## Testing

```bash
# Backend pytest suite (81 tests)
cd backend
.\venv\Scripts\Activate.ps1    # or source venv/bin/activate
pytest tests -v

# Smoke test against a running backend
python scripts/smoke_test.py
# With custom port:
BASE_URL=http://127.0.0.1:8765 python scripts/smoke_test.py

# Frontend type-check + build
cd frontend
npm run build

# Full automated verification (boots backend, runs smoke test, checks CORS)
python scripts/verify_project.py
```

---

## Environment variables

### Backend (`backend/.env.example`)

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `8000` | Server listen port (Render overrides this) |
| `CORS_ORIGINS` | `http://localhost:3000,…` | Comma-separated allowed origins |
| `AICOO_API_KEY` | *(empty)* | Aicoo coordination-layer key (mock if unset) |
| `OPENAI_API_KEY` | *(empty)* | OpenAI key (fallback if Groq unavailable) |
| `GROQ_API_KEY` | *(empty)* | Groq key (preferred AI provider) |
| `AI_API_KEY` | *(empty)* | Generic AI provider key |
| `SUPABASE_URL` | *(empty)* | Supabase project URL (future) |
| `SUPABASE_SERVICE_ROLE_KEY` | *(empty)* | Supabase service role key (future) |
| `DATABASE_URL` | *(empty)* | Database connection URL (future) |

All keys are **optional for local development** — the app degrades gracefully:
- No AI keys → the analyzer uses a local rule-based engine.
- No Aicoo key → Aicoo endpoints return mock data.
- No Supabase → storage is in-memory.

### Frontend (`frontend/.env.example`)

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_API_BASE` | `http://localhost:8000` | Backend URL (baked into JS at build time) |

---

## Architecture notes

- **Storage**: in-memory dicts (`app/database.py`). Swap `_Table` for Supabase
  later without touching routes/services.
- **AI backends**: tried in order — Groq → OpenAI → local rule-based fallback.
  The fallback always answers, so the analyzer never crashes on a missing key.
- **Aicoo**: real mode (HTTP to `https://www.aicoo.io/api/v1/chat`) or mock
  mode (deterministic, offline). Real mode degrades to mock on any network
  failure so the rest of the app keeps working.
- **CORS**: explicit origins by default; `allow_credentials` is dropped
  automatically if `CORS_ORIGINS=*` is set.

## Project structure

```
AgentHUB-AI/
├── README.md              ← you are here
├── DEVPOST.md             ← Devpost submission + 2-min demo script
├── RUNBOOK.md             ← day-to-day dev commands
├── backend/
│   ├── app/               ← FastAPI application
│   │   ├── main.py        ← app factory, lifespan, CORS
│   │   ├── config.py      ← pydantic-settings (env-driven)
│   │   ├── database.py    ← in-memory storage seam (Supabase-ready)
│   │   ├── models/        ← pydantic schemas
│   │   ├── routes/        ← API routers
│   │   └── services/      ← business logic (analyzer, matcher, router, …)
│   ├── tests/             ← 81 pytest tests
│   ├── render.yaml        ← Render Blueprint
│   └── requirements.txt
├── frontend/
│   ├── src/app/           ← Next.js App Router pages
│   ├── src/components/    ← shared UI components
│   ├── src/lib/           ← API client, types, demo data, store
│   └── package.json
├── scripts/               ← smoke test + verification
└── specs/                 ← PRD, TDD, demo HTML
```
