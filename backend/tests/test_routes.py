"""Integration tests for backend routes.

Covers every public endpoint with the in-memory database, asserting status
codes, response shapes, and error paths (404 / 422 / 409).
"""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import create_app

client = TestClient(create_app())


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _create_user(name: str = "Alice", email: str = "alice@example.com", role: str = "client") -> str:
    resp = client.post("/api/users", json={"name": name, "email": email, "role": role})
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


def _create_agent(name: str = "Backend Agent", role: str = "Backend Agent") -> str:
    resp = client.post(
        "/api/agents",
        json={
            "agent_name": name,
            "agent_role": role,
            "skills": ["Python", "FastAPI"],
        },
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


def _create_project(
    title: str = "Build dashboard",
    description: str = "React frontend with FastAPI backend",
) -> str:
    resp = client.post(
        "/api/projects",
        json={
            "title": title,
            "description": description,
            "required_skills": ["React", "FastAPI"],
            "budget": "2000",
            "team_size": 3,
        },
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


class TestHealth:
    def test_health_returns_ok(self):
        resp = client.get("/health")
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "ok"
        assert body["app"] == "AgentHub AI"


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------


class TestUsers:
    def test_create_user(self):
        resp = client.post(
            "/api/users",
            json={"name": "Bob", "email": "bob@example.com", "role": "client"},
        )
        assert resp.status_code == 201
        body = resp.json()
        assert body["name"] == "Bob"
        assert body["email"] == "bob@example.com"
        assert body["role"] == "client"
        assert "id" in body
        assert "created_at" in body

    def test_duplicate_email_returns_409(self):
        client.post("/api/users", json={"name": "X", "email": "dup@example.com"})
        resp = client.post("/api/users", json={"name": "Y", "email": "dup@example.com"})
        assert resp.status_code == 409

    def test_invalid_email_returns_422(self):
        resp = client.post("/api/users", json={"name": "Z", "email": "not-an-email"})
        assert resp.status_code == 422

    def test_missing_name_returns_422(self):
        resp = client.post("/api/users", json={"email": "noname@example.com"})
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Agents
# ---------------------------------------------------------------------------


class TestAgents:
    def test_create_agent(self):
        resp = client.post(
            "/api/agents",
            json={
                "agent_name": "ML Agent",
                "agent_role": "AI/ML Agent",
                "skills": ["PyTorch", "LLM"],
            },
        )
        assert resp.status_code == 201
        body = resp.json()
        assert body["agent_name"] == "ML Agent"
        assert body["agent_role"] == "AI/ML Agent"
        assert "PyTorch" in body["skills"]

    def test_list_agents(self):
        resp = client.get("/api/agents")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_list_agents_filter_by_role(self):
        client.post(
            "/api/agents",
            json={"agent_name": "FE", "agent_role": "Frontend Agent", "skills": ["React"]},
        )
        resp = client.get("/api/agents", params={"role": "Frontend Agent"})
        assert resp.status_code == 200
        for agent in resp.json():
            assert agent["agent_role"] == "Frontend Agent"

    def test_get_agent_by_id(self):
        agent_id = _create_agent()
        resp = client.get(f"/api/agents/{agent_id}")
        assert resp.status_code == 200
        assert resp.json()["id"] == agent_id

    def test_get_agent_404(self):
        resp = client.get("/api/agents/does-not-exist")
        assert resp.status_code == 404

    def test_create_agent_with_unknown_user_id_returns_404(self):
        resp = client.post(
            "/api/agents",
            json={
                "agent_name": "Orphan",
                "agent_role": "Backend Agent",
                "user_id": "no-such-user",
            },
        )
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Projects
# ---------------------------------------------------------------------------


class TestProjects:
    def test_create_project(self):
        resp = client.post(
            "/api/projects",
            json={
                "title": "Marketplace",
                "description": "Full-stack marketplace with React and FastAPI",
                "required_skills": ["React", "FastAPI"],
            },
        )
        assert resp.status_code == 201
        body = resp.json()
        assert body["title"] == "Marketplace"
        assert body["status"] == "Draft"

    def test_create_project_missing_title_returns_422(self):
        resp = client.post(
            "/api/projects",
            json={"description": "No title"},
        )
        assert resp.status_code == 422

    def test_create_project_missing_description_returns_422(self):
        resp = client.post(
            "/api/projects",
            json={"title": "No description"},
        )
        assert resp.status_code == 422

    def test_list_projects(self):
        resp = client.get("/api/projects")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_get_project(self):
        project_id = _create_project()
        resp = client.get(f"/api/projects/{project_id}")
        assert resp.status_code == 200
        assert resp.json()["id"] == project_id

    def test_get_project_404(self):
        resp = client.get("/api/projects/does-not-exist")
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Analysis + Matching
# ---------------------------------------------------------------------------


class TestAnalysisAndMatching:
    def test_analyze_project(self):
        project_id = _create_project(
            title="AI dashboard",
            description="React frontend with ML predictions and FastAPI backend",
        )
        resp = client.post(f"/api/projects/{project_id}/analyze")
        assert resp.status_code == 200
        body = resp.json()
        assert body["project_id"] == project_id
        assert len(body["required_roles"]) >= 1
        assert body["difficulty"] in ("Very Low", "Low", "Medium", "High")
        assert body["estimated_timeline"]
        assert body["task_breakdown"]

    def test_analyze_unknown_project_returns_404(self):
        resp = client.post("/api/projects/no-such/analyze")
        assert resp.status_code == 404

    def test_match_agents(self):
        project_id = _create_project(
            title="AI dashboard",
            description="React frontend with ML predictions and FastAPI backend",
        )
        resp = client.post(
            f"/api/projects/{project_id}/match-agents",
            json={"max_agents": 3},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["project_id"] == project_id
        assert isinstance(body["matches"], list)
        assert len(body["matches"]) >= 1
        for m in body["matches"]:
            assert "agent_id" in m
            assert "match_score" in m
            assert "reason" in m

    def test_match_agents_404(self):
        resp = client.post(
            "/api/projects/no-such/match-agents",
            json={"max_agents": 3},
        )
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Tasks + Routing
# ---------------------------------------------------------------------------


class TestTasks:
    def test_route_task(self):
        project_id = _create_project()
        resp = client.post(
            f"/api/projects/{project_id}/route-task",
            json={
                "title": "Build UI",
                "description": "Frontend work",
                "required_role": "Frontend Agent",
                "required_skills": ["React"],
            },
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["project_id"] == project_id
        assert body["task"]["title"] == "Build UI"
        assert body["routed_to"] is not None

    def test_route_task_missing_title_returns_422(self):
        project_id = _create_project()
        resp = client.post(
            f"/api/projects/{project_id}/route-task",
            json={"description": "no title"},
        )
        assert resp.status_code == 422

    def test_route_task_unknown_project_returns_404(self):
        resp = client.post(
            f"/api/projects/no-such/route-task",
            json={"title": "x"},
        )
        assert resp.status_code == 404

    def test_list_tasks(self):
        project_id = _create_project()
        # Seed one task via route-task.
        client.post(
            f"/api/projects/{project_id}/route-task",
            json={"title": "Task A", "required_role": "Backend Agent"},
        )
        resp = client.get(f"/api/projects/{project_id}/tasks")
        assert resp.status_code == 200
        tasks = resp.json()
        assert isinstance(tasks, list)
        assert len(tasks) >= 1
        assert tasks[0]["project_id"] == project_id

    def test_list_tasks_unknown_project_returns_404(self):
        resp = client.get("/api/projects/no-such/tasks")
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Context
# ---------------------------------------------------------------------------


class TestContext:
    def test_add_context(self):
        project_id = _create_project()
        resp = client.post(
            f"/api/projects/{project_id}/context",
            json={
                "context_type": "Brief",
                "content": "Client wants a SaaS dashboard",
                "allowed_agents": [],
            },
        )
        assert resp.status_code == 201
        body = resp.json()
        assert body["project_id"] == project_id
        assert body["context_type"] == "Brief"
        assert body["content"] == "Client wants a SaaS dashboard"

    def test_list_context(self):
        project_id = _create_project()
        client.post(
            f"/api/projects/{project_id}/context",
            json={"context_type": "Brief", "content": "x", "allowed_agents": []},
        )
        resp = client.get(f"/api/projects/{project_id}/context")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
        assert len(resp.json()) >= 1

    def test_context_404(self):
        resp = client.post(
            "/api/projects/no-such/context",
            json={"context_type": "Brief", "content": "x"},
        )
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Standup
# ---------------------------------------------------------------------------


class TestStandup:
    def test_standup_summary(self):
        project_id = _create_project()
        # Seed a task so the summary has something to count.
        client.post(
            f"/api/projects/{project_id}/route-task",
            json={"title": "Task A", "required_role": "Backend Agent"},
        )
        resp = client.get(f"/api/projects/{project_id}/standup-summary")
        assert resp.status_code == 200
        body = resp.json()
        assert body["project_id"] == project_id
        assert body["total_tasks"] >= 1
        assert "summary" in body
        assert "blockers" in body
        assert "next_steps" in body

    def test_standup_404(self):
        resp = client.get("/api/projects/no-such/standup-summary")
        assert resp.status_code == 404
