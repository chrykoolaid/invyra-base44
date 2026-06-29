# P30-T Device Governance Bundle

Phase 30-T accelerates the remaining bridge foundation work by bundling future device capability, scanner profile, local link reference, and device boundary rules into one contract-only phase.

This phase defines future references only. It does not create device records, enable devices, create local link references, persist scanner profiles, start device sessions, open listeners, call transport, send events, receive events, or activate runtime behavior.

## Scope

- TEST and TRAINING contract only.
- LIVE, PRODUCTION, and UNKNOWN are blocked.
- Inactive contract only.
- Hard-disabled operations.
- Candidate-only.
- Preview-only.
- Inventory remains the system of record.
- ScanOps remains the handheld operational layer.
- The bridge remains client-network portable.
- Each client installation owns its own device boundary.
- Desktop-first.
- Local-network-first.
- Offline-capable.
- Device governance only.

## Future candidate references

Future phases may define references for:

```text
device capability
scanner model
camera scanner
hardware scanner
printer capability
offline queue capability
scanner profile
device ID
site ID
session policy
role scope
local link reference
bridge identity reference
session ID
```

These are references only in this phase.

## Hard-disabled state

```text
device record created = false
device enabled = false
local link reference created = false
local link reference accepted = false
scanner profile persisted = false
device capability persisted = false
local link reference persisted = false
cross-installation link allowed = false
device session started = false
listener active = false
transport active = false
network call attempted = false
event sent = false
event received = false
```

## Prohibited behavior

This phase must not:

```text
create device records
enable devices
create local link references
accept local link references
persist scanner profiles
persist device capabilities
persist local link references
share local links across installations
start device sessions
open listeners
call transport
send events
receive events
```

## Mutation guardrails

This phase must not allow:

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

The bridge remains completely inactive after Phase 30-T.
