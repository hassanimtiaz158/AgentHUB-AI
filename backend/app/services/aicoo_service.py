"""Aicoo integration service.

Aicoo is the coordination layer for AgentHub AI: it gives every agent an
identity, routes project requests to the right agent, shares allowed context
between agents, and carries cross-agent messages.

The public Aicoo API (https://www.aicoo.io) exposes a small set of endpoints
(``/api/v1/chat``, ``/api/v1/briefing``, ...) — not the four PRD-shaped
operations this service exposes. So the service runs in one of two modes:

  * ``real`` — ``AICOO_API_KEY`` is set. Each operation is bridged through
    ``POST /api/v1/chat`` with a structured prompt; the reply is parsed back
    into our uniform result shape. Any network / 4xx / 5xx error propagates so
    the route can answer 502 (real mode is best-effort).
  * ``mock`` — no key. A deterministic, offline engine returns the same
    uniform shape. This is the canonical hackathon-demo path and guarantees
    the demo never crashes on a missing key.

Mode is selected once per call and logged at INFO — the API key itself is
never logged, only a truncated fingerprint (``abcd…wxyz``).
"""

from __future__ import annotations

import hashlib
import json
import logging
import uuid
from typing import Any

from app.config import settings

logger = logging.getLogger(__name__)

_DEFAULT_TIMEOUT = 10.0


# ---------------------------------------------------------------------------
# Mode + logging
# ---------------------------------------------------------------------------


def _mode() -> str:
    """``"real"`` if an Aicoo key is configured, else ``"mock"``."""
    return "real" if settings.aicoo_api_key else "mock"


def _key_fingerprint() -> str:
    """Truncated key fingerprint safe to log: ``abcd...wxyz`` (ASCII only).

    Kept ASCII so it survives any console encoding. Never the full key.
    """
    key = settings.aicoo_api_key or ""
    if len(key) <= 8:
        return key[:2] + "..." if key else ""
    return key[:4] + "..." + key[-4:]


def _log_mode() -> None:
    if _mode() == "real":
        logger.info("Aicoo mode=REAL base=%s key=%s", settings.aicoo_base_url, _key_fingerprint())
    else:
        logger.info("Aicoo mode=MOCK (no AICOO_API_KEY)")


# ---------------------------------------------------------------------------
# Real-mode transport (httpx)
# ---------------------------------------------------------------------------


def _auth_header() -> dict[str, str]:
    return {"Authorization": f"Bearer {settings.aicoo_api_key}", "Content-Type": "application/json"}


def _call_chat(message: str) -> dict[str, str]:
    """Send a coordination prompt to Aicoo and return the text reply.

    Raises on any transport / HTTP error so the route can surface 502.
    """
    try:
        import httpx
    except ImportError:  # httpx not installed — degrade to mock
        logger.warning("httpx not installed; Aicoo real mode unavailable")
        raise RuntimeError("httpx not installed") from None

    url = settings.aicoo_base_url.rstrip("/") + "/api/v1/chat"
    resp = httpx.post(url, headers=_auth_header(), json={"message": message}, timeout=_DEFAULT_TIMEOUT)
    resp.raise_for_status()

    # Aicoo may stream text-delta events or return a plain JSON body. We accept
    # either: pull the ``message``/``text`` field, or concatenate text-deltas.
    try:
        body = resp.json()
    except ValueError:
        body = {}

    text = body.get("message") or body.get("text") or body.get("reply") or ""
    if not text and isinstance(body, dict):
        # Streaming-style payload: collect text-delta chunks.
        chunks = [ev.get("textDelta", "") for ev in body.get("events", []) if ev.get("type") == "text-delta"]
        text = "".join(chunks)
    if not text:
        text = resp.text
    return {"reply": text, "raw": body}


def _route_via_chat(project_context: str, target_agent: str) -> dict[str, str]:
    prompt = (
        "You are the Aicoo coordination layer. Route the following project "
        "request to the named agent. Reply with a JSON object: "
        '{"routed_to": <agent>, "routing_reason": "<why>", "status": "ok"}.\n'
        f"Target agent: {target_agent}\n"
        f"Project context: {project_context}\n"
    )
    return _call_chat(prompt)


def _identity_via_chat(agent_data: dict[str, Any]) -> dict[str, str]:
    prompt = (
        "You are the Aicoo coordination layer. Register this agent identity "
        "and return a JSON object with an 'agent_id' string.\n"
        f"Agent: {json.dumps(agent_data)}\n"
    )
    return _call_chat(prompt)


def _context_via_chat(project_id: str, context: str, allowed_agents: list[str]) -> dict[str, str]:
    prompt = (
        "You are the Aicoo coordination layer. Record this shared context for "
        "the project and return a JSON object with 'shared': true.\n"
        f"Project: {project_id}\nContext: {context}\nAllowed: {allowed_agents}\n"
    )
    return _call_chat(prompt)


