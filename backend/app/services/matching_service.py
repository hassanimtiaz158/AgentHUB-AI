"""Agent Matching Service.

Scores every registered agent against a project's required roles, skills, and
availability, returning the top matching agents with scores from 0 to 100 and
a human-readable reason for each match.

Scoring model (transparent and explainable):

    score = role_match * 40
          + skill_overlap * 40
          + availability * 20

- role_match: 40 if the agent's role is among the project's required roles,
  10 if the agent's role keywords appear in the project description as a
  partial/related fit, 0 otherwise.
- skill_overlap: 40 * (matched_required_skills / total_required_skills). When
  the project declares no required skills we fall back to the Jaccard
  coefficient between the agent's skills and the project's recommended skills.
- availability: 20 if the agent is marked "available", 0 if "busy".

Every result carries a `reason` string so the UI can explain *why* an agent
was surfaced.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from app.database import _Table, agents, projects
from app.models.schemas import AgentRole


# ---------------------------------------------------------------------------
# Role inference keywords — shared shape with analyzer.py.
# This duplicated map keeps matching_service import-light and substitutable.
# ---------------------------------------------------------------------------

_ROLE_KEYWORDS: dict[str, list[str]] = {
    AgentRole.frontend.value: [
        "frontend", "ui", "react", "tailwind", "css", "html", "landing",
        "dashboard", "web app", "website", "interface", "component",
    ],
    AgentRole.backend.value: [
        "backend", "api", "database", "server", "auth", "graphql", "rest",
        "microservice", "pipeline", "etl", "orm", "caching",
    ],
    AgentRole.ai.value: [
        "ai", "ml", "model", "llm", "gpt", "embedding", "prediction",
        "classification", "recommendation", "nlp", "training", "inference",
    ],
    AgentRole.design.value: [
        "design", "figma", "ui/ux", "ux", "ui", "brand", "prototype",
        "wireframe", "style guide", "visual", "typography",
    ],
    AgentRole.qa.value: [
        "test", "qa", "quality", "automation", "e2e", "integration test",
        "regression", "selenium", "playwright",
    ],
    AgentRole.devops.value: [
        "devops", "docker", "kubernetes", "terraform", "aws", "gcp", "azure",
        "ci/cd", "infrastructure", "deployment", "observability", "helm",
    ],
    AgentRole.marketing.value: [
        "marketing", "seo", "ads", "campaign", "copy", "social media",
        "growth", "launch", "content strategy",
    ],
    AgentRole.pm.value: [
        "project manager", "scrum", "timeline", "coordination", "plan",
        "schedule", "roadmap", "agile", "sprint",
    ],
}


@dataclass
class MatchResult:
    """One agent's match against a project."""

    agent_id: str
    agent_name: str
    role: str
    skills: list[str] = field(default_factory=list)
    match_score: int = 0
    reason: str = ""
    availability: str = "available"


def _normalize(value: str | None) -> str:
    return (value or "").strip().lower()


def _role_match_score(agent_role: str, required_roles: list[str], project_text: str) -> tuple[int, str]:
    """Return (score, reason_fragment) for role matching."""
    agent_role_norm = _normalize(agent_role)

    for required in required_roles:
        if _normalize(required) == agent_role_norm:
            return 40, f"exact role match ({agent_role})"

    keywords = _ROLE_KEYWORDS.get(agent_role, []) or []
    if any(kw in project_text for kw in keywords):
        return 10, f"partial role fit ({agent_role} skills mentioned)"

    return 0, ""


def _skill_overlap_score(
    agent_skills: list[str],
    *,
    required_skills: list[str],
    recommended_skills: list[str],
) -> tuple[int, str]:
    """Return (score, reason_fragment) for skill overlap.

    If the project declares required_skills we measure coverage of those.
    Otherwise we fall back to the Jaccard coefficient over recommended_skills
    so that still-useful agents score something when the project is sparse.
    """
    agent_set = {_normalize(s) for s in agent_skills}

    if required_skills:
        req_set = {_normalize(s) for s in required_skills}
        if not req_set:
            return 0, ""
        matched = agent_set & req_set
        coverage = len(matched) / len(req_set)
        score = int(round(coverage * 40))
        return score, f"{len(matched)}/{len(req_set)} required skills" if matched else ""

    pool = {_normalize(s) for s in recommended_skills}
    if not pool or not agent_set:
        return 0, ""
    intersection = agent_set & pool
    union = agent_set | pool
    jaccard = len(intersection) / len(union) if union else 0.0
    score = int(round(jaccard * 40))
    return score, f"skill overlap with project needs" if intersection else ""


