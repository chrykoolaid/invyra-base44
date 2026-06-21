# INVYRA ROADMAP — HYBRID RFID VISIBILITY UPDATE V1

## Status

Implemented as a roadmap/documentation-only update.

## Scope

Updated the Inventory Roadmap module to reflect the later hybrid RFID direction as an optional enterprise visibility layer.

## Files Updated

- `src/pages/InventoryRoadmap.jsx`
- `INVYRA_ROADMAP_HYBRID_RFID_VISIBILITY_UPDATE_V1_REPORT.md`

## What Changed

- Renamed RFID scope from `Hybrid RFID + Barcode Integration v1` to `Hybrid RFID Visibility Layer v1`.
- Reclassified the RFID status as `LATER / ENTERPRISE SCOPED`.
- Updated the roadmap highlight banner to point users to the Hardware & Sync tab.
- Updated the Hardware & Sync description to emphasize optional RFID visibility and evidence pipelines.
- Clarified that RFID is an optional capture/evidence layer, not the Inventory source of truth.
- Added stronger guardrails preventing passive RFID reads from directly changing stock.
- Added barcode fallback positioning so barcode/scanner workflows remain the default operating method.
- Added ownership rules for Inventory Settings, Locations/Storage Areas, Stocktake, Receiving, Transfers, Adjustments, Wastage, and barcode fallback.

## Guardrails Preserved

- No stock mutation added.
- No `StockMovement` creation added.
- No runtime RFID activation added.
- No ScanOps bridge activation added.
- No new sidebar module added.
- No hardware integration added.
- No fake/mock RFID data added.
- No POS, Markdown, Wastage, Transfer, Receiving, Stocktake, or Adjustment workflow changes added.

## Roadmap Boundary

RFID is now documented as:

```text
Inventory Ledger = source of truth
Barcode / scanner workflows = normal operational capture
RFID = optional enterprise evidence and visibility layer
Approved inventory workflows = only path to stock mutation
```

## Recommended Next Step

Commit this separately as a roadmap-only pass after extracting the updated build.
