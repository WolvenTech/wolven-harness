---
type: prd
title: Secret-path guard (issue 80 slice)
description: Ship a standing rule and pre-tool hook so agents refuse reads and shell commands that touch secret-shaped paths.
status: draft
---

# Secret-path guard (issue 80 slice)

## Problem

- **Who:** Teams using a harness-wired repo (for example `one-man-team`) whose agents run with broad file and shell access.
- **Pain:** Nothing stops an agent from running `find` and reading a `.pem` private key into context; no standing rule names secret-shaped paths as off-limits, and `setup` ships no agent-side hooks.
- **Why now:** GitHub issue #80 documents a real incident where key material entered an agent session without refusal or post-hoc flagging.
- **Evidence:** [wolven-harness#80](https://github.com/WolvenTech/wolven-harness/issues/80).

## Goals

- Block agent tool use that targets secret-shaped paths before content is read — success signal: a pre-tool hook returns deny for a `.pem` read and for `cat` on the same path in a freshly set-up repo with Cursor or Claude Code selected.
- Give every runtime at least a standing rule — success signal: `setup` installs `.agents/rules/secrets.md` and inline-mode runtimes see it through the harness rules block.
- Keep the first slice shippable without new runtime dependencies — success signal: pattern checks are built into shipped hook scripts with no npm package beyond Node.

**Non-goals**

- Pre-commit secret scanning, `doctor` / harness-score checks, or `.wolven-harness.json` pattern overrides (issue #80 items 4–6).
- Wiring hooks for all nine runtimes in one change; Codex and other inline-only runtimes rely on the standing rule until a follow-up wires native hooks.
- Replacing human approval flows for legitimate secret access (agents must ask the Human per the rule).

## User stories

### US-1: Agent refused at the tool boundary

**As a** developer using Claude Code or Cursor in a harness-wired repo,
**I want** a pre-tool hook to deny reads and shell commands that touch secret-shaped paths,
**so that** private keys and credential files do not enter the agent context.

Traces to goal: Block agent tool use that targets secret-shaped paths.

#### AC-1.1: Read of a private key is denied

**Given** a repo that ran `setup` with the Cursor or Claude Code runtime and has `.agents/hooks/secret-path-guard.mjs` wired
**When** the agent attempts to read `certs/client.pem`
**Then** the hook returns a deny decision and a message that cites the secrets standing rule

#### AC-1.2: Shell access to the same path is denied

**Given** the same wired repo
**When** the agent runs a shell command `cat ./secrets/id_rsa`
**Then** the hook returns deny before the command executes

#### AC-1.3: `.env.example` is allowed

**Given** the same wired repo
**When** the agent reads `.env.example`
**Then** the hook allows the tool call (exit 0 with no deny payload)

### US-2: Standing rule for runtimes without hooks

**As a** developer using Codex or another inline-rules runtime,
**I want** a `secrets.md` standing rule in `.agents/rules/`,
**so that** the agent is instructed never to read or print secret-shaped files even without a hook.

Traces to goal: Give every runtime at least a standing rule.

#### AC-2.1: Rule ships with setup

**Given** a fresh git top-level where `setup` copies rules
**When** setup completes
**Then** `.agents/rules/secrets.md` exists with `alwaysApply: true` frontmatter

#### AC-2.2: Inline runtimes cite the rule

**Given** setup selected Codex (inline rules mode)
**When** the harness entry lists standing rules
**Then** `secrets.md` appears alongside the other standing rules

## Scope

**In**

- `secrets.md` under `templates/.agents/rules/` (and the harness home copy).
- `secret-paths.mjs` pattern module and `secret-path-guard.mjs` hook entrypoint under `templates/.agents/hooks/`.
- `setup` wiring of `.cursor/hooks.json` and `.claude/settings.json` when those runtimes are selected.
- Automated tests for pattern matching (including shell forms and `.env.example` allowance).

**Out**

- Doctor and harness-score enforcement.
- Pre-commit staged secret scan.
- Configurable pattern overrides in `.wolven-harness.json`.
- Hook wiring for Codex, Copilot, Gemini, and the remaining runtimes.

## Open questions

- Block outright vs ask-the-Human where the runtime supports ask — owner: None (this slice blocks outright at the hook; rule tells agents to ask the Human when access is truly needed).
- Which runtimes lack hook surfaces and whether rule-only is acceptable there — owner: None (Codex/antigravity use inline rules for now; native hook wiring is a follow-up).
- Pre-commit scan as built-in patterns vs a new dependency — owner: None (deferred per non-goals).

## Notes

**Pre-commit scan (pragmatic-guard):** Keep deferred for now. When picked up later, reuse the hook's built-in path patterns (`secret-paths.mjs`) rather than a new dependency. Need 2/10 — the #80 incident was an agent reading a key, not committing one. Complexity 5/10 built-in vs 8/10 with a new dependency. Owner: Rafael, 2026-10-26.

## Handoff

After approval → `code-spec`. This PRD does not authorize implementation.
