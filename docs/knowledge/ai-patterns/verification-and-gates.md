# Verification and gates

**Retrieval question:** What proof permits an agent to continue to the next
work unit or report a feature complete? Search this card for **Checkpoint**
as an alias for the verification pause before continuation.

## Source findings

The book’s verification loop treats a change as a hypothesis: run a check that
can expose failure, inspect the result, and correct the implementation before
claiming success. Its example finds old fixture assumptions alongside new
code defects. A green but irrelevant command does not establish that the
feature works. Useful feedback also depends on available test, linting,
type-checking, or end-to-end infrastructure, so conclusions are bounded by
what the project can observe.

The companion **Checkpoint** entry is an alias for this pause-and-inspect
idea, not a new authority or approval ceremony. Its page could not be
retrieved, so no narrower definition is attributed to it. Anthropic’s
first-party account describes premature completion and unverified features
as failure modes. End-to-end checks improved detection of bugs missed by code
inspection, while browser automation still had blind spots. Match proof to
the user-visible claim; these reports do not establish a universal test
recipe or replace repository gates.

## Harness assessment

Here, [code-spec](../../../.agents/skills/code-spec/SKILL.md) requires real acceptance and evaluation commands, grounds
proof pairs in existing surfaces, and names `harness:validate` as the
integrity gate. A failed wave gate stops before the next wave. [code-execute](../../../.agents/skills/code-execute/SKILL.md)
requires resume reconciliation before mutation, fresh command output and a
real diff before a completion claim, and passing `harness:validate` before
commit. Unit and wave handbacks run `wolven-harness comments` and
`wolven-harness validate`. Green results prove only what those commands
check; add focused or end-to-end checks when the claim goes further. A unit
test can prove a parser result while a rendering defect remains invisible.

The local gate answers whether work may proceed under the approved plan; it
does not itself approve a spec, authorize a PR, merge work, or establish
product acceptance. Preserve those boundaries and report missing evidence as
missing rather than creating a new sign-off step. For consequential claims,
reopen primary sources when the context changes or a source is unavailable.

**Tradeoff and counterexample:** Narrow deterministic checks are fast and
repeatable, but can miss integration failures; broad end-to-end checks expose
more behavior, but depend on reliable infrastructure and still have blind
spots. A passing unit suite is therefore insufficient proof for a claim that
the complete visible workflow works.

**Book:** [AI Pattern Book](https://aipatternbook.com/)
([Verification Loop](https://aipatternbook.com/verification-loop.md),
[Checkpoint](https://aipatternbook.com/checkpoint.md)).
**Primary sources:** [Anthropic, “Effective harnesses for long-running
agents”](https://www.anthropic.com/research/effective-harnesses-for-long-running-agents).
**Checked:** 2026-10-22. **Upstream dates:** Verification Loop created 2026-04-04 and updated 2026-06-14; Checkpoint date unknown;
Anthropic article published 2025-11-26. **Review state:** current, with the
Checkpoint page retrieval caveat above.
