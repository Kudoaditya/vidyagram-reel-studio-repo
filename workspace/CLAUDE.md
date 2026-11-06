# 9:16 Explainer Video Pipeline

Location: `~/claude-video`. The user-level skill `~/.claude/skills/video-edit` points every new chat here.

Automated vertical (1080x1920) explainer editing: raw reel → normalize + dead-air cut + word timestamps → graphics in one of three engines → assembled MP4 in `output_renders/`.

**Use `./vp` for everything.** It sets PATH itself (no `source env.sh` needed), handles paths with spaces, and self-repairs the Python env if it's missing or broken (e.g. after the folder moved).

```bash
./vp setup        # install / repair everything — safe to re-run any time
./vp verify       # health check: versions table, non-zero exit on any failure
./vp help
```

## Layout

| Path | Purpose |
|---|---|
| `input_raw/` | Raw reels (MP4/MOV, any codec, landscape or vertical) |
| `processed_audio/<stem>/` | `<stem>_cut.mp4`, `transcript.json`, `transcript.txt`, `captions.json`, optional `corrections.json` |
| `engines/hyperframes-app/` | Engine 1 — HTML/GSAP/Three.js/Lottie → MP4 |
| `engines/remotion-app/` | Engine 2 — React + Tailwind v4, captions, inserts, master timeline |
| `engines/revideo-app/` | Engine 3 — procedural 2D diagrams |
| `output_renders/` | Every render lands here |
| `scripts/vp.py`, `scripts/preprocess_reel.py`, `scripts/verify.sh` | Pipeline code |
| `.claude/skills/`, `.agents/skills/` | HyperFrames agent skills (`heygen-com/hyperframes`) |
| `corrections.json` (optional, root) | Global word fixes applied to every transcript |

## Workflow

### 1. Preprocess
```bash
./vp preprocess my_reel.mov                                   # file in input_raw/ or any path
./vp preprocess my_reel.mov --vocab "Remotion, GSAP, Priya"   # names/jargon → spelled correctly
./vp preprocess my_reel.mov --fps 60                          # if the final will be Reel60
./vp preprocess my_reel.mov --cut loudness --threshold 6%     # volume-based cutting instead
./vp preprocess my_reel.mov --cut none                        # keep everything, just transcribe
./vp preprocess my_reel.mov --no-reframe                      # keep original size (default crops to 1080x1920)
./vp preprocess my_reel.mov --language hi --model large-v3-turbo   # Hindi: small model misspells a lot
./vp preprocess -h                                            # all options (--margin, --min-silence, --model, --language)
```
Steps: **normalize** (HEVC/VFR/rotated → constant-fps H.264, center-crop to 1080x1920) → **cut** (default `speech` mode = voice detection, ignores background music) → **transcribe** (faster-whisper `small`) → **captions**.
All timestamps refer to `<stem>_cut.mp4`, never the raw file.

### 2. Proofread captions
Read `processed_audio/<stem>/transcript.txt` (low-confidence words are flagged). Fix by either:
- editing words in `transcript.json` (`segments[].words[].word`), or
- adding `processed_audio/<stem>/corrections.json` / root `corrections.json`: `{"remotian": "Remotion"}`

then `./vp captions <stem>`.

### 3. Make graphic inserts (optional)
```bash
./vp hyperframes title                       # engines/hyperframes-app/index.html → output_renders/hf-title.mp4 (runs check first)
./vp hyperframes title --composition compositions/intro.html --fps 60   # one HTML file per card in compositions/
./vp revideo flow --vars vars.json           # engines/revideo-app → output_renders/revideo-flow.mp4
```
Revideo variables (`src/project.ts`): `{"title": "...", "steps": ["A","B","C"]}`.

### 4. Assemble final
```bash
./vp assemble my_reel \
  --insert output_renders/hf-title.mp4@0:full+2 \
  --insert output_renders/revideo-flow.mp4@"three steps":top \
  --insert assets/logo.png@41.5:pip+3
./vp assemble my_reel --fps 60        # Reel60 → output_renders/my-reel-final-60fps.mp4
./vp assemble my_reel --no-captions
```
Insert SPEC = `file@when[:full|top|pip|split|circle][+seconds]`
- `when`: seconds in the cut video, or a phrase from the transcript (first match).
- `split` = graphic on the top half (card canvas 1080x1000), speaker moves to the bottom with a diagonal cut · `circle|round|frame|wide[.pos]` = full-frame graphic (1080x1920), speaker scaled down into a shape window (`--face x,y`, `--accent` plain border colour, no glow) · `full` covers the frame · `top` (default) card above the captions, sized to the insert's aspect ratio · `pip` small corner window.
- duration defaults to the clip length (images: 3s). Inserts are muted; speaker audio is the soundtrack. Captions always render on top.
Output: `output_renders/<stem>-final.mp4`.

