# INVYRA MODULE PROGRESSION ROADMAP UPDATE REPORT

## Status

Roadmap updated from the June 2026 module progression review.

## Updated file

- `src/pages/InventoryRoadmap.jsx`

## What changed

### 1. Added Module Progression Review — June 2026

Added a new roadmap card under Foundation → Active / Next documenting that the current build now covers most major inventory surfaces and that the next risk is duplication, not missing modules.

Confirmed coverage now includes:

- Dashboard
- POS Mode
- Markdown
- Locations
- Inventory
- Movements
- Adjustments
- Transfers
- Stocktake
- Stock-Out Exceptions / Wastage
- Expiry & Batches
- Suppliers
- Reorder Review
- Orders
- Receiving
- Delivery Portal
- Gap Scan
- Exceptions
- Reports
- Exports & Integrations
- Inventory Settings
- Roadmap
- Training
- Forecasting verification / UI wiring

### 2. Added No-Duplication Module Gap Recommendations

Added a new Operations roadmap group for genuine gaps that should be implemented as sub-workflows, not new sidebar modules:

- Item Master / Product Catalogue Governance → Inventory / Item Details
- Holds / Quarantine / Recall Control → Exceptions
- Return to Supplier / Supplier Claims → Receiving or Suppliers
- Replenishment / Fill Tasks → Gap Scan
- Cycle Count Planner → Stocktake
- Device & Label Administration → Inventory Settings

### 3. Updated module status labels

Changed these roadmap cards from purely planned to foundation-built review status:

- Locations v1 → `FOUNDATION BUILT / NEEDS REVIEW`
- Expiry & Barcode Tracking v1 → `FOUNDATION BUILT / NEEDS REVIEW`
- Inventory Settings & Configuration Module v1 → `FOUNDATION BUILT / NEEDS ALIGNMENT`

### 4. Added duplicate-module boundary

Added a Deferred & OOS roadmap boundary stating not to create standalone duplicate modules for:

- Store Use
- Scanner Intake
- Markdown Reports
- Floor Scan
- Forecasting
- Branch Lookup
- Expiry Reports

## Validation

- `npm run build` passed after installing local dependencies.
- `npx eslint src/pages/InventoryRoadmap.jsx --quiet` passed.
- Full `npm run lint` still fails on two unrelated pre-existing unused imports:
  - `src/components/dashboard/StockMovementTrendChart.jsx` imports unused `Legend`
  - `src/components/exceptions/AlertLifecycleActions.jsx` imports unused `X`

## Notes

This update is documentation/roadmap-only. It does not change inventory records, StockMovement ledger logic, Dashboard calculations, Reorder Review, Receiving, Wastage, Markdown runtime logic, seeded LIVE data, or bridge activation behavior.
