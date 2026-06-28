// Maps each agent role to the specific domain it works on within a project.
// Used to generate role-specific "works on:" lines in the task breakdown.
const AGENT_ROLE_DOMAINS: Record<string, string> = {
  "Frontend Agent": "UI components, client-side logic, and user interface",
  "Backend Agent": "APIs, database schema, and server-side business logic",
  "AI/ML Agent": "machine learning models, AI pipelines, and inference endpoints",
  "UI/UX Agent": "design system, wireframes, prototypes, and user experience",
  "QA Agent": "test automation, quality assurance, and bug tracking",
  "DevOps Agent": "deployment, CI/CD pipelines, and infrastructure orchestration",
  "Marketing Agent": "go-to-market strategy, SEO, and content campaigns",
  "Project Manager Agent": "sprint planning, roadmap management, and deliverable tracking",
  "Cloud Agent": "multi-cloud architecture, serverless platforms, and cost optimization",
  "Mobile App Agent": "cross-platform mobile apps for iOS and Android",
  "Data Engineer Agent": "ETL pipelines, data warehousing, and analytics infrastructure",
  "Security Agent": "security auditing, penetration testing, and compliance reviews",
};

/**
 * Returns a role-specific domain description for a given agent role.
 * Falls back to "general development" for unknown roles.
 */
export function agentRoleLine(role: string): string {
  return AGENT_ROLE_DOMAINS[role] ?? "general development";
}

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
  {
    id: "demo-cloud",
    agent_name: "Cloud Agent",
    agent_role: "Cloud Agent",
    skills: ["AWS", "Azure", "GCP", "Infrastructure as Design", "Serverless"],
    availability: "available",
    description:
      "Architects and manages multi-cloud infrastructure, cost optimization, and serverless platforms.",
  },
  {
    id: "demo-mobile",
    agent_name: "Mobile App Agent",
    agent_role: "Mobile App Agent",
    skills: ["React Native", "Swift", "Kotlin", "Flutter", "App Store"],
    availability: "available",
    description:
      "Builds cross-platform and native mobile apps for iOS and Android with smooth UX.",
  },
  {
    id: "demo-data-engineer",
    agent_name: "Data Engineer Agent",
    agent_role: "Data Engineer Agent",
    skills: ["Spark", "Airflow", "Snowflake", "dETL Pipelines", "Kafka"],
    availability: "available",
    description:
      "Builds data pipelines, warehouses, and streaming infrastructure for analytics at scale.",
  },
  {
    id: "demo-security",
    agent_name: "Security Agent",
    agent_role: "Security Agent",
    skills: ["OWASP", "Penetration Testing", "Compliance", "Encryption", "SOC 2"],
    availability: "available",
    description:
      "Owns application security, vulnerability assessments, and compliance audits.",
  },
];

