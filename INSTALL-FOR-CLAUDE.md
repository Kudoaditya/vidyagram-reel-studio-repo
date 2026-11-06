# INSTALL-FOR-CLAUDE.md : VidyaGram Reel Studio (agent instructions)

You are Claude Code. A student pasted a prompt asking you to install this repo. Do the whole setup yourself, on **Windows or macOS**, following the steps below in order.

## How to talk to the student
- Reply in **simple Hinglish (Latin script)**, very short. One line per step: what you are doing now.
- The student is not technical. Never ask them to run commands, **except** the three things only a human can do: type a password, click "Yes" on a Windows/Mac popup, and (macOS) install Homebrew / Command Line Tools. When you need that, say exactly what to click or type.
- Do not delete, move or edit any of the student's own files. Only create the folders named below.
- Do not send any data anywhere. Everything installs locally.

## 0. Detect the system
- macOS or Linux shell: `uname -s` prints `Darwin`. Windows (Git Bash): `uname -s` prints `MINGW...`/`MSYS...`. PowerShell: `$env:OS` is `Windows_NT`.
- Linux is not supported: tell the student "Abhi sirf Windows aur Mac supported hain" and stop.
- Remember `REPO_DIR` = `~/vidyagram-reel-studio` (Windows: `%USERPROFILE%\vidyagram-reel-studio`).

## 1. Get the files
The repo URL is in the student's prompt. Clone it into `REPO_DIR`; if the folder already exists, update it instead.
```
git clone --depth 1 <REPO_URL> "$HOME/vidyagram-reel-studio"        # first time
git -C "$HOME/vidyagram-reel-studio" pull --ff-only                  # if it already exists
```
If `git` is missing: macOS -> run `xcode-select --install` and ask the student to click Install; Windows -> `winget install -e --id Git.Git --silent --accept-package-agreements --accept-source-agreements`, then open a new shell / use the full path `C:\Program Files\Git\cmd\git.exe`.

## 2. Run the installer for this OS
The installers are tested scripts that install **every dependency** (Node 22+, ffmpeg, uv/Python 3.12, Whisper, Remotion, HyperFrames, Revideo, Chrome), copy the skills to `~/.claude/skills`, copy the workspace to `~/claude-video`, and run a health check. They take **10-30 minutes**, so run them **in the background** and check the log every 60-90 seconds. Tell the student a short progress line each time ("Abhi Whisper download ho raha hai...").

### macOS
1. Check Homebrew: `command -v brew || ls /opt/homebrew/bin/brew /usr/local/bin/brew`.
   If it is missing, you cannot type the sudo password for the student. Tell them to open the **Terminal app** (Cmd + Space, type Terminal, Enter), paste this exact line, press Enter and type their Mac password when asked (nothing shows while typing, that is normal):
   `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
   Wait until it finishes, then continue.
2. Run in the background: `bash "$HOME/vidyagram-reel-studio/install.sh"`
3. If the log says the Apple "Command Line Tools" popup appeared, ask the student to click Install, wait for it to finish, then run `install.sh` again.
4. Log file: `~/vidyagram-install.log`. Final success line: `Install complete`.

### Windows
1. Run in the background (works from Git Bash or PowerShell):
   `powershell -NoProfile -ExecutionPolicy Bypass -File "$HOME/vidyagram-reel-studio/install.ps1"`
   (PowerShell tool: `powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\vidyagram-reel-studio\install.ps1"`)
2. Windows will show **"Do you want to allow this app to make changes"** popups while winget installs Git/Node/ffmpeg/uv. Tell the student to click **Yes** each time.
3. Log file: `%USERPROFILE%\vidyagram-install.log`. Final success line: `Install complete`.
4. If the installer says a tool "abhi PATH me nahi dikha" or stops asking for a new window, simply run the same command once more (it is safe to re-run; it skips what is done).

## 3. Verify
- When the installer ends, read the **last 40 lines** of the log.
- Run the health check from the workspace: macOS/Git Bash `cd ~/claude-video && ./vp verify`; PowerShell `cd $env:USERPROFILE\claude-video; .\vp.cmd verify`.
- Expected: `All checks passed.` One known harmless case: if only `HyperFrames` shows FAIL on a fresh install, run `./vp setup` once more and verify again.
- If anything fails, use the troubleshooting table, fix it, and re-run. Only report a problem to the student if it still fails after two attempts, and then give them the log path and ask them to send the log + a screenshot to VidyaGram support.

## 4. Finish (tell the student, in Hinglish)
Say, in 5 lines max:
1. "Install ho gaya."
2. "Claude Code band karke dobara kholo, is baar `claude-video` folder me: Mac -> Terminal me `cd ~/claude-video` phir `claude`. Windows -> Desktop par **Reel Studio.bat** double-click."
3. "Phir `/reel-studio` type karo aur apna video ya voiceover drag-drop karo."
4. "Pehli baar Claude login maange to browser me apne Claude account se login karo."
5. Optional later: ElevenLabs connector (AI voiceover), Canva connector (real designs).
The new skills are picked up when Claude Code starts a new session.

## Troubleshooting (apply the fix, then re-run the installer)
| Symptom | Fix |
|---|---|
| `winget` not found (Windows) | Ask the student to update "App Installer" from the Microsoft Store, then re-run. |
| `node` / `uv` / `ffmpeg` not found right after install | Open a new shell, or on Windows run `$env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")`, then re-run. |
| `npm install` fails or times out | Check internet, then run `./vp setup` again (it resumes). |
| Whisper model download fails | Re-run `./vp setup` (it re-downloads). Check free disk (needs 8 GB+). |
| "path too long" on Windows | Make sure the workspace is `C:\Users\<name>\claude-video`; run `git config --global core.longpaths true`. |
| SmartScreen / antivirus blocks the script | Ask the student to allow it (More info -> Run anyway) and re-run. |
| `claude: command not found` | Open a new terminal; on macOS add `~/.local/bin` to PATH. |
| macOS Intel vs Apple Silicon | Both are supported; the installer picks the right ffprobe automatically. |

## Updating later
`git -C ~/vidyagram-reel-studio pull --ff-only`, then run the same installer again. Old skill versions are backed up automatically as `.reel-studio.backup-<date>`.

## What gets installed where
- Skills: `~/.claude/skills/{reel-studio,video-edit,longform-explainer,sound-effects}`
- Workspace: `~/claude-video` (videos go in `input_raw/`, finished reels appear in `output_renders/`)
- Log: `~/vidyagram-install.log`
