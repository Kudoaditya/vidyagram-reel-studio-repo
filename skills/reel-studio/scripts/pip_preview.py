#!/usr/bin/env python3
"""Show the PiP speaker-window shapes on the user's own frame (scale-down first, then mask).

usage: pip_preview.py <speaker_frame.png> <out.png> [--face 0.5,0.36] [--pos bc] [--accent #22D3EE] [--bg "#0B0D14"]
Geometry mirrors engines/remotion-app/src/components/pip.ts - keep both in sync.
"""
import argparse, glob, os, subprocess, sys, tempfile, pathlib

SHAPES = {  # name: (w, h, radius, k=video width / window width, ring)
    "circle": (460, 460, 230, 1.12, True),
    "round": (560, 640, 56, 1.0, False),
    "frame": (560, 640, 56, 1.0, True),
    "wide": (760, 520, 48, 1.0, True),
}
PALETTE = {"White": "#FFFFFF", "Ink": "#111111", "Champagne gold": "#C9A24B", "Cream": "#F4EFE3", "Rose gold": "#B76E79", "Emerald": "#1F6F5C", "Navy": "#1B2A49", "Burgundy": "#7A1F2B"}
LABEL = {"circle": "Circle + border", "round": "Rounded rectangle", "frame": "Rounded rect + border", "wide": "Wide rounded rect"}

def geo(name, pos, fx, fy):
    w, h, r, k, ring = SHAPES[name]
    left = 60 if pos.endswith("l") else 1080 - w - 130 if pos.endswith("r") else (1080 - w) / 2
    top = 180 if pos.startswith("t") else 1340 - h
    vw = w * k; vh = vw * 1920 / 1080
    cl = lambda v, lo, hi: min(hi, max(lo, v))
    return left, top, w, h, r, ring, cl(w / 2 - fx * vw, w - vw, 0), cl(h * 0.42 - fy * vh, h - vh, 0), vw, vh

def page(img, name, pos, fx, fy, accent, bg):
    left, top, w, h, r, ring, vl, vt, vw, vh = geo(name, pos, fx, fy)
    lum = int(bg.lstrip("#")[0:2], 16) if bg.startswith("#") else 0
    fg = "#111" if lum > 160 else "#fff"
    border = f"border:8px solid {accent};" if ring else ""
    return f"""<!doctype html><meta charset=utf-8><style>*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:1080px;height:1920px;position:relative;overflow:hidden;background:{bg};font-family:Helvetica,Arial,sans-serif;color:{fg}}}
.g{{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px);background-size:60px 60px}}
.t{{position:absolute;left:60px;top:200px;font:900 120px/1 Impact,Helvetica;color:#FFE14D}}
.w{{position:absolute;left:{left}px;top:{top}px;width:{w}px;height:{h}px;border-radius:{r}px;overflow:hidden;background:#000}}
.w img{{position:absolute;left:{vl}px;top:{vt}px;width:{vw}px;height:{vh}px}}
.ring{{position:absolute;left:{left}px;top:{top}px;width:{w}px;height:{h}px;border-radius:{r}px;{border}}}
.l{{position:absolute;left:0;right:0;top:1420px;text-align:center;font:700 44px Helvetica}}
.safe{{position:absolute;left:60px;right:130px;top:160px;bottom:380px;border:2px dashed rgba(255,255,255,.25)}}</style>
<div class=g></div><div class=safe></div><div class=t>GRAPHIC<br>HERE</div>
<div class=w><img src="{img}"></div><div class=ring></div><div class=l>{LABEL[name]}</div>"""

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("frame"); ap.add_argument("out")
    ap.add_argument("--face", default="0.5,0.36"); ap.add_argument("--pos", default="bc")
    ap.add_argument("--accent", default="#FFFFFF"); ap.add_argument("--colors", action="store_true", help="show ONE shape (--shape) in each premium border colour instead of all shapes"); ap.add_argument("--shape", default="frame"); ap.add_argument("--bg", default="#0B0D14")
    a = ap.parse_args()
    fx, fy = (float(v) for v in a.face.split(","))
    chrome = sorted(glob.glob(os.path.expanduser("~/.cache/puppeteer/chrome-headless-shell/**/chrome-headless-shell*"), recursive=True))
    chrome = [c for c in chrome if os.path.isfile(c) and (c.endswith("chrome-headless-shell") or c.endswith(".exe"))][-1]
    tmp = pathlib.Path(tempfile.mkdtemp(prefix="pip_preview_"))
    shots = []
    jobs = [(a.shape, c, k) for k, c in PALETTE.items()] if a.colors else [(n, a.accent, n) for n in SHAPES]
    for n, col, tag in jobs:
        html = tmp / f"{tag}.html".replace(" ", "_"); html.write_text(page(pathlib.Path(a.frame).resolve().as_uri(), n, a.pos, fx, fy, col, a.bg).replace(LABEL[n] + "</div>", tag + "</div>" if a.colors else LABEL[n] + "</div>"))
        png = tmp / (tag.replace(" ", "_") + ".png")
        subprocess.run([chrome, "--no-sandbox", "--hide-scrollbars", "--allow-file-access-from-files", "--window-size=1080,1920",
                        f"--screenshot={png}", html.as_uri()], check=True, capture_output=True)
        shots.append(png)
    cmd = ["ffmpeg", "-v", "error", "-y"]
    for s in shots: cmd += ["-i", str(s)]
    cmd += ["-filter_complex", f"hstack=inputs={len(shots)},scale={1600 if len(shots) <= 4 else 2400}:-1", a.out]
    subprocess.run(cmd, check=True)
    print("wrote", a.out)

if __name__ == "__main__":
    sys.exit(main())
