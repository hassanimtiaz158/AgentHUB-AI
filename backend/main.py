"""Compatibility shim.

Keeps `uvicorn main:app` working from the backend root. The real application
lives in `app.main`; this module just re-exports it.
"""

from app.main import app, create_app  # noqa: F401

__all__ = ["app", "create_app"]
