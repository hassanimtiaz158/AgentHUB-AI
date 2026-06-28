# AgentHub AI — Runbook

> **Deploying?** See the [README → Deployment](README.md#deployment) section
> for Render + Vercel setup (one-click buttons, env vars, start commands).

## Quick start (two terminals)

### Terminal 1 — Backend (port 8765)

```bash
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --host 127.0.0.1 --port 8765 --reload
```

Health check: <http://127.0.0.1:8765/health>

### Terminal 2 — Frontend (port 3000)

```bash
cd frontend
$env:NEXT_PUBLIC_API_BASE="http://127.0.0.1:8765"; npm run dev
```

Open: <http://localhost:3000>

## Default ports

| Service | Port | Override env var |
|---------|------|------------------|
| Backend | 8765 | `PORT` |
| Frontend | 3000 | `NEXT_PUBLIC_API_BASE` (points at backend) |

> Note: port 8000 was already occupied on the dev machine (a different Python
> process). We use 8765 here. Any free port works — just update
> `NEXT_PUBLIC_API_BASE` to match.

## Running tests

```bash
# Backend pytest suite (81 tests)
cd backend
.\venv\Scripts\activate
pytest tests -v

# Smoke test against a running backend
python scripts/smoke_test.py
# or with a custom port:
BASE_URL=http://127.0.0.1:8765 python scripts/smoke_test.py

# Frontend type-check + build
cd frontend
npm run build

# Full project verification (boots backend, runs smoke test, checks CORS)
python scripts/verify_project.py
```

## Environment variables

Copy `backend/.env.example` to `backend/.env` and fill in as needed. All keys
are optional for local development — the app degrades gracefully:

- `AICOO_API_KEY` — if unset, Aicoo endpoints run in deterministic mock mode.
- `OPENAI_API_KEY` / `GROQ_API_KEY` / `AI_API_KEY` — if unset, the analyzer
  uses the local rule-based engine.
- `CORS_ORIGINS` — comma-separated list of allowed origins. Defaults to
  `http://localhost:3000,http://127.0.0.1:3000,...`.

## Demo flow

1. <http://localhost:3000/post-project?demo=1> — pre-filled brief
2. <http://localhost:3000/analysis?demo=1> — AI analysis
3. <http://localhost:3000/matches?demo=1> — ranked agents
4. <http://localhost:3000/routing?demo=1> — Aicoo coordination
5. <http://localhost:3000/workspace?demo=1> — team view
6. <http://localhost:3000/standup?demo=1> — AI-generated summary

## API summary

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

---

## Final verification checklist

Run these in order. Every step must pass before moving on.

### 1. Backend boots cleanly

```bash
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --host 127.0.0.1 --port 8765 --reload
```

Expected: no traceback, no deprecation warnings about `on_event`. Then:

```bash
curl http://127.0.0.1:8765/health
# -> {"status":"ok","app":"AgentHub AI"}
```

### 2. All required packages are installed

```bash
cd backend
.\venv\Scripts\activate
python -c "import fastapi, uvicorn, pydantic, httpx, pytest, dotenv; print('ok')"
```

Expected: `ok`.

### 3. Pytest suite passes

```bash
cd backend
.\venv\Scripts\activate
pytest tests -v
```

Expected: `81 passed` (as of this writing). Zero failures.

### 4. Every endpoint returns the expected status

```bash
cd backend
.\venv\Scripts\activate
python scripts/smoke_test.py
```

Expected: `All smoke tests passed.` — exercises health, users, agents, projects,
analyze, match, route, context, standup, and 404 paths.

### 5. CORS allows the frontend origin

```bash
# With backend running:
curl -I -X OPTIONS http://127.0.0.1:8765/health \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET"
```

Expected: `access-control-allow-origin: http://localhost:3000` and
`access-control-allow-credentials: true`.

A disallowed origin (`http://evil.example.com`) should get `400` on preflight.

### 6. Frontend builds and runs

```bash
cd frontend
$env:NEXT_PUBLIC_API_BASE="http://127.0.0.1:8765"; npm run dev
```

Expected: clean compile, no TypeScript errors. Open <http://localhost:3000> —
sidebar shows "Backend connected" (green dot) when the backend is running, or
"Demo mode" (amber dot) when it isn't.

### 7. Frontend nav routes resolve

Click every sidebar link. Each should land on a real page (no 404):

- `/` — home
- `/post-project` — new project form
- `/analysis` — analysis
- `/matches` — matched agents
- `/workspace` — team workspace
- `/tasks` — task board
- `/routing` — Aicoo routing
- `/standup` — AI COO standup

### 8. Demo flow end-to-end

Open <http://localhost:3000/post-project?demo=1> and click through all six steps.
Each step auto-advances in demo mode and renders real (mock-mode) data.

### 9. Responsive / no-overlap check

- Resize the browser to ~375px wide. The sidebar collapses to a top bar;
  content reflows into single-column grids. No horizontal scroll.
- The demo progress bar (`?demo=1`) stays within the viewport — no overflow
  past the right edge.

### 10. Full automated verification

```bash
python scripts/verify_project.py
```

Expected: `VERIFICATION PASSED — every check succeeded.`

---

If any step fails, the script's output names the failing check. Re-run the
relevant manual step above to see the raw error.
