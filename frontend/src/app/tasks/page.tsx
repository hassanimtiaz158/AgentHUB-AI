"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, Badge, EmptyState, LoadingState, Spinner } from "@/components/ui";
import { DemoProgress } from "@/components/DemoProgress";
import { routeTask } from "@/lib/api";
import { demoTasks } from "@/lib/demo-data";
import { useProjectStore } from "@/lib/store";
import type { Task, TaskStatus } from "@/lib/types";

type Lane = "Todo" | "In Progress" | "Done";
const LANES: Lane[] = ["Todo", "In Progress", "Done"];
const LANE_ACCENT: Record<Lane, string> = {
  Todo: "from-red-400/40 to-red-400/0",
  "In Progress": "from-amber-400/40 to-amber-400/0",
  Done: "from-emerald-400/40 to-emerald-400/0",
};

export default function TaskBoardPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; demo?: string }>;
}) {
  const store = useProjectStore();
  const { id, demo } = use(searchParams);
  const isDemo = !!demo;
  const projectId = id ?? store.project?.id ?? "demo";

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setTasks(store.tasks.length ? store.tasks : demoTasks);
    setLoading(false);
    return () => {
      active = false;
    };
  }, []);

  async function addTask() {
    if (!title.trim()) return;
    setBusy(true);
    const res = await routeTask(projectId, {
      title: title.trim(),
      description: "",
      required_role: store.matches?.matches?.[0]?.agent_role,
      required_skills: store.project?.required_skills,
    });
    setBusy(false);
    if (res.data?.task) {
      setTasks((prev) => [...prev, res.data!.task]);
    } else if (!res.usingDemoFallback) {
      // backend unreachable: synthesize a local task for the demo
      const newTask: Task = {
        id: `task-${Date.now()}`,
        project_id: projectId,
        assigned_agent_id: store.matches?.matches?.[0]?.agent_id ?? null,
        title: title.trim(),
        description: "",
        status: "Todo",
        created_at: new Date().toISOString(),
      };
      setTasks((prev) => [...prev, newTask]);
    }
    setTitle("");
  }

  function byLane(lane: Lane) {
    return tasks.filter((t) => t.status === lane);
  }

  function moveTask(task: Task, dir: 1 | -1) {
    const idx = LANES.indexOf(task.status as Lane);
    const next = LANES[idx + dir];
    if (!next) return;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)));
  }

  function agentName(agentId: string | null): string | null {
    if (!agentId) return null;
    const m = store.matches?.matches?.find((x) => x.agent_id === agentId);
    return m?.agent_name ?? null;
  }

  if (loading) return <LoadingState label="Loading task board…" />;

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
            Execution
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold">Task board</h1>
          {isDemo && <Badge tone="purple">demo</Badge>}
        </div>
        <p className="text-sm text-[color:var(--text-secondary)] mt-1">
          Kanban view of all project tasks across{" "}
          <span className="text-[color:var(--text-primary)]">{tasks.length} tasks</span>.
        </p>
      </div>

      <Card className="flex flex-col sm:flex-row gap-2">
        <input
          className="input flex-1"
          placeholder="New task title — press Enter to add"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
        />
        <button
          onClick={addTask}
          disabled={busy || !title.trim()}
          className="btn-primary px-4 py-2 rounded-lg text-sm disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          {busy ? <Spinner className="w-4 h-4" /> : "Add task"}
        </button>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        {LANES.map((lane) => (
          <div key={lane} className="card flex flex-col">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-1.5 h-6 rounded-full bg-gradient-to-b ${LANE_ACCENT[lane]}`}
                />
                <span className="text-sm font-semibold">{lane}</span>
                <span className="text-xs text-[color:var(--text-muted)]">
                  {byLane(lane).length}
                </span>
              </div>
            </div>
            <div className="flex-1 px-3 pb-3 space-y-2 min-h-[200px]">
              {byLane(lane).length === 0 ? (
                <div className="text-xs text-[color:var(--text-muted)] text-center pt-8">
                  No tasks
                </div>
              ) : (
                byLane(lane).map((t) => (
                  <div
                    key={t.id}
                    className="px-3 py-3 rounded-lg border border-[var(--border-subtle)] bg-[color:var(--bg-elevated)]/60"
                  >
                    <div className="text-sm font-medium mb-1">{t.title}</div>
                    {t.description && (
                      <div className="text-xs text-[color:var(--text-secondary)] mb-2 line-clamp-2">
                        {t.description}
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      {t.assigned_agent_id ? (
                        <Badge tone="cyan">{agentName(t.assigned_agent_id) ?? "Assigned"}</Badge>
                      ) : (
                        <Badge tone="neutral">Unassigned</Badge>
                      )}
                      <div className="flex gap-1">
                        {lane !== "Todo" && (
                          <button
                            onClick={() => moveTask(t, -1)}
                            className="text-xs btn-ghost px-2 py-0.5 rounded"
                          >
                            ←
                          </button>
                        )}
                        {lane !== "Done" && (
                          <button
                            onClick={() => moveTask(t, 1)}
                            className="text-xs btn-ghost px-2 py-0.5 rounded"
                          >
                            →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
