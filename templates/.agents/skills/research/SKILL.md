---
name: research
description: "Investigates a question against primary sources, cites every claim, and lands the answer as a note in the repository; refuses secondary-only summaries. Use when a question about a tool, API, library, spec, or standard needs an answer backed by evidence rather than memory."
---

# Research

Investigates a question against high-trust primary sources and lands the
answer as a cited note.

**Consult:** `qmd`.
**Output:** `docs/notes/<slug>/<slug>-note.md` (frontmatter `type: note`).

**References (read when):**

| File | When to read |
|------|--------------|
| [note-template.md](references/note-template.md) | Before drafting the note — the skeleton and required sections |

## Hard gates

1. Search local docs with `qmd` before the web — the question may already be
   answered on disk.
2. Primary sources only: official docs, specs, source code, standards.
   A secondary write-up may point at a primary source but is
   never cited on its own.
3. Every claim in the note carries a citation — a URL or a repository path.
   "Reportedly" is not a citation.
4. Re-open each cited source and confirm the claim still matches before
   finalizing.
5. Refuse a request to just summarize a secondary source with no primary
   follow-through: go find the primary source instead, or say plainly that
   none is reachable.

## Workflow

### 1. Frame

State the exact question being investigated and what would count as
answering it.

### 2. QMD first

Search local docs with `qmd` (gate 1). If an existing doc answers the
question in full, cite it and stop. If an existing note answers part of it,
extend that note instead of starting a new one.

### 3. Primary sources

Follow every claim to the primary source that makes it true (gate 2). When a
secondary write-up points the way, read past it to what it cites.

### 4. Cited note

Draft the note from [note-template.md](references/note-template.md) at
`docs/notes/<slug>/<slug>-note.md`, every claim with an inline citation
(gate 3). Saved excerpts or other supporting material may sit
beside the note in its folder — they are extras, not the main doc.

### 5. Verify

Re-open each cited source (gate 4). Drop or fix any claim that no longer
matches what's written before moving on.

### 6. Finalize

Once the Human accepts the note, set `status: stable` and run
`harness:validate`.

## When not to use

- The work is urgent implementation, not reading legwork — refuse research
  as a stand-in for shipping now, and build it instead.

## Anti-patterns

- A claim with no citation, or a summary cited instead of the primary source it describes
- Skipping `qmd` and re-researching something already on disk
- Finalizing without re-checking each cited source
