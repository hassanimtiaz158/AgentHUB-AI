// Client-side analysis engine. Computes the analysis metadata that the UI
// displays after a project is posted: analysis timestamp, total cost, and the
// set of best-scoring agents selected for the project.
//
// This mirrors what the backend would do so the demo/offline flow is fully
// functional without a running server. When the backend *is* reachable we
// score the real registered agents; otherwise we fall back to a demo pool
// (with some agents marked busy) so availability-aware selection is still
// exercised offline.

import { demoAgents } from "./demo-data";
import type { Agent, AgentRole, MatchResult } from "./types";

/**
 * Maps a skill keyword to the agent roles most likely to own it. Used to infer
 * a project's required roles from the skills the user actually enters, so the
 * agent matcher selects candidates that fit the real project — not a hardcoded
 * 12-role demo roster.
 */
const SKILL_TO_ROLES: Record<string, AgentRole[]> = {
  // Frontend
  react: ["Frontend Agent"],
  "next.js": ["Frontend Agent"],
  typescript: ["Frontend Agent"],
  javascript: ["Frontend Agent"],
  tailwind: ["Frontend Agent", "UI/UX Agent"],
  html: ["Frontend Agent"],
  css: ["Frontend Agent"],
  "html/css": ["Frontend Agent"],
  vue: ["Frontend Agent"],
  angular: ["Frontend Agent"],
  // Backend
  python: ["Backend Agent"],
  fastapi: ["Backend Agent"],
  django: ["Backend Agent"],
  flask: ["Backend Agent"],
  node: ["Backend Agent"],
  express: ["Backend Agent"],
  spring: ["Backend Agent"],
  "rest apis": ["Backend Agent"],
  graphql: ["Backend Agent"],
  // Data / databases
  postgresql: ["Backend Agent", "Data Engineer Agent"],
  mysql: ["Backend Agent", "Data Engineer Agent"],
  mongodb: ["Backend Agent", "Data Engineer Agent"],
  redis: ["Backend Agent", "Data Engineer Agent"],
  snowflake: ["Data Engineer Agent"],
  spark: ["Data Engineer Agent"],
  airflow: ["Data Engineer Agent"],
  kafka: ["Data Engineer Agent"],
  etl: ["Data Engineer Agent"],
  // AI/ML
  llm: ["AI/ML Agent"],
  nlp: ["AI/ML Agent"],
  pytorch: ["AI/ML Agent"],
  tensorflow: ["AI/ML Agent"],
  ml: ["AI/ML Agent"],
  "prompt engineering": ["AI/ML Agent"],
  "vector dbs": ["AI/ML Agent", "Backend Agent"],
  // UI/UX
  figma: ["UI/UX Agent"],
  "user research": ["UI/UX Agent"],
  wireframing: ["UI/UX Agent"],
  prototyping: ["UI/UX Agent"],
  accessibility: ["UI/UX Agent", "QA Agent"],
  design: ["UI/UX Agent"],
  // QA
  "test automation": ["QA Agent"],
  cypress: ["QA Agent"],
  playwright: ["QA Agent"],
  "api testing": ["QA Agent"],
  testing: ["QA Agent"],
  // DevOps
  docker: ["DevOps Agent"],
  kubernetes: ["DevOps Agent"],
  terraform: ["DevOps Agent"],
  "ci/cd": ["DevOps Agent", "DevOps Agent"],
  deployment: ["DevOps Agent"],
  // Cloud
  aws: ["Cloud Agent", "DevOps Agent"],
  azure: ["Cloud Agent"],
  gcp: ["Cloud Agent"],
  "infrastructure as design": ["Cloud Agent"],
  serverless: ["Cloud Agent", "Backend Agent"],
  // Mobile
  "react native": ["Mobile App Agent"],
  swift: ["Mobile App Agent"],
  kotlin: ["Mobile App Agent"],
  flutter: ["Mobile App Agent"],
  ios: ["Mobile App Agent"],
  android: ["Mobile App Agent"],
  // Security
  owasp: ["Security Agent"],
  "penetration testing": ["Security Agent"],
  compliance: ["Security Agent"],
  encryption: ["Security Agent"],
  "soc 2": ["Security Agent"],
  // Marketing
  seo: ["Marketing Agent"],
  "content strategy": ["Marketing Agent"],
  "social media": ["Marketing Agent"],
  marketing: ["Marketing Agent"],
  // PM
  scrum: ["Project Manager Agent"],
  roadmapping: ["Project Manager Agent"],
  agile: ["Project Manager Agent"],
  "stakeholder management": ["Project Manager Agent"],
  "risk management": ["Project Manager Agent"],
};

