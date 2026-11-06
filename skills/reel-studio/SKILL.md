---
name: reel-studio
description: The user's director-style workflow for turning a talking-head Short/Reel (with or without a transcript) into a premium motion-graphics explainer, in 3 approval gates - (1) transcribe and propose a short scene plan, (2) show 4-5 reference style boards, (3) build, add sound, QA and deliver. Every video gets a different style, graphics and animation. Use whenever the user gives a video (or video + transcript) and asks to edit it, "make it premium/professional", add motion graphics, explainer animations, B-roll, Vox / Johnny Harris style visuals - in English, Hindi or Hinglish (e.g. "is video ko edit karo", "motion graphics lagao", "scenes suggest karo"). Replaces going straight to editing. Runs on the ~/claude-video pipeline.
---

# Reel Studio - director workflow

Think as a senior video editor **and** motion-graphics artist (Vox, Johnny Harris, Kurzgesagt, Hormozi-style retention editing). Never start building before the user approves the plan and the style.

Reply in the user's language (usually Hinglish). Be **short and point-to-point**: tables, one line per item, no essays. The user wants to approve fast. You run every command; never ask them to.

Workspace: `~/claude-video` (read its `CLAUDE.md` for `./vp` commands). Details live in the reference files next to this one:
- `references/styles.md` - style catalogue, explainer techniques, how to pick a style
- `references/layouts.md` - the 5 speaker layouts, safe zones for Shorts/Reels/TikTok, card sizes
- `references/build.md` - exact build/render/assemble/SFX/QA steps and every gotcha learned so far

## How the user starts (any new chat)
User types `/reel-studio` (or just says "is video ko edit karo") and attaches/pastes the video (file or path) and optionally the transcript text. Treat pasted transcript text as the transcript: save it to `~/claude-video/input_raw/<stem>_transcript.txt`. If no video file is attached, ask them to drag it into the chat or into `~/claude-video/input_raw/`.

## Voiceover-only reels (no talking head)
If the input is only audio (mp3/wav) or the user wants ElevenLabs voice first: no `./vp preprocess` (it needs video). Transcribe with faster-whisper directly (see `style-3d-studio.md` step 2), every scene is `GRAPHICS`, captions are generated from the script (`scripts/align_captions.py`). Voice: an ElevenLabs Hindi/Hinglish voice of your choice, `eleven_v4`, energetic tags; write retention-first scripts (rules in `style-3d-studio.md`) and get the script approved before generating voice.

## Real vs animated visuals (Canva rule)
Claude cannot draw believable real-world designs by hand (posters, thumbnails, banners, logos, UI screens, product shots, packaging, typography/lettering samples, photos of people/places/food). Illustrated look-alikes read as fake and confuse the viewer. So:
- **REAL scenes** (the thing the viewer must recognise or judge: a poster, thumbnail, slide, brand look, before/after of a design, a font pairing, a photo): generate it with **Canva** (`create-design` -> poll `get-create-design-async-job` -> `export-design` PNG, width 1200+) and download into `~/claude-video/assets/<stem>/`. Use real footage/photos the user supplies when they exist. Typically: the opening problem/hook example and the final result/proof scene.
- **ANIM scenes** (the explanation in between: steps, heatmaps, arrows, counters, metaphors, rules, comparisons): HyperFrames animations and flat illustrations, timed to the words, layered on or around the real asset.
- Decide this per scene at Gate 1 (Asset column) and name the Canva briefs ("cluttered poster", "clean poster") so the user can veto before anything is generated.
- If Canva tools are not loaded, ToolSearch `select:` the `create-design`, `get-create-design-async-job`, `export-design` tools first; if Canva is not connected, say so and fall back to the HTML/illustration version, flagged as a placeholder.
- Keep the *before* and *after* assets about the same subject/wording so the comparison is fair. Tell the Canva brief exactly what must be bad (before) or good (after).
Build recipe: build.md section 3b.

## Step 0 - Setup (silent)
1. If the session's working directory is not `~/claude-video`, load `change_directory` (ToolSearch `select:mcp__ccd_directory__change_directory`) and call it with `~/claude-video` (it applies after the turn, so use absolute paths in the meantime). Read `~/claude-video/CLAUDE.md`. Run `./vp verify`; if it fails, `./vp setup`. (`vp verify` can show HyperFrames FAIL because of stray `r2-*.html` in `engines/hyperframes-app/`; that is not a blocker, see build.md.)
2. Copy the video to `input_raw/` (never touch the original). `ffprobe` length/fps/orientation.
3. Read `~/claude-video/style_log.md` so this video gets a **different** style from the last ones.

