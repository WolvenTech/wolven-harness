---
type: note
title: Quiet-install persona fixture walk
description: Twelve independent Luna personas simulate the draft quiet-install journey, with observed Git effects, ranked findings and proposed spec edits.
status: draft
---

# Quiet-install persona fixture walk

On 2026-11-03, twelve independent `gpt-6-luna` agents acted as different
users, made choices and hand-applied the draft bootstrap in temporary
fixtures. The question was: can each user complete their story safely with
the proposed quiet install? The existing journey map was optional context;
no map was recreated or edited. Agents received their own scenario and the
source documents, without other agents' reports. Consolidation began after
all twelve finished.

**Verdict:** the selected Git footprint, copy-only migration, ignore
precedence and local clone recovery can be reproduced. The full-install
switch needs preservation and wiring rules, and the final commit list
conflicts with ignored runtime files. Existing runtime folders and initial
skill discovery also need explicit handling before implementation.

## Sources and evidence boundary

- [Draft spec](../../specs/quiet-install/quiet-install-spec.md), at commit
  `bc2ea82`: R1–R11 and its Human-facing wording table are the to-be source
  of truth.
- [Approved PRD](../../prds/quiet-install/quiet-install-prd.md): G1–G6 are
  the success signals; its older footprint list needs alignment with the
  later spec.
- [Existing map](../../specs/quiet-install/quiet-install-map.json): optional
  flow reference, including choices and example labels.
- [Copy review](../install-copy-review/install-copy-review-note.md):
  background only. Its old quotations do not override the spec.
- Starting states were deduplicated from the
  [desktop fixture note](../in-repo-harness-m/in-repo-harness-m-note.md),
  [ignore probe](../gitignored-harness-access/gitignored-harness-access-note.md),
  [jury map](../jury-verdict-journeys/jury-verdict-journeys-map.json), and
  `29809ad:docs/notes/repo-structure-journeys/repo-structure-journeys-map.json`.
  The bench repo's hypothesis-fixture vocabulary informed the separation
  between completed infrastructure and behavioral evidence.

The product is not built. A hand-authored filesystem transition establishes
what Git does with those bytes, not what future setup or an agent will
emit. No future doctor, validator, runtime loading or Claude desktop parity
passed in this campaign. Representative files and manual wiring were used;
they are not byte snapshots of the eventual product.

Two current-CLI calls were narrowly scoped: S12 checked the unchanged
subfolder refusal; the consolidation audit checked today's full-install
setup, which R5.5 invokes through unchanged R4.6. Neither is a run of the
future quiet installer. Repo build/validate at the end checks this note's
integrity, not the feature's acceptance proofs.

**Notation below:** `H` is the actual setup-visible set in a representative
fixture: root `.wolven-harness.json`, nested `.gitignore`, home `AGENTS.md`,
and the default rule/hook/ADR files. They have `??` status before commit.
Selected files vary by fixture; S11 uses a smaller set without a hook.
`clean` means empty `git status --porcelain=v1 --untracked-files=all`.
`M` and `D` mean modified and deleted tracked paths. Repeated unchanged
status is grouped to keep the action table readable. Full per-action raw
records remain at the temporary report paths listed below.

## Scenario × action table

