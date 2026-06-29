# P30-M Client Installation Identity Contract

Phase 30-M defines the future client installation identity references for the Inventory-side bridge.

This phase is contract-only. It does not create store IDs, installation IDs, bridge identities, scanner registries, sessions, pairing codes, endpoints, or runtime behavior.

## Scope

- TEST and TRAINING identity contract only.
- LIVE, PRODUCTION, and UNKNOWN are blocked.
- Inactive contract only.
- Hard-disabled operations.
- Candidate-only.
- Preview-only.
- Inventory remains the system of record.
- ScanOps remains the operational scanner execution layer.
- The bridge remains client-network portable.
- Each client installation owns its own local boundary.
- Desktop-first.
- Local-network-first.
- Offline-capable.

## Future client installation reference shape

```text
store/site ID reference
installation ID reference
environment reference
Inventory Bridge identity reference
client-owned boundary
created = false
persisted = false
```

## Future bridge identity reference shape

```text
bridge identity candidate ID
Inventory host reference
installation ID reference
bridge instance reference
active = false
emitted = false
persisted = false
```

## Future device boundary reference shape

```text
scanner registry reference
device ID reference
session ID reference
pairing code reference
device status candidate
registered = false
persisted = false
```

## Prohibited operations

Phase 30-M must not:

```text
create store/site IDs
create installation IDs
create bridge identities
persist bridge identities
create scanner registries
persist scanner registries
register devices
create sessions
issue pairing codes
activate pairing
share pairing across installations
```

## Client-network-portable rule

No bridge implementation, contract, validator, documentation, fixture, or future runtime component may assume or embed developer-specific networking information.

Do not hardcode:

```text
IP addresses
router information
network names / SSIDs
gateway assumptions
machine names
development environment names
```

Future deployment-specific networking must be dynamically discovered or administrator-configured.

## Future connection order

The preferred future connection order remains:

1. Automatic local discovery on the same LAN/Wi-Fi.
2. QR Code pairing.
3. Manual IP or hostname as an advanced fallback.
4. IT or administrator setup.

These are future implementation paths only. They are not active in Phase 30-M.

## Runtime and mutation guardrails

```text
site ID created = false
installation ID created = false
bridge identity created = false
bridge identity persisted = false
scanner registry created = false
scanner registry persisted = false
device registered = false
session created = false
pairing code issued = false
pairing active = false
listener active = false
transport active = false
discovery active = false
QR pairing active = false
manual endpoint active = false
network call attempted = false
Inventory write allowed = false
ScanOps write allowed = false
stock mutation allowed = false
workflow mutation allowed = false
Item Master mutation allowed = false
price mutation allowed = false
accounting mutation allowed = false
purchase order write allowed = false
forecast write allowed = false
runtime activation allowed = false
persisted = false
write attempted = false
mutation attempted = false
```

The bridge remains completely inactive after Phase 30-M.