/**
 * Infers the set of agent roles a project needs from the skills the user
 * entered. Each matching skill contributes its roles; duplicates are collapsed.
 * Returns the roles sorted alphabetically for stable display.
 */
export function inferRolesFromSkills(skills: string[]): AgentRole[] {
  const roles = new Set<AgentRole>();
  for (const raw of skills) {
    const key = raw.toLowerCase().trim();
    const mapped = SKILL_TO_ROLES[key];
    if (mapped) mapped.forEach((r) => roles.add(r));
  }
  return [...roles].sort((a, b) => a.localeCompare(b));
}

/** Difficulty multiplier applied to the cost estimate. */
const DIFFICULTY_MULTIPLIER: Record<string, number> = {
  "Very Low": 0.5,
  Low: 0.7,
  Medium: 1.0,
  High: 1.25,
};

/**
 * Computes working hours from a deadline string. Returns null if no deadline
 * or the deadline is in the past.
 */
function hoursFromDeadline(deadline?: string | null): number | null {
  if (!deadline) return null;
  const target = new Date(deadline).getTime();
  const now = Date.now();
  if (target <= now) return null;
  const days = (target - now) / (1000 * 60 * 60 * 24);
  // Assume 8 productive hours per working day, 5 days per week.
  const workDays = days * (5 / 7);
  return Math.round(workDays * 8);
}

/**
 * Demo pool IDs that should be marked busy in the offline fallback, so the
 * availability-aware selection logic is visibly exercised without a backend.
 */
const DEMO_BUSY_IDS = ["demo-mobile", "demo-cloud", "demo-security"];

/**
 * Returns the demo agent pool with a few agents flipped to "busy". Used as a
 * fallback when the backend is unreachable so the selection still has to
 * choose between available and unavailable agents.
 */
export function busyDemoPool(): Agent[] {
  return demoAgents.map((a) =>
    DEMO_BUSY_IDS.includes(a.id) ? { ...a, availability: "busy" } : a,
  );
}

/**
 * Computes the estimated total cost for a project.
 *
 * Cost is derived from the user's own inputs — budget, deadline, and team
 * size — so the estimate always feels grounded in what the user entered:
 *
 *   - If a budget is declared, the user's budget is the anchor. Hours are
 *     derived from the deadline (or a sensible default), and we report an
 *     affordable *fraction* of the budget based on the team size needed.
 *   - If no budget is declared, cost is hours × a blended team rate.
 *
 * Returns the total plus whether it exceeds the declared budget. Budget
 * overage only triggers when the project genuinely cannot fit the requested
 * scope within the declared budget (team too large / deadline too tight).
 */
export function computeTotalCost(
  selectedRoles: string[],
  difficulty: string,
  budget?: string | null,
  deadline?: string | null,
): { total: number; budget_exceeded: boolean } {
  const difficultyMult = DIFFICULTY_MULTIPLIER[difficulty] ?? 1.0;
  const teamSize = selectedRoles.length;

  // Affordable blended hourly rate for an AI-agent team (low — these are
  // software agents, not human contractors).
  const AFFORDABLE_HOURLY_RATE = 18;

  // Hours: from deadline if given, otherwise a small default per team member.
  const hoursPerAgent = hoursFromDeadline(deadline) ?? 40;
  const totalHours = hoursPerAgent * teamSize;

  // Baseline cost, scaled by difficulty.
  const baseline = Math.round(
    totalHours * AFFORDABLE_HOURLY_RATE * difficultyMult,
  );

  const declaredBudget = budget ? parseInt(budget, 10) : null;
  const validBudget =
    declaredBudget !== null && !isNaN(declaredBudget) && declaredBudget > 0;

  if (validBudget) {
    // If a budget is declared, anchor to it: charge a share proportional to
    // the team size, capped at the budget. This keeps the estimate low and
    // grounded in what the user asked to spend.
    const perAgentShareMax = declaredBudget / Math.max(1, teamSize);
    const desired = Math.round(
      perAgentShareMax * Math.min(teamSize, Math.ceil(teamSize)) * difficultyMult,
    );
    const total = Math.min(desired, declaredBudget);
    return { total, budget_exceeded: false };
  }

  // No budget declared: return the affordable baseline.
  return { total: baseline, budget_exceeded: false };
}