| Case and user story | Setup / initial state | Choices and disk effects | Closing / later action and observed Git result | Verdict and source |
|---|---|---|---|---|
| S01 Ana: connect a fresh client repo quickly, then postpone commit | Hand-applied R4; `H`; package manifest preserved | Quick → quiet → default folders → root ignore → approve wiring; local links hidden | `H` plus new `.gitignore`; commit postponed. Agent also created root `AGENTS.md` under a map-driven assumption; that creation is excluded from the Claude-only baseline | Pass for modeled footprint; skill activation gap F5. R4.1–4.4, R5.2–5.6 |
| S02 Bruno: keep client instructions and existing skills across Claude, Codex and Cursor | `H`; client `AGENTS.md`, `CLAUDE.md`, real `.claude/skills/` and custom rule preserved | Block No leaves client bytes unchanged; later Yes appends one block to each instruction file. Wiring stops at occupied skills path and missing non-Claude table | `H` plus `M AGENTS.md`, `M CLAUDE.md`; client rule/skill unchanged. Block-only acceptance was explored separately from the blocked combined wiring transaction | Spec gap F4; evidence gap F6. R5.3–5.4, R6.1–6.2 |
| S03 Carla: copy a client's decision without changing client files | `H`; client ADR, source mentions and package manifest hashed | Guided → repo/role → copy ADR → skip research and suggestions → request score → manual checks → quiet/defaults/local excludes → approve existing-file blocks and wiring | Copied ADR adds one `??` home path; root instruction files `M`; original ADR/source/package hashes unchanged. No remote, so no init commit offer. Score unavailable; no product validation run | Pass for physical copy isolation; validator isolation unproved. R5.9–5.11, R2.3–2.4 |
| S04 Diego: share ADRs despite `docs/` and `*.md`, then diagnose a parent ignore | `H`; nested negations expose ADR/AGENTS/rules/hooks while skill and note stay ignored | Quick/defaults; selected paths committed locally → `clean` | Client adds root `.wolven-harness/`; new ADR becomes invisible; status only `M .gitignore`. `check-ignore --no-index -v` names that root rule | Pass for Git precedence; doctor finding projected. R2.5, R3.1, R4.2 |
| S05 Elisa: keep private notes out of Docker packaging and approve client changes | `H`; private note ignored; existing `.dockerignore` unchanged | Quick/defaults/local excludes; decline wiring, then approve the reviewed diff | Decline preserves prior outside-home state; approval adds only `M .dockerignore` outside home, with `+.wolven-harness/`; private note still ignored | Pass for diff-controlled edit; Docker build untested; wording contradiction F7. R5.3, R5.6 |
| S06 Fabio: preserve decisions in a local repo without a remote | `H`; no remote; existing instruction files | Quick/quiet/defaults/local excludes; approve wiring and existing-file blocks | `H` plus `M AGENTS.md`, `M CLAUDE.md`; init gives no commit offer. A separate explicit user request commits named trackable paths locally → `clean` | Pass for no-offer rule and local Git capability. R5.6; no change to settled no-remote behavior proposed |
| S07 Giovana: activate Claude in a teammate's fresh clone | Donor's selected paths/config committed; clone `clean`; ignored skills and local wiring missing | Modeled create-only setup restores ignored files; local-exclude wiring; existing tracked instruction block preserved | Restored skill uses prefixed docs paths; tracked-file list unchanged and status remains `clean` | Pass for modeled recovery effects; activation copy gap F5. R4.5, R5.3 |
| S08 Hugo: read a note, write a branch ADR, then write a note in a worktree | Real Git worktree contains only committed harness paths, status `clean` | Claude copy behavior manually assumed; existing unticked note read fails, main-checkout read succeeds | New ADR is `??`, commits on feature branch; base stays `clean`. New note is ignored, absent from base/branch, readable only in worktree | Expected local-doc limitation, not a new defect. R5.2, R5.6; R10 desktop proof outstanding |
| S09 Ines: switch an edited quiet install to full install | Tracked rule and ignored custom skill; local notes/specs; Claude wiring | Root docs collision blocks without hash changes; user moves collision aside; decline also preserves hashes; second confirmation accepted | Literal move-docs/delete-home removes custom skill/rule and leaves dangling links; moved local docs become root `??` paths. Agent approximated root scaffold; separate audit below verifies current setup's dependency behavior | Contradiction/spec gaps F1–F2. R5.5, R4.6 |
| S10 Joao: upgrade an existing root install, then consider fresh quiet setup | Existing root layout/custom files committed | Modeled R4.6 updates package version metadata only; no quiet conversion; chooses manual guide | `M .wolven-harness.json`; custom-file hashes preserved. Stops before removal because future guide has not been authored; no guessed migration | Boundary pass; R9.1 guide remains a deliverable, not a demonstrated product failure |
| S11 Katia: use one harness for two sibling client repos | Unversioned parent; two independent Git roots | Outside mode and singular `codeRepo` reviewed as existing boundaries; chooses separate quiet installs at each root | Minimal per-root fixtures expose only their harness paths; client README/AGENTS hashes unchanged. Original outside workflow was reviewed, not fully executed | Boundary pass; no multi-repo feature requested. R4.1, R4.6 and unchanged outside mode |
| S12 Luis: retain a sibling harness and reject accidental setup in `app/src` | Separate harness/client repos, external-linked config, both `clean` | Current CLI subfolder call exits 1 before writes; no conversion applied | Both repos remain `clean`, all file hashes identical. Sibling rerun is a modeled unchanged-scope outcome only | Observed refusal pass; sibling scope preserved, rerun not proved. R4.6, PRD AC-1.3 |

