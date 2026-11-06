# VidyaGram Skills - Reel Studio : one-command installer for WINDOWS 10/11
# Double-click install.bat  (or:  powershell -ExecutionPolicy Bypass -File install.ps1)
# Safe to re-run any time. ASCII only on purpose (Windows PowerShell 5.1 reads files with the legacy code page).
# Test switches: -SkipWinget -SkipClaude -SkipSetup -Workspace <dir> -SkillsDir <dir>
param(
  [switch]$SkipWinget,
  [switch]$SkipClaude,
  [switch]$SkipSetup,
  [string]$Workspace = (Join-Path $env:USERPROFILE "claude-video"),
  [string]$SkillsDir = (Join-Path $env:USERPROFILE ".claude\skills")
)
$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$Log = Join-Path $env:USERPROFILE "vidyagram-install.log"
Set-Content -Path $Log -Value "VidyaGram install log $(Get-Date)" -Encoding UTF8
$Total = 7
$VerifyFailed = $false

function Step($n, $text) { Write-Host ""; Write-Host "[$n/$Total] $text" -ForegroundColor Cyan }
function Ok($text)   { Write-Host "  [OK] $text" -ForegroundColor Green }
function Warn($text) { Write-Host "  [!]  $text" -ForegroundColor Yellow }
function Die($text) {
  Write-Host ""
  Write-Host "[X] $text" -ForegroundColor Red
  Write-Host "    Log file: $Log"
  Write-Host "    Ye error ka screenshot + log VidyaGram group me bhejo, hum help karenge."
  exit 1
}
function Refresh-Path {
  $m = [Environment]::GetEnvironmentVariable("Path", "Machine")
  $u = [Environment]::GetEnvironmentVariable("Path", "User")
  $env:Path = "$m;$u;$env:USERPROFILE\.local\bin"
}
function Have($name) { return [bool](Get-Command $name -ErrorAction SilentlyContinue) }
# run a command, append everything to the log, show a dot every 15 s, return its exit code
function Run-Logged($exe, $argLine, $workDir) {
  Add-Content -Path $Log -Value "`n> $exe $argLine"
  $o = [System.IO.Path]::GetTempFileName()
  $e = [System.IO.Path]::GetTempFileName()
  $params = @{ FilePath = $exe; ArgumentList = $argLine; PassThru = $true; NoNewWindow = $true; RedirectStandardOutput = $o; RedirectStandardError = $e }
  if ($workDir) { $params["WorkingDirectory"] = $workDir }
  $p = Start-Process @params
  while (-not $p.HasExited) { Start-Sleep -Seconds 15; Write-Host "." -NoNewline }
  Write-Host ""
  $p.WaitForExit()
  Get-Content $o, $e -ErrorAction SilentlyContinue | Add-Content -Path $Log
  Remove-Item $o, $e -ErrorAction SilentlyContinue
  return $p.ExitCode
}
function Winget-Install($id, $label) {
  Write-Host "  $label install ho raha hai (popup aaye to Yes dabao)..."
  $code = Run-Logged "winget" "install -e --id $id --silent --accept-package-agreements --accept-source-agreements" $null
  Refresh-Path
  return $code
}

Write-Host ""
Write-Host "  VidyaGram Skills  -  Reel Studio installer (Windows)" -ForegroundColor Yellow
Write-Host "  Pehli baar me 10-30 minute lagte hain (downloads). Window band mat karna."

# ------------------------------------------------------------------ 1 checks
Step 1 "System check"
$build = [Environment]::OSVersion.Version.Build
if ($build -lt 17763) { Die "Windows 10 (version 1809) ya Windows 11 chahiye." }
Ok "Windows build $build"
if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64") { Warn "ARM64 laptop mila. Kaam karna chahiye par ye kam test hua hai." }
$drive = (Get-Item $env:USERPROFILE).PSDrive
$freeGb = [math]::Round($drive.Free / 1GB)
if ($freeGb -lt 8) { Die "Kam se kam 8 GB free space chahiye (abhi $freeGb GB hai)." }
Ok "$freeGb GB free disk"

