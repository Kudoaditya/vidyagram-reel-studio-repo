#!/usr/bin/env python3
"""vp — one command for the 9:16 video pipeline. Run it as ./vp <command> from the workspace root.

  ./vp setup                                   install / repair everything (safe to re-run)
  ./vp verify                                  health check, prints versions table
  ./vp preprocess <video> [options]            normalize → cut dead air → transcribe   (./vp preprocess -h)
  ./vp captions <stem>                         rebuild captions after editing transcript.json / corrections.json
  ./vp hyperframes [name] [--fps 30] [--composition file.html]
  ./vp revideo [name] [--vars vars.json]
  ./vp assemble <stem> [--insert SPEC ...] [--fps 30|60] [--no-captions] [--out name]
  ./vp skills-update                           update the HyperFrames agent skills

Insert SPEC = <file>@<when>[:full|top|pip|split|circle|round|frame|wide[.bc|bl|br|tc|tl|tr]][+seconds]
  <when> is seconds (12.5) or a phrase from the transcript ("cut the dead air").
  e.g. ./vp assemble my_reel --insert output_renders/revideo-flow.mp4@"three steps":top
"""
import argparse
import json
import platform
import os
import platform
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENGINES = ROOT / "engines"
HF, RM, RV = ENGINES / "hyperframes-app", ENGINES / "remotion-app", ENGINES / "revideo-app"
OUT = ROOT / "output_renders"
PROCESSED = ROOT / "processed_audio"
IS_WIN = os.name == "nt"
VBIN = ROOT / ".venv" / ("Scripts" if IS_WIN else "bin")   # venv executables folder
EXE = ".exe" if IS_WIN else ""
PY = VBIN / f"python{EXE}"
NODE_FOR_SKILLS = "node@22.23.3"  # skills CLI needs Node >= 22.20; runs on this without touching system Node
IMAGE_SECONDS = 3.0
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


def die(msg: str) -> None:
    sys.exit(f"vp: {msg}")


def sh(cmd: list[str], cwd: Path = ROOT, check: bool = True, quiet: bool = False) -> int:
    if IS_WIN:  # npm/npx are .cmd files on Windows; resolve them to a full path first
        cmd = [shutil.which(cmd[0]) or cmd[0], *cmd[1:]]
    try:
        code = subprocess.run(cmd, cwd=cwd, stdout=subprocess.DEVNULL if quiet else None,
                              stderr=subprocess.DEVNULL if quiet else None).returncode
    except FileNotFoundError:
        code = 127  # executable missing (e.g. .venv not created yet)
    if check and code != 0:
        die(f"command failed ({code}): {' '.join(cmd)}")
    return code


def slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-") or "clip"


def media_aspect(path: Path) -> float:
    res = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
                          "-of", "csv=p=0", str(path)], capture_output=True, text=True)
    try:
        w, h = (float(x) for x in res.stdout.strip().split(",")[:2])
        return w / h
    except ValueError:
        return 9 / 16


def media_seconds(path: Path) -> float:
    res = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                         capture_output=True, text=True)
    try:
        return float(res.stdout.strip())
    except ValueError:
        die(f"cannot read duration of {path}")


