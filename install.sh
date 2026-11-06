#!/usr/bin/env bash
# VidyaGram Skills - Reel Studio : one-command installer (macOS)
# Usage:  bash install.sh
# Safe to re-run any time (it only fills in what is missing / updates the skill files).
# Test overrides: VG_WORKSPACE, VG_SKILLS_DIR, VG_SKIP_BREW=1, VG_SKIP_CLAUDE=1, VG_SKIP_SETUP=1
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
WORKSPACE="${VG_WORKSPACE:-$HOME/claude-video}"
SKILLS_DIR="${VG_SKILLS_DIR:-$HOME/.claude/skills}"
LOG="$HOME/vidyagram-install.log"
: > "$LOG"

B=$'\033[1m'; G=$'\033[32m'; Y=$'\033[33m'; R=$'\033[31m'; C=$'\033[36m'; N=$'\033[0m'
step() { echo; echo "${B}${C}[$1/$TOTAL]${N} ${B}$2${N}"; }
ok()   { echo "  ${G}✔${N} $1"; }
warn() { echo "  ${Y}!${N} $1"; }
die()  { echo; echo "${R}✘ $1${N}"; echo "  Log: $LOG"; echo "  Ye error screenshot ke saath VidyaGram group me bhejo, hum help karenge."; exit 1; }
run()  { echo "\$ $*" >> "$LOG"; "$@" >> "$LOG" 2>&1; }
TOTAL=7

echo
echo "${B}${Y}  VidyaGram Skills  ·  Reel Studio installer${N}"
echo "  Pehli baar me 10-25 minute lagte hain (downloads). Terminal band mat karna."

# ---------------------------------------------------------------- 1 checks
step 1 "System check"
[ "$(uname -s)" = "Darwin" ] || die "Ye installer abhi sirf Mac ke liye hai (macOS)."
ARCH="$(uname -m)"; ok "macOS ($ARCH)"
FREE_GB=$(df -g "$HOME" | awk 'NR==2{print $4}')
[ "${FREE_GB:-0}" -ge 8 ] || die "Kam se kam 8 GB free space chahiye (abhi ${FREE_GB} GB hai)."
ok "${FREE_GB} GB free disk"
if ! xcode-select -p >/dev/null 2>&1; then
  warn "Apple Command Line Tools nahi mile. Popup aayega: 'Install' dabao, khatam hone ke baad ye script dobara chalao."
  xcode-select --install 2>/dev/null
  exit 0
fi
ok "Command Line Tools"

# ---------------------------------------------------------------- 2 homebrew + tools
step 2 "Tools install (Homebrew, Node, ffmpeg, uv)"
if [ "${VG_SKIP_BREW:-0}" != "1" ]; then
  if ! command -v brew >/dev/null 2>&1; then
    for p in /opt/homebrew/bin/brew /usr/local/bin/brew; do [ -x "$p" ] && eval "$("$p" shellenv)"; done
  fi
  if ! command -v brew >/dev/null 2>&1; then
    warn "Homebrew install ho raha hai (Mac password maangega, type karo aur Enter dabao)"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" || die "Homebrew install fail hua."
    for p in /opt/homebrew/bin/brew /usr/local/bin/brew; do [ -x "$p" ] && eval "$("$p" shellenv)"; done
    # make brew available in future terminals
    BREW_LINE="eval \"\$($(command -v brew) shellenv)\""
    grep -qsF "$BREW_LINE" "$HOME/.zprofile" || echo "$BREW_LINE" >> "$HOME/.zprofile"
  fi
  command -v brew >/dev/null 2>&1 || die "Homebrew mila nahi."
  ok "Homebrew"
  NODE_MAJOR=0; command -v node >/dev/null 2>&1 && NODE_MAJOR=$(node -v | sed 's/v\([0-9]*\).*/\1/')
  if [ "$NODE_MAJOR" -lt 22 ]; then
    echo "  Node 22+ install ho raha hai..."; run brew install node || die "Node install fail."
  fi
  for t in uv ffmpeg git; do
    command -v "$t" >/dev/null 2>&1 || { echo "  $t install ho raha hai..."; run brew install "$t" || die "$t install fail."; }
  done
fi
for t in node npm git ffmpeg uv; do command -v "$t" >/dev/null 2>&1 || die "$t nahi mila (PATH me nahi hai)."; done
NODE_MAJOR=$(node -v | sed 's/v\([0-9]*\).*/\1/'); [ "$NODE_MAJOR" -ge 22 ] || die "Node 22 ya usse naya chahiye (abhi $(node -v))."
ok "node $(node -v), ffmpeg, uv, git"