Questions without disk effects retain the preceding status. Doctor choices
in raw feedback are expectations, never observed results. S01/S05 and S03
sometimes applied local excludes before final wiring approval; those
fixtures establish state outcomes only. They do not prove R5.3's required
single approval transaction. That requirement stays intact.

## Wording the users encountered

These are the authoritative shared prompts behind the action table.
Runtime names and paths are substituted for the actual case. When the
future artifact supplies no exact string, the reports label their text as
assumed or proposed; it is not an observed product message.

| Action | Spec wording / consequence |
|---|---|
| Introduction | “The harness is the set of instructions, rules and doc folders your coding agent follows. In a quiet install it lives in `.wolven-harness/`. Before anything outside that folder changes, you see the diff and say yes. Nothing is ever pushed.” |
| Path | “How much setup do you want right now?” Quick connects the named runtimes; Guided offers each remaining step individually |
| Guided opening | “What's this repo for, and what's your role in it?” |
| Guided step | “Next: <what the step does, in one line, with any tracked change named>. Run it, or skip?” |
| Migration | “Copy `<file>` into the harness as a decision record? Your file is not changed.” |
| Checks | “How should we check the harness?” Manual recommended, pull-request CI opt-in, plus Skip on Guided |
| Layout | “How much of the harness do you want to version in git?” Quiet or Full, with the spec's descriptions |
| Versioning | “Which harness folders should git track?” Rules/hooks/decision records default on; notes/requirements/specs/postponed work off. Home `AGENTS.md` mandatory |
| Ignore | “How should we ignore the harness local-only files?” Tracked root `.gitignore` or local `.git/info/exclude` |
| Existing instructions | “Add the harness block to <file names>?” Yes/No; only applicable existing files, or create `AGENTS.md` for a runtime requiring it |
| Wiring | “Create the harness symlinks for <runtime names>?” One diff includes hooks, ignore lines and tracked changes |
| Commit | “Commit these <N> files to `<branch>`? Nothing is pushed.” One offer, at the end |
| No remote | “This repo has no remote, so there is nothing to commit for. Your changes stay in the working tree.” No init commit offer |
| Switch block | “Can't switch to a full install: `<path>` already exists at the repo root. Nothing changed. Move or rename it, then ask again.” |
| Switch confirm | “Apply this switch? It removes `.wolven-harness/` and adds tracked files at the root.” |

## Ranked findings and proposed spec text

Each proposal is text for a later Human-reviewed spec pass. None was
applied. Priorities describe effects on the user stories, not code defects
in an implementation that does not yet exist.

### F1 — P1: accepted layout switch deletes user-edited harness content

**Goals:** G1 and safe transition to G5. **Source:** S09; R5.5, R11.1;
PRD AC-8.2's preservation precedent is for manual removal, not this switch.
R5.5 moves docs but deletes the rest of the home. An ignored custom skill
is physically lost without appearing as a deletion in Git status. The
edited tracked rule is recoverable from history but not carried into the
full install. A deletion summary alone does not identify these contents.

**Proposed R5.5 addition:** “Before removing the quiet-install home,
inventory ignored files as well as tracked files. Show where every edited
or user-added skill, rule and hook will be preserved. If preservation has
no agreed destination, stop before applying the switch and name the file
to copy aside. Include these preservation steps in the one switch diff and
confirmation; do not remove the only copy of user content.”

### F2 — P1: switching leaves quiet-install wiring pointing at deleted paths

**Goals:** G2/G3. **Source:** S09 plus consolidation audit; R5.5, R4.6,
R6.1. The accepted switch leaves `CLAUDE.local.md`, `.claude/skills`,
per-rule links and `.qmd` pointing into the removed home. Current
full-install setup returns exit 0 and keeps these existing links rather
than repairing them. Local hook settings and quiet ignore entries also
retain their old paths. Rerunning setup alone is insufficient.