# ---------------------------------------------------------------- setup
def cmd_setup(_: argparse.Namespace) -> None:
    for d in ("input_raw", "processed_audio", "output_renders"):
        (ROOT / d).mkdir(exist_ok=True)

    print("• Python venv")
    if sh([str(PY), "-c", "import faster_whisper, moviepy, av"], check=False, quiet=True) != 0:
        uv = shutil.which("uv")
        if uv:
            sh([uv, "venv", "--relocatable", "--allow-existing", "--python", "3.12", str(ROOT / ".venv")])
            sh([uv, "pip", "install", "--python", str(PY), "-r", str(ROOT / "requirements.txt")])
        else:
            sh([sys.executable, "-m", "venv", str(ROOT / ".venv")])
            sh([str(PY), "-m", "pip", "install", "-r", str(ROOT / "requirements.txt")])

    print("• node packages")
    for d in (ROOT / "tools", HF, RM, RV):
        if not (d / "node_modules").is_dir():
            sh(["npm", "install", "--no-fund", "--no-audit"], cwd=d)

    print("• ffprobe")
    arch = "arm64" if platform.machine().lower() in ("arm64", "aarch64") else "x64"
    plat = "win32-x64" if IS_WIN else f"darwin-{arch}"
    src = ROOT / "tools" / "node_modules" / "@ffprobe-installer" / plat / f"ffprobe{EXE}"
    local = ROOT / "bin" / f"ffprobe{EXE}"
    (ROOT / "bin").mkdir(exist_ok=True)
    if not local.exists() and src.exists():
        if IS_WIN:
            shutil.copy2(src, local)  # symlinks need admin rights on Windows: copy instead
        else:
            local.unlink(missing_ok=True)
            local.symlink_to(Path("..") / "tools" / "node_modules" / "@ffprobe-installer" / plat / "ffprobe")
    if not shutil.which("ffprobe") and not IS_WIN:
        user_bin = Path.home() / ".local" / "bin"
        user_bin.mkdir(parents=True, exist_ok=True)
        shutil.copy2(local.resolve(), user_bin / "ffprobe")
        print(f"  copied ffprobe to {user_bin}")

    print("• auto-editor binary + whisper model (first run downloads them)")
    sh([str(VBIN / f"auto-editor{EXE}"), "--version"], quiet=True)
    sh([str(PY), "-c", "from faster_whisper import WhisperModel; WhisperModel('small', compute_type='int8')"])

    print("• browsers for Remotion / Revideo")
    sh(["npx", "--no-install", "remotion", "browser", "ensure"], cwd=RM, check=False)
    sh(["npx", "--no-install", "puppeteer", "browsers", "install", "chrome-headless-shell"], cwd=RV)
    print("• warming Remotion bundle cache (slow only the first time)")
    sh(["npx", "--no-install", "remotion", "compositions", "src/index.ts", "--quiet"], cwd=RM, check=False, quiet=True)

    print("• agent skills")
    claude_skills, agent_skills = ROOT / ".claude" / "skills", ROOT / ".agents" / "skills"
    # Folder moves/copies often drop dot-folders like .claude; .agents/skills holds identical copies.
    if not (claude_skills / "hyperframes" / "SKILL.md").exists() and agent_skills.is_dir():
        claude_skills.parent.mkdir(exist_ok=True)
        shutil.copytree(agent_skills, claude_skills, dirs_exist_ok=True)
        print("  restored .claude/skills from .agents/skills")

    for f in ("vp", "scripts/verify.sh", "scripts/preprocess_reel.py", "scripts/vp.py"):
        try:
            (ROOT / f).chmod(0o755)
        except OSError:
            pass
    print("\nsetup complete — run ./vp verify")


def cmd_verify(_: argparse.Namespace) -> None:
    sys.exit(subprocess.run([sys.executable, str(ROOT / "scripts" / "verify.py")]).returncode)


def cmd_py(extra: list[str]) -> None:
    """Run any python script with the workspace venv (same on Mac and Windows): ./vp py script.py args..."""
    py = str(PY) if PY.exists() else sys.executable
    sys.exit(subprocess.run([py, *extra]).returncode)


def cmd_chrome(_: argparse.Namespace) -> None:
    """Print the path of the chrome-headless-shell used for screenshots (Mac and Windows)."""
    base = Path.home() / ".cache" / "puppeteer" / "chrome-headless-shell"
    hits = sorted(base.glob(f"**/chrome-headless-shell{EXE}")) if base.exists() else []
    if not hits:
        die("chrome-headless-shell not found: run ./vp setup")
    print(hits[-1])


# ---------------------------------------------------------------- preprocess
def cmd_preprocess(args: argparse.Namespace, extra: list[str]) -> None:
    sys.exit(subprocess.run([str(PY), str(ROOT / "scripts" / "preprocess_reel.py"), *extra]).returncode)


def cmd_captions(args: argparse.Namespace) -> None:
    sh([str(PY), str(ROOT / "scripts" / "preprocess_reel.py"), args.stem, "--captions-only"])


# ---------------------------------------------------------------- engines
def cmd_hyperframes(args: argparse.Namespace) -> None:
    out = OUT / f"hf-{slug(args.name)}.mp4"
    comp = ["-c", args.composition] if args.composition else []
    sh(["npx", "--no-install", "hyperframes", "check"], cwd=HF)
    sh(["npx", "--no-install", "hyperframes", "render", *comp, "-o", str(out), "-f", str(args.fps),
        "-q", "delivery", "--quiet"], cwd=HF)
    print(f"Rendered: {out}")


def cmd_revideo(args: argparse.Namespace) -> None:
    extra = [str(Path(args.vars).resolve())] if args.vars else []
    sh(["npm", "run", "--silent", "render", "--", f"revideo-{slug(args.name)}.mp4", *extra], cwd=RV)


