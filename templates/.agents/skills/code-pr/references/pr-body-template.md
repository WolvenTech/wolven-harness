# Pull request body template

This is the normative body for `code-pr`, whose hard gates govern the title,
the lean fill and the evidence. Fill each line you keep, and drop a line that
has nothing for this diff, because an empty placeholder is not a valid fill.

**Checkbox reset:** write every Before merge checkbox as `[ ]` first, then
tick only those this session's evidence supports. Never copy ticks forward
from a prior body. The Pre-merge closure box stays unchecked unless closure
already ran on this branch.

Keep each What, Why and How bullet to one line of at most 140 characters,
with no path dump. Verification holds one to three command bullets. Link relevant
PRD, spec, plan or ticket references in Task so they resolve for a reviewer
from the PR; link repository artifacts at a revision where they exist. Put a
recorded decision that explains the diff in Why or How. When no decision is
recorded, ground those fields in the diff. Omit Task when no relevant
reference exists.

Separate headings from content with blank lines and make each Summary field a
separate paragraph. Before merge is the final section: put CI and conditional
closure before the Manual test subsection, with one checkbox per PR-specific
manual scenario. Reset and tick each scenario only from this session’s evidence.

```markdown
## Summary

**What:** <what changed, one line of at most 140 characters>

**Why:** <why it exists, one line of at most 140 characters>

**How:** <how it works, one line of at most 140 characters>

**Task:** <PRD, spec, plan, or ticket link — only when one exists; drop the line otherwise>

## Verification

- `<command actually run>` — <the result it showed>
- `<command actually run>` — <the result it showed>
- `<command actually run>` — <the result it showed>

**Risk:** <Medium or High with the sensitive area a reviewer should watch — only at Medium or High; drop the line otherwise>

## Before merge

- [ ] CI green
- [ ] Pre-merge closure — only when the diff adds or changes files under `docs/specs`, `docs/prds` or `docs/adrs`; steps: [pre-merge-closure.md](pre-merge-closure.md)

### Manual test

- [ ] <PR-specific scenario and observed result>
- [ ] <another PR-specific scenario and observed result, when applicable>
```

## Scenario examples (approved shape)

### Skills or routing change

**Title:** `feat(skills): add a pull-request skill`

Summary states the outcome once. Verification names the gate commands
actually run. Risk is often Medium when a load-path or routing surface
changes. Pre-merge closure appears when the diff changes `docs/specs`,
`docs/prds` or `docs/adrs`.

### Small, scoped fix

**Title:** `fix(validate): reject an empty description on a draft`

Keep What, Why and How tight. Verification names the gate plus its fixture,
and Risk is left out at Low.

### Docs-only change, mid-initiative

**Title:** `docs(specs): record an intake step`

In Task, link the relevant spec or plan at a revision where it exists.
Verification is `N/A` with a stated reason when no gate ran for a docs-only
change, and any gate that ran
is named with its command. The Before merge boxes stay **unchecked**
because implementation has not shipped yet. Pre-merge closure appears when
the diff adds or changes files under `docs/specs`, `docs/prds` or
`docs/adrs`.