# ------------------------------------------------------------------ 2 tools
Step 2 "Tools install (Git, Node, ffmpeg, uv)"
Refresh-Path
if (-not $SkipWinget) {
  if (-not (Have "winget")) {
    Die "winget nahi mila. Microsoft Store se 'App Installer' install/update karo, phir install.bat dobara chalao."
  }
  $tools = @(
    @{ cmd = "git";    id = "Git.Git";            label = "Git for Windows" },
    @{ cmd = "node";   id = "OpenJS.NodeJS.LTS";  label = "Node.js (LTS)" },
    @{ cmd = "uv";     id = "astral-sh.uv";       label = "uv (Python manager)" },
    @{ cmd = "ffmpeg"; id = "Gyan.FFmpeg";        label = "ffmpeg" }
  )
  foreach ($t in $tools) {
    if (-not (Have $t.cmd)) {
      [void](Winget-Install $t.id $t.label)
      if (-not (Have $t.cmd)) { Warn "$($t.label) abhi PATH me nahi dikha (naya window chahiye ho sakta hai)." }
    }
  }
}
foreach ($c in @("git", "node", "npm", "uv", "ffmpeg")) {
  if (-not (Have $c)) { Die "$c nahi mila. Install.bat dobara chalao; phir bhi na mile to PC restart karke try karo." }
}
$nodeMajor = [int]((& node -v).TrimStart("v").Split(".")[0])
if ($nodeMajor -lt 22) {
  Warn "Node $nodeMajor purana hai, update ho raha hai..."
  [void](Winget-Install "OpenJS.NodeJS.LTS" "Node.js (LTS)")
  $nodeMajor = [int]((& node -v).TrimStart("v").Split(".")[0])
  if ($nodeMajor -lt 22) { Die "Node 22 ya naya chahiye (abhi $(& node -v)). Node.js ki site se LTS install karo." }
}
Ok "git, node $(& node -v), ffmpeg, uv"
# Claude Code needs Git Bash: tell it where it is
$bash = "C:\Program Files\Git\bin\bash.exe"
if (-not (Test-Path $bash)) { $bash = "C:\Program Files (x86)\Git\bin\bash.exe" }
if (Test-Path $bash) {
  [Environment]::SetEnvironmentVariable("CLAUDE_CODE_GIT_BASH_PATH", $bash, "User")
  $env:CLAUDE_CODE_GIT_BASH_PATH = $bash
  Ok "Git Bash mila"
} else { Warn "Git Bash ka path nahi mila; Claude Code ne maanga to Git for Windows dobara install karo." }
# long paths (node_modules gehra hota hai)
[void](Run-Logged "git" "config --global core.longpaths true" $null)
try {
  Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -ErrorAction Stop
  Ok "Long paths enabled"
} catch { Warn "Long paths admin ke bina on nahi ho sake (zyadatar PC me zaroorat nahi padti)." }

