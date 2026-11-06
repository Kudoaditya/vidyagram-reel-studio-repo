# Style 12 - "Stickman" (code-built 2D stickman explainers, no Gemini/video-gen API)

A jointed SVG stickman rig animated with GSAP inside HyperFrames: walk cycle, wave, think, point, cheer/jump, mouth states, props (bulb, "?", arrows, cards), confetti, mask-slide titles, small captions. Same brand stage as 3D Studio (warm cream, tangerine beanie, ink lines) so both styles mix in one long video. Everything is HTML/SVG/CSS + GSAP -> deterministic render, any length, no API key, no per-clip cost.

Samples to show at Gate 2: `assets/stickman/sample-sheet.png` and `assets/stickman/sample-stickman.mp4` (10 s: walk-in, wave, think + "?", idea bulb, cheer + confetti). Template with placeholder `__CAPS__`: `assets/stickman/template.html` (fill with `scripts/build_3d.py <out> --captions captions.json --template assets/stickman/template.html`, or `sed`).

**Workflow:** when the user wants the Director experience (proposal, 5-stage script, style choices) follow `stickman-director-code-mode.md` - Director Phase A from the installed skill, then code build instead of Gemini prompts. Presets: `assets/stickman/presets/{classic-light,classic-dark}.mp4` (+ `-sheet.png`), switched with `window.CFG` (see template top).

## How it relates to the installed `directing-stickman-videos` skill
- That skill (kaomei/stickman-video-director) = **A Director**: storyboard + prompts for AI video clips (Gemini Omni Flash), **B Autopilot**: local renderer with Gemini-generated illustrations. Both need `GEMINI_API_KEY` (Autopilot) or an external video generator (Director).
- This style = **code-only**. Use `directing-stickman-videos` for: its story structure (5-stage "heartbeat": hook -> disrupt assumption -> insider secret -> truth -> punchline + discussion prompt), style references (`references/style-catalog.md`, `cozy-storytelling.md`, `historical-cartoon.md`), storyboard template. Do the animation here.

## Rig (see template.html)
- `stick(x,y,scale)` returns joints `{LT,LS,RT,RS (thigh/shin), LA,LF,RA,RF (arm/forearm), torso, head, eyes, m_smile,m_open,m_flat, root}`; angle 0 = limb hanging down, positive = swings to screen-left, negative = screen-right (right arm out = -90, up = -150..-170).
- `POSE` table + `pose(tl,J,name,t,dur)`; add poses: shrug, sit, run, facepalm, point-left, hold-object. `mouth(tl,J,kind,t)`.
- `walk(tl,J,t0,dur,x0,x1,steps)` is a pure function of progress (seek-safe): thigh swing, shin bend, arm swing, body bob. Run = more steps + bigger angles; sit/lie = rotate torso/legs.
- Props are plain SVG groups popped with `fromTo(scale 0->1, back.out)`. Build new props (laptop, phone, chart, coin, door, arrow, clock, speech bubble) the same way, ink outline 9 px + one accent fill.
- Multiple characters: call `stick()` again with another beanie colour (teal/violet) - never copy the same colour twice in one scene.
- Camera: wrap `world` in a group and tween its x/scale for pans and punch-ins (no real 3D here).

## Look + layout (same rules as 3D Studio)
- Ink `#1F2033` 11-13 px round-cap lines, white head, beanie tangerine `#FF6A1F`; accents teal `#0FA3A3`, violet `#7A5CFA`, sun `#FFC233`. Ground line at y~1240; character feet on it; head top >= y 540.
- Safe zones: title y~190, graph/card y 340-740, character + props end above y~1320, captions top 1370, bottom ~500 px empty, right 130 px free in the lower half.
- One idea per beat (3-5 s), a new pose or prop every 1-2 s, mask-slide titles only where needed, captions small.

## Long videos (9-10 min) with this style
Chapter = 30-60 s (one story beat). Per chapter: 1 storyboard line, 6-12 pose/prop beats. Alternate stickman scenes with 3D Studio/isometric scenes and flat chart cards every 1-2 min to avoid monotony. Build and render per chapter (`-q draft` first), concatenate with ffmpeg, then one caption + SFX + loudness pass over the full audio. Keep the rig in a shared `rig.js` pasted into each chapter composition.

## Known limits (sample level)
Front-view figure walking sideways reads as classic stickman; arms-up cheer overlaps the beanie (offset forearms +-20 for hands apart); no hands/fingers; add per-video polish passes on poses.
