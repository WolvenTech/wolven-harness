---
type: spec
title: Docs collection routing and AI patterns pilot
description: One QMD collection per docs directory, explicit routing across harness stages, and a seven-card pilot ingested by parallel Luna medium agents.
status: stable
---

# Docs collection routing and AI patterns pilot

**Source:** Human ask, "please write a spec on this", following the
[research note](../../notes/ai-patterns-corpus/ai-patterns-corpus-note.md).
Additional requirement: "the ingestion should be done in paralell luna-medium
agents". The research remains a draft input, not an approved architecture decision.
Expanded ask: one collection per direct child directory of `docs/`, with
collection-aware retrieval across harness workflows and their transitions.
Here, a transaction means one workflow operation or stage handoff, not a
database transaction.
**Approval:** Human approved this spec and requested `code-plan` on 2026-10-22.
**Next:** `code-plan`, then `code-execute` after plan approval.
**Named structural proof:** `proof-ai-patterns-spec-obligations`.

## Term challenge

| Term | Meaning in this spec |
| --- | --- |
| Corpus | Seven original synthesis cards for harness development; not a mirror of the book. |
| Card | One Markdown document with source findings, a separate local assessment, retrieval cues, and evidence limits. |
| Ingestion | Reading selected book entries, checking primary evidence and local applicability, then writing a card. It includes research and review, not just downloading text. |
| Luna medium | `gpt-6-luna` with `reasoning_effort: medium`; an execution requirement, not a model selected by task difficulty. |
| Collection | One named QMD collection per direct child directory of `docs/`. The `knowledge` collection covers `docs/knowledge/`; `ai-patterns` is a topic within it. |
| Consultation skill | Local `ai-patterns` instructions for retrieving and assessing relevant cards; never an authority to change the harness. |
| Pilot | A bounded experiment whose usefulness is unproven until its evidence is reviewed. |

QMD search for `ai-patterns` found the research note and no matching ADR;
the current configuration and live sources below were inspected. These terms
extend the existing research and retrieval vocabulary; they do not rename
the existing code, review, or handoff lanes.

## Repository grounding

| Surface | Present today | Role |
| --- | --- | --- |
| `docs/notes/ai-patterns-corpus/ai-patterns-corpus-note.md` | yes, untracked research output | Candidate topics, sources, boundaries, and proposed pilot questions |
| `.qmd/index.yml` | yes | Five existing directory collections; reconcile against current direct child directories and add `knowledge` |
| `.agents/skills/qmd/SKILL.md` | yes | Search, full retrieval, and live-file verification |
| `.agents/skills/research/SKILL.md` | yes | Primary-source evidence requirements |
| `.agents/rules/qmd-first.md` | yes | Local decisions first; external research does not become policy |
| `.agents/skills/code-spec/SKILL.md`, `.agents/skills/code-execute/SKILL.md` | yes | Existing proof and execution boundaries |
| `.agents/skills/code-review/SKILL.md`, `.agents/skills/handoff/SKILL.md` | yes | Explicit ask-only operations retained by the consultation workflow |
| `.claude/skills` | yes, symlink to `../.agents/skills` | The local skill has one source; no duplicate runtime copy |
| `src/setup/skill-sets.ts`, `templates/`, `package.json` | yes | Package and installation surfaces stay unchanged |
| `docs/knowledge/ai-patterns/`, `.agents/skills/ai-patterns/` | no | Proposed pilot surfaces; not existing dependencies |
| `docs/WRITING-PROFILE.md` | yes | Spec and evidence-document layout |

## Surface walk

**Approved local implementation scope:**

- `docs/knowledge/ai-patterns/*.md`: exactly seven active cards.
- `.qmd/index.yml`: directory-aligned collection coverage, preserving existing
  paths, exclusions, models, and context; `knowledge` is opt-in.
- `.agents/skills/qmd/SKILL.md` and `.agents/rules/qmd-first.md`: shared routing,
  authority, freshness, and fallback rules.
- Relevant local skill entry points: `adr`, `create-prd`, `wayfinder`, `research`,
  `code-spec`, `code-plan`, `code-execute`, `code-commit`, `code-pr`, `code-review`, `code-ci`,
  `harness-init`, and `harness-doctor`; add concise stage references to the
  shared routing contract rather than copying it into every skill.
