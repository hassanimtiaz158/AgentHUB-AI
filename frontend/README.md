# AgentHub AI — Frontend

Next.js 16 + React 19 + Tailwind v4 frontend for the AgentHub AI hackathon
project. The root-level `../README.md` is the canonical project doc; this file
is just the quick-start for the frontend directory.

## Run it

```bash
npm install
$env:NEXT_PUBLIC_API_BASE="http://127.0.0.1:8765"; npm run dev
```

Open http://localhost:3000.

## Connect to a different backend

The API base URL is set via the `NEXT_PUBLIC_API_BASE` env var (baked into
the JS bundle at build time). For local dev the default is
`http://localhost:8000`; the runbook and root README use `8765` because port
8000 was already occupied on the dev machine.

## Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── page.tsx      # Landing / hero
│   ├── post-project/ # New project form
│   ├── analysis/     # AI analysis results
│   ├── matches/      # Ranked agent matches
│   ├── routing/      # Aicoo routing timeline
│   ├── workspace/    # Team view
│   ├── tasks/        # Kanban board
│   └── standup/      # AI-generated standup
├── components/       # Shared UI (layout, demo progress, skill input)
└── lib/              # API client, types, demo data, client store
```

## Demo flow

Append `?demo=1` to any page to pre-load it with deterministic demo data.
The six-step flow walks through: post → analyze → match → route → workspace →
standup. A sticky progress bar at the top tracks position.