**Proposed R5.5 addition:** “The switch diff includes existing quiet-install
links, harness hook commands, worktree-copy entries, client instruction
blocks and harness-added ignore lines. Retarget or remove only
harness-owned entries for the full install, preserving unrelated client
content. After setup reruns, verify the selected runtime targets resolve
and no active harness instruction or hook still points into the removed
home. Stop and name any entry whose ownership is unclear.”

### F3 — P1: final commit list includes files required to stay ignored

**Goals:** G1/G6. **Source:** consolidation audit of S01/S05/S06's closing
path; R5.3, R5.6, R8.2. R5.6 includes “each root file it created or edited”
and passes “those paths” to `code-commit`; that includes ignored runtime
files. Explicit `git add -- <list>` exits 1 for them. It can stage the
eligible subset before failing, leaving a partially staged tree. Force
adding would instead publish local wiring/settings without a separate
sharing choice.

**Proposed R5.6 replacement for path selection:** “Show all created and
edited paths in the closing inventory, distinguishing commit candidates
from local-only files. Offer and pass to code-commit only the selected
trackable paths and approved tracked client edits. Ignored runtime files
stay local and are not force-added by this offer. Keep the single final
offer, branch name and nothing-pushed statement.”

### F4 — P1: occupied runtime paths need an explicit quiet-install stop

**Goals:** G1/G3. **Source:** S02; R5.3/R6.1 and existing
`harness-init/references/layout.md`, “Bootstrap copies”. Bruno's real
`.claude/skills/` cannot also be the required whole-directory symlink.
Existing copy-preservation guidance is useful, but the new quiet section
does not explicitly connect this conflict to its one wiring diff or say
how to finish with this runtime left unwired. No client folder was removed
in the simulation.

**Proposed R5.3 addition:** “Preflight each runtime destination before the
combined diff. Reuse the existing bootstrap-copy preservation rule:
preserve client-owned, edited or unrecognized content. When it prevents the
specified link, leave that runtime unwired and name the path and next
manual step; do not replace it to force success. Include the preserved and
unwired state in the closing report and doctor finding.”

### F5 — P2: initial activation assumes a discoverable skill before wiring

**Goal:** G3; recovery also affects G6's clean-clone story. **Source:**
S01/S07 and audit; R4.3–4.5, R5.1, R6.1. Setup intentionally creates no
runtime wiring. The initial `harness-init` skill is inside an ignored
nonstandard home path. The next step only names the skill; it does not
tell a fresh agent how to read it. A clone lacks the local skills until
setup restores them. Supplying the source path explicitly is sufficient;
this does not require a second command or a new feature.

**Proposed R4.3/R4.5 addition:** “Print a bootstrap instruction naming
`.wolven-harness/.agents/skills/harness-init/SKILL.md`: ask your coding
agent to read that file and follow it to connect the harness. For a fresh
clone, first run setup at the repository root to restore missing local
files, then follow that instruction. Do not assume the skill is registered
before wiring.”

### F6 — P2: non-Claude runtime choices cannot yet be simulated fully

**Goal:** G3. **Source:** S02; R6.2/R3.3. R6.2 requires a source-backed
runtime table as a future deliverable but does not provide its entries.
Bruno cannot review the intended Codex/Cursor wiring or manual fallback
from the frozen sources alone. This is a design-evidence gap, not evidence
that either runtime cannot load ignored files.

**Proposed R6.2 addition:** “Before locking the wiring design, record the
quiet-install table for every registry runtime: entry paths, documented
source and the manual step when no suitable ignored path is available.
Use the same table for the wiring diff and doctor fixtures.” No runtime
research or new integration was added in this campaign.

### F7 — P2: packaging warning must reflect an approved Docker exclusion

**Goals:** G1/G6 and accurate disclosure. **Source:** S05; R5.3/R5.6.
R5.3 adds `.wolven-harness/` to an existing `.dockerignore`; R5.6 still
says a Docker context picks up the whole home because it ignores
`.gitignore`. The warning is conditional on packaging exclusions. No image
was built in this campaign.

