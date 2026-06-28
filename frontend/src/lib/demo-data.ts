// Demo fallback data used whenever the backend is unreachable. Mirrors the
// 8 seeded demo agents in `backend/app/services/matching_service.py` so the
// UI is fully functional offline.

import type {
  Agent,
  Analysis,
  MatchResponse,
  Standup,
  Task,
} from "./types";

export const demoAgents: Agent[] = [
  {
    id: "demo-frontend",
    agent_name: "Frontend Agent",
    agent_role: "Frontend Agent",
    skills: ["React", "TypeScript", "Tailwind CSS", "HTML/CSS", "Next.js"],
    availability: "available",
    description: "Builds modern, responsive web interfaces and design systems.",
  },
  {
    id: "demo-backend",
    agent_name: "Backend Agent",
    agent_role: "Backend Agent",
    skills: ["Python", "FastAPI", "PostgreSQL", "REST APIs", "Redis"],
    availability: "available",
    description:
      "Designs scalable APIs, data models, and server-side business logic.",
  },
  {
    id: "demo-ai",
    agent_name: "AI/ML Agent",
    agent_role: "AI/ML Agent",
    skills: ["PyTorch", "LLM", "NLP", "Vector DBs", "Prompt Engineering"],
    availability: "available",
    description: "Ships ML models, RAG pipelines, and AI-powered features.",
  },
  {
    id: "demo-design",
    agent_name: "UI/UX Agent",
    agent_role: "UI/UX Agent",
    skills: ["Figma", "User Research", "Wireframing", "Prototyping", "Accessibility"],
    availability: "available",
    description: "Creates intuitive interfaces, prototypes, and design systems.",
  },
  {
    id: "demo-qa",
    agent_name: "QA Agent",
    agent_role: "QA Agent",
    skills: ["Test Automation", "Cypress", "Playwright", "API Testing", "CI/CD"],
    availability: "available",
    description:
      "Owns quality with automated end-to-end and integration test suites.",
  },
  {
    id: "demo-devops",
    agent_name: "DevOps Agent",
    agent_role: "DevOps Agent",
    skills: ["Docker", "Kubernetes", "CI/CD", "Terraform", "AWS"],
    availability: "available",
    description:
      "Runs infra, deployments, and observability so teams ship reliably.",
  },
  {
    id: "demo-marketing",
    agent_name: "Marketing Agent",
    agent_role: "Marketing Agent",
    skills: ["SEO", "Content Strategy", "Social Media", "Ads", "Copywriting"],
    availability: "available",
    description:
      "Drives acquisition with campaigns, content, and growth experiments.",
  },
  {
    id: "demo-pm",
    agent_name: "Project Manager Agent",
    agent_role: "Project Manager Agent",
    skills: ["Scrum", "Roadmapping", "Stakeholder Management", "Risk Management", "Agile"],
    availability: "available",
    description:
      "Keeps work scoped, prioritized, and on track from kickoff to launch.",
  },
];

export const demoAnalysis: Analysis = {
  project_id: "demo",
  summary:
    "AI-Powered Dashboard requires 4 role(s): Backend Agent, Frontend Agent, AI/ML Agent, DevOps Agent.",
  required_roles: ["Backend Agent", "Frontend Agent", "AI/ML Agent", "DevOps Agent"],
  difficulty: "Medium",
  recommended_skills: ["python", "react", "ai", "docker", "fastapi", "llm"],
  task_breakdown: [
    { title: "Backend Agent work", role: "Backend Agent", status: "Todo" },
    { title: "Frontend Agent work", role: "Frontend Agent", status: "Todo" },
    { title: "AI/ML Agent work", role: "AI/ML Agent", status: "Todo" },
    { title: "DevOps Agent work", role: "DevOps Agent", status: "Todo" },
  ],
  estimated_timeline: "6-8 weeks",
};
export function buildDemoMatches(
  requiredSkills: string[] = ["React", "Python", "FastAPI", "Docker"],
): MatchResponse {
  const matches = demoAgents.map((agent) => {
    const lower = agent.skills.map((s) => s.toLowerCase());
    const required = requiredSkills.map((s) => s.toLowerCase());
    const overlap = required.filter((r) => lower.includes(r)).length;
    const skillPct = required.length ? overlap / required.length : 0;
    const hasRole = demoAnalysis.required_roles.includes(agent.agent_role);
    const score = Math.round(
      (hasRole ? 40 : 10) + skillPct * 40 + 20,
    );
    const reason = [
      hasRole ? `exact role match (${agent.agent_role})` : `related role (${agent.agent_role})`,
      overlap ? `${overlap}/${required.length} required skills` : null,
      "available",
    ]
      .filter(Boolean)
      .join("; ");
    return {
      agent_id: agent.id,
      agent_name: agent.agent_name,
      agent_role: agent.agent_role,
      skills: agent.skills,
      match_score: Math.min(100, score),
      reason,
      availability: agent.availability,
    };
  });
  matches.sort((a, b) => b.match_score - a.match_score);
  return { project_id: "demo", project_title: "Demo Project", matches };
}

export const demoTasks: Task[] = [
  {
    id: "task-1",
    project_id: "demo",
    assigned_agent_id: "demo-backend",
    title: "Design database schema",
    description: "Set up PostgreSQL schema for predictions and users.",
    status: "Done",
    created_at: "2026-06-25T10:00:00Z",
  },
  {
    id: "task-2",
    project_id: "demo",
    assigned_agent_id: "demo-backend",
    title: "Build predictions API",
    description: "FastAPI endpoints for model inference.",
    status: "In Progress",
    created_at: "2026-06-26T10:00:00Z",
  },
  {
    id: "task-3",
    project_id: "demo",
    assigned_agent_id: "demo-frontend",
    title: "Dashboard layout",
    description: "React dashboard with charts and filters.",
    status: "In Progress",
    created_at: "2026-06-26T10:00:00Z",
  },
  {
    id: "task-4",
    project_id: "demo",
    assigned_agent_id: "demo-ai",
    title: "Wire up ML model",
    description: "Serve ML predictions via the FastAPI backend.",
    status: "Todo",
    created_at: "2026-06-27T10:00:00Z",
  },
  {
    id: "task-5",
    project_id: "demo",
    assigned_agent_id: "demo-devops",
    title: "Dockerize services",
    description: "Compose React, FastAPI, and ML services.",
    status: "Todo",
    created_at: "2026-06-27T10:00:00Z",
  },
  {
    id: "task-6",
    project_id: "demo",
    assigned_agent_id: "demo-qa",
    title: "Write integration tests",
    description: "Cypress + Playwright coverage for critical flows.",
    status: "Todo",
    created_at: "2026-06-27T10:00:00Z",
  },
];

export const demoStandup: Standup = {
  project_id: "demo",
  generated_at: "2026-06-27T14:30:00Z",
  total_tasks: 6,
  completed: 1,
  in_progress: 2,
  todo: 3,
  summary:
    "Project has 6 tasks: 1 done, 2 in progress, 3 to do. Database design complete. Predictions API and dashboard layout underway.",
  blockers: ["task-4 Wire up ML model still Todo", "task-5 Dockerize services still Todo"],
  next_steps: [
    "Continue work on 'Build predictions API'",
    "Continue work on 'Dashboard layout'",
    "Kick off ML model integration",
  ],
};