# ---------------------------------------------------------------- assemble
SPEC = re.compile(r"^(?P<src>.+?)@(?P<when>.+?)(?::(?P<layout>full|top|pip|split|circle|round|frame|wide)(?:\.(?P<pos>bc|bl|br|tc|tl|tr))?)?(?:\+(?P<dur>\d+(?:\.\d+)?))?$")


def find_phrase(words: list[dict], phrase: str) -> float:
    norm = lambda s: re.sub(r"[^\w']", "", s.lower())
    target = [norm(w) for w in phrase.split() if norm(w)]
    tokens = [norm(w["word"]) for w in words]
    for i in range(len(tokens) - len(target) + 1):
        if tokens[i:i + len(target)] == target:
            return words[i]["start"]
    die(f'phrase not found in transcript: "{phrase}" — check processed_audio/<stem>/transcript.txt')


def cmd_assemble(args: argparse.Namespace) -> None:
    src_dir = PROCESSED / args.stem
    transcript_path = src_dir / "transcript.json"
    if not transcript_path.exists():
        die(f"{transcript_path} not found — run ./vp preprocess first")
    transcript = json.loads(transcript_path.read_text())
    video = src_dir / transcript.get("video", f"{args.stem}_cut.mp4")
    video_len = media_seconds(video)
    captions = json.loads((src_dir / "captions.json").read_text())

    pub = RM / "public" / slug(args.stem)
    if pub.exists():
        shutil.rmtree(pub)
    pub.mkdir(parents=True)
    shutil.copy2(video, pub / "main.mp4")

    inserts = []
    for n, spec in enumerate(args.insert or []):
        m = SPEC.match(spec)
        if not m:
            die(f"bad --insert '{spec}' — expected file@when[:full|top|pip|split|circle|round|frame|wide[.bc|bl|br|tc|tl|tr]][+seconds]")
        f = Path(m["src"]).expanduser()
        f = f if f.is_absolute() else (ROOT / f if (ROOT / f).exists() else Path.cwd() / f)
        if not f.exists():
            die(f"insert file not found: {m['src']}")
        when = m["when"].strip().strip('"')
        start = float(when) if re.fullmatch(r"\d+(\.\d+)?", when) else find_phrase(transcript["words"], when)
        is_img = f.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp", ".gif")
        dur = float(m["dur"]) if m["dur"] else (IMAGE_SECONDS if is_img else media_seconds(f))
        dur = min(dur, max(0.1, video_len - start))
        name = f"insert{n}-{slug(f.stem)}{f.suffix.lower()}"
        shutil.copy2(f, pub / name)
        inserts.append({"src": f"{pub.name}/{name}", "startMs": round(start * 1000),
                        "durationMs": round(dur * 1000), "layout": m["layout"] or "top", "pos": m["pos"] or "bc",
                        "aspect": round(media_aspect(f), 4)})
        print(f"  insert {f.name} at {start:.2f}s for {dur:.2f}s ({m['layout'] or 'top'})")

    fx, fy = (float(v) for v in args.face.split(","))
    props = {"videoSrc": f"{pub.name}/main.mp4", "captions": captions, "inserts": inserts,
             "face": {"x": fx, "y": fy}, "accent": args.accent,
             "showCaptions": not args.no_captions, "title": ""}
    (pub / "props.json").write_text(json.dumps(props, indent=2))

    out = OUT / f"{slug(args.out or args.stem)}-final{'-60fps' if args.fps == 60 else ''}.mp4"
    sh(["npx", "--no-install", "remotion", "render", "src/index.ts", f"Reel{args.fps}", str(out),
        f"--props={pub / 'props.json'}", "--log=warn"], cwd=RM)
    print(f"Rendered: {out}")


