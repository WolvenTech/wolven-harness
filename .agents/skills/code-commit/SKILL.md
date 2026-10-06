---
name: code-commit
description: "Creates Conventional Commits for repo work. Use when the Human explicitly asks for a commit, or from code-execute only when the resolved commit-cadence opt says to commit."
---

# Code Commit

Turns a validated, uncommitted change into one or more local
[Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/#summary),
through one of the two entry modes below.

**Consult:** `pragmatic-guard`. Loaded means the session skill list from the
runtime. When that list includes `pragmatic-guard`, consult it, then follow
this skill. When it is absent, follow this skill's own steps; the reply and
the commit message include `pragmatic-guard was not consulted`. A folder on
disk or a remembered name is not loaded. Name no install command for
`pragmatic-guard`. That run writes no deferral and no sentence that the
guard ran.

**In / out / handoff:** a validated, uncommitted change → one or more local
commits → stop. Pushing or opening a review request is a separate, explicit
ask (see When not to use).

**References (read when):**

| File | When to read |
|------|--------------|
| [commit-examples.md](references/commit-examples.md) | Drafting messages, splitting a multi-context change, or applying the atomic plan-mark / failed-commit cleanup |

## Entry modes

| Mode | When | Behavior |
|------|------|----------|
| **From `code-execute`** | Validate PASSed and the resolved commit-cadence opt says to commit — after one unit, or once at a wave gate | One atomic commit of the batch: its work plus only its plan-completion marks (split only if the batch clearly holds unrelated contexts) |
| **Standalone** | An explicit "commit this" / "ship this locally" ask, with no gate involved | Inspect the workspace → group the diff into coherent contexts → one or more Conventional Commits |

The **batch** is what a commit covers: one unit, a wave's units at a wave
gate, or one standalone group.

## Atomic commit gate

Create a Conventional Commit **only after validation has passed**. When a
plan unit is in scope, its **plan-completion mark** — the unit's Done-when
checkbox in `docs/specs/<slug>/<slug>-plan.md`, already flipped in the
worktree and not yet committed — lands in the **same commit** as its work.

1. Stage the batch's proven work **and** only the batch's plan-completion
   marks.
2. One commit contains both; never leave the plan-completion mark for a
   later commit, and never flip the checkbox of a unit outside the batch.
3. With no plan unit in scope, skip plan staging.

**If the commit fails** (hook reject, empty stage, conflict, abort):

1. The unit remains **incomplete** — every unit in the batch.
2. Reverse the batch's plan-completion marks to `[ ]` — never leave a
   false-green checkbox on the plan; keep the rest of the uncommitted work.
3. Re-confirm validation before retrying; never claim the unit done from a
   failed commit.

## Hard gates

1. **Non-empty** — real staged/unstaged diffs; never an empty commit.
2. **No secrets** — refuse `.env` files, credentials, tokens, private keys;
   warn if asked to stage one.
3. **Conventional Commits** — `type[(scope)]: summary`, with an optional
   body and footers; the subject says why, not a restated file list.
4. **Validate first** — when invoked from `code-execute`, commit only once
   `harness:validate` (and `harness:comments` for code changes) has passed
   on the batch being committed; never commit on a red run.
5. **Atomic plan completion** — the atomic commit gate above, including its
   failed-commit cleanup.
6. **Git safety** — no `git config` changes; no force-push; no `--no-verify`
   unless explicitly asked; no push.
7. **Not on the default branch** — never commit on the branch `origin/HEAD`
   names; `git switch -c <feature>` first, keeping the working tree as is.

## When not to use

- Push a branch or open a review request → `code-pr` (a peer skill, not a
  next step this skill chains into).
- Leave comments on an open review → `code-review`.
- Keep a change ready to land → `code-ci`.
- Board / ticket work outside a repo → out of scope for this skill.

**Not a refusal:** a red gate means fix it first — never commit through it;
a standalone commit is still valid whenever explicitly asked.

## Multi-commit heuristics

| Situation | Commits |
|-----------|---------|
| One coherent change, one context | **One** commit |
| A unit's work and its plan-completion mark | **Same** commit — never split those two |
| Unrelated contexts (application code vs scripts vs docs) | **Split** — one commit per coherent context, e.g. `chore(build): …` vs `docs(specs): …` |
| Two unrelated batches of work landed in the same session | **Two** — match the batches unless explicitly asked to squash |
| A pre-commit hook auto-modifies files | Fix, then a **new** commit — never amend a failed hook run |

When in doubt, prefer smaller commits with clear scopes over one vague
message — except never split a unit's work from its plan-completion mark.

## Workflow

### From `code-execute`

1. Confirm validation passed on the batch (hard gate 4) and that its
   plan-completion marks are flipped in the worktree, uncommitted.
2. `git status` / `git diff` / recent `git log` for message style.
3. Stage only the batch's files plus its plan-completion marks; exclude
   secrets and unrelated changes.
4. Commit with a HEREDOC message (shape in
   [commit-examples.md](references/commit-examples.md)).
5. On success: confirm `git status` is clean for the staged paths, and that
   the commit's diff holds the work **and only** the batch's
   plan-completion marks.
6. On failure: follow **If the commit fails** above.

### Standalone

1. Inspect status and diffs; group changes into coherent contexts
   (application code vs scripts vs docs, etc.).
2. Confirm groupings and exclusions when ambiguous.
3. For each group: stage → Conventional Commit → verify. Do not squash
   unrelated groups into one message.
4. When a plan-completion mark is intentionally included, keep it atomic
   with its work.

## Message shape

```text
type(optional-scope): short summary

Optional body — why, not a file list.
```

Sample (full good/bad set in
[commit-examples.md](references/commit-examples.md)):

```text
fix(billing): stop double invoice retries on webhook replay

The webhook handler re-queued a retry every time the payment provider
resent an already-processed event. Retries are now keyed by the
provider's idempotency id, so a replay is a no-op.
```

Common types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`,
`style`, `perf`.

## Pragmatic-guard

Refuse an empty commit, staging a secret, committing on a failed
validation, rewriting shared history, inventing a second commit skill,
leaving a false-green plan checkbox after a failed commit, and splitting a
unit's work from its matching plan-completion mark.

## Anti-patterns

Beyond the refusals above:

- A subject that restates the diff's file list instead of the why
- One commit mixing an unrelated tooling change with unrelated feature work
