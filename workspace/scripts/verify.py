#!/usr/bin/env python3
"""Health check for the whole pipeline (macOS + Windows). Exits non-zero if any component fails.
usage: ./vp verify"""
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

ROOT = Path(__file__).resolve().parent.parent
WIN = os.name == "nt"
EXE = ".exe" if WIN else ""
VBIN = ROOT / ".venv" / ("Scripts" if WIN else "bin")
PY = VBIN / f"python{EXE}"
ENV = dict(os.environ)
ENV["PATH"] = os.pathsep.join([str(ROOT / "bin"), str(VBIN), ENV.get("PATH", "")])
ENV["HYPERFRAMES_NO_TELEMETRY"] = "1"
ENV["PYTHONUTF8"] = "1"

rows: list[tuple[str, str, str, str]] = []
fail = False


def row(name: str, ver: str, status: str, path: str) -> None:
    global fail
    rows.append((name, ver, status, path))
    if status != "OK":
        fail = True


def which(name: str) -> str | None:
    return shutil.which(name, path=ENV["PATH"])


def run(cmd: list[str], cwd: Path | None = None, timeout: int = 600) -> tuple[int, str]:
    exe = which(cmd[0]) or cmd[0]
    try:
        r = subprocess.run([exe, *cmd[1:]], cwd=cwd, env=ENV, capture_output=True, text=True, timeout=timeout,
                           encoding="utf-8", errors="replace")
        return r.returncode, (r.stdout or "") + (r.stderr or "")
    except (OSError, subprocess.TimeoutExpired) as e:
        return 1, str(e)


def ok(cmd: list[str], cwd: Path | None = None) -> str:
    return "OK" if run(cmd, cwd)[0] == 0 else "FAIL"


def first_version(text: str) -> str:
    m = re.search(r"\d+\.\d+(?:\.\d+)?", text.splitlines()[0] if text.strip() else "")
    return m.group(0) if m else "-"


# ---- system tools
for t in ("node", "npm", "python", "git", "ffmpeg", "ffprobe"):
    name = "python" if t == "python" else t
    p = which(name) or (which("python3") if t == "python" else None)
    if not p:
        row(t if t != "python" else "python3", "-", "FAIL", "not on PATH")
        continue
    flag = "-version" if t in ("ffmpeg", "ffprobe") else "--version"
    code, out = run([p, flag])
    row(t if t != "python" else "python3", first_version(out), "OK" if code == 0 else "FAIL", p)


# ---- Python preprocessor
def pyver(pkg: str) -> str:
    code, out = run([str(PY), "-c", f"import importlib.metadata as m; print(m.version('{pkg}'))"])
    return out.strip().splitlines()[-1] if code == 0 and out.strip() else "-"


st = ok([str(PY), "-c", "import faster_whisper, moviepy, av"])
auto = VBIN / f"auto-editor{EXE}"
st2 = ok([str(auto), "--version"])
st = "OK" if st == "OK" and st2 == "OK" else "FAIL"
code, pv = run([str(PY), "-V"])
row("Python preprocessor", "py " + (pv.split()[-1] if pv.strip() else "-"),
    ok([str(PY), str(ROOT / "scripts" / "preprocess_reel.py"), "--help"]), str(ROOT / "scripts" / "preprocess_reel.py"))
row("  auto-editor", pyver("auto-editor"), st2, str(auto))
row("  faster-whisper", pyver("faster-whisper"), st, str(ROOT / ".venv"))
row("  moviepy / av", f"{pyver('moviepy')} / {pyver('av')}", st, str(ROOT / ".venv"))


def node_version(cwd: Path, pkg: str) -> str:
    code, out = run(["node", "-p", f"JSON.parse(require('fs').readFileSync('node_modules/{pkg}/package.json')).version"], cwd)
    return out.strip().splitlines()[-1] if code == 0 and out.strip() else "-"


# ---- HyperFrames
HF = ROOT / "engines" / "hyperframes-app"
row("HyperFrames", node_version(HF, "hyperframes"), ok(["npx", "--no-install", "hyperframes", "check"], HF), str(HF))
for d in ("gsap", "three", "lottie-web"):
    row(f"  {d}", node_version(HF, d), "OK" if (HF / "node_modules" / d).is_dir() else "FAIL", str(HF / "node_modules" / d))
skills = ROOT / ".claude" / "skills"
n = len(list(skills.iterdir())) if skills.is_dir() else 0
row("  agent skills", f"{n} skills", "OK" if (skills / "hyperframes" / "SKILL.md").exists() else "FAIL", str(skills))

# ---- Remotion
RM = ROOT / "engines" / "remotion-app"
code, comps = run(["npx", "--no-install", "remotion", "compositions", "src/index.ts", "--quiet"], RM)
comps_one = " ".join(comps.split())
st = "FAIL"
if code == 0 and "Reel30" in comps and "Reel60" in comps and run(["npx", "--no-install", "tsc", "--noEmit"], RM)[0] == 0:
    st = "OK"
row("Remotion", node_version(RM, "remotion"), st, str(RM))
row("  compositions", comps_one, st, "1080x1920 @30/60fps")

# ---- Revideo
RV = ROOT / "engines" / "revideo-app"
row("Revideo", node_version(RV, "@revideo/core"), ok(["npm", "run", "build"], RV), str(RV))

print(f"\n{'COMPONENT':<22} {'VERSION':<22} {'STATUS':<6} PATH")
print(f"{'-' * 22} {'-' * 22} {'-' * 6} ----")
for a, b, c, d in rows:
    print(f"{a:<22} {b:<22} {c:<6} {d}")
print()
print("All checks passed." if not fail else "Some checks FAILED.")
sys.exit(1 if fail else 0)
