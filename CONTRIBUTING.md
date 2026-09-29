# Contributing

Issues and pull requests both belong on
[WolvenTech/wolven-harness](https://github.com/WolvenTech/wolven-harness).
Open an issue for a bug or a proposal; open a pull request once you have
something to show.

## Requirements

Node 22 or later, git, and pnpm. macOS or Linux — runtime wiring uses
filesystem symlinks, so Windows is not supported.

## Working in the repo

```sh
git clone https://github.com/WolvenTech/wolven-harness.git
cd wolven-harness
pnpm install
pnpm build
pnpm test
pnpm lint
```

`pnpm build` compiles `src/` to `dist/` with `tsc`. `pnpm test` runs the
`node:test` suites under `test/` through `tsx`, straight against `src/`, so it
needs no build. `pnpm lint` runs Biome over `src/`, `test/` and the site config;
`pnpm exec biome check --write` applies its fixes.

Two more checks run the CLI against this repo itself, and both need `dist/`, so
build first:

```sh
pnpm validate   # writing profile, ADR claims, legacy ADRs, spine
pnpm comments   # judges comment lines added since the merge-base
pnpm score      # harness-score; fails below L3
```

`pnpm validate` passes when it prints `validate: ok`. `pnpm comments` passes
when it prints `comments: ok (0 findings)`. `pnpm score` passes while the repo
stays at L3 or above; the checks this repo chooses not to build are dropped in
`.harness-score.json`. harness-score also reads untracked and ignored files, so
a local `.env` or local agent files can make your score differ from CI's. An added comment has to be a
`why:`, `hazard:`, or `invariant:` line of at most four lines, or a `/** */`
block directly above a declaration; it must not narrate the change, cite
anything outside this repository, or defer work with `@todo`. The rule itself
is `templates/.agents/rules/comments.md`.

Some tests pin documentation copy. `test/readme-install.test.ts` asserts the
install lines in `README.md` and the release and contributing pages under
`site/`. `test/release.test.ts`, `test/harness-init-set.test.ts`, and
`test/setup-runtimes.test.ts` assert phrases in those pages too. Editing them
can fail the suite, which is the point: change the copy and the test together,
deliberately.

## Pull requests

PR titles are [Conventional Commits](https://www.conventionalcommits.org/) —
`feat:`, `fix:`, `docs:`, `chore:`, and so on. A PR-title check enforces the
format, and since PRs are squash-merged the title becomes the commit message on
`main`, which is what release-please reads to work out the next version.

Every pull request runs the same gate you just ran locally, on Linux. Lint runs
`pnpm lint`, `pnpm validate`, `pnpm comments` and `pnpm score` on Node 22. Test runs
`pnpm test` on Node 22 and 24. Package packs the tarball, installs it into an
empty repo and runs `setup` and `validate` there. Run the gate yourself before
pushing and CI should hold no surprises.

Releasing is a maintainer task; see [Release](site/release.md).