**Proposed R5.6 wording:** “Packaging that does not apply Git ignore rules
can include the whole harness, including unticked docs. The approved
`.dockerignore` line excludes `.wolven-harness/` from that Docker context.
Archives and rsync deployments need their own exclusions. If Docker has
no applicable exclusion, the harness can be included.”

### F8 — P3: PRD footprint list predates mandatory config and instruction files

**Goal:** G1. **Source:** S01/S03/S04/S05; R4.1–4.2, R5.4/R5.6. G1's
older enumerated status list omits root config, mandatory home `AGENTS.md`
and approved client instruction or Docker edits. These are expressly
allowed by the newer spec, so they are not unapproved footprint leaks.

**Proposed spec grounding clarification:** “For footprint checks, include
root `.wolven-harness.json`, nested `.gitignore`, home `AGENTS.md`, selected
home paths and each explicitly approved client tracked edit. The earlier
PRD G1 status enumeration must be aligned with this list.”

## Rejected findings and remaining proof limits

- **G6 does not require ignoring the home.** S01/S07 read “doctor reports a
  root ignore rule” as an instruction to add one. It means detect the
  problematic rule. S04 demonstrates exactly why. No G6 contradiction is
  retained.
- **Guided checks already has Skip.** R5.9, R5.11 and map `i-checks` all
  include it. S03's contrary finding was rejected.
- **Nested-ignore parent traversal is already an obligation.** Several
  first fixture drafts omitted parent/descendant negations. Corrected
  patterns worked. This is an implementation trap to cover with the
  existing R4.2/R2.5 proofs, not a need for another configuration option.
- **Client ADR collision handling already exists.** The migration reference
  says preserve the number and stop on collision. R5.10 changes moving to
  copying; no renumbering policy is proposed. Original client content must
  remain unchanged.
- **A Claude-only fresh repo does not automatically need a new root
  `AGENTS.md`.** R5.4 names the runtimes that require creation. S01's
  map-driven creation is an assumption, not evidence of a required change.
- **Unticked docs and worktree loss are settled behavior.** S08 reproduced
  missing existing notes and ignored branch-local writes. R5.6 already
  discloses both. This campaign does not request syncing or forced tracking.
- **No-remote commit suppression remains settled.** S06 followed it; a
  separately requested local Git commit works. The optional map's generic
  commit card is not an instruction overriding R5.6.
- **Full install intentionally exposes the whole harness to Git.** S09's
  moved notes/specs becoming visible is part of that selected layout. The
  diff must disclose it, but no new privacy mode is proposed.
- **R9.1's manual guide is unbuilt.** S10 stopped before guessed removal.
  Its missing implementation is not counted as a new defect; the guide
  must still enumerate config/wiring cleanup and preservation before use.
- **Outside/multi-repo/sibling boundaries stay unchanged.** S11/S12 do not
  authorize conversion or multi-repo support. `U-sibling-verdict`,
  `U-score-quiet`, Cursor load uncertainty and R10 remain open as recorded.

## Feedback on the existing map

These normalized excerpts attach feedback to existing node IDs only.
Persona actions absent from the map remain in the scenario table. Raw
reports sometimes invented IDs or selected hypothetical doctor outcomes;
those lines are not treated as actual map feedback or product proof.
Repeated decisions belong to separate runs, not one exported interaction.

```text
journey-map feedback for docs/specs/quiet-install/quiet-install-map.json
s-done "Quiet install": note "S01/S07: print the explicit harness-init file path; the skill is not registered yet. A teammate must first rerun setup to restore it."
i-path "How much setup do you want right now?": chose quick "Quick setup"
i-version "Which harness folders should git track?": ticked rules, hooks, adrs; unticked notes, specs, deferrals
i-wire "Create the harness symlinks for Claude Code?": note "S02: an existing client .claude/skills directory blocks the required symlink. Preserve it and report the unwired runtime."
i-commit "Commit these 6 files to feature/x? Nothing is pushed.": note "Audit: the commit candidate list must exclude ignored local runtime files even though the closing inventory lists them."
```