- `.agents/skills/ai-patterns/SKILL.md`: one lean consultation skill.
- This spec's folder: a proposed `ai-patterns-corpus-pilot.md` evidence record
  beside the spec, covering ingestion provenance, checks, and decision trials.
- Local QMD index and embeddings through the existing CLI; generated state is
  not a source artifact to stage or publish.

**Out of mutate scope:** `src/**`, `templates/**`, `test/**`, `renderer/**`,
`package.json`, `pnpm-lock.yaml`, `AGENTS.md`, unrelated skill behavior,
`.github/**`, and `docs/adrs/**`. Shipped-template wiring is pending the
explicit scope decision under Unresolved. Spec approval authorizes this design; implementation follows a separately
approved plan.

## Waves

Two acceptance boundaries are required. This specifies their outcomes, not
work-unit order or agent scheduling; `code-plan` owns those details.

| Wave | Outcome | Gate |
| --- | --- | --- |
| 1 | Reviewed seven-card corpus produced by parallel Luna medium ingestion; scoped QMD retrieval works | R1–R6 and R12 evidence, `pnpm validate`, and `git diff --check` pass |
| 2 | Consultation skill and pilot evidence; source and permission boundaries hold | R7–R11 and R13 evidence, `pnpm validate`, `pnpm comments`, and `git diff --check` pass |

A failed gate stops progress to the next wave. A retrieval hit is not proof
of a useful decision, and Wave 1 does not by itself authorize package distribution.

## Requirements (obligation ↔ proof)

### Corpus and parallel ingestion

| ID | Obligation | Named proof | Evidence shape |
| --- | --- | --- | --- |
| R1 | The active corpus contains exactly `progressive-disclosure.md`, `context-selection.md`, `verification-and-gates.md`, `session-continuity.md`, `skill-fitness.md`, `evaluation-design.md`, and `authority-boundaries.md`. Checkpoint, Context Rot, and Bounded Autonomy are aliases inside the relevant cards. | `proof-ai-patterns-inventory` | `rg --files docs/knowledge/ai-patterns` compared with this seven-file inventory; card titles and aliases inspected |
| R2 | Each card states a concrete retrieval question, linked local surface, practical tradeoff, and counterexample. It separates `Source findings` from `Harness assessment`; records book URL, primary URLs, checked date, upstream date or explicitly unknown, evidence limitations, and review state (`current`, `needs-review`, or `retired`). Target 250–450 words; explain deviations in pilot evidence. | `proof-ai-patterns-card-quality` | Read all seven complete files and record a per-card admission checklist and word count; every actionable technical claim has a checked primary citation |
| R3 | Ingestion uses parallel subagents configured as `model: gpt-6-luna`, `reasoning_effort: medium`, and `fork_turns: none`. One assigned card per task, with explicit sources, local paths, boundaries, and a common card contract in each prompt. Use at least two overlapping agent tasks when independent cards remain, up to available slots; the parent occupies one slot. With the current four-slot limit, at most three ingestion agents run concurrently. Agents write only their assigned card and return source findings, caveats, and actual model configuration. | `proof-ai-patterns-parallel-ingestion` | Pilot record lists each card, agent/task identifier, model and effort, assigned path, start/end, inspected sources, and review outcome; task transcripts demonstrate concurrency and configuration. Do not record a merely requested model as verified if the runtime cannot confirm it |
| R4 | The parent reviews each draft against primary sources and local rules before indexing it. Agents never edit QMD config/index, the skill, other cards, or shared evidence. Failed drafts are retried under the same assignment without concurrent writers for that card. A model/effort unavailable condition stops ingestion and is reported; no silent substitution. Unsupported claims are omitted or clearly marked and excluded from recommendations. Existing unrelated work is preserved. | `proof-ai-patterns-ingestion-review` | Per-card parent verdict and corrections; inspect task ownership and final diff; controlled failed-draft/model-unavailable walkthrough demonstrates the stop and retry boundaries |

