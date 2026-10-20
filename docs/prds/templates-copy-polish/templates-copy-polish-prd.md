---
type: prd
title: Polish the copy PR #67's template trim left behind
description: Fix the dangling references, stale counts, clipped and run-on sentences and self-referential example the templates trim left in its eleven shipped files, and bring its changed lines back into the voice of the prose around them.
status: stable
---

# Polish the copy PR #67's template trim left behind

## Problem

- **Who:** the maintainer reviewing PR #67, and the agents in consumer repos that read the eleven shipped files it changes.
- **Pain:** the trim (`docs/prds/archived/templates-trim/templates-trim-prd.md`) met its byte budget but left **trim fallout**: text that a cut made wrong or hard to read. Fallout means a reference to something the file no longer defines, a count that no longer matches what is left, a sentence clipped to a fragment or joined into a run-on, and an example that describes this repo's own work. Its changed lines also read in a clipped register that the prose around them, untouched by the trim, does not use.
- **Why now:** PR #67 is still open. Fixing the copy on its branch ships the trim and its polish as one change, instead of shipping fallout to consumer repos and following up later.
- **Evidence:** a read of PR #67's diff against `d7cb269`. Examples:
  - `code-spec/references/EXAMPLE.md` cites `R1.3` in its landings table, but the line that said R1.3–R1.7 were elided was cut, so R1.3 is defined nowhere.
  - `code-pr/SKILL.md` Pragmatic-guard still says "pre-merge closure boxes are unticked", while the body now holds one Pre-merge closure box.
  - `qmd-first.md` item 2 joins three rules into one sentence with a dash; its `notes` row reads "research for no effort".
  - `code-spec/references/TEMPLATE.md` reads "a failed gate stops the next" and "tick only with evidence".
  - `code-commit/references/commit-examples.md` uses "Wave A's two units — the lean PR body and the wave commit message" as its good wave example, inside a file whose other examples are made-up features.

## Goals

- No trim fallout is left. Success signal: the Human's read-through of the final diff finds, in the eleven files, no reference to an ID, section or item the file does not define, no count that disagrees with what is left, and no example about this repo's own work.
- The changed lines read in the voice of the prose around them. Success signal: the Human's read-through finds no clipped fragment or run-on sentence in a changed hunk or its neighbours. **Voice** here means the register of the prose the trim left alone in the same skill: full sentences, the imperative for rules, "the Human" capitalised, and each term as that skill's `SKILL.md` already names it.
- Nothing pinned moves. Success signal: `pnpm test`, `pnpm build`, `node dist/cli.js validate`, `pnpm comments` and `pnpm lint` pass; no file under `test/` is in the polish diff; both copies of every touched file stay byte-identical.

**Non-goals**

- A byte target. Readability wins: the polish may grow the files, and the templates-trim 15–20% band is not re-checked.
- Changing a test, or any text a test under `test/` or code under `src/` matches.
- Polishing files PR #67 did not change, its tests, or the archived templates-trim PRD, spec and plan.
- Bringing back an idea the trim removed cleanly, such as the session-note Anti-patterns section or the Mega-unit example.
- Writing a voice guide. The untouched prose is the reference.
- Writing PR #67's new title and body in this round; `code-pr` does that after the read-through.

## User stories

### US-1: No trim fallout

**As a** reader of a shipped template,
**I want** every reference, count and term in it to resolve inside the file,
**so that** I am never stuck on something the trim cut away.

Traces to goal: No trim fallout is left.

#### AC-1.1: A dangling reference resolves

**Given** a changed hunk that names an ID, section or item the file no longer defines, such as `R1.3` in `code-spec/references/EXAMPLE.md`
**When** the file is polished
**Then** the reference resolves: either the line that defined or explained it comes back in polished wording, or the sentence is reworded so it no longer needs the reference.

#### AC-1.2: A count matches what is left

**Given** a sentence whose number or plural no longer matches the text after the trim, such as "pre-merge closure boxes" when one box is left
**When** the file is polished
**Then** the count matches what the file now holds.

#### AC-1.3: Meaning comes back only where a reader is stuck

**Given** an idea the trim cut
**When** the polish decides whether to restore it
**Then** it restores the idea only when a remaining sentence uses a term or step the file no longer explains, such as what **Left for later** holds in the session-note template; an idea removed cleanly, with nothing left pointing at it, stays cut.

#### AC-1.4: Pinned text blocks a fix

