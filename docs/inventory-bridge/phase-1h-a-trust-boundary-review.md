# Phase 1H-A Bridge Trust Boundary Review

Status: review only  
Component: Inventory / `chrykoolaid/invyra-base44`  
Runtime state: not implemented and not activated

## Purpose

Phase 1H-A reviews the trust boundary between ScanOps and Inventory before any runtime implementation is considered.

This document is review-only. It does not create runtime bridge code, transport, sync, ingestion, replay, entities, persistence writes, Inventory writes, or operational mutation.

## Trust boundary summary

The bridge trust boundary is:

```text
ScanOps capture evidence
  -> future local outbox
  -> future transport boundary
  -> Inventory trust gate
  -> Inventory inbound ledger / quarantine decision
  -> Inventory receipt
```

Inventory owns the final trust decision.

ScanOps may prepare and submit evidence in a future phase, but ScanOps must not self-authorize Inventory trust, Inventory writes, or operational outcomes.

## Inventory-owned trust decisions

Inventory must own future decisions for:

- Device trust.
- Store scope.
- Inventory instance scope.
- Event type allowance.
- Schema version allowance.
- Receipt generation.
- Quarantine classification.
- Ledger acceptance.
- Operator review requirement.
- Stop-control state.
- Effective runtime enabled state.

## ScanOps claims that require Inventory verification

Future ScanOps evidence may claim:

- Source device identity.
- Source user identity.
- Source session identity.
- Store identity.
- Inventory instance identity.
- Event type.
- Event timestamp.
- Sequence number.
- Payload hash.
- Payload signature.
- Idempotency key.

Inventory must verify these claims before classifying the event.

## Trust boundary rules

1. ScanOps evidence is not Inventory truth.
2. A sent event is not an accepted event.
3. An accepted-to-ledger event is not an operational mutation.
4. Inventory receipts are classification records, not proof of stock change.
5. Device trust must be Inventory-owned.
6. Store and instance scope must be Inventory-owned.
7. Unknown, malformed, duplicate, stale, unsigned, or out-of-scope evidence must be rejected, deferred, or quarantined.
8. Stop controls override all runtime eligibility.
9. Missing configuration resolves to disabled.
10. Future runtime must remain default-off until separately approved.

## Future trust gate inputs

A future Inventory trust gate may inspect:

```text
event_id
schema_version
event_type
source_system
source_device_id
source_session_id
source_user_id
store_id
inventory_instance_id
occurred_at
submitted_at
sequence_number
idempotency_key
payload_hash
payload_signature
payload
```

## Future trust gate outputs

A future Inventory trust gate may produce:

```text
ACCEPTED_TO_LEDGER
REJECTED_SCHEMA
REJECTED_TRUST
REJECTED_SCOPE
DUPLICATE_EVENT
QUARANTINED
TEMPORARY_FAILURE
OPERATOR_REVIEW_REQUIRED
```

## Explicit no-mutation boundary

Trust classification must not directly create or update:

- Stock movements.
- Item Master records.
- Price records.
- POS sale records.
- Order records.
- Forecast records.
- Posted wastage records.
- Posted store-use records.
- Markdown price activation records.

## Future review questions

Before implementation, the team must answer:

- How is device trust established?
- How is trust revoked?
- How are keys or signatures rotated?
- How is store scope mapped?
- How is Inventory instance identity mapped?
- How are duplicate events handled?
- How are stale or out-of-order events handled?
- How are receipts signed or verified?
- How are rejected events surfaced to operators?
- How are quarantined events reviewed?

## Acceptance criteria

Phase 1H-A passes only if this remains review documentation and no runtime behavior is implemented.
