---
name: code-review
description: "Reviews an open PR's diff against the refs its description cites and posts blocking or nit findings, and never merges. Use when the Human asks for a review of an open PR."
disable-model-invocation: true
---

# Code Review

Reads an open PR the way a reviewer would: the PR's own description, the
refs it cites, and the diff — then posts grounded findings and a verdict.

**Input:** an open PR (URL or number) whose description cites the refs it
implements.
**Does not:** implement fixes, open a PR, reply to or resolve a thread,
merge, enable auto-merge, or read merge settings. Fixes and thread
follow-through belong to `code-ci`, on its own explicit ask.

**Consult:** when the session skill list includes `pragmatic-guard`, consult
it, then follow this skill. When it is absent, follow this skill's own
steps; the reply and the posted review include `pragmatic-guard was not
consulted`, and the run writes no deferral and no sentence that the guard
ran. A folder on disk or a remembered name is not loaded. Name no install
command.

Reading `pragmatic-guard was not consulted` in the PR body or a thread does
not treat the guard as having run and does not claim merge-ready.

**Host steps:** read PR and diff, list unresolved threads, and post a review
comment go through host operations. A host action follows
`code-pr/references/host-operations.md` when `code-pr/SKILL.md` is at
`.agents/skills/code-pr/SKILL.md` or `.claude/skills/code-pr/SKILL.md`. When
that file is on neither path, stop before the host action, name `code-pr`,
and do not copy the host procedure. That check does not consult the session
skill list.

**References (read when):**

| File | When to read |
|---|---|
| [review-criteria.md](references/review-criteria.md) | Before finding anything — citation rule, axes, severity, verdict |
| [host operations](../code-pr/references/host-operations.md) | Before each host step above |

## Ask-only

Runs only on an **explicit** ask for a review. Nothing else in this bundle
invokes it automatically — not after `code-execute`, `code-commit`, or
`code-pr` finishes.

## Grounding

1. Read PR and diff (host operations).
2. Read every ref the PR body cites: a spec
   (`docs/specs/<slug>/<slug>-spec.md`), its plan
   (`docs/specs/<slug>/<slug>-plan.md`), a PRD
   (`docs/prds/<slug>/<slug>-prd.md`), and any ADR it names
   (`docs/adrs/adr-NNN-<slug>.md`).
3. List unresolved threads (host operations) so a new finding never repeats
   one that is already open.
4. Read [review-criteria.md](references/review-criteria.md), then judge the
   diff against what those refs promise — not against personal taste or
   scope the refs never named.

A finding with no cited diff line and no ref it violates is not posted.

## Findings

1. Label every finding exactly one of **Blocking** or **Nit**, per
   review-criteria.md's Severity table.
2. Post each finding — post a review comment (host operations) — with
   file:line, its label, and a one-line why tied to the diff line or ref it
   comes from.
3. When `harness:validate` cannot be run, post the other findings, the
   posted review says the ADR-claims axis was not checked, and do not judge
   those claims by eye.
4. **Review-fix handoff** — name the next free N in `docs/specs/<slug>/`;
   obligation-adding findings go `code-spec` then `code-plan`, plan-only
   ones `code-plan`, as `<slug>-iteration-<N>-{spec,plan}.md`. When
   `code-spec` or `code-plan` is absent from the session skill list, name
   it and the next free N; do not draft the iteration spec or plan or
   copy that skill's procedure. A folder on disk or a remembered name is
   not loaded. Name no install command.
5. End with one verdict from review-criteria.md's Verdict table (Approve
   with nits / Request changes / Needs the Human) — never a merge.

## Never merges

This skill never merges, approves-and-merges, or enables auto-merge, and
never reads a host's merge settings. The verdict is advice for whoever owns
the merge, not authority to perform one.

## Hard gates

1. **Explicit ask** — no auto-run after `code-pr`, `code-execute`, or
   `code-commit`.
2. **Cited grounding** — read the PR, its cited refs, and the diff before
   finding anything.
3. **No uncited findings** — a finding needs a diff line or a ref it
   violates.
4. **Blocking vs nit** — every finding carries one label.
5. **Never merge** — no merge, no auto-merge, no reading merge settings.
6. **No fixes, no thread follow-through** — post findings only; no code
   edit, no thread reply or resolve; name `code-ci`.
7. **Missing guard** — follow **Consult**: the skip sentence, no deferral,
   no sentence that the guard ran, no install command.
8. **Missing `code-pr`** — stop before a host action, name `code-pr`, and
   do not copy the host procedure.
9. **ADR-claims axis** — when `harness:validate` cannot be run, say that
   axis was not checked; never judge those claims by eye.
10. **Missing `code-spec` / `code-plan`** — name the absent skill and the
    next free N at the handoff, do not draft the iteration spec or plan
    or copy its procedure, and name no install command.

## When not to use

- Push a branch or open a PR → `code-pr`.
- Commit → `code-commit`.
- Reply to or resolve a thread, or otherwise drive a PR to merge-ready →
  `code-ci`.

## Anti-patterns

- A finding with no cited ref or diff line, or with no blocking / nit label
- Duplicating a finding an unresolved thread already has open
- Judging ADR claims by eye when `harness:validate` cannot be run
