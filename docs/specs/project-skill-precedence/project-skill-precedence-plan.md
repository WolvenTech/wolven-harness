---
type: spec
title: Project skill precedence over same-named user-level skills — plan
description: Two waves of work units for the standing rule and the clash warning, with the rule and its delivery first and the reporting half second.
status: draft
---

# Project skill precedence over same-named user-level skills — plan

## Structural gate

Every obligation in the locked spec already names a proof. Checked row by row:

- R1.1–R1.6 map to six named tests; R1.5 is already exercised by
  `test/harness-init-entry.test.ts`'s `step0-fixture` block, which extracts the
  Standing rules bullets from `templates/WOLVEN.md`, copies every path matched
  by `RULE_CITATION_RE` from `templates/`, and fails on `rule-missing`. No unit
  has to build that harness.
- R2.1–R2.8 and R5.1–R5.3 map to a new module plus its test suite; the counts
  and shapes are all observable from a fixture with an injected `HOME`.
- R3.1–R3.3 and R4.1–R4.4 map to command-level assertions on the two commands'
  streams and exit codes.
- R6.1 and R6.2 are inspections and file presence.
- R7.1–R7.3 map to the existing contract test, a fixture `setup` run, and a
  two-run comparison.

No obligation lacks a way to check it, and no unit is asked to invent
behaviour. Two notes for the builder, both from the spec's own text: the first
acceptance criterion is steered rather than enforced, so no unit may claim a
test proves which copy a runtime loads; and `rule-missing` is one-directional,
so R1.4 and R1.5 are tests, not validate findings.

## Work units

| # | Unit | Depends | Owns | Subagent | Done when |
|---|------|---------|------|----------|-----------|
| 01 | Ship the rule and its router citation | — | `templates/.agents/rules/project-skill-precedence.md` (new), `templates/WOLVEN.md`, `test/project-skill-precedence-rule.test.ts` (new), `test/setup-surfaces.test.ts`, `test/setup-skill-sets.test.ts` | inline | [x] The rule file exists with the shipped-rule frontmatter keys, states the base-directory check, the re-read of the project copy, Claude Code's documented personal-over-project order with the `skillOverrides` `"off"` remedy, and that the project copy is authoritative when the loaded copy is not the project's; `templates/WOLVEN.md` cites it with the imperative inside the bullet; `pnpm test` passes with `setup-surfaces`' expected path list and `setup-skill-sets`' rule count updated — `proof-project-skill-precedence-rule-file`, `proof-project-skill-precedence-rule-imperative`, `proof-project-skill-precedence-router`, `proof-project-skill-precedence-rule-remedy` |
| 02 | Install the rule in this repo and cite it | 01 | `.agents/rules/project-skill-precedence.md` (new), `AGENTS.md`, `test/claims.test.ts` | inline | [x] `.agents/rules/project-skill-precedence.md` is byte-identical to the template; `AGENTS.md`'s Standing rules list cites it with the same imperative as the template bullet; `test/claims.test.ts`'s self-claim fixture carries the file; `node dist/cli.js validate` exits 0 with the citation resolved — `proof-project-skill-precedence-self-install`, `proof-project-skill-precedence-claim-fixture`, `proof-project-skill-precedence-harness-init-fold` |
| 03 | Record the deferrals this initiative creates | — | `docs/deferrals/skill-self-identification/`, `docs/deferrals/skill-clash-standing-check/`, `docs/deferrals/skill-clash-symlink-repair/` (all new) | inline | [x] Three deferral files exist under `docs/deferrals/<slug>/<slug>-deferral.md` with `type: deferral` frontmatter and observable `- [ ]` triggers each, and no shipped `SKILL.md` was edited — `proof-project-skill-precedence-deferrals`, `proof-project-skill-precedence-no-skill-edits` |
| 04 | Wave 1 gate | 01, 02, 03 | — (no feature diff) | inline | [x] `pnpm test` (702 pass), `pnpm lint`, `pnpm build`, `pnpm validate` and `pnpm comments` all pass on the three units above — abort before wave 2 |
| 05 | Build the clash scan and its warning text | 04 | `src/skills/clash.ts` (new), `test/skills-clash.test.ts` (new) | inline | [x] `scanSkillClashes({ root, home })` returns clashes sorted by skill then user root, and the suite proves: a wired `.claude/skills` symlink yields one project entry per skill; all four user roots are read; a user entry without a readable `SKILL.md` (including `synced/`) never fires; a same-file pair and a byte-identical copy stay silent; a dangling symlink and an unreadable directory contribute nothing and never throw; the message names the skill, both paths and Claude Code's order, and contains no deletion command — `proof-project-skill-precedence-project-roots`, `proof-project-skill-precedence-user-roots`, `proof-project-skill-precedence-user-entry-guard`, `proof-project-skill-precedence-identity-suppression`, `proof-project-skill-precedence-identical-silent`, `proof-project-skill-precedence-scan-safety`, `proof-project-skill-precedence-scan-order`, `proof-project-skill-precedence-clash-shape`, `proof-project-skill-precedence-single-source`, `proof-project-skill-precedence-no-deps` |
| 06 | Warn from `setup` | 05 | `src/setup/index.ts`, `test/setup-clash.test.ts` (new) | inline | [x] A `setup` run over a fixture whose injected `HOME` carries divergent twins prints one `ui.warn` note per clash after the summary, naming each skill and both paths and stating the snapshot limit; a fixture without twins prints no clash text; an unreadable home still exits 0 with no note and no write under the project root — `proof-project-skill-precedence-setup-warning`, `proof-project-skill-precedence-setup-silent`, `proof-project-skill-precedence-setup-inert` |
| 07 | Warn from `skills` and name the roots in help | 05 | `src/skills/index.ts`, `src/skills/parse.ts`, `test/skills-clash.test.ts`, `test/skills-command.test.ts` | inline | [x] `skills --scope project` in a repo with a user-level twin warns on stderr while stdout stays empty and the exit code stays 0; a `--scope global` run warns about the clash it just created and goes quiet once the twin is removed; `skills --help` still writes only to stdout, exits 0, and names all four user directories — `proof-project-skill-precedence-skills-scope-independent`, `proof-project-skill-precedence-skills-stream`, `proof-project-skill-precedence-skills-after-copy`, `proof-project-skill-precedence-skills-help` |
| 08 | Wave 2 gate and live-instance check | 06, 07 | — (no feature diff) | inline | [x] `pnpm test`, `pnpm lint`, `pnpm build`, `pnpm validate`, `pnpm comments` and `pnpm score` all pass; the fixture `setup` run reports the divergent `grilling`, `handoff` and `prototype` clashes; a second identical run reports the same lines with an unchanged tree; `test/contract.test.ts` still pins the same finding codes and exit codes; every `proof-project-skill-precedence-*` name in the spec appears in this plan and every acceptance box cites an `R` row — `proof-project-skill-precedence-live-clashes`, `proof-project-skill-precedence-idempotent`, `proof-project-skill-precedence-contract` |

