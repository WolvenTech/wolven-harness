# Research verification evidence

Executed 2026-11-03 against upstream commit
`1da2195067c14ae5d44dc615b31cb26f50ebeb91` in
`/tmp/tlc-skills-research-20261103`.

## Driven

Command:

```sh
python3 '/tmp/tlc-skills-research-20261103/packages/skills-catalog/skills/(development)/tlc-spec-driven/scripts/selftest.py'
```

Exit code: 0. Captured final line:

```text
selftest: 24 killed, 0 survived, controls ok, tooling ok, baseline clean
```

## Lean

Command:

```sh
python3 '/tmp/tlc-skills-research-20261103/packages/skills-catalog/skills/(development)/tlc-spec-lean/scripts/selftest.py'
```

Exit code: 0. Captured final line:

```text
selftest: 83 killed, 0 survived, controls ok, tooling ok, baseline clean
```

These exercise upstream's own fixtures. No target feature was implemented,
no comparative agent benchmark was run, and The Judge's posting helper was
not executed.
