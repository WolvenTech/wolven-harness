---
name: code-execute
description: "Executes ordered work units from a locked plan in-repo: implements, validates, and invokes code-commit only when the resolved commit-cadence opt says to. Use when a locked plan's units are ready to build; PRs, reviews, and CI babysitting are always a separate ask."
---

# Code Execute

Runs a plan's work units end-to-end: implement, validate, update the
plan's own resume record, and invoke `code-commit` only when the resolved
commit-cadence opt says to. This skill never opens a PR, leaves review
comments, or babysits CI; `code-pr`, `code-review`, and `code-ci` run only
when asked for separately.

**Consult:** `pragmatic-guard`, `code-commit`.
**Input:** `docs/specs/<slug>/<slug>-plan.md` (+ its spec) when a plan
exists — a one-file change can skip straight here with `harness:validate`.
**Validate:** `harness:validate` before any commit, asked for or automatic.

**References (read when):**

| File | When to read |
|---|---|
| [builder-brief.md](references/builder-brief.md) | The unit's `Subagent` cell reads `spawn` — fill it in for that unit and paste it as the subagent's prompt |

**In / out / handoff:** an approved unit and its frozen obligations →
validated work with the plan's resume section refreshed → `code-commit`
invoked only when the resolved commit-cadence opt says to; otherwise the
work stops, uncommitted, ready to be asked for.

## Hard gates

1. Follow the plan frontier (or an explicit single-unit ask).
2. **Frozen obligations** — execute the obligations frozen in the plan and
   its spec; do not redefine requirements, invent acceptance, or "fix"
   gaps mid-unit.
3. **Resume reconciliation** — seven-field inline section in the plan
   **before mutate**; an undecided discrepancy stops the unit.
4. **Verify-before-claim** — no done, shipped, or PASS claim without a
   real (non-empty) diff and fresh command output from this session; no
   Done-when tick without in-session evidence.
5. **Validate before commit** — `harness:validate` PASS is required before
   `code-commit` is invoked or even asked for; never claim done on a red
   gate.
6. **Plan mark lands in the same commit** — the batch's plan-completion
   marks flip immediately before its commit, so one commit carries both
   the mark and the proven work; if the commit does not succeed, the
   marks go back to unchecked.
7. **Commit only on cadence** — invoke `code-commit` only when the
   resolved `autocommit` / `autocommit-rule` opt says to; never guess past
   a value outside the two known enums; never invoke `code-pr`,
   `code-review`, or `code-ci` on its own — each of those three runs only
   on an explicit ask.
8. **No side directories** for resume state — the plan file is the only
   record of where execution stands.

## When NOT to use

- Locking requirements or unit order — `code-spec` / `code-plan`.
- A standalone commit with no plan unit in scope — `code-commit` directly.
- Opening, reviewing, or driving a PR to merge-ready — `code-pr` /
  `code-review` / `code-ci`.
- Speculative "might need" scope — `pragmatic-guard` refuse + deferral.

## Resume record

The resume record for a unit in flight is an **inline execution/resume
section** written directly into `docs/specs/<slug>/<slug>-plan.md` — the
plan file is the only place it lives. Write or refresh it before touching
any Owns file, and reconcile it against git state **before any mutate**
and again whenever a unit is resumed.

All seven fields are mandatory, `HEAD` and `git status` must match what
git shows, and every discrepancy needs an explicit decision before any
Done-when item is marked complete. Shape:

```markdown
## Execution / resume section

### Unit <N> — <title>

| Field | Value |
|-------|-------|
| Unit identifier | <N> — <title> (frontier position if useful) |
| Spec/plan paths | `docs/specs/<slug>/<slug>-spec.md` / `docs/specs/<slug>/<slug>-plan.md` |
| Obligation / proof status | <frozen obligation ids from the plan> — pending \| done \| fail \| blocked |
| `HEAD` commit | `<short-sha>` from `git rev-parse --short HEAD` |
| `git status` summary | clean \| dirty — whose paths: this unit's Owns vs unrelated |
| Intended diff scope | `<expected paths — matches Owns>` |
| Decision on every discrepancy | none \| resolved \| escalated, per item — never undecided |
```

### Isolation / escalate (dirty or multi-unit)

