"""Agent matching service (legacy API).

Provides the thin wrappers `match_agents` and `best_match` used by the task
router. The full-featured matching logic lives in `matching_service.py`; this
module delegates to it so call-sites don't need updating.
"""

from __future__ import annotations

from app.database import agents
from app.models.schemas import MatchResult
from app.services.matching_service import score_agent as _score_agent


def _infer_project_text() -> str:
    """Best-effort project text for role-keyword matching in the legacy path."""
    from app.database import projects

    parts: list[str] = []
    for row in projects.list():
        parts.append(row.get("description", ""))
        parts.extend(row.get("required_skills", []))
    return " ".join(parts).lower()


def match_agents(
    *,
    required_roles: list[str],
    required_skills: list[str],
    max_agents: int = 5,
) -> list[MatchResult]:
    text = _infer_project_text()
    results = [
        _to_schema(
            _score_agent(
                a,
                required_roles=required_roles,
                required_skills=required_skills,
                recommended_skills=[],
                project_text=text,
            )
        )
        for a in agents.list()
    ]
    results.sort(key=lambda r: r.match_score, reverse=True)
    return results[:max_agents]


def best_match(
    required_roles: list[str],
    required_skills: list[str],
) -> MatchResult | None:
    matches = match_agents(required_roles=required_roles, required_skills=required_skills, max_agents=1)
    return matches[0] if matches else None


def _to_schema(result) -> MatchResult:
    """Convert a matching_service.MatchResult dataclass to the Pydantic schema."""
    return MatchResult(
        agent_id=result.agent_id,
        agent_name=result.agent_name,
        agent_role=result.role,
        skills=result.skills,
        match_score=result.match_score,
        reason=result.reason,
        availability=result.availability,
    )
