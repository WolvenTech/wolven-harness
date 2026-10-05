# Pre-merge closure

The closing step before a human merges a repo-initiative pull request.
Referenced by `code-pr`'s body template, a merge-ready claim from `code-ci`,
and `code-review`'s coverage of the same contract. **Never merge** from any
skill — a human merges manually.

## When

Run once every wave has passed and the pull request is otherwise
merge-ready — conflicts resolved, review triaged, checks green or absent.
This is the **last mutate batch** on the branch before merge, never a step
taken mid-initiative or per unit.

**An open pull request is not yet merge-ready.** `code-pr` may open or amend
a pull request with ceremony docs only, partial work, or a finished
implementation — any of those is valid to open or amend. Closure runs
later, in its own commit, before anyone claims merge-ready.

Skip this entirely when the pull request has no initiative spec or PRD
behind it (a small, self-contained fix).

## What to close

| Artifact | Action |
|----------|--------|
| Spec and plan folder | `docs/specs/<slug>/` (spec + plan) → `docs/specs/archived/<slug>/`; both files `status: deprecated` |
| Initiative PRD folder | `docs/prds/<slug>/` → `docs/prds/archived/<slug>/`; every file `status: deprecated` |
| New or amended ADRs | Promote to `status: stable` (through the `adr` skill) |

## What stays active

- Shipped skills, agents, and any other harness surface the initiative
  touched — those stay `status: stable` where that applies
- Historical notes and evidence — not process artifacts to archive
- Anything the initiative deliberately left open, unless told to close it
- ADRs stay where they live — never moved; a later decision supersedes one
  in place, it doesn't relocate it

## Steps

1. Move the spec-and-plan folder, and the PRD folder, each whole, into
   their matching `archived/` tree.
2. Set `status: deprecated` on every file moved in step 1; fix any internal
   path reference the move breaks.
3. When ADRs are to be promoted and `adr` is absent from the session skill
   list, ADR status stays as it is and closure does not claim merge-ready.
   When `adr` is on the session skill list, promote new or amended ADRs
   from this initiative to `status: stable` through the `adr` skill.
4. When `harness:validate` cannot be run, stop that step, name `setup`, and
   do not claim the command passed or that the pull request is merge-ready.
   Otherwise run `harness:validate` — it must pass. Validation skips
   `archived/` content itself, but claims made against an ADR are
   unaffected by where the spec or PRD that raised them now lives; keep
   the moved files' frontmatter valid.
5. When `code-commit` is absent from the session skill list and the next
   step is a commit, stop, name `code-commit`, and do not run `git commit`.
   When `code-commit` is on the session skill list, commit the moves via
   `code-commit`, then push branch (see
   [host operations](host-operations.md)).
6. A review that says the ADR-claims axis was not checked is not a passed
   axis and is not merge-ready. Only after this block is complete may the
   pull request's pre-merge closure checkboxes be ticked, and only then may
   a merge-ready claim be made for a repo initiative.

## Anti-patterns

- Leaving the spec, plan, or PRD at an active status after the branch
  ships
- An ADR still `draft` while the decision it records is already live
- Ticking pre-merge closure boxes before the moves and the validate run
  actually happened
- Archiving a shipped skill, agent, or historical note as if it were a
  spec or PRD
- Running closure mid-initiative, before every wave has passed
