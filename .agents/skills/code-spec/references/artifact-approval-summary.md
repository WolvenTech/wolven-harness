# Artifact approval summary

Every Human gate on a PRD, spec, or plan ends from a **normalized summary**
in chat — not a re-paste of the artifact. Use this shape after the first
draft and after every **material revision**, immediately before asking the
Human to approve.

Do not repeat the artifact in full. Do not dump raw path lists.

## 1. Where and status

One line: artifact path, frontmatter `status`, and whether the file is
committed in this session (`committed` / `uncommitted`).

## 2. What it requires

One compact markdown table. Content is **skill-specific**:

| Skill | Table rows |
|-------|------------|
| `create-prd` | Problem statement (one line); each `US-<n>` with acceptance count; verdict on readiness (`approve` / `revise` / `blocked`) |
| `code-spec` | One row per wave: repos or surfaces, main changes, named proofs |
| `code-plan` | One row per unit: wave, owned paths (short), Done when (short), Subagent |

## 3. What grounding found

Facts from disk or systems that change the picture — especially anything
that contradicts an earlier assumption. Write `none` when there are none.

## 4. Decisions folded in

Each Human answer from this round and where it landed in the artifact.
Then **still open:** list Unresolved identifiers, or `none`.

## 5. What changed

**Updates only.** On the first draft, write `n/a (first draft)`. On later
revisions, bullet the delta from the previous version — not a re-summary.
