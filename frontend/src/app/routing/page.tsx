"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, Badge, LoadingState, Spinner } from "@/components/ui";
import { DemoProgress } from "@/components/DemoProgress";
import { aicooRoute, listAgents, matchAgents } from "@/lib/api";
import { demoAgents, buildDemoMatches } from "@/lib/demo-data";
import { DEMO_ROUTE_EVENTS } from "@/lib/demo-flow";
import { useProjectStore } from "@/lib/store";
import type { Agent, MatchResult } from "@/lib/types";

interface RouteEvent {
  key?: string;
  project_id: string;
  routed_to: { agent?: string; mock?: boolean };
  routing_reason: string;
  status: string;
  mode: "mock" | "real";
  timestamp: string;
  tone?: string;
}

export default function RoutingPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; demo?: string }>;
}) {
  const router = useRouter();
  const store = useProjectStore();
  const { id, demo } = use(searchParams);
  const isDemo = !!demo;
  const projectId = id ?? store.project?.id ?? "demo";

  const [agents, setAgents] = useState<Agent[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [events, setEvents] = useState<RouteEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [routing, setRouting] = useState<Record<string, boolean>>({});
  const [context, setContext] = useState(store.project?.description ?? "");
  const [demoFallback, setDemoFallback] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const [agentRes, matchRes] = await Promise.all([
        listAgents(),
        matchAgents(projectId, 8),
      ]);
      if (!active) return;
      setAgents(agentRes.data ?? demoAgents);
      if (matchRes.data?.matches) {
        setMatches(matchRes.data.matches);
      } else if (matchRes.usingDemoFallback) {
        setDemoFallback(true);
        setMatches(buildDemoMatches().matches);
      }
      setLoading(false);
      // Demo mode: auto-play the routing timeline.
      if (demo) {
        const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
        await delay(600);
        for (const ev of DEMO_ROUTE_EVENTS) {
          if (!active) return;
          const agentName = ev.agent
            ? matchRes.data?.matches?.find((m) => m.agent_name === ev.agent)?.agent_name ?? ev.agent
            : undefined;
          setEvents((prev) => [
            {
              key: ev.key,
              project_id: projectId,
              routed_to: agentName ? { agent: agentName, mock: true } : {},
              routing_reason: ev.detail,
              status: "ok",
              mode: "mock",
              timestamp: new Date().toISOString(),
              tone: ev.tone,
            },
            ...prev,
          ]);
          await delay(900);
        }
        // After timeline completes, auto-advance to workspace (demo only).
        if (active) {
          await delay(800);
          router.push(`/workspace?demo=1&id=${projectId}`);
        }
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, demo]);

  async function routeTo(name: string) {
    setRouting((r) => ({ ...r, [name]: true }));
    const res = await aicooRoute(projectId, name, context, store.project?.required_skills ?? []);
    setRouting((r) => ({ ...r, [name]: false }));
    if (res.data) {
      setEvents((prev) => [
        {
          project_id: res.data!.project_id,
          routed_to: res.data!.routed_to ?? {},
          routing_reason: res.data!.routing_reason,
          status: res.data!.status,
          mode: res.data!.mode,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
  }

  if (loading) return <LoadingState label="Initializing Aicoo routing…" />;

  return (
    <div className="space-y-6">
      <DemoProgress demoParam={demo ?? null} />

      <div>
        <Link
          href={`/matches?id=${projectId}`}
          className="text-xs text-[color:var(--text-muted)] hover:text-[color:var(--text-secondary)]"
        >
          ← Back to matches
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-purple-400">
            Step 04
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold">Aicoo routing</h1>
          {isDemo && <Badge tone="purple">demo</Badge>}
          {demoFallback && !isDemo && <Badge tone="yellow">demo fallback</Badge>}
        </div>
        <p className="text-sm text-[color:var(--text-secondary)] mt-1">
          Route project requests to the right agent. Shared context stays
          scoped to the project and travels with every request.
        </p>
      </div>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-4">
        <Card>
          <div className="text-sm font-semibold mb-3">Send a request</div>
          <textarea
            className="input min-h-[80px] resize-y mb-3"
            placeholder="Project context (brief, goals, constraints)…"
            value={context}
            onChange={(e) => setContext(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {matches.slice(0, 6).map((m) => (
              <button
                key={m.agent_id}
                onClick={() => routeTo(m.agent_name)}
                className="btn-ghost px-3 py-1.5 rounded-lg text-xs inline-flex items-center gap-2"
              >
                {routing[m.agent_name] ? <Spinner className="w-3 h-3" /> : null}
                Route to {m.agent_name}
              </button>
            ))}
          </div>
        </Card>
        <Card>
          <div className="text-sm font-semibold mb-3">Live event log</div>
          {events.length === 0 ? (
            <div className="text-xs text-[color:var(--text-muted)]">
              No routing events yet. Send a request to get started.
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {events.map((e, i) => {
                const tone = e.tone ?? "purple";
                const agentLabel = e.routed_to.agent
                  ? `→ ${e.routed_to.agent}`
                  : e.key === "ctx"
                  ? "Context store"
                  : e.key === "workspace"
                  ? "Workspace"
                  : "Routed";
                return (
                  <div
                    key={i}
                    className={`px-3 py-2 rounded-lg border border-${tone}-500/20 bg-${tone}-500/5`}
                    style={{ borderColor: `rgba(var(--${tone}-500-rgb, 139 92 246), 0.2)` }}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium">{agentLabel}</span>
                      <Badge tone={e.mode === "real" ? "green" : "yellow"}>{e.mode}</Badge>
                    </div>
                    <div className="text-xs text-[color:var(--text-secondary)]">
                      {e.routing_reason}
                    </div>
                    <div className="text-[10px] text-[color:var(--text-muted)] mt-1">
                      {new Date(e.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <div className="text-sm font-semibold mb-3">Topology</div>
        <TopologyVisualization
          projectName={store.project?.title ?? "Demo project"}
          matches={matches.slice(0, 6)}
        />
      </Card>
    </div>
  );
}

function TopologyVisualization({
  projectName,
  matches,
}: {
  projectName: string;
  matches: MatchResult[];
}) {
  const nodeRadius = 22;
  const hubRadius = 36;
  const svgWidth = 520;
  const svgHeight = 300;
  const cx = svgWidth / 2;
  const cy = svgHeight / 2;

  const positions = matches.map((_, i) => {
    const angle = (i / matches.length) * Math.PI * 2 - Math.PI / 2;
    const r = 110;
    return {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    };
  });

  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[color:var(--bg-elevated)]/40 p-4">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto max-h-[300px]"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="hubGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Connection lines */}
        {matches.map((m, i) => {
          const p = positions[i];
          return (
            <line
              key={`line-${m.agent_id}`}
              x1={cx}
              y1={cy}
              x2={p.x}
              y2={p.y}
              stroke="url(#lineGrad)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              opacity={0.6}
            >
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="-16"
                dur="2s"
                repeatCount="indefinite"
              />
            </line>
          );
        })}

        {/* Hub */}
        <circle cx={cx} cy={cy} r={hubRadius} fill="url(#hubGrad)" opacity={0.9} />
        <circle cx={cx} cy={cy} r={hubRadius} fill="none" stroke="#a78bfa" strokeWidth={1} opacity={0.5} />
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          fontSize={11}
          fontWeight={700}
        >
          Aicoo
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          dominantBaseline="central"
          fill="rgba(255,255,255,0.7)"
          fontSize={8}
        >
          hub
        </text>

        {/* Agent nodes */}
        {matches.map((m, i) => {
          const p = positions[i];
          const color =
            m.match_score >= 80
              ? "#10b981"
              : m.match_score >= 50
              ? "#f59e0b"
              : "#6366f1";
          return (
            <g key={m.agent_id}>
              <circle
                cx={p.x}
                cy={p.y}
                r={nodeRadius}
                fill={color}
                fillOpacity={0.15}
                stroke={color}
                strokeWidth={1.5}
              />
              <text
                x={p.x}
                y={p.y - 2}
                textAnchor="middle"
                dominantBaseline="central"
                fill="white"
                fontSize={9}
                fontWeight={600}
              >
                {m.agent_name.split(" ")[0]}
              </text>
              <text
                x={p.x}
                y={p.y + 10}
                textAnchor="middle"
                dominantBaseline="central"
                fill="rgba(255,255,255,0.6)"
                fontSize={7}
              >
                {m.match_score}%
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[color:var(--text-secondary)]">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-500 to-blue-500" />
          <span>{projectName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500/40 border border-emerald-500" />
          <span>High match</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500/40 border border-amber-500" />
          <span>Medium match</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-400" />
          <span>Aicoo route</span>
        </div>
      </div>
    </div>
  );
}
