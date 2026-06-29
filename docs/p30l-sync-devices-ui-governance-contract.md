# P30-L Sync & Devices UI Governance Contract

Phase 30-L locks the Inventory Settings → Sync & Devices UI foundation created in Phase 30-K as a governance-only bridge surface.

This phase does not modify the UI implementation. It defines the rules that future bridge UI work must follow while the bridge remains inactive.

## Scope

- TEST and TRAINING UI governance contract only.
- LIVE, PRODUCTION, and UNKNOWN are blocked.
- Inactive contract only.
- Hard-disabled operations.
- Candidate-only.
- Preview-only.
- Inventory remains the system of record.
- ScanOps remains the operational scanner execution layer.
- The bridge remains client-network portable.
- Desktop-first.
- Local-network-first.
- Offline-capable.
- UI governance only.

## Allowed UI surface

The Sync & Devices page may show readiness-only information:

```text
bridge status display
scanner fleet count display
trusted device count display
pending device count display
bridge contract checklist display
queue visibility placeholder
diagnostics placeholder
device trust placeholder
labels and printers placeholder
configuration readiness copy
```

These are display-only surfaces. They must not imply that the bridge is active.

## Required disabled actions

The following controls must remain disabled during the current bridge contract phases:

```text
Configure Bridge
Test Connection
Start Bridge
Enable Sync
Register Device
Add Printer
Test Print
```

Disabled controls may be visible for future product shape, but they must not trigger runtime behavior.

## Prohibited UI behavior

The UI must not:

```text
open a network listener
scan the network
test a connection
start bridge runtime
enable sync runtime
register scanner devices
issue pairing tokens
trust devices
create endpoints
persist endpoints
persist device registry records
process queues
process inbox records
emit receipts
print labels
create printer jobs
```

## Portable network guardrail

No UI surface, placeholder, fixture, validator, or documentation may assume or embed developer-specific networking information, including fixed IP addresses, router details, SSIDs, gateways, machine names, or local development environments.

Future connection order remains:

1. Automatic local discovery on the same LAN/Wi-Fi.
2. QR Code pairing.
3. Manual IP or hostname as an advanced fallback.
4. IT or administrator setup.

These are future implementation paths only. They are not active in Phase 30-L.

## Hard-disabled runtime state

```text
bridge runtime enabled = false
bridge runtime started = false
listener active = false
transport active = false
discovery active = false
QR pairing active = false
manual endpoint active = false
network call attempted = false
endpoint configured = false
endpoint persisted = false
device registered = false
device trusted = false
pairing token issued = false
queue processed = false
inbox processed = false
receipt emitted = false
printer job created = false
```

## Mutation guardrails

The UI governance contract must not allow:

```text
Inventory writes
ScanOps writes
stock mutation
workflow mutation
Item Master mutation
price mutation
accounting mutation
purchase order mutation
forecast mutation
runtime activation
persistence
write attempts
mutation attempts
```

## Relationship to Phase 30-K

Phase 30-K added the visible Sync & Devices bridge UI foundation.

Phase 30-L does not expand that UI. It locks the governance boundary around it so future development cannot accidentally turn readiness cards, disabled buttons, or diagnostic placeholders into runtime behavior.

The bridge remains completely inactive after Phase 30-L.
