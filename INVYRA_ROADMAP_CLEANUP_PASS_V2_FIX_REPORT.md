# INVYRA ROADMAP CLEANUP PASS V2 — FIX REPORT

## Status

```text
PATCHED / VALIDATED
```

## Validation

```bash
npm run lint
npm run build
```

Result:

```text
PASS
```

Build note:

```text
[base44] Proxy not enabled (VITE_BASE44_APP_BASE_URL not set)
```

This is the expected local Base44 proxy notice and not a build failure.

## Fixes Applied

### 1. Lint cleanup

- Removed unused `Lock` import from `src/components/exceptions/HoldsTab.jsx`.

### 2. Item Governance hardening

- Kept active metadata editing.
- Added `try/catch/finally` handling to `ItemGovernanceEditModal`.
- Updated the Item Governance report to reflect active controlled metadata editing instead of read-only/planned editing.
- Preserved backend role gate, strict allowlist, reason requirement, and audit logging.

### 3. Locations schema alignment

- Updated `base44/entities/Location.jsonc` enum to support UI values:
  - Branch
  - Warehouse
  - Store
  - Backroom
  - Storage
  - Office
  - Other
- Added `default_receiving_area` to Location metadata.

### 4. Storage Area schema alignment

- Updated `base44/entities/StorageArea.jsonc` enum to support UI values:
  - Shop Floor
  - Backroom
  - Receiving Bay
  - Returns Area
  - Damaged Goods
  - Chiller
  - Freezer
  - High Value Cage
  - Shelf
  - Bin
  - Stockroom
  - Receiving Area
  - Damaged Stock
  - Quarantine
  - Zone
  - Other
- Added `quarantine_allowed` to StorageArea metadata.

### 5. Environment hardening

- Replaced hardcoded `environment: 'LIVE'` in the touched roadmap UI surfaces with `envFilter()` usage:
  - Locations components
  - GapScan roadmap work
  - Expiry AddBatchModal
  - TransferForm

### 6. Holds / Quarantine hardening

- Added action error handling to HoldsTab.
- Added Manager/Admin/Owner gate for release/escalation actions.
- Added AuditLog writes for hold placed, released, and escalated actions.
- Added `try/catch/finally` handling in hold place/release/escalation flows.
- Updated UI wording to avoid overstating universal hard-block enforcement.
- Changed markdown POS hold verification failure to fail closed.
- Changed transfer hold verification failure to fail closed.
- Improved transfer hold check scope: item-wide holds block everywhere; location-scoped holds block matching/unknown source locations.

### 7. Fill Tasks hardening

- Removed unsafe fallback from `item_id: item?.id || scanRow.sku`.
- Fill Task creation now blocks if InventoryItem cannot be resolved by SKU.
- Added clear error handling and `try/catch/finally`.
- Added AuditLog entry for Fill Task creation.
- Confirmed Fill Tasks remain evidentiary only and do not create StockMovement.

### 8. Cycle Count Planner hardening

- Added Manager/Admin/Owner gate for cycle count plan definition edits.
- Supervisors can still start active count tasks.
- Added `try/catch/finally` around planner saves.
- Added AuditLog entries for create/update/status/deactivate actions.
- Changed delete behavior to soft deactivate/archive metadata.
- Removed duplicate JSX title prop.

### 9. Transfers UI alignment

- Removed `Approved` as a normal pipeline/card stage.
- Transfers overview now presents:
  - Pending Approval
  - In Transit
  - Received
- Legacy `APPROVED` records are treated as awaiting receiving instead of shown as a separate normal stage.

## Guardrails Preserved

- No RFID runtime activation.
- No stock mutation from Locations.
- No StockMovement creation from Fill Tasks.
- No Item Master price/cost/quantity/reorder mutation from Item Governance.
- No purchase order creation or approval.
- No bypass of StockMovement ledger.
- No new sidebar modules.
