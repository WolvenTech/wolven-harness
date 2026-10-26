#!/usr/bin/env bash
# why: Cloud installs QMD under ~/.local; macOS Homebrew puts qmd on PATH instead.
# invariant: prefer ~/.local/bin/qmd when executable; otherwise exec qmd from PATH.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT}"

QMD_LOCAL="${HOME}/.local/bin/qmd"
if [[ -x "${QMD_LOCAL}" ]]; then
  exec "${QMD_LOCAL}" mcp
fi

exec qmd mcp
