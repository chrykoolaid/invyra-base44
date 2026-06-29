# P30-R Status Visibility Contract

Phase 30-R defines future read-only bridge status visibility categories.

This phase is contract-only. It does not collect status, probe devices, refresh runtime state, persist summaries, open listeners, call transport, send events, receive events, or activate runtime behavior.

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
- Desktop-first.
- Local-network-first.
- Offline-capable.
- Visibility only.

## Future candidate references

Future phases may define read-only references for:

```text
bridge status
device count
queue count
readiness message
network status
device status
queue status
printer status
```

These are references only in this phase.

## Hard-disabled state

```text
status collected = false
device probe attempted = false
bridge probe attempted = false
runtime state refreshed = false
visible summary persisted = false
status category persisted = false
listener active = false
transport active = false
network call attempted = false
event sent = false
event received = false
```

## Prohibited behavior

This phase must not:

```text
collect status
probe devices
probe bridge
refresh runtime state
persist visible summaries
persist status categories
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

The bridge remains completely inactive after Phase 30-R.
