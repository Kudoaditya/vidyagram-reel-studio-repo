# Style catalogue (pick 4-5 per video, never the same as the last 2 videos)

Each style = palette + type + motion language + how it explains. Mix freely, but give every video one clear identity.

| # | Style | Looks like | Palette | Type | Motion language | Best for | Build with |
|---|-------|-----------|---------|------|-----------------|----------|-----------|
| 1 | **Editorial paper (Vox)** | cream paper, dot texture, red marker underline, stickers, hand arrows, boxed labels with hard offset shadow | `#F4EFE3` `#111` `#FF4D3D` `#FFC94D` `#6366F1` | Georgia/serif headlines + Menlo labels | draw-on arrows, cards slide up, stickers pop with rotation, marker sweeps under key word | concepts, comparisons, "what is X" | HyperFrames |
| 2 | **Kinetic impact** | giant stacked Impact words, diagonal speaker cut, tape labels | `#FFE14D` `#0A0A0A` `#EF4444` `#fff` | Impact / Arial Black, uppercase | words slam in with overshoot, shake on emphasis, colour flash on the key beat | hooks, opinions, motivational, fast pacing | HyperFrames (+ `:split`) |
| 3 | **Glass neon tech (Linear/Stripe)** | blurred speaker background, glass cards, crisp nodes, gradient text (keep any glow very subtle or off) | `#0B0D14` `#6366F1` `#22D3EE` `#EF4444` | Inter/Helvetica + Menlo | cards float in with blur-to-sharp, graph lines draw, pulses travel along links | AI, software, startups, how-it-works | HyperFrames |
| 4 | **Blueprint HUD** | tracking brackets on the speaker, grid, callout lines, % meters | `#000` `#22D3EE` `#E0F7FF` `#EF4444` | Menlo + bold grotesk | scanning lines, counters tick up, labels snap to anchors | data, security, science, "analysis" | HyperFrames |
| 5 | **Flat vector character (Kurzgesagt / Ali Abdaal)** | simple round characters, props, flat shapes, no outlines | bright 4-5 colour set + 1 dark | rounded sans (Poppins-like) | squash and stretch, characters act out the idea (walks, points, reacts), props slide in | stories, habits, psychology, "imagine you..." | HyperFrames SVG rigs, or `animate` skill |
| 6 | **Cut-paper collage (Johnny Harris)** | torn paper, newspaper clippings, maps, push-pins, red string, Polaroids | kraft `#C9A66B`, paper white, ink black, red `#D1342B` | typewriter + condensed serif | slow Ken-Burns push-ins, map zooms, clippings drop and wiggle, string draws between pins | history, geopolitics, money, "how did this happen" | HyperFrames / `animate` (cut paper style) |
| 7 | **Whiteboard / chalk sketch** | hand-drawn strokes revealing on board | board `#1B2A26` chalk `#fff` + 2 chalk colours | handwritten font | stroke-draw reveals, erase-and-redraw, underline scribbles | step-by-step teaching, maths, processes | HyperFrames SVG stroke-dashoffset |
| 8 | **Retro pop / comic** | halftone dots, speech bubbles, starbursts | `#FFF3D6` `#FF3B6B` `#2D5BFF` `#111` | bold comic display | panels pop in, bubbles bounce, POW bursts | humour, myths vs facts, storytelling | HyperFrames |
| 9 | **Dark cinematic docu** | film grain, slow dolly, serif titles, lower thirds | near-black, warm amber `#F59E0B`, off-white | serif display + small caps | slow push-ins, light leaks, text fades with tracking change | premium, serious topics, brand stories | HyperFrames / Remotion |
| 10 | **Faux-3D low-poly** | low-poly characters in a night world | blue/purple + amber | - | cinematic camera cuts | dialogue/story reels | `faux-3d` skill |
| 11 | **3D Studio reel (real Three.js)** | warm cream stage, white lanes, tangerine/teal/violet 3D objects, orbiting + flying camera, flat graph cards, one bold title at a time, small captions | cream `#FFF6E8`, tangerine `#FF6A1F`, teal `#0FA3A3`, violet `#7A5CFA`, sun `#FFC233`, ink `#1F2033` | Helvetica Neue 900 | camera orbits/flies between stations, objects pop with squash, graph curves draw in sync, mask-slide titles | voiceover-only explainers of motion/steps/comparisons/tools | HyperFrames + Three.js, see `style-3d-studio.md` |
| 12 | **Stickman (code-built, no API)** | jointed SVG stickman with tangerine beanie on warm cream stage, ink lines, props, confetti, mask-slide titles, small captions | cream `#FFF6E8`, ink `#1F2033`, tangerine `#FF6A1F`, teal `#0FA3A3`, violet `#7A5CFA`, sun `#FFC233` | Helvetica Neue 900 | walk cycle, wave/think/point/cheer poses, prop pops, pans | storytelling, tips, workplace/habit explainers, long videos with a recurring character | HyperFrames SVG + GSAP, see `style-stickman.md` |
| 14 | **Vox documentary (paper collage)** | cream paper + grid, 2 torn newspaper patches, yellow marker swash titles, halftone yellow-outline photos, engravings, red circles, dashed orange arrows, Hinglish tape captions, CSS-3D camera | cream `#EFE9D8`, ink `#15130F`, yellow `#FFD93B`, red `#E0302A`, orange `#F26A1B` | Didot/Georgia serif titles + Helvetica Neue captions | pop-in collage layers, arrows draw on, count-ups, slow 3D camera per scene | history, origin stories, how-it-happened, news explainers with real photos/data | HyperFrames, see `style-vox-docu.md` |

## Making an idea easy to understand (explainer techniques)
Pick the technique per scene, then style it:
1. **Metaphor swap** - show the familiar thing (book, key, road) while the speaker says the abstract thing.
2. **Build-up** - add one element at a time, each on its spoken word; keep earlier elements visible.
3. **Before / after** (or wrong / right) - two cards, one dims when the other lights up.
4. **Process flow / loop** - boxes + arrows drawing on; a loop arrow closes the cycle.
5. **Zoom into the detail** - punch into the exact part being discussed, label <= 4 words.
6. **Character acts it out** - a simple character reacts (confused, lightbulb, panicking) so the viewer feels the point.
7. **Number theatre** - a count-up, bar or meter for any statistic; end on the number, big.
8. **Map / timeline** - for where/when claims; highlight the one place/date.
9. **Contrast gag** - the visual deliberately says the opposite for one beat, then corrects (good for hooks).

Rules: one idea per scene; label <= 4 words; the element lands on the word it illustrates (cue to the transcript timestamps); never leave a static frame > 1.2 s; use colour semantically (red = wrong/danger, green = right, amber = caution).

## Choosing styles for a video
- Stories / habits / workplace / long videos with a recurring character -> **12 (Stickman)**; show `assets/stickman/sample-sheet.png` at Gate 2. Mix with 11 for concept scenes.
- Voiceover-only concept explainers (animation, speed, process, tools) -> **11 (3D Studio)**; always show its sample (`assets/3d-studio/sample-sheet.png`) at Gate 2.
- Match topic: tech/AI -> 3, 4; money/history -> 6, 9; habits/psychology/story -> 5, 8, 1; teaching -> 7, 1; hype/opinion -> 2.
- Show variety across the 4-5 options (don't offer five dark styles). At least one "safe", one "bold".
- Never repeat the last two styles in `~/claude-video/style_log.md`.
- A video may mix: one **base style** + a second style used only for 1-2 explainer scenes (the Gemini reel used 2 for hooks and 1 for diagrams).
