@echo off
rem Windows launcher for the video pipeline (PowerShell / cmd):   vp.cmd help
set "ROOT=%~dp0"
set "PATH=%ROOT%bin;%ROOT%.venv\Scripts;%PATH%"
set PYTHONUTF8=1
set PYTHONIOENCODING=utf-8
set HYPERFRAMES_NO_TELEMETRY=1
if exist "%ROOT%.venv\Scripts\python.exe" (
  "%ROOT%.venv\Scripts\python.exe" "%ROOT%scripts\vp.py" %*
) else (
  uv run --no-project --python 3.12 python "%ROOT%scripts\vp.py" %*
)
