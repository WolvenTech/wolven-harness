---
type: prd
title: Approval summaries and execution progress
description: Give Humans enough context to review drafts in chat and follow the approved work as it runs.
status: stable
---

# Approval summaries and execution progress

## Problem

- **Who** — Humans who approve artifacts, follow the work through `code-execute`, and review the resulting PR.
- **Pain** — The Human must open an artifact to understand what they are approving when the chat summary omits requirements, decisions, or changes. During execution, the Human must piece together which units are running, who is running them, and how far the current wave has progressed.
- **Why now** — The three drafting skills already ask for Human approval, but the information at those gates varies by run. `code-execute` already has a pre-start print and a Done-when checklist for each unit, so it has the context needed to report progress as work advances.
- **Evidence** — In the `one-man-team` example, a concise summary of an eight-repo spec gave the reviewer enough context to approve or push back from chat. The Human expanded the issue's scope to include ongoing execution progress. [Issue #81](https://github.com/WolvenTech/wolven-harness/issues/81)

## Goals

- **G1 — Make initial drafts reviewable from chat.** A reviewer can identify the artifact, understand its main requirements, and see which decision is being requested from a compact approval summary.
- **G2 — Make material revisions reviewable from chat.** A reviewer can identify what changed since the previous draft, how their feedback was applied, and what remains open.
- **G3 — Keep the approval summary consistent across the three skills.** A repository check detects when a skill used in this repo or shipped to consumers loses the summary requirement or its reference to the shared format.
- **G4 — Make execution progress visible while work is in flight.** The Human can see the current wave, which units are running, their execution mode and assignee, and the state of the wave's gate. When Claude, Cursor, or Codex exposes a native progress tool in the active session, that tool shows the current state.
- **G5 — Make review outcomes actionable from chat.** The reviewer can see the PR, verdict, blocking findings, minor adjustments, and next action in one message.
- **G6 — Give PR reviewers the context that explains the diff.** Reviewers can follow links to the relevant artifacts and see decisions within the existing body format.

**Non-goals**

- Changes to approval authority or to the lifecycle of PRDs, specs, and plans.
- A new PRD verdict field or classification step.
- A separate persisted execution log. The plan's execution/resume section remains the record for resuming work.

## User stories

### US-1: Review a first draft from chat

**As a** Human reviewer,
**I want** a compact approval summary alongside the first draft,
**so that** I can approve it or request changes from chat.

Traces to goal G1.

#### AC-1.1: Summarize the draft before asking for approval

**Given** one of the three skills has written its first draft\
**When** the agent asks for approval\
**Then** the chat summary includes a clickable link to the actual artifact, its status, and its commit state, followed by a compact requirements summary, material findings from source checks, Human decisions and where they landed, open items, and the decision requested. The requirements summary covers:

| Skill | Contents |
| --- | --- |
| `create-prd` | Confirmed problem statement and one row per user story with its acceptance-criteria count |
| `code-spec` | One row per wave, with affected repos or surfaces, main obligations, and named proofs |
| `code-plan` | Waves and their gates, including what each gate blocks. Use a horizontal divider before the first wave, between waves, and after the last wave. Include a table of work units only when the plan has one wave or fewer than ten units in total. Each unit row gives its wave, owned paths, Done when, and Subagent value. |

#### AC-1.2: Represent missing information accurately

**Given** the draft has no material findings, no open items, or no defined waves\
**When** the agent prepares the summary\
**Then** it marks the empty sections as “None” and presents any unphased requirements or units without inventing waves. It leaves out the revision delta for a first draft.

#### AC-1.3: Make Human gates visible

**Given** the artifact awaits approval or defines a later gate that requires a Human decision\
**When** the agent presents the summary\
**Then** it highlights each Human gate separately from automated checks, names the decision and who must make it, and states what waits for that decision.

### US-2: Review a material revision from chat

**As a** Human reviewer,
**I want** the updated summary to show the delta from the preceding draft,
**so that** I can check whether the revision resolves my feedback.

Traces to goal G2.

#### AC-2.1: Explain the revision at the next approval request

**Given** a skill has revised a draft in a way that affects the approval decision\
**When** the agent presents it for approval again\
**Then** the updated summary links to the current artifact, includes a concise delta from the preceding draft, maps each Human decision from the round to its place in the artifact, and identifies any remaining open questions, Unresolved rows, or Human gates.

#### AC-2.2: Keep unresolved feedback visible

**Given** a reviewer raised an item that remains unresolved after the revision\
**When** the agent reports what changed\
**Then** the item stays visible as open and the delta distinguishes it from changes already incorporated.

### US-3: Preserve the summary requirement across skill copies

**As a** harness maintainer,
**I want** the three skills to follow one shared summary format,
**so that** reviewers receive the same categories of information regardless of the skill they use.

Traces to goal G3.

#### AC-3.1: Verify the approval-summary requirement

**Given** the repo and consumer versions of the three skills\
**When** the repository check runs\
**Then** it verifies that each skill points to the shared format and requires the summary for the first draft and each material revision before asking for approval.

