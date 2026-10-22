# Commit convention

After the layout is settled, step 2 settles how the code repository writes
commit subjects and records that answer in the harness home's
`.wolven-harness.json`. The harness home keeps Conventional Commits; the
recorded convention applies to `codeRepo` work.

Run it right after the layout step, before discovery. Ask one question at a
time and show every diff before writing.

**Contents:** [Read the subjects](#read-the-subjects) ·
[Propose a pattern](#propose-a-pattern) · [Ask](#ask) · [Record](#record) ·
[No invention](#no-invention)

## Read the subjects

Read the code repository's last 30 commit subjects:

```sh
git -C <codeRepo> log -30 --format=%s
```

A repository with no commits prints nothing and exits non-zero; treat that as
"no signal" and go to [Ask](#ask).

## Propose a pattern

Look for one prefix shape the subjects share — a prefix regex such as
`^[A-Z]+-\d+: ` (for example `ABC-123: add the retry guard`).

Propose that shape only when **at least 80%** of the subjects (24 of 30)
share it. Quote the proposed regex and one real subject that matches it as
the example. When no shape reaches 80%, there is no proposal.

## Ask

Put the convention to the Human as one question, the recommended answer
first:

- With a proposal: "Use `<regex>` for `<codeRepo>` commits" (recommended),
  then "Use Conventional Commits".
- With no proposal, or no commits: "Use Conventional Commits" (recommended,
  and the default), then "Use another shape" — and when the Human picks that,
  ask for the regex and one matching subject. Never record a shape the Human
  did not give.

Never pick a convention silently.

## Record

Record the answer in the harness home's `.wolven-harness.json` — the file that
holds `codeRepo` — and keep every other key in it. Show the diff and write
only on a yes:

```json
{ "style": "conventional" }
```

```json
{ "style": "pattern", "pattern": "^[A-Z]+-\\d+: ", "example": "ABC-123: add the retry guard" }
```

The `pattern` value must compile as a JavaScript regular expression, and
`example` is a real subject from the code repository. Both shapes sit beside
`codeRepo`, `layout` and the keys `setup` wrote.

## No invention

Never record a pattern from fewer than 80% agreement, from a single subject,
or from a shape the Human has not confirmed. With no clear pattern, the
default is Conventional Commits, recorded only after the Human agrees.

Then run `harness:validate`.
