---
name: longform-explainer
description: Turn the user's finished 7-10 min talking-head video (already cut, with script + transcript) into a 16:9 1920x1080 premium explainer - full-frame animated scenes (quotes, stats, charts, flows, steps, calculators, pricing, chat, code) timed to the speech while the speaker glides into a rounded "pill" on the side. Nick Saraev style. English-first on-screen text in Latin script. Use for long videos / YouTube explainers / "long form", "16:9", "Nick Saraev style" - NOT for 9:16 reels (use reel-studio).
---

# longform-explainer (style: premium dark, Nick Saraev-type 16:9 explainer)

Runs on `~/claude-video`. Reference analysis: `~/claude-video/docs/nick-saraev-style-roadmap.md`.
The user shoots + cuts the video themselves, then gives: **final video + script + transcript**. Do NOT cut dead air (`--cut none`). Reply in the user's language (Hinglish).

## Hard rules
- **Speaker pill must NEVER crop the face.** The whole 16:9 speaker frame is scaled DOWN first, then positioned so face + shoulders/upper body stay visible inside the rounded shape (pill 380x420, `--face x,y` = face centre as fractions of the frame, `--zoom` 1.0 = full height visible, up to ~1.3 only if the face stays well inside). In QA always check the pill frame: forehead, chin, both ears and hands-in-frame not cut. If the speaker sits off-centre, set `--face`.
- **On-screen text = ENGLISH-FIRST, Latin script only.** Even when the user speaks Hindi, titles/labels/chart text/bullets are written in English ("After vs Before", "Goal", "Context", "Verify") - translate Hindi words to their English meaning instead of transliterating them ("Pehle vs ab" is WRONG -> "Before vs After"). Hinglish (Latin-script Hindi) only sparingly, for a punchy phrase that is better in Hinglish (e.g. a quote the user said that way). Never Devanagari. Short, crisp, 1-4 words per label. `build_scenes.py` refuses Devanagari.
- Look: near-black bg, white/grey type, serif headings, ONE restrained accent (default champagne `#E8C48A`; alt sage `#7FB6B0`, ice `#9DB4D6`). Never rainbow. Accent marks the hero element only.
- Content stays inside the stage (x 110-1450): speaker pill docks right (x 1484-1864). Templates already respect this.
- One idea per scene; visual appears within ~3 s of the line being spoken; scene 4-14 s; keep >=3 s of full-screen speaker between scenes (hook, emotion, stories, CTA stay on face).
- Don't invent numbers/claims the speaker didn't say. Use the script for exact figures.

## Workflow (3 gates, like reel-studio)
1. **Prep** - `cd ~/claude-video && ./vp preprocess <video> --wide --cut none --language hi --model large-v3-turbo` (for English use `--language en`). Read `processed_audio/<stem>/transcript.txt` + the user's script. Use `transcript.json` word timestamps for exact seconds (`at` as seconds is the reliable anchor; phrase anchors only match the transcript's own script).
2. **Gate 1 - beat sheet**: table `time | what is said (1 line) | template | on-screen Hinglish text/numbers`. Aim ~1 scene per 12-20 s. Show it, wait for approval.
3. **Gate 2 - look**: render 3 representative scenes (`--only`) + one assembled pill frame; confirm accent / pill side. Skip if the user already approved the look.
4. **Build**: write spec JSON (see `assets/example_spec.json`) -> `./vp py ~/.claude/skills/longform-explainer/scripts/build_scenes.py spec.json [--only ids] [--jobs 3]` -> MP4s in `output_renders/lf/` -> write plan JSON `[{"src":"output_renders/lf/s01.mp4","at":12.4}]` (dur defaults to the clip length) -> `./vp longform <stem> --scenes plan.json [--face 0.5,0.4] [--side right|left]` -> `output_renders/<stem>-longform.mp4`.
5. **QA**: contact sheet of frames at each scene start / middle / end + one pill frame. Check: no text clipped, nothing under the pill, face framed in the pill (tune `--face x,y`), scene length matches the spoken line. Fix and re-render only changed scenes (`--only`).
6. **Sound (optional)**: `sound-effects` skill, soft whooshes on scene in/out, music bed -22 LUFS under voice, final -14 LUFS.
7. Log the style/outcome in `~/claude-video/style_log.md`.

