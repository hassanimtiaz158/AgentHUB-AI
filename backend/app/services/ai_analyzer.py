"""AI Analyzer service.

Orchestrates project analysis with three backends, tried in order:

  1. Groq   (if `GROQ_API_KEY` is set)
  2. OpenAI (if `OPENAI_API_KEY` or `AI_API_KEY` is set)
  3. Local  fallback (rule-based, deterministic)

The local engine in `analyzer.py` is always the safety net, so this service
never raises because of a missing key or an upstream failure — it simply
degrades gracefully. The route gets back the same structured payload
regardless of which backend produced it.

Output is normalized into :class:`AnalysisResult` before returning, so the
rest of the app never has to know which provider answered.
"""

from __future__ import annotations

import json
import logging
from dataclasses import asdict, dataclass, field
from typing import Any

from app.config import settings
from app.models.schemas import AgentRole
from app.services import analyzer as fallback_analyzer

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Normalized output
# ---------------------------------------------------------------------------


@dataclass
class AnalysisResult:
    """Backend-agnostic analysis payload."""

    summary: str
    required_roles: list[str] = field(default_factory=list)
    difficulty: str = "Medium"
    recommended_skills: list[str] = field(default_factory=list)
    task_breakdown: list[dict[str, Any]] = field(default_factory=list)
    estimated_timeline: str = ""
    suggested_agents: list[dict[str, Any]] = field(default_factory=list)
    source: str = "fallback"  # "groq" | "openai" | "fallback"

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


# ---------------------------------------------------------------------------
# Provider selection
# ---------------------------------------------------------------------------


def _resolve_keys() -> dict[str, str | None]:
    groq = getattr(settings, "groq_api_key", None)
    openai = getattr(settings, "openai_api_key", None) or settings.ai_api_key
    return {"groq": groq, "openai": openai}


def _provider_name() -> str | None:
    keys = _resolve_keys()
    if keys["groq"]:
        return "groq"
    if keys["openai"]:
        return "openai"
    return None


# ---------------------------------------------------------------------------
# Strong fallback (rule-based analyzer in the same package)
# ---------------------------------------------------------------------------


def _fallback_analyze(
    *,
    title: str,
    description: str,
    required_skills: list[str],
    budget: str,
    deadline: str | None,
) -> AnalysisResult:
    base = fallback_analyzer.analyze_project(
        title=title,
        description=description,
        required_skills=required_skills,
    )

    timeline = _estimate_timeline(base["difficulty"], base["required_roles"])
    suggested = _suggest_agents(base["required_roles"])

    return AnalysisResult(
        summary=base["summary"],
        required_roles=base["required_roles"],
        difficulty=base["difficulty"],
        recommended_skills=base["recommended_skills"],
        task_breakdown=base["task_breakdown"],
        estimated_timeline=timeline,
        suggested_agents=suggested,
        source="fallback",
    )


def _estimate_timeline(difficulty: str, roles: list[str]) -> str:
    per_role_weeks = {
        "Very Low": 1,
        "Low": 2,
        "Medium": 3,
        "High": 5,
    }
    weeks = per_role_weeks.get(difficulty, 3) * max(len(roles), 1)
    return f"~{weeks} week(s)"


def _suggest_agents(roles: list[str]) -> list[dict[str, Any]]:
    return [
        {"role": role, "reason": f"needed for {role.lower()} work"}
        for role in roles
    ]


# ---------------------------------------------------------------------------
# LLM backends
# ---------------------------------------------------------------------------


_SYSTEM_PROMPT = (
    "You are a senior tech lead. Given a project, return a JSON object with "
    "exactly these keys: summary, required_roles (list of role names like "
    "'Frontend Agent', 'Backend Agent', 'AI/ML Agent', 'UI/UX Agent', "
    "'QA Agent', 'Marketing Agent', 'Project Manager Agent'), difficulty "
    "(one of 'Very Low','Low','Medium','High'), recommended_skills (list of "
    "strings), task_breakdown (list of objects with 'title','role','status'), "
    "estimated_timeline (a short human string), suggested_agents (list of "
    "objects with 'role' and 'reason'). Output ONLY valid JSON, no prose."
)


