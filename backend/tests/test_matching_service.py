"""Unit tests for the Agent Matching Service.

Covers scoring, project matching, and demo agent seeding.
"""

from __future__ import annotations

from app.database import _Table, agents
from app.models.schemas import AgentRole
from app.services.matching_service import (
    MatchResult,
    ensure_demo_agents,
    match_project,
    score_agent,
)


# ---------------------------------------------------------------------------
# score_agent
# ---------------------------------------------------------------------------


class TestScoreAgent:
    def _make_agent(self, **overrides):
        """Build a minimal agent dict for scoring."""
        base = {
            "id": "a1",
            "agent_name": "Frontend Agent",
            "agent_role": AgentRole.frontend.value,
            "skills": ["React", "TypeScript"],
            "availability": "available",
        }
        base.update(overrides)
        return base

    def test_exact_role_match_scores_40(self):
        agent = self._make_agent()
        result = score_agent(
            agent,
            required_roles=["Frontend Agent"],
            required_skills=["React"],
            recommended_skills=[],
            project_text="build a react app",
        )
        assert result.match_score >= 40  # at least the role match
        assert "exact role match" in result.reason

    def test_partial_role_fit_scores_10(self):
        agent = self._make_agent(agent_role="DevOps Agent")
        result = score_agent(
            agent,
            required_roles=[],
            required_skills=[],
            recommended_skills=[],
            project_text="deploy with docker and kubernetes",
        )
        # DevOps Agent keywords appear in project_text
        assert result.match_score >= 10

    def test_skill_overlap_scores_up_to_40(self):
        agent = self._make_agent(skills=["React", "TypeScript", "Tailwind CSS"])
        result = score_agent(
            agent,
            required_roles=["Frontend Agent"],
            required_skills=["React", "TypeScript"],
            recommended_skills=[],
            project_text="",
        )
        assert result.match_score >= 60  # 40 role + skill overlap + availability

    def test_availability_adds_20(self):
        available = self._make_agent(availability="available")
        busy = self._make_agent(availability="busy", id="a2")
        r1 = score_agent(
            available,
            required_roles=["Frontend Agent"],
            required_skills=[],
            recommended_skills=[],
            project_text="",
        )
        r2 = score_agent(
            busy,
            required_roles=["Frontend Agent"],
            required_skills=[],
            recommended_skills=[],
            project_text="",
        )
        assert r1.match_score - r2.match_score == 20

    def test_max_score_capped_at_100(self):
        agent = self._make_agent(skills=["React", "TypeScript", "Tailwind CSS", "HTML/CSS", "Next.js"])
        result = score_agent(
            agent,
            required_roles=["Frontend Agent"],
            required_skills=["React", "TypeScript", "Tailwind CSS"],
            recommended_skills=[],
            project_text="frontend react ui",
        )
        assert result.match_score <= 100


# ---------------------------------------------------------------------------
# match_project
# ---------------------------------------------------------------------------


class TestMatchProject:
    def test_returns_top_n_agents(self):
        store = _Table()
        store.insert({"id": "a1", "agent_name": "FE", "agent_role": AgentRole.frontend.value, "skills": ["React"], "availability": "available"})
        store.insert({"id": "a2", "agent_name": "BE", "agent_role": AgentRole.backend.value, "skills": ["Python"], "availability": "available"})
        store.insert({"id": "a3", "agent_name": "QA", "agent_role": AgentRole.qa.value, "skills": ["Selenium"], "availability": "available"})

        # Monkey-patch the agents table
        import app.services.matching_service as mod
        original = mod.agents
        mod.agents = store
        try:
            results = match_project(
                project_id="p1",
                required_roles=["Frontend Agent"],
                required_skills=["React"],
                recommended_skills=[],
                project_text="react frontend",
                max_agents=2,
            )
        finally:
            mod.agents = original

        assert len(results) == 2
        assert results[0].match_score >= results[1].match_score

    def test_returns_sorted_by_score_desc(self):
        store = _Table()
        store.insert({"id": "a1", "agent_name": "FE", "agent_role": AgentRole.frontend.value, "skills": ["React"], "availability": "available"})
        store.insert({"id": "a2", "agent_name": "BE", "agent_role": AgentRole.backend.value, "skills": [], "availability": "busy"})

        import app.services.matching_service as mod
        original = mod.agents
        mod.agents = store
        try:
            results = match_project(
                project_id="p1",
                required_roles=["Frontend Agent"],
                required_skills=["React"],
                recommended_skills=[],
                project_text="react frontend",
                max_agents=8,
            )
        finally:
            mod.agents = original

        scores = [r.match_score for r in results]
        assert scores == sorted(scores, reverse=True)


# ---------------------------------------------------------------------------
# ensure_demo_agents
# ---------------------------------------------------------------------------


class TestEnsureDemoAgents:
    def test_seeds_8_agents_on_empty_table(self):
        store = _Table()
        result = ensure_demo_agents(table=store)
        assert len(result) == 8
        roles = {r["agent_role"] for r in result}
        assert AgentRole.frontend.value in roles
        assert AgentRole.backend.value in roles

    def test_idempotent_does_not_double_seed(self):
        store = _Table()
        ensure_demo_agents(table=store)
        count_after_first = len(store.list())
        ensure_demo_agents(table=store)
        assert len(store.list()) == count_after_first
