# Phase 2A Runtime Foundation Architecture

Status: architecture/specification only  
Component: Inventory / `chrykoolaid/invyra-base44`  
Runtime state: not implemented and not activated

## Purpose

Phase 2A starts the bridge runtime foundation architecture for the future ScanOps ↔ Inventory bridge, while keeping all runtime behavior disabled and unimplemented.

This phase defines Inventory-side boundaries for future runtime components. It does not add bridge runtime code, transport, sync, ingestion, replay, entities, persistence writes, Inventory writes, or operational mutation.

## Non-negotiable guardrails

The default outcome of Phase 2A is still:

```text
runtime_activation_allowed=false
transport_allowed=false
sync_allowed=false
ingestion_allowed=false
replay_allowed=false
entity_write_allowed=false
inventory_write_allowed=false
local_persistence_write_allowed=false
stock_mutation_allowed=false
price_mutation_allowed=false
pos_mutation_allowed=false
order_mutation_allowed=false
forecasting_mutation_allowed=false
item_master_mutation_allowed=false
```

## Architecture scope

Phase 2A may define the following future-runtime architecture areas:

- Event contract boundaries.
- Runtime component boundaries.
- Configuration model.
- Trust model implementation design.
- Device identity model.
- Inbound ledger architecture.
- Quarantine architecture.
- Receipt architecture.
- Kill-switch architecture.
- Future activation sequence.

Phase 2A must not implement any of these areas.

## Event contract boundary

Future Inventory-side runtime must treat incoming ScanOps events as evidence envelopes only.

An event envelope may be designed to include:

```text
event_id
idempotency_key
schema_version
event_type
device_id
store_id
inventory_instance_id
capture_timestamp
payload_hash
signature_reference
payload_reference
source_system
operator_reference
```

Inventory must not treat a valid event envelope as a stock movement, price change, POS transaction, order action, forecasting update, or Item Master update.

## Runtime component boundary

Future Inventory-side bridge runtime should be split into separately reviewable components:

```text
BridgeConfiguration
DeviceTrustRegistry
InboundEventValidator
InboundEventLedger
QuarantineQueue
ReceiptWriter
OperatorReviewSurface
BridgeKillSwitch
AuditProjection
```

Each component must remain disabled until a later approved implementation phase.

No component may bypass the Inventory trust gate.

## Configuration model

The future configuration model must be default-off and explicit.

Required configuration boundaries:

```text
bridge_enabled=false
transport_enabled=false
ingestion_enabled=false
replay_enabled=false
accepted_schema_versions=[]
accepted_event_types=[]
trusted_device_ids=[]
allowed_store_ids=[]
target_inventory_instance_id=null
```

Missing, empty, invalid, or partial configuration must evaluate to disabled.

## Trust model implementation design

Inventory must own final trust authority.

Future trust evaluation should require:

- Known Inventory instance.
- Known store/location scope.
- Known device identity.
- Accepted schema version.
- Accepted event type.
- Valid idempotency key.
- Payload integrity verification.
- Non-replayed event identity.

A failed trust check must result in rejection or quarantine, not operational mutation.

## Device identity model

Future device identity must be Inventory-governed.

A device identity may include:

```text
device_id
pairing_status
store_scope
allowed_event_types
trust_status
last_seen_reference
disabled_at
disabled_reason
```

ScanOps must not self-authorize device trust.

## Inbound ledger architecture

Future Inventory ingestion, if later approved, must land in an inbound event ledger rather than operational inventory records.

The inbound ledger must be append-only from the bridge perspective and must support:

- Received status.
- Rejected status.
- Quarantined status.
- Duplicate status.
- Superseded or ignored status where appropriate.
- Receipt correlation.
- Audit traceability.

The inbound ledger must not be the stock ledger.

## Quarantine architecture

Future quarantine handling must be safe by default.

Quarantine should be used when:

- Device trust is unclear.
- Store scope is unclear.
- Schema version is unsupported.
- Event type is unsupported.
- Payload integrity cannot be verified.
- Duplicate/replay state is unclear.
- Operator review is required.

Quarantine release must require Inventory-side authority and must not imply stock, price, POS, order, forecasting, or Item Master mutation.

## Receipt architecture

Future receipts must describe evidence handling only.

Receipt states may include:

```text
received
accepted_as_evidence
rejected
quarantined
duplicate
schema_unsupported
trust_failed
integrity_failed
ignored
```

Receipts must not claim operational inventory changes unless a later separately approved workflow explicitly creates those changes through normal Inventory governance.

## Kill-switch architecture

Future runtime must be disable-first.

Required kill-switch scopes:

```text
global bridge disable
transport disable
ingestion disable
store/location disable
device disable
event-type disable
schema-version disable
trust disable
```

A kill-switch action must stop future bridge activity and preserve evidence/audit history.

## Future activation sequence

Phase 2A does not approve activation.

A future activation path must be split into separate phases:

```text
2B configuration schema proposal only
2C disabled entity/schema implementation
2D validator-only implementation
2E local fixture simulation only
2F transport prototype behind disabled state
2G inbound ledger prototype behind disabled state
2H receipt prototype behind disabled state
2I operator review prototype behind disabled state
2J internal pilot activation proposal
```

Each phase must be separately reviewed and approved.

## Explicit non-authorization

This document does not authorize:

- Runtime bridge activation.
- Transport implementation.
- Sync implementation.
- Ingestion implementation.
- Replay implementation.
- Entity writes.
- Inventory writes.
- Local persistence writes.
- Stock mutation.
- Price mutation.
- POS mutation.
- Order mutation.
- Forecasting mutation.
- Item Master mutation.

## Acceptance criteria

Phase 2A passes only if it remains architecture/specification documentation and no runtime behavior is implemented or activated.
