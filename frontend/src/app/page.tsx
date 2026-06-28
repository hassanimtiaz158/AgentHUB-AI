import Link from "next/link";
import { Card, StaggerItem } from "@/components/ui";

const FEATURES = [
  {
    title: "AI project analysis",
    description:
      "Describe your project and the analyzer infers required roles, difficulty, recommended skills, and a task breakdown.",
    gradient: "from-purple-500/30 to-purple-500/0",
  },
  {
    title: "Smart agent matching",
    description:
      "Match by role, skills, and availability. Each result is scored 0–100 with a clear, human-readable reason.",
    gradient: "from-blue-500/30 to-blue-500/0",
  },
  {
    title: "Aicoo routing",
    description:
      "Coordinate multi-agent work through the Aicoo layer: route tasks, share context, and track every handoff live.",
    gradient: "from-cyan-500/30 to-cyan-500/0",
  },
  {
    title: "Task board",
    description:
      "Kanban-style tracking across Todo, In Progress, and Done — auto-routed to the right agent.",
    gradient: "from-emerald-500/30 to-emerald-500/0",
  },
  {
    title: "Team workspace",
    description:
      "See the full assembled team, their skills, and availability in one glance before kickoff.",
    gradient: "from-amber-500/30 to-amber-500/0",
  },
  {
    title: "AI standups",
    description:
      "Generate daily summaries, surface blockers, and surface next steps — straight from task state.",
    gradient: "from-pink-500/30 to-pink-500/0",
  },
];

const DEMO_AGENTS = [
  { name: "Frontend Agent", skills: ["React", "TypeScript", "Tailwind CSS"] },
  { name: "Backend Agent", skills: ["Python", "FastAPI", "PostgreSQL"] },
  { name: "AI/ML Agent", skills: ["PyTorch", "LLM", "NLP"] },
  { name: "UI/UX Agent", skills: ["Figma", "User Research"] },
  { name: "QA Agent", skills: ["Cypress", "Playwright"] },
  { name: "DevOps Agent", skills: ["Docker", "Kubernetes", "AWS"] },
  { name: "Marketing Agent", skills: ["SEO", "Content", "Ads"] },
  { name: "Project Manager", skills: ["Scrum", "Roadmapping"] },
];

const AGENT_COLORS = [
  "bg-purple-500/20 text-purple-300",
  "bg-blue-500/20 text-blue-300",
  "bg-cyan-500/20 text-cyan-300",
  "bg-pink-500/20 text-pink-300",
  "bg-emerald-500/20 text-emerald-300",
  "bg-amber-500/20 text-amber-300",
  "bg-red-500/20 text-red-300",
  "bg-violet-500/20 text-violet-300",
];

const DEMO_FLOW = [
  { n: "01", label: "Post project", to: "/post-project?demo=1" },
  { n: "02", label: "AI analysis", to: "/analysis?demo=1" },
  { n: "03", label: "Find agents", to: "/matches?demo=1" },
  { n: "04", label: "Aicoo routing", to: "/routing?demo=1" },
  { n: "05", label: "Team workspace", to: "/workspace?demo=1" },
  { n: "06", label: "AI standup", to: "/standup?demo=1" },
];

