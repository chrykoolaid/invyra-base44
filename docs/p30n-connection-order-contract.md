# P30-N Connection Order Contract

Phase 30-N locks the preferred future bridge connection order for client-network-portable deployments.

This phase defines connection priority and guardrails only. It does not activate discovery, QR pairing, manual endpoint setup, IT setup flows, transport, listeners, networking, persistence, or runtime behavior.

## Scope

- TEST and TRAINING connection order contract only.
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
- Connection order only.

## Preferred future connection order

```text
1. Automatic local discovery on the same LAN/Wi-Fi
2. QR Code pairing
3. Manual IP or hostname as an advanced fallback
4. IT or administrator setup
```

Automatic local discovery is the preferred workflow.

Manual IP or hostname configuration is an advanced fallback only. Normal staff should not need to understand networking to use ScanOps.

## Future-only connection methods

Each method is a future placeholder only:

```text
Automatic local discovery = inactive
QR Code pairing = inactive
Manual IP / hostname = inactive
IT / admin setup = inactive
```

## Prohibited behavior

This phase must not:

```text
start discovery
scan the LAN
read Wi-Fi credentials
join Wi-Fi networks
generate QR pairing payloads
consume QR pairing payloads
save manual endpoints
test manual endpoints
start admin setup flows
open listeners
call transport
send events
receive events
```

## Portable network guardrail

No bridge contract, validator, fixture, UI surface, documentation, or future runtime component may assume or embed:

```text
fixed IP addresses
router information
network names / SSIDs
gateway assumptions
machine names
developer network details
client-specific network assumptions
```

All deployment-specific networking must be discovered dynamically or configured by an administrator in a future runtime phase.

## Cloud independence

Normal in-store scanning must not require cloud connectivity.

Cloud services may be used in future enterprise phases for backup, monitoring, diagnostics, centralized management, or cross-site visibility, but cloud connectivity must not become a dependency for normal local scanning.

## Hard-disabled runtime state

```text
automatic discovery active = false
QR pairing active = false
manual IP / hostname active = false
IT admin setup active = false
Wi-Fi management active = false
listener active = false
transport active = false
network call attempted = false
endpoint configured = false
endpoint persisted = false
pairing payload generated = false
pairing payload consumed = false
```

## Mutation guardrails

The connection order contract must not allow:

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

The bridge remains completely inactive after Phase 30-N.
