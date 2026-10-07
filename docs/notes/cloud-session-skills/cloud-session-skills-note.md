---
type: note
title: Cloud session skill smoke
description: Cursor and Claude Code read PR 49 through host operations on 74c34c6 with code-pr off the implicit list. Codex stayed on 47e781c and stopped.
status: draft
---

# Cloud session skill smoke

Wave 1 is commit `74c34c6` on `origin/cursor/9effdc94`. Each session was asked to check out that ref, run `code-review` on PR 49, and perform one host action: read the PR and its diff. `code-pr` stayed off the implicit session skill list in every report. The file was present at `.agents/skills/code-pr/SKILL.md`.

Cursor and Claude Code checked out `74c34c6` and completed that read. Codex never fetched the ref, so its stop is the old gate on `47e781c`.

## Codex

Smoke: stopped — origin/cursor/9effdc94 was not fetched, HEAD stayed 47e781c, and the missing-code-pr gate blocked the PR read.

## Cursor

Smoke: proceeded — read PR 49 and its diff through host operations while code-pr was off the implicit session skill list.

## Claude Code

Smoke: proceeded — read PR 49 and its diff through host operations while code-pr was off the implicit session skill list, on checkout 74c34c6.
