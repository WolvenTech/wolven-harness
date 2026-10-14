---
title: Billing migration
type: map
status: draft
---

# Billing migration

## Destination

Move billing to usage-based invoicing without a missed invoice cycle.

## Notes

Charted from the invoicing audit.

## Decisions so far

- [Invoices are flat per-seat lines](01-audit-invoices.md)
- [Bill on API calls, not seats](02-pick-meter.md)
- [Tax is added after metering](03-tax-rules.md)
- [Bill in the customer currency](04-currency-policy.md)
- [One event per call with a tenant id](05-meter-events.md)
- [Monthly, in arrears](06-invoice-cycle.md)
- [Round per line, half up](07-rounding.md)
- [Prorate by day](08-proration.md)
- [First 1000 calls free](09-free-tier.md)
- [A credit note mirrors its invoice line](10-credit-notes.md)

## Not yet specified

- Enterprise contracts
- Reseller pricing
- Tax exemption certificates
- Invoice language and locale
- Usage alerts for customers

## Out of scope

- [Support multiple legal entities](28-multi-entity.md)
- [Self-serve refunds](29-self-serve-refund.md)
- [White-label invoices](30-white-label.md)
