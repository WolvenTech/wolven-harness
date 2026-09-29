---
description: How a full pass through the harness fits together.
---

# The cycle

What a full pass looks like once the package is installed. The README stops at three work steps — spec, plan, execute. The pass is longer than that: a person sets the tree up, the agent introduces the harness into your entry file, the work skills run only after that, and the gates hold the result.

1. **A person** runs `setup` at the git top level and answers two questions — the git host, and which runtimes to wire. The command writes the skills tree, the docs skeleton, and the runtime wiring, skipping anything that already exists.

2. **The agent** runs the `harness-init` skill, which folds the entry file: `WOLVEN.md` is merged into your `AGENTS.md` in whichever mode you pick. `setup` deliberately leaves that file alone, so a person decides how the harness is introduced. The same skill offers to migrate older decision records and to stub the skills you are missing. The walk is [Setting up with harness-init](/harness-init).

3. **The agent** takes work through `code-spec`, then `code-plan`, then `code-execute`: freeze the ask into a spec of obligations and proofs, turn that spec into ordered units, then execute a unit in the repository. Committing, opening a pull request, and review are each a separate ask afterwards. Use `create-prd` and `grilling` when the problem is not yet a clear ask. `code-pr`, `code-review`, `code-ci`, and `handoff` are ask-only and never merge.

4. **Your gates.** `setup` adds `harness:validate` and `harness:comments` to your `package.json`. Those two scripts are the gates: the first holds the docs and decision claims to the profile, the second judges the comments a change added. They run wherever you choose to run them — the harness installs no workflow of its own and blocks nothing in your pipeline until you wire it in.
