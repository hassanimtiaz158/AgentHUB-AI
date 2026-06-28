# AgentHub AI

> **Coordinate an AI team in seconds, not weeks.**

AgentHub AI is a full-stack demo for multi-agent project coordination.
Post a project brief and the system **analyzes** it, **assembles** the right
team of AI agents, **routes** every task through the **Aicoo** coordination
layer, manages a live **task board**, and keeps the team aligned with an
**AI-generated standup**.

It works **end-to-end, offline**, with a demo-data fallback behind every API
call — so the full flow runs with no backend, no API keys, and no signup.
Point it at a FastAPI backend and it switches to live data automatically.

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

---

## Try the demo (no setup)

Every page supports a `?demo=1` flag that pre-fills realistic data and walks the
full flow.

1. **Post project** → submit a brief (or use the pre-filled demo one)
2. **AI analysis** → detected roles, difficulty, recommended skills, estimated timeline
3. **Find agents** → ranked candidates with 0–100 scores and plain-English reasons
4. **Aicoo routing** → route tasks through the coordination layer and watch an event log
5. **Team workspace** → see the assembled team, skills, and availability
6. **AI COO standup** → summary, blockers, next steps

> **Standalone mode:** the frontend never breaks if the backend is unreachable.
> Each response carries a `usingDemoFallback` flag, so a small `demo fallback`
> badge appears instead of a crash.

---

## What makes it different

- **Transparent agent matching** — scores are split into role (40), skill overlap
  (40), and availability (20), with a readable `reason` string per match.
- **AI-estimated project cost** — anchored to *your* budget, deadline, and team
  size, not one-size-fits-all. Surfaces a clear `budget_exceeded` warning when the
  estimate is over the declared budget.
- **Live task board → accurate standups.** Task state (Todo / In Progress / Done)
  syncs to the global store, so blockers and next steps always reflect reality.
- **Swap-friendly backend** — an in-memory storage layer is the only thing
  standing between this demo and a production database. Add Supabase and you're
  done.

---

## Tech stack

| Layer     | Technology                                                                  |
|---------|-----------------------------------------------------------------------------|
| Frontend | **Next.js 16** · React 19 · Tailwind CSS 4 · TypeScript · Three.js (3D topology) |
| Backend  | **FastAPI** (Pydantic v2) · uvicorn · Python 3                              |
| AI / LLM | Groq / OpenAI (optional) · local rule-based analyzer fallback                |
| Future   | Supabase, LangChain, LangGraph, Aicoo coordination layer                    |

---

## Project structure

```
AgentHUB-AI/
├── README.md                ← you are here
├── DEVPOST.md               ← Devpost submission + 2-min demo script
├── RUNBOOK.md               ← day-to-day dev commands
├── backend/
│   ├── app/
│   │   ├── main.py          # App factory + CORS + demo-agent seeding
│   │   ├── config.py        # Settings (pydantic-settings)
│   │   ├── database.py      # In-memory _Table seam (swap → Supabase)
│   │   ├── models/          # Pydantic request/response models
│   │   ├── routes/          # users, agents, projects, aicoo
│   │   └── services/
│   │       ├── analyzer.py          # Rule-based role + difficulty + task breakdown
│   │       ├── ai_analyzer.py       # LLM-backed analyzer (Groq/OpenAI) with fallback
│   │       ├── matching_service.py  # 0–100 scoring with reasons
│   │       ├── router.py            # Task routing
│   │       ├── standup.py           # Summary / blockers / next steps
│   │       └── context_store.py     # Shared context across agents
│   ├── tests/               # pytest suite
│   ├── render.yaml          # Render Blueprint
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/             # Route pages (one per demo step)
│   │   │   ├── post-project/  # Step 01 — submit brief
│   │   │   ├── analysis/      # Step 02 — AI analysis (roles, cost, agents)
│   │   │   ├── matches/       # Step 03 — ranked agent matches
│   │   │   ├── routing/       # Step 04 — Aicoo routing event log
│   │   │   ├── workspace/     # Step 05 — team overview
│   │   │   ├── standup/       # Step 06 — AI COO standup
│   │   │   ├── tasks/         # Task board (progress tracker + delete)
│   │   │   ├── dashboard/     # Saved projects
│   │   │   └── page.tsx       # Landing page
│   │   ├── lib/
│   │   │   ├── api.ts         # Typed API client + demo fallback
│   │   │   ├── analysis-engine.ts  # Role inference + cost + best-agent selection
│   │   │   ├── store.tsx      # Global localStorage-backed state
│   │   │   ├── demo-data.ts    # Static demo pool
│   │   │   └── ...
│   │   └── components/        # Shared UI
│   └── package.json
└── scripts/                 # smoke test + verification
```

