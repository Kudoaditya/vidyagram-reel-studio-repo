# Layouts and safe zones (1080x1920, 30 fps)

## Platform UI zones (Shorts / Reels / TikTok overlap the frame)
| Zone | Keep clear |
|------|-----------|
| Top | **250 px for text** (status bar, search, "Shorts" label; the user's phone hid titles placed at y 200). Titles start at y >= 260 |
| Bottom | ~380 px (title, channel, music, comments) -> captions' bottom edge <= y 1540 |
| Right side, lower half | ~130 px wide, y 1000-1700 (like / comment / share buttons) |
| Left/right margins | **equal 120 px on BOTH sides** (the right-side buttons are ~130 px, so mirror it on the left). Cards/posters max 840 px wide, centred; scene art must fit x 120-960 |

Key text and faces live in x 120-960, y 260-1540. Backgrounds and colour fills may bleed to the edge.
The speaker's face should stay inside x 150-930, y 250-1300 in every layout. Don't let a graphic or caption sit on the face.

## Speaker layouts (what each does in the pipeline)
| Layout | When | `./vp assemble` insert | Insert canvas | Notes |
|--------|------|------------------------|---------------|-------|
| `FULL_SPEAKER` | hook, personal lines, punchlines | no insert | - | add subtle punch-ins; captions at the bottom (pb 330) |
| `SPLIT` | supporting graphic while the speaker keeps talking | `file@t:split+dur` | **1080x1000**, content y 160-780 on the right, up to 880 on the left (diagonal speaker edge) | speaker moves to the bottom with a diagonal cut; captions sit on the seam |
| `PIP` (speaker in a shape) | long explainer that needs the full screen but keeps the speaker present | `file@t:circle+dur`, `:round`, `:frame`, `:wide`, optionally `.pos` e.g. `:frame.tr+4` | **1080x1920** | graphic full frame; speaker window per the shape table below; captions just below the window |
| `GRAPHICS_ONLY` | stats, diagrams, process, scene changes | `file@t:full+dur` | **1080x1920** | speaker hidden, voice continues, captions on top |
| `PIP_LEGACY` | small corner clip | `file@t:pip+dur` | any | plain rounded corner window, top right |
(`top` = legacy card above captions; prefer `split`.)

## PiP shapes (ask the user which one, and where)
| Shape | Window | Look | Use |
|-------|--------|------|-----|
| `circle` | 460x460 | circle + plain border | classic, friendly |
| `round` | 560x640 | rounded rectangle, no border | clean, minimal |
| `frame` | 560x640 | rounded rectangle + plain border | premium, matches the border colour |
| `wide` | 760x520 | wide rounded rect + plain border | shows more body language/hands |
Positions (`.pos`): `bc` bottom-centre (default), `bl`, `br`, `tc`, `tl`, `tr`. Window bottom edge <= y 1340 (captions 1380-1540), top edge >= 180, right margin 130 (platform buttons). Keep graphic detail out of the window area.

**Never over-zoom the face.** The pipeline scales the *whole* 1080x1920 speaker frame down first (video width ~ the window width x 1.0-1.12, i.e. the full width of the original frame fits), then masks it into the shape and centres on the face (`--face x,y`, default 0.5,0.36; set it per video from real frames; the window puts the face slightly above centre for headroom). Result: head, shoulders and some background visible. After rendering, check in a QA frame that the whole head with headroom is visible; if it feels tight, lower `k` in `engines/remotion-app/src/components/pip.ts` (and `scripts/pip_preview.py`, keep both in sync) or widen the window. 
### Border colour (plain 8 px line, **never a glow**)
Default by background: dark -> white `#FFFFFF`; light -> ink `#111111`. Offer these premium options and let the user choose (pass with `--accent "#hex"`):
| Name | Hex | Best on |
|------|-----|---------|
| White | `#FFFFFF` | dark backgrounds (default) |
| Ink | `#111111` | light / cream backgrounds (default) |
| Champagne gold | `#C9A24B` | dark, premium/cinematic |
| Cream | `#F4EFE3` | dark, editorial/soft |
| Rose gold | `#B76E79` | dark or light, warm |
| Emerald | `#1F6F5C` | light or dark, calm/finance |
| Navy | `#1B2A49` | light backgrounds |
| Burgundy | `#7A1F2B` | light backgrounds |
Show them on the user's frame: `pip_preview.py <frame> <out.png> --face x,y --colors --shape frame [--bg "#F4EFE3"]` (one shape in all 8 colours; pass `--bg` light or dark to match the video).

Preview the shapes on the user's own frame before asking: `./vp py ~/.claude/skills/reel-studio/scripts/pip_preview.py <speaker_frame.png> <out.png> --face 0.55,0.36 [--pos bc] [--accent "#hex"]`.

Scene-to-scene transitions must be soft, never stiff: outgoing scene fades + drifts up ~26 px over 0.6 s, incoming starts 0.2 s early and rises from +36 px over 0.7 s (ease power2); canvas/3D layers cross-fade over 0.7 s. No hard cuts between graphic scenes unless the beat demands it.
Transitions: speaker box eases over 8 frames. Cards should animate in within ~0.35 s and exit with a short fade/slide in the last 0.2 s. Leave 0.3-0.5 s of FULL between consecutive graphics when possible so the speaker "breathes".

## Caption rules
- Word-synced, max 2 lines, <= 18 characters per line-ish, 80-92 px.
- Active word highlighted (tape, colour or scale), others neutral.
- FULL: bottom area (pb 330). SPLIT: on the seam (pb ~880). PIP: just below the window (pb 380, i.e. y 1380-1540). GRAPHICS: pb 330.
- Style captions to the chosen style (paper: serif on cream tape; HUD: mono caps; kinetic: Impact on yellow tape; glass: Inter on blurred pill-free scrim).

## Card checklist
- Canvas size matches layout (see table). Background fully opaque for SPLIT/GRAPHICS.
- Text >= 56 px for main words, >= 30 px for labels; contrast >= 4.5:1.
- Nothing important inside the diagonal zone (below y 790 right / 920 left for SPLIT).
- Duration = how long the idea is spoken; time every element to its spoken word (take timestamps from `processed_audio/<stem>/transcript.txt`).
