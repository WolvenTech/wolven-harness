# Review criteria (code-review)

Generic axes and severity rules for a grounded review. Judge the diff
against what the PR's cited refs promise — never against personal taste or
scope the refs never promised.

## Citation rule

A finding is posted only when it names a file:line in the diff and either:

- quotes or points at the diff line the problem is in, and/or
- names the ref (spec, plan, PRD, or ADR) whose obligation it violates.

No cited diff line and no cited ref → the finding is dropped, not posted.

## Axes

| Axis | Question |
|---|---|
| **Correctness** | Does the changed code do what it claims, including edge cases? |
| **Obligations vs. the spec's proofs** | Does the diff satisfy the obligations the cited spec names, and its named proofs? |
| **Tests for changed behavior** | Does a changed or new behavior have a test that would fail without the fix? |
| **Secrets** | Any credential, token, or private key added to the diff? |
| **Doc-folder layout** | Any doc path the diff adds or touches (a spec, plan, PRD, note, or deferral) follows the slug-folder layout; an ADR stays flat at `docs/adrs/adr-NNN-<slug>.md` |
| **ADR claims** | Any `ADR-NNN` / `adr-NNN-<slug>` token the diff adds resolves — checked by `harness:validate`, not by eye |

## Severity

| Label | Meaning | Effect |
|---|---|---|
| **Blocking** | Breaks a cited obligation, lacks a test for changed behavior, adds a secret, or has a correctness or security problem | Must be addressed before merge |
| **Nit** | Style, naming, or an optional simplification | Merge is fine without it |

Prefer few, high-signal blocking findings over a pile of nits. A
formatting-only diff never gets a blocking finding.

## Verdict

| Verdict | When |
|---|---|
| **Approve with nits** | Every cited obligation is met; only nits remain |
| **Request changes** | At least one blocking finding |
| **Needs the Human** | Security, a data-loss risk, or a conflict between two cited refs — outside this skill's judgment |

The verdict is advice. This skill never merges, approves-and-merges, or
enables auto-merge regardless of the verdict.