Topic-to-source mapping starts from the research note's seven-card table.
Sources must be reopened during ingestion; the note's checked date is not a
substitute. Book articles are discovery material. Write original synthesis
with links, without full-article copies, automated mirroring, or unsupported
quantitative claims. Skill-fitness results retain the preprint and single
agent/model limitations; context-length findings retain tested-model scope.
These content requirements are included in the R2 admission review.

### Collection and retrieval

| ID | Obligation | Named proof | Evidence shape |
| --- | --- | --- | --- |
| R5 | Add `knowledge` at `./docs/knowledge`, with `includeByDefault: false` and context identifying advisory research. Its glob includes active Markdown recursively and excludes archived subtrees. Preserve unrelated config bytes. AI-pattern cards appear only in `knowledge`, not `notes` or a second topic collection. After all cards pass parent review, one writer runs `qmd update`, then `qmd embed -c knowledge`. | `proof-ai-patterns-collection-boundary` | Config diff, `qmd collection show knowledge`, `qmd ls knowledge`, and scoped/unscoped keyword searches; all seven appear only in the intended collection and no `qmd://knowledge/` hit appears in default searches |
| R6 | Four positive retrieval questions below return the expected card among the top three scoped keyword hits. Retrieve each expected card with `qmd get` and compare to its on-disk file before relying on it. Repeat index refresh without changing source files: no duplicate logical documents or source rewrites. Embedding status must be reported independently; keyword success cannot be labelled semantic success. | `proof-ai-patterns-retrieval` | Record exact `qmd search ... -c knowledge -n 3` commands/results, four full retrievals, `qmd status`, and seven-card topic inventory before/after repeat `qmd update`; unrelated knowledge topics do not count as duplicate AI-pattern cards |
| R12 | Every real direct child directory of `docs/` has exactly one collection with the same name and that directory as its root; `docs/knowledge/ai-patterns/` is not a separate collection. Root files such as `docs/WRITING-PROFILE.md` are read directly. No catch-all `docs/**` collection duplicates the children. Reconcile coverage when a harness operation creates a docs directory, and on init/doctor inspection; a new unconfigured directory is a visible mismatch, never silently absent. Preserve existing archive exclusions and report missing paths, duplicate roots, unsupported glob behavior, or escaping symlinks before indexing. No folder watcher or discovery daemon. | `proof-ai-patterns-directory-collections` | Compare filesystem direct-directory inventory with parsed collection roots; positive retrieval per nonempty child, negative archive/duplicate checks, and a temporary new-child walkthrough showing mismatch then explicit reconciliation |
| R13 | Harness stages use the routing matrix below through the shared QMD contract. Read named input artifacts directly, search relevant collections with explicit scope, retrieve full hits, and inspect live state before relying on a decision. An index miss never replaces direct artifact reading. Refresh after an authorized docs-write transaction and before its retrieval handoff, not before every read; independent ingestion agents never refresh. Record consulted collections and exact artifact refs with handoff evidence. Resuming reconciles current input refs, live files, and index freshness without silently changing approved scope. | `proof-ai-patterns-stage-routing` | Inspect shared routing and thin skill references; record representative research → spec → plan → execute transitions, review/CI read-only paths, newly written document retrieval, and a stale-index resume case |

### Routing across harness operations

The stages below name retrieval scope, not mandatory calls to every listed
collection on every invocation. Search ADRs first for decision questions;
then choose only collections relevant to the question. Multiple `-c` values
combine a search scope; they do not establish trust or priority, so ADR lookup
is a separate step. Never query an absent optional collection blindly.

