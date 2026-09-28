---
name: node-test
description: Stub skill for node:test suites run through tsx — not yet defined
metadata:
  wolven-harness: stub
disable-model-invocation: true
---

# node-test

Suggested while discovering this repo's decided tools, ask-only until the
Human defines it.

## Discovery evidence

- `package.json` runs `tsx --test "test/**/*.test.ts"`; `AGENTS.md` says
  the suites run in-process against `src/`, with no build required.
- About 35 suites under `test/`, sharing `test/helpers/fixture.ts`
  (`makeRepo`) and `test/helpers/skill-contract.ts`.
- `.wolven-harness.json` ignores `test/**` for the claim gate, since
  fixtures build claim scenarios on purpose (ADR 001, The ADR claim gate
  governs architecture-decision references).
- The Node.js test runner docs mark `node:test` stable since v20.0.0 and
  match `*.test.ts` by default unless `--no-strip-types` is set; this
  repo requires Node 22 or later.

## When to use

<Ask the Human: when should an agent reach for this skill?>

## Conventions

<Ask the Human: what did they decide for node:test suites run through tsx — naming, layout, its own rules?>

## What to avoid

<Ask the Human: what should this skill refuse, or never do?>

## How to verify

<Ask the Human: what command or read confirms this skill did its job?>
