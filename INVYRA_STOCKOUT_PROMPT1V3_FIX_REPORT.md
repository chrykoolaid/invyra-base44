# Invyra Stock-Out Exceptions — Prompt 1 v3 Direct Fix Report

## Status
Direct fix applied by ChatGPT to the latest Base44 export.

## Fixed Areas

### Reports
- Added visible Rejected Value KPI.
- Added Wastage Pending and Wastage Rejected KPIs.
- Added Store Use Pending and Store Use Rejected KPIs.
- Preserved corrected finance logic where Gross includes POSTED + REVERSED + AMENDED.
- Preserved Reversed Value and Net Value calculation.
- Improved user fallback logic in filters/export to include submitted_by, posted_by, approved_by, or created_by.
- CSV export now uses posted_at with approved_at fallback and reversed_at for reversal date.
- Search is safer for missing/null SKU, item name, or reason fields.

### Manual Stock-Out Site Capture
- Added Site / Branch selector to Record Stock-Out modal.
- Selected site writes site_id to createStockOutRecord.
- Selected site also maps site name into the location field while still allowing a location/zone override.
- This allows manual Stock-Out records to trigger backend site-level stock guards.

### Posted/Reversed Metadata
- approveStockOutRecordV2 now sets posted_by and posted_at when posting the stock movement.
- reverseStockOutRecord now sets reversed_by, reversed_at, reversal_reason, and reversal_movement_id.
- StockOutRecord entity schema now includes reversed_by, reversed_at, reversal_reason, and reversal_movement_id.

## Verification
- Vite production build completed successfully.

## Not Changed
- Markdowns remain separate.
- Sidebar structure was not changed.
- Scanner Intake, Alerts, and role hardening beyond this Prompt 1 v3 scope were not rebuilt.
