---
name: video-edit
description: Edit the user's own talking-head / reel video into a finished 9:16 explainer using their local pipeline in ~/claude-video (auto-cut dead air, word-synced captions, kinetic typography, graphics, diagrams, animations; HyperFrames + Remotion + Revideo). Use whenever the user attaches or names a video and asks to edit it, add graphics, captions, animation, typography, explanation visuals, B-roll or "make it look professional" — in English, Hindi or Hinglish (e.g. "isko edit karo", "graphics aur animation laga do", "इसको एडिट करो"). Also invocable as /video-edit.
---

# Video edit — the user's 9:16 explainer pipeline

> **For full edits of a Short/Reel, use the `reel-studio` skill first** (transcribe -> scene plan -> style boards -> build, with approval gates). This skill is the quick/direct path and the command reference.

The user has a ready-made editing workspace at **`~/claude-video`** (`~/claude-video`). Use it for every edit. Don't rebuild tooling in a scratch folder.

The user often writes in Hindi/Hinglish. Reply in the language they use, keep it simple, and don't ask them to run commands. You run everything.

## 0. Get into the workspace (every new chat)

1. If the session's working directory is not `~/claude-video`, move there first: load `change_directory` (ToolSearch `select:mcp__ccd_directory__change_directory`) and call it with `~/claude-video`. It takes effect after the turn, so **use absolute paths under `~/claude-video` for the rest of this turn**. If that tool isn't available, just use absolute paths.
2. Read `~/claude-video/CLAUDE.md`. It is the command reference and holds the engine routing rules. Follow it.
3. Run `~/claude-video/vp verify`. If anything fails, run `vp setup`, then verify again. Only report a problem if it still fails.

## 1. Get the video in

- Copy the user's file into `~/claude-video/input_raw/` (never edit or delete their original). If they attached it in chat, find its path from the message. If you can't find it, ask them to drag it into `~/claude-video/input_raw/`.
- Probe it with `ffprobe`: length, orientation and fps. Landscape footage gets center-cropped to 1080x1920 automatically. Tell the user if the subject may be off-center.

## 2. Understand the brief

From the user's words, settle these. Ask **at most one** short question, and only if it changes the result. Otherwise pick sensible defaults and say what you chose:
- **Style/energy**: clean & minimal (default), bold/high-energy, or premium/cinematic.
- **What gets visuals**: by default, every key claim, number, list or process in the transcript gets one insert, about every 4–8 seconds. Never bury the speaker for long.
- **Captions**: on by default (word-by-word highlight). **Fps**: 30 unless they ask for 60.
- **Language** of speech, for `--language` (`hi` for Hindi, `en` for English; omit for auto). Pass names, brands and jargon via `--vocab`.
- **Hindi / Hinglish speech → always add `--model large-v3-turbo`**. The default `small` model misspells Hindi badly. It's already downloaded, and is slower but far more accurate. For Hinglish, decide with the user whether captions should be in Devanagari (`--language hi`) or Roman script (`--language en` usually gives Roman Hinglish).

## 3. Pipeline

```bash
cd ~/claude-video
./vp preprocess "<file>" --vocab "..." [--language hi|en] [--fps 60]
```
- Read `processed_audio/<stem>/transcript.txt`. Fix misheard words via `processed_audio/<stem>/corrections.json` (`{"wrong": "right"}`), then run `./vp captions <stem>`.
- **Plan the beats**: list each insert as phrase → visual → engine → layout (`full`/`top`/`pip`). Show this plan to the user briefly as a table, then build it. Don't wait for approval unless they asked to review first.

Engine routing (details in CLAUDE.md):
| Visual | Engine | How |
|---|---|---|
| Kinetic typography, title/stat cards, lower thirds, UI mockups, Lottie, 3D | HyperFrames | one HTML file per card in `engines/hyperframes-app/compositions/<name>.html` (1080x1920, paused GSAP timeline). Follow the `hyperframes*` skills in `~/claude-video/.claude/skills/`. Render: `./vp hyperframes <name> --composition compositions/<name>.html` |
| Flowcharts, processes, arrows, diagrams, shape morphs | Revideo | vars-driven `src/scenes/explainer.tsx` (`./vp revideo <name> --vars vars.json` with `{"title","steps"}`), or a new scene in `src/scenes/` registered in `src/project.ts` |
| Captions + final assembly | Remotion | `./vp assemble <stem> --insert output_renders/<clip>.mp4@"<phrase>":top ...` |

Each insert's length should match how long the idea is spoken, usually 2–5s; trim with `+seconds`. Keep text inside the safe zone: top 120px to about 1250px. The bottom third belongs to captions.

## 4. Quality check before delivering (mandatory)

- Extract a frame at the middle of every insert, plus 2–3 caption-only moments (`ffmpeg -ss T -i final.mp4 -frames:v 1 -vf scale=360:-1 f.png`). Hstack them and **look at them**. Check for text overflowing the frame, cropped graphics, captions colliding with cards, unreadable contrast, or an insert landing on the wrong words.
- Confirm the audio exists and stays in sync, and that the duration matches the cut video.
- Fix what you find and re-render. Two rounds are normal.
- Optional: offer a sound-effects pass with the `sound-effects` skill.

## 5. Deliver

- Final file: `~/claude-video/output_renders/<stem>-final.mp4`. Send it with SendUserFile, plus the preview strip image.
- Summarise in the user's language: what was cut (raw → final length), which graphics were added at which moments, and anything you couldn't do. Offer one specific next tweak.

## Rules

- Never modify or delete files in `input_raw/` that the user supplied, or anything outside `~/claude-video` without asking.
- Don't undo the "known quirks" listed in CLAUDE.md. Each one is a fix for a real failure.
- If a tool or engine errors, read the error, fix it, and retry before reporting. Report failures honestly.


## Windows
On Windows run the same commands in Git Bash (`./vp ...`) or PowerShell (`vp.cmd ...`). Use `./vp py script.py` instead of `python3`, and `./vp chrome` for the headless Chrome path.
