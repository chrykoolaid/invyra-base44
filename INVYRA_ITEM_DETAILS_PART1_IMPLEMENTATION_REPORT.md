# Invyra Inventory — Item Details Transition Part 1

## Build

Source baseline: `invyra-inventory_sidebar-collapse-v1.zip`

New package: `invyra-inventory_item-details-part1-polish-v1.zip`

## Status

Part 1 is implemented as a safe additive rollout.

## What changed

- Added a new row-level `View` action in the Inventory table.
- Added a read-only `ItemDetailsWorkspace` component.
- Kept the existing Inventory toolbar `Stock History` button intact.
- Kept the existing Stock History modal and LedgerViewer intact.
- Added item-level KPI cards: On Hand, Avg 30D Usage, Days Cover, Status.
- Added Item Summary, Usage & Demand, Reorder Intelligence, and Stock Movement Summary sections.
- Polished Stock Movement Summary labels from Stock In/Stock Out/Net Movement to Inbound/Outbound/Net Change to avoid confusing the summary with the full Movements ledger.
- Added `Open Full Movements` action from Item Details.
- Updated Movements to accept `?sku=` query filtering and pass it to `LedgerViewer`.
- Updated LedgerViewer to sync its SKU filter when a default SKU is provided.

## Safety rules preserved

- No stock movement posting behavior was changed.
- No Gap Scan code was changed.
- No Reorder Review code was changed.
- No Dashboard priority issue code was changed.
- No Wastage, Adjustments, Transfers, or Receiving posting code was changed.
- No StockMovement entity schema was changed.
- No InventoryItem entity schema was changed.
- Stock History remains available during Part 1.

## Verification

`npm run build` completed successfully.

## Part 1 acceptance checklist

- Inventory page loads with new Action column.
- Row-level `View` opens Item Details.
- Item Details is read-only.
- Stock History button still exists.
- Stock Movement Summary remains lightweight.
- Inbound/Outbound 30D are direction totals; Adjustment/Wastage cards are diagnostic breakdowns and must not be double-counted separately.
- Full movement ledger remains owned by Movements.
- `Open Full Movements` opens `/Movements?sku=<SKU>`.

## Part 2 reminder

Only after manual verification should the old Inventory toolbar `Stock History` button be hidden or removed. Internal stock-history and movement-ledger logic must remain preserved.


## Part 2 follow-up

Part 2 has now been implemented in `INVYRA_ITEM_DETAILS_PART2_IMPLEMENTATION_REPORT.md`. The visible Inventory toolbar `Stock History` button was removed as a UI cleanup only. Internal stock-history and movement-ledger logic remains preserved.