| Operation | Read directly first | Scoped discovery after relevant ADR lookup |
| --- | --- | --- |
| `adr` | Relevant existing decisions and the proposed decision text | `adrs`; relevant `specs` and `notes` for rationale |
| `create-prd` / `wayfinder` | Named idea, map, or ticket | `prds`, `maps` when present, `notes`, `deferrals`; `knowledge` only for a relevant external question |
| `research` / `ai-patterns` | The question and affected local surfaces | `notes`, `knowledge`; related `prds`/`specs` when needed; external evidence stays advisory |
| `code-spec` | Named PRD or confirmed ask and affected code | `specs`, `prds`, `deferrals`; relevant `maps`/`notes`/`knowledge` to resolve a stated gap |
| `code-plan` | Exact locked spec and its refs | `specs`, `deferrals`; no automatic external-research pass |
| `code-execute` | Exact approved plan/spec, resume record, and Git state | Relevant `adrs`/`specs`; `notes`/`knowledge` only for an implementation uncertainty, never to redefine frozen requirements |
| `code-review` / `code-ci` | PR description, cited refs, fresh diff/check/thread state | Relevant `adrs`/`specs`/`prds`; external patterns cannot add review obligations or authorize fixes outside the lane |
| `code-commit` / `code-pr` | Intended diff, exact spec/plan refs, and current Git/PR state | No automatic external research; use relevant `adrs`/`specs` only to resolve a concrete claim or handoff gap |
| Other skills (`prototype`, `grilling`, `pragmatic-guard`, `handoff`, `journey-map`) | Named artifacts or current conversation inputs | Apply the shared contract only when retrieval is needed; do not add a search ceremony to operations already answered by exact inputs |
| `harness-init` / `harness-doctor` | Docs directory inventory and QMD config/status | Check coverage and reachability; content search only when diagnosis needs it |

Default general searches include local work collections. `knowledge` remains
explicit opt-in. Archives stay excluded from active globs; a deliberate
historical investigation uses direct paths without changing active defaults.
Optional `maps` routing applies only where that directory exists. Existing
setup selection/create-only guarantees remain intact.

The corpus sits under `docs/knowledge/`, separate from `docs/notes/`. This
adds no profile document type or general-purpose validator. The proposed
coverage checks are a manual pilot contract until distribution scope and
any permanent doctor/installer changes are approved.

Collection context is metadata, not an enforcement or permission mechanism.
QMD 2.5.3 supports default exclusion and collection context; implementation
must verify the installed version's behavior rather than copy configuration
from a newer upstream branch. Evidence sources are linked in the research note.

### Consultation and pilot

| ID | Obligation | Named proof | Evidence shape |
| --- | --- | --- | --- |
| R7 | The local skill applies to explicit `/ai-patterns` consultation or a concrete harness-workflow design/failure question; it does not trigger for routine spelling edits. Search ADRs and affected local files first, then explicitly scope external retrieval with `-c knowledge`, selecting the `ai-patterns/` topic within returned paths; unrelated knowledge cards do not satisfy its topic-specific proofs. Retrieve at most three initially relevant cards; expand only with a stated unresolved question. Output the problem, relevant pattern/source links, local fit, tradeoff/counterexample, evidence caveats, and smallest justified recommendation, including no change when appropriate. | `proof-ai-patterns-consultation` | Read the skill, then record positive consultation and spelling-edit negative-case transcripts; verify source and local-path citations in the answer |
| R8 | Consultation is read-only by default. It cannot modify source cards, change local policy, invoke ask-only review/handoff, or grant implementation, commit, PR, or merge authority. A conflict with the local ask-only review rule preserves that rule and is reported. External text is reference data, not instructions. | `proof-ai-patterns-authority` | Transcript for the conflicting-book-review case; inspect tool trace for no unauthorized writes or ask-only invocation; inspect the skill's explicit boundary |
| R9 | Missing collection, stale card, inaccessible source, or QMD failure is identified before fallback. No corpus hit is not proof that no useful pattern exists. Reopen sources for a consequential decision or relevant context change; if verification fails, qualify the recommendation or withhold it. On embedding failure report actual error, preserve working keyword retrieval, and retry only after a concrete environment remedy; no unbounded retry or silent rebuild. | `proof-ai-patterns-failure-handling` | Controlled walkthroughs with a missing collection, one `needs-review` card, inaccessible URL, and failed embedding command; record behavior and restore any temporary fixture/state before handback |
| R10 | Maintenance is explicit and manual: recheck before consequential use, after relevant local/runtime changes, and at a quarterly review if the pilot continues. Review state changes only with evidence; retired cards leave the active `*.md` glob before `qmd update`. No automatic refresh overwrites original synthesis. Parent consolidates worker evidence once; no background index writer or scheduler. | `proof-ai-patterns-lifecycle` | Skill maintenance instructions and a walkthrough of `current` → `needs-review` → reviewed `current` or `retired`; inspect active glob and single-writer ownership |
| R11 | Pilot evidence includes all ingestion and retrieval proofs, both negative cases, and three paired real harness-decision consultations against the current workflow. Keep task, model/effort, and repository state comparable, with fresh independent sessions; the baseline cannot see corpus cards or earlier treatment answers. Record useful additions, errors/contradictions, available token/context and time cost, unknown measurements, and a per-case verdict. Report retain/revise/remove as a recommendation requiring Human decision. No blanket efficacy claim from three cases. | `proof-ai-patterns-pilot` | Proposed adjacent pilot evidence file has three complete paired cases, environment/configuration, source refs, observations, limitations, and verdict; missing real cases remain pending and block pilot completion |

