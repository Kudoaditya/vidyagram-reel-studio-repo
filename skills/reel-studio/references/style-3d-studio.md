# Style 11 - "3D Studio reel" (3D स्टाइल रील)

Real Three.js 3D (not faux-3D): warm studio set, orbiting/flying camera, soft shadows, tangerine/teal/violet objects on white lanes, flat 2D graph cards on top, one big bold title at a time, small word-synced captions, tiny SFX. Born from the **Easing** reel (user: "mind-blowing"). Best for **voiceover-only explainers** of a concept with motion/steps/comparisons (animation, speed, process, before/after, rules, tools). Not for talking-head edits (use SPLIT/PIP styles).

Samples to show at Gate 2: `assets/3d-studio/sample-sheet.png` (8 frames) and the full video `assets/3d-studio/sample-easing-final.mp4`. Reference full composition: `assets/3d-studio/reference-easing-final-full.html`. Template (placeholders `__ICONS__`, `__CAPS__`): `assets/3d-studio/template.html`.

## Look (design tokens)
- Background: warm cream radial `#FFF6E8 -> #F3E7D2 -> #E8D8BC` (CSS behind a transparent canvas); fog colour `0xF0E4CF`.
- Objects: tangerine `#FF6A1F` (hero / "alive"), teal `#0FA3A3`, violet `#7A5CFA`, sun `#FFC233` (dots, footprints, keyframes), robot grey `#959CB8`, ink `#1F2033`, lane slab `#FBF8F2`, pad `#F0DFB4`. Change the hero palette per video (keep cream stage) so videos differ.
- Type: Helvetica Neue 900, tracking -0.025em, ink; one accent-coloured word/period (`EASING.`). Titles reveal with a mask slide-up (`yPercent 125 -> 0`, power4.out) and slide out up. Never stacked giant titles, no shake/slam.
- Captions: small dark pill (`rgba(31,32,51,.9)`, 44px/800), active word highlighted `#FF9A57`.

## Layout / safe zones (YouTube Shorts + Instagram + TikTok)
- Title y~190-310. Flat graph card y 340-740 (820x400, x 130). 3D content below it, **ends above y~1320**. Captions top 1370 (height 96). **Bottom ~500 px stays empty** (UI buttons/title). Nothing important in right 130 px of the lower half.
- QA with guides: `ffmpeg -vf "drawbox=y=ih*1320/1920:w=iw:h=1:color=red@.8:t=fill"` on frame grabs; objects/graphs must stay above the red line and inside x 60-1020.
- Graphs/charts are **flat HTML/SVG cards** (never 3D plates in the scene: they crop when the camera orbits). Fade title+card out before each camera fly (b-.4) and in after arrival.

## Engine (all in the template)
- `three@0.181.2` via importmap (jsdelivr), `RoundedBoxGeometry`; `data-duration` on root; render only in the `hf-seek` handler: `tl.time(t,false); renderAt()`; GSAP drives plain properties (`mesh.position`, `.scale`, `.rotation`, `cam` state). Textures (app icons) load via TextureLoader -> register on `window.__hf.buildReady`.
- Stations: each scene is its own station, `Z(i) = -70*i`, fog 32..85 hides neighbours. Camera plan `CP[]` per scene: `{b0,b1 (scene start/end = voice beat), tz, ty, a0->a1 (azimuth drift), e (elevation), d (distance)}`; between scenes a 1 s `power3.inOut` fly + FOV kick (40->50->40). Hook: camera spins down from `az 200 el 75 d 40 fov 52` to the first station in 1.9 s.
- Builders: `lane`, `robot()` (grey metal ball, antenna, square eyes) vs `alive()` (orange ball, eyes, smile) - **same size/shape so only the motion differs**, `car` (body/hood/cabin/glass/lights/wheels with pitch, bounce, dust, camera follow via `camOff`), `phone`, `key` (keycap with canvas texture), bookmark (ExtrudeGeometry), `glyph()` sprites ("?", check), `shards()` bursts, icon sprites (billboards), `drop3/pop3` entrances.
- Overlays: `title(id,html,top,t0,t1,size)`, `card(id,[[ease,color],..],t0,t1)` + `cdrive(id,i,t0,dur)` (curve draws and dot moves in sync with the object's real ease), captions from `captions_final.json`.

## Build recipe (inside reel-studio Step 3)
1. Voiceover: user's file or ElevenLabs (`eleven_v4`, a Hindi/Hinglish voice you pick (creative_list_voices) for Hindi, tone tags `[energetic, upbeat...]`; script rules below). Copy to `input_raw/<stem>.mp3`.
2. Transcribe with faster-whisper (`large-v3-turbo`, `language=hi`, word timestamps); re-run weak spans with `clip_timestamps="a,b"`, `condition_on_previous_text=False` (long segments can swallow 10 s).
3. Captions: write `script.txt` (the approved script) -> `./vp py ~/.claude/skills/reel-studio/scripts/align_captions.py script.txt words.json captions_final.json`.
4. Scene plan (Gate 1): station per idea, 5-9 scenes, camera plan, one title + optional card per scene, every object lands on its spoken word. Hook = camera spin + two characters racing + 1-2 hook titles in the first 9 s.
5. `./vp py ~/.claude/skills/reel-studio/scripts/build_3d.py engines/hyperframes-app/compositions/<stem>-3d.html --captions captions_final.json --icon cap=assets/keyframe/Capcut-icon.png ...` then edit the scene blocks (stations, tweens, titles, cards, CP).
6. Draft render fast: `cd engines/hyperframes-app && npx --no-install hyperframes render -c compositions/<stem>-3d.html -o ../../output_renders/hf-<stem>-draft.mp4 -f 30 -q draft --quiet` (~1-2 min for 56 s). QA grid of ~16 frames with the red guides; fix; then `-q delivery`.
7. SFX + loudness: `./vp py ~/.claude/skills/reel-studio/scripts/mix_sfx.py voice.mp3 render.mp4 out.mp4 cues.json` (impact on titles/arrivals, whoosh at fly, pop on entrances, tick on footprints, click on presses). Music only if the user supplies it (Epidemic: light upbeat corporate-tech, 100-115 BPM, instrumental, -20..-24 dB under voice).
8. Deliver with `SendUserFile`; log in `style_log.md`.

## Retention-first script rules (voiceover reels)
Hook in line 1 (show the result/contrast), name the thing by sec ~9, one idea per line, no long tangents (the Keyframe reel lost viewers at ~48 s on an app list), ~45-55 s total, one short practical tip, CTA = "save this reel" just before the last line, last line loops back to the opening visual ("ab wapas dekhiye pehli animation ko... farq dikh gaya na?").

## Gotchas (all hit once)
- Duplicate DOM ids silently break `querySelector` tweens (a diamond and a scene both called `d2`).
- Scale-in with `fromTo(...immediateRender)` then a later `to(scale)` squash starts from 0 -> object vanishes; use `fromTo` with explicit `{x:1,y:1,z:1}` for squash.
- `tl.to` on a property first read after a later `set` can pick wrong start values; prefer `fromTo` + `immediateRender:false` for repeat visits (loop ending).
- Camera too close crops lanes at the screen edge: for portrait keep lane length <= ~8.4 units, `d` 20-30, azimuth 55-75 (end-on) not 0.
- Stations closer than ~60 units show neighbours (huge white slabs in frame); keep `Z=-70*i` and fog.
- Title exit and next title entrance must not overlap (exit at t+1.4 when the next starts at t+1.8).
- Three/GPU render is fast (ANGLE/Metal): 56 s draft ~1-2 min.
