from fastapi import APIRouter, HTTPException

from app.database import projects
from app.models.schemas import (
    AnalyzeResponse,
    ContextCreate,
    ContextResponse,
    MatchRequest,
    MatchResponse,
    MatchResult,
    ProjectCreate,
    ProjectResponse,
    RouteTaskRequest,
    RouteTaskResponse,
    TaskResponse,
)
from app.services.ai_analyzer import analyze as analyze_project_ai
from app.services.analyzer import analyze_project
from app.services.context_store import create_context, list_context
from app.services.matching_service import ensure_demo_agents, match_project
from app.services.router import route_task
from app.services.standup import generate_standup

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.post("", response_model=ProjectResponse, status_code=201)
def create_project(payload: ProjectCreate):
    if not payload.title or not payload.title.strip():
        raise HTTPException(status_code=422, detail="title is required")
    if not payload.description or not payload.description.strip():
        raise HTTPException(status_code=422, detail="description is required")

    forced_id = payload.id.strip() if payload.id else None
    row = projects.insert({
        "id": forced_id,
        "client_id": payload.client_id,
        "title": payload.title.strip(),
        "description": payload.description.strip(),
        "required_skills": list(payload.required_skills or []),
        "budget": payload.budget or "",
        "deadline": payload.deadline.isoformat() if payload.deadline else None,
        "team_size": max(1, payload.team_size or 1),
        "status": "Draft",
    })
    return ProjectResponse(**row)


@router.get("", response_model=list[ProjectResponse])
def list_projects(status: str | None = None):
    rows = projects.list()
    if status:
        rows = [r for r in rows if r["status"].lower() == status.lower()]
    return [ProjectResponse(**r) for r in rows]


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str):
    row = projects.get(project_id)
    if not row:
        raise HTTPException(status_code=404, detail="project not found")
    return ProjectResponse(**row)


@router.post("/{project_id}/analyze", response_model=AnalyzeResponse)
def analyze_project_route(project_id: str):
    row = projects.get(project_id)
    if not row:
        raise HTTPException(status_code=404, detail="project not found")

    result = analyze_project_ai(
        title=row["title"],
        description=row["description"],
        required_skills=row["required_skills"],
        budget=row["budget"],
        deadline=row["deadline"],
    )
    projects.update(project_id, {"status": "Matching"})
    return AnalyzeResponse(project_id=project_id, **result.to_dict())


@router.post("/{project_id}/match-agents", response_model=MatchResponse)
def match_agents_for_project(project_id: str, payload: MatchRequest = MatchRequest()):
    row = projects.get(project_id)
    if not row:
        raise HTTPException(status_code=404, detail="project not found")

    # Ensure demo agents exist so there's always something to match against.
    ensure_demo_agents()

    analysis = analyze_project(
        title=row["title"],
        description=row["description"],
        required_skills=row["required_skills"],
    )

    project_text = f"{row['title']} {row['description']}".lower()
    matches = match_project(
        project_id=project_id,
        required_roles=analysis["required_roles"],
        required_skills=row["required_skills"],
        recommended_skills=analysis["recommended_skills"],
        project_text=project_text,
        max_agents=payload.max_agents,
    )

    return MatchResponse(
        project_id=project_id,
        project_title=row["title"],
        matches=[
            MatchResult(
                agent_id=m.agent_id,
                agent_name=m.agent_name,
                agent_role=m.role,
                skills=m.skills,
                match_score=m.match_score,
                reason=m.reason,
                availability=m.availability,
            )
            for m in matches
        ],
    )


@router.post("/{project_id}/route-task", response_model=RouteTaskResponse)
def route_task_to_agent(project_id: str, payload: RouteTaskRequest):
    row = projects.get(project_id)
    if not row:
        raise HTTPException(status_code=404, detail="project not found")
    if not payload.title or not payload.title.strip():
        raise HTTPException(status_code=422, detail="title is required")

    result = route_task(project_id=project_id, request=payload)
    projects.update(project_id, {"status": "Active"})
    return result


@router.get("/{project_id}/standup-summary")
def standup_summary(project_id: str):
    row = projects.get(project_id)
    if not row:
        raise HTTPException(status_code=404, detail="project not found")
    return generate_standup(project_id)


@router.post("/{project_id}/context", response_model=ContextResponse, status_code=201)
def add_context(project_id: str, payload: ContextCreate):
    row = projects.get(project_id)
    if not row:
        raise HTTPException(status_code=404, detail="project not found")
    return create_context(project_id=project_id, request=payload)


@router.get("/{project_id}/context", response_model=list[ContextResponse])
def list_project_context(project_id: str, agent_id: str | None = None):
    row = projects.get(project_id)
    if not row:
        raise HTTPException(status_code=404, detail="project not found")
    return list_context(project_id=project_id, agent_id=agent_id)


@router.get("/{project_id}/tasks", response_model=list[TaskResponse])
def list_project_tasks(project_id: str):
    row = projects.get(project_id)
    if not row:
        raise HTTPException(status_code=404, detail="project not found")
    from app.database import tasks
    return [TaskResponse(**t) for t in tasks.find(project_id=project_id)]
