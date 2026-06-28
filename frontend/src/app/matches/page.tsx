"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  ErrorState,
  LoadingState,
  ScoreRing,
  SkillBadge,
  StatusPill,
  Badge,
} from "@/components/ui";
import { DemoProgress } from "@/components/DemoProgress";
import { matchAgents } from "@/lib/api";
import { useProjectStore } from "@/lib/store";
import { useDemoPlayer } from "@/lib/demo-player";
import type { MatchResult, MatchResponse } from "@/lib/types";

export default function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; max?: string; demo?: string }>;
}) {
  const router = useRouter();
  const store = useProjectStore();
  const { id, max, demo } = use(searchParams);
  const isDemo = !!demo;
  const player = useDemoPlayer();

  const [data, setData] = useState<MatchResponse | null>(store.matches);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoFallback, setDemoFallback] = useState(false);

  useEffect(() => {
    let active = true;
    const projectId = id ?? store.project?.id ?? "demo";
    const maxN = Number(max ?? 8);
    setLoading(true);
    (async () => {
      const res = await matchAgents(projectId, maxN);
      if (!active) return;
      setLoading(false);
      if (res.usingDemoFallback) setDemoFallback(true);
      if (res.data) {
        setData(res.data);
        store.setMatches(res.data);
        // In demo mode, the DemoProvider auto-advances to routing.
      } else if (res.error) {
        setError(res.error);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, max]);

  if (loading && !data) return <LoadingState label="Matching agents…" />;
  if (error && !data)
    return (
      <ErrorState title="Matching failed" detail={error} onRetry={() => router.refresh()} />
    );
  if (!data) return null;

  const matches = data.matches;

  return (
    <div className="space-y-6">
      <DemoProgress demoParam={demo ?? null} />

      <div>
        <Link
          href="/analysis"
          className="text-xs text-[color:var(--text-muted)] hover:text-[color:var(--text-secondary)]"
        >
          ← Back to analysis
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-purple-400">
            Step 03
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold">Matched agents</h1>
          {data.project_title && (
            <span className="text-sm text-[color:var(--text-muted)]">
              · {data.project_title}
            </span>
          )}
          {isDemo && <Badge tone="purple">demo</Badge>}
          {demoFallback && !isDemo && <Badge tone="yellow">demo fallback</Badge>}
        </div>
        <p className="text-sm text-[color:var(--text-secondary)] mt-2">
          Top candidates ranked by role fit, skill overlap, and availability.
        </p>
      </div>

      {matches.length === 0 ? (
        <Card className="p-8 text-center text-[color:var(--text-secondary)]">
          No agents matched yet. Try a project with clearer role signals.
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {matches.map((m, i) => (
            <AgentCard key={m.agent_id} result={m} rank={i + 1} />
          ))}
        </div>
      )}

      <Card className="gradient-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
          <div>
            <h3 className="font-semibold">Ready to route tasks?</h3>
            <p className="text-sm text-[color:var(--text-secondary)]">
              Send each task to the best-fit agent through the Aicoo coordination layer.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/workspace?demo=1&id=${data.project_id}`}
              className="btn-ghost px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2"
            >
              Workspace
            </Link>
            <Link
              href={`/routing?demo=1&id=${data.project_id}`}
              className="btn-primary px-5 py-2.5 rounded-lg text-sm font-medium inline-flex items-center gap-2"
            >
              Open routing →
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

function AgentCard({ result, rank }: { result: MatchResult; rank: number }) {
  const tone =
    result.match_score >= 80
      ? "green"
      : result.match_score >= 50
      ? "yellow"
      : "neutral";
  return (
    <Card className="gradient-border flex gap-4 p-5">
      <ScoreRing score={result.match_score} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-xs text-[color:var(--text-muted)]">#{rank}</div>
            <div className="font-semibold">{result.agent_name}</div>
            <div className="text-xs text-[color:var(--text-secondary)]">
              {result.agent_role}
            </div>
          </div>
          <StatusPill status={result.availability} />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {result.skills.map((s) => (
            <SkillBadge key={s} skill={s} />
          ))}
        </div>
        <div className="mt-3 text-xs text-[color:var(--text-secondary)]">
          {result.reason}
        </div>
      </div>
    </Card>
  );
}
