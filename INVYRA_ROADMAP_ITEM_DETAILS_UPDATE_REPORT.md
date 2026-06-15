# INVYRA INVENTORY ROADMAP — ITEM DETAILS UPDATE REPORT

## Build

`invyra-inventory_roadmap-item-details-update-v1.zip`

## Source Baseline

`invyra-inventory_item-details-part2-polish-v1.zip`

## Purpose

Update the Inventory Roadmap to include the Item Details transition scope without duplicating existing roadmap ownership for Movements, Advanced Reports, Threshold Intelligence, Supplier Intelligence, or Stock History internals.

## Duplicate-Avoidance Review

The roadmap was checked for existing ownership before changes were made:

- Movements already owns the official stock movement ledger.
- Stock History was already referenced under Core Stock Operations.
- Threshold Intelligence already owns future reorder calculation logic.
- Advanced Reports already owns business-wide reporting and audit/valuation views.
- Supplier and purchasing intelligence already exist elsewhere and were not duplicated inside Item Details.

## Implemented Roadmap Changes

### 1. Locked / Complete

Added a locked record for:

`Item Details Transition Part 2B`

This records the accepted state:

- Inventory row-level `View` is the primary item-level drill-down.
- Item Details is read-only.
- Stock History toolbar button was removed from the Inventory UI only.
- Stock History internals remain preserved.
- Movements remains the full ledger.
- Part 2A Movements filter notice cleanup is captured.
- Part 2B Audit Trail text wrapping cleanup is captured.

### 2. Core Stock Operations

Updated the old Stock History roadmap wording from treating Stock History as a visible inventory-list utility to the new accepted wording:

- Bulk Stock Update remains an inventory-list/admin utility.
- Item Details row-level View has replaced the old Stock History toolbar workflow at the UI level.
- Stock-history internals remain preserved.

### 3. Reporting / Audit / Compliance

Added a planned item under the existing reporting group:

`Inventory Performance roll-up report`

This avoids creating a duplicate module. The report is positioned as an Advanced Reports extension, not as a new sidebar module.

### 4. Forecasting / AI — Later

Added ownership guardrails to the existing Threshold Intelligence item:

- Threshold Intelligence owns reorder calculations.
- Item Details may display future threshold outputs.
- Item Details must not become a separate reorder engine.
- Reorder Review remains the operational review and draft-order start point.

### 5. Locked Warning Text

Updated the roadmap warning banner to include Item Details Part 2B as an accepted proof point.

## Guardrails Preserved

This update does not change:

- Inventory item creation
- Stock movement posting
- Movements ledger logic
- Gap Scan
- Reorder Review
- Dashboard calculations
- Advanced Reports calculations
- Audit logging logic
- Adjustments
- Transfers
- Wastage
- Receiving
- Stocktake

## Validation

- `npm run lint` passed.
- `npm run build` passed.

## Final Result

The Inventory Roadmap now reflects what has already been implemented and what is planned later, while avoiding duplicate ownership across existing modules.
