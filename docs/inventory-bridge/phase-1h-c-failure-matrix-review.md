# Phase 1H-C Bridge Failure Matrix Review

Status: review only  
Component: Inventory / `chrykoolaid/invyra-base44`  
Runtime state: not implemented and not activated

## Purpose

Phase 1H-C reviews future failure modes for the ScanOps <-> Inventory Bridge from the Inventory side.

This is documentation only. It does not implement runtime bridge code, transport, sync, ingestion, replay, entities, persistence writes, Inventory writes, or operational mutation.

## Failure matrix overview

Future bridge behavior must assume that evidence submission can fail safely at every boundary:

```text
ScanOps capture
  -> ScanOps queue
  -> future transport
  -> Inventory trust gate
  -> Inventory classification
  -> receipt generation
  -> ScanOps receipt reconciliation
```

Every failure must preserve Inventory as source of truth and must not create direct operational mutation.

## Inventory-side failure matrix

| Failure mode | Future Inventory response | Retry allowed | Operator action | Operational mutation allowed |
| --- | --- | --- | --- | --- |
| Bridge disabled | Refuse or defer classification | No by default | Optional notice | No |
| Unknown device | Reject trust | No | Yes | No |
| Device trust revoked | Reject trust | No | Yes | No |
| Store scope mismatch | Reject scope | No | Yes | No |
| Inventory instance mismatch | Reject scope | No | Yes | No |
| Unsupported schema version | Reject schema | No | Yes | No |
| Unknown event type | Reject schema or scope | No | Yes | No |
| Missing required field | Reject schema | No | Yes | No |
| Missing idempotency key | Reject schema | No | Yes | No |
| Duplicate event id | Duplicate classification | No | Optional | No |
| Duplicate idempotency key | Duplicate classification | No | Optional | No |
| Payload hash mismatch | Quarantine | No | Yes | No |
| Signature mismatch | Reject trust or quarantine | No | Yes | No |
| Stale event | Quarantine or reject scope | No | Yes | No |
| Out-of-order event | Quarantine or operator review | No by default | Yes | No |
| Inventory temporary processing issue | Temporary failure | Yes by policy | Optional | No |
| Receipt generation issue | Temporary failure or defer | Yes by policy | Optional | No |
| Archive policy issue | Defer archive | No | Yes | No |

## Required failure principles

1. Failure must be explicit.
2. Failure must produce a reason code in a future implementation.
3. Failure must not silently succeed.
4. Failure must not create stock movements.
5. Failure must not change prices.
6. Failure must not change POS behavior.
7. Failure must not change orders.
8. Failure must not change forecasts.
9. Failure must not change Item Master records.
10. Failure must remain auditable.

## Receipt expectations for failures

Future failure receipts should be clear and machine-readable.

Potential receipt statuses include:

```text
REJECTED_SCHEMA
REJECTED_TRUST
REJECTED_SCOPE
DUPLICATE_EVENT
QUARANTINED
TEMPORARY_FAILURE
```

A failure receipt must not claim an operational Inventory change occurred.

## Quarantine expectations

Quarantine should be used for suspicious, ambiguous, stale, tampered, or review-heavy evidence.

Quarantined evidence must not become an operational workflow input until a separate future review process allows it.

## Retry expectations

Retry should be conservative.

Only temporary failures should be retryable by default.

Trust failures, schema failures, scope failures, duplicate events, and quarantined events should not auto-retry without a later explicit policy.

## Audit expectations

A future implementation must audit:

- failure status;
- reason code;
- source event id;
- source device id;
- store scope;
- Inventory instance scope;
- receipt id where available;
- operator action requirement;
- retry eligibility;
- classification timestamp.

## Future implementation questions

Before implementation, the team must answer:

- Which failures produce receipts?
- Which failures create quarantine records?
- Which failures are visible to operators?
- Which temporary failures are retryable?
- How is retry backoff defined?
- How are duplicate receipts linked to original events?
- How long are failed events retained?
- How are repeated failures surfaced to administrators?

## Acceptance criteria

Phase 1H-C passes only if this remains failure matrix review documentation and no runtime behavior is implemented.
