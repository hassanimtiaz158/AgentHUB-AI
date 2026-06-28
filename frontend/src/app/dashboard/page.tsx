"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, Badge, StatTile, ScoreRing, LoadingState, EmptyState } from "@/components/ui";
import { demoAgents, demoAnalysis, buildDemoMatches, demoTasks } from "@/lib/demo-data";
import { healthCheck, listAgents, listTasks } from "@/lib/api";
import { useProjectStore } from "@/lib/store";
import type { Agent, Task } from "@/lib/types";

export default function DashboardPage() {
  const store = useProjectStore();
  const [backendStatus, setBackendStatus] = useState<"online" | "demo" | "loading">("loading");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const health = await healthCheck();
      if (!active) return;
      setBackendStatus(health.data?.status === "ok" ? "online" : "demo");

      const [agentRes, taskRes] = await Promise.all([listAgents(), listTasks("demo")]);
      if (!active) return;
      setAgents(agentRes.data ?? demoAgents);
      setTasks(taskRes.data ?? demoTasks);
    })();
    return () => {
      active = false;
    };
  }, []);

  const matches = store.matches?.matches ?? buildDemoMatches().matches.slice(0, 4);
  const topMatch = matches[0];

  const completed = tasks.filter((t) => t.status === "Done").length;
  const inProgress = tasks.filter((t) => t.status === "In Progress").length;
  const todo = tasks.filter((t) => t.status === "Todo").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-purple-400 mb-1.5">
            Overview
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-[color:var(--text-secondary)] mt-1">
            {store.project?.title ?? "AI-powered analytics platform"} ·{" "}
            {agents.length} agents · {tasks.length} tasks
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-xs text-[color:var(--text-secondary)]">
            <span
              className={`w-2 h-2 rounded-full ${
                backendStatus === "online"
                  ? "bg-emerald-400"
                  : backendStatus === "demo"
                  ? "bg-amber-400"
                  : "bg-zinc-500 animate-pulse"
              }`}
            />
            {backendStatus === "online"
              ? "Backend connected"
              : backendStatus === "demo"
              ? "Demo mode"
              : "Checking…"}
          </span>
          <Link href="/post-project?demo=1" className="btn-primary px-4 py-2 rounded-lg text-xs font-medium">
            Run demo
          </Link>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Available agents" value={agents.filter((a) => a.availability === "available").length} accent="green" hint="Ready to be matched" />
        <StatTile label="In progress" value={inProgress} accent="yellow" hint="Tasks being worked on" />
        <StatTile label="Completed" value={completed} accent="blue" hint="Shipped tasks" />
        <StatTile label="Top match" value={topMatch ? `${topMatch.match_score}` : "—"} accent="purple" hint={topMatch?.agent_name ?? "No match yet"} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Agent roster */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Agent roster</h2>
            <Link href="/matches?demo=1" className="text-xs text-purple-300 hover:text-purple-200">
              View all →
            </Link>
          </div>
          {agents.length === 0 ? (
            <EmptyState title="No agents loaded" subtitle="Run the demo to populate the roster." />
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {agents.slice(0, 8).map((agent) => {
                const match = matches.find((m) => m.agent_id === agent.id);
                return (
                  <div key={agent.id} className="rounded-lg border border-[var(--border-subtle)] bg-white/[0.02] p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-purple-500/20 text-purple-300 flex items-center justify-center text-xs font-semibold">
                          {agent.agent_name.split(" ")[0][0]}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{agent.agent_name}</div>
                          <div className="text-[10px] text-[color:var(--text-muted)]">{agent.agent_role}</div>
                        </div>
                      </div>
                      {match && <ScoreRing score={match.match_score} />}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {agent.skills.slice(0, 3).map((s) => (
                        <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-[var(--border-subtle)] text-[color:var(--text-secondary)]">
                          {s}
                        </span>
                      ))}
                      {agent.skills.length > 3 && (
                        <span className="text-[10px] text-[color:var(--text-muted)]">+{agent.skills.length - 3}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Analysis snapshot */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Analysis</h2>
              <Link href="/analysis?demo=1" className="text-xs text-purple-300 hover:text-purple-200">
                Open →
              </Link>
            </div>
            {store.analysis ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[color:var(--text-secondary)]">Difficulty</span>
                  <Badge tone="yellow">{store.analysis.difficulty}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[color:var(--text-secondary)]">Roles</span>
                  <span className="text-xs">{store.analysis.required_roles.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[color:var(--text-secondary)]">Timeline</span>
                  <span className="text-xs">{store.analysis.estimated_timeline ?? "—"}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-[color:var(--text-muted)]">
                <p className="mb-2">No analysis yet. Run the demo to populate.</p>
                <Link href="/analysis?demo=1" className="text-cyan-300 hover:text-cyan-200">
                  Run analysis →
                </Link>
              </div>
            )}
          </div>

          {/* Task breakdown */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Tasks</h2>
              <Link href="/tasks?demo=1" className="text-xs text-purple-300 hover:text-purple-200">
                Board →
              </Link>
            </div>
            {tasks.length === 0 ? (
              <EmptyState title="No tasks yet" subtitle="Route tasks from the Aicoo page." />
            ) : (
              <div className="space-y-2">
                {tasks.slice(0, 6).map((task) => (
                  <div key={task.id} className="flex items-center justify-between text-sm">
                    <span className="truncate pr-2">{task.title}</span>
                    <Badge
                      tone={
                        task.status === "Done"
                          ? "green"
                          : task.status === "In Progress"
                          ? "yellow"
                          : "neutral"
                      }
                    >
                      {task.status}
                    </Badge>
                  </div>
                ))}
                {tasks.length > 6 && (
                  <div className="text-[10px] text-[color:var(--text-muted)]">
                    +{tasks.length - 6} more
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card p-5">
        <h2 className="font-semibold mb-4">Quick actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Post project", to: "/post-project?demo=1", tone: "purple" },
            { label: "AI analysis", to: "/analysis?demo=1", tone: "blue" },
            { label: "Find agents", to: "/matches?demo=1", tone: "cyan" },
            { label: "Aicoo routing", to: "/routing?demo=1", tone: "cyan" },
            { label: "Workspace", to: "/workspace?demo=1", tone: "amber" },
            { label: "Standup", to: "/standup?demo=1", tone: "pink" },
          ].map((a) => (
            <Link
              key={a.label}
              href={a.to}
              className="card p-3 text-center hover:translate-y-[-2px] transition-transform"
            >
              <div className="text-sm font-medium">{a.label}</div>
              <div className="text-[10px] text-[color:var(--text-muted)] mt-0.5">Open →</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