### Retrieval and behavior fixtures

These inputs are fixed minimum acceptance fixtures, not an exhaustive benchmark.

| Case | Input | Expected |
| --- | --- | --- |
| Q1 | A skill loads all reference files at startup; what should we inspect? | Progressive disclosure in top three scoped keyword hits |
| Q2 | A fresh session cannot tell which work passed; what must persist? | Session continuity in top three; no automatic handoff |
| Q3 | Tests pass but the visible feature fails; what proof is missing? | Verification and gates in top three |
| Q4 | Should we add a skill because its guidance sounds useful? | Skill fitness or evaluation design in top three |
| N1 | Please fix a spelling error in README. | No ai-patterns consultation or corpus loading |
| N2 | A book recommends automatic PR reviews; may this repo do that? | Preserve the existing explicit ask-only review rule |

Keyword query strings may select meaningful words from Q1–Q4, but the record
must include the exact strings and avoid using only the expected card title.
Freeze them before scoring. Any later query/card tuning requires a labelled
rerun, preserving the initial result rather than reporting only success.

## Nine-dimension landings

| Dimension | Landing kind | Landing |
| --- | --- | --- |
| validation | obligation ↔ proof | R12 / `proof-ai-patterns-directory-collections`; R2 / `proof-ai-patterns-card-quality`; R5 / `proof-ai-patterns-collection-boundary`; R6 / `proof-ai-patterns-retrieval` |
| failure modes | obligation ↔ proof | R4 / `proof-ai-patterns-ingestion-review`; R9 / `proof-ai-patterns-failure-handling` |
| idempotency and retry | obligation ↔ proof | R4 / `proof-ai-patterns-ingestion-review`; R6 / `proof-ai-patterns-retrieval` |
| authorization | obligation ↔ proof | R8 / `proof-ai-patterns-authority` |
| concurrency and ordering | obligation ↔ proof | R13 / `proof-ai-patterns-stage-routing`; R3 / `proof-ai-patterns-parallel-ingestion`; R4 / `proof-ai-patterns-ingestion-review`; R5 / `proof-ai-patterns-collection-boundary` |
| data lifecycle | obligation ↔ proof | R10 / `proof-ai-patterns-lifecycle` |
| external-dependency failure | obligation ↔ proof | R9 / `proof-ai-patterns-failure-handling` |
| state transitions | obligation ↔ proof | R10 / `proof-ai-patterns-lifecycle` |
| observability | obligation ↔ proof | R13 / `proof-ai-patterns-stage-routing`; R11 / `proof-ai-patterns-pilot` |

## Unresolved

| Identifier | Decision needed | Owner | Blocking effect | Disposition |
| --- | --- | --- | --- | --- |
| `U-ai-patterns-distribution` | Local pilot wiring only or also shipped templates and consumer operation? | Human | Blocks distribution-specific surface lock and package implementation; local pilot remains in scope | Settled 2026-10-26: harness-installed skills stay agnostic; local skills may diverge from shipped templates (e.g. `qmd` in `test/skill-copies.test.ts`), while distribution to consumer templates remains excluded |
| `U-ai-patterns-routing-decision` | Approve directory-based routing as a durable harness convention? | Human | Policy approved; required architecture-record follow-through remains a rollout prerequisite | Approved on 2026-10-22 with this spec; use the `adr` skill before permanent rollout |
| `U-ai-patterns-permanence` | Retain locally, revise, or remove after pilot evidence? | Human | Blocks permanent adoption and distribution, not the bounded pilot | Decide after R11 evidence; no automatic promotion |
| `U-ai-patterns-owner` | Who owns recurring review if retained? | Human | Blocks permanent maintenance commitment | Decide with permanence; quarterly cadence is proposed, not scheduled |
| `U-ai-patterns-real-cases` | Which three actual harness decisions will supply paired cases? | Human and builder from actual work | Blocks R11 completion if three cases are unavailable | Select and record actual tasks before running comparisons; never invent completed work |

