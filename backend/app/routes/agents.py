from fastapi import APIRouter, HTTPException

from app.database import agents, users
from app.models.schemas import AgentCreate, AgentResponse

router = APIRouter(prefix="/api/agents", tags=["agents"])


@router.post("", response_model=AgentResponse, status_code=201)
def create_agent(payload: AgentCreate):
    if not payload.agent_name or not payload.agent_name.strip():
        raise HTTPException(status_code=422, detail="agent_name is required")

    if payload.user_id:
        existing_user = users.get(payload.user_id)
        if not existing_user:
            raise HTTPException(status_code=404, detail="user_id not found")

    row = agents.insert({
        "user_id": payload.user_id,
        "agent_name": payload.agent_name.strip(),
        "agent_role": payload.agent_role.value,
        "skills": list(payload.skills or []),
        "availability": payload.availability.value,
        "description": payload.description or "",
        "aicoo_agent_id": None,
    })
    return AgentResponse(**row)


@router.get("", response_model=list[AgentResponse])
def list_agents(role: str | None = None, available: bool | None = None):
    rows = agents.list()
    if role:
        rows = [r for r in rows if r["agent_role"].lower() == role.lower()]
    if available is not None:
        rows = [r for r in rows if (r["availability"] == "available") == available]
    return [AgentResponse(**r) for r in rows]


@router.get("/{agent_id}", response_model=AgentResponse)
def get_agent(agent_id: str):
    row = agents.get(agent_id)
    if not row:
        raise HTTPException(status_code=404, detail="agent not found")
    return AgentResponse(**row)
