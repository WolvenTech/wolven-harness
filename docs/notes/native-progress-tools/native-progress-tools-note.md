---
type: note
title: Native progress tools in Claude Code, Cursor, and Codex
description: Identify callable progress tools, their session constraints, and the execution reporting fallback.
status: draft
---

# Native progress tools in Claude Code, Cursor, and Codex

## Question

How can `code-execute` maintain native progress in each active runtime, and which state still needs the chat checkpoint? This note supports [the execution reporting obligations](../../specs/archived/approval-summary/approval-summary-spec.md).

## Findings

### Claude Code

- When the Task tools are present, use `TaskList` to reconcile existing entries on resume. Create missing entries with `TaskCreate` and update the returned `task.id` using `TaskUpdate`. Put the wave and unit ID in the subject. `TaskUpdate` accepts status, active label, dependencies and owner. Where only `TodoWrite` is exposed, send the desired list using its `content`, `activeForm` and `status` fields. [Anthropic tool schemas](https://code.claude.com/docs/en/agent-sdk/typescript#tool-input-types), [Anthropic todo tracking](https://code.claude.com/docs/en/agent-sdk/todo-tracking).
- Availability varies by model, version and session. Anthropic documents `CLAUDE_CODE_ENABLE_TODO_TOOLS=1` as a startup opt-in for applicable sessions, and `CLAUDE_CODE_ENABLE_TASKS=0` selects `TodoWrite` where task tracking is available. The skill should use the current session's exposed tools and fall back to chat when absent. [Claude Code tool availability](https://code.claude.com/docs/en/tools#task-tool-availability).

### Cursor

- Cursor Agent has native **Agent To-dos** that it can update as work progresses. In the session, instruct the agent to use its exposed native todo updater. The local CLI probe emitted `updateTodosToolCall` with `merge` and `todos` in the event's arguments. That spelling is a CLI stream event key. [Cursor Agent To-dos](https://cursor.com/changelog/1-2), [local probes](#local-probes).
- For an ACP client, `cursor/update_todos` is an agent-to-client notification. Its items have `id`, `content` and `status`. With `merge: true` it updates the list by item, and with `merge: false` it replaces the list. `cursor/create_plan` is the separate approval interaction. For this skill, use the updater only when the session exposes it. There is no need to start an ACP client to update an existing Agent session. [Cursor ACP](https://cursor.com/docs/cli/acp#cursorupdate_todos).

### Codex

- If available, call `update_plan` with the complete `plan` list of `{step, status}` items and an optional `explanation`. Status values are `pending`, `in_progress` and `completed`. The tool description allows at most one item `in_progress`, and the handler rejects it in Plan mode. For parallel units, one active wave-level item can describe the batch while the checkpoint table shows each unit. [Codex tool schema](https://raw.githubusercontent.com/openai/codex/main/codex-rs/core/src/tools/handlers/plan_spec.rs), [Codex handler](https://github.com/openai/codex/blob/main/codex-rs/core/src/tools/handlers/plan.rs).
- Codex App Server delivers `turn/plan/updated` to a client as a notification. Its wire status is `inProgress` where the model tool uses `in_progress`. The current Codex session did not expose `update_plan`. A separate CLI probe also produced no observed todo event. [Codex App Server turn events](https://learn.chatgpt.com/docs/app-server#turn-events), [local probes](#local-probes).

### Applying the evidence

- Use the active session's callable tools and their schemas. The native view tracks live status. At unit finish, gates and wave transitions, post the chat table with a link to the real plan and with executor, blocker and evidence details the native view cannot represent. For any absent or failed tracker, report progress in chat. A failed check or pending Human decision stays open. [Execution reporting obligations](../../specs/archived/approval-summary/approval-summary-spec.md#r4--execution-reporting).
- Use the plan's execution/resume section as the record on resume. A checklist item, task owner or plan approval notification does not replace dispatch, the observed proof gate, or the required Human decision. [Execution workflow](../../../.agents/skills/code-execute/SKILL.md), [execution reporting obligations](../../specs/archived/approval-summary/approval-summary-spec.md#r4--execution-reporting).

## Local probes

On 2026-11-06, isolated temporary directories received a prompt to create two test items and show one in progress. The probes requested no project file edits. The results below describe the observed CLI events.

| Runtime | Invocation shape | Observation |
| --- | --- | --- |
| Claude Code 2.1.318 | `CLAUDE_CODE_ENABLE_TODO_TOOLS=1 claude -p --verbose --output-format stream-json --no-session-persistence`, limited to the four Task tools | Exit 0. Init listed `TaskCreate`, `TaskGet`, `TaskList` and `TaskUpdate`. The stream contained calls to `TaskCreate`, `TaskList` and `TaskUpdate`. |
| Cursor Agent 2026.10.22-27dcf5f | `agent --trust --print --output-format stream-json` in the empty scratch directory | Exit 0. The stream contained started and completed `updateTodosToolCall` events with `merge` and `todos` arguments. An initial invocation without scratch workspace trust stopped before model execution. |
| Codex CLI 0.163.0 | `codex exec --json --ephemeral --skip-git-repo-check --sandbox read-only` | Exit 0. The probe did not observe a `todo_list` event. This result does not establish whether other sessions expose the tool. |

## Sources

| Source | Type | Used for |
| --- | --- | --- |
| [Claude Code tools](https://code.claude.com/docs/en/tools#task-tool-availability) | Official docs | Task availability and startup options |
| [Claude Code TypeScript tool input types](https://code.claude.com/docs/en/agent-sdk/typescript#tool-input-types) and [todo tracking](https://code.claude.com/docs/en/agent-sdk/todo-tracking) | Official docs | Task schemas, statuses and ID reconciliation |
| [Cursor Agent To-dos](https://cursor.com/changelog/1-2) and [Cursor ACP](https://cursor.com/docs/cli/acp#cursorupdate_todos) | Official changelog and docs | Native capability and client notification |
| [Codex tool schema](https://raw.githubusercontent.com/openai/codex/main/codex-rs/core/src/tools/handlers/plan_spec.rs), [handler](https://github.com/openai/codex/blob/main/codex-rs/core/src/tools/handlers/plan.rs) and [App Server](https://learn.chatgpt.com/docs/app-server#turn-events) | Official source and docs | Tool inputs, Plan mode restriction and client event |

## Open questions

The live checks covered the local CLI sessions listed above. The Cursor desktop UI and a Codex session with the tracker exposed were not exercised. The execution workflow can select a tool from the active session at runtime and fall back to chat when unavailable. [Execution reporting obligations](../../specs/archived/approval-summary/approval-summary-spec.md#r4--execution-reporting).