```text
journey-map feedback for docs/specs/quiet-install/quiet-install-map.json
i-path "How much setup do you want right now?": chose guided "Guided setup"
i-role "What's this repo for, and what's your role in it?": typed "Client billing API; I'm a contractor on the billing team."
i-g-mig "Next: copy your old decision records into the harness. Run it, or skip?": chose run "Run it"
i-g-research "Next: look up your tools' public docs (up to 5 pages). Run it, or skip?": chose skip "Skip it"
i-g-skills "Next: suggest template skills for this repo. Run it, or skip?": chose skip "Skip it"
i-g-score "Next: check how complete the setup is (harness score). Run it, or skip?": chose run "Run it"
i-checks "Next: choose how the harness gets checked. How should we check it?": chose manual "Only when I run it"
i-version "Which harness folders should git track?": note "S03: copied decision visible under the home; original client ADR/source/package hashes unchanged. No validator or score pass claimed."
```

```text
journey-map feedback for docs/specs/quiet-install/quiet-install-map.json
i-ignores "How should we ignore the harness local-only files?": chose exclude "Only on this machine: .git/info/exclude"
i-wire "Create the harness symlinks for Claude Code?": chose no "No"
i-wire "Create the harness symlinks for Claude Code?": note "S05 first attempt: declined wiring; prior outside-home state preserved."
```

```text
journey-map feedback for docs/specs/quiet-install/quiet-install-map.json
i-wire "Create the harness symlinks for Claude Code?": chose yes "Yes, create them"
i-wire "Create the harness symlinks for Claude Code?": note "S05 later attempt: approved .dockerignore line; qualify the packaging warning accordingly."
i-commit "Commit these 6 files to feature/x? Nothing is pushed.": note "S06: no remote means no offer under R5.6; the later local commit was a separate explicit request."
i-done "Harness connected": note "S08: only tracked folders arrive via Git; manually simulated Claude copies do not establish desktop parity. Unticked note read failed; branch ADR was committable."
```

```text
journey-map feedback for docs/specs/quiet-install/quiet-install-map.json
i-layout "How much of the harness do you want to version in git?": chose switch "Switch to a full install"
i-switch "Apply this switch? It removes .wolven-harness/ and adds tracked files at the root.": chose no "No, keep the quiet install"
i-switch "Apply this switch? It removes .wolven-harness/ and adds tracked files at the root.": note "S09 first attempt: refusal preserved file hashes; collision block also preserved them."
```

```text
journey-map feedback for docs/specs/quiet-install/quiet-install-map.json
i-switch "Apply this switch? It removes .wolven-harness/ and adds tracked files at the root.": chose yes "Yes, apply it"
i-switched "Full install": note "S09 later attempt and audit: custom skill/rule deleted; existing links dangle after current full setup returns success. Preserve user content and repair the owned wiring in the switch diff."
```

S04's later parent-ignore change, S07's clone, S08's branch writes, S10's
manual route and S11/S12's scope checks have no dedicated map nodes. Their
absence does not justify rebuilding the map for this campaign.

## Temporary campaign records and reproduction

These files are disposable evidence outside the repository. The tables and
findings above preserve the conclusions if the OS removes them. There is
no aggregate product score: a completed agent run is infrastructure
completion, not a feature pass. The twelve reports contain independent
choices and command evidence; the rejected-findings section controls which
conclusions survive review.

| Case | Independent report | Reproduction / retained fixture |
|---|---|---|
| S01 | `/tmp/quiet-walk-s01.md` | `bash /tmp/quiet-walk-s01/reproduce.sh` |
| S02 | `/tmp/quiet-walk-s02.md` | `/tmp/quiet-walk-s02/repo`; report lists hash/status/check-ignore probes; no single rebuild script supplied |
| S03 | `/tmp/quiet-walk-s03.md` | `/tmp/quiet-walk-s03.py`; `/tmp/quiet-walk-s03-fixture` |
| S04 | `/tmp/quiet-walk-s04.md` | `bash /tmp/quiet-walk-s04.sh` |
| S05 | `/tmp/quiet-walk-s05.md` | `bash /tmp/quiet-walk-s05.sh` |
| S06 | `/tmp/quiet-walk-s06.md` | `bash /tmp/quiet-walk-s06-fixture.sh` |
| S07 | `/tmp/quiet-walk-s07.md` | `python3 /tmp/quiet-walk-s07.py` |
| S08 | `/tmp/quiet-walk-s08.md` | `bash /tmp/quiet-walk-s08-driver.sh` |
| S09 | `/tmp/quiet-walk-s09.md` | `bash /tmp/quiet-walk-s09.sh`; note its simplified scaffold/ignore assumptions; audit below supersedes them for F1–F3 |
| S10 | `/tmp/quiet-walk-s10.md` | `bash /tmp/quiet-walk-s10.sh` |
| S11 | `/tmp/quiet-walk-s11.md` | `sh /tmp/quiet-walk-s11-repro.sh` |
| S12 | `/tmp/quiet-walk-s12.md` | `/tmp/quiet-walk-s12-prototype.sh`; `/tmp/quiet-walk-s12-evidence.txt` |
| Audit | `/tmp/quiet-walk-audit-evidence.txt` | `python3 /tmp/quiet-walk-audit.py` |

