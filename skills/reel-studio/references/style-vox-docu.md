# Style 14 - "Vox documentary" (history / origin-story / explainer collage)

Built and approved on the Instagram origin reel (2026-11-03). Cream-paper collage with real photos and real source crops, animated with a CSS-3D camera. Best for: company/app origin stories, history, "how X happened", news explainers. Voiceover-only (no talking head), all scenes `GRAPHICS`.

Files (in `assets/vox-docu/`):
- `sample-insta-origin.mp4` (540 px preview), `insta-storyboard-v5-1.png` / `-2.png` (storyboard sheets to show at Gate 1/2)
- `storyboard_frames.py` - all helpers + 8 example frames (swash, badge, circle, arrow, clip, engravings, patches). Renders PNG storyboard frames with headless Chrome.
- `build_animated.py` - turns the same scene bodies into one HyperFrames composition (generic element animator + 3D camera + karaoke captions). Copy both next to each other, edit the scene bodies/timings, run.
- `sample_captions.json`, `sample_sfx_cues.json` - formats for captions and `scripts/mix_sfx.py` cues.

## Look
- Background `#EFE9D8` cream + 44 px blue-grey grid (10%), paper grain + crease overlays, **newspaper only as 2 small torn patches per frame** (never full-bleed; user rejected full-bleed). Patch positions vary per frame.
- Palette: ink `#15130F`, yellow `#FFD93B` (marker swash, badges, highlights), red `#E0302A`/`#C8281D` (circles, dots, stamps), orange `#F26A1B` (dashed arrows).
- Type: **title = English serif (Didot/Georgia 800, 92 px)** with a yellow marker swash; **caption = Hinglish Helvetica Neue 800 on a torn black tape strip** with the active word on a yellow chip. Title and caption must never repeat the same words (user flagged it). Labels: Helvetica caps on black tags; handwriting: Marker Felt.
- Elements: torn-edge paper (`TORN` clip-path), masking tape, ink stamp (rough filter), engraving line-art icons (camera, glass, phone, coins, building, calendar), red scribble circles that point at a real thing, dashed orange arrows with hand-drawn heads, red dots in corners, perspective-tilted map/chart cards.
- Photos: grayscale + yellow multiply + halftone dots + torn edge + yellow outline (not a true cutout; for true cutouts remove backgrounds locally, ask before downloading a model).

## Real data rule
Use real sources: Wikipedia text crops with the key phrase highlighted yellow (build.md: puppeteer-core + range surroundContents, crop on the `<mark>` rect, zoom the crop so it is readable), Wikimedia Commons portraits via the API `iiurlwidth` thumb URL (set a User-Agent; direct thumb.wikimedia.org links may return HTML), logos from Wikipedia file pages. **Always read licence + author from `extmetadata` and put the credit on screen (tiny, y~1338) and in the description.** Public-figure photos only from Commons.

## Layout (safe zones from layouts.md)
Title y 262; content y 330-1300; credit line y 1338; caption strip y 1385; nothing else below. Margins equal 120 px. Fix list learned the hard way: circles/arrows must point at a real element, no badge over a label, stamps not under labels, text crops readable, no two items overlapping.

## Motion
- Every scene sits in `.scene > .cam`; camera = GSAP on `.cam`: scale 1.0 -> 1.075, rotationY +-3.2 deg (alternate direction per scene), rotationX 2.2 -> -1.4, small x/y drift, `perspective:1900px` on `.scene`. Background patches live inside the camera so they parallax with it.
- Generic animator: swash scaleX from left; title rises 44 px; arrows/circles reveal with `clip-path: inset(0 100% 0 0) -> 0`; everything else pop-in (`back.out(1.6)`, y 40, scale .9). Stagger so all elements are in by ~55% of the scene; override delays per child index to land on spoken words.
- Scene crossfade 0.55 s. Count-up numbers sync to the word ("million" -> count 0 to 1,000,000 over ~1.9 s).

## Script rules (voiceover reel, ~45 s)
Hook line = surprising reversal ("X was never meant to be X"); one fact per line; verified facts only (browser: Wikipedia/official source), say "lagbhag" for approximations; end with a transferable lesson + a comment question.

## Build recipe
1. Voice (ElevenLabs voice of your choice, or the user's file) -> `faster-whisper` words (re-transcribe weak spans in chunks) -> merge -> `align_captions.py` with Devanagari script, then swap in Roman Hinglish tokens (equal token counts per line).
2. Gather real assets into `assets/<stem>/` with credits.
3. Storyboard PNGs (storyboard_frames.py) -> user approval (Gate 1/2).
4. `build_animated.py` -> `engines/hyperframes-app/compositions/<stem>.html`; draft render `-q draft`, QA grid with guide lines (x 120/960, y 262, y 1330); fix; delivery render; `mix_sfx.py` (whoosh at scene starts, impact on big numbers, tick during count-ups).
5. Log in `style_log.md`.
