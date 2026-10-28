#!/usr/bin/env bash
# Rebuilds the probe for gitignored-harness-access-note.md in a temp folder.
# A script gets the system grep and find; Claude Code's embedded ugrep and bfs exist only
# in its own Bash tool, so the embedded-grep check is listed below to run there by hand.
set -euo pipefail

root="$(mktemp -d)/app"
mkdir -p "$root" && cd "$root"
git init -q && git commit -q --allow-empty -m init

mkdir -p .wolven-harness/docs/adrs .wolven-harness/skills/probe-skill .claude
echo "TOKEN_ADR" > .wolven-harness/docs/adrs/adr-001.md
echo "TOKENRULE" > .wolven-harness/rule.md
printf -- '---\nname: probe-skill\ndescription: Probe skill for a gitignore test.\n---\nSay PROBE.\n' \
  > .wolven-harness/skills/probe-skill/SKILL.md
printf '# Harness\nThe harness codeword is PELICAN-42.\n' > .wolven-harness/AGENTS.md
printf '@.wolven-harness/AGENTS.md\n' > CLAUDE.local.md
ln -s ../.wolven-harness/skills .claude/skills

# The harness keeps its own history in a git dir inside the parent's .git, never pushed.
git init -q --bare .git/wolven-harness.git
git --git-dir=.git/wolven-harness.git --work-tree=.wolven-harness add -A
git --git-dir=.git/wolven-harness.git --work-tree=.wolven-harness commit -q -m harness

printf '.wolven-harness/*\n!.wolven-harness/docs/\n.claude/\nCLAUDE.local.md\n' > .gitignore

echo "== parent repo would version:"; git add -A --dry-run
echo "== system grep -rn TOKEN . (does not read .gitignore)"; grep -rn TOKEN . || true
echo "== find . -name rule.md"; find . -name rule.md
echo "== probe folder: $root"
echo "Next, by hand in that folder:"
echo "  in Claude Code's Bash tool: grep --version (ugrep), grep -rn TOKEN ., grep -rn TOKEN .wolven-harness"
echo "  claude -p 'reply ok' --max-turns 1 --output-format stream-json --verbose < /dev/null  # init event lists probe-skill"
echo "  claude -p 'What is the harness codeword? Codeword only, or NONE.' --max-turns 1 < /dev/null"
echo "  cursor-agent -p --trust 'Without running any tools: is a skill named probe-skill available?' < /dev/null"
echo "  qmd --index probe collection add . --name whole && qmd --index probe ls whole"
echo "  qmd --index probe collection add .wolven-harness --name hroot && qmd --index probe ls hroot"
