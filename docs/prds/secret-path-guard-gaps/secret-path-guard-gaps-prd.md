---
type: prd
title: Secret-path guard bypass gaps (issue 103)
description: Close brace-expansion, rev-prefixed, and fail-open bypasses in the secret-path guard without widening scope beyond the issue 103 fix slice.
status: draft
---

# Secret-path guard bypass gaps (issue 103)

Grilling did not run — requirements are taken from [wolven-harness#103](https://github.com/WolvenTech/wolven-harness/issues/103) and local review of `templates/.agents/hooks/`.

## Problem

- **Who:** Teams using harness-wired Cursor or Claude Code installs that rely on `secret-path-guard.mjs` to keep secret-shaped files out of agent context.
- **Pain:** The guard’s word-based checks miss brace expansions, `host:path` / `rev:path` forms, and can fail open when the hook does not run or Cursor does not treat a hook error as blocking — so agents can still reach `.env`, keys, and globs that include secret extensions.
- **Why now:** Issue #103 documents concrete allowed bypasses; an equivalent fix already landed in WolvenTech/wolven-prod (`dbb2e0c`) and should ship in the harness templates consumers install.
- **Evidence:** [wolven-harness#103](https://github.com/WolvenTech/wolven-harness/issues/103); downstream reference commit `dbb2e0c` on wolven-prod.

## Goals

- Deny shell and tool payloads that reach secrets through brace expansion — success signal: `cat {.env,README.md}`, `cat {x.pem,y}`, and Grep/Glob patterns such as `*.{pem,key}` are denied in `pnpm test` and when spawning the hook over stdin.
- Deny commands that name secrets only after the last `:` in a token or `=` value side — success signal: `git show HEAD:.env` and `scp prod:.env /dev/stdout` are denied; legitimate paths without secrets still allow.
- Fail closed when the guard cannot run — success signal: fresh `setup` emits Cursor hook entries with `failClosed: true`; Claude Code wiring uses `node … || exit 2` so a missing `node` blocks the tool call.
- Preserve current allowances from the stable secret-path guard slice — success signal: existing tests for `.env.example`, non-secret globs, and documented safe brace forms (for example `docs/{adrs,runbooks}`, `*.{md,mjs}`) still pass.

**Non-goals**

- Pre-commit secret scanning, doctor/score enforcement, or configurable pattern overrides (deferred in the stable [secret-path-guard PRD](../secret-path-guard/secret-path-guard-prd.md)).
- Hook wiring for runtimes beyond Cursor and Claude Code in this slice.
- Redesigning the standing rule `secrets.md` or changing deny message copy unless a test obligation requires it.

## User stories

### US-1: Brace expansion cannot smuggle secrets

**As a** developer whose agent runs shell or search tools,
**I want** the guard to expand `{a,b}` alternatives and classify each,
**so that** a single word cannot hide a `.env` or `.pem` beside a safe sibling.

Traces to goal: Deny shell and tool payloads that reach secrets through brace expansion.

#### AC-1.1: Bash brace lists with a secret member are denied

**Given** a repo with the guard hook wired as today
**When** the agent runs `cat {.env,README.md}` or `cat {x.pem,y}`
**Then** the hook returns deny before execution

#### AC-1.2: Grep/Glob brace patterns that include secret extensions are denied

**Given** the same wired repo
**When** the agent uses a Glob or Grep path/glob of `*.{pem,key}`
**Then** the hook returns deny

#### AC-1.3: Nested expansion stays bounded

**Given** a brace expansion with more than 256 alternatives after full expansion
**When** the guard evaluates the word
**Then** the hook returns deny (refuse past the cap rather than silently allowing)

#### AC-1.4: Safe brace forms stay allowed

**Given** commands such as `ls docs/{adrs,runbooks}` or globs `*.{md,mjs}`
**When** no expanded alternative is secret-shaped
**Then** the hook allows the tool call

### US-2: Colon-suffixed paths are classified

**As a** developer using git or scp-style commands,
**I want** the segment after the last `:` in each token (and after `=` in assignments) checked,
**so that** `HEAD:.env` cannot bypass slash-only splitting.

Traces to goal: Deny commands that name secrets only after the last `:`.

#### AC-2.1: Git and scp forms with secret tails are denied

**Given** a wired repo
**When** the agent runs `git show HEAD:.env` or `scp prod:.env /dev/stdout`
**Then** the hook returns deny

#### AC-2.2: Colon forms without secrets still allow

**Given** a command whose post-colon segment is not secret-shaped (for example a safe ref path)
**When** the hook evaluates the payload
**Then** the hook allows the tool call

### US-3: Hook wiring fails closed

**As a** harness consumer,
**I want** setup to wire hooks so a guard failure blocks the tool,
**so that** a missing Node binary or hook crash does not leave tools unrestricted.

Traces to goal: Fail closed when the guard cannot run.

#### AC-3.1: Cursor hooks set failClosed

**Given** a fresh `setup` with Cursor selected
**When** `.cursor/hooks.json` is written
**Then** both guard entries include `"failClosed": true`

#### AC-3.2: Claude guard command propagates hook exit 2

**Given** a fresh `setup` with Claude Code selected
**When** `.claude/settings.json` lists the PreToolUse guard command
**Then** the command ends with `|| exit 2` (or equivalent) so a non-zero guard exit blocks the tool

#### AC-3.3: Existing consumers can follow README manual wiring

**Given** hook config was skipped because a file already existed
**When** a human updates wiring using `templates/.agents/hooks/README.md`
**Then** the documented Cursor and Claude snippets include the same fail-closed semantics

### US-4: Regression coverage for stdin spawn tests

**As a** maintainer,
**I want** automated tests that spawn the guard with deny and allow stdin cases,
**so that** the issue 103 bypass class does not regress.

Traces to goal: Preserve current allowances from the stable secret-path guard slice.

#### AC-4.1: New bypass fixtures are denied at the hook boundary

**Given** the test suite after implementation
**When** `pnpm test` runs `test/secret-path-guard.test.ts` (and hook wiring tests)
**Then** brace, colon, and glob bypass cases from issue #103 are covered with deny/allow expectations

## Scope

**In**

- `templates/.agents/hooks/secret-paths.mjs` — brace expansion (nested, capped at 256), colon-suffix checks in `commandTouchesSecret` and read/grep/glob path handling as needed.
- `templates/.agents/hooks/secret-path-guard.mjs` — only if payload handling must delegate expanded forms (minimal delta).
- `src/setup/runtimes.ts` — Cursor `failClosed` and Claude `|| exit 2` in generated hook commands; quiet-install path when it mirrors the same JSON.
- `templates/.agents/hooks/README.md` — manual wiring aligned with generated config.
- `test/secret-path-guard.test.ts` and hook wiring tests — new deny/allow cases including `awk '{print $1}'` staying allowed per issue #103.

**Out**

- New npm dependencies; pattern list changes beyond what expansion and colon-suffix checking require.
- Merging guard config into pre-existing consumer `.cursor/hooks.json` or `.claude/settings.json` (still skip-if-exists; README only).
- Doctor refresh prompts, harness-score checks, or pre-commit scanners.

## Open questions

- Whether Grep tool payloads need the same brace expansion on `path` as Glob `pattern` — owner: None (default: treat path and pattern consistently with issue #103 and wolven-prod parity).
- Cap behavior when expansion exceeds 256 alternatives: deny entire tool call vs deny only the word — owner: None (issue #103 says refuse past the cap; match wolven-prod unless spec review objects).

## Handoff

After approval → `code-spec`. This PRD does not authorize implementation. Builds on the stable [secret-path-guard PRD](../secret-path-guard/secret-path-guard-prd.md) and its shipped spec; it does not replace that PRD.