When **more than one unit** is in flight, or `git status` shows
**unrelated dirty paths** (outside this unit's Owns):

1. **Isolate** — work only on Owns paths; do not "helpfully" touch a
   foreign dirty file.
2. **Or escalate** — stop and ask once before mutating, when isolation is
   unsafe (overlapping Owns, conflicting uncommitted work, unclear
   ownership).
3. Do not paper over unrelated dirt by starting a side file or directory
   to hold state instead.

## Consumer opt (commit cadence)

Read `.agents/code-commit.config.yml` before mutate. An absent file, or an
absent key, takes that key's default: `autocommit: false`,
`autocommit-rule: wave`. A value outside `true`/`false` (for `autocommit`)
or `unit`/`wave` (for `autocommit-rule`) is **fail-closed** — stop; do not
guess and do not commit; name the bad key and the value that was read.

| `autocommit` | `autocommit-rule` | Execute path |
|---|---|---|
| `false` | ignored | Skip `code-commit`. Work stays uncommitted, ready to be asked for. |
| `true` | `unit` | After that unit's validate PASS, invoke `code-commit` once for that unit's work plus its plan-completion mark. |
| `true` | `wave` | Do not commit per unit. After the wave gate's validate PASS, invoke `code-commit` once for that wave's proven work plus those units' plan-completion marks. |

- `code-commit` not installed (no `.agents/skills/code-commit/`): never
  commit automatically, whatever the opt says, and leave the work
  uncommitted.
- No plan in scope: no automatic commit; an explicit standalone commit ask
  still runs `code-commit` directly, whatever the opt says.

## Subagent dispatch (plan's Subagent column)

Honor the unit's `Subagent` value exactly as the plan states it — see
`code-plan`'s Subagent column:

| Subagent | Action |
|---|---|
| `spawn` | Spawn a subagent, in whatever runtime is available, with [builder-brief.md](references/builder-brief.md) — filled in for this unit — as its prompt |
| `inline` | Implement the unit directly in the current session; no subagent |

Never override the value with a size heuristic, and never default it. A
plan row that omits it is incomplete — send it back to `code-plan` rather
than guessing, and never invent a third value.

Before pasting the brief, fill in every placeholder — the unit row, its
Owns and must-not-touch paths, what has already landed on the branch, the
spec/plan paths, and the wave's gate command — with this unit's real
values. The brief is a paste-in prompt for the subagent's turn,
not a registered persona file.

## Final check (mandatory, paste both outputs)

Whether a unit ran inline or as a spawned subagent, before that unit is
marked done — and again at every wave gate — run:

```sh
npm run harness:comments   # or: pnpm harness:comments, yarn harness:comments
npm run harness:validate   # or: pnpm harness:validate, yarn harness:validate
```

and paste both outputs. A spawned subagent already carries this
instruction in [builder-brief.md](references/builder-brief.md) and pastes
its own outputs back in its return. The parent re-runs the same final
check over the **whole repo** at every wave gate, even when every unit in
the wave already passed it individually — a later unit in the same wave
can reintroduce a hit an earlier, narrower check missed.

## Pre-start print (before mutate)

Before editing files (the plan's resume section aside), print:

1. **Unit** — number, title, frontier position
2. **Assumptions** — spec/plan paths, wave stop in effect
3. **Files to touch** — expected Owns paths
4. **Disposition** — `spawn` | `inline`, read from the plan's Subagent
   column
5. **Done when** — copy from the plan (checklist below)
6. **Validate** — `harness:validate` (plus any unit-named check) that must
   PASS before a commit is invoked or even asked for
7. **Resume** — confirm the seven-field execution/resume section is
   present and refreshed in the plan
8. **Resolved opt** — the `autocommit` and `autocommit-rule` values, and
   whether each came from `.agents/code-commit.config.yml` or a default;
   say so here when `code-commit` is not installed

If any item is ambiguous, ask once — then proceed.

## Done-when checklist (print before implement)

Copy the unit's Done when into a checklist; tick only with in-session
proof:

```markdown
- [ ] <requirement 1 from the plan>
- [ ] <requirement 2>
- [ ] `harness:comments` and `harness:validate` PASS (outputs pasted)
- [ ] Real diff exists (not empty-diff done)
- [ ] Resume reconciliation — seven fields present in the plan's inline section
```

## Workflow

### 1. Pull unit + reconcile resume

Claim the next frontier unit (or a named unit). Refresh the plan's resume
section and reconcile its obligations against the worktree and the diff
vs `HEAD`; then run the pre-start print and the Done-when checklist. On an
undecided discrepancy, unrelated dirty paths that cannot be isolated, or
an incomplete resume field — stop (isolate or escalate).

### 2. Implement (per the Subagent dispatch above)

Smallest change that satisfies Done when; match repo style. `spawn`
pastes the filled-in [builder-brief.md](references/builder-brief.md);
`inline` implements directly in this session, applying the same rules the
brief states (edit only this unit's Owns; tests only — no build, commit,
or push; report anything outside Owns instead of fixing it). Parallel
units may be running in the same repo on disjoint paths.

### 3. Validate

Run the unit's checks, then the [final check](#final-check-mandatory-paste-both-outputs)
above. Fix failures; do not suppress a gate. If validate fails, stop — do
not mark the unit done and do not invoke `code-commit`.

### 4. Mark and commit (cadence, only after PASS)

When the resolved cadence commits a batch — this unit on `unit`, the
wave's units once at the wave gate on `wave` — and that batch has passed
its checks (at a wave gate, the final check re-run over the whole repo):

1. Flip that batch's Done-when marks in the plan, in the worktree, right
   before the commit.
2. Invoke `code-commit` for the batch's work plus those marks; do not
   invent a parallel commit path.
3. If the commit does not succeed (hook reject, empty stage, conflict,
   abort): undo the plan-mark edit — never leave a green checkmark
   describing work the repo does not contain. Fix the underlying issue
   and retry from validate.

When no commit follows — `autocommit: false`, `code-commit` not installed,
or no plan in scope — skip both: leave the marks unflipped and the work
uncommitted, and say why (ready to be asked for, or `code-commit` not
installed).

Pull the next frontier unit once the batch is settled. Stop there unless
explicitly asked for `code-pr`, `code-review`, or `code-ci`.

## Anti-patterns

Breaking a hard gate above is an anti-pattern in itself. Also avoid:

- **Guessing a blank Subagent cell** instead of sending the plan back
- **Skipping the pre-start print** on a multi-file unit
- Auto-chaining `code-pr`, `code-review`, or `code-ci` after every unit
- Packing the next wave into this one because capacity exists

Refuse these as over-build (`pragmatic-guard`):

- **Independent-verifier ceremony** — a separate verifier pass stacked on
  the final check, which already proves the unit
- **Execution log** — a running log or state file of the execution kept
  beside the plan's seven-field resume section
