"""Aicoo coordination endpoints.

Exposes the Aicoo integration service over HTTP. The centerpiece is the
routing endpoint, which returns a uniform envelope showing where the request
was routed, what context was shared, why, and whether real or mock mode ran.
"""

from fastapi import APIRouter, HTTPException

from app.database import projects
from app.models.schemas import AicooRouteRequest, AicooRouteResponse
from app.services.aicoo_service import route_request

router = APIRouter(prefix="/api/projects", tags=["aicoo"])


@router.post("/{project_id}/aicoo/route", response_model=AicooRouteResponse)
def aicoo_route(project_id: str, payload: AicooRouteRequest):
    row = projects.get(project_id)
    if not row:
        raise HTTPException(status_code=404, detail="project not found")

    context = payload.project_context or row["description"]

    # route_request now degrades to mock on real-mode failures, so this call
    # never raises in normal operation.
    result = route_request(
        project_context=context,
        target_agent=payload.target_agent,
    )

    return AicooRouteResponse(
        project_id=project_id,
        routed_to=result.get("routed_to", {}),
        shared_context={
            "project_context": context,
            "required_skills": payload.required_skills,
        },
        routing_reason=result.get("routing_reason", ""),
        status=result.get("status", "ok"),
        mode="mock" if result.get("mock") else "real",
    )
