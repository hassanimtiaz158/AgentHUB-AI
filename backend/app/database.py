"""Storage layer.

For the MVP we use in-memory dictionaries. The public API of this module
(dict-like `*_store` plus helper functions) is intentionally small so that
swapping in Supabase later is a localized change: replace the internals of
`_stores` and the helpers with Supabase calls, and leave routes/services
untouched.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class _Table:
    """A tiny in-memory table with UUID primary keys."""

    def __init__(self) -> None:
        self._rows: dict[str, dict[str, Any]] = {}

    def insert(self, row: dict[str, Any]) -> dict[str, Any]:
        row_id = row.get("id") or uuid.uuid4().hex
        if row_id in self._rows:
            raise ValueError(f"Duplicate id: {row_id}")
        row["id"] = row_id
        row.setdefault("created_at", _now_iso())
        self._rows[row_id] = row
        return row

    def get(self, row_id: str) -> dict[str, Any] | None:
        return self._rows.get(row_id)

    def list(self) -> list[dict[str, Any]]:
        return list(self._rows.values())

    def find(self, **filters: Any) -> list[dict[str, Any]]:
        matches: list[dict[str, Any]] = []
        for row in self._rows.values():
            if all(row.get(k) == v for k, v in filters.items()):
                matches.append(row)
        return matches

    def update(self, row_id: str, patch: dict[str, Any]) -> dict[str, Any] | None:
        if row_id not in self._rows:
            return None
        self._rows[row_id].update(patch)
        return self._rows[row_id]

    def delete(self, row_id: str) -> bool:
        return self._rows.pop(row_id, None) is not None


# ---------------------------------------------------------------------------
# Tables
# ---------------------------------------------------------------------------
# A single underscore prefix keeps the names from colliding with Pydantic
# model imports in modules that do `from app.database import users`.

users = _Table()
agents = _Table()
projects = _Table()
tasks = _Table()
contexts = _Table()