## Step 1 - Transcribe, then propose scenes (GATE 1)
1. Transcribe first, whatever else is attached: `./vp preprocess <file> --language <hi|en> [--model large-v3-turbo for Hindi/Hinglish] --vocab "<names, jargon>"`. If the user gave a transcript, use it as the truth for wording (fix the words in `transcript.json`) but keep Whisper timestamps. **Validate timestamps**: if any word spans > 2 s or many words share the same time, re-transcribe in 5-12 s chunks (build.md has the snippet) before planning.
2. Decide caption script (Devanagari vs Roman Hinglish) only if unclear; default to Roman Hinglish for Hindi speech.
3. Show **only this**, no preamble:
   - 2 lines: hook (first 1.5 s) + the one-sentence story of the video.
   - **Scene table**, one row per scene, <= 10 words per cell:

   | # | Time | Speaker says | Visual idea (how it explains) | Layout | Asset |
   |---|------|--------------|-------------------------------|--------|-------|
   Asset = `REAL` (Canva design / real footage / photo) or `ANIM` (animation/illustration built in HyperFrames). See "Real vs animated visuals" below.

   Layout = `FULL` (speaker only) / `SPLIT` (graphic top, speaker bottom) / `PIP` (graphic full frame, speaker in a shape window) / `GRAPHICS` (speaker hidden, full-frame motion) - pick per `references/layouts.md`.
4. Planning rules: a visual change every 3-5 s; open with a hook visual or punch-in within 1.5 s; `FULL` for personal/emotional lines and punchlines; `SPLIT` for supporting visuals; `CIRCLE`/`GRAPHICS` for processes, stats, diagrams and anything that needs the whole screen; one idea per scene; the CTA gets its own scene; don't cover the speaker for more than ~6 s unless the graphic is truly explaining.
5. **If any scene uses `PIP`, ask before building** (one short question, in Gate 1 or Gate 2): which scenes, which **shape** - circle / rounded rectangle / rounded rectangle with border / wide rounded rectangle - and which **position** (bottom-centre default, bottom-left/right, top-left/centre/right). Show the options on the user's own face: grab a frame, find the face centre (look at 2-3 frames; fraction x,y of the frame), run `scripts/pip_preview.py <frame.png> <out.png> --face x,y` and send the sheet. PiP always **scales the whole speaker frame down first, then masks it**, so the face is never over-zoomed or cropped (layouts.md).
6. End with one line: "Approve ya changes batao (scene number ke saath)." **Stop and wait.**

## Step 2 - Reference style boards (GATE 2)
(If a sample image/video named below is not in the folder, skip showing it and describe the style in one line.) **Always include the 3D Studio option** (style 11, "3D स्टाइल रील"): send `assets/3d-studio/sample-sheet.png` as its board (+ the path of `assets/3d-studio/sample-easing-final.mp4` if the user wants to watch it) next to the other 4-5 boards, one line: real Three.js 3D, orbiting camera, flat graph cards, small captions, safe-zone layout. Also include the **Simulation** option (style 13, "सिमुलेशन"): `assets/simulation/sample.png` (+ `sample-token-bucket.mp4`), a concept run as a detailed isometric machine with a true model, rendered to MP4 and inserted into Shorts or long videos; follow `references/style-simulation.md` when chosen (it can also be used as a per-scene insert inside any other style). Also include the **Vox documentary** option (style 14, "वॉक्स डॉक्यूमेंट्री"): `assets/vox-docu/insta-storyboard-v5-1.png` / `-2.png` (+ `sample-insta-origin.mp4`), paper-collage explainer with real photos and Wikipedia crops, CSS-3D camera; follow `references/style-vox-docu.md` when chosen (best for history/origin stories/news). Also include the **Stickman** option (style 12): `assets/stickman/sample-sheet.png` (+ `sample-stickman.mp4`), code-built SVG stickman, no API key; follow `references/style-stickman.md` and, for the Director workflow without Gemini, `references/stickman-director-code-mode.md` when chosen (the installed `directing-stickman-videos` skill is only for its story structure / AI-video prompts). If the user says "3D style reel" / picks it, skip the other boards and follow `references/style-3d-studio.md` end to end (it has the template, scripts, layout and gotchas).
After approval, make **4-5 distinct style directions** (pick from `references/styles.md`, skip the style used in the last 2 videos in `style_log.md`). For each style render **2 reference frames from THIS video's real content**: the hook frame and the hardest explainer scene (use the real speaker frame as background where the layout shows the speaker). Build them as 1080x1920 HTML and screenshot with the headless Chrome in `~/.cache/puppeteer` (build.md has the command), then show one contact sheet (styles side by side) with one line per style: name, what it is, how the explainer scene is animated (character / metaphor / diagram / kinetic type), which layouts it uses.
Also say which style you'd pick and why (one line). Let the user pick one, or mix (e.g. "C for hook, A for explainers"). **Stop and wait.**

