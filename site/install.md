---
description: Connect the harness files to your repo’s existing instructions with harness-init.
---

# Installation

Install `@wolven-tech/harness` globally, then run `wolven-harness setup` at a Git repository's top level or in a folder outside every repository. At a top level, setup does a quiet install under `.wolven-harness/`; outside a repository, it installs the core skills and links for the coding agents you selected. Either way, ask your agent to run the `harness-init` skill there to finish. The command and the skill are separate: setup installs files, while the skill guides you through integrating them with your repository. It shows each diff and waits for your choice before writing.

## What happens

These are the steps of Guided setup; Quick setup skips most of them, as the next section explains. Step 1 applies to a full install. A quiet install has no `WOLVEN.md`, so `harness-init` asks two other questions at the end instead: which harness folders git should track, and whether to keep the local-only files out of git through `.gitignore` or only on your machine.

1. Choose how to integrate `WOLVEN.md` into `AGENTS.md`: full or light. Both wrap the harness section in markers so a later run finds and refreshes it instead of folding a second one:

   ```markdown
   <!-- wolven-harness:start -->
   ...harness section...
   <!-- wolven-harness:end -->
   ```

   When `codex` or `antigravity` is selected, the section also carries the full text of each rule between rules markers, because those agents read the rules from `AGENTS.md`:

   ```markdown
   <!-- wolven-harness:rules:start -->
   ...standing rule bodies...
   <!-- wolven-harness:rules:end -->
   ```

   `setup` never creates or edits `AGENTS.md`.
2. If validation reports legacy architecture decision records (ADRs), migrate them into `docs/adrs/`, keeping their numbers and resolving broken references.
3. The agent reads the repository and suggests two to four skills based on its tools and decisions. Web research is optional and requires your agreement.
4. It creates only the skill stubs you choose. They are unfinished skills that run only when you ask for them; validation reports a `skill-stub-open` warning until you complete them. The warning does not fail validation.
5. Choose how to run validation: as a CI job, through an existing check script, or locally. The agent finishes a session note in `docs/notes/`.

The skill makes one commit offer, at the end, listing only the files git would track, and nothing is pushed. It is offered only after validation passes, and declining it leaves your changes in the working tree.

## Quick setup and guided setup

`harness-init` starts by asking how much setup you want right now, on any repo, new or with code.

**Quick setup** connects the harness to your coding agents and hands back. It asks no goal question. Everything else waits: old decision records, discovery, research, skill suggestions, the score and automatic checks are listed under **Left for later** in the session note. [`lean-path.md`](https://github.com/WolvenTech/wolven-harness/blob/main/templates/.agents/skills/harness-init/references/lean-path.md) has the full list.

**Guided setup** opens by asking what the repo is for and your role in it. It then offers each remaining step one at a time, in order, and you run it or skip it. A skipped step is listed under **Left for later**. Skill suggestions run only when the repo looks new or still unexplored, and you can overrule that call.

As its last step, either path offers a safety audit. The harness never reads your passwords, keys or `.env` files, and it blocks your agent from opening them where a guard hook is set up. The audit checks that protection is in place and reports file names, never values. You can skip it. Both paths end by telling you what was installed, what was left for later and what to do next, and by asking what to work on next.

## Check the setup

```sh
wolven-harness validate
```

A full install also has `setup` add `harness:validate` as a package script for `wolven-harness validate` when that script is missing; it runs the same check, whatever package manager the install recorded. A quiet install adds no scripts. Existing scripts are preserved.

Migration is complete when validation exits 0 with no legacy warnings left and no `adr-status-mismatch`. A superseded ADR is never kept `stable`: it gets a successor and is deprecated. References to decision records must resolve to a stable record in `docs/adrs/`; legacy records get migration warnings during the transition.

## Uninstall a quiet install

Run the command from the repository root:

```sh
wolven-harness uninstall
```

It lists what it will remove and asks before removing anything. The list can include skills in your home folder, such as under `~/.claude/skills/`. A skill counts as the harness's when its `name` and `description` match the shipped skill, and its whole folder goes, even if you edited the rest of it. Copy any skill you changed before you confirm. Skills with another name or description stay. It keeps `.wolven-harness/docs/`, where your decision records (ADRs), specs and notes live. It never edits files you share with the harness, such as `AGENTS.md`, so in a terminal it then offers to install the `harness-remove` skill. Ask your agent to run that skill to clean up what is left. See [`uninstall`](./commands#uninstall) for the options.

### Remove it by hand

Use these steps to check each file yourself, or to switch to a full install. Work in this order, so nothing you edited is lost.

1. List what setup and `harness-init` created: `.wolven-harness/`, `.wolven-harness.json`, and the symlinks that point into `.wolven-harness/`, such as `CLAUDE.local.md`, `.claude/skills/<name>`, `.claude/rules/<name>`, `.qmd` and `harness-init` in your coding agents' skills folders. `.wolven-harness/wiring.json` lists each one. Also look for the ignore lines `harness-init` added to `.gitignore` or `.git/info/exclude`, the `.claude/settings.local.json` and `.worktreeinclude` entries, a `.wolven-harness/` line in `.dockerignore`, and the harness block in `AGENTS.md` or `CLAUDE.md`.
2. Keep a copy of any skill or rule you edited, such as a skill folder under `.wolven-harness/.agents/skills/` or a file under `.wolven-harness/.agents/rules/`.
3. Move the harness docs you want to keep out of `.wolven-harness/docs/`, such as decision records (ADRs), specs and notes. Folders you left unticked in `harness-init` exist only on this machine, so nothing else holds a copy.
4. Remove the rest: the symlinks, `.wolven-harness/`, `.wolven-harness.json`, the ignore lines and the harness block. To switch to a full install, keep `.wolven-harness.json` instead; the next section says how.
5. To go back to a quiet harness, run `wolven-harness setup` at the repository root again.

## Full install

Want git to track the whole harness? Follow the uninstall steps, but keep `.wolven-harness.json`. In that file, set `layout` to `home` and remove `harnessHome`, then run `wolven-harness setup`.

Next, try the [Development workflow](./cycle) example.
