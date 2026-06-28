"""Unit tests for the Standup Summary service."""

from __future__ import annotations

from app.database import _Table, tasks
from app.models.schemas import StandupResponse
from app.services.standup import generate_standup


class TestGenerateStandup:
    def test_empty_project_returns_zero_counts(self):
        import app.services.standup as mod
        original = mod.tasks
        store = _Table()
        mod.tasks = store
        try:
            result = generate_standup("proj-1")
        finally:
            mod.tasks = original

        assert isinstance(result, StandupResponse)
        assert result.project_id == "proj-1"
        assert result.total_tasks == 0
        assert result.completed == 0
        assert result.in_progress == 0
        assert result.todo == 0

    def test_counts_tasks_by_status(self):
        import app.services.standup as mod
        original = mod.tasks
        store = _Table()
        store.insert({"id": "t1", "project_id": "proj-1", "title": "A", "status": "Done", "assigned_agent_id": "a1"})
        store.insert({"id": "t2", "project_id": "proj-1", "title": "B", "status": "In Progress", "assigned_agent_id": "a2"})
        store.insert({"id": "t3", "project_id": "proj-1", "title": "C", "status": "Todo", "assigned_agent_id": None})
        store.insert({"id": "t4", "project_id": "proj-1", "title": "D", "status": "Todo", "assigned_agent_id": "a3"})
        mod.tasks = store
        try:
            result = generate_standup("proj-1")
        finally:
            mod.tasks = original

        assert result.total_tasks == 4
        assert result.completed == 1
        assert result.in_progress == 1
        assert result.todo == 2

    def test_unassigned_todo_tasks_are_blockers(self):
        import app.services.standup as mod
        original = mod.tasks
        store = _Table()
        store.insert({"id": "t1", "project_id": "proj-1", "title": "Blocked task", "status": "Todo", "assigned_agent_id": None})
        mod.tasks = store
        try:
            result = generate_standup("proj-1")
        finally:
            mod.tasks = original

        assert len(result.blockers) == 1
        assert "Blocked task" in result.blockers[0]

    def test_in_progress_tasks_appear_in_next_steps(self):
        import app.services.standup as mod
        original = mod.tasks
        store = _Table()
        store.insert({"id": "t1", "project_id": "proj-1", "title": "Active work", "status": "In Progress", "assigned_agent_id": "a1"})
        mod.tasks = store
        try:
            result = generate_standup("proj-1")
        finally:
            mod.tasks = original

        assert len(result.next_steps) >= 1
        assert "Active work" in result.next_steps[0]
