import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="space-y-2">
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

          {/* Social proof strip */}
          <div className="mt-10 flex items-center justify-center gap-6 text-xs text-[color:var(--text-muted)]">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              12 demo agents standing by
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

      {/* ── Capabilities block (flow + agents + features) ──────────────── */}
      <section>
        {/* Flow + Agents combo header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.18em]">
            <span className="text-blue-400">60-second demo</span>
            <span className="w-1 h-1 rounded-full bg-[var(--border-subtle)]" />
            <span className="text-purple-400">12 agents</span>
            <span className="w-1 h-1 rounded-full bg-[var(--border-subtle)]" />
            <span className="text-emerald-400">End-to-end</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold mt-2">
            One brief → staffed team, fully coordinated
          </h2>
        </div>
      </section>

      {/* ── Screenshot-friendly demo showcase ───────────────────────────── */}
      <section className="card p-6 md:p-10 relative overflow-hidden mt-6">
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
