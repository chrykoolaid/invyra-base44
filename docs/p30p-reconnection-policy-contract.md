# P30-P Reconnection Policy Contract

Phase 30-P defines the future reconnection policy shape for the Inventory-side bridge.

This phase is contract-only. It does not activate recovery loops, status pings, health persistence, queue replay, transport, listeners, networking, or runtime behavior.

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

## Future candidate references

Future phases may define references for:

```text
recovery policy candidate
retry sequence
backoff policy
maximum attempts
last success
last failure
bridge status
device status
status ping
last seen
```

These are references only in this phase.

## Hard-disabled state

```text
recovery loop active = false
recovery scheduled = false
recovery attempted = false
status ping sent = false
status ping received = false
last seen updated = false
queue replay active = false
listener active = false
transport active = false
network call attempted = false
event sent = false
event received = false
health persisted = false
recovery state persisted = false
```

## Prohibited behavior

This phase must not:

```text
start recovery loops
schedule recovery attempts
attempt recovery
send status pings
receive status pings
update last seen
replay queues
open listeners
call transport
send events
receive events
persist health
persist recovery state
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

The bridge remains completely inactive after Phase 30-P.
