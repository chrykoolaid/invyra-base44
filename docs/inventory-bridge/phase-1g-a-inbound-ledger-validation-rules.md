# Invyra Inventory Bridge Phase 1G-A Inbound Ledger Validation Rules

Status: validation rules proposal only  
Component: Inventory / `chrykoolaid/invyra-base44`  
Phase: `1G-A`  
Runtime state: not implemented and not activated

## Purpose

This document proposes the validation rules that a future Inventory inbound ledger should apply before classifying ScanOps evidence events.

It is documentation only. It does not implement validation code, event ingestion, transport, sync, entity writes, or Inventory writes.

## Validation order

A future implementation should validate bridge submissions in a strict order:

```text
1. Feature flag / kill switch
2. Envelope shape
3. Required fields
4. Schema version
5. Event type
6. Scope
7. Device trust
8. Payload hash
9. Signature
10. Timestamp and clock skew
11. Sequence rules
12. Idempotency and duplicate detection
13. Payload-specific rules
14. Ledger classification
15. Receipt generation
```

A failure at any step should stop later processing and return a safe receipt.

## Rule 1 — Feature flag and kill switch

If bridge runtime is disabled, Inventory must not process the event as operational input.

Future result:

```text
status: REJECTED_SCOPE or QUARANTINED
reason_code: KILL_SWITCH_ACTIVE
retry_allowed: false unless policy explicitly allows deferred retry
operator_action_required: false or true by policy
```

Missing configuration must default to disabled.

## Rule 2 — Envelope shape

The event envelope must be an object with known top-level fields.

Malformed or non-object events must be rejected.

Future result:

```text
status: REJECTED_SCHEMA
reason_code: MISSING_REQUIRED_FIELD or SCHEMA_VERSION_UNSUPPORTED
retry_allowed: false
```

## Rule 3 — Required fields

The following fields should be required before any ledger acceptance:

```text
event_id
schema_version
event_type
source_system
source_device_id
store_id
inventory_instance_id
occurred_at
submitted_at
idempotency_key
payload_hash
payload_signature
payload
```

Missing fields must block acceptance.

## Rule 4 — Schema version

Unsupported schema versions must be rejected or quarantined.

Inventory should not guess compatibility.

Future result:

```text
status: REJECTED_SCHEMA
reason_code: SCHEMA_VERSION_UNSUPPORTED
retry_allowed: false
```

## Rule 5 — Event type

Unsupported event types must be rejected.

Future Phase 1G-A evidence-only event types:

```text
SCANOPS_FLOOR_GAP_EVIDENCE
SCANOPS_WASTAGE_EVIDENCE
SCANOPS_STORE_USE_EVIDENCE
SCANOPS_SCANNER_INTAKE_EVIDENCE
SCANOPS_MARKDOWN_EVIDENCE
```

No event type may directly mutate Inventory operational records.

## Rule 6 — Scope

Inventory must verify that the event belongs to the expected store and Inventory instance.

Scope mismatch must block acceptance.

Future result:

```text
status: REJECTED_SCOPE
reason_code: STORE_SCOPE_MISMATCH or INVENTORY_INSTANCE_MISMATCH
retry_allowed: false
```

## Rule 7 — Device trust

Inventory must verify the source device against an Inventory-owned trust decision.

Trust must not be inferred from:

- IP address.
- Local network presence.
- Device self-reporting.
- ScanOps-only state.
- Previous successful submission alone.

Future result for untrusted devices:

```text
status: REJECTED_TRUST
reason_code: UNKNOWN_DEVICE or DEVICE_NOT_TRUSTED
retry_allowed: false
```

## Rule 8 — Payload hash

Inventory must verify that the payload hash matches the submitted payload.

Hash mismatch should be treated as tampering or corruption.

Future result:

```text
status: QUARANTINED
reason_code: INVALID_PAYLOAD_HASH
retry_allowed: false
operator_action_required: true
```

## Rule 9 — Signature

Inventory must verify the submitted signature using the approved device trust model.

Invalid signatures must never be accepted to an operational workflow.

Future result:

```text
status: REJECTED_TRUST or QUARANTINED
reason_code: INVALID_SIGNATURE
retry_allowed: false
```

## Rule 10 — Timestamp and clock skew

Inventory must reject or quarantine events outside allowed timestamp windows.

Clock skew policy must be explicit before implementation.

Future result:

```text
status: QUARANTINED
reason_code: EVENT_TOO_OLD
operator_action_required: true
```

## Rule 11 — Sequence rules

Inventory may use `sequence_number` to detect out-of-order submissions within a source device or session.

Out-of-order events should not directly fail unless the future policy requires strict ordering.

Future possible result:

```text
status: QUARANTINED
reason_code: EVENT_OUT_OF_ORDER
operator_action_required: true
```

## Rule 12 — Idempotency and duplicate detection

Inventory must check both `event_id` and `idempotency_key`.

A duplicate should not create a second operational effect.

Future result:

```text
status: DUPLICATE_EVENT
reason_code: DUPLICATE_EVENT_ID or DUPLICATE_IDEMPOTENCY_KEY
retry_allowed: false
```

A duplicate receipt may reference the original ledger record.

## Rule 13 — Payload-specific rules

Each event type must define payload-specific validation before implementation.

Examples:

- Floor gap evidence must identify item, shelf/location evidence, observed state, and capture time.
- Wastage evidence must identify item, quantity evidence, reason evidence, and operator/session context.
- Store-use evidence must identify item, quantity evidence, reason, cost-center context, and operator/session context.
- Scanner intake evidence must identify source scan batch, device/session, and raw scan evidence.
- Markdown evidence must identify markdown context without changing Item Master price.

## Rule 14 — Ledger classification

After validation, Inventory classifies the event into one of the proposed statuses.

Classification must be audit-safe and deterministic.

## Rule 15 — Receipt generation

Every submission should produce a receipt.

The receipt must not claim operational mutation occurred unless a later separate workflow actually performs that mutation.

## Forbidden validation shortcuts

Future implementation must not:

- Skip validation in development mode.
- Trust events based on IP address alone.
- Accept events because the device name matches.
- Auto-create trusted devices from incoming events.
- Auto-create stock movements from evidence.
- Auto-approve wastage or store-use from evidence.
- Auto-change prices from markdown evidence.
- Auto-change Item Master data.

## Acceptance criteria

Phase 1G-A passes only if these rules remain documentation-only and no validation runtime is implemented.
