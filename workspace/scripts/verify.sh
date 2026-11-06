#!/usr/bin/env bash
# Kept for old habits: the real check is scripts/verify.py (works on macOS and Windows). Usage: ./scripts/verify.sh
exec "$(dirname "$0")/../vp" verify