The scripts recreate or mutate their own temporary fixtures; inspect them
before rerunning. Some are step drivers rather than fresh-build launchers.
No fixture is proposed for promotion into package code or a permanent test
framework. Retain the temporary evidence for review, then discard it.

### Consolidation audit: exact commit and switch evidence

The audit uses traversable parent negations in the nested ignore, valid
schema config and R6.1-shaped relative links. It supplements S09's minimal
scaffold and malformed skills-link approximation without rerunning another
persona. Its fixture was
`/var/folders/b7/xt1cddcn4jz66x4yk95cqnww0000gn/T/quiet-walk-audit-joyu1wl2`.

After modeled setup, actual status was:

```text
?? .wolven-harness.json
?? .wolven-harness/.agents/hooks/custom.mjs
?? .wolven-harness/.agents/rules/custom.md
?? .wolven-harness/.gitignore
?? .wolven-harness/AGENTS.md
?? .wolven-harness/docs/adrs/example.md
```

After approved wiring, the root `.gitignore` hides the R6.1 local paths.
Staging the R5.6 literal inventory was tested with:

```sh
git add -- .gitignore .wolven-harness.json \
  .wolven-harness/.gitignore .wolven-harness/AGENTS.md \
  .wolven-harness/.agents/rules .wolven-harness/.agents/hooks \
  .wolven-harness/docs/adrs CLAUDE.local.md .claude/skills \
  .claude/rules/ .claude/settings.local.json .worktreeinclude .qmd
```

Exit was 1, naming the six ignored runtime destinations. `git diff
--cached --name-only` nevertheless listed the seven eligible candidates.
Resetting and staging only those candidates succeeded. The private note
and custom skill stayed ignored. No force-add was used.

The literal accepted R5.5 switch then moved docs, removed the home and
rewrote only layout/harnessHome in config. Custom skill and rule had no
remaining full-install copy. The following links all failed `exists()`:

```text
CLAUDE.local.md -> .wolven-harness/AGENTS.md
.claude/skills -> ../.wolven-harness/.agents/skills
.claude/rules/custom.md -> ../../.wolven-harness/.agents/rules/custom.md
.qmd -> .wolven-harness/.qmd
```

The current built CLI's unchanged full-install setup was then run in that
temporary fixture with explicit flags:

```sh
node <source-worktree>/dist/cli.js setup \
  --git-host gh --runtimes claude --skills ship --package-manager none
```

It exited 0 and printed “kept your existing .claude/skills” and “kept your
existing .claude/rules”. All four links above still dangled afterward.
Status showed old tracked home files deleted, new root scaffold/docs
untracked and modified root config. This is direct evidence about the
unchanged dependency invoked by the proposed switch, not future
quiet-install or desktop proof.

## Handoff

Only this draft note is added to the repository. The spec, map, PRD,
templates and package code are unchanged. No repository commit or push was
made. Spec edits and any design decisions remain for the subsequent
Human-reviewed pass; this campaign does not approve the spec or authorize
implementation.

Repository checks after writing the note: `pnpm build`,
`node dist/cli.js validate` and `pnpm comments` exited 0; validation reported
zero failed claims and comments reported zero findings. The local QMD
index and embeddings were refreshed. No feature test or desktop proof is
implied by these documentation checks.
