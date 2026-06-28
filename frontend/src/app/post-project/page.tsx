"use client";

import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, Spinner, StatusPill, Badge } from "@/components/ui";
import { SkillInput } from "@/components/SkillInput";
import { DemoProgress } from "@/components/DemoProgress";
import { DEMO_BRIEF, DEMO_PROJECT_ID } from "@/lib/demo-flow";
import { createProject, listAgents } from "@/lib/api";
import { demoAnalysis } from "@/lib/demo-data";
import { buildAnalysisMetadata, inferRolesFromSkills } from "@/lib/analysis-engine";
import { useProjectStore } from "@/lib/store";
import type { Project } from "@/lib/types";

const SUGGESTED_SKILLS = [
  "React",
  "Next.js",
  "Python",
  "FastAPI",
  "PostgreSQL",
  "LLM",
  "NLP",
  "Docker",
  "AWS",
  "Figma",
  "TypeScript",
  "Tailwind",
  "Kubernetes",
  "ML",
];

export default function PostProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const router = useRouter();
  const store = useProjectStore();
  const { demo } = use(searchParams);
  const isDemo = !!demo;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [teamSize, setTeamSize] = useState(3);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill the form when running as a demo so the user can spam "Analyze".
  useEffect(() => {
    if (!isDemo) return;
    setTitle(DEMO_BRIEF.title);
    setDescription(DEMO_BRIEF.description);
    setSkills(DEMO_BRIEF.required_skills);
    setBudget(DEMO_BRIEF.budget);
    setDeadline(DEMO_BRIEF.deadline);
    setTeamSize(DEMO_BRIEF.team_size);
  }, [isDemo]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }
    setSubmitting(true);
    // In demo mode we force a known id so the rest of the flow can find it.
    const payload = {
      id: isDemo ? DEMO_PROJECT_ID : undefined,
      title,
      description,
      required_skills: skills,
      budget,
      deadline: deadline || undefined,
      team_size: teamSize,
    };
    const res = await createProject(payload);
    setSubmitting(false);
    if (!res.ok || !res.data) {
      setError(res.error ?? "Could not create project.");
      return;
    }
    const p: Project = res.data;
    store.setProject(p);

    // Run the analysis engine: compute timestamp, total cost, and select the
    // best agents for this project from the real registered pool (falling back
    // to the demo pool with some busy agents when the backend is offline).
    const agentRes = await listAgents();
    const requiredRoles = inferRolesFromSkills(p.required_skills);
    const meta = await buildAnalysisMetadata({
      requiredRoles,
      requiredSkills: p.required_skills,
      difficulty: demoAnalysis.difficulty,
      budget: p.budget,
      deadline: p.deadline,
      teamSize: p.team_size,
      listAgents: async () => agentRes.data ?? [],
    });

    // Persist the enriched analysis + selected matches so the analysis page
    // and downstream pages (matches, workspace) can render them. Use the roles
    // inferred from the user's actual skills (not the hardcoded demo roster)
    // so the whole downstream reflects the real project brief.
    store.setAnalysis({
      ...demoAnalysis,
      project_id: p.id,
      required_roles: requiredRoles,
      recommended_skills: p.required_skills,
      analyzed_at: meta.analyzed_at,
      total_cost: meta.total_cost,
      budget_exceeded: meta.budget_exceeded,
      agent_source: meta.agent_source,
      selected_agent_ids: meta.selected_agent_ids,
    });
    store.setMatches({
      project_id: p.id,
      project_title: p.title,
      matches: meta.matches,
    });

    router.push(`/analysis${isDemo ? "?demo=1&new=1" : `?id=${p.id}&new=1`}`);
  }

  return (
    <div className="space-y-6">
      <DemoProgress demoParam={demo ?? null} />

      <div>
        {isDemo && (
          <Link
            href="/"
            className="text-xs text-[color:var(--text-muted)] hover:text-[color:var(--text-secondary)]"
          >
            ← Exit demo
          </Link>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-purple-400">
            Step 01
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold">Post project</h1>
          {isDemo && <Badge tone="purple">demo</Badge>}
        </div>
        <p className="text-sm text-[color:var(--text-secondary)] mt-1">
          {isDemo
            ? "Demo brief is pre-filled. Click Analyze to see the AI breakdown."
            : "Tell AgentHub what you want to build. We will infer roles, parse skills, and match agents."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <Field label="Project title">
            <input
              className="input"
              placeholder="e.g. AI-powered analytics dashboard"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>

          <Field
            label="Description"
            hint="Type freely — mention roles, goals, and tech stack."
          >
            <textarea
              className="input min-h-[140px] resize-y"
              placeholder="I need a full-stack analytics dashboard…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          <Field
            label="Required skills"
            hint="Press Enter or comma to add. Tag what matters most."
          >
            <SkillInput skills={skills} onChange={setSkills} />
            <div className="flex flex-wrap gap-1.5 mt-3">
              {SUGGESTED_SKILLS.map((s) => {
                const active = skills.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() =>
                      setSkills(
                        active ? skills.filter((x) => x !== s) : [...skills, s]
                      )
                    }
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      active
                        ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                        : "bg-white/5 text-[color:var(--text-secondary)] border-[var(--border-subtle)] hover:bg-white/8"
                    }`}
                  >
                    {active ? "✓ " : "+ "}
                    {s}
                  </button>
                );
              })}
            </div>
          </Field>
        </Card>

        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <Field label="Budget (USD)" hint="Optional">
              <input
                className="input"
                inputMode="numeric"
                placeholder="50000"
                value={budget}
                onChange={(e) => setBudget(e.target.value.replace(/[^0-9]/g, ""))}
              />
            </Field>
          </Card>
          <Card>
            <Field label="Deadline" hint="Optional">
              <input
                type="date"
                className="input"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </Field>
          </Card>
          <Card>
            <Field label="Team size">
              <input
                type="number"
                min={1}
                max={12}
                className="input"
                value={teamSize}
                onChange={(e) =>
                  setTeamSize(Math.max(1, Math.min(12, Number(e.target.value))))
                }
              />
            </Field>
          </Card>
        </div>

        {error && (
          <div className="card border-red-500/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-[color:var(--text-muted)]">
            Status: <StatusPill status="Draft" />
          </div>
          <div className="flex gap-2">
            {!isDemo && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setTitle(DEMO_BRIEF.title);
                  setDescription(DEMO_BRIEF.description);
                  setSkills(DEMO_BRIEF.required_skills);
                  setBudget(DEMO_BRIEF.budget);
                  setDeadline(DEMO_BRIEF.deadline);
                  setTeamSize(DEMO_BRIEF.team_size);
                }}
                className="btn-ghost px-4 py-2.5 rounded-lg text-sm"
              >
                Try demo
              </button>
            )}
            <button
              type="submit"
              className="btn-primary px-5 py-2.5 rounded-lg text-sm font-medium inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              {submitting ? <Spinner /> : null}
              {submitting ? "Analyzing…" : "Analyze project →"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5 last:mb-0">
      <label className="text-sm font-medium mb-1.5 block">{label}</label>
      {children}
      {hint && (
        <div className="text-xs text-[color:var(--text-muted)] mt-1">{hint}</div>
      )}
    </div>
  );
}