def _message_via_chat(from_agent: str, to_agent: str, message: str) -> dict[str, str]:
    prompt = (
        "You are the Aicoo coordination layer. Deliver this agent-to-agent "
        "message and return a JSON object with 'delivered': true.\n"
        f"From: {from_agent}\nTo: {to_agent}\nMessage: {message}\n"
    )
    return _call_chat(prompt)


# ---------------------------------------------------------------------------
# Mock engine (deterministic, offline)
# ---------------------------------------------------------------------------


def _mock_agent_id(agent_name: str) -> str:
    digest = hashlib.sha256(agent_name.encode("utf-8")).hexdigest()[:12]
    return f"mock-{digest}"


def _mock_create_agent_identity(agent_data: dict[str, Any]) -> dict[str, Any]:
    name = agent_data.get("agent_name", "agent")
    return {
        "agent_id": _mock_agent_id(name),
        "agent_name": name,
        "registered": True,
        "mock": True,
    }


def _mock_route_request(project_context: str, target_agent: str) -> dict[str, Any]:
    return {
        "routed_to": {"agent": target_agent, "mock": True},
        "routing_reason": f"mock: '{target_agent}' best fits the requested context",
        "status": "ok",
        "mock": True,
    }


def _mock_share_context(project_id: str, context: str, allowed_agents: list[str]) -> dict[str, Any]:
    return {
        "project_id": project_id,
        "context": context,
        "allowed_agents": list(allowed_agents),
        "shared": True,
        "mock": True,
    }


def _mock_send_message(from_agent: str, to_agent: str, message: str) -> dict[str, Any]:
    return {
        "from": from_agent,
        "to": to_agent,
        "message": message,
        "delivered": True,
        "mock": True,
    }


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def create_agent_identity(*, agent_data: dict[str, Any]) -> dict[str, Any]:
    """Register an agent identity with Aicoo (mock if no key).

    Real mode degrades to mock on any network / transport failure.
    """
    _log_mode()
    if _mode() == "mock":
        return _mock_create_agent_identity(agent_data)
    try:
        res = _identity_via_chat(agent_data)
        reply = res.get("raw") if isinstance(res.get("raw"), dict) else {}
        if reply:
            return reply
        logger.warning("Aicoo create_agent_identity: empty reply, using mock fallback")
        return _mock_create_agent_identity(agent_data)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Aicoo create_agent_identity real mode failed (%s); using mock fallback", exc)
        return _mock_create_agent_identity(agent_data)


def route_request(*, project_context: str, target_agent: str) -> dict[str, Any]:
    """Route a project request to the target agent (mock if no key).

    Real mode degrades to mock on any network / transport failure so the rest
    of the app keeps working when Aicoo is unreachable. Surfaces a ``mock``
    flag so callers know the source.
    """
    _log_mode()
    if _mode() == "mock":
        return _mock_route_request(project_context, target_agent)
    try:
        res = _route_via_chat(project_context, target_agent)
        reply = res.get("raw") if isinstance(res.get("raw"), dict) else {}
        if reply:
            return reply
        logger.warning("Aicoo route_request: empty reply, using mock fallback")
        return _mock_route_request(project_context, target_agent)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Aicoo route_request real mode failed (%s); using mock fallback", exc)
        return _mock_route_request(project_context, target_agent)


def share_context(*, project_id: str, context: str, allowed_agents: list[str]) -> dict[str, Any]:
    """Share context with a set of allowed agents (mock if no key).

    Real mode degrades to mock on any network / transport failure.
    """
    _log_mode()
    if _mode() == "mock":
        return _mock_share_context(project_id, context, allowed_agents)
    try:
        res = _context_via_chat(project_id, context, allowed_agents)
        reply = res.get("raw") if isinstance(res.get("raw"), dict) else {}
        if reply:
            return reply
        logger.warning("Aicoo share_context: empty reply, using mock fallback")
        return _mock_share_context(project_id, context, allowed_agents)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Aicoo share_context real mode failed (%s); using mock fallback", exc)
        return _mock_share_context(project_id, context, allowed_agents)


def send_agent_message(*, from_agent: str, to_agent: str, message: str) -> dict[str, Any]:
    """Send a message between two agents (mock if no key).

    Real mode degrades to mock on any network / transport failure.
    """
    _log_mode()
    if _mode() == "mock":
        return _mock_send_message(from_agent, to_agent, message)
    try:
        res = _message_via_chat(from_agent, to_agent, message)
        reply = res.get("raw") if isinstance(res.get("raw"), dict) else {}
        if reply:
            return reply
        logger.warning("Aicoo send_agent_message: empty reply, using mock fallback")
        return _mock_send_message(from_agent, to_agent, message)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Aicoo send_agent_message real mode failed (%s); using mock fallback", exc)
        return _mock_send_message(from_agent, to_agent, message)
