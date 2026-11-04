---
type: deferral
title: File-names-only safety audit
description: A harness-owned audit that never reads any file's contents waits until someone objects to the safety audit scanning MCP config and harness files.
status: stable
---

# File-names-only safety audit

**Deferred:** a check of the harness's own that replaces `harness:score` in the safety audit and looks only at file names, so the audit reads no file's contents at all.

**Today:** the safety audit in `harness-init` runs `harness:score` and reads `HYG-03`, `HYG-04` and `HYG-06`. `HYG-03` looks only at file names. `HYG-04` and `HYG-06` read MCP config and harness files for key-shaped text, and report the file and the kind of match, never the value. Nothing opens an env file or any other secret-shaped file.

**Why not now:** it would add a second check to maintain beside a pinned tool, and it would lose the two checks that catch a key pasted into a file the agent loads. No one has yet objected to the audit reading those files.

## Revisit when

- [ ] Someone declines the audit, or asks to remove it, because it reads MCP config or harness files.
- [ ] A compliance or client rule forbids any tool from reading those files.
- [ ] `harness-score` changes so that `HYG-04` or `HYG-06` reports a value, or scans files beyond MCP config and harness files.