---

## Local development

### Prerequisites

- **Python 3.11+** (backend)
- **Node.js 20+** and **npm** (frontend)

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows PowerShell: venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env              # optional — see "Environment variables" below
uvicorn app.main:app --host 127.0.0.1 --port 8765 --reload
```

Backend is live at **`http://127.0.0.1:8765`**.

```bash
# Health check
curl http://127.0.0.1:8765/health
# {"status":"ok","app":"AgentHub AI"}
```

Interactive API docs: **`http://127.0.0.1:8765/docs`** (Swagger).

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **`http://localhost:3000`**. The sidebar shows a green dot when the backend
is connected, or an amber **Demo mode** dot when it isn't.

> Point the frontend at the backend by setting `NEXT_PUBLIC_API_BASE`
> (defaults to `http://127.0.0.1:8765` in `.env.example`). The `NEXT_PUBLIC_`
> prefix bakes the value into the client JS at build time.

---

## Demo flow

Open **`http://localhost:3000/post-project?demo=1`** and click through the
six-step walkthrough. Each step renders real (mock-mode) data:

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
| `GET` | `/health` | Liveness probe |
| `POST` | `/api/users` | Register a user |
| `GET` / `POST` | `/api/agents` | List / create agents |
| `GET` / `POST` | `/api/projects` | List / create projects |
| `POST` | `/api/projects/{id}/analyze` | AI analysis (roles, difficulty, timeline, skills) |
| `POST` | `/api/projects/{id}/match-agents` | Ranked 0–100 agent matches (`?max_agents=5`) |
| `POST` | `/api/projects/{id}/route-task` | Route a task to an agent |
| `GET` | `/api/projects/{id}/tasks` | List project tasks |
| `POST` | `/api/projects/{id}/context` | Add shared context |
| `GET` | `/api/projects/{id}/context` | List context (filter by `?agent_id=`) |
| `GET` | `/api/projects/{id}/standup-summary` | AI-generated standup |
| `POST` | `/api/projects/{id}/aicoo/route` | Aicoo routing (mock if no key) |

### Agent matching score breakdown

Each match total is out of 100:

- **Role match — 40 pts**: exact role hit = 40, partial keyword fit = 10, none = 0.
- **Skill overlap — 40 pts**: `matched / required` skills × 40; falls back to the
  Jaccard coefficient over recommended skills when none are declared.
- **Availability — 20 pts**: `available` = 20, `busy` = 0.

Every result carries a `reason` string so the UI can explain *why* an agent was
surfaced.

---

## Aicoo API usage

AgentHub uses the **Aicoo** coordination layer to route tasks between agents.
It works in two modes:

### Real mode

Set `AICOO_API_KEY` in `backend/.env`. The backend calls
`https://www.aicoo.io/api/v1/chat` for intelligent routing decisions.
If the key is invalid or the network fails, the request **automatically degrades
to mock mode** — the app never crashes.

### Mock mode (default)

With no `AICOO_API_KEY`, all Aicoo endpoints return deterministic offline
responses. This is how the demo flow works — no API key or network access
required.

**Key guarantee:** a missing or misconfigured key never breaks the rest of the
app. Real mode degrades to mock on any network or auth failure, and mock mode
always returns valid data.

---

## Environment variables

All AI / provider keys are **optional** — missing keys fall back to a
rule-based engine so the app always responds.

### Backend — `backend/.env`

| Variable | Default | Purpose | Required? |
|----------|---------|---------|-----------|
| `PORT` | `8000` | Server port (Render sets this automatically) | No |
| `CORS_ORIGINS` | `http://localhost:3000,…` | Comma-separated allowed origins | No |
| `OPENAI_API_KEY` | *(empty)* | OpenAI-backed analysis | No (rule-based fallback) |
| `GROQ_API_KEY` | *(empty)* | Groq-backed analysis (preferred) | No (rule-based fallback) |
| `AI_API_KEY` | *(empty)* | Generic AI provider key | No |
| `AICOO_API_KEY` | *(empty)* | Real Aicoo routing | No (mock mode when empty) |
| `SUPABASE_URL` | *(empty)* | Future persistence | No |
| `SUPABASE_SERVICE_ROLE_KEY` | *(empty)* | Future persistence | No |
| `DATABASE_URL` | *(empty)* | Future persistence | No |

