# AI patterns pilot evidence

Checked 2026-10-22. This is evidence for the [approved spec](./ai-patterns-corpus-spec.md)
and [plan](./ai-patterns-corpus-plan.md), not permanent adoption. Execution and
resume state lives only in the plan. This file records proof artifacts and
observations, including failures.

## Frozen retrieval inputs

Frozen before the first corpus scoring run, without title-only queries:

| Case | Exact keyword query | Expected top-three card |
| --- | --- | --- |
| Q1 | `load references startup` | progressive-disclosure |
| Q2 | `fresh session passed work` | session-continuity |
| Q3 | `tests visible feature proof` | verification-and-gates |
| Q4 | `skill guidance useful cost` | skill-fitness or evaluation-design |

Initial scoring results and the labelled Q2 retry are recorded below. No card text was tuned for retrieval.

## Ingestion provenance — R3

All seven spawn calls were accepted with explicit `model: gpt-6-luna`,
`reasoning_effort: medium`, `fork_turns: none`. This verifies the configured
requests and task dispatch, not an independent provider attestation of the
model behind the runtime. Workers could not inspect model identity or effort;
that remains unknown. No model substitution was requested or reported.
The collaboration tool trace contains each filled builder brief and scope.

| Card | Task | Worker UTC interval on 2026-10-22 | Configuration | Sources and outcome |
| --- | --- | --- | --- | --- |
| progressive-disclosure | `/root/ingest_01` | 17:23:40–17:24:31 | Luna / medium / none, accepted request | Agent Skills spec, Anthropic skills article, book Markdown; parent admitted with URL clarification |
| context-selection | `/root/ingest_02` | start not exposed; end 17:24:23 | same | Anthropic context engineering, Chroma report, Context Engineering book; Context Rot book inaccessible; admitted with caveat |
| verification-and-gates | `/root/ingest_03` | approximately 17:23–17:24 | same | Anthropic long-running harness report, Verification Loop book; Checkpoint inaccessible; parent added local links and available upstream date |
| session-continuity | `/root/ingest_04` | 17:25:11–17:25:38 | same | Anthropic long-running report, book HTML; Markdown inaccessible; admitted |
| skill-fitness | `/root/ingest_05` | first available clock 17:25:31; end 17:26:07 | same | SWE-Skills-Bench v1; book search excerpt only; parent removed unverified book bibliography attribution |
| evaluation-design | `/root/ingest_06` | approximately 17:24–17:25:56 | same | Anthropic evals; book Markdown inaccessible; admitted using primary evidence |
| authority-boundaries | `/root/ingest_07` | approximately 17:25–17:27:06 | same | Anthropic effective agents; book HTML; parent reopened both book pages and primary; admitted |

Worker intervals marked approximate are not precise latency measurements.
The parent observed 01/02/03 simultaneously running with `list_agents`;
then dispatched 04 in 02's freed slot, 05/06 in 01/03's freed slots, and 07
in 04's freed slot. At most three ingestion workers ran alongside the parent.
These task traces demonstrate overlap rather than seven serial ingestions.
The parent alone performs admission and QMD refresh. Workers edited disjoint
cards; they did not change config, shared evidence, or index. Unit06 violated
its no-build instruction by invoking `pnpm build`; it produced no tracked
source changes outside its card. The parent reruns gates rather than relying
on that shared build. This deviation is retained rather than claimed compliant.

## Parent admission — R1, R2, R4

The parent read all seven complete cards, reopened the primary sources named
in them, and checked local `code-spec`, `code-execute`, `qmd`, `harness-init`,
`code-review`, `code-ci`, and `handoff` permissions and reference paths.
The [research note](../../notes/ai-patterns-corpus/ai-patterns-corpus-note.md)
remains historical draft research; its earlier root/topic-collection proposal
is superseded by the approved spec. It is not routing policy.

Primary findings retained: staged skill resources; context selection with
Chroma's tested-model/task limits; end-to-end proof and continuity from one
Anthropic experiment; preliminary skill-fit results from Claude Code/Haiku4.5;
evaluation with positive/negative cases and separate outcome measures;
environment feedback/checkpoints without importing generic permission tiers.
Local recommendations appear separately from these source findings.

Corrections: verification had code-formatted but unlinked local surfaces;
parent added links and the book date actually exposed in its flattened Markdown.
Skill-fitness attributed a paper pointer to a book whose full entry could not
be reopened; parent removed that attribution. Progressive disclosure now
records the parent's observed engineering-alias redirect. Context Rot,
Checkpoint and Eval discovery access gaps remain visible; recommendations use
checked primary evidence. No full article text is mirrored.

Each final card has the concrete question, working local path, practical
tradeoff/counterexample, separate Source findings/Harness assessment, primary
and book URLs, checked/upstream date or unknown, evidence limits and current
review state. Current means reviewed against the stated checked sources,
not that inaccessible discovery material was verified. Unsupported discovery
claims are excluded from recommendations.

Controlled failure walkthrough: the original skill-fitness bibliography
attribution fails admission because a search excerpt cannot verify a full
bibliography. One parent correction under unit08's owned path removes it;
no second simultaneous card writer or duplicate index entry is created.
For unavailable-model handling, inspect an injected hypothetical dispatcher
result `model unavailable`: stop that assignment, report its actual error,
leave its card unadmitted and do not substitute another model. The real
runtime accepted all seven requested configurations; no unavailable-model
failure is claimed to have occurred. This is a labelled manual boundary
walkthrough, not fabricated runtime failure evidence.

