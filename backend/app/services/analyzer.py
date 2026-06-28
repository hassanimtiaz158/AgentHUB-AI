"""AI project analyzer.

Produces a structured breakdown of a project: required roles, difficulty,
recommended skills, and a task breakdown. Today this is a deterministic,
rule-based implementation that does not call an external model — it keeps
the demo deterministic and offline-friendly. The function signature is the
shape an LLM-backed replacement would take, so swapping it in is a one-line
change in the route.
"""

from __future__ import annotations

from typing import Any

from app.models.schemas import AgentRole


# Keyword → role heuristics. Order matters: first match wins for scoring.
_ROLE_KEYWORDS: dict[str, list[str]] = {
    AgentRole.frontend.value: [
        "frontend", "ui", "react", "tailwind", "css", "html", "landing",
        "dashboard", "web app", "website", "interface",
    ],
    AgentRole.backend.value: [
        "backend", "api", "database", "server", "auth", "graphql", "rest",
        "microservice", "pipeline", "etl",
    ],
    AgentRole.ai.value: [
        "ai", "ml", "model", "llm", "gpt", "embedding", "prediction",
        "classification", "recommendation", "nlp",
    ],
    AgentRole.design.value: [
        "design", "figma", "ui/ux", "ux", "ui", "brand", "prototype",
        "wireframe", "style guide",
    ],
    AgentRole.qa.value: [
        "test", "qa", "quality", "automation", "e2e", "integration test",
        "regression",
    ],
    AgentRole.devops.value: [
        "devops", "docker", "kubernetes", "terraform", "aws", "gcp", "azure",
        "ci/cd", "infrastructure", "deployment", "observability", "helm",
    ],
    AgentRole.marketing.value: [
        "marketing", "seo", "ads", "campaign", "copy", "social media",
        "growth", "launch",
    ],
    AgentRole.pm.value: [
        "project manager", "scrum", "timeline", "coordination", "plan",
        "schedule", "roadmap",
    ],
}

_DIFFICULTY_VERY_LOW = "Very Low"
_DIFFICULTY_LOW = "Low"
_DIFFICULTY_MEDIUM = "Medium"
_DIFFICULTY_HIGH = "High"


def _infer_roles(description: str, skills: list[str]) -> list[str]:
    text = " ".join([description, *skills]).lower()
    found: set[str] = set()
    for role, keywords in _ROLE_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            found.add(role)
    return list(found) or [AgentRole.backend.value]


def _infer_difficulty(roles: list[str], description: str) -> str:
    n = len(roles)
    long_desc = len(description) > 400
    if n >= 5 or (n >= 3 and long_desc):
        return _DIFFICULTY_HIGH
    if n >= 3:
        return _DIFFICULTY_MEDIUM
    if n == 2:
        return _DIFFICULTY_LOW
    return _DIFFICULTY_VERY_LOW


def _build_task_breakdown(roles: list[str], title: str) -> list[dict[str, Any]]:
    tasks: list[dict[str, Any]] = []
    for role in roles:
        tasks.append({
            "title": f"{role} work for {title}",
            "role": role,
            "status": "Todo",
        })
    return tasks


def analyze_project(
    *,
    title: str,
    description: str,
    required_skills: list[str],
) -> dict[str, Any]:
    """Return a structured analysis payload ready for `AnalyzeResponse`."""
    roles = _infer_roles(description, required_skills)
    skills = sorted(set(required_skills) | {r.split(" ")[0].lower() for r in roles})
    return {
        "summary": f"{title} requires {len(roles)} role(s): {', '.join(roles)}.",
        "required_roles": roles,
        "difficulty": _infer_difficulty(roles, description),
        "recommended_skills": skills,
        "task_breakdown": _build_task_breakdown(roles, title),
    }
