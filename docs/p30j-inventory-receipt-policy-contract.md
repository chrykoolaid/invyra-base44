# P30-J Inventory Receipt Policy Contract

Phase 30-J mirrors the ScanOps Phase 30-I receipt policy work on the Inventory side.

This phase defines the future Inventory-side receipt reference, acknowledgement candidate shape, and validation outcome candidate shape. It does not process receipts, generate acknowledgements, emit acknowledgements, persist receipts, persist validation outcomes, open listeners, call transport, or write to Inventory.

## Scope

- TEST and TRAINING receipt policy contract only.
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
- No receipt processing.
- No acknowledgement generation.
- No acknowledgement emission.
- No receipt persistence.
- No acknowledgement persistence.
- No validation outcome persistence.
- No listener activation.
- No transport activation.
- No network call.
- No event send.
- No event receive.
- No Inventory write.
- No ScanOps write.
- No stock mutation.
- No workflow mutation.
- No Item Master mutation.
- No pricing or accounting mutation.
- No purchase order write.
- No forecast write.
- No runtime activation.
- No write attempt.
- No mutation attempt.

## Future receipt reference shape

```text
receipt reference candidate id
envelope candidate id reference
inbox candidate id reference
environment
source system = Inventory
target system = ScanOps
device id reference
session id reference
generated = false
emitted = false
persisted = false
```

## Future acknowledgement candidate shape

```text
acknowledgement candidate id
receipt reference candidate id
acknowledgement status candidate
deterministic order
retry policy reference
generated = false
emitted = false
persisted = false
```

## Future validation outcome candidate shape

```text
validation outcome candidate id
validation policy reference
accepted candidate allowed
rejected candidate allowed
blocked candidate allowed
reason code
executed = false
persisted = false
Inventory write allowed = false
```

## Locked architecture foundation

The bridge is designed for commercial deployment across many independent client installations. It must never assume a specific home, office, or development network.

Each client installation owns its own:

- Store or site ID.
- Inventory Bridge identity.
- Device pairing tokens.
- Trusted scanner registry.
- Device IDs.
- Session IDs.

Preferred future connection order:

1. Automatic local discovery on the same LAN/Wi-Fi.
2. QR Code pairing.
3. Manual IP or hostname as an advanced fallback.
4. IT or administrator setup.

Manual networking is a fallback only. Normal staff should not need to understand IP addresses, routers, SSIDs, gateways, or machine names.

## Portable network guardrail

No bridge implementation, contract, validator, documentation, fixture, or future runtime component may assume or embed developer-specific networking information, including fixed IP addresses, hostnames, SSIDs, gateways, machine names, or local development environments.

All deployment-specific networking must be discovered dynamically or provided through administrator configuration.

## Hard-disabled operations

```text
process receipt = false
generate acknowledgement = false
emit acknowledgement = false
persist receipt = false
persist acknowledgement = false
persist validation outcome = false
open listener = false
send event = false
receive event = false
call transport = false
create Inventory write = false
```

This phase only defines candidate shape. It does not create receipt storage, acknowledgement behavior, validation behavior, transport behavior, listener behavior, or bridge runtime behavior.

The bridge remains completely inactive after Phase 30-J.
