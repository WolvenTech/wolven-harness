# Entry Modes

Step 0 folds `WOLVEN.md` into `AGENTS.md` in one of three modes — full,
light, or mention-only — and runs four checks alongside whichever mode the
Human picks. `WOLVEN.md`'s own first line names this step; every mode drops
that line from whatever it carries forward.

## Full

The `WOLVEN.md` body, without its first line, goes into `AGENTS.md` as a
new `## Wolven harness` section, added after whatever `AGENTS.md` already
holds.

**No-`AGENTS.md` case:** when the repo has no `AGENTS.md` yet, `WOLVEN.md`
(without its first line) becomes `AGENTS.md` outright — there is no
existing content to fold into, so nothing is appended.

`WOLVEN.md` is deleted once the fold lands.

## Light

`AGENTS.md` gets a short `## Wolven harness` block, appended after whatever
it already holds. The block says where skills and rules live, cites the
three standing rules, restates the architecture-claims rule, points at QMD
before memory or the web, and names the validate command. It carries no
router table and no skills table — those stay in `WOLVEN.md`'s full text,
which this mode does not reuse.

Hold this block verbatim when writing it into `AGENTS.md`:

```markdown
## Wolven harness

Skills live under `.agents/skills/` (one folder per skill, each with a
`SKILL.md`); standing rules live under `.agents/rules/` and load
unconditionally:

- `.agents/rules/qmd-first.md` — QMD before web, ADRs first
- `.agents/rules/yagni-strict.md` — strict YAGNI; deferrals under `docs/deferrals/` only
- `.agents/rules/comments.md` — comment style for added lines; run `harness:comments` before handing work back

Referencing an ADR as `ADR-NNN` or `adr-NNN-<slug>` anywhere in a tracked
file is a claim: it must resolve to exactly one `stable` profile ADR under
`docs/adrs/`, or the claim fails.

Search this repo's knowledge with `qmd query` before answering from memory
or the web — ADRs first, then widen.

Run `harness:validate` after any change to `.agents/**` or `docs/**`.
```

`WOLVEN.md` is deleted once the block lands.

## Mention-only

`AGENTS.md` gets one line pointing at `WOLVEN.md`, appended after whatever
it already holds.

Hold this line verbatim when writing it into `AGENTS.md`:

```markdown
This repo's Wolven harness router, with its skills table and full layout, lives in WOLVEN.md.
```

`WOLVEN.md` stays in the repo, without its first line — this is the one
mode that keeps it.

## Deletion rule

`WOLVEN.md` is deleted in full and light — both fold its content elsewhere,
so nothing is left for it to hold. It is kept, minus its first line, in
mention-only — the line in `AGENTS.md` only points at it, so the file it
points to has to remain.

## Recommending a mode

The agent reads what `AGENTS.md` already holds and recommends one mode
first, but the Human always picks:

- No `AGENTS.md`, or a short one → recommend full.
- A long, curated `AGENTS.md` → recommend light, so the fold doesn't bury
  the Human's own material under the router and the skills table.
- Anything in between is a question to the Human, the recommended option
  listed first, same as any other ambiguity this skill meets.

## Before writing

Alongside picking a mode, step 0 runs four checks. Each one is a question
to the Human when it finds something — never a silent write.

1. **Existing content stays put.** Whatever `AGENTS.md` already holds is
   never removed or rewritten without the Human's OK. Every mode above only
   appends.
2. **Overlaps are questions, one at a time.** A second router, or a rule in
   `AGENTS.md` that clashes with a standing rule under `.agents/rules/`, is
   never merged or dropped on the agent's own judgment — each overlap
   becomes its own question to the Human, one at a time.
3. **`CLAUDE.md` import offer.** When a `CLAUDE.md` exists and does not
   import `AGENTS.md`, the agent offers to add an `@AGENTS.md` line to it.
   The Human's no leaves `CLAUDE.md` untouched.
4. **`git check-ignore` on harness paths.** Run `git check-ignore` (for
   example `git check-ignore -v`) against `.agents/`, `docs/`, and the
   wired runtime paths (for example `.claude/skills` and `CLAUDE.md` for
   the claude runtime). A harness path caught by `.gitignore` is reported
   together with the matching `.gitignore` line the check printed, and the
   Human decides whether to keep or drop the ignore.
