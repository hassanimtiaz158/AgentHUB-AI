"""Tests for the AI Project Analyzer service.

Covers the fallback (rule-based) engine in `app.services.analyzer` and the
orchestration layer in `app.services.ai_analyzer`, including the
"never crash on missing key" guarantee.
"""

from __future__ import annotations

import json
from unittest.mock import patch

import pytest

from app.services import analyzer as fallback_analyzer
from app.services.ai_analyzer import (
    AnalysisResult,
    _call_groq,
    _call_openai,
    _parse_llm_json,
    analyze,
)


# ---------------------------------------------------------------------------
# Fallback engine (app.services.analyzer)
# ---------------------------------------------------------------------------


class TestFallbackAnalyzer:
    def test_infers_roles_from_description(self):
        result = fallback_analyzer.analyze_project(
            title="Build a React dashboard",
            description="Need a React frontend with charts and a FastAPI backend.",
            required_skills=["React", "FastAPI"],
        )
        assert "Frontend Agent" in result["required_roles"]
        assert "Backend Agent" in result["required_roles"]

    def test_defaults_to_backend_when_no_signal(self):
        result = fallback_analyzer.analyze_project(
            title="Small script",
            description="A short utility script for renaming files.",
            required_skills=[],
        )
        assert result["required_roles"] == ["Backend Agent"]

    def test_difficulty_scales_with_roles(self):
        few = fallback_analyzer.analyze_project(
            title="Landing page",
            description="Simple landing page with Tailwind.",
            required_skills=["Tailwind"],
        )
        many = fallback_analyzer.analyze_project(
            title="Full product",
            description=(
                "React frontend, FastAPI backend, ML recommendations, "
                "Figma designs, automated QA, marketing launch."
            ),
            required_skills=["React", "FastAPI", "PyTorch", "Figma", "Selenium", "SEO"],
        )
        assert few["difficulty"] in ("Very Low", "Low")
        assert many["difficulty"] in ("Medium", "High")

    def test_task_breakdown_has_one_entry_per_role(self):
        result = fallback_analyzer.analyze_project(
            title="Marketplace",
            description="React frontend and FastAPI backend.",
            required_skills=["React", "FastAPI"],
        )
        assert len(result["task_breakdown"]) == len(result["required_roles"])
        assert all(t["status"] == "Todo" for t in result["task_breakdown"])

    def test_recommended_skills_union(self):
        result = fallback_analyzer.analyze_project(
            title="AI app",
            description="LLM-powered app with React frontend.",
            required_skills=["React"],
        )
        # "react" should be present (from the input skill) plus inferred extras.
        assert "React" in result["recommended_skills"] or "react" in result["recommended_skills"]


# ---------------------------------------------------------------------------
# Orchestration layer (app.services.ai_analyzer)
# ---------------------------------------------------------------------------


class TestAiAnalyzerFallback:
    """No API keys configured -> the service must return a valid result."""

    def test_returns_analysis_result(self):
        result = analyze(
            title="Build dashboard",
            description="React UI + FastAPI backend + ML predictions",
            required_skills=["React", "FastAPI"],
            budget="2000",
            deadline=None,
        )
        assert isinstance(result, AnalysisResult)
        assert result.source == "fallback"
        assert result.summary
        assert len(result.required_roles) >= 1
        assert result.difficulty
        assert result.estimated_timeline
        assert result.task_breakdown
        assert result.suggested_agents

    def test_suggested_agents_align_with_roles(self):
        result = analyze(
            title="Build dashboard",
            description="React UI + FastAPI backend",
            required_skills=["React", "FastAPI"],
            budget="",
            deadline=None,
        )
        roles = {a["role"] for a in result.suggested_agents}
        assert roles == set(result.required_roles)

    def test_to_dict_shape(self):
        result = analyze(
            title="x",
            description="React app",
            required_skills=["React"],
            budget="",
            deadline=None,
        )
        d = result.to_dict()
        for key in (
            "summary",
            "required_roles",
            "difficulty",
            "recommended_skills",
            "task_breakdown",
            "estimated_timeline",
            "suggested_agents",
            "source",
        ):
            assert key in d


class TestAiAnalyzerMissingKeys:
    """Even with no keys at all, the service must not raise."""

    def test_no_keys_no_crash(self):
        # Settings has no keys in the test env; just confirm the call succeeds.
        result = analyze(
            title="x",
            description="A simple app",
            required_skills=[],
            budget="",
            deadline=None,
        )
        assert result.source == "fallback"

    def test_groq_call_returns_none_without_key(self):
        from app.config import settings

        with patch.object(settings, "groq_api_key", None):
            assert _call_groq("prompt") is None

    def test_openai_call_returns_none_without_key(self):
        from app.config import settings

        with patch.object(settings, "openai_api_key", None), \
             patch.object(settings, "ai_api_key", None):
            assert _call_openai("prompt") is None


class TestParseLlmJson:
    def _parse(self, text: str):
        return _parse_llm_json(text)

    def test_pure_json(self):
        obj = self._parse('{"summary":"ok","required_roles":["Backend Agent"]}')
        assert obj["summary"] == "ok"

    def test_json_with_prose(self):
        text = 'Here you go:\n{"summary":"ok"}\nDone.'
        assert self._parse(text) == {"summary": "ok"}

    def test_json_with_fenced_code(self):
        text = '```json\n{"summary":"ok"}\n```'
        assert self._parse(text) == {"summary": "ok"}

    def test_invalid_raises(self):
        with pytest.raises(ValueError):
            self._parse("no json here at all")


class TestAiAnalyzerWithMockedLlm:
    """If a provider returns valid JSON, the service uses it."""

    def test_uses_groq_when_key_present(self):
        from app.config import settings

        payload = {
            "summary": "LLM summary",
            "required_roles": ["Frontend Agent"],
            "difficulty": "Low",
            "recommended_skills": ["React"],
            "task_breakdown": [{"title": "t", "role": "Frontend Agent", "status": "Todo"}],
            "estimated_timeline": "~2 week(s)",
            "suggested_agents": [{"role": "Frontend Agent", "reason": "r"}],
        }
        with patch.object(settings, "groq_api_key", "test-key"), patch(
            "app.services.ai_analyzer._call_groq", return_value=json.dumps(payload)
        ):
            result = analyze(
                title="x",
                description="React app",
                required_skills=["React"],
                budget="",
                deadline=None,
            )
        assert result.source == "groq"
        assert result.summary == "LLM summary"
        assert result.required_roles == ["Frontend Agent"]

    def test_degrades_on_unparseable_llm_output(self):
        from app.config import settings

        with patch.object(settings, "groq_api_key", "test-key"), patch(
            "app.services.ai_analyzer._call_groq", return_value="not json at all"
        ):
            result = analyze(
                title="x",
                description="React app",
                required_skills=["React"],
                budget="",
                deadline=None,
            )
        # Falls back, does not crash.
        assert result.source == "fallback"
        assert result.summary  # populated by the fallback engine
