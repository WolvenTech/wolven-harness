---
type: prd
title: Lean GitHub Actions Workflows Review
description: Audit and optimize repository GitHub Actions workflows (ci.yml, pages.yml, release.yml) to be lean, performant, and reliable without overengineering.
status: stable
---

# Lean GitHub Actions Workflows Review

## Problem

- **Who:** Repository maintainers and contributors running and maintaining automated workflows (`ci.yml`, `pages.yml`, `release.yml`).
- **Pain:** Repository maintainers and contributors lack a unified, lean GitHub Actions workflow baseline across ci.yml, pages.yml, and release.yml, resulting in duplicated runner setups and unoptimized execution cycles while risking overengineering from generic CI/CD patterns (such as container registries, unnecessary security SaaS scanners, or complex workflow call trees).
- **Why now:** As test suites, validation steps, and release automation evolve, workflows accumulate redundant steps (such as repeating pnpm installs across 4 concurrent jobs) or risk adopting bloated multi-tool templates that conflict with repository YAGNI principles.
- **Evidence:** Workflows currently define isolated setup sequences (`pnpm install --frozen-lockfile` and setup-node in each of `lint`, `test`, and `package` in `ci.yml`), custom non-standard action version tags (e.g. `actions/checkout@v7` and `actions/setup-node@v7` where upstream latest is v4, `upload-artifact@v7`/`download-artifact@v8` where upstream is v4), and external template reference [github-actions-templates](https://mcpmarket.com/tools/skills/github-actions-templates) demonstrating heavy multi-tool architectures (Docker/K8s/Trivy/Snyk) that exceed repository needs.

## Goals

- Minimize redundant setup and execution waste across workflow jobs — success signal: every job running Node/pnpm steps shares uniform, pinned runner setup with cached pnpm dependencies and no redundant builds where unneeded.
- Prevent overengineering by strictly enforcing repository scope boundaries — success signal: zero container builds (Docker), zero external cluster deployment scripts (Kubernetes), and zero third-party vulnerability SaaS scanners added; all workflows rely on native pnpm/node commands and validated standard GitHub Actions.
- Maintain full test gate integrity and release OIDC security guarantees — success signal: PR gate checks (`test/pr-gate.test.ts`), packed CLI smoke tests, and ADR-002 tokenless OIDC npm publishing continue to pass with 100% compliance.

**Non-goals**

- Introducing Docker container registries, image builds, or multi-stage Dockerfiles.
- Adding Kubernetes or cloud deployment workflows.
- Introducing external commercial/third-party security scanning tools (e.g. Snyk, Trivy) that require external API keys, tokens, or network egress.
- Modifying core CLI logic or runtime dependencies.

## User stories

### US-1: Lean and performant PR verification (`ci.yml`)

**As a** contributor opening or updating a pull request,
**I want** PR validation jobs to execute fast with shared caching and minimal redundant work,
**so that** I receive quick CI feedback without wasting runner minutes.

Traces to goal: Minimize redundant setup and execution waste across workflow jobs

#### AC-1.1: Fast parallel PR gate with pnpm store caching

**Given** a pull request with code changes is opened or synchronized
**When** `ci.yml` runs
**Then** all parallel jobs (`lint`, `test`, `package`) utilize pinned pnpm/Node versions and pnpm store caching to avoid redundant package downloads.

#### AC-1.2: Edit-only PRs skip heavy runner jobs

**Given** a PR is edited (e.g. title or description change only without base branch modification)
**When** `ci.yml` is triggered
**Then** code jobs (`lint`, `test`, `package`) are skipped and only the title validation runs, completing in under 30 seconds.

### US-2: Clean, bloat-free documentation publishing (`pages.yml`)

**As a** maintainer merging documentation or release changes to `main`,
**I want** `pages.yml` to build and deploy the VitePress documentation site with minimal steps and least-privilege permissions,
**so that** documentation updates deploy reliably without extraneous pipeline dependencies.

Traces to goal: Prevent overengineering by strictly enforcing repository scope boundaries

#### AC-2.1: Minimal build and deployment to GitHub Pages

**Given** a commit is pushed to `main` impacting the `site/` documentation
**When** `pages.yml` executes
**Then** it builds VitePress via `pnpm docs:build` and deploys using standard `actions/deploy-pages` without intermediate containerization or external dependencies.

#### AC-2.2: Redundant deploy prevention

**Given** rapid successive pushes occur on `main`
**When** `pages.yml` triggers
**Then** workflow concurrency ensures orderly deployment without corrupting Pages release artifacts.

### US-3: Secure and lean release automation (`release.yml`)

**As a** package maintainer releasing a new version of `@wolven-tech/harness`,
**I want** `release.yml` to preserve strict OIDC trusted publishing invariants (ADR-002) with minimal runner hops,
**so that** releases are published immutably and securely without token leaks or complex custom scripts.

Traces to goal: Maintain full test gate integrity and release OIDC security guarantees

#### AC-3.1: Tokenless OIDC publication with zero install in publish job

**Given** a release PR is merged and tagged
**When** the release workflow runs the `publish` job
**Then** it downloads the pre-built `dist` artifact and publishes via npm OIDC trusted publishing with `id-token: write` without installing node_modules or running lifecycle scripts.

#### AC-3.2: Failed tag or build stops publication

**Given** the `build` or version verification step fails
**When** the release pipeline evaluates dependencies
**Then** the `publish` job does not run, ensuring no broken or mismatched package version is published to npmjs.

## Scope

**In**

- Review and optimize `.github/workflows/ci.yml` for lean runner steps, pnpm caching, and accurate action references.
- Review `.github/workflows/pages.yml` for minimal steps and least-privilege permissions.
- Review `.github/workflows/release.yml` to preserve ADR-002 OIDC invariants while keeping build/publish separation clean.
- Align `test/pr-gate.test.ts` with any workflow structure optimizations.

**Out**

- Containerization (Docker, Podman, Container registries).
- External infrastructure deployment (Kubernetes, AWS, Terraform).
- External third-party security scanner actions or SaaS tokens.
- Changes to package distribution architecture or removal of OIDC publishing (ADR-002).

## Open questions

- Can the `package` job reuse the build output artifact from a shared build job, or must it continue building independently from clean source to preserve full parallel isolation? — owner: repo maintainer.
- Why do action references in `ci.yml` currently use future version tags like `@v7` when upstream official releases are `@v4` (e.g. `actions/checkout@v7`)? Should these be normalized to verified pinned versions (e.g. `@v4`)? — owner: repo maintainer.

## Handoff

After approval → `code-spec`. This PRD does not authorize implementation.
