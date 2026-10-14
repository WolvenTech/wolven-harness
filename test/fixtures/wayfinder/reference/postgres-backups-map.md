---
title: Postgres backups
description: Decide how the team backs up production Postgres so any day of the last 30 days restores within an hour.
type: map
status: draft
---

# Postgres backups

## Destination

Our three-person team chooses how to back up the production Postgres database so that we can restore any day of the last 30 days within one hour.

## Notes

- Team size is three people, so the chosen approach has to be cheap to run and to learn.
- The one-hour limit covers the whole restore, from the decision to restore until the database accepts queries.

## Decisions so far

## Not yet specified

- Alerting and monitoring for failed or missed backups.

## Out of scope

