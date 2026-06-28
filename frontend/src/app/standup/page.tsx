"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, Badge, StatTile, Spinner, ErrorState, LoadingState, EmptyState } from "@/components/ui";
import { DemoProgress } from "@/components/DemoProgress";
import { standupSummary } from "@/lib/api";
import { useProjectStore } from "@/lib/store";
import type { Standup } from "@/lib/types";

export default function StandupPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; demo?: string }>;
}) {
  const store = useProjectStore();
  const { id, demo } = use(searchParams);
  const isDemo = !!demo;
  const projectId = id ?? store.project?.id ?? "demo";

  const [standup, setStandup] = useState<Standup | null>(store.standup);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regen, setRegen] = useState(false);
  const [demoFallback, setDemoFallback] = useState(false);
  const [copied, setCopied] = useState(false);

  async function load() {
    setLoading(true);
    setRegen(true);
    setError(null);
    const res = await standupSummary(projectId);
    setLoading(false);
    setRegen(false);
    if (res.usingDemoFallback) setDemoFallback(true);
    if (res.data) {
      setStandup(res.data);
      store.setStandup(res.data);
    } else if (res.error) {
      setError(res.error);
    }
  }

  useEffect(() => {
    if (!standup) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  function copySummary() {
    if (!standup) return;
    const text = [
      standup.summary,
      "",
      `Total tasks: ${standup.total_tasks}`,
      `Completed: ${standup.completed}`,
      `In progress: ${standup.in_progress}`,
      `To do: ${standup.todo}`,
      "",
      "Blockers:",
      ...standup.blockers.map((b) => `• ${b}`),
      "",
      "Next steps:",
      ...standup.next_steps.map((s) => `• ${s}`),
    ].join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading && !standup) return <LoadingState label="Generating standup…" />;
  if (error && !standup)
    return <ErrorState title="Standup failed" detail={error} onRetry={load} />;
  if (!standup) return null;

  return (
    <div className="space-y-6">
      <DemoProgress demoParam={demo ?? null} />

      <div>
        <Link
          href={`/workspace?id=${projectId}`}
          className="text-xs text-[color:var(--text-muted)] hover:text-[color:var(--text-secondary)]"
        >
          ← Back to workspace
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-purple-400">
            Step 06
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold">AI COO standup</h1>
          {isDemo && <Badge tone="purple">demo</Badge>}
          {demoFallback && !isDemo && <Badge tone="yellow">demo fallback</Badge>}
        </div>
        <p className="text-sm text-[color:var(--text-secondary)] mt-1">
          Generated {new Date(standup.generated_at).toLocaleString()}
        </p>
      </div>

      {isDemo && (
        <div className="card border-emerald-500/30 px-4 py-3 text-sm text-emerald-300 inline-flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Demo flow complete! You can explore each step independently.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 justify-end">
        <button
          onClick={copySummary}
          className="btn-ghost px-4 py-2 rounded-lg text-sm inline-flex items-center gap-2"
        >
          {copied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy summary
            </>
          )}
        </button>
        <button
          onClick={load}
          className="btn-ghost px-4 py-2 rounded-lg text-sm inline-flex items-center gap-2"
          disabled={regen}
        >
          {regen ? <Spinner className="w-4 h-4" /> : null}
          Regenerate
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Total tasks" value={standup.total_tasks} accent="purple" />
        <StatTile label="Completed" value={standup.completed} accent="green" />
        <StatTile label="In progress" value={standup.in_progress} accent="yellow" />
        <StatTile label="To do" value={standup.todo} accent="blue" />
      </div>

      <Card className="gradient-border">
        <div className="text-[11px] uppercase tracking-[0.18em] text-purple-400 mb-2">
          Summary
        </div>
        <p className="text-[color:var(--text-secondary)]">{standup.summary}</p>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <div className="text-sm font-semibold mb-3 flex items-center gap-2">
            <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-red-400/60 to-red-400/0" />
            Blockers
          </div>
          {standup.blockers.length === 0 ? (
            <div className="text-xs text-[color:var(--text-muted)]">No blockers.</div>
          ) : (
            <ul className="space-y-2">
              {standup.blockers.map((b, i) => (
                <li
                  key={i}
                  className="text-sm px-3 py-2 rounded-lg border border-red-500/20 bg-red-500/5 flex items-start gap-2"
                >
                  <span className="text-red-400 font-mono text-xs mt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <div className="text-sm font-semibold mb-3 flex items-center gap-2">
            <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-emerald-400/60 to-emerald-400/0" />
            Next steps
          </div>
          {standup.next_steps.length === 0 ? (
            <div className="text-xs text-[color:var(--text-muted)]">
              Nothing queued. Add tasks to generate next steps.
            </div>
          ) : (
            <ul className="space-y-2">
              {standup.next_steps.map((s, i) => (
                <li
                  key={i}
                  className="text-sm px-3 py-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 flex items-start gap-2"
                >
                  <span className="text-emerald-400 font-mono text-xs mt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {isDemo && (
        <Card className="text-center p-6">
          <h3 className="text-lg font-semibold mb-2">🎉 Demo complete</h3>
          <p className="text-sm text-[color:var(--text-secondary)] mb-4">
            You&apos;ve walked through the full AgentHub AI flow. Start a real project
            to see the live backend in action.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/post-project"
              className="btn-primary px-5 py-2.5 rounded-lg text-sm font-medium inline-flex items-center justify-center gap-2"
            >
              Post a real project
            </Link>
            <Link
              href="/"
              className="btn-ghost px-5 py-2.5 rounded-lg text-sm font-medium inline-flex items-center justify-center"
            >
              Back to home
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
