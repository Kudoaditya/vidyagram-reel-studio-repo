# Source this before running any pipeline command:  source ./env.sh
WS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")" && pwd)"
export PATH="$WS_ROOT/bin:$WS_ROOT/.venv/bin:$PATH"
export VIRTUAL_ENV="$WS_ROOT/.venv"
