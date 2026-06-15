# Invyra Inventory — Item Details Transition Part 2

## Build

Source baseline: `invyra-inventory_item-details-part1-polish-v1.zip`

New package: `invyra-inventory_item-details-part2-toolbar-cleanup-v1.zip`

## Status

Part 2 is implemented as a surgical UI cleanup pass.

## What changed

- Removed the visible Inventory toolbar `Stock History` button.
- Kept the row-level `View` action as the primary item drill-down path.
- Kept `ItemDetailsWorkspace` read-only.
- Kept `Open Full Movements` as the route to the full movement ledger filtered by SKU.
- Preserved the `StockHistoryModal` component file and stock-history/movement-ledger capability in the codebase.
- Did not alter stock movement posting behavior, movement calculations, entity schemas, Gap Scan, Reorder Review, Dashboard alerts, Reports, Wastage, Adjustments, Transfers, Receiving, or Audit Trail logic.

## Final user-facing workflow

```text
Inventory row → View → Item Details → Open Full Movements
```

## Final Inventory toolbar

```text
Add / Update Item
Reload
Bulk Stock Update
```

## Safety rule preserved

Stock History was retired from the Inventory toolbar only. It was not removed as an internal system capability.

## Verification

- `npm run build` completed successfully.
- `npm run lint` completed successfully.

## Manual regression checklist before locking Part 2

- Inventory page loads.
- Stock History toolbar button no longer appears.
- Row-level `View` still appears.
- `View` opens the correct read-only Item Details workspace.
- Back to Inventory works.
- `Open Full Movements` opens Movements filtered by selected SKU.
- Movements works normally without SKU filter.
- Gap Scan still runs.
- Reorder Review still generates.
- Dashboard Priority Issues still load.
- Adjustments still post correctly.
- Transfers still post correctly.
- Wastage still posts correctly.
- Reports still load.
- Audit Trail still records correctly.

## Rollback note

If any dependency issue is found, restore the toolbar `Stock History` action in `src/pages/Inventory.jsx`. Do not revert the Item Details workspace unless the issue is specifically inside that workspace.
