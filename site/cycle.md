---
description: Specify, plan, and implement a small change with your coding agent.
---

# Daily use

After [Setup](./harness-init), try a small change: add a retry limit to outbound calls.

## Specify

Use `code-spec` to start a new code development. For example:

> “I need to limit outbound calls to three retries and add a test that proves we stop at the cap.”

The agent reads the documentation, then writes a document with the requirements and how to verify them. You then review and approve the spec before implementation.

## Plan

Ask for `code-plan` along with a clear implementation description or a spec written with `code-spec`.

The agent identifies the files to change, the tests to add, and the checks to run. Then presents you with a task plan that covers each implementation wave and the verification gates. You approve the plan before work starts.

## Execute

Ask for `code-execute` and the agent makes a code change and runs the tests and harness checks. If you pass along a plan written with `code-plan`, it can orchestrate subagents to execute it in one go, stopping at the defined human gates.

You review the diff and results, then proceed.

## Commits and pull requests

By default, the work stays uncommitted until you ask for `code-commit`.

You can enable automatic commits in `.agents/code-commit.config.yml` with `autocommit: true`. Set `autocommit-rule` to `unit` to commit after each planned work unit, or `wave` to commit after a group of units passes its checks. The defaults are `false` and `wave`; `setup` does not create this config.

Automatic commits require a plan, the `code-commit` skill, and passing validation. Invalid config values stop execution. Without a plan or the commit skill, the work stays uncommitted.

Opening a pull request (`code-pr`), reviewing it (`code-review`), and resolving CI failures (`code-ci`) each require a separate request. None merges the PR.
