# VidyaGram Skills · Reel Studio

Claude Code skill jo tumhare video ya voiceover ko **pro Reel / Short** me badalti hai: scene plan, 14+ styles, motion graphics, word-synced captions, SFX, QA. Windows aur Mac dono par chalti hai.

## Install: sirf ek prompt (Windows + Mac)

1. **Claude Code kholo** (agar nahi hai: Mac `curl -fsSL https://claude.ai/install.sh | bash`, Windows PowerShell `irm https://claude.ai/install.ps1 | iex`; Claude Code ke liye Pro/Max plan chahiye).
2. Ye prompt copy karke Claude Code me paste karo aur Enter dabao:

```text
Mujhe VidyaGram ki "Reel Studio" skill apne computer par install karni hai.
GitHub repo: https://github.com/YOUR-USERNAME/vidyagram-reel-studio

Is repo ko clone karo (home folder me), phir uske andar INSTALL-FOR-CLAUDE.md padho aur uske saare steps khud follow karo. Mera computer Windows ho ya Mac, jo steps mere OS ke liye likhe hain wahi lo. Jo kuch install karna ho (Node, ffmpeg, Python, Whisper, etc.) sab tum khud karo. Sirf jahan mujhe kuch karna ho (password, "Yes" popup) wahan mujhe simple Hinglish me batao. Kaam ke baad health check chalao aur batao ki reel banane ke liye ab kya karna hai.
```

3. Claude jo permission maange uspe **Yes** dabao. Windows par "Do you want to allow..." popup aaye to **Yes**. Baaki sab Claude khud karega (Node, ffmpeg, Python, Whisper, Remotion, HyperFrames, skills).
4. Aakhir me Claude batayega: Claude Code `claude-video` folder me kholo aur `/reel-studio` type karo.

Pehli baar 10-30 minute lagte hain (downloads). 8 GB free disk chahiye.

## Manual install (agar Claude ke bina karna ho)
- **Windows:** repo download karo, folder me `install.bat` double-click.
- **Mac:** Terminal me `cd <folder>` phir `bash install.sh`.

## Update
Prompt dobara paste karo, Claude `git pull` karke update kar dega.

## Kya hai is repo me
| Folder / file | Matlab |
|---|---|
| `INSTALL-FOR-CLAUDE.md` | Claude ke liye step-by-step install instructions |
| `install.sh`, `install.ps1`, `install.bat` | Tested installers (Mac / Windows) |
| `skills/` | reel-studio, video-edit, longform-explainer + CC0 SFX kit |
| `workspace/` | Video pipeline (`./vp`), Remotion / HyperFrames / Revideo |

## License aur credits
- Code aur skills: VidyaGram students ke personal use ke liye. Redistribution ke liye VidyaGram se permission lo.
- HyperFrames agent skills (`workspace/.agents`): HeyGen, Apache-2.0. SFX kit: CC0. Details: `THIRD-PARTY-NOTICES.md`.

**VidyaGram App:** AI, Video Editing aur Graphic Design seekho, sirf mobile se.
