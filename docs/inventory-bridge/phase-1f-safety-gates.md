# Invyra Inventory Bridge Phase 1F Safety Gates

Status: specification only  
Component: Inventory / `chrykoolaid/invyra-base44`  
Runtime state: not implemented and not activated

## Purpose

This document defines the safety gates that must exist before any future ScanOps <-> Inventory Bridge runtime activation work can proceed.

It is not an implementation checklist for live runtime behavior. It is a stop/go specification for later phases.

## Gate 0 — Non-operational baseline

Before future work begins, both repos must still pass their stack validators from fresh `main`:

```powershell
node .\scripts\validate-inventory-bridge-stack.mjs
node .\scripts\validate-scanops-inventory-bridge-stack.mjs
```

Required result:

```text
Inventory bridge stack validation PASS
ScanOps bridge stack validation PASS
```

## Gate 1 — Feature flag default-off

Any future runtime bridge code must be guarded by a hard-disabled feature flag or equivalent configuration gate.

Default state:

```text
bridge_runtime_enabled=false
```

A missing, malformed, or unavailable configuration value must resolve to disabled.

## Gate 2 — Device trust required

Inventory must reject or quarantine bridge events unless the source device is explicitly trusted by an Inventory-owned trust decision.

Trust must not be inferred from IP address, device self-reporting, or ScanOps-only state.

## Gate 3 — Signed event envelope required

Inventory must reject or quarantine events that fail signature, payload hash, schema, scope, sequence, or idempotency checks.

An unsigned event must never become a stock movement, price change, order change, POS change, forecast change, or Item Master change.

## Gate 4 — Inbound ledger before workflow

Future inbound events must first land in an Inventory-owned inbound ledger or quarantine ledger.

Bridge events must not directly mutate operational entities.

## Gate 5 — Review before mutation

Any future operational effect must happen through an explicit Inventory workflow after validation and review.

Examples:

- Scanner evidence may become a review queue entry.
- Scanner evidence may support a controlled stock-out draft.
- Scanner evidence may support a floor-gap review.

Scanner evidence must not directly post stock movements.

## Gate 6 — Receipts and audit required

Every bridge submission must produce a receipt and an audit trail.

Required receipt outcomes:

```text
ACCEPTED_TO_LEDGER
REJECTED_SCHEMA
REJECTED_TRUST
REJECTED_SCOPE
DUPLICATE_EVENT
QUARANTINED
TEMPORARY_FAILURE
```

## Gate 7 — Kill switch required

Inventory must have a kill switch that blocks runtime bridge processing without requiring code changes.

Kill-switch-on behavior must reject or defer inbound events safely and must not lose audit visibility.

## Gate 8 — No silent fallback activation

The bridge must not silently activate because of missing config, development mode, default ports, detected LAN peers, or available ScanOps devices.

Manual administrative activation must be explicit, audited, and reversible.

## Gate 9 — Failure-mode tests required

Before runtime activation, tests must cover:

- Duplicate event.
- Stale event.
- Out-of-order event.
- Unknown device.
- Disabled feature flag.
- Bad signature.
- Payload tampering.
- Network retry.
- Inventory offline.
- ScanOps offline.
- Quarantine path.
- Receipt retry.

## Gate 10 — Commercial safety review

Before activation, the bridge must pass a product-level safety review for retail operations.

The review must confirm that handheld scanner behavior cannot unexpectedly change stock, prices, POS sale behavior, orders, forecasts, or Item Master data.

## Phase 1F acceptance

Phase 1F passes only if these gates are documented without implementing runtime bridge behavior.
