---
name: skill-templates
description: Stub skill for authoring the skills, rules, and docs this package ships — not yet defined
metadata:
  wolven-harness: stub
disable-model-invocation: true
---

# skill-templates

Suggested while discovering this repo's decided tools, ask-only until the
Human defines it.

## Discovery evidence

- `templates/` holds what `init` copies into a consumer repo, including 16
  skills under `templates/.agents/skills/`; `package.json` `files` ships
  `dist` and `templates` only, and `test/release.test.ts` pins that list.
- 14 `test/skill-*.test.ts` suites read skill contracts from
  `templates/.agents/skills/` through `test/helpers/skill-contract.ts`.
- This repo's own `.agents/` tree is, at this run, an identical copy of
  `templates/.agents/` (`diff -rq` reports no difference), so an edit to
  one does not reach the other.

## When to use

<Ask the Human: when should an agent reach for this skill?>

## Conventions

<Ask the Human: what did they decide for authoring the skills, rules, and docs this package ships — naming, layout, its own rules?>

## What to avoid

<Ask the Human: what should this skill refuse, or never do?>

## How to verify

<Ask the Human: what command or read confirms this skill did its job?>
