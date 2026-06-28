"""Unit tests for the Task Router service."""

from __future__ import annotations

from app.database import _Table
from app.models.schemas import AgentRole, RouteTaskRequest
from app.services.router import route_task


class TestRouteTask:
    def test_routes_to_best_match(self):
        # Use fresh tables to avoid cross-test pollution.
        fresh_agents = _Table()
        fresh_tasks = _Table()
        fresh_agents.insert({
            "id": "fe-1",
            "agent_name": "Frontend Agent",
            "agent_role": AgentRole.frontend.value,
            "skills": ["React", "Tailwind"],
            "availability": "available",
        })

        # Monkey-patch both tables used by the router → matcher chain.
        import app.services.router as router_mod
        import app.services.matcher as matcher_mod
        orig_router_tasks = router_mod.tasks
        orig_matcher_agents = matcher_mod.agents
        router_mod.tasks = fresh_tasks
        matcher_mod.agents = fresh_agents
        try:
            result = route_task(
                project_id="proj-1",
                request=RouteTaskRequest(
                    title="Build UI",
                    description="Dashboard",
                    required_role=AgentRole.frontend,
                    required_skills=["React"],
                ),
            )
        finally:
            router_mod.tasks = orig_router_tasks
            matcher_mod.agents = orig_matcher_agents

        assert result.project_id == "proj-1"
        assert result.task.title == "Build UI"
        assert result.task.project_id == "proj-1"
        assert result.routed_to is not None
        assert result.routed_to.agent_id == "fe-1"

    def test_routes_without_match_still_creates_task(self):
        # Empty agents table → best_match returns None.
        fresh_agents = _Table()
        fresh_tasks = _Table()

        import app.services.router as router_mod
        import app.services.matcher as matcher_mod
        orig_router_tasks = router_mod.tasks
        orig_matcher_agents = matcher_mod.agents
        router_mod.tasks = fresh_tasks
        matcher_mod.agents = fresh_agents
        try:
            result = route_task(
                project_id="proj-2",
                request=RouteTaskRequest(
                    title="Solo task",
                    description="No agent fits",
                ),
            )
        finally:
            router_mod.tasks = orig_router_tasks
            matcher_mod.agents = orig_matcher_agents

        assert result.task.title == "Solo task"
        assert result.routed_to is None
