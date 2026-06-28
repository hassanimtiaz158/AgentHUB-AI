"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, LoadingState, ErrorState, Badge, StatTile } from "@/components/ui";
import { DemoProgress } from "@/components/DemoProgress";
import { analyzeProject, createProject } from "@/lib/api";
import { demoAnalysis, agentRoleLine } from "@/lib/demo-data";
import { useProjectStore } from "@/lib/store";
import { useDemoPlayer } from "@/lib/demo-player";
import type { Analysis, Project } from "@/lib/types";

export default function AnalysisPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; new?: string; demo?: string }>;
}) {
  const router = useRouter();
  const store = useProjectStore();
  const { id, new: isNew, demo } = use(searchParams);
  const isDemo = !!demo;
  const player = useDemoPlayer();

  const [analysis, setAnalysis] = useState<Analysis | null>(store.analysis);
  const [project, setProjectData] = useState<Project | null>(store.project);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoFallback, setDemoFallback] = useState(false);

  useEffect(() => {
    let active = true;
    const projectId = id ?? store.project?.id;
    if (!projectId) return;
    setLoading(true);
    (async () => {
      // Ensure we have a project; if id not in store, create a quick one.
      let currentProject = store.project;
      if (!currentProject || currentProject.id !== projectId) {
        const created = await createProject({
          title: "Untitled project",
          description: "loading…",
          required_skills: [],
          team_size: 3,
        });
        if (!created.ok || !created.data) {
          if (!active) return;
          setError(created.error ?? "Could not bootstrap project.");
          setLoading(false);
          return;
        }
        currentProject = created.data;
        store.setProject(currentProject);
      }

      const res = await analyzeProject(currentProject.id);
      if (!active) return;
      setLoading(false);
      if (res.usingDemoFallback) setDemoFallback(true);
      if (res.data) {
        setAnalysis(res.data);
        setProjectData(currentProject);
        store.setAnalysis(res.data);
        // In demo mode, the DemoProvider auto-advances to matches.
        // Nothing to do here — the player owns the timer.
      } else if (res.error) {
        setError(res.error);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const difficultyTone = useMemo(() => {
    const d = analysis?.difficulty ?? "";
    if (d === "High") return "red";
    if (d === "Medium") return "yellow";
    if (d === "Low") return "cyan";
    return "green";
  }, [analysis?.difficulty]);

  if (loading && !analysis) return <LoadingState label="Analyzing project…" />;
  if (error && !analysis)
    return (
      <ErrorState
        title="Analysis failed"
        detail={error}
        onRetry={() => router.refresh()}
      />
    );
  if (!analysis) {
    return (
      <div className="space-y-6">
        <Card className="p-10 text-center">
          <h2 className="text-xl font-semibold mb-2">No project to analyze yet</h2>
          <p className="text-sm text-[color:var(--text-secondary)] mb-4">
            Submit a project first, or explore the demo analysis.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/post-project?demo=1"
              className="btn-primary px-5 py-2.5 rounded-lg text-sm font-medium inline-flex items-center justify-center gap-2"
            >
              Run full demo
              <ArrowIcon />
            </Link>
            <Link
              href="/matches?demo=1"
              className="btn-ghost px-5 py-2.5 rounded-lg text-sm font-medium inline-flex items-center justify-center"
            >
              Browse demo agents
            </Link>
          </div>
        </Card>
        <DemoAnalysisCard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DemoProgress demoParam={demo ?? null} />

      <div>
        <Link
          href="/post-project"
          className="text-xs text-[color:var(--text-muted)] hover:text-[color:var(--text-secondary)]"
        >
          ← Back to project
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-purple-400">
            Step 02
          </div>
          <span className="text-xs text-[color:var(--text-muted)]">•</span>
          <h1 className="text-2xl md:text-3xl font-semibold">
            AI analysis {project ? `· ${project.title}` : ""}
          </h1>
          {isDemo && <Badge tone="purple">demo</Badge>}
          {demoFallback && !isDemo && (
            <Badge tone="yellow">demo fallback</Badge>
          )}
        </div>
      </div>

      <Card className="gradient-border">
        <p className="text-[color:var(--text-secondary)]">{analysis.summary}</p>
      </Card>

      {analysis.budget_exceeded && (
        <div className="card border-red-500/30 px-4 py-3 text-sm text-red-300 inline-flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Estimated cost exceeds declared budget{project?.budget ? ` of $${parseInt(project.budget, 10).toLocaleString()}` : ""}. Consider trimming scope or raising the budget.
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Difficulty"
          value={
            <span className="inline-flex items-center gap-2">
              <Badge tone={difficultyTone as any}>{analysis.difficulty}</Badge>
            </span>
          }
          accent="yellow"
        />
        <StatTile
          label="Inferred roles"
          value={analysis.required_roles.length}
          accent="purple"
        />
        <StatTile
          label="Recommended skills"
          value={analysis.recommended_skills.length}
          accent="blue"
        />
        <StatTile
          label="Estimated total cost"
          value={
            analysis.total_cost
              ? `$${analysis.total_cost.toLocaleString()}`
              : "—"
          }
          accent={analysis.budget_exceeded ? "red" : "green"}
          hint={
            analysis.budget_exceeded
              ? "Exceeds declared budget"
              : analysis.analyzed_at
                ? `Analyzed ${new Date(analysis.analyzed_at).toLocaleString()}`
                : undefined
          }
        />
      </div>

      {/* Best agents selected by the system */}
      {analysis.selected_agent_ids && analysis.selected_agent_ids.length > 0 && (
        <Card className="border-emerald-500/30">
          <SectionTitle
            title="Best agents selected"
            eyebrow={
              analysis.agent_source === "backend"
                ? "Auto-selected from live agents"
                : "Auto-selected from demo pool (offline)"
            }
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {store.matches?.matches
              .filter((m) => analysis.selected_agent_ids!.includes(m.agent_id))
              .map((m) => {
                const isBusy = m.availability === "busy";
                return (
                  <div
                    key={m.agent_id}
                    className={`rounded-lg border p-3 text-center ${
                      isBusy
                        ? "border-amber-500/30 bg-amber-500/5"
                        : "border-emerald-500/20 bg-emerald-500/5"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg mx-auto flex items-center justify-center text-sm font-semibold ${
                      isBusy ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"
                    }`}>
                      {m.agent_name.split(" ")[0][0]}
                    </div>
                    <div className="text-xs font-medium mt-2 truncate">{m.agent_name.replace(" Agent", "")}</div>
                    <div className="mt-1 flex items-center justify-center gap-1.5">
                      <span className={`text-[10px] font-semibold ${isBusy ? "text-amber-400" : "text-emerald-400"}`}>
                        Score {m.match_score}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        isBusy
                          ? "bg-amber-500/15 text-amber-300"
                          : "bg-emerald-500/15 text-emerald-300"
                      }`}>
                        {m.availability}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <SectionTitle title="Required roles" eyebrow="Detected" />
          <div className="space-y-2">
            {analysis.required_roles.map((r) => (
              <div
                key={r}
                className="flex items-center justify-between px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[color:var(--bg-elevated)]/60"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-purple-500/20 text-purple-300 text-xs flex items-center justify-center font-semibold">
                    {r[0]}
                  </span>
                  <span className="text-sm">{r}</span>
                </div>
                <Badge tone="purple">required</Badge>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <SectionTitle title="Recommended skills" eyebrow="Suggested" />
          <div className="flex flex-wrap gap-2">
            {analysis.recommended_skills.map((s) => (
              <Badge key={s} tone="blue">
                {s.toUpperCase()}
              </Badge>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle title="Task breakdown" eyebrow="Preview" />
        <div className="grid sm:grid-cols-2 gap-3">
          {analysis.task_breakdown.map((t, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-subtle)]"
            >
              <div>
                <div className="text-sm font-medium">{t.role} works on: {agentRoleLine(t.role)} of {project?.title ?? "AI-powered analytics platform"}</div>
                <div className="text-xs text-[color:var(--text-muted)]">{t.title}</div>
              </div>
              <Badge tone="neutral">{t.status}</Badge>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {isNew === "1" && (
          <div className="card border-emerald-500/30 px-4 py-3 text-sm text-emerald-300 inline-flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Project created & analyzed
          </div>
        )}
        <div className="flex-1" />
        <Link
          href={`/matches?demo=1&id=${project?.id ?? "demo"}`}
          className="btn-primary px-5 py-2.5 rounded-lg text-sm font-medium inline-flex items-center gap-2"
        >
          See matched agents →
        </Link>
      </div>
    </div>
  );
}

function SectionTitle({ title, eyebrow }: { title: string; eyebrow?: string }) {
  return (
    <div className="mb-3">
      {eyebrow && (
        <div className="text-[11px] uppercase tracking-[0.18em] text-purple-400 mb-1">
          {eyebrow}
        </div>
      )}
      <h3 className="font-semibold">{title}</h3>
    </div>
  );
}

function DemoAnalysisCard() {
  return (
    <Card className="gradient-border">
      <div className="flex items-center gap-2 mb-3">
        <Badge tone="yellow">demo preview</Badge>
        <span className="text-xs text-[color:var(--text-muted)]">
          Example output for a sample project
        </span>
      </div>
      <p className="text-sm text-[color:var(--text-secondary)] mb-4">
        {demoAnalysis.summary}
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-purple-400 mb-1.5">
            Required roles
          </div>
          <div className="flex flex-wrap gap-1.5">
            {demoAnalysis.required_roles.map((r) => (
              <Badge key={r} tone="purple">{r}</Badge>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-blue-400 mb-1.5">
            Recommended skills
          </div>
          <div className="flex flex-wrap gap-1.5">
            {demoAnalysis.recommended_skills.map((s) => (
              <Badge key={s} tone="blue">
                {s.toUpperCase()}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
