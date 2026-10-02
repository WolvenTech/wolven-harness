---
description: Clone this repo, build it, and run setup from source.
---

# Contributing

Open an issue for a bug or proposal, or a pull request for a change. See [CONTRIBUTING.md](https://github.com/WolvenTech/wolven-harness/blob/main/CONTRIBUTING.md). PR titles use Conventional Commits. CI checks the title, runs lint and harness checks, runs tests on Node.js 22 and 24, then packs and smoke-tests the CLI in a clean repository.

```sh
git clone https://github.com/WolvenTech/wolven-harness.git
cd wolven-harness
pnpm install
pnpm build
pnpm test
pnpm validate
pnpm comments
pnpm score
pnpm docs:build
```

`pnpm docs:build` verifies the VitePress site and writes the production site to `site/.vitepress/dist`.

From-source setup, without installing the package in the target repository:

```sh
cd /path/to/target-repo
node /path/to/wolven-harness/dist/cli.js setup
```