def cmd_longform(args: argparse.Namespace) -> None:
    """16:9 long-form assemble: speaker + scene MP4s (speaker glides into a pill while a scene plays)."""
    src_dir = PROCESSED / args.stem
    transcript_path = src_dir / "transcript.json"
    if not transcript_path.exists():
        die(f"{transcript_path} not found — run ./vp preprocess <file> --wide --cut none first")
    transcript = json.loads(transcript_path.read_text())
    video = src_dir / transcript.get("video", f"{args.stem}_cut.mp4")
    video_len = media_seconds(video)
    plan = json.loads(Path(args.scenes).read_text())
    caps_in = plan.get("captions", []) if isinstance(plan, dict) else []
    plan = plan["scenes"] if isinstance(plan, dict) else plan

    pub = RM / "public" / slug(args.stem)
    if pub.exists():
        shutil.rmtree(pub)
    pub.mkdir(parents=True)
    shutil.copy2(video, pub / "main.mp4")

    scenes = []
    for n, sc in enumerate(plan):
        f = Path(sc["src"]).expanduser()
        f = f if f.is_absolute() else (ROOT / f if (ROOT / f).exists() else Path.cwd() / f)
        if not f.exists():
            die(f"scene file not found: {sc['src']}")
        at = sc["at"]
        start = float(at) if isinstance(at, (int, float)) or re.fullmatch(r"\d+(\.\d+)?", str(at)) else find_phrase(transcript["words"], str(at))
        dur = float(sc["dur"]) if sc.get("dur") else (3.0 if f.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp") else media_seconds(f))
        dur = min(dur, max(0.1, video_len - start))
        name = f"scene{n:02d}-{slug(f.stem)}{f.suffix.lower()}"
        shutil.copy2(f, pub / name)
        extra = {k: sc[k] for k in ("mode", "kick", "title", "sub", "fit", "scale") if k in sc}
        if "trim" in sc:
            extra["trimMs"] = round(float(sc["trim"]) * 1000)
        scenes.append({"src": f"{pub.name}/{name}", "startMs": round(start * 1000), "durationMs": round(dur * 1000), **extra})
        print(f"  scene {f.name} at {start:.2f}s for {dur:.2f}s")

    fx, fy = (float(v) for v in args.face.split(","))
    props = {"videoSrc": f"{pub.name}/main.mp4", "scenes": scenes, "face": {"x": fx, "y": fy}, "side": args.side, "zoom": args.zoom,
             "captions": [{"startMs": round(float(c["at"]) * 1000), "durationMs": round(float(c["dur"]) * 1000), "text": c["text"]} for c in caps_in]}
    (pub / "props.json").write_text(json.dumps(props, indent=2))
    out = OUT / f"{slug(args.out or args.stem)}-longform.mp4"
    sh(["npx", "--no-install", "remotion", "render", "src/index.ts", "Wide30", str(out),
        f"--props={pub / 'props.json'}", "--log=warn"], cwd=RM)
    print(f"Rendered: {out}")


def cmd_skills_update(_: argparse.Namespace) -> None:
    sh(["npx", "--yes", "-p", NODE_FOR_SKILLS, "-p", "skills@latest", "skills", "update", "-p", "-y"])


# ---------------------------------------------------------------- cli
def main() -> None:
    ap = argparse.ArgumentParser(prog="vp", description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("setup")
    sub.add_parser("verify")
    sub.add_parser("preprocess", add_help=False)
    p = sub.add_parser("captions"); p.add_argument("stem")
    p = sub.add_parser("hyperframes"); p.add_argument("name", nargs="?", default="card")
    p.add_argument("--fps", type=int, default=30); p.add_argument("--composition")
    p = sub.add_parser("revideo"); p.add_argument("name", nargs="?", default="explainer"); p.add_argument("--vars")
    p = sub.add_parser("assemble"); p.add_argument("stem")
    p.add_argument("--insert", action="append", metavar="SPEC")
    p.add_argument("--fps", type=int, choices=[30, 60], default=30)
    p.add_argument("--no-captions", action="store_true"); p.add_argument("--out")
    p.add_argument("--face", default="0.5,0.36", help="face centre x,y as fractions of the frame (PiP framing)")
    p.add_argument("--accent", default="#FFFFFF", help="plain border colour of PiP shapes (white on dark backgrounds, #111111 on light)")
    p = sub.add_parser("longform"); p.add_argument("stem")
    p.add_argument("--scenes", required=True, help='JSON: [{"src":"output_renders/lf-01.mp4","at":12.5|"phrase","dur":8}]')
    p.add_argument("--face", default="0.5,0.4"); p.add_argument("--zoom", type=float, default=1.0, help="pill zoom: 1 = whole frame visible (no crop)"); p.add_argument("--side", choices=["right", "left"], default="right"); p.add_argument("--out")
    sub.add_parser("skills-update")
    sub.add_parser("chrome")
    sub.add_parser("py", add_help=False)

    if len(sys.argv) > 1 and sys.argv[1] == "preprocess":
        return cmd_preprocess(None, sys.argv[2:])
    if len(sys.argv) > 1 and sys.argv[1] == "py":
        return cmd_py(sys.argv[2:])
    args = ap.parse_args()
    {"setup": cmd_setup, "verify": cmd_verify, "captions": cmd_captions, "hyperframes": cmd_hyperframes,
     "revideo": cmd_revideo, "assemble": cmd_assemble, "longform": cmd_longform, "skills-update": cmd_skills_update, "chrome": cmd_chrome}[args.cmd](args)


if __name__ == "__main__":
    main()
