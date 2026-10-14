---
type: deferral
title: Self-identifying line in every shipped skill
description: Adding a marker line to all 19 shipped skills waits until the standing rule is shown to be inadequate, because the marker only means something once the rule defines it.
status: stable
---

# Self-identifying line in every shipped skill

**Deferred:** option (c) of [issue #59](https://github.com/WolvenTech/wolven-harness/issues/59)
— a self-identifying line in each shipped skill's description or body, so an
agent can tell a project copy from a user-level copy of the same name.

**Why:** the marker is only readable in a copy that loaded, and it is only
meaningful to an agent that has been told what it means — which is the standing
rule's job, not the marker's. On the copied path the harness itself ships
(`skills --scope global`) the same template lands at user level, so a line
asserting project identity would be false there. Both copies already carry
`name: <skill>` in frontmatter, so the marker adds no distinguishing power on
its own. The cost is 19 template files plus up to 17 installed twins that
`test/skill-copies.test.ts` requires to stay byte-identical, and, because
`installChoices` byte-compares each destination, every existing consumer's next
`skills` run would find every folder differing — which without a terminal is a
silent no-op, leaving marker-less bodies in place.

**Today:** precedence is steered by the standing rule
`.agents/rules/project-skill-precedence.md`, which tells the agent to check the
loaded skill's base directory and read the project copy when the loaded copy is
not the project's. Clash reporting lives in `setup` and `skills`.

## Contract impact

None while deferred. [ADR-004](../../adrs/adr-004-standalone-skills-contract.md)
leaves the set of skills and their text outside the contract, so editing the
bodies is additive. It would, however, add a replacement question to every
existing consumer's next `skills` run.

## Triggers

- [ ] A session in a repo whose entry file carries the shipped rule still
      follows a user-level copy, verified by the skill tool reporting a base
      directory outside the project. Then the rule is proven inadequate and a
      marker inside the skill body is the remaining in-band signal.
- [ ] A runtime stops reporting the loaded skill's base directory, so the
      rule's directory check has nothing to read, while still allowing two
      same-named skills to exist at project and user level.
- [ ] A consumer reports a same-name clash that the marker would have made
      obvious in the loaded text.

## Non-goals while deferred

- No marker line in any `SKILL.md`, and no change to any shipped skill body.
- No version or provenance stamp in skill frontmatter.