export default function LandingPage() {
  return (
    <div className="space-y-24">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative text-center pt-14 pb-6">
        {/* Animated glow ring behind the headline */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[600px] h-[600px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.22),transparent_65%)] pointer-events-none" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            Multi-agent project coordination
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05]">
            Coordinate an AI team
            <br />
            <span className="gradient-text">in seconds, not weeks.</span>
          </h1>

          <p className="text-[color:var(--text-secondary)] max-w-2xl mx-auto mt-6 text-lg md:text-xl leading-relaxed">
            AgentHub AI reads your project brief, assembles the right agents,
            routes every task through the{" "}
            <span className="text-cyan-300 font-medium">Aicoo coordination layer</span>,
            and keeps the whole team aligned with AI-generated standups.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-10">
            <Link
              href="/post-project?demo=1"
              className="btn-primary px-7 py-3.5 rounded-lg text-sm font-medium inline-flex items-center justify-center gap-2"
            >
              Run full demo
              <ArrowIcon />
            </Link>
            <Link
              href="/post-project"
              className="btn-ghost px-7 py-3.5 rounded-lg text-sm font-medium inline-flex items-center justify-center"
            >
              Post a project
            </Link>
            <Link
              href="/routing?demo=1"
              className="btn-ghost px-7 py-3.5 rounded-lg text-sm font-medium inline-flex items-center justify-center"
            >
              See Aicoo routing
            </Link>
          </div>

          {/* Social proof strip */}
          <div className="mt-10 flex items-center justify-center gap-6 text-xs text-[color:var(--text-muted)]">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              8 demo agents standing by
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">60-second walkthrough</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">No signup to try</span>
          </div>
        </div>
      </section>

      {/* ── Powered by Aicoo ───────────────────────────────────────────── */}
      <section className="card p-6 md:p-10 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/0 blur-3xl pointer-events-none" />
        <div className="relative grid md:grid-cols-[1fr_auto] gap-8 items-center">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-400 mb-3">
              Powered by Aicoo
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold mb-3">
              The coordination layer for multi-agent teams
            </h2>
            <p className="text-[color:var(--text-secondary)] leading-relaxed mb-4">
              Aicoo is the routing engine inside AgentHub AI. When a task needs
              to move between agents — frontend to backend, ML to QA, any
              combination — Aicoo decides who receives it, records the handoff,
              and keeps shared context available to every team member.
            </p>
            <ul className="space-y-2 text-sm text-[color:var(--text-secondary)]">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">▸</span>
                Deterministic routing with full audit trail
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">▸</span>
                Shared context store — agents only see what they should
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">▸</span>
                Runs offline in mock mode; flip a key to go live
              </li>
            </ul>
          </div>
          <div className="hidden md:flex flex-col items-center gap-3 shrink-0">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-blue-500/10 border border-cyan-500/30 flex items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth={1.5}>
                <circle cx="6" cy="19" r="2" />
                <circle cx="18" cy="5" r="2" />
                <path d="M8 19h6a4 4 0 0 0 4-4V8" strokeLinecap="round" />
              </svg>
            </div>
            <div className="text-[10px] uppercase tracking-wider text-cyan-400/70">
              Aicoo v1
            </div>
          </div>
        </div>
      </section>

      {/* ── Six-step demo strip ─────────────────────────────────────────── */}
      <section>
        <div className="text-center mb-6">
          <div className="text-[11px] uppercase tracking-[0.18em] text-blue-400 mb-2">
            60-second demo flow
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold">
            From brief to staffed team, six taps
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {DEMO_FLOW.map((s, i) => (
            <StaggerItem key={s.n} index={i}>
              <Link
                href={s.to}
                className="card card-interactive p-4 relative overflow-hidden h-full"
              >
                <div
                  className={`absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br ${FEATURES[i % FEATURES.length].gradient} blur-2xl opacity-50 pointer-events-none`}
                />
                <div className="text-2xl font-semibold gradient-text mb-1 relative">
                  {s.n}
                </div>
                <div className="text-sm font-medium relative">{s.label}</div>
                <div className="text-[10px] text-[color:var(--text-muted)] mt-0.5 relative">
                  Tap to jump
                </div>
              </Link>
            </StaggerItem>
          ))}
        </div>
      </section>

      {/* ── Demo agent strip ────────────────────────────────────────────── */}
      <section>
        <div className="text-center mb-6">
          <div className="text-[11px] uppercase tracking-[0.18em] text-purple-400 mb-2">
            8 demo agents standing by
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold">
            The whole studio in one workspace
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {DEMO_AGENTS.map((a, i) => (
            <StaggerItem key={a.name} index={i}>
            <div
              className="card card-interactive p-4 h-full"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold ${AGENT_COLORS[i % AGENT_COLORS.length]}`}
                >
                  {a.name.split(" ")[0][0]}
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                  available
                </span>
              </div>
              <div className="text-sm font-medium mb-2">{a.name}</div>
              <div className="flex flex-wrap gap-1">
                {a.skills.map((s) => (
                  <span
                    key={s}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-[var(--border-subtle)] text-[color:var(--text-secondary)]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
            </StaggerItem>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section>
        <div className="text-center mb-10">
          <div className="text-[11px] uppercase tracking-[0.18em] text-purple-400 mb-2">
            End-to-end
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold">
            Everything a team lead needs
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <StaggerItem key={f.title} index={i}>
            <div className="card card-interactive p-5 relative overflow-hidden group h-full">
              <div
                className={`absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br ${f.gradient} blur-2xl opacity-60 group-hover:opacity-90 transition-opacity pointer-events-none`}
              />
              <h3 className="font-semibold mb-2 relative">{f.title}</h3>
              <p className="text-sm text-[color:var(--text-secondary)] relative">
                {f.description}
              </p>
            </div>
            </StaggerItem>
          ))}
        </div>
      </section>

      {/* ── Screenshot-friendly demo showcase ───────────────────────────── */}
      <section className="card p-6 md:p-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
        <div className="relative">
          <div className="text-center mb-8">
            <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-400 mb-2">
              Screenshot-ready demo
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold mb-2">
              See it in 60 seconds
            </h2>
            <p className="text-sm text-[color:var(--text-secondary)] max-w-xl mx-auto">
              Every screen is pre-loaded with realistic data. Click any step
              above, or run the full demo to walk the entire flow.
            </p>
          </div>

          {/* Mock browser frame */}
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[color:var(--bg-elevated)] overflow-hidden shadow-2xl shadow-purple-500/5">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-subtle)] bg-[color:var(--bg-base)]/60">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/60" />
                <span className="w-3 h-3 rounded-full bg-amber-500/60" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/60" />
              </div>
              <div className="flex-1 mx-4 px-3 py-1 rounded-md bg-white/5 text-xs text-[color:var(--text-muted)] font-mono">
                agenthub.ai/routing?demo=1
              </div>
            </div>
            {/* Mock content */}
            <div className="p-6 md:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Aicoo Routing — Analytics Platform</div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/25">
                  4 agents routed
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="card p-3">
                  <div className="text-[10px] uppercase tracking-wider text-purple-400 mb-1">Frontend</div>
                  <div className="text-xs text-[color:var(--text-secondary)]">Dashboard layout & charts</div>
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Routed
                  </div>
                </div>
                <div className="card p-3">
                  <div className="text-[10px] uppercase tracking-wider text-blue-400 mb-1">Backend</div>
                  <div className="text-xs text-[color:var(--text-secondary)]">Persistence & predictions API</div>
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Routed
                  </div>
                </div>
                <div className="card p-3">
                  <div className="text-[10px] uppercase tracking-wider text-cyan-400 mb-1">AI/ML</div>
                  <div className="text-xs text-[color:var(--text-secondary)]">Weekly inference model</div>
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Routed
                  </div>
                </div>
              </div>
              <div className="card p-3 border-cyan-500/20 bg-cyan-500/5">
                <div className="text-[10px] uppercase tracking-wider text-cyan-400 mb-1">Standup</div>
                <div className="text-xs text-[color:var(--text-secondary)]">
                  3 tasks in progress · 1 blocker (QA waiting on API) · Next: ship dashboard by Friday
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link
              href="/post-project?demo=1"
              className="btn-primary px-6 py-3 rounded-lg text-sm font-medium inline-flex items-center gap-2"
            >
              Run full demo
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Walk-through flow ───────────────────────────────────────────── */}
      <section className="card p-6 md:p-10">
        <div className="text-center mb-8">
          <div className="text-[11px] uppercase tracking-[0.18em] text-blue-400 mb-2">
            Walk-through
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold">
            Six screens, one minute
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              n: "01",
              t: "Post Project",
              b: "Submit title, description, skills, budget, deadline. The demo flag pre-fills a ready-made brief.",
            },
            {
              n: "02",
              t: "AI Analysis",
              b: "Get detected roles, difficulty, recommended skills, and a task breakdown with estimated timeline.",
            },
            {
              n: "03",
              t: "Find Agents",
              b: "Ranked candidates with 0–100 scores and plain-English reasons for every match.",
            },
            {
              n: "04",
              t: "Aicoo Routing",
              b: "Live event log and topology: route each task through the coordination layer.",
            },
            {
              n: "05",
              t: "Team Workspace",
              b: "See the assembled team, shared skills, and availability in one glance.",
            },
            {
              n: "06",
              t: "AI COO Standup",
              b: "Summary, blockers, next steps — auto-generated from task state.",
            },
          ].map((s) => (
            <div key={s.n} className="card p-5 relative">
              <div className="text-4xl font-semibold gradient-text mb-2">{s.n}</div>
              <h3 className="font-semibold mb-1">{s.t}</h3>
              <p className="text-sm text-[color:var(--text-secondary)]">{s.b}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link
            href="/post-project?demo=1"
            className="btn-primary px-6 py-3 rounded-lg text-sm font-medium inline-flex items-center gap-2"
          >
            Run full demo
            <ArrowIcon />
          </Link>
        </div>
      </section>

      <footer className="border-t border-[var(--border-subtle)] pt-8 pb-12 text-center text-xs text-[color:var(--text-muted)]">
        Built for the AgentHub AI hackathon · Powered by Aicoo · 2026
      </footer>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