## Step 3 - Build (only after the style is approved)
Follow `references/build.md`:
0. Generate every `REAL` asset first via Canva (build.md 3b) and look at it before building cards around it.
1. One composition per scene card (HyperFrames HTML/GSAP by default; Revideo for pure diagrams; Remotion for captions/assembly; `faux-3d`/`animate` skills when the chosen style is 3D or cut-paper). Animate to the **spoken word**: each element lands on the word it illustrates.
2. Render cards, assemble with `./vp assemble` using `:split`, `:circle`, `:full`, `:pip` inserts, with captions styled to match the chosen style.
3. Sound pass: SFX per scene (and music only if the user supplies or approves it). Use invideo timeline editor if the user asks for it, else the local ffmpeg mix. Measure loudness; never claim it "sounds good".
4. QA (mandatory): frame grabs at mid-scene of every card plus caption-only moments; check safe zones, text overflow, caption/face collision, wrong timing; fix, re-render (2 rounds is normal).
5. Deliver the final file with `SendUserFile`, plus a short Hinglish summary: scenes done, layouts used, loudness numbers, 3-5 timestamps to check with headphones, one next tweak offer.
6. Append a line to `~/claude-video/style_log.md` (date, video, style, palette, fonts) so the next video differs.

## Platform notes (macOS and Windows)
The same skill runs on macOS and on Windows (Claude Code uses Git Bash there). Always go through the launcher: `./vp <command>` (Git Bash / Mac) or `vp.cmd <command>` (PowerShell). Never call `python3`, `open`, `afplay`, `/tmp` or `~/.cache/...` directly:
- Python scripts: `./vp py <script.py> args` (uses the workspace venv on both systems).
- Headless Chrome for screenshots: `"$(./vp chrome)" ...`; on Windows write file URLs as `file:///C:/Users/<name>/...` (forward slashes).
- Temp files go to the scratchpad / `tempfile`, never `/tmp`.
- **Fonts**: the CSS stacks in the style references name macOS fonts. On Windows put a fallback right after them: Helvetica Neue -> `'Segoe UI', Arial`; Menlo -> `Consolas, 'Courier New'`; Didot -> `'Bodoni MT', Georgia`; American Typewriter / Chalkduster -> `'Courier New'` / `'Segoe Print'`; Devanagari (Hindi) -> `'Nirmala UI'`; Impact / Arial Black / Georgia exist on both. Check the QA frames for a font that fell back and looks wrong.
- Windows paths have a 260-character limit: keep reel names short (`my_reel`, not long sentences).

## Always
- Every video: new style, new graphics, new animation language. Never reuse last video's cards.
- Respect Shorts/Reels UI zones (layouts.md): nothing important in the top 250 px, the bottom ~380 px, and keep **equal 120 px margins left and right** (centre everything; never let content lean to one side).
- Scene transitions are smooth crossfade + gentle slide (layouts.md), never stiff or cluttered.
- A video may mix styles (e.g. chalk sketch + stickman + dark cinematic titles + real 3D only where 3D explains); keep one consistent background and type system. Reference build: `engines/hyperframes-app/compositions/viral-mix.html`.
- Captions: word-synced, never on the speaker's face during SPLIT (put them on the seam or in the graphic half); in PIP they sit just below the window.
- **No glow, no neon halos, no bloom/blur-glow shadows** (reads as AI-generated). Borders are plain, 8 px, solid. Border colour follows the background: **white on dark backgrounds, ink `#111111` on light backgrounds**; or one of the premium colours below if the user picks one.
- PiP: never just circle-mask the zoomed video. Scale down first, keep head + shoulders + headroom, verify in the QA frames that the face is complete and centred.
- Keep replies short. Tables and one-liners. Ask at most one question at a time, only at the gates.
- Don't modify the user's original files or anything outside `~/claude-video`.
