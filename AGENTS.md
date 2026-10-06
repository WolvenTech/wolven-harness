# AGENTS.md — wolven-harness (package repo)

Dev entry for agents working in this repository, which builds and publishes `@wolven-tech/harness`.

## Build, test, validate

```
pnpm install
pnpm build      # tsc -p tsconfig.json -> dist/
pnpm test       # tsx --test "test/**/*.test.ts"
pnpm lint       # biome check: lint and format src/, test/ and the site config
pnpm validate   # node dist/cli.js validate — run after `pnpm build`
pnpm score      # harness-score --min-level 3, with drops in .harness-score.json
```

`pnpm install` runs `prepare`, which installs simple-git-hooks: pre-commit refuses the default branch, then runs `biome check --staged`; pre-push refuses a push to the default branch.

## Layout

- `src/` — CLI source (`cli.ts`, `setup/`, `validate/`, `comments/`); `pnpm build` compiles it to `dist/`.
- `templates/` — files `setup` copies into a consumer repo.
- `test/` — `node:test` suites, run in-process against `src/` via `tsx` (no build required).
- `CONTRIBUTING.md` — contributor entry point: requirements, the local gate, and the PR rules.
- `assets/` — the Wolven marks the `README.md` header embeds; outside `"files"`, so they do not ship.
- `site/` — the VitePress source for the GitHub Pages guide; `pnpm docs:build` builds it, and `.github/workflows/pages.yml` deploys it on push to `main`, so the repo's Pages source must be set to GitHub Actions.

## Rules

- Runtime dependencies: `yaml` and `@clack/prompts` (the `setup` prompts and progress UI, `src/setup/ui.ts`) only. Adding another runtime dependency is a decision, not a default.
- `setup` creates only missing paths, and never creates or edits a consumer's `AGENTS.md`. It does add missing `harness:validate`, `harness:comments` and `harness:score` scripts to an existing `package.json` (never a dependency; it prints the `harness-score` install command instead), and it rewrites `packageVersion` in `.wolven-harness.json` on every run. The `comments` base, when `--base` is omitted, is the merge-base with `origin/HEAD`, then `origin/main`, then `main`.
- Architecture claims follow ADR-001 (`docs/adrs/adr-001-claim-path.md`).
- Added comments under `src/` and `test/` must be `why:`/`hazard:`/`invariant:` (at most 4 lines) or an informative JSDoc comment on the declaration below them, with no narration of what changed and no references outside this repository; `pnpm comments` (`wolven-harness comments`) judges comment lines added since the merge-base with `origin/main` and enforces it.

## Wolven harness

| Where | What lives there |
| --- | --- |
| `.agents/skills/` | Agent skills, one folder per skill, each with a `SKILL.md` |
| `.agents/rules/` | Standing rules agents load unconditionally |
| `.agents/hooks/` | Hook scripts and wiring (placeholder until the project needs one) |
| `docs/adrs/` | Architecture decision records (profile ADRs), flat: `adr-NNN-<slug>.md` |
| `docs/prds/<slug>/` | Product requirement docs: `docs/prds/<slug>/<slug>-prd.md` |
| `docs/specs/<slug>/` | Active specs: `<slug>-spec.md`, optional `<slug>-plan.md`, and review-fix `<slug>-iteration-<N>-{spec,plan}.md` |
| `docs/notes/<slug>/` | Research notes: `docs/notes/<slug>/<slug>-note.md` |
| `docs/deferrals/<slug>/` | Deferred scope with revisit triggers: `docs/deferrals/<slug>/<slug>-deferral.md` |
| `docs/WRITING-PROFILE.md` | The four rules every `docs/**` markdown file follows |

Every doc-folder except `docs/adrs/` follows `docs/<folder>/<slug>/<slug>-<type>.md`.

### Before you answer from memory

Search this repo's knowledge before answering from memory or the web. ADRs are
the decisions you may depend on — search them first, then widen:

```
qmd query -c adrs "<question>"
qmd query "<question>"
```

### Skills

