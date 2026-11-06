# Build, render, assemble, sound, QA (with every gotcha learned)

All paths relative to `~/claude-video`. Use `./vp`. Scratch files go to the session scratchpad, not `/tmp`.

## 1. Transcript
- `./vp preprocess <file> --language hi --model large-v3-turbo --vocab "..."` (Hindi/Hinglish). Always read `processed_audio/<stem>/transcript.txt`.
- **Bad word timings** (one word spanning 10+ s, repeated junk words at the end) happen with VAD on long clips. Fix: re-transcribe in chunks with `faster_whisper` (`vad_filter=False`, `condition_on_previous_text=False`, `initial_prompt=<vocab>`, chunks of 4-12 s cut with ffmpeg `-ss/-to`), add the chunk offset to each word, then write `words`/`segments[0].words` back into `transcript.json` and run `./vp captions <stem>`. Run Python with `.venv/bin/python -I` and **never name a scratch file after a stdlib module** (`re.py` broke Python).
- Proofread against the user's transcript; fix names. For Roman Hinglish captions, transliterate word-by-word into `transcript.json` (keep a copy of the Hindi version as `transcript_hindi.json`), then `./vp captions <stem>`.

## 2. Reference frames (Gate 2)
1. Grab speaker stills: `ffmpeg -ss T -i processed_audio/<stem>/<stem>_cut.mp4 -frames:v 1 spN.png`.
2. Write one HTML per frame (1080x1920, absolute-positioned, system fonts: Impact, Georgia, Menlo, Helvetica Neue; use `.replace()` not `%` formatting for CSS containing `%`).
3. Screenshot: `"$(./vp chrome)" --no-sandbox --hide-scrollbars --allow-file-access-from-files --window-size=1080,1920 --screenshot=out.png file:///path/frame.html`.
4. Contact sheet: `ffmpeg ... -filter_complex "[0][1]hstack,scale=640:-1"` per style, then `hstack` the styles. Send with `SendUserFile` (display render).

## 3. Scene cards (HyperFrames)
- One HTML per card in `engines/hyperframes-app/compositions/<name>.html`. Root: `data-composition-id="main"`, `data-width/height` (1080 x 1000 for SPLIT, 1080 x 1920 for CIRCLE/GRAPHICS), `data-duration`, a `class="clip"` child **with an id**, paused GSAP timeline registered as `window.__timelines["main"]`, `tl.seek(0)` at the end.
- Declare local fonts: `@font-face{font-family:'Kohinoor Devanagari';src:local('Kohinoor Devanagari')}` (lint error otherwise). Animate transforms/opacity only (no `top`/`letterSpacing` tweens: lint error). Don't start a full-frame overlay visible before its first tween.
- Render **directly** (the project `hyperframes check` fails on stray legacy `r2-*.html` files in the app root, so `./vp hyperframes` stops): 
  `cd engines/hyperframes-app && npx --no-install hyperframes render -c compositions/<name>.html -o ../../output_renders/hf-<name>.mp4 -f 30 -q delivery --quiet`. "drawElement calibration failed / small frame" warnings are harmless (it falls back to screenshots).
- Time elements to words: card-local time = word start - insert start.
- Revideo for node-and-arrow diagrams; `faux-3d` / `animate` skills for 3D or cut-paper looks.

