"""Throwaway endpoint audit script.

Creates the FastAPI app via its factory, enumerates every route, then hits
each GET endpoint with the test client and reports the status.  POST/PUT/DELETE
endpoints are listed but skipped (they require bodies we cannot fabricate
without domain knowledge).

Deletes itself after running.
"""

from __future__ import annotations

import os
import sys

# Ensure the backend directory is on sys.path so `app` is importable.
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.main import create_app

app: FastAPI = create_app()
client = TestClient(app)

# Enumerate all routes from the app and included routers.
routes = []
for route in app.routes:
    # Skip non-HTTP routes (e.g. Mount, websocket)
    if not hasattr(route, "methods"):
        continue
    methods = route.methods or set()
    path = getattr(route, "path", "")
    name = getattr(route, "name", "")
    for method in sorted(methods):
        if method in ("HEAD", "OPTIONS"):
            continue
        routes.append((method, path, name))

routes.sort(key=lambda r: (r[1], r[0]))

print(f"{'METHOD':<8} {'PATH':<50} {'FUNCTION':<30} {'STATUS'}")
print("-" * 110)

errors: list[str] = []

for method, path, name in routes:
    if method == "GET":
        try:
            resp = client.get(path)
            status = resp.status_code
            marker = ""
            if status >= 500:
                marker = " *** ERROR ***"
                errors.append(f"{method} {path} -> {status}")
        except Exception as exc:
            status = "EXCEPTION"
            marker = " *** EXCEPTION ***"
            errors.append(f"{method} {path} raised {exc}")
        print(f"{method:<8} {path:<50} {name:<30} {status}{marker}")
    else:
        print(f"{method:<8} {path:<50} {name:<30} skipped-bodyless")

print()
if errors:
    print("=== ROUTES RETURNING 5xx OR RAISING EXCEPTIONS ===")
    for e in errors:
        print(f"  {e}")
else:
    print("No routes returned 500/502 or raised exceptions.")

# Self-delete
try:
    os.remove(os.path.abspath(__file__))
    print(f"\n(Cleaned up {os.path.basename(__file__)})")
except Exception:
    pass
