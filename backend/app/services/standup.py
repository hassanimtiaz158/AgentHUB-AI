"""Standup summary service.

Aggregates a project's tasks into a daily-style summary. Today this is a
deterministic aggregation of in-memory data; the docstring notes where an
LLM-backed summarizer would slot in for richer narrative output.
"""

from __future__ import annotations

from datetime import datetime, timezone

from app.database import tasks
from app.models.schemas import StandupResponse


def generate_standup(project_id: str) -> StandupResponse:
    project_tasks = tasks.find(project_id=project_id)

    completed = [t for t in project_tasks if t["status"] == "Done"]
    in_progress = [t for t in project_tasks if t["status"] == "In Progress"]
    todo = [t for t in project_tasks if t["status"] == "Todo"]

    # In a future iteration an LLM would turn these bullets into prose.
    summary_parts = [
        f"Project {project_id} has {len(project_tasks)} task(s) total.",
        f"{len(completed)} done, {len(in_progress)} in progress, {len(todo)} to do.",
    ]

    blockers = [
        f"[{t['id'][:8]}] {t['title']} still {t['status']}"
        for t in project_tasks
        if t["status"] == "Todo" and not t.get("assigned_agent_id")
    ]

    next_steps = [
        f"Continue work on '{t['title']}'" for t in in_progress
    ] or ["No tasks currently in progress."]

    return StandupResponse(
        project_id=project_id,
        generated_at=datetime.now(timezone.utc).isoformat(),
        total_tasks=len(project_tasks),
        completed=len(completed),
        in_progress=len(in_progress),
        todo=len(todo),
        summary=" ".join(summary_parts),
        blockers=blockers,
        next_steps=next_steps,
    )
