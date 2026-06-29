# P31-B Connection Setup Bundle

Phase 31-B continues the accelerated Phase 31 implementation foundation series.

This phase defines future local lookup, QR reference, manual host fallback, administrator setup, and identity reference shapes. It does not execute connection setup.

## Scope

- TEST and TRAINING foundation only.
- LIVE, PRODUCTION, and UNKNOWN are blocked.
- Connection setup references only.
- Inventory remains the system of record.
- ScanOps remains the handheld operational layer.
- The bridge remains client-network portable.
- Desktop-first.
- Local-first.
- Offline-capable.

## Setup order

Future connection setup order remains:

```text
1. Local lookup reference
2. QR reference
3. Manual host reference
4. Administrator setup reference
```

These are references only in this phase.

## Candidate references

Future phases may define references for:

```text
local lookup
QR setup
manual host fallback
administrator setup
installation identity
bridge identity
device identity
session identity
```

## Disabled operations

This phase must not:

```text
start local lookup
create QR reference
accept QR reference
check manual host
save manual host
check identity
open listeners
start transport
persist setup state
```

## Feature flags

All flags remain false:

```text
local lookup enabled = false
QR reference enabled = false
manual host enabled = false
administrator setup enabled = false
identity check enabled = false
```

## Guardrails

This phase must not allow:

```text
Inventory writes
ScanOps writes
runtime activation
persistence
write attempts
mutation attempts
```

The bridge remains inactive after Phase 31-B.