# ---------------------------------------------------------------- 3 claude code
step 3 "Claude Code"
if command -v claude >/dev/null 2>&1; then
  ok "Claude Code pehle se installed ($(claude --version 2>/dev/null | head -n1))"
elif [ "${VG_SKIP_CLAUDE:-0}" = "1" ]; then
  warn "skip (test mode)"
else
  echo "  Claude Code install ho raha hai..."
  if curl -fsSL https://claude.ai/install.sh | bash >> "$LOG" 2>&1; then
    export PATH="$HOME/.local/bin:$PATH"
    ok "Claude Code installed"
  else
    warn "Auto-install fail hua. Baad me manually: https://claude.ai/code se install karo. (Baaki setup chalta rahega)"
  fi
fi

# ---------------------------------------------------------------- 4 skills
step 4 "Skills install (~/.claude/skills)"
mkdir -p "$SKILLS_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
for s in "$HERE"/skills/*/; do
  name="$(basename "$s")"
  if [ -d "$SKILLS_DIR/$name" ]; then
    mv "$SKILLS_DIR/$name" "$SKILLS_DIR/.$name.backup-$STAMP"; warn "purana $name backup ho gaya"
  fi
  cp -R "$s" "$SKILLS_DIR/$name"
  ok "skill: $name"
done

# ---------------------------------------------------------------- 5 workspace
step 5 "Workspace copy ($WORKSPACE)"
mkdir -p "$WORKSPACE"
if command -v rsync >/dev/null 2>&1; then
  rsync -a --exclude input_raw --exclude processed_audio --exclude output_renders --exclude style_log.md \
        "$HERE/workspace/" "$WORKSPACE/"
  # first install only: bring the empty folders / starter files
  [ -f "$WORKSPACE/style_log.md" ] || cp "$HERE/workspace/style_log.md" "$WORKSPACE/style_log.md"
  mkdir -p "$WORKSPACE/input_raw" "$WORKSPACE/processed_audio" "$WORKSPACE/output_renders"
else
  cp -R "$HERE/workspace/." "$WORKSPACE/"
fi
chmod +x "$WORKSPACE/vp" "$WORKSPACE"/scripts/*.sh "$WORKSPACE"/scripts/*.py 2>/dev/null
ok "workspace ready"

# ---------------------------------------------------------------- 6 dependencies
step 6 "Dependencies install (Python, Whisper, Remotion, HyperFrames, Revideo) - sabse lamba step"
if [ "${VG_SKIP_SETUP:-0}" = "1" ]; then
  warn "skip (test mode)"
else
  cd "$WORKSPACE" || die "workspace nahi mila."
  echo "  Yahan 10-20 min lag sakte hain. Live log: tail -f $LOG"
  if ! ./vp setup >> "$LOG" 2>&1; then
    warn "Pehli try fail hui (network?). Ek baar aur try kar raha hoon..."
    ./vp setup >> "$LOG" 2>&1 || die "Dependencies install nahi ho payi."
  fi
  ok "dependencies installed"
fi

# ---------------------------------------------------------------- 7 verify
step 7 "Health check"
if [ "${VG_SKIP_SETUP:-0}" = "1" ]; then
  warn "skip (test mode)"
else
  cd "$WORKSPACE" || die "workspace nahi mila."
  ./vp verify 2>&1 | tee -a "$LOG" | sed 's/^/  /'
  if [ "${PIPESTATUS[0]}" -ne 0 ]; then
    VERIFY_FAILED=1; warn "Kuch check fail dikha. './vp setup' dobara chalao; phir bhi fail ho toh log bhejo: $LOG"
  else
    ok "sab kuch OK"
  fi
fi

echo
if [ "${VERIFY_FAILED:-0}" = "1" ]; then echo "${B}${Y}! Install complete, par health check me warning hai (upar dekho)${N}"; else echo "${B}${G}✔ Install complete!${N}"; fi
echo
echo "Ab reel banane ke liye:"
echo "  ${B}1.${N} Terminal me:   ${C}cd ~/claude-video && claude${N}"
echo "  ${B}2.${N} Claude me type karo:   ${C}/reel-studio${N}   aur apna video (ya voiceover) drag-drop karo"
echo
echo "Pura guide: VidyaGram-Reel-Studio-Guide.pdf   |   Log: $LOG"