| Skill | Use when |
| --- | --- |
| adr | Create, promote, and supersede architecture decision records under docs/adrs/, repointing claims when one supersedes another |
| code-ci | Drive an open pull request to merge-ready through conflicts, unresolved comments, and failing checks, in that order, on an explicit ask, and never merge |
| code-commit | Create Conventional Commits for repo work — invoked directly on an explicit ask, or from code-execute only when the resolved commit-cadence opt says to |
| code-execute | Execute ordered work units from a locked plan in-repo — implement, validate, then invoke code-commit only when the resolved commit-cadence opt says to; PRs, reviews, and CI babysitting are always a separate ask |
| code-plan | Turn a locked spec into ordered work units for repo execute, with dependencies, wave stops, and an explicit Subagent value per unit |
| code-pr | Push the branch and open or amend a pull request for the current state, titled as a Conventional Commit and filled from the body template — ask-only, and it never merges |
| code-review | Review an open PR's diff against the refs its description cites, and post blocking or nit findings — never merging |
| code-spec | Freeze design and requirements for a code initiative into a spec, from a PRD or a confirmed ask, with obligation-proof pairs, nine dimensions, and typed Unresolved rows |
| create-prd | Grill a problem to one confirmed statement, challenge its key terms against local docs, draft a lean PRD with user stories and Given/When/Then acceptance, and move it from draft to stable only on explicit approval |
| grilling | Interview relentlessly about a plan, decision, or idea until every open branch is settled, one question at a time |
| handoff | Save a handoff document to the OS temp directory so a fresh session can pick up the work — ask-only, never invoked automatically |
| harness-init | Guide a repo through initial harness setup — fold the entry file into AGENTS.md, offer legacy ADR migration, discover the repo, research its decided tools, suggest skills, write stubs, score the harness, and close with a session note |
| pragmatic-guard | Strict YAGNI enforcement. Challenge over-build, record deferrals under docs/deferrals/, refuse scope expansion without triggers. Use when adding features, abstractions, deps, or "we might need" work. |
| prototype | Build a throwaway prototype that answers one question — a runnable program for logic and state, or a few switchable variations for UI — then discard or promote it deliberately |
| qmd | Search local markdown knowledge bases, notes, docs, and wikis with QMD. Use when users ask to find notes, retrieve documents, inspect a wiki, answer from indexed markdown, or set up QMD access. |
| research | Investigate a question against primary sources, cite every claim, and land the answer as a note in the repository. Refuses secondary-only summaries. |

### Standing rules

- `.agents/rules/qmd-first.md` — QMD before web, ADRs first
- `.agents/rules/yagni-strict.md` — strict YAGNI; deferrals under `docs/deferrals/` only
- `.agents/rules/comments.md` — comment style for added lines; run `harness:comments` before handing work back

### Harness score

`harness:score` rates this repo's agent harness from its files alone, from L0
to L4. Checks the repo chooses not to build are dropped in
`.harness-score.json`, and every drop shows in the report.

### Architecture claims

Referencing an ADR as `ADR-NNN` or `adr-NNN-<slug>` anywhere in a tracked file
is a claim, not decoration. Each claim must resolve to exactly one **`stable`**
profile ADR under `docs/adrs/`:

- No matching profile ADR and no live legacy ADR — the claim **fails**, unless exactly one archived legacy ADR has that number, which **warns**.
- A **legacy** ADR (an ADR-shaped file outside `docs/adrs/`) — the claim
  **warns** until it is migrated into `docs/adrs/` via the `harness-init`
  skill.
- A `draft` or `deprecated` profile ADR, or more than one match — the claim
  **fails**.

This repo records its own architecture decisions as profile ADRs, starting
from `ADR-000` (see `docs/adrs/adr-000-record-architecture-decisions.md`).

### Validate

```
pnpm harness:validate
wolven-harness validate
```

Run validate after any change to `.agents/**` or `docs/**` — it enforces the
writing profile (`docs/WRITING-PROFILE.md`) and the architecture-claims rule
above.
