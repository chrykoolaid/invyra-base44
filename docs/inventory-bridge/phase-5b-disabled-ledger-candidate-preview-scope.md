# INVYRA SCANOPS ↔ INVENTORY BRIDGE — PHASE 5B DISABLED LEDGER CANDIDATE PREVIEW SCOPE

Repository: `chrykoolaid/invyra-base44`
Scope: Inventory-side Phase 5B planning scope
Status: `SCOPE ONLY / NOT CODED / NON-OPERATIONAL`

---

## 1. Purpose

Phase 5B is the next safe checkpoint after Phase 5A contract adapter closure.

The purpose is to define an Inventory-side disabled ledger-candidate preview milestone before any ledger ingestion behavior is coded.

This phase must not activate the bridge and must not write to any ledger.

---

## 2. Phase 5A Baseline

Inventory Phase 5A is closed:

```text
Inventory PR #50 — disabled inbound contract adapter merged
Inventory PR #51 — Phase 5A closure review merged
```

ScanOps companion Phase 5A is closed:

```text
ScanOps PR #42 — disabled outbound contract adapter merged
ScanOps PR #43 — Phase 5A closure review merged
```

Current bridge state remains:

```text
DEFAULT OFF
DISABLED
NON-OPERATIONAL
READ-ONLY
CAPTURE-ONLY ON SCANOPS
NON-INGESTIVE
NON-DISPATCHABLE
NON-TRANSPORTABLE
NON-OUTBOX-PROCESSABLE
NON-WRITABLE
NO REPLAY
NO MUTATION
```

---

## 3. Proposed Phase 5B Milestone

Phase 5B should add an Inventory-side disabled ledger-candidate preview foundation.

This is not an ingestion engine.

It should prepare pure deterministic helpers that can project what an inbound event could look like as a future ledger candidate, while always returning a disabled preview object.

Allowed foundation pieces:

```text
pure ledger candidate preview builder
pure candidate reason classifier
pure candidate idempotency key projection
pure candidate source/context snapshot projection
read-only candidate diagnostics
static fixtures for preview-only candidate examples
validator proving no ledger write and no ingestion
```

---

## 4. Explicit Non-Goals

Phase 5B must not add:

```text
runtime bridge activation
Wi-Fi/IP transport
network calls
sync execution
ingestion execution
replay execution
outbox processing
InboundEventLedger writes
InventorySyncInboundEvent writes
InventorySyncReceipt writes
Inventory writes
Entity writes
stock mutation
price mutation
POS mutation
order mutation
forecasting mutation
Item Master mutation
acknowledgement emission
receipt emission
```

---

## 5. Ledger Candidate Preview Boundary

The Phase 5B preview may inspect an already-classified candidate envelope as data only.

It may return a read-only preview object containing:

```text
candidate_preview_id
candidate_status
candidate_reason
schema_version
event_type
event_id
source_system
source_device_id
source_store_id
idempotency_key
runtime_state
contract_classification
ledger_writable=false
ingestible=false
persistable=false
```

It must not persist, enqueue, replay, ingest, acknowledge, emit receipts, write ledger rows, or mutate Inventory state.

---

## 6. Suggested Inventory File Map

Suggested future file map for the coding pass:

```text
src/inventory-bridge/ledgerCandidate/ledgerCandidatePreview.js
src/inventory-bridge/ledgerCandidate/ledgerCandidateDiagnostics.js
src/inventory-bridge/ledgerCandidate/index.js
scripts/validate-inventory-bridge-ledger-candidate-preview-disabled.mjs
```

Optional fixtures may be added only if they are static and preview-only:

```text
tests/fixtures/inventory-bridge/ledger-candidate-preview/*.json
```

---

## 7. Validator Expectations

The Phase 5B validator must prove:

```text
runtime disabled status remains false for enabled/ready/operational
contract adapter remains non-ingestive and non-writable
ledger candidate preview is pure and deterministic
ledger candidate preview never calls transport
ledger candidate preview never calls ingestion
ledger candidate preview never writes InboundEventLedger rows
ledger candidate preview never writes InventorySyncInboundEvent rows
ledger candidate preview never writes InventorySyncReceipt rows
ledger candidate preview never writes Inventory Entities
ledger candidate preview never mutates stock, price, POS, orders, forecasting, or Item Master
unsafe enabled configuration attempts remain rejected or disabled
```

---

## 8. Acceptance Criteria

Phase 5B can pass only if:

```text
all added helpers are pure functions
all outputs are read-only preview/classification objects
all runtime status checks remain disabled
no network/import side effects exist
no persistence functions exist
no ingestion engine is introduced
no replay function is introduced
no acknowledgement or receipt function is introduced
no mutation pathway exists
```

---

## 9. Decision

Decision:

```text
APPROVED AS NEXT INVENTORY CHECKPOINT — PHASE 5B DISABLED LEDGER CANDIDATE PREVIEW SCOPE
```

Phase 5B should proceed as a small controlled Inventory milestone before any ScanOps companion implementation.
