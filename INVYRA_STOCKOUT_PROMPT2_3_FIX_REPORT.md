# Invyra Stock-Out Exceptions — Prompt 2 + Prompt 3 Direct Fix Report

## Scope
Applied direct fixes for Prompt 2 and Prompt 3 on top of the Prompt 1 v3 fixed build.

## Prompt 2 — Scanner Duplicate + Alert Trigger Governance

### Completed
- Added backend function `markScannerIntakeDuplicate`.
- Updated Scanner Intake UI so duplicate marking calls the backend function instead of direct frontend service-role updates.
- Added duplicate reason modal.
- Duplicate handling now:
  - requires Supervisor/Manager/Admin/Owner,
  - sets `sync_status = DUPLICATE`,
  - sets `is_duplicate = true`,
  - stores `duplicate_reason`,
  - preserves the scanner intake record,
  - does not create `StockOutRecord`,
  - does not create `StockMovement`,
  - creates `AuditLog`,
  - creates `StockOutAlert`.
- Fixed unknown barcode detection in `processScannerIntake` to compare against newly supplied `resolved_sku`.
- Unknown barcode resolution now creates an alert with `linked_record_id` and `linked_intake_id` plus audit log.
- Added / strengthened alert creation triggers:
  - high-value wastage,
  - high-value store use,
  - duplicate scanner intake,
  - unknown barcode scanner intake,
  - amendment requested after posting,
  - reversal after posting,
  - repeated wastage for same SKU within 7 days,
  - repeated store use for same SKU within 7 days.
- Added audit entries for alert creation.
- Updated `dedupeStockOutAlert` so `dedupe_key` is not treated as a target alert ID.

## Prompt 3 — Staff Own-Draft Rule + Final Hardening

### Completed
- Added `created_by` and `created_by_email` to `StockOutRecord` schema.
- `createStockOutRecord` now sets creator fields.
- `processScannerIntake` now sets creator fields on generated draft records.
- `submitStockOutRecord` now enforces: Staff can only submit their own drafts.
- Staff attempts to submit another user’s draft are blocked and audit logged.
- Wastage and Store Use UI now hide Submit for staff unless the draft belongs to them.
- Staff financial values are restricted in Wastage / Store Use tab cards and rows.
- Backend role checks now include Owner where appropriate.
- Scanner intake processing now requires Supervisor/Manager/Admin/Owner.
- Amendment request now requires Supervisor/Manager/Admin/Owner.
- Alert actions continue through backend functions.
- Report CSV export now writes an audit entry.

## Validation
- Ran `npm ci --ignore-scripts --prefer-offline`.
- Ran `npm run build` successfully.
- Removed generated `node_modules` and `dist` before packaging.

## Notes
- This is a direct patch pass, not a full manual runtime acceptance test inside Base44.
- Markdowns remain separate.
- No new sidebar modules were added.
- Stock-Out tabs remain inside the existing Wastage / Stock-Out Exceptions module.
