#!/usr/bin/env sh
set -eu

# Hand off to the real process (PID 1 gets signals)
exec /usr/local/bin/ci-dokumentor "$@"
