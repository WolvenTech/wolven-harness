---
description: Never read or print secret-shaped files — keys, certificates, .env files, and credential folders; ask the Human when access is truly needed.
alwaysApply: true
---

# Secrets stay out of context

Never read, print, search, copy, or summarize a secret-shaped file. Once its
content enters the session it cannot be taken back.

## Secret-shaped paths

- Private keys and certificates: `*.pem`, `*.key`, `*.p12`, `*.pfx`,
  `*.keystore`
- SSH keys: `id_rsa*`, `id_ed25519*`
- Environment files: `.env` and every `.env.*` — except `.env.example`,
  which is safe to read
- Credential files: `.npmrc`, `.netrc`
- Credential folders: `~/.ssh/`, `~/.aws/`, `~/.config/gcloud/`, and the same
  folders inside the project

This covers every route to the content: a file read, and shell commands such
as `cat`, `head`, `tail`, `less`, `grep -r`, or `find … -exec cat`.

## When access is truly needed

Stop and ask the Human. Name the file and say why the task needs it. Do not
work around a refusal, and do not read the file to "check" whether it holds
a secret.

## Hook

`.agents/hooks/secret-path-guard.mjs` enforces this rule before a tool runs,
where the runtime wires it. A deny from the hook is final: ask the Human
instead of retrying another way.
