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
import type { Agent, MatchResult } from "./types";

/** Hourly rate (USD) used to estimate cost per agent role. */
const ROLE_HOURLY_RATE: Record<string, number> = {
  "Frontend Agent": 85,
  "Backend Agent": 95,
  "AI/ML Agent": 120,
  "UI/UX Agent": 75,
  "QA Agent": 70,
  "DevOps Agent": 110,
  "Marketing Agent": 65,
  "Project Manager Agent": 90,
  "Cloud Agent": 115,
  "Mobile App Agent": 90,
  "Data Engineer Agent": 105,
  "Security Agent": 125,
};

const DEFAULT_HOURLY_RATE = 85;

/** Difficulty multiplier applied to the base timeline/cost estimate. */
const DIFFICULTY_MULTIPLIER: Record<string, number> = {
  "Very Low": 0.7,
  Low: 0.85,
  Medium: 1.0,
  High: 1.35,
};

/** Base hours per role for a "Medium" difficulty project. */
const BASE_HOURS_PER_ROLE = 120;

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
 * The model assumes each required role works a number of hours proportional
 * to the project difficulty, billed at the role's hourly rate. The user's
 * declared budget (if any) is returned alongside so the caller can decide
 * whether the estimate exceeds it.
 */
export function computeTotalCost(
  requiredRoles: string[],
  difficulty: string,
  budget?: string | null,
): { total: number; budget_exceeded: boolean } {
  const difficultyMult = DIFFICULTY_MULTIPLIER[difficulty] ?? 1.0;
  let total = 0;

  for (const role of requiredRoles) {
    const rate = ROLE_HOURLY_RATE[role] ?? DEFAULT_HOURLY_RATE;
    const hours = BASE_HOURS_PER_ROLE * difficultyMult;
    total += Math.round(rate * hours);
  }

  const declaredBudget = budget ? parseInt(budget, 10) : null;
  const budget_exceeded =
    declaredBudget !== null && !isNaN(declaredBudget) && total > declaredBudget;

  return { total, budget_exceeded };
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
  const { requiredRoles, requiredSkills, difficulty, budget, teamSize, listAgents } =
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
  const { total, budget_exceeded } = computeTotalCost(
    requiredRoles,
    difficulty,
    budget,
  );
  const { selected, matches } = selectBestAgentsFromPool(
    pool,
    requiredRoles,
    requiredSkills,
    teamSize,
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