**Given** a fallout fix that would change text a test pins, or the fenced note in `session-note-template.md`
**When** the file is polished
**Then** the pinned text stays byte-identical, the fix rewords around it, and when no rewording works the read-through names the spot instead of the test being changed.

### US-2: One voice in the changed lines

**As a** maintainer reading PR #67,
**I want** each changed hunk to read like the untouched prose beside it,
**so that** the trim does not leave a clipped patch in the middle of a full-sentence skill.

Traces to goal: The changed lines read in the voice of the prose around them.

#### AC-2.1: A clipped fragment becomes a sentence

**Given** a changed hunk that holds a fragment, such as "research for no effort", "a failed gate stops the next" or "tick only with evidence"
**When** the file is polished
**Then** the fragment becomes a full sentence or table cell in the voice of its section, saying the same thing.

#### AC-2.2: A run-on splits without losing a rule

**Given** a changed hunk that joins several rules into one sentence, such as `qmd-first.md` item 2
**When** the file is polished
**Then** it splits into one sentence per rule, and every rule it held is still stated, including both `qmd-first` rules the templates-trim spec named: read the file before treating the indexed body as the decision, and name neither number when the index and the file disagree.

#### AC-2.3: Neighbours count, the rest of the file does not

**Given** a sentence PR #67 left untouched
**When** the polish decides whether to change it
**Then** it changes the sentence only when it sits in the same section as a changed hunk and now reads out of step with it; a sentence in a section PR #67 did not change stays as it is.

#### AC-2.4: Terms match the skill

**Given** a changed hunk that names a concept its skill already names, such as Owns, Pre-merge closure, wave batch or the Human
**When** the file is polished
**Then** the hunk uses the skill's existing name and capitalisation, not a synonym.

### US-3: Neutral shipped examples

**As an** agent in a consumer repo reading `commit-examples.md`,
**I want** the wave-batch examples to describe a made-up feature,
**so that** I learn the message shape without reading about the harness's own initiative.

Traces to goal: No trim fallout is left.

#### AC-3.1: The wave examples use a hypothetical feature

**Given** the good wave example under `### One message for a multi-unit wave (wave batch)` and the bad one under `### Joined unit subjects (bad)`
**When** they are rewritten
**Then** both describe a made-up feature already used in the shipped templates, such as avatar-upload, and neither names this repo's PR body, wave commit rule or Wave A.

#### AC-3.2: The pinned shape survives the rewrite

**Given** the rewritten examples
**When** `pnpm test` runs
**Then** `proof-templates-trim-wave-examples` still passes: both headings sit where they did, the good message has one subject and one to three body lines, and the bad one joins at least two `type(scope):` subjects.

## Scope

**In**

- The lines PR #67 added or changed, and their neighbours in the same section, in these eleven shipped files, each in both its `templates/.agents/…` and `.agents/…` copy:
  - `rules/qmd-first.md`
  - `skills/code-commit/SKILL.md` and `skills/code-commit/references/commit-examples.md`
  - `skills/code-execute/references/builder-brief.md`
  - `skills/code-plan/references/EXAMPLE-units.md`
  - `skills/code-pr/SKILL.md` and `skills/code-pr/references/pr-body-template.md`
  - `skills/code-spec/references/EXAMPLE.md` and `skills/code-spec/references/TEMPLATE.md`
  - `skills/harness-init/references/session-note-template.md` and `skills/harness-init/references/stub-template.md`
- One rendering fix in the same diff, done last: a blank line before `**Risk:**` in `pr-body-template.md`, so the Risk line no longer renders inside the last Verification bullet.
- Commits on PR #67's branch, `claude/templates-verbosity-review-cb52a2`, then an amend of PR #67's title and body through `code-pr`.

**Out**

- Everything under Non-goals.
- Sections of the eleven files that PR #67 did not change.

## Open questions

None. PR #67's title and body will be amended through `code-pr` once the polish lands, and the `**Risk:**` render fix joins this round as its last change.

Settled in the grilling: the polish stays inside PR #67's diff, fixes trim fallout and brings the changed lines into one voice, takes the untouched skill prose as the voice reference, has no byte target, lands on PR #67's branch, covers changed hunks and their same-section neighbours, restores meaning only where a sentence dangles, rewrites the wave examples around a hypothetical feature, and is judged by the repo gates plus the Human's read-through of the final diff.

## Handoff

After approval → `code-spec`. This PRD does not authorize implementation.
