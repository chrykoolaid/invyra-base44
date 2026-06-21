# Phase 1H-D Bridge Security Review

Status: review only  
Component: Inventory / `chrykoolaid/invyra-base44`  
Runtime state: not implemented and not activated

## Purpose

Phase 1H-D reviews security expectations for the future ScanOps <-> Inventory Bridge from the Inventory side.

This is documentation only. It does not implement runtime bridge code, transport, sync, ingestion, replay, entities, persistence writes, Inventory writes, or operational mutation.

## Security boundary overview

Inventory must be the final security boundary for future bridge submissions.

A future ScanOps event must be treated as untrusted input until Inventory verifies identity, scope, schema, integrity, idempotency, and bridge enabled state.

## Security principles

1. Default disabled.
2. Inventory-owned trust decisions.
3. No trust based on LAN presence alone.
4. No trust based on IP address alone.
5. No trust based on device self-reporting alone.
6. Explicit device pairing required before future acceptance.
7. Stable event identity required.
8. Stable idempotency key required.
9. Payload hash required.
10. Payload signature required in a future implementation.
11. Replay prevention required.
12. Audit trail required for every classification.
13. Ledger acceptance is not operational mutation.
14. Operator workflow must remain separate from bridge classification.

## Future Inventory security checks

A future Inventory trust gate should verify:

```text
feature_flag_state
stop_control_state
source_system
source_device_id
device_trust_state
store_id
inventory_instance_id
schema_version
event_type
event_id
idempotency_key
sequence_number
occurred_at
submitted_at
payload_hash
payload_signature
```

## Threat review

| Threat | Future Inventory control | Operational mutation allowed |
| --- | --- | --- |
| Unknown device submits event | Reject trust | No |
| Device impersonation | Signature and pairing verification | No |
| Payload tampering | Payload hash and signature verification | No |
| Replay attempt | Idempotency and sequence checks | No |
| Duplicate submission | Duplicate classification | No |
| Wrong store scope | Scope rejection | No |
| Wrong Inventory instance | Scope rejection | No |
| Unsupported schema | Schema rejection | No |
| Event type abuse | Event type allow-list | No |
| Disabled bridge bypass | Feature flag and stop-control checks | No |
| Operator misuse | Role and audit controls in later workflow | No direct bridge mutation |

## Secrets and key handling expectations

A future implementation must define:

- Device key storage model.
- Key rotation policy.
- Revocation policy.
- Signature algorithm.
- Payload hash algorithm.
- Receipt signing approach.
- Recovery process for lost or replaced devices.

Phase 1H-D does not create or store secrets.

## Audit expectations

A future implementation must preserve audit evidence for:

- source device id;
- source user id;
- event id;
- idempotency key;
- schema version;
- event type;
- classification status;
- reason code;
- receipt id;
- trust decision;
- stop-control state;
- timestamp.

## No-mutation security rule

Security classification must not directly mutate:

- Stock movements.
- Item Master records.
- Price records.
- POS sale records.
- Order records.
- Forecast records.
- Posted wastage records.
- Posted store-use records.
- Markdown price activation records.

## Future implementation questions

Before implementation, the team must answer:

- How are device keys provisioned?
- How are devices revoked?
- How are signatures verified?
- How are replay attempts detected?
- How are duplicate events linked?
- How are tampered payloads quarantined?
- How are receipt signatures verified by ScanOps?
- How are security failures surfaced to admins?
- How is emergency disable handled?

## Acceptance criteria

Phase 1H-D passes only if this remains security review documentation and no runtime behavior is implemented.