#### AC-3.2: Detect drift

**Given** one covered skill copy loses that requirement or its shared reference\
**When** the repository check runs\
**Then** it fails and identifies the affected skill copy.

### US-4: Follow work in progress during execution

**As a** Human following an execution,
**I want** an up-to-date summary of the current wave and its work units,
**so that** I can tell what is underway, what has passed its checks, and what needs attention.

Traces to goal G4.

#### AC-4.1: Show the wave and each active unit

**Given** `code-execute` starts or resumes an approved wave\
**When** a unit starts or changes state, or the wave reaches its gate\
**Then** the summary links to the actual execution plan and shows the wave, unit ID and title, current activity and status, and execution mode. It shows the actual subagent name or identifier for `spawn` and `inline` for work in the current session. Concurrent units appear separately. At the wave gate, the summary shows the validation result and what can proceed.

#### AC-4.2: Keep native progress tracking current

**Given** the active Claude, Cursor, or Codex session exposes a native progress tool\
**When** execution starts, a unit changes state, or a wave gate resolves\
**Then** `code-execute` tracks progress in the tool's native format. If the tool cannot display a required detail, the agent includes that detail in chat.

#### AC-4.3: Fall back to chat when tracking is unavailable

**Given** the session has no native progress tool or an update to it fails\
**When** execution reaches a progress milestone\
**Then** the agent reports the same progress in chat. For work without a wave in the plan, it reports the active work and execution mode without assigning a wave.

#### AC-4.4: Surface blocked or failed work

**Given** a unit is blocked, a subagent fails, or a required check fails\
**When** the agent updates the summary\
**Then** it identifies the affected unit or gate, reports the blocker or failure and the next action, and leaves completion pending until the required checks pass. The tracker reflects the observed state and preserves the plan's dispatch and wave gates.

#### AC-4.5: Surface a Human gate during execution

**Given** execution reaches a gate that already requires a Human decision\
**When** the agent reports progress\
**Then** the summary highlights the pending decision, who must make it, and which work is waiting. The affected work stays paused until the decision is recorded.

#### AC-4.6: Publish a checkpoint in chat

**Given** a unit finishes, execution reaches a gate, or execution transitions between waves\
**When** the agent reports the milestone\
**Then** it posts a chat checkpoint with a link to the plan when one exists, the current wave, and a compact table of relevant units showing who is executing, current state, and latest activity or result. It names the next action or what is blocked, including the gate outcome when available. This checkpoint also appears when native progress tracking is active.

### US-5: Read the review outcome in chat

**As a** Human who requested a PR review,
**I want** a compact review summary in chat,
**so that** I can see the verdict and decide what to do next.

Traces to goal G5.

#### AC-5.1: Summarize the review

**Given** `code-review` reaches a verdict\
**When** it closes the review in chat\
**Then** it links the actual PR and shows the verdict, blocking findings, minor adjustments, and next action. Label minor adjustments “Ajustes menores” in Portuguese and “Non-blockers” in English. The findings posted on the PR remain the review record.

#### AC-5.2: Show empty categories and verification gaps

**Given** a finding category is empty or a required review axis could not be checked\
**When** the skill writes the summary\
**Then** it marks empty categories explicitly and identifies any unchecked axis that affects the handoff.

### US-6: Follow the decisions behind a PR diff

**As a** Human reviewing a PR,
**I want** relevant artifact links and decisions in the PR body,
**so that** I can trace the diff to the agreed scope and design.

Traces to goal G6.

#### AC-6.1: Add context within the existing body

**Given** `code-pr` is opening or amending a PR with relevant artifacts or decisions\
**When** it fills the body\
**Then** it keeps Summary, Verification, and Before merge, links the relevant artifacts where reviewers can open them, and includes only decisions that explain the current diff.

#### AC-6.2: Omit unavailable context

**Given** there is no relevant artifact or no recorded decision for the diff\
**When** the skill fills the body\
**Then** it omits the corresponding entry and keeps verification tied to evidence from the current session.

#### AC-6.3: Make the existing body easy to scan

**Given** a reviewer opens the PR body\
**When** it renders as Markdown\
**Then** the three sections are visibly separated, each Summary field reads on its own line, and verification commands are formatted as code. Before merge shows the general checklist first, then a Manual test subsection with a separate checkbox for each PR-specific manual scenario.

## Scope

**In**

- Chat summaries for `create-prd`, `code-spec`, and `code-plan` in this repo and in shipped templates.
- First drafts and material revisions presented for Human approval.
- Ongoing progress summaries for `code-execute` in this repo and in shipped templates, including wave gate results and native tracking when available.
- A distinct `code-review` chat summary and relevant context in the existing `code-pr` body, in this repo and in shipped templates.

**Out**

- Changes to review verdicts, host posting, merge authority, or the three-section PR body structure.

## Open questions

None.

## Handoff

After approval, hand the PRD to `code-spec`.