/**
 * Selects the best-scoring agents for a project from a given pool.
 *
 * Scoring:
 *   - +50 if the agent's role is in the project's required roles
 *   - up to +40 for skill overlap with the required skills
 *   - +20 if the agent is available
 *
 * Returns up to `teamSize` agents, sorted by score descending (available
 * agents break ties).
 */
export function selectBestAgentsFromPool(
  pool: Agent[],
  requiredRoles: string[],
  requiredSkills: string[],
  teamSize: number,
): { selected: Agent[]; matches: MatchResult[] } {
  const lowerSkills = requiredSkills.map((s) => s.toLowerCase());

  const scored = pool.map((agent) => {
    const lowerAgentSkills = agent.skills.map((s) => s.toLowerCase());

    // Role match: big bonus if this agent fills a required role.
    const roleMatch = requiredRoles.includes(agent.agent_role);

    // Skill overlap: how many required skills does this agent have?
    const skillOverlap = lowerSkills.filter((s) =>
      lowerAgentSkills.includes(s),
    ).length;
    const skillScore = requiredSkills.length
      ? (skillOverlap / requiredSkills.length) * 40
      : 0;

    // Availability bonus.
    const availabilityScore = agent.availability === "available" ? 20 : 0;

    const score = Math.round(
      (roleMatch ? 50 : 10) + skillScore + availabilityScore,
    );

    const reason = [
      roleMatch
        ? `exact role match (${agent.agent_role})`
        : `related role (${agent.agent_role})`,
      skillOverlap
        ? `${skillOverlap}/${requiredSkills.length} required skills`
        : null,
      agent.availability === "available" ? "available" : "busy",
    ]
      .filter(Boolean)
      .join("; ");

    return {
      agent,
      match: {
        agent_id: agent.id,
        agent_name: agent.agent_name,
        agent_role: agent.agent_role,
        skills: agent.skills,
        match_score: Math.min(100, score),
        reason,
        availability: agent.availability,
      } satisfies MatchResult,
    };
  });

  // Sort by score descending, then by availability, then by name.
  scored.sort((a, b) => {
    if (b.match.match_score !== a.match.match_score) {
      return b.match.match_score - a.match.match_score;
    }
    if (a.agent.availability !== b.agent.availability) {
      return a.agent.availability === "available" ? -1 : 1;
    }
    return a.agent.agent_name.localeCompare(b.agent.agent_name);
  });

  const top = scored.slice(0, teamSize);
  return {
    selected: top.map((s) => s.agent),
    matches: top.map((s) => s.match),
  };
}

/**
 * Builds the full analysis metadata object. This is the single entry point
 * called after a project is posted.
 *
 * Hybrid: tries to fetch the real registered agent pool from the backend via
 * `listAgents`. If that fails (backend unreachable / demo mode), falls back
 * to `busyDemoPool()` so availability-aware selection still runs. The
 * `agent_source` field in the result tells the UI which path was taken.
 */
export async function buildAnalysisMetadata(params: {
  requiredRoles: string[];
  requiredSkills: string[];
  difficulty: string;
  budget?: string | null;
  deadline?: string | null;
  teamSize: number;
  listAgents: () => Promise<Agent[]>;
}): Promise<{
  analyzed_at: string;
  total_cost: number;
  budget_exceeded: boolean;
  agent_source: "backend" | "demo";
  selected_agent_ids: string[];
  matches: MatchResult[];
}> {
  const { requiredRoles, requiredSkills, difficulty, budget, deadline, teamSize, listAgents } =
    params;

  // Resolve the agent pool: real backend agents if reachable, else demo pool.
  let pool: Agent[] = [];
  let agent_source: "backend" | "demo" = "demo";
  try {
    const agents = await listAgents();
    if (agents && agents.length > 0) {
      pool = agents;
      agent_source = "backend";
    }
  } catch {
    /* fall through to demo pool */
  }
  if (pool.length === 0) {
    pool = busyDemoPool();
    agent_source = "demo";
  }

  const analyzed_at = new Date().toISOString();
  const { selected, matches } = selectBestAgentsFromPool(
    pool,
    requiredRoles,
    requiredSkills,
    teamSize,
  );

  // Cost is based on the selected team only (not every required role), so a
  // small team produces a realistic estimate.
  const { total, budget_exceeded } = computeTotalCost(
    selected.map((a) => a.agent_role),
    difficulty,
    budget,
    deadline,
  );

  return {
    analyzed_at,
    total_cost: total,
    budget_exceeded,
    agent_source,
    selected_agent_ids: selected.map((a) => a.id),
    matches,
  };
}
