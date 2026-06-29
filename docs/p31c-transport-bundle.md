# P31-C Transport Bundle

Phase 31-C continues the accelerated Phase 31 implementation foundation series.

This phase defines the transport abstraction and connection lifecycle references only. It does not start a transport, establish a session, open listeners, start polling, send events, receive events, persist connection state, or process business payloads.

## Scope

- TEST and TRAINING foundation only.
- LIVE, PRODUCTION, and UNKNOWN are blocked.
- Transport abstraction only.
- Connection lifecycle references only.
- Inventory remains the system of record.
- ScanOps remains the handheld operational layer.
- The bridge remains client-network portable.
- Desktop-first.
- Local-first.
- Offline-capable.

## Transport states

Allowed Phase 31-C states:

```text
NOT_CONFIGURED
PREVIEW_ONLY
READY_DISABLED
BLOCKED
```

There is no executable send, receive, listener, polling, or connected state in this phase.

## Candidate references

Future phases may define references for:

```text
transport adapter
connection lifecycle
session
receipt
connection state
```

These are references only in this phase.

## Feature flags

All flags remain false:

```text
transport enabled = false
connection lifecycle enabled = false
session establishment enabled = false
outbound enabled = false
inbound enabled = false
listener enabled = false
polling enabled = false
```

## Disabled operations

This phase must not:

```text
create adapter
start transport
establish session
open listeners
start polling
send events
receive events
persist connection state
process business payload
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

The bridge remains inactive after Phase 31-C.
