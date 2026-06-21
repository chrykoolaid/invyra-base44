# Invyra Inventory Bridge Phase 1G-C Transport Contract Fixtures

Status: static contract fixtures only  
Component: Inventory / `chrykoolaid/invyra-base44`  
Phase: `1G-C`  
Runtime state: not implemented and not activated

## Purpose

Phase 1G-C adds static contract fixtures that describe the future ScanOps -> Inventory bridge submission and Inventory receipt shapes.

These fixtures are not executable code. They do not create a transport client, transport server, listener, endpoint, sync loop, event ingestion path, event replay path, persistence write, or Inventory mutation.

## Added fixture files

```text
docs/inventory-bridge/fixtures/phase-1g-c/inbound-event.floor-gap.accepted.example.json
docs/inventory-bridge/fixtures/phase-1g-c/receipt.accepted-to-ledger.example.json
docs/inventory-bridge/fixtures/phase-1g-c/receipt.rejected-trust.example.json
```

## Contract direction

The future bridge contract remains evidence-first:

```text
ScanOps evidence event
  -> future local transport
  -> Inventory inbound ledger validation
  -> Inventory receipt
```

The fixtures describe payload shape only. They do not authorize runtime behavior.

## Inventory fixture responsibilities

The Inventory-side fixtures demonstrate:

- A future inbound event envelope received from ScanOps.
- A future accepted-to-ledger receipt.
- A future rejected-trust receipt.
- Stable event identity.
- Idempotency key usage.
- Payload hash field usage.
- Signature placeholder usage.
- Inventory receipt status vocabulary.
- Non-operational fixture warnings.

## Fixture safety rules

All fixture signatures, hashes, IDs, and ledger references are examples only.

They must not be treated as valid runtime secrets, real cryptographic material, real device identifiers, real store identifiers, or live Inventory references.

## Explicitly forbidden in Phase 1G-C

Phase 1G-C must not add or activate:

- Runtime bridge activation.
- Wi-Fi/IP transport implementation.
- HTTP/WebSocket/local-network listeners.
- Sync loops.
- Event ingestion endpoints.
- Event replay engines.
- Base44 entities.
- IndexedDB stores.
- Persistence writes.
- Inventory writes.
- Stock movement writes.
- Price, POS, order, forecasting, or Item Master mutation.

## Future implementation boundary

A later implementation phase must separately define:

- Exact transport protocol.
- Auth handshake.
- Signing and verification algorithm.
- Payload hash algorithm.
- Replay prevention.
- Retry policy.
- Receipt delivery.
- Failure-mode tests.
- Feature flag default-off behavior.
- Kill-switch behavior.

## Acceptance criteria

Phase 1G-C passes only if it remains static documentation and fixture data with no runtime behavior.
