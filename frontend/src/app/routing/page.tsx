"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef } from "react";
import dynamic from "next/dynamic";
import { Card, Badge, LoadingState, Spinner } from "@/components/ui";
import { DemoProgress } from "@/components/DemoProgress";
import { aicooRoute, listAgents, matchAgents } from "@/lib/api";
import { demoAgents, buildDemoMatches } from "@/lib/demo-data";
import { DEMO_ROUTE_EVENTS } from "@/lib/demo-flow";
import { useProjectStore } from "@/lib/store";
import { useDemoPlayer } from "@/lib/demo-player";
import { useToast } from "@/components/Toast";
import type { Agent, MatchResult } from "@/lib/types";

const Topology3D = dynamic(() => import("@/components/Topology3D"), {
  ssr: false,
  loading: () => <LoadingState label="Loading 3D topology…" />,
});

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

const TONE_HEX: Record<string, string> = {
  purple: "#8b5cf6",
  blue: "#3b82f6",
  cyan: "#06b6d4",
  green: "#10b981",
  yellow: "#f59e0b",
  red: "#ef4444",
};

export default function RoutingPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; demo?: string }>;
}) {
  const store = useProjectStore();
  const { id, demo } = use(searchParams);
  const isDemo = !!demo;
  const projectId = id ?? store.project?.id ?? "demo";
  const player = useDemoPlayer();
  const toast = useToast();
  const isPlayingRef = useRef(player.isPlaying);
  isPlayingRef.current = player.isPlaying;

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
      // Demo mode: auto-play the routing timeline, pausable via the player.
      if (demo) {
        const waitResume = () =>
          new Promise<void>((resolve) => {
            // Poll until playing again (or component unmounts).
            const tick = () => {
              if (!active) return resolve();
              if (isPlayingRef.current) return resolve();
              setTimeout(tick, 100);
            };
            tick();
          });
        const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
        await delay(600);
        for (const ev of DEMO_ROUTE_EVENTS) {
          if (!active) return;
          if (!isPlayingRef.current) await waitResume();
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
        // After timeline completes, the DemoProvider auto-advances to workspace.
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
      toast.success(`Routed to ${name}`);
    } else if (res.error) {
      toast.error(res.error);
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
                const hex = TONE_HEX[tone] ?? TONE_HEX.purple;
                return (
                  <div
                    key={i}
                    className="px-3 py-2 rounded-lg border"
                    style={{
                      borderColor: `${hex}33`,
                      backgroundColor: `${hex}0D`,
                    }}
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
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold">Topology</div>
          <span className="text-[10px] text-[color:var(--text-muted)]">drag to rotate · scroll to zoom</span>
        </div>
        <Topology3D />
      </Card>
    </div>
  );
}

