# Phase 2D Disabled Runtime Component Mapping

Status: architecture mapping only  
Component: Inventory / `chrykoolaid/invyra-base44`  
Runtime state: not implemented and not activated

## Purpose

Phase 2D maps future Inventory-side bridge runtime components without implementing them.

The goal is to define component ownership, dependency boundaries, failure containment, and kill-switch interactions before any disabled scaffolding is considered.

## Non-negotiable guardrails

Phase 2D remains documentation-only:

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

## Future Inventory component map

Future Inventory-side bridge runtime may be separated into these disabled components:

```text
BridgeConfigurationService
DeviceTrustRegistry
InboundEventValidator
InboundEventLedgerService
QuarantineEngine
ReceiptLedger
OperatorReviewSurface
BridgeKillSwitchService
BridgeAuditProjection
```

These are proposed logical components only. Phase 2D does not create files, services, entities, handlers, or runtime code.

## Component responsibility map

| Component | Future responsibility | Must not do |
| --- | --- | --- |
| `BridgeConfigurationService` | Read default-off bridge settings | Enable runtime by default |
| `DeviceTrustRegistry` | Evaluate Inventory-owned device trust | Accept ScanOps self-trust |
| `InboundEventValidator` | Validate event envelope, schema, scope, idempotency | Create stock or operational records |
| `InboundEventLedgerService` | Record evidence handling state if later approved | Act as the stock ledger |
| `QuarantineEngine` | Route unclear evidence to governance review | Release evidence into mutation |
| `ReceiptLedger` | Describe evidence handling outcomes | Claim operational Inventory changes |
| `OperatorReviewSurface` | Show evidence status and governance decisions | Present evidence as stock updates |
| `BridgeKillSwitchService` | Disable bridge activity by scope | Delete evidence or audit history |
| `BridgeAuditProjection` | Project governance/audit history | Hide configuration or trust changes |

## Dependency map

Future dependencies must flow in a safe order:

```text
BridgeConfigurationService
  -> BridgeKillSwitchService
  -> DeviceTrustRegistry
  -> InboundEventValidator
  -> InboundEventLedgerService
  -> QuarantineEngine
  -> ReceiptLedger
  -> OperatorReviewSurface
  -> BridgeAuditProjection
```

No component may bypass configuration, kill-switch, device trust, or validation boundaries.

## Activation sequence map

A future activation sequence must remain split across later phases:

```text
configuration schema exists disabled
component stubs exist disabled
validator-only fixture simulation
quarantine-only fixture simulation
receipt-only fixture simulation
operator review display only
transport disabled prototype
inbound ledger disabled prototype
internal pilot proposal
```

Phase 2D authorizes none of these steps.

## Failure containment boundaries

Future components must fail closed:

- Missing configuration disables all components.
- Kill-switch state disables affected scope.
- Unknown device rejects or quarantines evidence.
- Unknown store/location rejects or quarantines evidence.
- Unsupported schema rejects or quarantines evidence.
- Unsupported event type rejects or quarantines evidence.
- Duplicate or replayed event returns evidence handling status only.
- Receipt mismatch must not create operational correction.
- Operator review cannot bypass ledger or trust boundaries.

## Kill-switch interaction map

Required kill-switch scopes:

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

Kill-switch evaluation must occur before validation, ledger write proposals, quarantine release proposals, receipt handling, and operator review actions.

## Cross-system ownership boundary

Inventory owns:

- Target Inventory instance authority.
- Device trust acceptance.
- Store/location acceptance.
- Inbound validation authority.
- Quarantine governance.
- Receipt semantics.
- Disable authority.
- Final No-Go decisions.

ScanOps owns capture-side evidence creation only. ScanOps must not self-authorize Inventory trust.

## Explicit non-authorization

This document does not authorize runtime code, entity creation, service creation, transport, sync, ingestion, replay, writes, or operational mutation.

## Acceptance criteria

Phase 2D passes only if it remains component mapping documentation and no runtime behavior is implemented or activated.
