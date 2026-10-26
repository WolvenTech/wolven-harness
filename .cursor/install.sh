#!/usr/bin/env bash
# hazard: default npm global prefix on Cloud Agent images is not writable.
# why: Cloud agents need QMD on PATH and a built .qmd index before qmd-first and MCP search work.
# invariant: idempotent — safe on rebuilds; embed skips when content hashes already have vectors.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT}"

export PATH="${HOME}/.local/bin:${PATH}"
QMD_BIN="${HOME}/.local/bin/qmd"

pnpm install

if [[ ! -x "${QMD_BIN}" ]]; then
  npm install -g --prefix "${HOME}/.local" @tobilu/qmd
fi

if command -v sudo >/dev/null 2>&1 && [[ ! -e /usr/local/bin/qmd ]]; then
  sudo ln -sf "${QMD_BIN}" /usr/local/bin/qmd || true
fi

"${QMD_BIN}" update
# hazard: first embed on a cold build downloads GGUF models and can take many minutes on CPU.
"${QMD_BIN}" embed --timeout 0
