---
type: note
title: Cloud session skill smoke
description: Codex, Cursor, and Claude Code read PR 49 through host operations on updated checkouts with code-pr off the implicit list.
status: draft
---

# Cloud session skill smoke

Wave 1 is commit `74c34c6` on `origin/cursor/9effdc94`. Each session was asked to check out that ref, run `code-review` on PR 49, and perform one host action: read the PR and its diff. `code-pr` stayed off the implicit session skill list in every report. The file was present at `.agents/skills/code-pr/SKILL.md`.

Cursor and Claude Code checked out `74c34c6` and completed that read. The first Codex attempt stayed on `47e781c` and exercised the old gate; it was a preparation failure. The Human supplied a repeat Codex cloud report on `17dcb54cdc835acf795bd7cd946d7e694f51f38b`, with the changed predicate in the checkout.

## Codex

Smoke: proceeded — read PR 49 and its diff through MCP GitHub on checkout 17dcb54cdc835acf795bd7cd946d7e694f51f38b while code-pr was off the implicit session skill list and installed on the accepted project path.

The repeat used a clean temporary worktree from `origin/cursor/9effdc94`, with detached HEAD at that SHA. `git merge-base --is-ancestor 74c34c6 HEAD` exited 0. Before loading companions, neither `code-review` nor `code-pr` appeared in the runtime catalog; the cloud skill listing was exhausted and the executor listing was empty. `test -f .agents/skills/code-pr/SKILL.md` exited 0.

The session read `code-review/SKILL.md`, `code-pr/SKILL.md`, and `code-pr/references/host-operations.md` from the updated checkout. With `gitHost: gh`, it called `mcp__codex_apps__github_get_pr_info` and `mcp__codex_apps__github_get_pr_diff` for PR 49. Both returned `isError: false`; the diff had 47,867 characters and 15 `diff --git` headers. A second display covered the initially truncated output.

The available MCP operations were equivalents of the table's unavailable literal `pull_request_read`; no `gh` fallback was needed. Preparation passed and the absent-companion-catalog condition was exercised. The smoke performed reads only, preserved both checkouts, and did not publish a review or validate architecture claims. This evidence is from the Human-supplied handoff, `/tmp/codex-cloud-smoke-pr-51.md`, rather than a local rerun.

## Cursor

Smoke: proceeded — read PR 49 and its diff through host operations while code-pr was off the implicit session skill list.

## Claude Code

Smoke: proceeded — read PR 49 and its diff through host operations while code-pr was off the implicit session skill list, on checkout 74c34c6.
