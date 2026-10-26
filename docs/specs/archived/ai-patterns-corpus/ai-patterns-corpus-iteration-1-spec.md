---
type: spec
title: AI patterns pilot — iteration 1 review fixes
description: Delta obligations from the PR 78 review — ask-only consultation, one card frontmatter shape, the qmd skill restored to its template, and retrievable pilot evidence.
status: deprecated
---

# AI patterns pilot — iteration 1 review fixes

**Source:** the [PR 78 review](https://github.com/WolvenTech/wolven-harness/pull/78#pullrequestreview-5654536097)
of `2a36417`: three blocking findings and four nits. Also two Human
decisions made on 2026-10-26 while drafting this spec: "Remove routing"
for the QMD routing finding, and `status: draft` for the knowledge cards.
**Base:** [ai-patterns-corpus-spec.md](./ai-patterns-corpus-spec.md) and its
[plan](./ai-patterns-corpus-plan.md) and [pilot record](./ai-patterns-corpus-pilot.md),
at these paths once I7 moves them out of `archived/`. Base obligations
R1–R12 still hold unless this spec changes them. This spec retires R13.
**Approval:** Human approved this spec on 2026-10-26.
**Next:** `code-plan` writes
`ai-patterns-corpus-iteration-1-plan.md` beside this spec → `code-execute`.
**Named proof (this spec's own structural gate):** `proof-ai-patterns-iter1-spec-obligations`

## Term challenge

| Term | Meaning here | Grounding |
| --- | --- | --- |
| OKF compliance | The writing profile's four rules (frontmatter, status vocabulary, type, filename), applied to knowledge cards with `type: knowledge`. Card-specific metadata goes in separate keys. Not a full OKF profile port. | The PR 78 review asked for "OKF-compliant" cards. The archived harness PRD calls this repo's profile a "shallow OKF-derived writing template/profile". `docs/WRITING-PROFILE.md` is that profile. |
| Review state | Freshness of a card's sources: `current`, `needs-review`, or `retired`. Separate from `status`. | Base R2 and R10 vocabulary |
| Ask-only | Runs only on a direct Human ask: `disable-model-invocation: true` plus `agents/openai.yaml` `allow_implicit_invocation: false` | `.agents/skills/handoff/SKILL.md` hard gate 1 |
| Stage routing | The per-stage collection table PR 78 added to `qmd/SKILL.md` under base R13 | Base spec "Routing across harness operations" |

QMD returned no hit for `OKF`. `git grep` found the term only in the
archived harness PRD and idea files cited above.

## Repository grounding

All paths below are on `codex/ai-patterns-corpus` at `2a36417`.

| Surface | Present today | Role for this iteration |
| --- | --- | --- |
| `.agents/skills/ai-patterns/SKILL.md` | yes, can load without being asked | Becomes ask-only; carries the opt-in note and pilot verdict |
| `.agents/skills/ai-patterns/agents/openai.yaml` | no | Created with the same shape as `.agents/skills/handoff/agents/openai.yaml` |
| `docs/knowledge/ai-patterns/*.md` (seven cards) | yes, four different frontmatter shapes | Normalized to one shape |
| `.agents/skills/qmd/SKILL.md` | yes, 1,485 words, differs from template | Restored to match `templates/.agents/skills/qmd/` byte for byte |
| `.agents/rules/qmd-first.md` | yes, identical to `templates/.agents/rules/qmd-first.md` | Unchanged; must stay identical |
| `test/skill-copies.test.ts` | yes, exempts `qmd` via `LOCAL_CUSTOMIZED_SKILLS` | The exemption is removed |
| `docs/specs/archived/ai-patterns-corpus/{spec,plan,pilot}.md` | yes, archived | Moved to `docs/specs/ai-patterns-corpus/` |
| `.qmd/index.yml` `knowledge` collection | yes, `includeByDefault: false`, advisory context | Unchanged; its context stays the record that `knowledge` is opt-in |
| `docs/notes/ai-patterns-corpus/ai-patterns-corpus-note.md` | yes | Unchanged except links that I7 breaks |
| `docs/WRITING-PROFILE.md`, `src/validate/` | yes; validate does not cover `docs/knowledge/` | Unchanged; whether validate should cover `docs/knowledge/` stays an Unresolved row |

## Surface walk

- **In scope:** `.agents/skills/ai-patterns/**`;
  `docs/knowledge/ai-patterns/*.md`; `.agents/skills/qmd/**`, restored only;
  `test/skill-copies.test.ts`, the exemption removed only; the move of the
  initiative folder from `docs/specs/archived/ai-patterns-corpus/` to
  `docs/specs/ai-patterns-corpus/`, with its relative links; relative links
  that point into the moved folder from the cards and from
  `docs/notes/ai-patterns-corpus/`.
- **Out of mutate scope (unchanged):** `.agents/rules/**`; `templates/**`;
  `src/**`; `renderer/**`; `AGENTS.md`; `.qmd/index.yml`; `package.json`;
  `pnpm-lock.yaml`; `.github/**`; `docs/adrs/**`;
  `docs/WRITING-PROFILE.md`; every other skill; and the base spec, plan and
  pilot record, whose content may change only in relative links and the
  base spec's structural-check path (I7, I8). Any `n/a` below cites these
  surfaces.

This iteration is one mutate batch, so there is no Waves section.

## Requirements (obligation ↔ proof)

### Consultation is ask-only

| ID | Obligation | Named proof | Evidence shape |
| --- | --- | --- | --- |
| I1 | `ai-patterns` runs only on an explicit Human ask. `SKILL.md` frontmatter has `disable-model-invocation: true`. `agents/openai.yaml` sets `policy.allow_implicit_invocation: false`. The `description` states the skill is ask-only and lists no topics that trigger it automatically. This replaces base R7's automatic trigger ("or a concrete harness-workflow design/failure question"). The rest of R7 is unchanged. | `proof-ai-patterns-iter1-ask-only` | `rg -n '^disable-model-invocation: true$' .agents/skills/ai-patterns/SKILL.md`; parse `agents/openai.yaml` and assert the policy is `false`; read the `description` |
| I5 | `ai-patterns/SKILL.md` states that `knowledge` is excluded from default searches and needs `-c knowledge`. It links to `qmd` for search mechanics only, not for collection routing. It carries the R11 verdict, "revise before permanent adoption", with a link to the pilot record. | `proof-ai-patterns-iter1-skill-text` | `rg` for `-c knowledge`, `revise before permanent adoption`, and `ai-patterns-corpus-pilot.md` in the skill; read the `qmd` link sentence |

### One card shape

| ID | Obligation | Named proof | Evidence shape |
| --- | --- | --- | --- |
| I2 | Every card's frontmatter has exactly these keys: `type: knowledge`, `title`, `description`, `status: draft`, `aliases` (a list, possibly empty), `review` (`current`, `needs-review` or `retired`), `checked` (`YYYY-MM-DD`), and `upstream` (a non-empty string, which may say `unknown`). The body has no second review-state value (`**Review state:**` or `**Review:**`). A body caveat about review state moves into the card's evidence-limits text. A card whose own text says a source needs review uses `review: needs-review`. | `proof-ai-patterns-iter1-card-shape` | Card-shape command under Eval / gates exits 0 and prints PASS for all seven cards |
| I6 | No card contains ingestion or process data: no `Ingestion provenance`, `gpt-6-luna`, `reasoning_effort` or `fork_turns`. The pilot record's R3 table still records that provenance. | `proof-ai-patterns-iter1-no-process-data` | `rg -n 'Ingestion provenance\|gpt-6-luna\|reasoning_effort\|fork_turns' docs/knowledge` returns nothing; `rg -n 'context-selection' docs/specs/ai-patterns-corpus/ai-patterns-corpus-pilot.md` shows the R3 row |

### QMD back to its template

| ID | Obligation | Named proof | Evidence shape |
| --- | --- | --- | --- |
| I3 | `.agents/skills/qmd/` matches `templates/.agents/skills/qmd/` byte for byte, and `.agents/rules/qmd-first.md` matches its template. The stage routing table, the directory-coverage section and the knowledge-specific refresh text leave `qmd/SKILL.md`. Base R13 is retired: no stage routing contract exists in this repo. | `proof-ai-patterns-iter1-qmd-template` | `diff -r templates/.agents/skills/qmd .agents/skills/qmd` and `diff templates/.agents/rules/qmd-first.md .agents/rules/qmd-first.md` both exit 0 |
| I4 | `test/skill-copies.test.ts` compares every shared skill, `qmd` included. `LOCAL_CUSTOMIZED_SKILLS` is gone, and the filter matches `main` again. | `proof-ai-patterns-iter1-copy-test` | `rg -n LOCAL_CUSTOMIZED_SKILLS test` returns nothing; `pnpm exec tsx --test test/skill-copies.test.ts` passes |

### Pilot evidence stays retrievable

| ID | Obligation | Named proof | Evidence shape |
| --- | --- | --- | --- |
| I7 | The base spec, plan and pilot record move from `docs/specs/archived/ai-patterns-corpus/` to `docs/specs/ai-patterns-corpus/`, beside this spec. Their content does not change except relative links (I8) and the base spec's structural-check path. After one `qmd update`, the `specs` collection lists the pilot record. | `proof-ai-patterns-iter1-relocation` | `git diff -M --stat` shows three renames; `git diff -M` shows only link and path lines changed; `qmd ls specs \| rg ai-patterns-corpus-pilot` returns a hit |
| I8 | Every relative Markdown link in the moved files, this spec, the seven cards, `ai-patterns/SKILL.md` and `docs/notes/ai-patterns-corpus/ai-patterns-corpus-note.md` resolves to an existing file. No link points into `docs/specs/archived/ai-patterns-corpus/`. | `proof-ai-patterns-iter1-links` | Link command under Eval / gates exits 0 |

## Nine-dimension landings

| Dimension | Landing kind | Landing |
| --- | --- | --- |
| validation | obligation ↔ proof | I2 / `proof-ai-patterns-iter1-card-shape`; I8 / `proof-ai-patterns-iter1-links` |
| failure modes | obligation ↔ proof | I4 / `proof-ai-patterns-iter1-copy-test`: drift between the local and shipped `qmd` fails the suite again instead of being exempted |
| idempotency and retry | n/a | Refresh and ingestion behaviour is unchanged: `.qmd/index.yml` and the base R4/R6 single-writer refresh rule in `ai-patterns/SKILL.md` "Failure and maintenance" are out of mutate scope |
| authorization | obligation ↔ proof | I1 / `proof-ai-patterns-iter1-ask-only` |
| concurrency and ordering | obligation ↔ proof | I7 / `proof-ai-patterns-iter1-relocation` lands first. Until the base spec sits beside this file, `validate` fails with `profile-missing-main-doc` for `docs/specs/ai-patterns-corpus`, so no other unit can pass its gate. No parallel writer is added; base R3/R4 are unchanged. |
| data lifecycle | obligation ↔ proof | I7 / `proof-ai-patterns-iter1-relocation`: the initiative leaves `archived/` while an iteration is open |
| external-dependency failure | n/a | No upstream source is reopened in this iteration; base R9 and the cards' cited URLs are unchanged |
| state transitions | obligation ↔ proof | I2 / `proof-ai-patterns-iter1-card-shape`: `status` (`draft`) and `review` (`current` / `needs-review` / `retired`) are separate fields |
| observability | obligation ↔ proof | I5 / `proof-ai-patterns-iter1-skill-text` and I6 / `proof-ai-patterns-iter1-no-process-data`: the verdict is visible where consultation starts, and cards carry no process noise |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition |
| --- | --- | --- | --- | --- |
| `U-ai-patterns-routing-home` | Where repo-specific stage routing lives | Human | Blocked I3 | Settled 2026-10-26: remove it; `qmd` returns to its template and R13 is retired |
| `U-ai-patterns-card-status` | Card `status` value | Human | Blocked I2 | Settled 2026-10-26: `draft` until `U-ai-patterns-permanence` is decided |
| `U-ai-patterns-knowledge-check` | Should `validate` (or a test) enforce the card shape permanently, instead of I2's one-off command? | Human | Non-blocking; I2's command proves this iteration | |
| `U-ai-patterns-base-status` | The moved base spec and plan carry `status: deprecated` in an active folder | Human | Non-blocking; frontmatter is unchanged by I7 | |
| `U-ai-patterns-permanence` | Retain, revise or remove the pilot (carried from the base spec) | Human | Blocks `status: stable` on cards and any distribution | |

## Out of scope

- Thin stage references in the 13 chain skills. They are retired with R13
  and were already dropped by the 2026-10-26 distribution decision.
- New cards, re-ingestion, source rechecks, or a rerun of the R11 pilot.
- A behavioural eval suite for skills. That needs its own spec.
- Any change to shipped templates, `src/`, or the writing profile.
- The PR body's stale "Stack: #75 → #76" line (see Cross-domain leaks).

## Pragmatic-guard refuses

- A new local routing rule. The Human chose removal over relocation.
- A `knowledge` validator or profile type in this iteration. The base spec
  ruled it out, and `U-ai-patterns-knowledge-check` keeps the question open.
- Rewriting card bodies beyond the review-state and provenance lines that
  I2 and I6 name.

## Acceptance

### Wave 1

- [ ] I1 / `proof-ai-patterns-iter1-ask-only` PASS — frontmatter, Codex policy and description are ask-only.
- [ ] I5 / `proof-ai-patterns-iter1-skill-text` PASS — opt-in note, `qmd` link scope and pilot verdict present.
- [ ] I2 / `proof-ai-patterns-iter1-card-shape` PASS — seven cards, one frontmatter shape, no duplicate review state.
- [ ] I6 / `proof-ai-patterns-iter1-no-process-data` PASS — no ingestion provenance in cards.
- [ ] I3 / `proof-ai-patterns-iter1-qmd-template` PASS — `qmd` and `qmd-first` identical to templates.
- [ ] I4 / `proof-ai-patterns-iter1-copy-test` PASS — copy test covers `qmd` again.
- [ ] I7 / `proof-ai-patterns-iter1-relocation` PASS — three renames; pilot record listed in `specs`.
- [ ] I8 / `proof-ai-patterns-iter1-links` PASS — every relative link resolves.

## Eval / gates

| Gate | Command / check | When | PASS | Abort |
| --- | --- | --- | --- | --- |
| Spec obligations | `proof-ai-patterns-iter1-spec-obligations`: structural command below | Before `code-plan` | Prints PASS | Do not plan |
| Card shape | Card-shape command below | Wave 1 | Prints PASS | Fix cards |
| Links | Link command below | Wave 1 | Prints PASS | Fix links |
| Template parity | `diff -r templates/.agents/skills/qmd .agents/skills/qmd`; `diff templates/.agents/rules/qmd-first.md .agents/rules/qmd-first.md` | Wave 1 | Both exit 0 | Restore files |
| Suite | `pnpm test` | Wave 1 | Exit 0, `skill-copies` included | Fix; never re-exempt |
| Refresh | `qmd update`, then `qmd ls specs \| rg ai-patterns-corpus-pilot` | Wave 1, after I7 | Hit returned | Report the QMD error before fallback |
| Integrity | `pnpm build && pnpm validate` | Wave 1 | Exit 0 | Fix; do not proceed |
| Comments, lint, whitespace | `pnpm comments`; `pnpm lint`; `git diff --check` | Wave 1 | Exit 0 | Fix intended additions |

Structural check, from the repository root:

```sh
python3 - <<'PY'
import pathlib, re
s = pathlib.Path('docs/specs/archived/ai-patterns-corpus/ai-patterns-corpus-iteration-1-spec.md').read_text()
matrix = s.split('## Requirements (obligation ↔ proof)')[1].split('## Nine-dimension landings')[0]
rows = re.findall(r'^\| (I\d+) \|.*?`(proof-ai-patterns-iter1-[a-z-]+)`', matrix, re.M)
accept = re.findall(r'^- \[ \] (I\d+) / `(proof-ai-patterns-iter1-[a-z-]+)`', s, re.M)
assert len(rows) == 8 and len({i for i, _ in rows}) == 8 and len({p for _, p in rows}) == 8, rows
assert sorted(rows) == sorted(accept), (rows, accept)
landings = s.split('## Nine-dimension landings')[1].split('## Unresolved')[0]
for d in ['validation', 'failure modes', 'idempotency and retry', 'authorization',
          'concurrency and ordering', 'data lifecycle', 'external-dependency failure',
          'state transitions', 'observability']:
    line = next(x for x in landings.splitlines() if x.startswith('| ' + d + ' |'))
    assert 'obligation ↔ proof' in line or '| n/a |' in line, d
    for proof in re.findall(r'`(proof-ai-patterns-iter1-[a-z-]+)`', line):
        assert proof in dict(rows).values(), proof
print('proof-ai-patterns-iter1-spec-obligations: PASS')
PY
```

Card-shape check (`proof-ai-patterns-iter1-card-shape`):

```sh
python3 - <<'PY'
import pathlib, re, yaml
keys = {'type', 'title', 'description', 'status', 'aliases', 'review', 'checked', 'upstream'}
cards = sorted(pathlib.Path('docs/knowledge/ai-patterns').glob('*.md'))
assert len(cards) == 7, cards
for c in cards:
    text = c.read_text()
    fm = yaml.safe_load(text.split('---')[1])
    assert set(fm) == keys, (c.name, set(fm) ^ keys)
    assert fm['type'] == 'knowledge' and fm['status'] == 'draft', c.name
    assert fm['review'] in {'current', 'needs-review', 'retired'}, c.name
    assert re.fullmatch(r'\d{4}-\d{2}-\d{2}', str(fm['checked'])), c.name
    assert isinstance(fm['aliases'], list) and str(fm['upstream']).strip(), c.name
    assert not re.search(r'\*\*Review( state)?:\*\*', text), c.name
print('proof-ai-patterns-iter1-card-shape: PASS')
PY
```

Link check (`proof-ai-patterns-iter1-links`):

```sh
python3 - <<'PY'
import pathlib, re
files = [*pathlib.Path('docs/specs/archived/ai-patterns-corpus').glob('*.md'),
         *pathlib.Path('docs/knowledge/ai-patterns').glob('*.md'),
         pathlib.Path('.agents/skills/ai-patterns/SKILL.md'),
         pathlib.Path('docs/notes/ai-patterns-corpus/ai-patterns-corpus-note.md')]
bad = []
for f in files:
    for target in re.findall(r'\]\((\.{1,2}/[^)#\s]+)', f.read_text()):
        if 'archived/ai-patterns-corpus' in target or not (f.parent / target).resolve().exists():
            bad.append(f'{f}: {target}')
assert not bad, '\n'.join(bad)
print('proof-ai-patterns-iter1-links: PASS')
PY
```

The card-shape check imports PyYAML. If it is missing, report that and run
the same assertions through `node -e` with the repo's `yaml` dependency. Do
not skip the check.

## Cross-domain leak table

| Leak | Refuse / route |
| --- | --- |
| Update the PR body's stale stack line | `code-pr`, on an explicit ask |
| Reply to or resolve the PR 78 review threads | `code-ci`, on an explicit ask |
| Decide permanence, ownership or distribution | Human; any durable convention goes through the `adr` skill |
| Build a behavioural eval suite for skills | Its own PRD or spec |
| An executable plan from this skill | `code-plan` only |

## ADR

None needed this iteration. Retiring R13 withdraws the routing convention
that `U-ai-patterns-routing-decision` tied to an ADR before rollout, so no
rollout remains to gate. The Human closes that row at closure.
