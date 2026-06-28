# P30-F Inventory Device Session Contract

Phase 30-F mirrors ScanOps Phase 30-E on the Inventory side.

This phase defines Inventory-side references for future ScanOps device and session candidates. It does not register devices, persist devices, start sessions, persist sessions, open listeners, ingest candidates, or emit receipts.

## Scope

- TEST and TRAINING device/session reference contract only.
- LIVE, PRODUCTION, and UNKNOWN are blocked.
- Inactive contract only.
- Hard-disabled operations.
- Inventory remains the system of record.
- No device registration.
- No device persistence.
- No session start.
- No session persistence.
- No listener activation.
- No ingestion engine activation.
- No transport activation.
- No network call.
- No event receive.
- No inbound persistence.
- No receipt emission.
- No receipt persistence.
- No Inventory write.
- No ScanOps write.
- No stock mutation.
- No workflow mutation.
- No pricing or accounting mutation.
- No purchase order write.
- No forecast write.
- No runtime activation.
- No write attempt.
- No mutation attempt.

## Future device reference shape

```text
ScanOps device id reference
device label reference
device role reference
environment
operator context reference
```

## Future session reference shape

```text
ScanOps session id reference
device id reference
operator context reference
started at candidate
ended at candidate
```

This phase only defines reference shape. It does not create Inventory device records, session records, listener behavior, ingestion behavior, local storage, or runtime bridge behavior.
