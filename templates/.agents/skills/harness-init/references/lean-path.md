# Lean path

Covers the lean path `SKILL.md` loads when the tree shows thin evidence. It
holds every lean rule: resuming a lean run, when lean applies, what happens
before step 0, the four items that may wait, and what each step still does.

## Resume first

Check for an earlier harness-init session note before deciding anything:

- A `draft` note whose **Deferred / skipped steps** section records
  `**Mode:** lean` resumes with that mode, its immediate goal and its agreed
  deferrals. Ask none of them again; pick up at the first step the note has
  not recorded.
- A `draft` note that records `**Mode:** full` resumes on the full path.
- A `stable` note means init already finished: lean does not apply, and the
  re-run skips in `SKILL.md` run as on the full path.

## When lean applies

The lean path fits a **thin-evidence** fresh repo: little or no application
code, and not enough in the tree to support deep Q&A. Thin evidence is judged
from the tree alone, after the resume check above and before step 0 — a goal
is not a precondition for lean; it is captured by the run.

## Before step 0

In this order:

1. **Decide whether lean applies** from what the tree shows (manifests,
   source folders, docs). When the evidence is ambiguous, put that to the
   Human as one question, lean recommended first. A plain "run harness-init"
   on an empty repo is enough to choose lean; no goal is needed for it.
2. **Capture the immediate goal.** Use the goal the Human already stated in
   the prompt. When there is none, ask one question: "What do you want to get
   done first in this repo? One sentence." Record the answer as given — never
   compose one for the Human. When the Human gives none, record "none
   stated" and ground proposals on the thin-evidence basis instead.
3. **Present the deferral list** (below) and wait for the Human's yes or
   their per-item changes. A declined item runs as on the full path.
4. **Record** the mode (`lean`), the immediate goal and the agreed
   deferrals in the note's **Deferred / skipped steps** section, filled as
   step 0 creates the note.

## Deferral boundary

The lean path defers exactly these four items, and nothing else:

| Deferrable | Step | What may wait |
|------------|------|----------------|
| Deep discovery Q&A beyond files | 2 extras | Lifecycle and decisions-not-yet-visible questions when the tree is thin or empty; an empty context list is recorded as empty and does not block the deferral |
| Optional web research | 3 | The Human-gated web pass; continue repo-only |
| Per-dimension score-gap keep/drop questions | part of 6 | Asking keep/drop for every failing dimension; still run `harness:score` and record the level. A `HYG-03`, `HYG-04` or `HYG-06` failure is never deferred: stop and show the Human the finding, as on the full path |
| Validate-wiring question | part of 6 | The CI / chained script / local-only choice; nothing is written and the run says how to wire it later |

**Before proceeding** with any lean deferral, present each deferred or skipped
step by number and name, with why and what remaining work it leaves. Wait for
the Human's yes on that list, then record those choices under **Deferred /
skipped steps** in the session note, one row per item with reason and
remaining work. Never silently skip a step.

## Skill proposals

**Skill proposals (step 4) are never deferred** and are never listed as
skippable on the lean path. Proposals cite the recorded immediate goal and
the available references (file-based discovery, plus any research that ran),
or an explicit thin-evidence basis when the tree is thin or no goal was
stated. Unsupported tool or architecture decisions stay open — do not invent
them to pad the list.

## Must still run

1. Entry integration (step 0)
2. Legacy ADR migration when needed (step 1)
3. File-based discovery (step 2 — reading the repo; Q&A extras may defer)
4. Skill proposals (step 4 — never deferred)
5. Stubs for skills the Human picks (step 5)
6. A score run that records the level without forcing every gap question
7. Session note close (`stable` at hand-back)

Validate-wiring is not in that list: it is asked as one essential choice
unless the Human agreed to defer it in the list above.

## Each step on the lean path

### Discovery (step 2)

The two Q&A extras — lifecycle stage and decisions not yet visible in code —
may be deferred once file-based discovery has run, even when the tree is
thin or empty: an empty context list is recorded as empty and does not
block the deferral. File-based discovery itself still runs. The lean path's own goal
question (one sentence, asked before step 0 when the prompt stated none) is
separate from these two and is never deferred; record the answer in the note.

### Research (step 3)

Optional web research may be deferred the same way a declined web pass is
handled: continue repo-only, and record it under Deferred / skipped steps.

### Harness score (step 6)

The lean path never defers the score run: `harness:score` always runs and its
level and score are always recorded in the note. Only the per-dimension
keep/drop questions may wait, once that level is recorded; list them under
Deferred / skipped steps with the failing checks left open. A `HYG-03`,
`HYG-04` or `HYG-06` failure is a leaked credential, never a deferrable
gap: stop and show the Human the finding before going on, as on the full
path.

### Validate wiring (step 6)

This question is one of the four deferrable items. When the Human agreed to
defer it, ask nothing, write nothing, and record it under Deferred / skipped
steps with the reason and the remaining work: choose a wiring later.
Otherwise ask it as on the full path. Do not silently skip it.

### Hand-back (step 6)

The note's final sections include **Deferred / skipped steps** before it is
set `stable`.
