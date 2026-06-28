import { demoAnalysis } from "./demo-data";

// Single source-of-truth for the canonical demo flow. Every page reads this
// so the 6-step progression always lines up.
export const DEMO_FLOW = [
  { step: 1, slug: "/post-project", label: "Post project", short: "Post" },
  { step: 2, slug: "/analysis", label: "AI analysis", short: "Analyze" },
  { step: 3, slug: "/matches", label: "Find agents", short: "Match" },
  { step: 4, slug: "/routing", label: "Aicoo routing", short: "Route" },
  { step: 5, slug: "/workspace", label: "Team workspace", short: "Team" },
  { step: 6, slug: "/standup", label: "AI COO standup", short: "Standup" },
] as const;

export type DemoStep = (typeof DEMO_FLOW)[number];

// The deterministic demo brief used whenever `?demo=1` is present. Pulled from
// the same demo-data.ts that backs the analysis page so results stay coherent.
export const DEMO_BRIEF = {
  title: "AI-powered analytics platform",
  description:
    "Build an analytics platform with a React dashboard and charts, a FastAPI backend persistence layer, and an ML model that produces weekly predictions. Deploy in Docker on AWS with CI/CD and automated tests.",
  required_skills: ["React", "Python", "FastAPI", "Docker", "ML"],
  budget: "85000",
  deadline: "2026-09-30",
  team_size: 4,
};

// The pre-baked routing events shown in the timeline once the user reaches the
// routing step. These mirror the agents the matcher returns for the demo brief.
export const DEMO_ROUTE_EVENTS = [
  {
    key: "ctx",
    title: "Project context saved",
    detail:
      "Brief, required skills, and constraints committed to the Aicoo context store.",
    tone: "purple" as const,
  },
  {
    key: "frontend",
    title: "Frontend task routed",
    agent: "Frontend Agent",
    detail:
      "Dashboard layout & charts → Frontend Agent (React, TypeScript, Tailwind).",
    tone: "blue" as const,
  },
  {
    key: "backend",
    title: "Backend task routed",
    agent: "Backend Agent",
    detail:
      "Persistence & predictions API → Backend Agent (Python, FastAPI, PostgreSQL).",
    tone: "cyan" as const,
  },
  {
    key: "ai",
    title: "AI task routed",
    agent: "AI/ML Agent",
    detail:
      "Weekly inference model → AI/ML Agent (PyTorch, LLM, NLP).",
    tone: "green" as const,
  },
  {
    key: "workspace",
    title: "Team workspace created",
    detail:
      "4-agent workspace assembled with shared bio, availability, and routing topology.",
    tone: "yellow" as const,
  },
];

export function stepIndex(slug: string): number {
  return DEMO_FLOW.findIndex((s) => s.slug === slug);
}

export function nextSlug(slug: string): string | null {
  const i = stepIndex(slug);
  if (i < 0 || i >= DEMO_FLOW.length - 1) return null;
  return DEMO_FLOW[i + 1].slug;
}

export function prevSlug(slug: string): string | null {
  const i = stepIndex(slug);
  if (i <= 0) return null;
  return DEMO_FLOW[i - 1].slug;
}

// Used by the project-creation endpoint when `?demo=1` so the analysis page
// receives a deterministic id it can re-analyze without phantom DB entries.
export const DEMO_PROJECT_ID = "demo";