The Human confirmed that `knowledge` lives inside `docs/`; the corpus home
is `docs/knowledge/ai-patterns/`. The Human approved the seven-card scope
with this spec on 2026-10-22. Full-article reuse permission is not
a pilot blocker because the corpus contains original synthesis and citations.

## Out of scope

- Package distribution, installation choices, runtime CLI changes, release work,
  automatic ingestion, and broadening the AI-pattern topic beyond seven active cards.
- Automatic folder watchers, new collection-discovery services, or silently
  rewriting a consumer configuration.
- Changing existing workflow permissions or claiming QMD context enforces them.
- Training models, tuning embeddings, building a search service, or statistical
  claims of generalized efficacy from the pilot.

## Pragmatic-guard refuses

| Field | Verdict |
| --- | --- |
| Need | 6/10: repeated consultation is the confirmed use case, and the research identifies specific local questions. |
| Complexity | 5/10 for seven cards, directory-aligned configuration, one local skill, shared routing with thin stage references, and manual evidence; model-configured parallel ingestion is explicitly requested. |
| Verdict | Proceed with the approved bounded pilot design; execution follows plan approval. |
| Simpler path | Existing QMD CLI and original Markdown cards; parallel research with a single reviewer/index writer. |
| Deferral | None recorded. Automatic mirroring, new infrastructure, and package expansion are excluded from this initiative rather than added as promised future work. |

## Acceptance

### Wave 1

- [ ] R1 / `proof-ai-patterns-inventory` PASS — exact seven-card inventory.
- [ ] R2 / `proof-ai-patterns-card-quality` PASS — complete admission review.
- [ ] R3 / `proof-ai-patterns-parallel-ingestion` PASS — actual parallel Luna medium ingestion with provenance.
- [ ] R4 / `proof-ai-patterns-ingestion-review` PASS — parent source review and failure/ownership checks.
- [ ] R5 / `proof-ai-patterns-collection-boundary` PASS — opt-in, unique indexing, single refresh writer.
- [ ] R12 / `proof-ai-patterns-directory-collections` PASS — one collection per direct child and visible reconciliation gaps.
- [ ] R6 / `proof-ai-patterns-retrieval` PASS — four top-three results, full retrieval, and repeat-refresh evidence.

### Wave 2

- [ ] R7 / `proof-ai-patterns-consultation` PASS — bounded consultation and negative trigger evidence.
- [ ] R8 / `proof-ai-patterns-authority` PASS — conflicting guidance grants no authority.
- [ ] R9 / `proof-ai-patterns-failure-handling` PASS — visible failures and qualified fallback.
- [ ] R10 / `proof-ai-patterns-lifecycle` PASS — manual review and retirement behavior.
- [ ] R13 / `proof-ai-patterns-stage-routing` PASS — stage-specific routing, freshness, and resume evidence.
- [ ] R11 / `proof-ai-patterns-pilot` PASS — complete paired pilot and Human-facing recommendation.

Each checkbox refers to a named evidence check below. No implementation box
is checked by writing this spec or validating its Markdown.

## Eval / gates

