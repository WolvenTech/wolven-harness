---
type: adr
title: Evaluate actual QMD canon retrieval with authentic evidence
description: Propose a narrow behavioral gate with independent negative controls before claiming QMD canon compliance or adding runtime enforcement.
status: draft
---

# Evaluate actual QMD canon retrieval with authentic evidence

## Context

QMD canon retrieval is the project's principal upside. Current static skill tests and architecture-reference checks do not establish that an agent searched, retrieved and applied the current applicable decision. Tool availability alone and an agent's statement of compliance are insufficient evidence.

## Decision

Propose a development-only behavioral evaluation on one verified goal executor. Require authentic ordered search/retrieval evidence plus answer consistency with the applicable current canon, verified against independently hashed authoritative source bytes, with external oracles and independent bypass controls. Separate infrastructure readiness, evidence validity, successful retrieval and expected blocking. Amend instructions only in response to diagnosed failures. Existing CLI/validate/setup contracts remain unchanged.

Do not claim universal runtime enforcement from successful fixture runs. Include a minimal stale-index transition in core evaluation. Persistent critical bypasses after one targeted amendment fail acceptance and trigger review of mandatory completion enforcement, regardless of aggregate improvement. Baseline-pass requires no speculative amendment; a changed candidate requires held-out confirmation. Complete observable tool/answer/write events are required; this does not claim proof of internal causation. The executor's capture/isolation contract must be verified before live claims.

## Consequences

A bounded proof replaces plausible compliance with inspectable evidence on tested runs. It adds evaluation cost and requires executor tool exports; an executor without these cannot pass. Universal enforcement, multiple adapters and performance sweeps remain conditional. This draft is advisory and awaits explicit Human approval; it changes no runtime behavior.
