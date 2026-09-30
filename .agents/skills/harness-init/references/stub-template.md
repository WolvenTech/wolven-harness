# Stub Template

Renders the ask-only stub step 5 writes for one skill the Human picked — a
`SKILL.md` plus an `agents/openai.yaml`, both held here verbatim with
placeholders. `description` is the trigger: when to use the skill. The
body cites the evidence, stamps the tool version, and asks the Human to
fill each step up to its done line.

## Never overwrite

An existing skill folder is never overwritten. Before writing, check
`.agents/skills/<name>/` for a match; if it already exists, ask the Human
for another name or skip that suggestion instead. A half-written skill
therefore never lands on top of one that already works — and never fires
on its own either: `disable-model-invocation: true` in `SKILL.md` plus
`allow_implicit_invocation: false` in `agents/openai.yaml` hold until the
Human removes them.

## Fill

Replace angle-bracket placeholders from discovery. The four steps stay
prompts for the Human — this write records evidence and stops short of
authoring the tool's workflow. Cited evidence, Local decision, and
Length say how each remaining line is filled.

## Files

`.agents/skills/<name>/SKILL.md`:

```markdown
---
name: <name>
description: "Use when <trigger>"
metadata:
  wolven-harness: stub
disable-model-invocation: true
---

# <name>

Ask-only: an explicit ask for `<name>` is the only run.
`disable-model-invocation: true` stays until the Human removes it. While
any step below is still a prompt, the run stops after Cited evidence and
Local decision. The workflow for <tool-or-field> is step 3, and step 3
stays a prompt until the Human fills it.

## Cited evidence

Cite each source that led to this stub. An external skill is a name and
a location; its text stays in its own file.

- Decided tool: <tool-or-field>
- Repo file: <path>
- External skill: <skill-name and location, or none>
- Generated against: <tool-or-field> <version, or no version recorded>

## Local decision

When a cited skill conflicts with a stable ADR or an existing workflow
in this repo, record the conflict here and follow the local decision.
The conflicting step stays out of this skill.

- Conflict: <none, or the stable ADR or existing workflow and the cited step that differs>
- Follow: <the local decision>

Done when: Conflict is `none`, or it names the stable ADR or existing
workflow and the cited step that differs, and Follow names the local
decision whenever Conflict names one.

## Steps

### 1. Trigger

Ask the Human when an agent should reach for this skill. Write that into
`description`, leading with the situation: `Use when …`. One distinct
situation per branch.

Done when: `description` starts with `Use when` and every branch is a
situation the Human stated in this step.

### 2. Conventions

Ask the Human what they decided for <tool-or-field> — naming, layout, and
the rules they already follow. Write each decision as its own bullet.

Done when: every bullet is a decision the Human stated, and a reader can
point at the Human's answer for each one.

### 3. Workflow

Ask the Human for the ordered steps this skill runs for <tool-or-field>.
Write them here, each ending with its own `Done when:` line. A cited step
that Local decision records as a conflict stays out.

Done when: every step ends with a `Done when:` line whose result a later
run can observe — a command's exit code, a file's contents, or a diff —
and each step is one the Human stated.

### 4. Verify

Ask the Human for the command or the file read that shows the skill did
its job. Write that command or path here.

Done when: the command or the path is written below, and running it or
reading it differs when the job is done from when it is not.

## Length

Keep this file under 500 lines. When only one branch of a step needs
the detail, put it in `references/<slug>.md` in this skill folder — one
level down — and link it from that step.
```

`.agents/skills/<name>/agents/openai.yaml`:

```yaml
interface:
  display_name: "<name>"
  short_description: "Use when <trigger>"
policy:
  allow_implicit_invocation: false
```

## Until it's defined

`harness:validate` warns `skill-stub-open` for each stub's `SKILL.md`,
once per file, for as long as its `metadata` still carries
`wolven-harness: stub`. Defining a stub means filling each headed step
until its `Done when` holds, then removing that marker — and, only if
the Human wants the skill model-invocable, also removing
`disable-model-invocation: true` and the `agents/openai.yaml` file. Short
of that, the warning stays and the skill stays ask-only.

## Commit

Every stub this step writes lands in the setup phase's single commit
offer, together with everything else steps 2 through 6 write — never a
commit per stub, and never a commit per file inside one.

## Hand-back

Hand back to the Human: define each stub, then remove the marker.
