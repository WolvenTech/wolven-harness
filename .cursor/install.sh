#!/usr/bin/env bash
# hazard: default npm global prefix on Cloud Agent images is not writable.
# Install the QMD CLI into ~/.local so `qmd` lands on PATH via ~/.profile.
set -euo pipefail

export PATH="${HOME}/.local/bin:${PATH}"

pnpm install
npm install -g --prefix "${HOME}/.local" @tobilu/qmd
qmd update
qmd embed