## Scene types (`type`, params; `id`,`dur`(sec) always required)
| type | params |
|---|---|
| title | kick, lines[], sub |
| quote | text, hl[] (words in accent), by, role |
| stat | kick, label, value, prefix, suffix, dec, caption |
| steps | kick, title, items[{t,d}] (2-5), active |
| compare | kick, title, left{h,items[]}, right{h,items[]}, verdict |
| bars | kick, title, items[{l,v}], unit, prefix, hot |
| line | kick, title, points[], labels[], endLabel |
| flow | kick, title, nodes[{t,s}] (2-5) |
| checklist | kick, title, items[], style:"check"/"cross" |
| calc | kick, title, inputs[{l,show,pct}], result{l,value,prefix,suffix} |
| code | kick, title?, file, lines[] (typed live) |
| chat | kick, title?, items[{who:"me"/"ai",text}] |
| tree | kick, title, root, children[], grand[[..]] |
| pricing | kick, title, tiers[{n,price,unit,note,hot}] |
| scale | kick, title, left{l,v}, right{l,v} |
| fill | kick, title?, prefix, cands[{w,p}], note (sentence + blank + word probabilities) |
| tokens | kick, title, chips[], ids[], note (words flip into numbers) |
| attention | kick, title, rows[{words[],focus,w[]}], note (arcs, thickness = attention) |
| merge | kick, title, items[], result (bubbles click into one idea) |
| loop | kick, title, steps[], count{to,suffix,label} (cycle speeds up, counter climbs) |
| truth | kick, left, right, symbol, tag (A != B slam) |
| elephant | kick, prompt, score, tag (illustrated cricket scene, blue elephant hits a century; copy the pattern for other illustrated explainers) |
| wordbyword | kick, prompt, words[], note (chat reply appears one word at a time) |
| funnel | kick, title, items[], target, note (sources stream dots into a box) |
| chatpair | kick, title, left{msg,read}, right{msg,read}, note (same words, different feel) |
Optional timing params: steps/checklist `times[]`, merge `times[]`+`joinAt`, tokens `flipAt`, attention `rowAt[]`+`drawAt[]` (seconds from scene start) - set them from the spoken word timestamps.
Spec top level: `{"accent":"#E8C48A","scenes":[...]}`. Add a new template = add `T.<name>` in `assets/templates.js` (build into `#stage`, animate on `tl`, respect stage width, keep timings relative to `DUR`).
Ideas still to build when needed: before/after slider, 3D scenes (use style 11 `reel-studio/assets/3d-studio` rendered at 1920x1080), whiteboard handwriting, map, screenshot/news collage (real screenshots from the user), phone mock.

## Pipeline pieces (all in ~/claude-video)
- `./vp preprocess --wide` -> 1920x1080 30fps speaker video.
- Remotion composition `Wide30` (`engines/remotion-app/src/LongForm.tsx`): speaker full-frame <-> pill glide (14 frames), scene fade/scale-in, speaker audio is the soundtrack, scenes muted.
- `./vp longform` stages the files and renders. Long videos: scenes render in parallel; re-render only edited scenes.

## B-roll clips / images (added after the first real intro)
Plan entries (`--scenes plan.json`) can point at the user's own clips or images, not just HyperFrames scenes:
`{"src":"clip.mp4","at":3.0,"dur":1.4,"trim":1.0,"mode":"solo","kick":"..","title":"..","scale":1.24}`
- `mode`: `pill` (default, speaker docks in the pill) or `solo` (clip only, speaker hidden, audio continues) - use solo for fast montage cuts (1.3-2 s each).
- `trim` = start offset inside the clip; `title`/`kick`/`sub` = lower-left caption (English-first); `scale` zooms to hide baked-in letterbox bars (check clips with `ffmpeg cropdetect`; 584/720 content -> scale 1.24).
- Images: 3 s default; `"fit":"card"` shows a rounded card in the stage (e.g. a character reference sheet), default cover.
- Fast intro recipe: face 0-1 s -> hero clip + title -> 3-4 solo clips with 1-2 word captions -> face 1.5 s -> graphic scenes in pill -> montage -> "Let's start" title. SFX via `~/.claude/skills/reel-studio/scripts/mix_sfx.py` (whoosh on big transitions, tick on montage cuts, impact on final title). Example build: `work/make_intro.py`.
- Whisper Hindi misses long stretches: re-transcribe weak ranges with `large-v3-turbo`, `vad_filter=False`, a vocab `initial_prompt`, and in both `hi` and `en` passes.

## Pacing rules for talking-head long videos (user-approved, 2026-10-29)
- First 5-7 s: plain speaker, full frame, NO graphics, no pill.
- Rhythm: speaker full for 10-15 s, then a pill+graphic scene for ~5-12 s, then full again. Never a pill/full flip every 2 s.
- Pill glide must feel smooth (Remotion `TRANSITION` frames, ease in-out). Graphics = English-first, 1 idea each.
- Accent colour: chosen per video (gold `#E8C48A`, ice `#9DB4D6`, sage `#7FB6B0`); templates follow `D.accent` (never hardcode hex inside templates - use `ACC`, `RGBA()`, `ACCD`).

## Key-phrase captions + explainer illustrations (added 2026-10-29)
- Plan JSON may be `{"scenes":[...],"captions":[{"at":0.5,"dur":3,"text":"AI does not think."}]}`. Captions are small lower plates shown ONLY while the speaker is full-frame (hidden during pill/solo); place ~1 per long face stretch, hook captions in the first 8 s (still calm: no pill, no scene change). They sit at bottom 38 px so they don't cover a shirt logo.
- Where the speaker explains an example (blue elephant, word-by-word typing, books -> AI, ok vs ok :)), build an illustrated explainer scene instead of plain text. Chain adjacent pill scenes (start == previous end) so the pill stays docked; whoosh only where the pill enters.
- Re-render of a 5-min video is ~7-8 min: batch all changes before the full render.