All workers returned passing local CLI integrity checks (111 claims, zero
failures; comments zero findings). Global `wolven-harness` was absent; their
fallback was `node dist/cli.js {comments,validate}`. Parent gate output below
is authoritative for the complete wave.

### Admission counts

Full-file whitespace counts: progressive-disclosure 413; context-selection 497;
verification-and-gates 438; session-continuity 405; skill-fitness 395;
evaluation-design 429; authority-boundaries 417. Context-selection's synthesis
is 407 words excluding YAML/provenance; the full-file deviation is retained
because the extra fields make source-access and runtime-verification limits
explicit. All other full-file counts are within the 250–450 target.
Aliases Context Rot, Checkpoint and Bounded Autonomy are present in their
respective cards. Exactly seven Markdown cards exist under the topic root.

## Collection boundary and coverage — R5, R12

Installed CLI: `qmd 2.5.3 (cdc1ca5032)`. Parent config adds only `knowledge`:
root `./docs/knowledge`, `**/*.md`, ignore `**/archived/**`, default exclusion,
and advisory collection context. All pre-existing collection and model bytes
are preserved. Config metadata grants no authority.

Live comparison passed: six real docs directories `adrs`, `deferrals`,
`knowledge`, `notes`, `prds`, `specs`, each with exactly one same-name root;
no catch-all collection, duplicate root, missing path, or escaping symlink.
`docs/WRITING-PROFILE.md` remains a direct-read root file. `qmd collection
show knowledge` prints Include: no; `qmd ls knowledge` lists exactly seven
`qmd://knowledge/ai-patterns/` paths.

Positive scoped searches found a document in every nonempty child:
`architecture -c adrs`, `install -c prds`, `gate -c specs`, `research -c notes`,
`trigger -c deferrals`, `disclosure -c knowledge` (each with `-n 1 --format json`).
Default `qmd search 'progressive disclosure' --format json -n 20` returned
only notes/specs; explicit `-c knowledge` returned the card `#630147`.
Local work may discuss external patterns; exclusion isolates the cards,
not every mention of their names in approved inputs/evidence.

Read-only SQLite inventory inspection found 59 active logical documents,
no active `archived/` paths, seven topic cards only in `knowledge`, and no
duplicate collection/path pair. An initial check mistakenly treated bare
`qmd ls` as a document listing (it lists collections); it failed. The corrected
inventory check inspected active document rows and passed. This was a proof
script correction, not a hidden collection change.

An isolated OS-temp fixture ran the installed CLI against top-level and
nested `archived/` cards: only `topic/active.md` indexed. Adding a temporary
`docs/new-child/` exposed a missing same-name config entry; explicitly adding
that collection and rerunning update reconciled it. A duplicated-root fixture
was detected, and an escaping `/private/tmp` symlink was flagged before
indexing. These are manual pilot checks, not a newly shipped doctor feature.
The fixture tree and its local index were removed in `finally`; no temporary
child was added to the live repo. Existing collection archive globs remain
unchanged and the live inventory contains no archived document.

## Retrieval and repeatability — R6

Each initial command was `qmd search '<frozen query>' -c knowledge -n 3
--format json`:

| Case | Initial returned order | Result |
| --- | --- | --- |
| Q1 | progressive-disclosure `#630147` (0.77) | PASS, rank 1 |
| Q2 | empty array | FAIL, preserved |
| Q3 | verification-and-gates `#3eb7e5` (0.88) | PASS, rank 1 |
| Q4 | evaluation-design `#a0b150` (0.80), progressive-disclosure (0.78) | PASS, rank 1 expected alternative |

Labelled Q2 lexical retry: `qmd search 'session passed' -c knowledge -n 3
--format json` returned session-continuity `#7f2a72` (0.55), rank 1. The
original query required words absent from the card; the shorter meaningful
question terms preserve the intended continuity problem. Initial suite:
3/4; suite with disclosed Q2 query correction: 4/4. This is a tuned smoke
fixture, not held-out evidence of generalized retrieval quality.

The parent ran full `qmd get '<docid>' --no-line-numbers` for all four
expected hits above. After removing the CLI header/context separator,
each full stored body equalled its on-disk file (apart from final newline).
These cards and their cited primary sources were read, not just snippets.

Single-writer refresh: `qmd update` indexed seven new knowledge docs. Parent
`qmd embed -c knowledge` succeeded: `Embedded 14 chunks from 7 documents in
2s`. `qmd status` then showed 59 files, 314 vectors, two pending documents
in specs (the changed plan and new evidence); this is not a claim that the
whole index was embedded. The workers' earlier `Failed to create context`
Metal errors remain failures; parent success does not rewrite those traces.
No semantic query/reranking quality is inferred from embedding completion.

A repeat parent `qmd update` reported zero new/updated/removed documents
and seven unchanged knowledge files. Active `(collection,path,hash)` rows
and SHA256 of every card were identical before/after; no source was rewritten.
R6 passes with the explicitly labelled Q2 retry and separate embedding result.

### Wave 1 integrity gate

Parent reran `pnpm build` (exit 0), `pnpm validate` and `pnpm comments`:

```text
claims: 111 ok, 0 legacy-warn, 0 fail
ignored: templates/**, test/** (257 files)
validate: ok
comments: ok (0 findings)
```

`git diff --check` exited 0 with no output. This wave has real new card and
configuration diffs; no source/templates/test/renderer/runtime dependency
change. All seven cards are admitted with the documented source caveats.
