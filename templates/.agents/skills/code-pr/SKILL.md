---
name: code-pr
description: "Pushes the branch and opens or amends a pull request for the current state, titled as a Conventional Commit and filled from the body template, and never merges. Use only when the Human explicitly asks to open or update a PR."
disable-model-invocation: true
---

# Code PR

Pushes the branch and opens or amends a pull request for whatever is on it
right now — a create when this head has no open PR, an amend when it does.
Ask-only: `disable-model-invocation: true` stays set, and nothing merges
from here.

**Consult:** `pragmatic-guard`. Loaded means the session skill list from the
runtime. When that list includes `pragmatic-guard`, consult it, then follow
this skill. When it is absent, follow this skill's own steps; the reply and
the pull request body include `pragmatic-guard was not consulted`. A folder
on disk or a remembered name is not loaded. Name no install command for
`pragmatic-guard`. That run writes no deferral and no sentence that the
guard ran.
**Body template:** [pr-body-template.md](references/pr-body-template.md).
**Closure (last batch before merge):** [pre-merge-closure.md](references/pre-merge-closure.md).
**Host operations:** [host-operations.md](references/host-operations.md) — every host action this skill performs (push branch, open PR, read PR and diff) goes through that table.

## When not to use

- Local commit only, no remote pull request → `code-commit`.
- Leave findings or reply on review threads → `code-review`.
- Babysit checks and conflicts to a merge-ready state → `code-ci`.

## Hard gates

1. **Explicit ask** — run only when asked directly for a pull request; never
   as the automatic last step of another skill.
2. **Current state, not full scope** — open or amend for what the branch
   holds now. **Not a refusal:** a docs-only change, partial work, open plan
   units, or a skipped earlier step. Never refuse, never wait for more work
   to land first, and never implement missing work instead of opening the PR.
3. **Branch first** — on a detached checkout or the repository's default
   branch, create or check out a feature branch before doing anything else;
   never open a pull request from the default branch.
4. **Commit when needed** — commit uncommitted in-scope changes via
   `code-commit` before pushing; leave out unrelated dirty files and never
   stage a secret. A commit goes through `code-commit` when
   `code-commit/SKILL.md` is at `.agents/skills/code-commit/SKILL.md` or
   `.claude/skills/code-commit/SKILL.md` (either project load path). When
   that file is on neither path, stop, name `code-commit`, and do not run
   `git commit`. That check does not consult the session skill list.
5. **Push every run** — push branch (host operations) every time this skill
   runs, not only when the branch is new: a branch that already tracks a
   remote can still hold unpushed local commits.
6. **Find before open** — read PR and diff (host operations) to list open
   pull requests whose head is this branch; a named PR number or link
   overrides the search. Zero → create. One → amend it; never open a second.
   More than one → stop and ask.
7. **Title** — always Conventional Commits shape, `type(scope): summary`, on
   every host: a host that squash-merges takes the pull request title as the
   resulting commit's subject. Make no other assumption about how a host
   merges.
8. **Read before rewrite** — on amend, read the pull request's current
   title, body, and comments (read PR and diff) before replacing anything.
9. **Fill the template** — [pr-body-template.md](references/pr-body-template.md)
   in full; short Overview/What/Why/How describing the actual diff, no path
   dump.
10. **Checkbox reset** — write every template checkbox as `[ ]` first, then
    tick only what this session's evidence supports. Never copy ticks
    forward from a prior body. Pre-merge closure boxes stay unchecked
    unless closure already ran on this branch.
11. **Pre-merge closure is not a precondition** — it is not needed to
    **open** or **amend** a pull request; it is needed only to claim
    merge-ready or to tick a closure checkbox in the body.
12. **Real evidence** — Verification & Testing and the Checklist cite
    commands actually run this session on this diff; N/A, with a stated
    reason, is valid only for a docs-only change with no gate to run.
13. **Never merge** — no merge, no enabling auto-merge, no marking the pull
    request ready to merge, no reading merge settings, and no reply on
    review threads — that belongs to a review or check-babysitting skill.

## Workflow

1. **Snapshot** — resolve the base (the repository's default branch unless
   told to target another), then check status, diff, and this branch
   against it to know what the pull request will contain; set aside
   unrelated dirty files.
2. **Branch** — leave a detached checkout or the default branch per
   **Branch first**.
3. **Commit** — per **Commit when needed**; skip when the tree is already
   clean.
4. **Push** — per **Push every run**.
5. **Find** — per **Find before open**.
6. **Draft** — on amend, rewrite from the current title, body, and comments
   (**Read before rewrite**) plus the latest diff and this session's
   evidence; on create, draft straight from the template and the latest
   state. Fill per **Fill the template**, **Checkbox reset**, and **Real
   evidence**.
7. **Create or amend** — open PR (host operations): create a new pull
   request, or update title and body on the one found through the same
   operation's amend path. Print the PR found or created and the resolved
   base, and return the PR URL.
8. **Stop** — no review, no check-babysitting, no merge, no reply on
   review threads, and no pre-merge closure unless separately asked.

## EXAMPLE — filled verification (a feature PR, current state)

**Title:** `feat(auth): add passwordless email sign-in`

**Verification & Testing (filled — do not leave blank):**

```markdown
## Verification & Testing
- **Tests Run:** `npm run harness:validate`; the project's test command
  (e.g. `npm test`)
- **Test Coverage:** New sign-in flow covered by its own test file
- **How Verified:** `npm run harness:validate` → exit 0; the project's
  test suite → all green; manually exercised the sign-in link in a local
  build

## Checklist
- [x] Tests pass locally (`npm test`)
- [x] Documentation updated (README sign-in section)
- [x] No unrelated changes included
```

**Risk & Reviewer Notes:** Medium — touches the session-cookie path; low
risk everywhere else.

Ticked boxes in this example are **after** checkbox reset — start from
`[ ]`, then retick only from this session's evidence.

## Pragmatic-guard

Refuse auto-merge, inventing a body shape other than the template, opening a
pull request with no explicit ask, opening a second one when this head
already has an open pull request, a path dump in Overview/What/Why/How, an
empty Verification section when a gate actually ran, a merge-ready claim
while pre-merge closure boxes are unticked, and replying on review threads.

## Anti-patterns

- Refusing to open a PR, or implementing missing work, because an earlier step was skipped
- "Tests pass" with no command or session evidence named
- Copying checkbox ticks from a prior body instead of resetting them
