#!/usr/bin/env python3
"""Build + render long-form scene MP4s (1920x1080) from a spec JSON via HyperFrames.
usage: build_scenes.py spec.json [--only id,id] [--jobs 3] [--no-render]
spec: {"accent":"#E8C48A","scenes":[{"id":"s01","type":"quote","dur":7,...type params}]}
Output: ~/claude-video/output_renders/lf/<id>.mp4 (muted; assembled by ./vp longform)."""
import argparse, json, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path.home() / "claude-video"
HF = ROOT / "engines" / "hyperframes-app"
SK = Path(__file__).resolve().parent.parent / "assets"
OUT = ROOT / "output_renders" / "lf"

def page(scene: dict, accent: str) -> str:
    d = {"accent": accent, **scene}
    css, js = (SK / "base.css").read_text(), (SK / "templates.js").read_text()
    dur = d["dur"]
    return f"""<!doctype html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=1920, height=1080"/>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script><style>{css}</style></head><body>
<div id="root" data-composition-id="main" data-start="0" data-width="1920" data-height="1080" data-duration="{dur}">
<div class="clip" data-start="0" data-duration="{dur}" data-track-index="0" style="position:absolute;inset:0"><div id="stage"></div></div></div>
<script>const D={json.dumps(d, ensure_ascii=False)};{js}</script></body></html>"""

def render(sid: str) -> str:
    out = OUT / f"{sid}.mp4"
    r = subprocess.run(["npx", "--no-install", "hyperframes", "render", "-c", f"compositions/lf-{sid}.html", "-o", str(out),
                        "-f", "30", "-q", "delivery", "--quiet"], cwd=HF, capture_output=True, text=True)
    return f"{sid}: {'ok' if out.exists() else 'FAILED ' + (r.stderr or r.stdout)[-300:]}"

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("spec"); ap.add_argument("--only"); ap.add_argument("--jobs", type=int, default=3)
    ap.add_argument("--no-render", action="store_true"); a = ap.parse_args()
    spec = json.loads(Path(a.spec).read_text()); OUT.mkdir(parents=True, exist_ok=True)
    only = set(a.only.split(",")) if a.only else None
    ids = []
    for s in spec["scenes"]:
        if only and s["id"] not in only: continue
        txt = json.dumps(s, ensure_ascii=False)
        if any("ऀ" <= c <= "ॿ" for c in txt):
            sys.exit(f"scene {s['id']}: Devanagari found — on-screen text must be Hinglish in Latin script")
        (HF / "compositions" / f"lf-{s['id']}.html").write_text(page(s, spec.get("accent", "#E8C48A"))); ids.append(s["id"])
    print(f"wrote {len(ids)} compositions")
    if a.no_render: return
    with ThreadPoolExecutor(a.jobs) as ex:
        for line in ex.map(render, ids): print(line)

main()
