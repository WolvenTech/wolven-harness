# Pull request body template

Normative body for `code-pr`; its hard gates govern the title, the lean
fill, and the evidence. Fill each line you keep, and drop a line that has
nothing for this diff — an empty placeholder is not a valid fill.

**Checkbox reset:** write every Before merge checkbox as `[ ]` first, then
tick only those this session's evidence supports. Never copy ticks forward
from a prior body. The Pre-merge closure box stays unchecked unless closure
already ran on this branch.

Keep each What, Why and How bullet at most 140 characters — one line in the
body, no path dump. Verification holds one to three command bullets.

```markdown
## Summary
**What:** <what changed, one line of at most 140 characters>
**Why:** <why it exists, one line of at most 140 characters>
**How:** <how it works, one line of at most 140 characters>
**Task:** <spec, plan, or ticket reference — only when one exists; drop the line otherwise>

## Verification
- `<command actually run>` — <the result it showed>
- `<command actually run>` — <the result it showed>
- `<command actually run>` — <the result it showed>
**Risk:** <Medium or High with the sensitive area a reviewer should watch — only at Medium or High; drop the line otherwise>

## Before merge
- [ ] Manual test — <what you exercised and what you saw>
- [ ] CI green
- [ ] Pre-merge closure — only when the diff adds or changes files under `docs/specs`, `docs/prds` or `docs/adrs`; steps: [pre-merge-closure.md](pre-merge-closure.md)
```

## Scenario examples (approved shape)

### Skills or routing change

**Title:** `feat(skills): add a pull-request skill`

Summary states the outcome once each; Verification names the gate commands
actually run; Risk is often Medium when a load-path or routing surface
changes; Pre-merge closure appears when the diff changes `docs/specs`,
`docs/prds` or `docs/adrs`.

### Small, scoped fix

**Title:** `fix(validate): reject an empty description on a draft`

Tight What/Why/How; Verification names the gate plus its fixture; Risk is
left out at Low.

### Docs-only change, mid-initiative

**Title:** `docs(specs): record an intake step`

Task points at the relevant spec or plan path. Verification is `N/A` with a
stated reason when no gate ran for a docs-only change, and any gate that ran
is named with its command. Before merge boxes stay **unchecked** —
implementation hasn't shipped yet — and Pre-merge closure appears when the
diff adds or changes files under `docs/specs`, `docs/prds` or `docs/adrs`.