# ------------------------------------------------------------------ 3 claude code
Step 3 "Claude Code"
if (Have "claude") {
  Ok "Claude Code pehle se installed"
} elseif ($SkipClaude) {
  Warn "skip (test mode)"
} else {
  Write-Host "  Claude Code install ho raha hai..."
  try { Invoke-RestMethod https://claude.ai/install.ps1 | Invoke-Expression 2>&1 | Out-Null } catch { Add-Content $Log "native installer failed: $_" }
  Refresh-Path
  if (-not (Have "claude")) {
    Warn "Native installer chala nahi, npm se try kar raha hoon..."
    [void](Run-Logged "npm" "install -g @anthropic-ai/claude-code" $null)
    Refresh-Path
  }
  if (Have "claude") { Ok "Claude Code installed" }
  else { Warn "Claude Code auto-install nahi hua. Baad me https://claude.ai/code se install karo. (Baaki setup chalta rahega)" }
}

# ------------------------------------------------------------------ 4 skills
Step 4 "Skills install ($SkillsDir)"
New-Item -ItemType Directory -Force -Path $SkillsDir | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
foreach ($s in Get-ChildItem -Path (Join-Path $Here "skills") -Directory) {
  $dest = Join-Path $SkillsDir $s.Name
  if (Test-Path $dest) {
    Rename-Item -Path $dest -NewName ".$($s.Name).backup-$stamp"
    Warn "purana $($s.Name) backup ho gaya"
  }
  Copy-Item -Recurse -Force -Path $s.FullName -Destination $dest
  Ok "skill: $($s.Name)"
}

# ------------------------------------------------------------------ 5 workspace
Step 5 "Workspace copy ($Workspace)"
New-Item -ItemType Directory -Force -Path $Workspace | Out-Null
& robocopy (Join-Path $Here "workspace") $Workspace /E /XD input_raw processed_audio output_renders /XF style_log.md /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) { Die "Workspace copy fail hua (robocopy code $LASTEXITCODE)." }
foreach ($d in @("input_raw", "processed_audio", "output_renders")) { New-Item -ItemType Directory -Force -Path (Join-Path $Workspace $d) | Out-Null }
if (-not (Test-Path (Join-Path $Workspace "style_log.md"))) {
  Copy-Item (Join-Path $Here "workspace\style_log.md") (Join-Path $Workspace "style_log.md")
}
Ok "workspace ready"
# one-click launcher on the Desktop
try {
  $desk = [Environment]::GetFolderPath("Desktop")
  $bat = "@echo off`r`ntitle VidyaGram Reel Studio`r`ncd /d `"$Workspace`"`r`nclaude`r`npause`r`n"
  Set-Content -Path (Join-Path $desk "Reel Studio.bat") -Value $bat -Encoding ASCII
  Ok "Desktop pe 'Reel Studio.bat' bana diya (double-click = Claude Code khulega)"
} catch { Warn "Desktop shortcut nahi bana (zaroori nahi)." }

# ------------------------------------------------------------------ 6 dependencies
Step 6 "Dependencies install (Python, Whisper, Remotion, HyperFrames, Revideo) - sabse lamba step"
$env:PYTHONUTF8 = "1"
$env:PYTHONIOENCODING = "utf-8"
if ($SkipSetup) { Warn "skip (test mode)" } else {
  Write-Host "  Yahan 10-25 min lag sakte hain. Har dot = 15 second; dots aate rahe to sab theek chal raha hai."
  $code = Run-Logged "uv" "run --no-project --python 3.12 python scripts\vp.py setup" $Workspace
  if ($code -ne 0) {
    Warn "Pehli try fail hui (network?). Ek baar aur try kar raha hoon..."
    $code = Run-Logged "uv" "run --no-project --python 3.12 python scripts\vp.py setup" $Workspace
  }
  if ($code -ne 0) { Die "Dependencies install nahi ho payi." }
  Ok "dependencies installed"
}

# ------------------------------------------------------------------ 7 verify
Step 7 "Health check"
if ($SkipSetup) { Warn "skip (test mode)" } else {
  $py = Join-Path $Workspace ".venv\Scripts\python.exe"
  $env:Path = "$Workspace\bin;$Workspace\.venv\Scripts;$env:Path"
  Push-Location $Workspace
  & $py "scripts\verify.py" 2>&1 | Tee-Object -FilePath $Log -Append | ForEach-Object { Write-Host "  $_" }
  $vcode = $LASTEXITCODE
  Pop-Location
  if ($vcode -ne 0) { $VerifyFailed = $true; Warn "Kuch check fail dikha. 'vp.cmd setup' dobara chalao; phir bhi fail ho to log bhejo: $Log" }
  else { Ok "sab kuch OK" }
}

Write-Host ""
if ($VerifyFailed) { Write-Host "[!] Install complete, par health check me warning hai (upar dekho)" -ForegroundColor Yellow }
else { Write-Host "[OK] Install complete!" -ForegroundColor Green }
Write-Host ""
Write-Host "Ab reel banane ke liye:"
Write-Host "  1. Desktop pe 'Reel Studio.bat' double-click karo   (ya PowerShell me: cd $Workspace ; claude)"
Write-Host "  2. Claude me type karo:  /reel-studio   aur apna video (ya voiceover) drag-drop karo"
Write-Host ""
Write-Host "Pura guide: VidyaGram-Reel-Studio-Guide.pdf   |   Log: $Log"