def _build_user_prompt(
    *,
    title: str,
    description: str,
    required_skills: list[str],
    budget: str,
    deadline: str | None,
) -> str:
    return (
        f"Project title: {title}\n"
        f"Description: {description}\n"
        f"Required skills: {', '.join(required_skills) or 'unspecified'}\n"
        f"Budget: {budget or 'unspecified'}\n"
        f"Deadline: {deadline or 'unspecified'}\n"
    )


def _parse_llm_json(text: str) -> dict[str, Any]:
    """Pull a JSON object out of an LLM reply, tolerating prose around it."""
    text = text.strip()
    if text.startswith("```"):
        # Strip fenced code blocks like ```json ... ```
        lines = text.splitlines()
        lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()

    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end < start:
        raise ValueError("No JSON object found in LLM output")
    payload = text[start : end + 1]
    return json.loads(payload)


def _normalize_llm_output(raw: dict[str, Any], *, fallback: AnalysisResult) -> AnalysisResult:
    """Coerce an arbitrary LLM JSON dict into our AnalysisResult shape."""
    roles = raw.get("required_roles") or []
    # Validate role strings against known roles where possible, but keep
    # anything the model returned rather than dropping it silently.
    known = {r.value for r in AgentRole}
    validated = [r if r in known else fallback.required_roles[0] for r in roles] if roles and fallback.required_roles else roles

    return AnalysisResult(
        summary=(raw.get("summary") or fallback.summary).strip(),
        required_roles=validated or fallback.required_roles,
        difficulty=raw.get("difficulty") or fallback.difficulty,
        recommended_skills=raw.get("recommended_skills") or fallback.recommended_skills,
        task_breakdown=raw.get("task_breakdown") or fallback.task_breakdown,
        estimated_timeline=raw.get("estimated_timeline") or _estimate_timeline(
            raw.get("difficulty") or fallback.difficulty, validated or fallback.required_roles
        ),
        suggested_agents=raw.get("suggested_agents") or fallback.suggested_agents,
        source=fallback.source,
    )


def _call_groq(prompt: str) -> str | None:
    try:
        from groq import Groq  # type: ignore
    except ImportError:
        return None
    key = getattr(settings, "groq_api_key", None)
    if not key:
        return None
    try:
        client = Groq(api_key=key)
        resp = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=900,
        )
        return resp.choices[0].message.content
    except Exception as exc:  # noqa: BLE001 — degrade to fallback
        logger.warning("Groq call failed, falling back: %s", exc)
        return None


def _call_openai(prompt: str) -> str | None:
    try:
        from openai import OpenAI  # type: ignore
    except ImportError:
        return None
    key = getattr(settings, "openai_api_key", None) or settings.ai_api_key
    if not key:
        return None
    try:
        client = OpenAI(api_key=key)
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=900,
        )
        return resp.choices[0].message.content
    except Exception as exc:  # noqa: BLE001 — degrade to fallback
        logger.warning("OpenAI call failed, falling back: %s", exc)
        return None


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------


def analyze(
    *,
    title: str,
    description: str,
    required_skills: list[str],
    budget: str = "",
    deadline: str | None = None,
) -> AnalysisResult:
    """Analyze a project, returning a structured :class:`AnalysisResult`.

    Never raises on provider errors — always falls back to the local engine.
    """
    # The fallback runs first so we always have a valid baseline to coerce LLM
    # output against and to return if every provider fails.
    fallback = _fallback_analyze(
        title=title,
        description=description,
        required_skills=required_skills,
        budget=budget,
        deadline=deadline,
    )

    prompt = _build_user_prompt(
        title=title,
        description=description,
        required_skills=required_skills,
        budget=budget,
        deadline=deadline,
    )

    provider = _provider_name()
    text: str | None = None

    if provider == "groq":
        text = _call_groq(prompt)
    elif provider == "openai":
        text = _call_openai(prompt)

    if not text:
        return fallback

    try:
        raw = _parse_llm_json(text)
        result = _normalize_llm_output(raw, fallback=fallback)
        result.source = provider or "fallback"
        return result
    except (ValueError, json.JSONDecodeError) as exc:
        logger.warning("Failed to parse LLM output (%s); using fallback", exc)
        return fallback
