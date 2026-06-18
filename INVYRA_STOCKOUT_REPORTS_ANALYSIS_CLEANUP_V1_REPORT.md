# INVYRA Stock-Out Reports Analysis Cleanup v1

## Status

IMPLEMENTED / BUILD-PASSING

## Scope

Updated the Stock-Out Exceptions Reports tab to remove chart-like grouped analysis cards and progress bars.

## Files Changed

- `src/components/wastage/ReportsTab.jsx`

## What Changed

- Removed the `TrendingUp` icon import from the Reports grouped analysis display.
- Removed progress-bar cards from the Stock-Out Analysis section.
- Replaced grouped analysis output with a compact table layout.
- Added dynamic group label headings based on the selected Group By mode.
- Preserved search, filters, date window, group-by control, and CSV export.
- Updated the empty state copy to:
  - `No stock-out records found`
  - `Try adjusting your filters or date range.`

## Grouped Table Columns

- Reason / Group, SKU / Item, Item, User, Location, Source, Department, Cost Centre, Status, or Type depending on Group By
- Records
- Units
- Gross Value
- Reversed
- Net Value
- Pending
- Rejected

## Guardrails Preserved

No changes were made to:

- Reports record loading
- Reports filtering logic
- CSV export logic
- Archive logic
- Approval logic
- Reversal logic
- Amendment logic
- Scanner intake logic
- Waste Engine adapter / repository contract
- AuditLog behavior
- Markdowns

## Validation

- Targeted ESLint check passed for `src/components/wastage/ReportsTab.jsx`.
- Vite production build completed successfully.

## Notes

The full project lint command still reports pre-existing unused-import errors in unrelated Markdown, POS, and Scanner Intake files. No new lint issue was introduced by this Reports cleanup.
