"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, EmptyState, LoadingState, Spinner, Badge, ScoreRing } from "@/components/ui";
import { DemoProgress } from "@/components/DemoProgress";
import { listAgents, matchAgents } from "@/lib/api";
import { demoAgents } from "@/lib/demo-data";
import { useProjectStore } from "@/lib/store";
import { useDemoPlayer } from "@/lib/demo-player";
import type { Agent, MatchResult } from "@/lib/types";

export default function WorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; demo?: string }>;
}) {
  const router = useRouter();
  const store = useProjectStore();
  const { id, demo } = use(searchParams);
  const isDemo = !!demo;
  const projectId = id ?? store.project?.id ?? "demo";
  const player = useDemoPlayer();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [routingId, setRoutingId] = useState<string | null>(null);
  const [demoFallback, setDemoFallback] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const [agentRes, matchRes] = await Promise.all([
        listAgents({ available: true }),
        matchAgents(projectId, 8),
      ]);
      if (!active) return;
      setAgents(agentRes.data ?? demoAgents);
      if (matchRes.data?.matches) {
        setMatches(matchRes.data.matches);
      } else if (matchRes.usingDemoFallback) {
        setDemoFallback(true);
      }
      setLoading(false);
      // In demo mode, the DemoProvider auto-advances to standup.
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  if (loading) return <LoadingState label="Loading workspace…" />;

  const team = matches.length
    ? matches
    : agents.slice(0, 4).map((a) => ({
        agent_id: a.id,
        agent_name: a.agent_name,
        agent_role: a.agent_role,
        skills: a.skills,
        match_score: 0,
        reason: "team member",
        availability: a.availability,
      }));

  return (
    <div className="space-y-6">
      <DemoProgress demoParam={demo ?? null} />

      <div>
        <Link
          href={`/routing?id=${projectId}`}
          className="text-xs text-[color:var(--text-muted)] hover:text-[color:var(--text-secondary)]"
        >
          ← Back to routing
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-purple-400">
            Step 05
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold">Team workspace</h1>
          {isDemo && <Badge tone="purple">demo</Badge>}
          {demoFallback && !isDemo && <Badge tone="yellow">demo fallback</Badge>}
        </div>
        <p className="text-sm text-[color:var(--text-secondary)] mt-1">
          Your assembled team, their skills, and availability.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {team.map((m) => (
          <Card key={m.agent_id} className="gradient-border p-5">
            <div className="flex items-start gap-3">
              <ScoreRing score={m.match_score} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{m.agent_name}</div>
                <div className="text-xs text-[color:var(--text-secondary)]">
                  {m.agent_role}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {m.skills.slice(0, 4).map((s) => (
                    <Badge key={s} tone="blue">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full border ${
                  m.availability === "available"
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/25"
                    : "bg-red-500/15 text-red-300 border-red-500/25"
                }`}
              >
                {m.availability}
              </span>
            </div>
            {m.reason && (
              <div className="mt-3 text-xs text-[color:var(--text-muted)]">{m.reason}</div>
            )}
            <div className="mt-4 flex gap-2">
              <Link
                href={`/routing?demo=1&id=${projectId}`}
                className="btn-ghost px-3 py-1.5 rounded-md text-xs inline-flex items-center gap-1"
              >
                Send brief
              </Link>
              <Link
                href={`/tasks?demo=1&id=${projectId}`}
                className="btn-ghost px-3 py-1.5 rounded-md text-xs inline-flex items-center gap-1"
              >
                Assign task
              </Link>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <h3 className="font-semibold mb-3">Team context</h3>
        <p className="text-sm text-[color:var(--text-secondary)] mb-3">
          Share a brief, decision, or summary with the team through the Aicoo
          coordination layer. Context stays scoped to this project.
        </p>
        <div className="flex gap-2">
          <Link
            href={`/routing?demo=1&id=${projectId}`}
            className="btn-primary px-3 py-1.5 rounded-md text-xs"
          >
            Open Aicoo routing
          </Link>
          <Link
            href={`/standup?demo=1&id=${projectId}`}
            className="btn-ghost px-3 py-1.5 rounded-md text-xs"
          >
            View standup
          </Link>
        </div>
      </Card>
    </div>
  );
}
