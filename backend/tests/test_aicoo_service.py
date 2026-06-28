"""Tests for the Aicoo integration service.

Covers the mock (offline) engine in ``app.services.aicoo_service`` and the
routing endpoint, including the "never crash on missing key" guarantee and the
"never log the full API key" guarantee.
"""

from __future__ import annotations

import logging
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.services import aicoo_service
from app.services.aicoo_service import (
    _mode,
    create_agent_identity,
    route_request,
    send_agent_message,
    share_context,
)

client = TestClient(create_app())


# ---------------------------------------------------------------------------
# Mode selection
# ---------------------------------------------------------------------------


class TestModeSelection:
    def test_mock_mode_when_no_key(self):
        from app.config import settings

        with patch.object(settings, "aicoo_api_key", None):
            assert _mode() == "mock"

    def test_real_mode_when_key_present(self):
        from app.config import settings

        with patch.object(settings, "aicoo_api_key", "test-key-12345"):
            assert _mode() == "real"


# ---------------------------------------------------------------------------
# Mock engine — all four operations
# ---------------------------------------------------------------------------


class TestMockCreateAgentIdentity:
    def test_returns_registered_identity(self):
        from app.config import settings

        with patch.object(settings, "aicoo_api_key", None):
            result = create_agent_identity(
                agent_data={"agent_name": "Frontend Agent", "skills": ["React"]}
            )
        assert result["registered"] is True
        assert result["agent_name"] == "Frontend Agent"
        assert result["agent_id"].startswith("mock-")
        assert result["mock"] is True

    def test_agent_id_is_deterministic(self):
        from app.config import settings

        with patch.object(settings, "aicoo_api_key", None):
            a = create_agent_identity(agent_data={"agent_name": "Backend Agent"})
            b = create_agent_identity(agent_data={"agent_name": "Backend Agent"})
        assert a["agent_id"] == b["agent_id"]


class TestMockRouteRequest:
    def test_returns_uniform_envelope(self):
        from app.config import settings

        # Force mock mode regardless of any key in .env.
        with patch.object(settings, "aicoo_api_key", None):
            result = route_request(
                project_context="Build a React dashboard",
                target_agent="Frontend Agent",
            )
        assert result["status"] == "ok"
        assert result["routed_to"]["agent"] == "Frontend Agent"
        assert result["routing_reason"]
        assert result["mock"] is True


class TestMockShareContext:
    def test_returns_shared_context(self):
        from app.config import settings

        with patch.object(settings, "aicoo_api_key", None):
            result = share_context(
                project_id="proj-1",
                context="Client wants SaaS dashboard",
                allowed_agents=["frontend", "ui"],
            )
        assert result["shared"] is True
        assert result["project_id"] == "proj-1"
        assert result["allowed_agents"] == ["frontend", "ui"]
        assert result["mock"] is True


class TestMockSendMessage:
    def test_returns_delivered(self):
        from app.config import settings

        with patch.object(settings, "aicoo_api_key", None):
            result = send_agent_message(
                from_agent="pm",
                to_agent="backend",
                message="Please estimate the API work.",
            )
        assert result["delivered"] is True
        assert result["from"] == "pm"
        assert result["to"] == "backend"
        assert result["message"] == "Please estimate the API work."
        assert result["mock"] is True


# ---------------------------------------------------------------------------
# Routing endpoint
# ---------------------------------------------------------------------------


class TestAicooRouteEndpoint:
    def _create_project(self, title: str = "Build dashboard") -> str:
        resp = client.post(
            "/api/projects",
            json={
                "title": title,
                "description": "Need a React dashboard with charts",
                "required_skills": ["React"],
                "budget": "2000",
            },
        )
        assert resp.status_code == 201, resp.text
        return resp.json()["id"]

    def test_404_when_project_missing(self):
        from app.config import settings

        with patch.object(settings, "aicoo_api_key", None):
            resp = client.post(
                "/api/projects/does-not-exist/aicoo/route",
                json={"target_agent": "Frontend Agent"},
            )
        assert resp.status_code == 404

    def test_returns_uniform_envelope(self):
        from app.config import settings

        project_id = self._create_project()
        with patch.object(settings, "aicoo_api_key", None):
            resp = client.post(
                f"/api/projects/{project_id}/aicoo/route",
                json={
                    "target_agent": "Frontend Agent",
                    "project_context": "Build a React dashboard",
                    "required_skills": ["React"],
                },
            )
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert body["project_id"] == project_id
        assert body["routed_to"]["agent"] == "Frontend Agent"
        assert body["routing_reason"]
        assert body["status"] == "ok"
        assert body["mode"] == "mock"
        # shared_context carries the echoed context + skills
        assert body["shared_context"]["project_context"] == "Build a React dashboard"
        assert body["shared_context"]["required_skills"] == ["React"]

    def test_uses_project_description_when_no_context(self):
        from app.config import settings

        project_id = self._create_project(title="API service")
        with patch.object(settings, "aicoo_api_key", None):
            resp = client.post(
                f"/api/projects/{project_id}/aicoo/route",
                json={"target_agent": "Backend Agent"},
            )
        assert resp.status_code == 200, resp.text
        body = resp.json()
        # Falls back to the project description for context.
        assert body["shared_context"]["project_context"] == "Need a React dashboard with charts"


# ---------------------------------------------------------------------------
# Key-not-logged guarantee
# ---------------------------------------------------------------------------


class TestKeyNotLogged:
    def test_full_key_not_logged(self, caplog):
        from app.config import settings

        secret = "super-secret-aicoo-key-ABCDEFGH"
        # Stub the network call so the test never hits a real server even when
        # mode=REAL is selected.
        with patch.object(settings, "aicoo_api_key", secret), patch(
            "app.services.aicoo_service._call_chat",
            return_value={"reply": "ok", "raw": {}},
        ):
            with caplog.at_level(logging.INFO, logger="app.services.aicoo_service"):
                route_request(project_context="x", target_agent="Frontend Agent")

        joined = "\n".join(rec.message for rec in caplog.records)
        # Fingerprint should appear (mode=REAL line)…
        assert "mode=REAL" in joined
        # …but the full secret must never appear.
        assert secret not in joined
        # Only the truncated fingerprint (abcd...wxyz) is logged.
        assert "supe...EFGH" in joined


# ---------------------------------------------------------------------------
# Real-mode selection (stubbed; never hits the network)
# ---------------------------------------------------------------------------


class TestRealModeSelection:
    def test_real_mode_degrades_to_mock_on_transport_error(self):
        from app.config import settings

        # Key present + transport error → route_request now degrades to mock
        # instead of raising, so the rest of the app keeps working.
        with patch.object(settings, "aicoo_api_key", "test-key-12345"), \
             patch("app.services.aicoo_service._call_chat", side_effect=RuntimeError("no net")):
            result = route_request(project_context="x", target_agent="Frontend Agent")
        assert result["mock"] is True
        assert result["status"] == "ok"
        assert result["routed_to"]["agent"] == "Frontend Agent"

    def test_mode_is_real_with_key(self):
        from app.config import settings

        with patch.object(settings, "aicoo_api_key", "test-key-12345"):
            assert _mode() == "real"
