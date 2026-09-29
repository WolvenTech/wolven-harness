---
description: Clone this repo, build it, and run init from source.
---

# Contributing

Issues and pull requests belong here. See [CONTRIBUTING.md](https://github.com/WolvenTech/wolven-harness/blob/main/CONTRIBUTING.md). PR titles are Conventional Commits. CI runs the same gate.

```sh
git clone https://github.com/WolvenTech/wolven-harness.git
cd wolven-harness
pnpm install
pnpm build
pnpm test
```

From-source init, without installing the package in the target repo:

```sh
cd /path/to/target-repo
node /path/to/wolven-harness/dist/cli.js init
```
