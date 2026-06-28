"""Unit tests for the Project Context Store service."""

from __future__ import annotations

from app.database import _Table
from app.models.schemas import ContextCreate, ContextType, ContextResponse
from app.services.context_store import create_context, list_context


class TestCreateContext:
    def test_creates_context_with_allowed_agents(self):
        import app.services.context_store as mod
        original = mod.contexts
        store = _Table()
        mod.contexts = store
        try:
            result = create_context(
                project_id="proj-1",
                request=ContextCreate(
                    context_type=ContextType.brief,
                    content="Client dashboard",
                    allowed_agents=["a1", "a2"],
                ),
            )
        finally:
            mod.contexts = original

        assert isinstance(result, ContextResponse)
        assert result.project_id == "proj-1"
        assert result.context_type == "Brief"
        assert result.content == "Client dashboard"
        assert "a1" in result.allowed_agents

    def test_creates_context_with_empty_allowed_agents(self):
        import app.services.context_store as mod
        original = mod.contexts
        store = _Table()
        mod.contexts = store
        try:
            result = create_context(
                project_id="proj-1",
                request=ContextCreate(
                    context_type=ContextType.message,
                    content="Hello team",
                    allowed_agents=[],
                ),
            )
        finally:
            mod.contexts = original

        assert result.allowed_agents == []


class TestListContext:
    def test_returns_all_context_for_project(self):
        import app.services.context_store as mod
        original = mod.contexts
        store = _Table()
        store.insert({"id": "c1", "project_id": "proj-1", "context_type": "Brief", "content": "x", "allowed_agents": [], "created_at": "2026-01-01"})
        store.insert({"id": "c2", "project_id": "proj-1", "context_type": "Message", "content": "y", "allowed_agents": [], "created_at": "2026-01-01"})
        store.insert({"id": "c3", "project_id": "proj-2", "context_type": "Brief", "content": "z", "allowed_agents": [], "created_at": "2026-01-01"})
        mod.contexts = store
        try:
            result = list_context(project_id="proj-1")
        finally:
            mod.contexts = original

        assert len(result) == 2

    def test_filters_by_allowed_agent(self):
        import app.services.context_store as mod
        original = mod.contexts
        store = _Table()
        store.insert({"id": "c1", "project_id": "proj-1", "context_type": "Brief", "content": "shared", "allowed_agents": ["a1", "a2"], "created_at": "2026-01-01"})
        store.insert({"id": "c2", "project_id": "proj-1", "context_type": "Summary", "content": "private", "allowed_agents": ["a3"], "created_at": "2026-01-01"})
        mod.contexts = store
        try:
            visible_to_a1 = list_context(project_id="proj-1", agent_id="a1")
        finally:
            mod.contexts = original

        # a1 can see c1 (in allowed_agents) but not c2
        assert len(visible_to_a1) == 1
        assert visible_to_a1[0].content == "shared"

    def test_agent_sees_globally_visible_context(self):
        """Context with empty allowed_agents is visible to everyone."""
        import app.services.context_store as mod
        original = mod.contexts
        store = _Table()
        store.insert({"id": "c1", "project_id": "proj-1", "context_type": "Brief", "content": "public", "allowed_agents": [], "created_at": "2026-01-01"})
        mod.contexts = store
        try:
            result = list_context(project_id="proj-1", agent_id="any-agent")
        finally:
            mod.contexts = original

        assert len(result) == 1
