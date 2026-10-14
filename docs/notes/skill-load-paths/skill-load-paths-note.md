---
type: note
title: Skill load paths and name-clash precedence per runtime
description: Claude Code documents that a personal skill beats a project skill of the same name, Codex surfaces both, and Cursor documents no tie-break, so no single precedence rule exists to rely on.
status: stable
---

# Skill load paths and name-clash precedence per runtime

## Question

Which directories do Claude Code, Codex and Cursor read skills from at project
and user level, and what does each runtime document about a same-name clash
between them?

## Findings

- **No runtime gives the harness a resolution order it can change.** The
  runtimes own skill resolution, so a fix can only steer the agent and surface
  the clash. This is the constraint in
  [issue #59](https://github.com/WolvenTech/wolven-harness/issues/59).

### Claude Code

- User level is `~/.claude/skills/<name>/SKILL.md`; project level is
  `.claude/skills/<name>/SKILL.md`, and Claude Code also reads nested and
  ancestor `.claude/skills/` directories up to the repo root
  ([Claude Code skills](https://code.claude.com/docs/en/skills.md)).
- **Precedence is documented and the personal copy wins.** "With `deploy` in
  both `~/.claude/skills/` and the project's `.claude/skills/`, `/deploy` runs
  the personal one"; the documented order is enterprise over personal over
  project ([Claude Code skills](https://code.claude.com/docs/en/skills.md)).
  The plugin loader corroborates it: "the copy under `~/.claude/skills/`
  loads and the project's `.claude/skills/` copy is dropped, with a row that
  says which path shadowed it"
  ([plugin loading](https://code.claude.com/docs/en/plugins/loading.md)).
- Claude Code's skills page does not list `.agents/skills/` or
  `~/.agents/skills/` among its locations. Do not assume Claude Code reads
  them.
- Plugin skills are namespaced `plugin-name:skill-name`, "so they never
  collide with per-directory skills"
  ([Claude Code skills](https://code.claude.com/docs/en/skills.md)).

### Codex

- Codex reads `.agents/skills` from the current working directory up to the
  repo root, and its user level is `$HOME/.agents/skills`. Admin is
  `/etc/codex/skills`
  ([Codex skills](https://learn.chatgpt.com/docs/build-skills)).
- **Codex has no shadowing to fix.** "If two skills share the same `name`,
  Codex doesn't merge them; both can appear in skill selectors"
  ([Codex skills](https://learn.chatgpt.com/docs/build-skills)).
- OpenAI does not document `~/.codex/skills` as a Codex skill location. The
  only primary source that names it is Cursor's compatibility list.

### Cursor

- Cursor reads project `.agents/skills/` and `.cursor/skills/`, and user
  `~/.agents/skills/` and `~/.cursor/skills/`. For compatibility it also reads
  `.claude/skills/`, `.codex/skills/`, `~/.claude/skills/` and
  `~/.codex/skills/` ([Cursor skills](https://cursor.com/docs/skills.md)).
- **Cursor documents no tie-break for a same-name skill.** Neither the skills
  reference nor its help page states a direction; only rules and plugin names
  have documented precedence.

### The Agent Skills spec

- The spec "does not mandate where skill directories live", calls
  `.agents/skills/` "a widely-adopted convention for cross-client skill
  sharing", and recommends the user slot `~/.agents/skills/`
  ([adding skills support](https://agentskills.io/client-implementation/adding-skills-support)).
- Its guide claims "The universal convention across existing implementations:
  project-level skills override user-level skills" — which Claude Code's own
  documentation contradicts. Treat that line as a recommendation, not as
  runtime behaviour.

## Sources

| Source | Type | Used for |
|--------|------|----------|
| [Claude Code skills](https://code.claude.com/docs/en/skills.md) | official docs | Claude Code paths and the personal-over-project order |
| [Claude Code plugin loading](https://code.claude.com/docs/en/plugins/loading.md) | official docs | Independent confirmation of the shadowing order |
| [Codex skills](https://learn.chatgpt.com/docs/build-skills) | official docs | Codex paths and its no-shadowing behaviour |
| [Cursor skills](https://cursor.com/docs/skills.md) | official docs | Cursor paths, the `~/.codex/skills/` compatibility read, and the absent tie-break |
| [Adding skills support](https://agentskills.io/client-implementation/adding-skills-support) | spec guide | The convention, the recommended slots, and the contradicting precedence claim |

## Open questions

None. The contradicting precedence claims are a finding rather than an open
question: no single order can be asserted across runtimes.