### Frontend — `frontend/.env.local`

| Variable | Default | Purpose | Required? |
|----------|---------|---------|-----------|
| `NEXT_PUBLIC_API_BASE` | `http://127.0.0.1:8765` | Backend URL (baked into the JS at build time) | No |

---

## Deployment (Vercel + Render)

The repo is a monorepo. Deploy the frontend to **Vercel** and the backend to
**Render**, then wire them together with two env vars.

### Backend → Render (Web Service)

The `backend/render.yaml` Blueprint defines the service. One-click deploy:

[![Deploy to Render](https://render.com/images/deploy-to-renderbutton.svg)](https://render.com/deploy)

**Manual steps:**

1. Push the repo to GitHub.
2. **New → Web Service** on Render → connect the repo.
3. **Root Directory**: `backend`
4. **Build Command**: `pip install -r requirements.txt`
5. **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Env vars (Render dashboard):
   - `CORS_ORIGINS` → your live Vercel URL, e.g. `https://your-app.vercel.app`
     (no trailing slash; add comma-separated localhost entries for dev).
   - Optional AI keys for real analysis: `OPENAI_API_KEY`, `GROQ_API_KEY`, `AI_API_KEY`.
   - Optional `AICOO_API_KEY` — without it, Aicoo runs in mock mode.
7. Render sets `PORT` automatically. Note the URL:
   `https://<service-name>.onrender.com`.

### Frontend → Vercel

1. Push the repo to GitHub.
2. **New Project** on Vercel → import the repo.
3. Vercel auto-detects Next.js. If it picks the wrong folder, set
   **Root Directory** = `frontend` (Project Settings → General).
4. Add an env var (Settings → Environment Variables):
   - `NEXT_PUBLIC_API_BASE` → `https://<your-render-service>.onrender.com`
5. Deploy.

> `NEXT_PUBLIC_API_BASE` is injected at **build time** (the `NEXT_PUBLIC_`
> prefix bakes it into the JS bundle). If you change the backend URL later,
> you must redeploy the frontend.

### Wire them together

- Render's `CORS_ORIGINS` must include the real Vercel origin (exact URL).
- Check the connection: in the browser devtools Network tab on the analysis page,
  API calls should hit the Render URL. If you see a `demo fallback` banner when you
  expected live data, re-check `NEXT_PUBLIC_API_BASE` and `CORS_ORIGINS`.

### Deployment gotchas

- **Render free tier** sleeps after 15 min of inactivity — the first request after
  a wake-up is slow (~30 s). Use a paid plan or a ping service to keep it warm.
- **Wildcard CORS**: using `*` drops credentials automatically, so the server still
  boots in open environments. For a live frontend, pin the exact Vercel origin.
- **Storage resets on every Render deploy/restart** — the backend uses in-memory
  storage. Fine to demo; swap in `app/database.py` → Supabase when you want
  persistence (the dependencies are already in `requirements.txt`).

---

## Testing

```bash
# Backend pytest suite
cd backend
source venv/bin/activate          # Windows PowerShell: venv\Scripts\Activate.ps1
pytest tests -v

# Smoke test against a running backend
python scripts/smoke_test.py
BASE_URL=http://127.0.0.1:8765 python scripts/smoke_test.py

# Frontend type-check + build
cd frontend
npm run build

# Full automated verification (boots backend, runs smoke test, checks CORS)
python scripts/verify_project.py
```

---

## Architecture notes

- **Storage**: in-memory dicts (`app/database.py`). The `_Table` seam is
  intentionally small — swap it for Supabase without touching routes/services.
- **AI backends**: tried in order — Groq → OpenAI → local rule-based fallback.
  The fallback always answers, so the analyzer never crashes on a missing key.
- **Aicoo**: real mode (HTTP to `https://www.aicoo.io/api/v1/chat`) or mock mode
  (deterministic, offline). Real mode degrades to mock on any network failure.
- **CORS**: explicit origins by default; `allow_credentials` is dropped
  automatically if `CORS_ORIGINS=*` is set.

---

## Roadmap / where this goes next

- [ ] Persist data with Supabase (seam is already built).
- [ ] Real LLM-generated analysis and standups (keys in, rule-engine out).
- [ ] Live Aicoo routing (`AICOO_API_KEY`).
- [ ] Agent-to-agent messaging UI.
- [ ] Auth and per-tenant project isolation.

---

## License & attribution

Built for the AgentHub AI hackathon · Powered by [Aicoo](https://www.aicoo.io) · 2026
