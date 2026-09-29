---
description: Clone this repo, build it, and run setup from source.
---

# Contributing

Open an issue for a bug or proposal, or a pull request for a change. See [CONTRIBUTING.md](https://github.com/WolvenTech/wolven-harness/blob/main/CONTRIBUTING.md). PR titles are Conventional Commits. CI runs install, build, test, validate, comments, and `npm pack --dry-run`.

```sh
git clone https://github.com/WolvenTech/wolven-harness.git
cd wolven-harness
pnpm install
pnpm build
pnpm test
pnpm validate
pnpm comments
```

From-source setup, without installing the package in the target repo:

```sh
cd /path/to/target-repo
node /path/to/wolven-harness/dist/cli.js setup
```