## Engine routing rules

| Need | Engine |
|---|---|
| HTML/CSS cards, title cards, lower thirds, UI mockups | **HyperFrames** |
| GSAP kinetic typography, text reveals, staggered word animations | **HyperFrames** |
| Lottie animations, Three.js / WebGL 3D elements | **HyperFrames** |
| Word-by-word synced captions | **Remotion** |
| React UI overlays on top of the speaker video | **Remotion** |
| Master timeline assembly (speaker + inserts + captions) | **Remotion** (`./vp assemble`) |
| Procedural 2D explainer diagrams, flowcharts, arrows, connectors | **Revideo** |
| Smooth vector/shape morphing, path drawing, data-driven 2D motion | **Revideo** |

Decision procedure:
1. Captions or final assembly → Remotion, always the last stage.
2. Diagram / flowchart / shape morph → Revideo.
3. Anything else that is "designed web content in motion" → HyperFrames.
4. Render inserts first, then `./vp assemble` with phrase-timed `--insert`s.

## Direct engine commands (when `./vp` doesn't cover it)
- HyperFrames: `cd engines/hyperframes-app && npx hyperframes check && npx hyperframes render -o ../../output_renders/x.mp4`. Authoring rules: `hyperframes*` skills in `.claude/skills/` and `engines/hyperframes-app/CLAUDE.md`.
- Remotion: `cd engines/remotion-app && npx remotion render src/index.ts Reel30 out.mp4 --props=public/<stem>/props.json`; `npx remotion studio src/index.ts` for the editor. Compositions: `Reel30`, `Reel60` (1080x1920). Props schema in `src/Reel.tsx` / `src/components/Inserts.tsx`.
- Revideo: `cd engines/revideo-app && npm run render -- name.mp4 [vars.json]`; `npm run editor`. **`npx revideo render` does not exist** in `@revideo/cli` 0.11 — rendering goes through `src/render.ts`.

## Known quirks (already handled — don't undo)
- `src/render.ts` (Revideo) uses `puppeteer: { headless: "shell" }`: Revideo forces `--single-process`, which crashes full headless Chrome on macOS. It re-downloads chrome-headless-shell if missing, retries a failed first render once, and deletes Revideo's intermediate files.
- `requirements.txt` pins `av<16`: faster-whisper 1.2.1 breaks on PyAV 16+. The venv is created with `uv venv --relocatable` so the folder can be moved.
- ffprobe comes from `@ffprobe-installer/ffprobe` (`tools/`), linked at `./bin/ffprobe` and copied to `~/.local/bin/ffprobe`.
- Caption spans use `white-space: pre-wrap` (plain `pre` stops lines from wrapping).
- The skills CLI needs Node ≥ 22.20; `./vp skills-update` runs it on `node@22.23.3` via npx without changing the system Node.
- Output is always 1080x1920 H.264 yuv420p; 30fps by default.

## Workflow skill
Full edits go through the `reel-studio` skill (style 14 "Vox documentary" is saved there, see `references/style-vox-docu.md`) (`~/.claude/skills/reel-studio`): transcribe → scene plan → style boards → build. Style history: `style_log.md`. `./vp hyperframes` fails its project check because of stray `engines/hyperframes-app/r2-*.html`; render cards directly with `npx hyperframes render -c compositions/<name>.html` (see the skill's build.md).

## 3D Studio reel style
Style 11 in `reel-studio` ("3D स्टाइल रील"): real Three.js voiceover explainers (orbiting camera, flat graph cards, captions, safe-zone layout). Playbook, template and scripts: `~/.claude/skills/reel-studio/references/style-3d-studio.md`, `assets/3d-studio/`, `scripts/{align_captions,build_3d,mix_sfx}.py`. Reference output: `output_renders/easing-explainer-FINAL.mp4`.


## Windows
Claude Code runs commands in Git Bash on Windows, so `./vp ...` works the same as on Mac (PowerShell: `vp.cmd ...`).
Use `./vp py script.py` instead of `python3`, `"$(./vp chrome)"` for headless Chrome, and keep reel names short (260-character path limit).
