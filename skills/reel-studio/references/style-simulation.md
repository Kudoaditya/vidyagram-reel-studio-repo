# Style 13 - "Simulation" (सिमुलेशन)

A concept the user speaks about becomes a **real, detailed isometric machine** that runs a true model of the idea, rendered to MP4 and dropped into any video (Short, Reel or long-form) as an insert. Engine: the `anatomy` skill (`~/.claude/skills/anatomy`, kit + SKILL.md; read its craft rules before building a new machine). Reference machine: `assets/simulation/token-bucket/` (build.mjs, page, events.json); sample `assets/simulation/sample-token-bucket.mp4` + `sample.png` (show at Gate 2).

## What makes it a simulation (not an animation)
- **Truth first**: the machine runs a small model (counts, rates, thresholds). Every motion and every number comes from it. Never fake a result; the events script drives the *inputs* (requests, clicks, rate changes), the machine decides the outcome.
- **The object is the explanation**: pick a real mechanism whose working *is* the concept (token bucket = coin tube + gate + pusher; cache = pin-tumbler lock; queue = ball tube; load balancer = switch rails; DNS = sorting desk). One sentence: what moves, what it means.
- **Dense and detailed**: 80+ parts, screws, ticks, knurls, plates; 4 tones, one lit part. Follow anatomy's craft rules (solids not wireframes, lines end on something, painter's order).

## Workflow (inside reel-studio Step 3, per concept scene)
1. Scene plan (Gate 1) marks which spoken ideas get a Simulation insert (usually 1 per idea, 6-20 s, matched to the words). Say what the machine is and what the viewer sees happen.
2. Copy `assets/simulation/token-bucket/build.mjs` to `~/claude-video/sims/<name>/build.mjs`, change the model + parts (keep: `window.__SIM` guard, `data-readout`, one `[tabindex=0]` stage that takes keydown events, all state advanced from rAF `dt`). `node build.mjs` (dark) and `--light`.
3. Events file `[{"t":0.5,"key":" "},...]`: the scripted inputs timed to the voice (t = seconds in the insert). Keys map to what the page's stage handles (Space = request, arrows = knob).
4. Render: `node ~/.claude/skills/reel-studio/scripts/render_sim.mjs sims/<name>/<name>.html events.json output_renders/sim-<name>.mp4 --dur <s> [--w 1080 --h 1000 --fps 30 --zoom 1.25 --bg "#111111"]`
   Virtual clock = frame-exact, ~2 s of wall time per second of video. Output is H.264 yuv420p, opaque background (use `-light.html` + a light `--bg` for light videos).
5. **Check frames before showing** (contact sheet of 4-8 frames, read it): parts visible, nothing clipped at `--zoom`, coins/parts in correct depth order, the outcome (allowed/rejected, full/empty) really happened. Zoom 4x on a junction if something looks off.
6. Assemble: Shorts `./vp assemble <stem> --insert output_renders/sim-<name>.mp4@"<phrase>":split` (graphic on top half, speaker bottom); long 16:9 videos place it as an overlay/PiP or full cutaway in the edit (render with `--w 1920 --h 1080 --zoom 1.1`). Captions stay on top.

## Safe rules
- Card canvas for `split` is 1080x1000: render `--h 1000`. For `full` Shorts use `--h 1920 --zoom 1.6`.
- No on-screen words except one engraved label and the readout; the voice carries the explanation.
- Keep 1 insert = 1 mechanism = 1 idea. Loop-free: the events script ends in a clear state (e.g. bucket empty and rejecting).
- Install check: anatomy skill present at `~/.claude/skills/anatomy`; Chrome via `CHROME_PATH` if not auto-found; ffmpeg on PATH.