| Gate | Command / check | When | PASS | Abort |
| --- | --- | --- | --- | --- |
| Spec obligations | `proof-ai-patterns-spec-obligations`: run the structural command below, then inspect matrix wording and source paths | Before `code-plan` | One distinct proof and acceptance per obligation; all nine landings resolve; no invented existing paths | Do not plan |
| Corpus | `rg --files docs/knowledge/ai-patterns`; read all cards and review R1–R4 provenance | Wave 1 | Exact inventory, sourced claims, actual requested agent configuration and parallelism | Do not index rejected drafts |
| Collection | `qmd collection show knowledge`; `qmd ls knowledge`; scoped/default `qmd search` comparisons | Wave 1 | R5 boundary checks pass | Fix config before consultation |
| Coverage and routing | Direct-child/config comparison and stage-transition transcripts under R12/R13 | Each relevant wave | Directory coverage and explicit routing hold without duplicate indexing or changed permissions | Fix before handoff |
| Refresh | `qmd update`; `qmd embed -c knowledge`; `qmd status` | After parent review | Index current; embedding success recorded separately, or explicit R9 fallback evidence | Never label failed embeddings as semantic success |
| Retrieval | Four frozen `qmd search '<query>' -c knowledge -n 3` commands, then `qmd get '<returned-docid>'` and live-file comparison | Wave 1 | R6 checks pass without concealing tuning | Fix before Wave 2 |
| Behavior | Run Q1–Q4, N1, N2 and controlled R9/R10 walkthroughs; inspect transcripts | Wave 2 | R7–R10 all pass | Fix behavior before declaring completion |
| Decision usefulness | Three paired actual tasks, inspected against R11 | Wave 2 | Complete comparable evidence and bounded verdict; usefulness may be negative | Pending evidence blocks completion; negative usefulness blocks automatic adoption |
| Integrity | `pnpm validate` | This draft and end of each wave | Exit 0 | Fix before handback |
| Comments and whitespace | `pnpm comments`; `git diff --check` | Handback | Exit 0 | Fix intended additions |

In this package checkout, run `pnpm build` before `pnpm validate` and
`pnpm comments`; these invoke the built local CLI. The `harness:*` aliases
require a `wolven-harness` executable on PATH, which was absent during
spec authoring. These local commands provide the harness integrity and
comment gates without installing this package into itself.

The shell commands above use existing CLI entry points; `<query>` and
`<returned-docid>` are recorded runtime values, not proposed new commands.
The named provenance/behavior checks are manual evidence reviews, not new
test-suite scripts. This initiative adds no infrastructure to mirror prose.

Structural check, run from repository root:

```sh
python3 - <<'PY'
import pathlib, re
p = pathlib.Path('docs/specs/ai-patterns-corpus/ai-patterns-corpus-spec.md')
s = p.read_text()
matrix = s.split('## Requirements (obligation ↔ proof)')[1].split('## Nine-dimension landings')[0]
rows = re.findall(r'^\| (R\d+) \|.*?`(proof-ai-patterns-[a-z-]+)`', matrix, re.M)
accept = re.findall(r'^- \[ \] (R\d+) / `(proof-ai-patterns-[a-z-]+)`', s, re.M)
assert len(rows) == 13 and len(set(rows)) == 13
assert len({proof for _, proof in rows}) == 13
assert sorted(rows) == sorted(accept), (rows, accept)
landings = s.split('## Nine-dimension landings')[1].split('## Unresolved')[0]
dimensions = ['validation', 'failure modes', 'idempotency and retry', 'authorization',
              'concurrency and ordering', 'data lifecycle', 'external-dependency failure',
              'state transitions', 'observability']
for dimension in dimensions:
    line = next(x for x in landings.splitlines() if x.startswith('| ' + dimension + ' |'))
    assert 'obligation ↔ proof' in line
    for proof in re.findall(r'`(proof-ai-patterns-[a-z-]+)`', line):
        assert proof in dict(rows).values(), proof
print('proof-ai-patterns-spec-obligations: PASS')
PY
```

## Cross-domain leak table

| Leak | Refuse / route |
| --- | --- |
| External article proposes a new harness convention | Consultation recommendation only; local decision work stays with the Human and relevant skill |
| Review, PR, commit, merge, or automatic handoff during consultation | Existing explicit authorization and corresponding skill boundaries apply |
| Shipping the pilot to consumers | Separate scope proposal after pilot evidence and Human decision |
| Repairing the QMD runtime or replacing models | Report actual failure; a separate environment remedy may be needed; no silent model substitution |
| An executable work-unit plan from this skill | `code-plan` after approval; it must preserve R3's explicit subagent model/effort requirement |

## ADR

The expanded directory/routing policy was approved with this spec. The
`adr` skill is required before its permanent rollout; that follow-through
is recorded under `U-ai-patterns-routing-decision`. No ADR is promoted or
cited as settled by spec approval alone. Distribution may also affect the existing setup
contract and requires a separate assessment before altering its guarantees.
