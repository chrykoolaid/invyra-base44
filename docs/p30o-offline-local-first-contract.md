# P30-O Offline Local-First Contract

Phase 30-O locks the bridge as desktop-first, local-network-first, and offline-capable.

This phase defines policy only. It does not activate bridge runtime behavior.

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
- Cloud optional.

## Policy

Normal in-store scanning must not require cloud connectivity.

Future cloud services may support backup, management, monitoring, or diagnostics, but the normal scanner workflow must remain local-first.

## Candidate references

Future phases may define references for:

```text
offline state
local bridge state
local queue state
reconnect policy
```

These are references only in this phase.

## Hard-disabled state

```text
offline state created = false
offline state persisted = false
local queue created = false
local queue persisted = false
queue replay active = false
reconnect loop active = false
cloud call attempted = false
cloud required for scanning = false
listener active = false
transport active = false
network call attempted = false
event sent = false
event received = false
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

The bridge remains completely inactive after Phase 30-O.
