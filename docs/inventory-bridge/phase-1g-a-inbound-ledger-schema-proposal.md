# Invyra Inventory Bridge Phase 1G-A Inbound Ledger Schema Proposal

Status: schema proposal only  
Component: Inventory / `chrykoolaid/invyra-base44`  
Phase: `1G-A`  
Runtime state: not implemented and not activated

## Purpose

Phase 1G-A proposes the future Inventory-side inbound ledger schema for ScanOps evidence events.

This document is not a runtime implementation. It must not create a Base44 entity, table, service, API endpoint, sync loop, transport listener, or write path.

The purpose is to define the shape, ownership, validation boundary, and safety expectations for a later explicit implementation phase.

## Design principle

Inventory remains the source of truth.

ScanOps may submit evidence in a future phase, but Inventory must decide whether that evidence is accepted, rejected, duplicated, quarantined, or requires operator review.

A bridge event must never directly mutate operational Inventory state.

## Proposed future entity name

Future Inventory-side ledger entity name:

```text
InventoryBridgeInboundEventLedger
```

This is a proposed name only. It is not created in Phase 1G-A.

## Proposed record purpose

A ledger record represents one submitted bridge event from ScanOps.

The record is evidence of submission and Inventory-side handling. It is not a stock movement, price change, POS action, order action, forecast action, or Item Master action.

## Proposed top-level fields

```text
id
ledger_record_id
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
received_at
processed_at
sequence_number
idempotency_key
payload_hash
payload_signature
payload
status
reason_code
quarantine_reason
operator_action_required
retry_allowed
receipt_id
receipt_signature
created_by
created_at
updated_at
```

## Field intent

| Field | Intent |
| --- | --- |
| `ledger_record_id` | Inventory-owned immutable ledger identifier. |
| `event_id` | ScanOps-owned stable event identifier. |
| `schema_version` | Event contract version. |
| `event_type` | Evidence type such as floor gap, wastage evidence, store-use evidence, or scanner intake evidence. |
| `source_system` | Expected to identify ScanOps. |
| `source_device_id` | Scanner or ScanOps device identifier. |
| `source_session_id` | Capture session identifier. |
| `source_user_id` | Operator identity from ScanOps, subject to Inventory trust review. |
| `store_id` | Store/location boundary. |
| `inventory_instance_id` | Inventory instance boundary. |
| `occurred_at` | When the evidence was captured. |
| `submitted_at` | When ScanOps submitted the event. |
| `received_at` | When Inventory received the event. |
| `processed_at` | When Inventory classified the event. |
| `sequence_number` | Device/session ordering evidence. |
| `idempotency_key` | Duplicate detection key. |
| `payload_hash` | Hash of payload content. |
| `payload_signature` | Signature covering payload and key metadata. |
| `payload` | Evidence payload, stored as immutable submitted data. |
| `status` | Inventory-side handling status. |
| `reason_code` | Machine-readable decision reason. |
| `quarantine_reason` | Additional quarantine explanation where applicable. |
| `operator_action_required` | Whether a human workflow must review the record. |
| `retry_allowed` | Whether ScanOps may retry. |
| `receipt_id` | Inventory-issued receipt identifier. |
| `receipt_signature` | Signature for Inventory receipt. |
| `created_by` | System actor or service actor in a future implementation. |
| `created_at` | Ledger record creation timestamp. |
| `updated_at` | Ledger record update timestamp, if status transitions are allowed. |

## Proposed statuses

```text
RECEIVED
ACCEPTED_TO_LEDGER
REJECTED_SCHEMA
REJECTED_TRUST
REJECTED_SCOPE
DUPLICATE_EVENT
QUARANTINED
TEMPORARY_FAILURE
OPERATOR_REVIEW_REQUIRED
```

## Proposed reason codes

```text
VALID_EVIDENCE_ACCEPTED
SCHEMA_VERSION_UNSUPPORTED
EVENT_TYPE_UNSUPPORTED
MISSING_REQUIRED_FIELD
INVALID_PAYLOAD_HASH
INVALID_SIGNATURE
UNKNOWN_DEVICE
DEVICE_NOT_TRUSTED
STORE_SCOPE_MISMATCH
INVENTORY_INSTANCE_MISMATCH
DUPLICATE_IDEMPOTENCY_KEY
DUPLICATE_EVENT_ID
EVENT_TOO_OLD
EVENT_OUT_OF_ORDER
PAYLOAD_QUARANTINED
KILL_SWITCH_ACTIVE
TEMPORARY_PROCESSING_FAILURE
```

## Proposed event types

Initial future event types should be limited to evidence-only records:

```text
SCANOPS_FLOOR_GAP_EVIDENCE
SCANOPS_WASTAGE_EVIDENCE
SCANOPS_STORE_USE_EVIDENCE
SCANOPS_SCANNER_INTAKE_EVIDENCE
SCANOPS_MARKDOWN_EVIDENCE
```

These event types must not directly post stock movements or mutate operational records.

## Immutability rules

The submitted event envelope and payload should be immutable once accepted into the ledger.

Permitted future changes should be limited to Inventory-owned handling metadata, such as:

```text
status
reason_code
quarantine_reason
operator_action_required
retry_allowed
receipt_id
receipt_signature
processed_at
updated_at
```

Any future status transition must be audit logged.

## Idempotency rules

Inventory should use both `event_id` and `idempotency_key` to prevent duplicate processing.

Duplicate events should return a duplicate receipt rather than creating a second operational effect.

Duplicate evidence may be visible for audit but must not create duplicate review items unless explicitly designed and approved.

## Trust and scope rules

Inventory should reject or quarantine records when:

- The device is unknown.
- The device is not trusted.
- The store scope does not match.
- The Inventory instance does not match.
- The signature is invalid.
- The payload hash is invalid.
- The event type is unsupported.
- The bridge kill switch is active.

## Write boundary

This proposed ledger must not be treated as an operational write path.

Future inbound ledger writes may record submitted evidence only. They must not directly create or update:

- StockMovement records.
- Item Master records.
- Price records.
- POS sale records.
- Order records.
- Forecast records.
- Wastage posted records.
- Store-use posted records.
- Markdown price activation records.

## Operator workflow boundary

Accepted evidence may later support an Inventory review queue or controlled workflow.

Examples:

- Floor gap evidence may support a replenishment review.
- Wastage evidence may support a controlled stock-out draft.
- Store-use evidence may support an exception review.
- Scanner intake evidence may support a review queue.

These workflow transitions must be separate from ledger acceptance.

## Future implementation prerequisites

Before creating any entity or write path, a later phase must define:

- Exact Base44 entity schema.
- Index requirements.
- Retention policy.
- Audit log integration.
- Receipt entity or embedded receipt strategy.
- Quarantine view model.
- Operator review queue relationship.
- Feature flag default-off behavior.
- Kill-switch behavior.
- Failure-mode tests.

## Explicitly forbidden in Phase 1G-A

Phase 1G-A must not add or activate:

- Base44 entities.
- API routes.
- Services.
- Transport listeners.
- Sync loops.
- Event ingestion.
- Event replay.
- Entity writes.
- Inventory writes.
- Stock movement writes.
- Price, POS, order, forecasting, or Item Master mutation.

## Acceptance criteria

Phase 1G-A passes only if this remains a schema proposal document and no runtime or persistence behavior is implemented.
