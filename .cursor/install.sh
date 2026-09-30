#!/usr/bin/env bash
# hazard: default npm global prefix on Cloud Agent images is not writable.
# Install the QMD CLI into ~/.local; builders often skip ~/.profile, so PATH
# and absolute bin paths are set explicitly before qmd update/embed.
set -euo pipefail

export PATH="${HOME}/.local/bin:${PATH}"
QMD_BIN="${HOME}/.local/bin/qmd"

pnpm install
npm install -g --prefix "${HOME}/.local" @tobilu/qmd
"${QMD_BIN}" update
"${QMD_BIN}" embed
