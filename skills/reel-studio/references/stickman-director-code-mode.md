# Stickman Director - code-render mode (no Gemini / no video-gen API)

Use the installed skill **`directing-stickman-videos`** (kaomei/stickman-video-director, `~/.claude/skills/directing-stickman-videos/`) for everything it is good at - setup gate, narrative engine, director's proposal, style catalog, voice profile - but **replace Phase B (Gemini Omni Flash prompts) with a code build** using the Stickman rig (`style-stickman.md`, `assets/stickman/template.html`). Autopilot (needs `GEMINI_API_KEY`) is **not** used.

## Flow
1. **Setup gate (Director contract)**: source (topic/script/article), aspect ratio (`9:16` shorts, `16:9` long), duration, visual style (table below). Ask all missing items in one short message. Narration language = user's language (Hindi/Hinglish) - override of Director's "English VO" because we generate our own voice (an ElevenLabs Hindi/Hinglish voice of your choice, `eleven_v4`).
2. **Phase A - Director's proposal**: read the skill's `references/storyboard-template.md`, `style-catalog.md`, `voice-continuity.md`; apply the **5-stage heartbeat** (Golden Hook -> Disrupt assumption -> Insider secret -> Ultimate truth -> Punchline + discussion question), word budget 20-25 words per 10 s (Hindi: ~same spoken length), clips of ~10 s (long videos: group clips into 30-60 s chapters). Show the proposal and **stop for approval** (any change of style/duration/script = re-approve).
3. **Skip** `omni-flash-prompt-contract.md`. Instead write a **Code Scene Sheet** (one row per beat, 3-5 s): `time | spoken words | pose(s) | prop/set | camera move | title (<=3 words) | SFX`. Poses come from `POSE` (add more as needed). Also list props to build.
4. Voice: generate with ElevenLabs after the script is approved (retention rules in `style-3d-studio.md`), or use the user's audio. Transcribe + align captions (`scripts/align_captions.py`).
5. Build per chapter with the stickman template (`CFG` preset per style), draft-render, QA frames with the safe-zone guides (red line y=1320), fix, delivery render, then one full SFX + loudness pass (`scripts/mix_sfx.py`). Deliver; log in `style_log.md`.

## Director style -> code look (set `window.CFG` before the rig script)
| Director style | Code version | Status |
|---|---|---|
| Style 1 Classic **Light** | `CFG={line:"#111",headFill:"#fff",beanie:false,ground:"#FFFFFF",groundLine:"#111",bg:"#FFFFFF",text:"#111"}`, hollow head, <=3 saturated accent props | **Done** - `assets/stickman/presets/classic-light.mp4` |
| Style 1 Classic **Dark** | `CFG={line:"#FFFFFF",headFill:"#0B0B0F",beanie:false,ground:"#0B0B0F",groundLine:"#FFFFFF",bg:"#0B0B0F",text:"#FFFFFF"}` | **Done** - `presets/classic-dark.mp4` |
| Our house look (beanie, warm cream) | default `CFG` | **Done** - `sample-stickman.mp4` |
| Style 2A Modern Studio Tech | white studio + light-grey perspective grid (CSS 3D plane) + cyan glass UI cards (flat HTML), red beanie | Buildable (needs set pieces) |
| B1 Minimal hand-drawn | cream paper bg, wobbly hand-drawn strokes (SVG turbulence filter or jittered paths), crayon icons from `directing-stickman-videos/assets/b1/*.png` | Buildable |
| Style 2B Cinematic, 3 Prehistoric, 4 Cozy, 5 Historical | flat-vector environment packs (layered SVG backgrounds, costume props: hide cloak, hat, kimono...) with gradients/lighting; **simplified** vs the painterly AI-video originals | Buildable "lite"; tell the user it will not match the cel-shaded/painterly clips |

## Honest limits
Code gives perfectly consistent characters and zero API cost, but no photoreal/painterly AI motion, no fingers/hands, limited facial expression. Keep scenes graphic: poses + props + camera pans + titles + flat cards. For 9-10 min videos alternate stickman chapters with 3D Studio / chart-card scenes.
