// Typed API client for the AgentHub AI backend.
//
// Every function tries the backend first. If it is unreachable (e.g. backend
// isn't running during a frontend-only demo), the `usingDemoFallback` flag on
// the response is set and demo data from `demo-data.ts` is returned so the UI
// always has something to render.

import { demoAnalysis, demoStandup, buildDemoMatches, demoTasks } from "./demo-data";
import type {
  Agent,
  Analysis,
  AicooRouteResponse,
  MatchResponse,
  Project,
  Standup,
  Task,
} from "./types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export interface ApiEnvelope<T> {
  ok: boolean;
  status: number;
  usingDemoFallback: boolean;
  data: T | null;
  error: string | null;
}

async function safeFetch<T>(
  path: string,
  init?: RequestInit,
  fallback?: () => T,
): Promise<ApiEnvelope<T>> {
  try {
    const resp = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    if (!resp.ok) {
      let text = "";
      try {
        text = await resp.text();
      } catch {
        /* ignore */
      }
      if (fallback) {
        return {
          ok: true,
          status: resp.status,
          usingDemoFallback: true,
          data: fallback(),
          error: null,
        };
      }
      return {
        ok: false,
        status: resp.status,
        usingDemoFallback: false,
        data: null,
        error: text || `Request failed: ${resp.status}`,
      };
    }
    const data = await resp.json();
    return { ok: true, status: resp.status, usingDemoFallback: false, data, error: null };
  } catch (err) {
    if (fallback) {
      return {
        ok: true,
        status: 0,
        usingDemoFallback: true,
        data: fallback(),
        error: null,
      };
    }
    return {
      ok: false,
      status: 0,
      usingDemoFallback: false,
      data: null,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

// ---------------------------------------------------------------------------
// Agents
// ---------------------------------------------------------------------------
export interface ListAgentsParams {
  role?: string;
  available?: boolean;
}

export async function listAgents(params: ListAgentsParams = {}): Promise<ApiEnvelope<Agent[]>> {
  const qs = new URLSearchParams();
  if (params.role) qs.set("role", params.role);
  if (params.available !== undefined) qs.set("available", String(params.available));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return safeFetch<Agent[]>(`/api/agents${suffix}`, undefined, () => []);
}

export async function createAgent(
  payload: Omit<Agent, "id" | "agent_id"> & { user_id?: string },
): Promise<ApiEnvelope<Agent>> {
  // Map the frontend Agent shape to the backend AgentCreate schema.
  const body = {
    user_id: payload.user_id,
    agent_name: payload.agent_name,
    agent_role: payload.agent_role,
    skills: payload.skills,
    availability: payload.availability,
    description: payload.description ?? "",
  };
  return safeFetch<Agent>("/api/agents", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------
export async function createProject(payload: {
  id?: string;
  title: string;
  description: string;
  required_skills: string[];
  budget?: string;
  deadline?: string;
  team_size?: number;
}): Promise<ApiEnvelope<Project>> {
  return safeFetch<Project>("/api/projects", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listProjects(): Promise<ApiEnvelope<Project[]>> {
  return safeFetch<Project[]>("/api/projects", undefined, () => []);
}

export async function getProject(id: string): Promise<ApiEnvelope<Project>> {
  return safeFetch<Project>(`/api/projects/${id}`);
}

// ---------------------------------------------------------------------------
// Analysis + Matching
// ---------------------------------------------------------------------------
export async function analyzeProject(id: string): Promise<ApiEnvelope<Analysis>> {
  return safeFetch<Analysis>(
    `/api/projects/${id}/analyze`,
    { method: "POST" },
    () => ({ ...demoAnalysis, project_id: id }),
  );
}

export async function matchAgents(
  id: string,
  maxAgents = 8,
): Promise<ApiEnvelope<MatchResponse>> {
  return safeFetch<MatchResponse>(
    `/api/projects/${id}/match-agents`,
    { method: "POST", body: JSON.stringify({ max_agents: maxAgents }) },
    () => buildDemoMatches(),
  );
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------
export async function listTasks(projectId: string): Promise<ApiEnvelope<Task[]>> {
  return safeFetch<Task[]>(`/api/projects/${projectId}/tasks`, undefined, () =>
    demoTasks.filter((t) => t.project_id === projectId),
  );
}

export async function routeTask(
  projectId: string,
  payload: {
    title: string;
    description?: string;
    required_role?: string;
    required_skills?: string[];
  },
): Promise<ApiEnvelope<{ project_id: string; task: Task; routed_to: unknown }>> {
  return safeFetch(`/api/projects/${projectId}/route-task`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------
// Standup
// ---------------------------------------------------------------------------
export async function standupSummary(projectId: string): Promise<ApiEnvelope<Standup>> {
  return safeFetch<Standup>(
    `/api/projects/${projectId}/standup-summary`,
    undefined,
    () => ({ ...demoStandup, project_id: projectId }),
  );
}

// ---------------------------------------------------------------------------
// Aicoo
// ---------------------------------------------------------------------------
export async function aicooRoute(
  projectId: string,
  targetAgent: string,
  projectContext?: string,
  requiredSkills: string[] = [],
): Promise<ApiEnvelope<AicooRouteResponse>> {
  return safeFetch<AicooRouteResponse>(
    `/api/projects/${projectId}/aicoo/route`,
    {
      method: "POST",
      body: JSON.stringify({
        target_agent: targetAgent,
        project_context: projectContext ?? "",
        required_skills: requiredSkills,
      }),
    },
    () => ({
      project_id: projectId,
      routed_to: { agent: targetAgent, mock: true },
      shared_context: { project_context: projectContext ?? "", required_skills: requiredSkills },
      routing_reason: `mock: '${targetAgent}' best fits the requested context`,
      status: "ok",
      mode: "mock",
    }),
  );
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------
export async function healthCheck(): Promise<ApiEnvelope<{ status: string; app: string }>> {
  return safeFetch("/health", undefined, () => ({ status: "demo", app: "AgentHub AI" }));
}
