---
description: Specify, plan, and implement a small change with your coding agent.
---

# Daily use

After [Setup](./harness-init), try a small change: add a retry limit to outbound calls.

## Specify

Ask for `code-spec`: “Limit outbound calls to three retries and add a test that proves we stop at the cap.” The agent records the requirements and how to verify them. Review the spec before implementation.

## Plan

Ask for `code-plan`. The agent identifies the files to change, the test to add, and the checks to run. Approve the plan before work starts.

## Execute

Ask for `code-execute`. The agent makes the change and runs the tests and harness checks. Review the diff and results.

## Commits and pull requests

By default, the work stays uncommitted until you ask for `code-commit`.

You can enable automatic commits in `.agents/code-commit.config.yml` with `autocommit: true`. Set `autocommit-rule` to `unit` to commit after each planned work unit, or `wave` to commit after a group of units passes its checks. The defaults are `false` and `wave`; `setup` does not create this config.

Automatic commits require a plan, the `code-commit` skill, and passing validation. Invalid config values stop execution. Without a plan or the commit skill, the work stays uncommitted.

Opening a pull request (`code-pr`), reviewing it (`code-review`), and resolving CI failures (`code-ci`) each require a separate request. None merges the PR.
