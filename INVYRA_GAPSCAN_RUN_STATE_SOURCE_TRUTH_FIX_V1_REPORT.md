# INVYRA GAP SCAN — RUN STATE + SOURCE OF TRUTH FIX V1 REPORT

## Status

PASS / READY FOR REVIEW

## Objective

Fix the Gap Scan regression where results were displayed by default and harden the data-source behavior so Gap Scan reads inventory truth without creating or mutating inventory truth.

## Files Changed

```text
src/pages/GapScan.jsx
base44/functions/receiveGapScanData/entry.ts
INVYRA_GAPSCAN_RUN_STATE_SOURCE_TRUTH_FIX_V1_REPORT.md
```

## Changes Made

### 1. Removed page-load auto scan

Removed the mount behavior that called `handleRunScan()` automatically.

Gap Scan now opens empty until the user presses `Run Scan`.

### 2. Added explicit clear behavior on lookback change

Changing lookback now clears stale scan output:

```text
results
trend data
selected rows
explanation panel
highlighted row
import/source message
physical scan comparison state
```

### 3. Hardened inventory source of truth

Gap Scan now builds system rows from real inventory entities only:

```text
InventoryItem        → item identity
ItemStockBalance     → preferred stock balance source
StockMovement        → fallback balance_after and posted SALE/POS usage
POSLineItem          → usage fallback when sale movements are unavailable
```

No mock, demo, seeded, or hardcoded rows were added.

### 4. Separated system truth from physical scan evidence

Normal `Run Scan` output is system-truth only.

The System vs Physical Scan Comparison panel now appears only after physical scanner/file evidence is imported.

Physical counts remain evidentiary only and do not overwrite system stock. When physical data is imported, the table label changes from `On Hand` to `Physical Count` to avoid implying scanner evidence is the system stock balance.

### 5. Updated scanner import validation

`receiveGapScanData` now validates physical scan evidence instead of accepting calculated Gap Scan output as truth.

Accepted physical quantity fields include:

```text
physical_qty
physicalQty
scan_qty
scanQty
count
onHand
qty
```

The front end resolves item identity and system stock from Inventory truth after import. Imported scanner rows that do not match active inventory items are not promoted into Gap Scan results.

## Guardrails Preserved

```text
No StockMovement writes
No stock adjustments
No Item Master mutation
No reorder/order creation
No PO creation
No Stocktake variance posting
No physical scan count promoted to system truth
No sidebar changes
No Fill Task mutation changes beyond existing evidentiary task flow
```

## Verification

```bash
npm run lint
/usr/bin/timeout 90s npm run build
```

Result:

```text
PASS
```

Build note:

```text
[base44] Proxy not enabled (VITE_BASE44_APP_BASE_URL not set)
```

This is an existing local build environment notice and did not block the build.

## Acceptance Result

```text
- Gap Scan opens empty: PASS
- No results show before Run Scan: PASS
- No summary cards show before Run Scan: PASS
- No System vs Physical comparison shows before Run Scan: PASS
- Run Scan uses InventoryItem / ItemStockBalance / StockMovement / POSLineItem: PASS
- No mock/demo/fallback rows added: PASS
- Changing lookback clears stale results: PASS
- Physical scan data remains evidence-only: PASS
- No StockMovement writes added: PASS
- npm run lint passes: PASS
- npm run build passes: PASS
```
