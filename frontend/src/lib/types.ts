// Backend-aligned TypeScript types for the AgentHub AI frontend.

export type AgentRole =
  | "Frontend Agent"
  | "Backend Agent"
  | "AI/ML Agent"
  | "UI/UX Agent"
  | "QA Agent"
  | "DevOps Agent"
  | "Marketing Agent"
  | "Project Manager Agent"
  | "Cloud Agent"
  | "Mobile App Agent"
  | "Data Engineer Agent"
  | "Security Agent";

export type Availability = "available" | "busy";

export type ProjectStatus = "Draft" | "Matching" | "Active" | "Completed";

export type TaskStatus = "Todo" | "In Progress" | "Done";

// ---------------------------------------------------------------------------
// Agent
// ---------------------------------------------------------------------------
export interface Agent {
  id: string;
  agent_id?: string;
  agent_name: string;
  agent_role: AgentRole;
  skills: string[];
  availability: Availability;
  description: string;
}

// ---------------------------------------------------------------------------
// Project
// ---------------------------------------------------------------------------
export interface Project {
  id: string;
  title: string;
  description: string;
  required_skills: string[];
  budget: string;
  deadline: string | null;
  team_size: number;
  status: ProjectStatus;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------
export interface Analysis {
  project_id: string;
  summary: string;
  required_roles: AgentRole[];
  difficulty: "Very Low" | "Low" | "Medium" | "High";
  recommended_skills: string[];
  task_breakdown: Array<{
    title: string;
    role: AgentRole;
    status: TaskStatus;
  }>;
  estimated_timeline?: string;
  /** ISO timestamp of when the analysis was performed. */
  analyzed_at?: string;
  /** Estimated total cost for the project based on team composition and timeline. */
  total_cost?: number;
  /** IDs of the best-scoring agents selected by the system for this project. */
  selected_agent_ids?: string[];
  /** True when the computed total_cost exceeds the user's declared budget. */
  budget_exceeded?: boolean;
  /** Where the selected-agent pool came from. */
  agent_source?: "backend" | "demo";
}

// ---------------------------------------------------------------------------
// Saved project (a project the user has finished the flow for and persisted
// to the dashboard so they can track progress on it).
// ---------------------------------------------------------------------------
export interface SavedProject {
  id: string;
  title: string;
  description: string;
  required_skills: string[];
  budget: string;
  deadline: string | null;
  team_size: number;
  status: ProjectStatus;
  difficulty: string;
  total_cost: number | null;
  /** IDs of the agents selected for this project. */
  selected_agent_ids: string[];
  tasks: Task[];
  saved_at: string;
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------
export interface MatchResult {
  agent_id: string;
  agent_name: string;
  agent_role: AgentRole;
  skills: string[];
  match_score: number;
  reason: string;
  availability: Availability;
}

export interface MatchResponse {
  project_id: string;
  project_title?: string;
  matches: MatchResult[];
}

// ---------------------------------------------------------------------------
// Routing (Aicoo)
// ---------------------------------------------------------------------------
export interface AicooRouteResponse {
  project_id: string;
  routed_to: Record<string, unknown>;
  shared_context: Record<string, unknown>;
  routing_reason: string;
  status: string;
  mode: "real" | "mock";
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------
export interface Task {
  id: string;
  project_id: string;
  assigned_agent_id: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Standup
// ---------------------------------------------------------------------------
export interface Standup {
  project_id: string;
  generated_at: string;
  total_tasks: number;
  completed: number;
  in_progress: number;
  todo: number;
  summary: string;
  blockers: string[];
  next_steps: string[];
}
