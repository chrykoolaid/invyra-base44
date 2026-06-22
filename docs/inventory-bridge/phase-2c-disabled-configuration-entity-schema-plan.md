# Phase 2C Disabled Configuration Entity / Schema Implementation Plan

Status: implementation planning only  
Component: Inventory / `chrykoolaid/invyra-base44`  
Runtime state: not implemented and not activated

## Purpose

Phase 2C defines the Inventory-side plan for a future disabled configuration entity/schema. This is not the implementation itself.

The goal is to prepare a safe, default-off shape for later configuration storage without enabling bridge runtime behavior.

## Non-negotiable guardrails

Phase 2C remains documentation/specification only:

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

## Proposed future entity purpose

A future Inventory-owned bridge configuration entity may store only default-off bridge settings and governance state.

It must not store operational stock, price, POS, order, forecasting, or Item Master data.

The entity must not activate runtime by existing.

## Proposed future entity name

Suggested name:

```text
InventoryBridgeConfiguration
```

This name is a proposal only. It does not create a Base44 entity in this phase.

## Proposed future fields

A future disabled schema may include:

```text
id
environment
bridge_enabled
transport_enabled
ingestion_enabled
replay_enabled
target_inventory_instance_id
accepted_schema_versions
accepted_event_types
allowed_store_ids
trusted_device_ids
kill_switches
audit_required
created_by
updated_by
created_at
updated_at
last_reviewed_by
last_reviewed_at
```

All runtime flags must default to `false`.

## Required defaults

```text
bridge_enabled=false
transport_enabled=false
ingestion_enabled=false
replay_enabled=false
accepted_schema_versions=[]
accepted_event_types=[]
allowed_store_ids=[]
trusted_device_ids=[]
kill_switches.global_disabled=true
audit_required=true
```

Missing configuration must equal disabled configuration.

## Validation design

Future validation must fail closed when:

- Environment is unknown.
- Inventory instance identity is missing.
- Any runtime flag is not explicitly boolean.
- Any allow-list is malformed.
- Store/location scope is missing.
- Device trust is ambiguous.
- Event type is unsupported.
- Schema version is unsupported.
- Kill-switch state is ambiguous.

Failure must produce disabled, rejected, or quarantined governance state only.

## Event allow-list alignment

The accepted event type allow-list must use the existing ScanOps event identifiers:

```text
SCANOPS_FLOOR_GAP_EVIDENCE
SCANOPS_WASTAGE_EVIDENCE
SCANOPS_STORE_USE_EVIDENCE
SCANOPS_SCANNER_INTAKE_EVIDENCE
SCANOPS_MARKDOWN_EVIDENCE
```

Any rename, alias, or migration must be separately documented.

## Future migration boundary

A future implementation phase must introduce the entity/schema in a disabled state only.

The first implementation must not:

- Register runtime handlers.
- Start transport.
- Start ingestion.
- Start replay.
- Process events.
- Write Inventory records.
- Write stock movements.
- Change prices.
- Affect POS.
- Affect orders.
- Affect forecasts.
- Mutate Item Master records.

## UI boundary

A future UI may display the disabled configuration state for Admin/Owner review only.

It must not expose an activation toggle unless a later activation-governance phase explicitly approves that capability.

## Audit boundary

Future configuration changes must be audit logged, but audit logging must not imply bridge runtime activity.

Audit records should track:

- Field changed.
- Previous value reference.
- New value reference.
- Actor.
- Environment.
- Reason.
- Approval reference.
- Timestamp.

## Explicit non-authorization

This document does not authorize entity creation, runtime activation, transport, sync, ingestion, replay, writes, or operational mutation.

## Acceptance criteria

Phase 2C passes only if it remains documentation-only planning for a future disabled entity/schema and no runtime behavior is implemented or activated.