def _availability_score(availability: str) -> tuple[int, str]:
    if _normalize(availability) == "available":
        return 20, "currently available"
    return 0, ""


def score_agent(
    agent: dict,
    *,
    required_roles: list[str],
    required_skills: list[str],
    recommended_skills: list[str],
    project_text: str,
) -> MatchResult:
    role_score, role_reason = _role_match_score(
        agent.get("agent_role", ""), required_roles, project_text
    )
    skill_score, skill_reason = _skill_overlap_score(
        agent.get("skills", []),
        required_skills=required_skills,
        recommended_skills=recommended_skills,
    )
    avail_score, avail_reason = _availability_score(agent.get("availability", ""))

    total = min(100, role_score + skill_score + avail_score)

    parts = [p for p in (role_reason, skill_reason, avail_reason) if p]
    reason = "; ".join(parts) if parts else "candidate on file"

    return MatchResult(
        agent_id=agent["id"],
        agent_name=agent.get("agent_name", ""),
        role=agent.get("agent_role", ""),
        skills=list(agent.get("skills", [])),
        match_score=total,
        reason=reason,
        availability=agent.get("availability", "available"),
    )


def match_project(
    *,
    project_id: str,
    required_roles: list[str],
    required_skills: list[str],
    recommended_skills: list[str],
    project_text: str,
    max_agents: int = 8,
) -> list[MatchResult]:
    """Score all registered agents against a project and return the top `max_agents`."""
    results = [
        score_agent(
            a,
            required_roles=required_roles,
            required_skills=required_skills,
            recommended_skills=recommended_skills,
            project_text=project_text,
        )
        for a in agents.list()
    ]
    results.sort(key=lambda r: r.match_score, reverse=True)
    return results[:max_agents]


def ensure_demo_agents(*, table: _Table | None = None) -> list[dict]:
    """Seed the agents table with 8 demo agents if none exist yet.

    Idempotent: if the table already contains rows it is left untouched, so it
    is safe to call on every startup. Returns the current agent rows.
    """
    store = table or agents
    if store.list():
        return store.list()

    demo: list[dict] = [
        {
            "agent_name": "Frontend Agent",
            "agent_role": AgentRole.frontend.value,
            "skills": ["React", "TypeScript", "Tailwind CSS", "HTML/CSS", "Next.js"],
            "availability": "available",
            "description": "Builds modern, responsive web interfaces and design systems.",
        },
        {
            "agent_name": "Backend Agent",
            "agent_role": AgentRole.backend.value,
            "skills": ["Python", "FastAPI", "PostgreSQL", "REST APIs", "Redis"],
            "availability": "available",
            "description": "Designs scalable APIs, data models, and server-side business logic.",
        },
        {
            "agent_name": "AI/ML Agent",
            "agent_role": AgentRole.ai.value,
            "skills": ["PyTorch", "LLM", "NLP", "Vector DBs", "Prompt Engineering"],
            "availability": "available",
            "description": "Ships ML models, RAG pipelines, and AI-powered features.",
        },
        {
            "agent_name": "UI/UX Agent",
            "agent_role": AgentRole.design.value,
            "skills": ["Figma", "User Research", "Wireframing", "Prototyping", "Accessibility"],
            "availability": "available",
            "description": "Creates intuitive interfaces, prototypes, and design systems.",
        },
        {
            "agent_name": "QA Agent",
            "agent_role": AgentRole.qa.value,
            "skills": ["Test Automation", "Cypress", "Playwright", "API Testing", "CI/CD"],
            "availability": "available",
            "description": "Owns quality with automated end-to-end and integration test suites.",
        },
        {
            "agent_name": "DevOps Agent",
            "agent_role": AgentRole.devops.value,
            "skills": ["Docker", "Kubernetes", "CI/CD", "Terraform", "AWS"],
            "availability": "available",
            "description": "Runs infra, deployments, and observability so teams ship reliably.",
        },
        {
            "agent_name": "Marketing Agent",
            "agent_role": AgentRole.marketing.value,
            "skills": ["SEO", "Content Strategy", "Social Media", "Ads", "Copywriting"],
            "availability": "available",
            "description": "Drives acquisition with campaigns, content, and growth experiments.",
        },
        {
            "agent_name": "Project Manager Agent",
            "agent_role": AgentRole.pm.value,
            "skills": ["Scrum", "Roadmapping", "Stakeholder Management", "Risk Management", "Agile"],
            "availability": "available",
            "description": "Keeps work scoped, prioritized, and on track from kickoff to launch.",
        },
    ]

    for row in demo:
        store.insert(row)

    return store.list()