## 3b. Real assets from Canva (REAL scenes)
1. Two parallel `create-design` calls (e.g. cluttered "before" + clean "after"), format `Poster (Portrait)` or whatever the scene needs (Instagram Post, YouTube Thumbnail, Presentation...). Brief = subject, exact wording, what must look bad/good. Wait 15 s, poll `get-create-design-async-job` (job_id + continuation_token) until `completed`; it returns a design id (`D...`).
2. `export-design` with `{"type":"png","width":1200}`; download the returned URL with `curl -sL -o ~/claude-video/assets/<stem>/<name>.png '<url>'` (quote the URL, it is signed and short-lived). Always look at the PNGs (hstack to a contact sheet) before using them.
3. Embed in cards as base64 JPG (`ffmpeg -vf scale=900:-1 -q:v 3`) so renders stay offline: `scripts/c8275/lib.py` `real()` is the template (white 8 px border, hard shadow, scaled in a wrapper div).
4. Overlay badges/counters/dots on the real image in poster coordinates (read face/text positions off the PNG), put numbered badges in corners or edges, never on faces or the text being counted.
5. Tween scale on an outer wrapper (GSAP's `scale` replaces a CSS `scale()` transform on the same element, `tf()` + `scale:` made posters jump size).
6. Tell the user the Canva design links so they can edit; re-export and re-render if they change them.
Example: C8275 (hook = cluttered poster, middle = illustrated explainers, end = clean poster before/after).

## 4. Assemble
```
./vp assemble <stem> \
  --insert output_renders/hf-a.mp4@0.2:split+3.2 \
  --insert output_renders/hf-b.mp4@11.4:circle+4.4 \
  --insert output_renders/hf-c.mp4@21.6:full+2.7
```
Per-video options: `--face x,y` (face centre as fractions of the frame, used to frame the speaker in PiP shapes) and `--accent "#hex"` (plain PiP border colour: white on dark, #111111 on light, or a premium colour the user picked; no glow). PiP inserts: `:circle|:round|:frame|:wide` + optional `.pos` (`bc bl br tc tl tr`); graphic canvas 1080x1920.
`@when` is seconds in the cut video or a transcript phrase. Output: `output_renders/<stem>-final.mp4` (overwritten each run: copy it to a unique name straight away, e.g. `<stem>-<style>-nosfx.mp4`).
Layout code: `engines/remotion-app/src/Reel.tsx`, `components/Inserts.tsx`, `components/split.ts` (split + circle progress), `components/Captions.tsx` (restyle captions per video here; positions use `useSplit`; inside a `<Sequence>` the frame is local, so pass the page start as offset).
Run `npx --no-install tsc --noEmit` in `engines/remotion-app` after any change.

## 5. Sound
- Local kit: `~/.claude/skills/sound-effects/sfx/kit/{whoosh,pop,click,impact,tick,riser}.ogg` (CC0). Read the `sound-effects` skill for licence rules. No synthesized beeps.
- Cue map: whoosh = card in (2 frames early) and long card out; impact = biggest slam / reveal; pop = element appears; tick = arrow draws / list items; click = typing / UI press; riser ends on a hit.
- Gains used successfully (per track, voice-first): whoosh -16 dB, pop -20, tick -22, impact -18. Raw clips are loud: at -8/-12 dB they pushed the master to the -1 dBFS limiter.
- **invideo timeline (when the user asks for it):** `new_project` / reuse project -> `register` a name -> `new_timeline` (width 1080, height 1920, fps 30) -> `start_upload` + `curl -X PUT -H 'content-type: video/mp4' --data-binary @file '<upload_url>'` -> `add_media` with `upload_id` (add media **one call at a time**, parallel calls race) -> reuse SFX already in the project via `add_media` with `media_url` = the earlier sequence URL -> `edit_timeline` with `place_media` (video on V1 with `linked_audio` on A1, `mode: overwrite`) + `add_track` (audio) + `insert_media` (`ripple:false`, frames = seconds x 30) + `set_audio_gain` per track -> `export` (video, 1080) -> poll `read` on the export URL (it lists `export.files[].url` before status turns `completed`; download with curl) -> measure. To swap the base video later: upload again and `place_media` overwrite at frame 0.
- Without invideo: mix with ffmpeg `adelay` + `amix` over the speaker audio, then `loudnorm`.
- **Measure the exported MP4**: `ffmpeg -nostats -i out.mp4 -af ebur128=peak=true -f null - 2>&1 | tail -12`. Targets about -14 LUFS (shorts) and true peak <= -2 dBFS (invideo limiter ceiling is -1). Report numbers honestly, say SFX were measured not listened to, and give 3-5 timestamps for the user to check.

## 6. QA (mandatory, before delivering)
- Top cards (`:top`) sit at y 175 (not 120): card canvas 1080x300-420 keeps it clear of the top 160 px. Captions: bottom padding 400 so the edge stays <= y 1520.
- Frame at the middle of every card + 3 caption-only moments, scaled to ~300 px, `hstack` -> look at them. Check: overflow/cropping, safe zones, caption over face, text readable, element timing vs words, correct layout transitions, audio present, duration equals the cut video.
- zsh gotcha: `for r in "a b"; do set -- $r` does not split; use `${=r}` or `a:b` with `${x%%:*}`.
- Fix and re-render; two rounds are normal.

## 7. Deliver
`SendUserFile` the final MP4 (display attach) + the QA strip if useful. Hinglish summary: layouts per scene, loudness numbers, timestamps to check, one next tweak. Append to `~/claude-video/style_log.md`.
