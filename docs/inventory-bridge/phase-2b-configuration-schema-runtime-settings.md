# Phase 2B Configuration Schema & Runtime Settings Design

Status: architecture/specification only  
Component: Inventory / `chrykoolaid/invyra-base44`  
Runtime state: not implemented and not activated

## Purpose

Phase 2B defines the Inventory-side configuration schema and runtime settings design for the future ScanOps ↔ Inventory bridge.

This phase is documentation/specification only. It does not add runtime bridge code, transport, sync, ingestion, replay, entities, persistence writes, Inventory writes, or operational mutation.

## Non-negotiable guardrails

Phase 2B keeps the default outcome as:

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

## Configuration principles

Inventory-side bridge configuration must be:

- Default-off.
- Explicitly scoped.
- Environment-aware.
- Store/location-aware.
- Device-aware.
- Event-type allow-list based.
- Schema-version allow-list based.
- Kill-switch controlled.
- Auditable.
- Non-mutating by design.

Missing, empty, invalid, or partial configuration must evaluate to disabled.

## Proposed configuration shape

Future configuration may be represented as a single Inventory-owned bridge configuration record or equivalent settings object.

Proposed shape:

```json
{
  "bridge_enabled": false,
  "transport_enabled": false,
  "ingestion_enabled": false,
  "replay_enabled": false,
  "environment": "development|test|training|production",
  "target_inventory_instance_id": null,
  "accepted_schema_versions": [],
  "accepted_event_types": [],
  "allowed_store_ids": [],
  "trusted_device_ids": [],
  "kill_switches": {
    "global_disabled": true,
    "transport_disabled": true,
    "ingestion_disabled": true,
    "replay_disabled": true
  },
  "audit_required": true
}
```

This is a schema proposal only and does not create any entity or runtime object.

## Required settings

A future runtime must require every field below to be valid before any bridge behavior can be considered enabled:

| Setting | Required behavior | Default |
| --- | --- | --- |
| `bridge_enabled` | Master feature flag | `false` |
| `transport_enabled` | Allows transport layer only if separately approved | `false` |
| `ingestion_enabled` | Allows inbound evidence handling only if separately approved | `false` |
| `replay_enabled` | Allows replay only if separately approved | `false` |
| `target_inventory_instance_id` | Binds bridge to one Inventory instance | `null` |
| `accepted_schema_versions` | Allow-list of event schema versions | `[]` |
| `accepted_event_types` | Allow-list of evidence event types | `[]` |
| `allowed_store_ids` | Store/location allow-list | `[]` |
| `trusted_device_ids` | Inventory-owned device trust allow-list | `[]` |
| `kill_switches` | Disable controls | disabled |
| `audit_required` | Requires audit trail for config decisions | `true` |

## Feature flag rules

Feature flags must be hierarchical.

```text
bridge_enabled=false disables everything
transport_enabled=false disables transport even if bridge_enabled=true
ingestion_enabled=false disables inbound handling even if transport exists
replay_enabled=false disables replay regardless of all other settings
```

No child flag may enable behavior if the parent flag is disabled.

## Store/location scope rules

Inventory must reject or quarantine evidence when:

- Store scope is missing.
- Store scope is not allow-listed.
- Store scope conflicts with the target Inventory instance.
- Store scope is broader than the approved deployment scope.

No bridge event may infer store/location scope from operator text alone.

## Device trust configuration

Inventory owns final device trust.

A future trusted device entry may include:

```text
device_id
store_scope
allowed_event_types
trust_status
disabled_at
disabled_reason
last_reviewed_by
last_reviewed_at
```

A device not present in the trusted device allow-list must not be accepted as trusted.

## Event-type allow-list

Accepted event types must be explicit and must align with the existing ScanOps event contract identifiers documented in the Phase 1G inbound-ledger schema and validation material.

A future allow-list may include evidence-only event types such as:

```text
SCANOPS_FLOOR_GAP_EVIDENCE
SCANOPS_WASTAGE_EVIDENCE
SCANOPS_STORE_USE_EVIDENCE
SCANOPS_SCANNER_INTAKE_EVIDENCE
SCANOPS_MARKDOWN_EVIDENCE
```

This list does not authorize any operational mutation. Event types are evidence categories only. Any rename or alias from these identifiers must be handled as a separately documented migration rather than silently changing the allow-list names.

## Schema-version allow-list

Accepted schema versions must be explicit.

Unsupported, missing, or future schema versions must be rejected or quarantined by default.

```text
accepted_schema_versions=[] means no schema is accepted
```

## Kill-switch configuration

Kill-switches must be evaluated before any future runtime action.

Required scopes:

```text
global bridge disable
transport disable
ingestion disable
replay disable
store/location disable
device disable
event-type disable
schema-version disable
trust disable
```

A kill-switch must stop future activity and preserve audit/evidence history.

## Configuration validation rules

Future configuration validation must fail closed when:

- Any required field is missing.
- Any flag is not explicitly boolean.
- Any allow-list is missing or empty where required.
- Inventory instance identity is missing.
- Environment is unknown.
- Store/location scope is ambiguous.
- Device trust is ambiguous.
- Event type is unsupported.
- Schema version is unsupported.
- Kill-switch state is ambiguous.

Failure must result in disabled, rejected, or quarantined state, never mutation.

## Audit requirements

Future configuration changes must be audit-tracked.

Audit should record:

- Field changed.
- Previous value reference.
- New value reference.
- Actor.
- Timestamp.
- Environment.
- Reason.
- Approval reference where required.

Audit records must not require stock, price, POS, order, forecasting, or Item Master mutation.

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

Phase 2B passes only if it remains configuration schema/runtime settings design documentation and no runtime behavior is implemented or activated.
