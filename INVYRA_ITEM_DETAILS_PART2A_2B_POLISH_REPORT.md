# Invyra Inventory — Item Details Part 2A/2B Polish Report

## Build

Source baseline: `invyra-inventory_item-details-part2-toolbar-cleanup-v1.zip`

New package: `invyra-inventory_item-details-part2-polish-v1.zip`

## Status

Part 2A/2B is implemented as a small regression-polish pass after the Item Details Part 2 toolbar cleanup.

## What changed

### Part 2A — Movements filter label cleanup

- Removed the fixed `Filtered from Item Details` text from the Movements page header.
- Moved the Item Details filter notice into `LedgerViewer`, where it is tied to the actual active SKU filter state.
- The notice now appears only when Movements is opened with an active Item Details SKU filter and the filter field still matches that SKU.
- Clearing the filter field hides the notice and shows the normal full movement ledger behavior.
- Opening Movements normally from the sidebar shows no Item Details filter notice.

### Part 2B — Audit Trail text wrapping cleanup

- Replaced inline `Old:` / `New:` audit values with stacked wrapped blocks.
- Long JSON values are now formatted where possible and wrapped inside bounded containers.
- Prevented long audit values from overlapping adjacent text.
- Preserved original audit values and audit logging behavior.
- Preserved the Detailed Audit Trail data source and filters.

## Safety rule preserved

This polish pass changes display behavior only. It does not alter movement ledger calculations, stock posting, Stock History internals, Gap Scan, Reorder Review, Dashboard alerts, Reports calculations, Wastage, Adjustments, Transfers, Receiving, or Audit Trail data creation.

## Verification

- `npm run lint` completed successfully.
- `npm run build` completed successfully.

## Manual regression checklist

- Inventory toolbar still hides the old Stock History button.
- Row-level `View` still opens Item Details.
- `Open Full Movements` opens Movements filtered by selected SKU.
- Movements sidebar navigation opens without stale `Filtered from Item Details` messaging.
- Clearing the Movements SKU filter hides the Item Details filter notice.
- Audit Trail long JSON values wrap and no longer overlap.
- Audit Trail records still load.
- Gap Scan still runs.
- Reorder Review still generates.
- Advanced Reports still load.