## Wave stops

| Stop | After | Gate |
|------|-------|------|
| **1** | 04 | `pnpm test`, `pnpm lint`, `pnpm build`, `pnpm validate`, `pnpm comments` pass; the rule is cited by both routers and installed in this repo — abort before wave 2 on failure |
| **2** | 08 | All six gates including `pnpm score` pass; the four live clash shapes behave as specified — abort before handoff on failure |
| **Ship** | 08 | Everything above, plus the Human runtime observation the spec's Eval table names: fold the rule, keep a divergent twin, invoke the skill, record the base directory. Its result goes in the PR body, including a failure |

## Unresolved

The Human ruled all five rows before the spec was frozen; nothing is open.

| Identifier | Decision needed | Owner | Blocking effect | Disposition | Unit |
|---|---|---|---|---|---|
| `U-1` | How much the warning says about the remedy | Human | Non-blocking | Resolved: paths plus Claude Code's documented order; remedies live in the rule | 05, 07 |
| `U-2` | Which user roots the scan reads | Human | Non-blocking | Resolved: all four, unconditionally | 05 |
| `U-3` | Whether to add a `--quiet` flag | Human | Non-blocking | Refused: no present need | — |
| `U-4` | How the new tests isolate the home directory | Human | Non-blocking | Resolved: new clash tests inject `HOME`; existing tests keep their environment | 05, 06, 07, 08 |
| `U-5` | Whether to repair a user-level symlink into a project tree | Human | Non-blocking | Deferred with a trigger | 03 |

## Frontier order

Units 01 and 03 are unblocked and disjoint — 01 owns the template tree and
`test/setup-surfaces.test.ts`, 03 owns `docs/deferrals/` — so they can run in
parallel. Unit 02 waits for 01, because it copies the rule file byte for byte.
Unit 04 gates the wave and must run alone.

In wave 2 the frontier is open at unit 05 only: units 06 and 07 both consume
the module it publishes, so running either first would mean writing the scan
twice. Once 05 lands, 06 and 07 own disjoint files and can run in parallel,
and 08 waits for both.

Every unit is `inline` in this plan. The units share the vendored `biome`
formatting, the same comment rules, and — in wave 2 — the same message string
across test expectations and the module that produces it, so handing one to an
isolated subagent would reintroduce exactly the drift the single-source
requirement exists to prevent. Unit 08 is a gate and is inline by the skill's
own rule.
