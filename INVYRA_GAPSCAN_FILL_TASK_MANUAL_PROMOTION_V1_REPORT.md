# INVYRA GAP SCAN → FILL TASKS — MANUAL PROMOTION V1 REPORT

Status: IMPLEMENTED / VALIDATED
Date: 2026-06-23

## Scope

Added a controlled manual promotion pathway from Gap Scan results into the existing Fill Tasks tab.

Gap Scan remains detection-only. Fill Tasks becomes the action queue only after staff explicitly selects rows and clicks the promotion action.

## Implemented

- Added `Add Selected to Fill Tasks` bulk action after scan results exist.
- Button is disabled when no rows are selected or a promotion action is already running.
- Added row task-state badges:
  - `Suggested`
  - `Open Task`
  - `Added`
  - `Not Added`
- Added duplicate protection for active Gap Scan Fill Tasks by SKU/location/source.
- Added eligibility guard so only meaningful Gap Scan rows are promoted:
  - `flag = Critical`
  - `flag = Watch`
  - `risk = Critical / High / Medium`
  - `system_stock = 0`
  - `days_left <= 14`
- Added manual bulk creation payload fields:
  - `sku`
  - `item_name`
  - `system_stock`
  - `avg_use_per_day`
  - `days_left`
  - `risk`
  - `flag`
  - `suggested_order_qty`
  - `source = GAP_SCAN`
  - `status = OPEN`
  - `created_from_scan = true`
  - `created_at`
  - `created_by`
  - `environment`
  - location fields when available
- Preserved and hardened the existing row-level Fill Task modal:
  - no duplicate open task creation
  - no ineligible row creation
  - same GAP_SCAN/source payload contract
- Added success/skip notice after promotion, including created, duplicate, ineligible, and missing-item counts.
- Kept Gap Scan on the current tab after promotion and added optional `View Fill Tasks` navigation.
- Updated Fill Tasks tab empty state and task details display to reflect Gap Scan-created tasks.
- Added roadmap/settings planning entry for future `Admin → Inventory Settings → Gap Scan / Replenishment` Fill Task Creation Mode.

## Guardrails Preserved

- No StockMovement writes added.
- No stock adjustments added.
- No purchase orders created.
- No reorder drafts created.
- No Item Master mutation added.
- No Fill Tasks are auto-created on page load.
- No Fill Tasks are auto-created by Run Scan.
- Physical scan evidence remains labelled as evidence and is not treated as stock truth.
- Gap Scan, Stocktake, Reorder Review, Orders, and StockMovement boundaries remain separated.

## Files Changed

- `src/pages/GapScan.jsx`
- `src/components/gapscan/CreateFillTaskModal.jsx`
- `src/components/gapscan/FillTasksTab.jsx`
- `src/lib/gapScanFillTasks.js`
- `src/pages/InventorySettings.jsx`
- `src/pages/InventoryRoadmap.jsx`

## Validation

```text
npm run lint  ✅ PASS
npm run build ✅ PASS
```

Build note:

```text
[base44] Proxy not enabled (VITE_BASE44_APP_BASE_URL not set)
```

This is an environment/config notice from the local sandbox build, not a compile failure. Build exited with status 0.
