"""Project context storage.

Handles creation and retrieval of shared context rows, including the
`allowed_agents` permission check: a consumer can request context for a
given agent_id, and rows without that agent in `allowed_agents` are filtered
out.
"""

from __future__ import annotations

from app.database import contexts
from app.models.schemas import ContextCreate, ContextResponse


def create_context(
    *,
    project_id: str,
    request: ContextCreate,
) -> ContextResponse:
    row = contexts.insert({
        "project_id": project_id,
        "context_type": request.context_type.value,
        "content": request.content,
        "allowed_agents": list(request.allowed_agents or []),
    })
    return ContextResponse(**row)


def list_context(
    *,
    project_id: str,
    agent_id: str | None = None,
) -> list[ContextResponse]:
    rows = contexts.find(project_id=project_id)
    if agent_id:
        rows = [
            r for r in rows
            if not r["allowed_agents"] or agent_id in r["allowed_agents"]
        ]
    return [ContextResponse(**r) for r in rows]
