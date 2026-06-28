"""Application factory.

Used by `uvicorn app.main:app` and by tests (via `TestClient`).
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes.agents import router as agents_router
from app.routes.aicoo import router as aicoo_router
from app.routes.projects import router as projects_router
from app.routes.users import router as users_router
from app.services.matching_service import ensure_demo_agents


def _parse_cors_origins(raw: str) -> list[str]:
    """Split the comma-separated CORS_ORIGINS env var into a cleaned list."""
    return [o.strip() for o in raw.split(",") if o.strip()]


@asynccontextmanager
async def _lifespan(app: FastAPI):
    """Seed demo agents on startup (idempotent)."""
    ensure_demo_agents()
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        docs_url="/docs",
        openapi_url="/openapi.json",
        lifespan=_lifespan,
    )

    origins = _parse_cors_origins(settings.cors_origins)
    # A wildcard origin ("*") cannot be used with allow_credentials=True —
    # browsers reject that combination. Drop credentials automatically when the
    # wildcard is requested so the server still boots in open environments.
    allow_creds = "*" not in origins

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins or ["*"],
        allow_credentials=allow_creds,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    def health():
        return {"status": "ok", "app": settings.app_name}

    app.include_router(users_router)
    app.include_router(agents_router)
    app.include_router(projects_router)
    app.include_router(aicoo_router)

    return app


app = create_app()