export const demoAnalysis: Analysis = {
  project_id: "demo",
  summary:
    "AI-Powered Analytics Platform requires 12 specialized agents covering end-to-end development, infrastructure, and growth.",
  required_roles: [
    "Frontend Agent",
    "Backend Agent",
    "AI/ML Agent",
    "UI/UX Agent",
    "QA Agent",
    "DevOps Agent",
    "Marketing Agent",
    "Project Manager Agent",
    "Cloud Agent",
    "Mobile App Agent",
    "Data Engineer Agent",
    "Security Agent",
  ],
  difficulty: "High",
  recommended_skills: ["python", "react", "fastapi", "docker", "llm", "kubernetes", "aws", "typescript"],
  task_breakdown: [
    { title: "Build dashboard UI with React, charts, and responsive layouts", role: "Frontend Agent", status: "In Progress" },
    { title: "Design and implement FastAPI backend with PostgreSQL data models", role: "Backend Agent", status: "In Progress" },
    { title: "Develop and serve the weekly inference ML model with PyTorch", role: "AI/ML Agent", status: "Todo" },
    { title: "Create wireframes, prototypes, and design system in Figma", role: "UI/UX Agent", status: "Done" },
    { title: "Write automated test suites with Cypress and Playwright", role: "QA Agent", status: "Todo" },
    { title: "Set up Docker containers, CI/CD pipeline, and deployments", role: "DevOps Agent", status: "In Progress" },
    { title: "Plan go-to-market strategy, SEO, and content campaigns", role: "Marketing Agent", status: "Todo" },
    { title: "Coordinate sprints, manage roadmap, and track deliverables", role: "Project Manager Agent", status: "In Progress" },
    { title: "Configure multi-cloud infrastructure and serverless functions", role: "Cloud Agent", status: "Todo" },
    { title: "Build cross-platform mobile app with React Native", role: "Mobile App Agent", status: "Todo" },
    { title: "Build ETL pipelines and data warehouse with Snowflake", role: "Data Engineer Agent", status: "Todo" },
    { title: "Conduct security audit, penetration testing, and compliance", role: "Security Agent", status: "Todo" },
  ],
  estimated_timeline: "10-12 weeks",
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
    assigned_agent_id: "demo-design",
    title: "Create wireframes and design system",
    description: "Figma prototypes and component library for the dashboard.",
    status: "Done",
    created_at: "2026-06-24T10:00:00Z",
  },
  {
    id: "task-2",
    project_id: "demo",
    assigned_agent_id: "demo-backend",
    title: "Design database schema",
    description: "Set up PostgreSQL schema for predictions and users.",
    status: "Done",
    created_at: "2026-06-25T10:00:00Z",
  },
  {
    id: "task-3",
    project_id: "demo",
    assigned_agent_id: "demo-frontend",
    title: "Build dashboard layout",
    description: "React dashboard with charts and filters.",
    status: "In Progress",
    created_at: "2026-06-26T10:00:00Z",
  },
  {
    id: "task-4",
    project_id: "demo",
    assigned_agent_id: "demo-backend",
    title: "Build predictions API",
    description: "FastAPI endpoints for model inference.",
    status: "In Progress",
    created_at: "2026-06-26T10:00:00Z",
  },
  {
    id: "task-5",
    project_id: "demo",
    assigned_agent_id: "demo-devops",
    title: "Dockerize services",
    description: "Compose React, FastAPI, and ML services.",
    status: "In Progress",
    created_at: "2026-06-26T10:00:00Z",
  },
  {
    id: "task-6",
    project_id: "demo",
    assigned_agent_id: "demo-pm",
    title: "Sprint planning and roadmap",
    description: "Coordinate sprints and track deliverables.",
    status: "In Progress",
    created_at: "2026-06-26T10:00:00Z",
  },
  {
    id: "task-7",
    project_id: "demo",
    assigned_agent_id: "demo-ai",
    title: "Train weekly inference model",
    description: "PyTorch model for weekly predictions.",
    status: "Todo",
    created_at: "2026-06-27T10:00:00Z",
  },
  {
    id: "task-8",
    project_id: "demo",
    assigned_agent_id: "demo-qa",
    title: "Write integration tests",
    description: "Cypress + Playwright coverage for critical flows.",
    status: "Todo",
    created_at: "2026-06-27T10:00:00Z",
  },
  {
    id: "task-9",
    project_id: "demo",
    assigned_agent_id: "demo-cloud",
    title: "Configure cloud infrastructure",
    description: "Set up AWS/GCP resources and serverless functions.",
    status: "Todo",
    created_at: "2026-06-27T10:00:00Z",
  },
  {
    id: "task-10",
    project_id: "demo",
    assigned_agent_id: "demo-mobile",
    title: "Build mobile app shell",
    description: "React Native app with navigation and core screens.",
    status: "Todo",
    created_at: "2026-06-28T10:00:00Z",
  },
  {
    id: "task-11",
    project_id: "demo",
    assigned_agent_id: "demo-data-engineer",
    title: "Build ETL data pipeline",
    description: "Ingest and transform analytics data with Airflow.",
    status: "Todo",
    created_at: "2026-06-28T10:00:00Z",
  },
  {
    id: "task-12",
    project_id: "demo",
    assigned_agent_id: "demo-security",
    title: "Security audit and compliance",
    description: "OWASP review and penetration testing.",
    status: "Todo",
    created_at: "2026-06-28T10:00:00Z",
  },
  {
    id: "task-13",
    project_id: "demo",
    assigned_agent_id: "demo-marketing",
    title: "Go-to-market strategy",
    description: "Plan SEO, content, and launch campaigns.",
    status: "Todo",
    created_at: "2026-06-28T10:00:00Z",
  },
];

export const demoStandup: Standup = {
  project_id: "demo",
  generated_at: "2026-06-28T14:30:00Z",
  total_tasks: 13,
  completed: 2,
  in_progress: 4,
  todo: 7,
  summary:
    "Project has 13 tasks across 12 agents: 2 done, 4 in progress, 7 to go. Design system and database complete. Dashboard, API, Docker, and sprint planning underway.",
  blockers: ["ML model training not started", "Security audit pending"],
  next_steps: [
    "Continue work on dashboard layout and predictions API",
    "Kick off ML model training",
    "Start integration tests and cloud setup",
  ],
};
