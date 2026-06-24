# INVYRA INVENTORY SETTINGS — DEVICE & LABEL ADMIN FOUNDATION V1 REPORT

## Status

IMPLEMENTED / READY FOR REVIEW

## Scope

Foundation UI pass for Device & Label Administration inside Inventory Settings.

This pass creates a clearer admin home for scanner/device planning and printer/label planning while keeping all hardware, sync, print, and barcode runtime behaviour disabled.

## Files Changed

- `src/pages/InventorySettings.jsx`
- `src/components/settings/DeviceLabelAdminFoundation.jsx`
- `INVYRA_DEVICE_LABEL_ADMIN_FOUNDATION_V1_REPORT.md`

## What Changed

### Inventory Settings Tabs

Added a separate tab split:

- `Sync & Devices`
- `Labels & Printers`

This keeps device trust/sync planning separate from printer/template planning.

### Sync & Devices Foundation

Added a clearer planned admin foundation for:

- Local Sync Bridge
- Device Allow-List
- Device health placeholders
- Device pairing placeholders
- Sync inbox policy placeholders
- Planned counters: Paired, Online, Needs Review, Disabled
- Planned columns: Device, Type, Module, Location, Environment, Status, Last Seen, Approved By

All actions are disabled/planned.

### Labels & Printers Foundation

Added a clearer planned admin foundation for:

- Printer Profiles
- Label Templates
- Barcode Rules
- Reprint Policy
- Print Fallbacks
- Planned counters: Printers, Templates, Warnings, Fallbacks
- Planned columns: Printer, Type, Connection, Location, Label Sizes, Status, Last Seen, Fallback

Label template placeholders:

- Markdown Price Label
- Markdown Monitor Sheet
- Shelf Label
- Barcode Label
- Expiry / Batch Label
- Transfer / Bin Label

All actions are disabled/planned.

## Guardrails Preserved

- No real scanner pairing.
- No device discovery.
- No local sync activation.
- No sync inbox processing.
- No real printing.
- No barcode value creation.
- No Markdown label printing activation.
- No Wastage scanner intake activation.
- No ScanOps bridge activation.
- No StockMovement writes.
- No stock adjustment logic.
- No Item Master mutation.
- No operational workflow moved into Inventory Settings.

## Architecture Boundary

Inventory Settings owns configuration only.

Operational workflows remain owned by their source modules:

- ScanOps owns scan capture.
- Stock-Out Exceptions owns scanner intake review.
- Markdown owns markdown label workflow.
- Stocktake owns reconciliation.
- Transfers owns transfer posting.
- Receiving owns supplier delivery confirmation.
- StockMovement remains the stock transaction source of truth.

## Acceptance Checklist

- Sync & Devices tab is clearer and admin-focused.
- Labels & Printers tab exists.
- Device setup remains planned/read-only.
- Printer setup remains planned/read-only.
- No real hardware actions are activated.
- No sync bridge is activated.
- No print actions are activated.
- No StockMovement writes are added.
- No operational workflow is moved into Inventory Settings.

## Validation

Runtime validation should be performed after GitHub PR merge and Base44 sync.

Recommended smoke test:

1. Open Inventory Settings.
2. Open Sync & Devices.
3. Confirm planned cards, counters, allow-list, and disabled actions.
4. Open Labels & Printers.
5. Confirm planned printer profiles, template rows, barcode rules, and disabled actions.
6. Confirm no operational data is created or mutated.
