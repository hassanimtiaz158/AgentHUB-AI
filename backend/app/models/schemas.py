"""Pydantic request / response schemas.

Validation rules live here — routes only depend on these types, never on raw
dicts. Keep field names aligned with `app.database._Table` column names so
service code can pass row dicts straight into response models via `**row`.
"""

from __future__ import annotations

from datetime import date
from enum import Enum
from typing import Any

from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------


class UserRole(str, Enum):
    freelancer = "freelancer"
    client = "client"
    founder = "founder"


class AgentRole(str, Enum):
    frontend = "Frontend Agent"
    backend = "Backend Agent"
    ai = "AI/ML Agent"
    design = "UI/UX Agent"
    qa = "QA Agent"
    devops = "DevOps Agent"
    marketing = "Marketing Agent"
    pm = "Project Manager Agent"


class Availability(str, Enum):
    available = "available"
    busy = "busy"


class ProjectStatus(str, Enum):
    draft = "Draft"
    matching = "Matching"
    active = "Active"
    completed = "Completed"


class TaskStatus(str, Enum):
    todo = "Todo"
    in_progress = "In Progress"
    done = "Done"


class ContextType(str, Enum):
    brief = "Brief"
    message = "Message"
    summary = "Summary"
    decision = "Decision"


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------


class UserCreate(BaseModel):
    name: str
    email: str
    role: UserRole | None = UserRole.client


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    created_at: str

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Agents
# ---------------------------------------------------------------------------


class AgentCreate(BaseModel):
    user_id: str | None = None
    agent_name: str
    agent_role: AgentRole
    skills: list[str] = []
    availability: Availability = Availability.available
    description: str = ""


class AgentResponse(BaseModel):
    id: str
    user_id: str | None = None
    agent_name: str
    agent_role: str
    skills: list[str] = []
    availability: str = "available"
    description: str = ""
    aicoo_agent_id: str | None = None
    created_at: str = ""


# ---------------------------------------------------------------------------
# Projects
# ---------------------------------------------------------------------------


class ProjectCreate(BaseModel):
    id: str | None = None
    client_id: str | None = None
    title: str
    description: str
    required_skills: list[str] = []
    budget: str = ""
    deadline: date | None = None
    team_size: int = 1


class ProjectResponse(BaseModel):
    id: str
    client_id: str | None
    title: str
    description: str
    required_skills: list[str]
    budget: str
    deadline: str | None
    team_size: int
    status: str
    created_at: str


# ---------------------------------------------------------------------------
# Analysis / Matching / Routing
# ---------------------------------------------------------------------------


class AnalyzeResponse(BaseModel):
    project_id: str
    summary: str
    required_roles: list[str]
    difficulty: str
    recommended_skills: list[str]
    task_breakdown: list[dict[str, Any]]
    estimated_timeline: str = ""
    suggested_agents: list[dict[str, Any]] = []
    source: str = "fallback"


class MatchRequest(BaseModel):
    max_agents: int = 5


class MatchResult(BaseModel):
    agent_id: str
    agent_name: str
    agent_role: str
    skills: list[str] = []
    match_score: int = 0
    reason: str
    availability: str = "available"


class MatchResponse(BaseModel):
    project_id: str
    project_title: str = ""
    matches: list[MatchResult]


class RouteTaskRequest(BaseModel):
    title: str
    description: str = ""
    required_role: AgentRole | None = None
    required_skills: list[str] = []


class TaskResponse(BaseModel):
    id: str
    project_id: str
    assigned_agent_id: str | None
    title: str
    description: str
    status: str
    created_at: str


class RouteTaskResponse(BaseModel):
    project_id: str
    task: TaskResponse
    routed_to: MatchResult | None


# ---------------------------------------------------------------------------
# Context
# ---------------------------------------------------------------------------


class ContextCreate(BaseModel):
    context_type: ContextType
    content: str
    allowed_agents: list[str] = []


class ContextResponse(BaseModel):
    id: str
    project_id: str
    context_type: str
    content: str
    allowed_agents: list[str]
    created_at: str


# ---------------------------------------------------------------------------
# Standup
# ---------------------------------------------------------------------------


class StandupResponse(BaseModel):
    project_id: str
    generated_at: str
    total_tasks: int
    completed: int
    in_progress: int
    todo: int
    summary: str
    blockers: list[str]
    next_steps: list[str]


# ---------------------------------------------------------------------------
# Aicoo coordination layer
# ---------------------------------------------------------------------------


class AicooAgentCreate(BaseModel):
    agent_name: str
    owner: str = ""
    skills: list[str] = []
    agent_role: str = ""
    description: str = ""


class AicooRouteRequest(BaseModel):
    target_agent: str
    project_context: str = ""
    required_skills: list[str] = []


class AicooRouteResponse(BaseModel):
    project_id: str
    routed_to: dict[str, Any] = {}
    shared_context: dict[str, Any] = {}
    routing_reason: str = ""
    status: str = "ok"
    mode: str = "mock"  # "real" | "mock"


class AicooContextShareRequest(BaseModel):
    project_id: str
    context: str
    allowed_agents: list[str] = []


class AicooMessageRequest(BaseModel):
    from_agent: str
    to_agent: str
    message: str
    project_id: str = ""


class AicooMessageResponse(BaseModel):
    from_agent: str
    to_agent: str
    message: str
    delivered: bool = False
    mode: str = "mock"  # "real" | "mock"
