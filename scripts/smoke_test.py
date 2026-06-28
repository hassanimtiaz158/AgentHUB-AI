"""End-to-end smoke test for the AgentHub AI backend.

Runs against a local server on http://127.0.0.1:8000 (override with $BASE_URL).
Exits non-zero on the first failed assertion.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request

BASE = os.environ.get("BASE_URL", "http://127.0.0.1:8000")


def req(method: str, path: str, body=None) -> tuple[int, dict | str]:
    url = BASE + path
    data = None
    headers = {}
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            raw = resp.read().decode("utf-8")
            return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8")
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, raw


def expect(status: int, got: int, label: str):
    if got != status:
        print(f"FAIL {label}: expected {status}, got {got}")
        sys.exit(1)
    print(f"OK   {label}")


def main():
    # 1. Health
    code, body = req("GET", "/health")
    expect(200, code, "GET /health")
    assert body.get("status") == "ok", body
    assert body.get("app") == "AgentHub AI", body

    # 2. Create user
    code, body = req("POST", "/api/users", {
        "name": "Alice", "email": "alice@example.com", "role": "client",
    })
    expect(201, code, "POST /api/users")
    user_id = body["id"]
    print(f"     user_id={user_id}")

    # 3. Duplicate email -> 409
    code, body = req("POST", "/api/users", {
        "name": "Alice2", "email": "alice@example.com",
    })
    expect(409, code, "POST /api/users duplicate -> 409")

    # 4. Invalid email -> 422
    code, body = req("POST", "/api/users", {
        "name": "Bob", "email": "not-an-email",
    })
    expect(422, code, "POST /api/users invalid email -> 422")

    # 5. Create agents
    code, a1 = req("POST", "/api/agents", {
        "agent_name": "Backend Agent",
        "agent_role": "Backend Agent",
        "skills": ["FastAPI", "Python", "Postgres"],
    })
    expect(201, code, "POST /api/agents (backend)")
    code, a2 = req("POST", "/api/agents", {
        "agent_name": "UI Agent",
        "agent_role": "UI/UX Agent",
        "skills": ["Figma", "Tailwind"],
    })
    expect(201, code, "POST /api/agents (ui)")
    code, a3 = req("POST", "/api/agents", {
        "agent_name": "ML Agent",
        "agent_role": "AI/ML Agent",
        "skills": ["Python", "PyTorch"],
    })
    expect(201, code, "POST /api/agents (ai)")
    backend_id = a1["id"]
    ui_id = a2["id"]
    ai_id = a3["id"]

    # 6. List agents
    code, body = req("GET", "/api/agents")
    expect(200, code, "GET /api/agents")
    assert isinstance(body, list) and len(body) >= 3

    # 7. Create project
    code, proj = req("POST", "/api/projects", {
        "client_id": user_id,
        "title": "Build dashboard",
        "description": (
            "Need a React dashboard with charts and Tailwind styling "
            "and a FastAPI backend with ML predictions"
        ),
        "required_skills": ["React", "Tailwind", "FastAPI"],
        "budget": "2000",
        "team_size": 3,
    })
    expect(201, code, "POST /api/projects")
    project_id = proj["id"]
    print(f"     project_id={project_id}")

    # 8. Analyze
    code, analysis = req("POST", f"/api/projects/{project_id}/analyze")
    expect(200, code, "POST /api/projects/{id}/analyze")
    assert analysis["project_id"] == project_id
    assert len(analysis["required_roles"]) >= 1
    assert "difficulty" in analysis
    print(f"     difficulty={analysis['difficulty']} roles={analysis['required_roles']}")

    # 9. Match agents
    code, matches = req("POST", f"/api/projects/{project_id}/match-agents",
                        {"max_agents": 3})
    expect(200, code, "POST /api/projects/{id}/match-agents")
    assert isinstance(matches["matches"], list) and len(matches["matches"]) >= 1
    for m in matches["matches"]:
        assert "agent_id" in m and "match_score" in m and "reason" in m
    print(f"     top match: {matches['matches'][0]['agent_name']} "
          f"score={matches['matches'][0]['match_score']}")

    # 10. Route task
    code, routed = req("POST", f"/api/projects/{project_id}/route-task", {
        "title": "Build dashboard UI",
        "description": "Frontend with charts",
        "required_role": "UI/UX Agent",
        "required_skills": ["Figma", "Tailwind"],
    })
    expect(200, code, "POST /api/projects/{id}/route-task")
    assert routed["task"]["project_id"] == project_id
    print(f"     routed to: {routed['routed_to']['agent_name'] if routed['routed_to'] else None}")

    # 11. Add context
    code, ctx = req("POST", f"/api/projects/{project_id}/context", {
        "context_type": "Brief",
        "content": "Client wants SaaS dashboard",
        "allowed_agents": [backend_id, ui_id],
    })
    expect(201, code, "POST /api/projects/{id}/context")
    context_id = ctx["id"]

    # 12. List context for allowed agent
    code, ctx_list = req("GET", f"/api/projects/{project_id}/context?agent_id={backend_id}")
    expect(200, code, "GET /api/projects/{id}/context?agent_id=...")
    assert isinstance(ctx_list, list) and len(ctx_list) == 1

    # 13. List context for disallowed agent -> empty
    code, ctx_list = req("GET", f"/api/projects/{project_id}/context?agent_id={ai_id}")
    expect(200, code, "GET /api/projects/{id}/context filtered")
    assert ctx_list == [], ctx_list

    # 14. Standup summary
    code, standup = req("GET", f"/api/projects/{project_id}/standup-summary")
    expect(200, code, "GET /api/projects/{id}/standup-summary")
    assert standup["project_id"] == project_id
    assert standup["total_tasks"] >= 1
    print(f"     tasks: total={standup['total_tasks']} "
          f"done={standup['completed']} "
          f"in_progress={standup['in_progress']} "
          f"todo={standup['todo']}")

    # 15. 404 for unknown project
    code, _ = req("GET", "/api/projects/does-not-exist")
    expect(404, code, "GET /api/projects/unknown -> 404")

    print("\nAll smoke tests passed.")


if __name__ == "__main__":
    main()
