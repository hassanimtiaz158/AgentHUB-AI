"""Task routing service.

Picks the best agent for a task and persists a row in the `tasks` table.
The routing decision is delegated to `services.matcher`; this service is
concerned with recording the decision and producing the API response.
"""

from __future__ import annotations

from app.database import tasks
from app.models.schemas import RouteTaskRequest, RouteTaskResponse, TaskResponse
from app.services.matcher import best_match


def route_task(
    *,
    project_id: str,
    request: RouteTaskRequest,
) -> RouteTaskResponse:
    required_role = [request.required_role.value] if request.required_role else []
    match = best_match(
        required_roles=required_role,
        required_skills=request.required_skills,
    )

    task_row = tasks.insert({
        "project_id": project_id,
        "assigned_agent_id": match.agent_id if match else None,
        "title": request.title,
        "description": request.description,
        "status": "Todo",
    })

    return RouteTaskResponse(
        project_id=project_id,
        task=TaskResponse(**task_row),
        routed_to=match,
    )
