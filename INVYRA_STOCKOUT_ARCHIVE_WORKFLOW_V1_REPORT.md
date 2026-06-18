# INVYRA STOCK-OUT ARCHIVE WORKFLOW v1 — IMPLEMENTATION REPORT

## Status

Implemented.

## Scope

Added an Archive workflow to the Stock-Out Exceptions module so finalized stock-out records are separated from active operational work.

## Files Changed

- `src/pages/Wastage.jsx`
  - Added Archive tab registration.
  - Inserted Archive between Alerts and Reports.
  - Restricted Archive to Manager/Admin/Owner visibility.
  - Wired `ArchiveTab` into the Wastage page.

- `src/components/wastage/ArchiveTab.jsx`
  - New archive component.
  - Keeps Wastage Archive and Store Use Archive separate with a segmented control.
  - Shows finalized `POSTED`, `REVERSED`, and `AMENDED` records only.
  - Includes search and filters.
  - Includes read-only details, movement trace, and audit trail views.
  - Supports controlled `Reverse` and `Request Amendment` actions for allowed roles/statuses.
  - Supports CSV export with best-effort AuditLog entry.

- `src/components/wastage/WastageTab.jsx`
  - Active Wastage tab now focuses on active workflow records only.
  - Shows `DRAFT`, `SUBMITTED`, and `REJECTED` records by default.
  - Excludes finalized `POSTED`, `REVERSED`, and `AMENDED` records from the active tab.
  - Summary labels updated to reflect active workflow state.

- `src/components/wastage/StoreUseTab.jsx`
  - Active Store Use tab now focuses on active workflow records only.
  - Shows `DRAFT`, `SUBMITTED`, and `REJECTED` records by default.
  - Excludes finalized `POSTED`, `REVERSED`, and `AMENDED` records from the active tab.
  - Summary labels updated to reflect active workflow state.

## Locked Workflow Rules

- Active Wastage / Store Use tabs are for records requiring action:
  - `DRAFT`
  - `SUBMITTED`
  - `REJECTED`

- Archive is for finalized audit/history records:
  - `POSTED`
  - `REVERSED`
  - `AMENDED`

- Reports remain unchanged and continue to include finalized records according to existing report logic.

## Archive Actions

Archive records show:

- Details
- Movements
- Audit

For allowed Manager/Admin/Owner roles and allowed statuses:

- Request Amendment for `POSTED` / `AMENDED`
- Reverse for `POSTED`

Archive does not show:

- Edit Draft
- Delete Draft
- Submit
- Approve
- Reject

## Validation

- Targeted ESLint: PASS
  - `src/pages/Wastage.jsx`
  - `src/components/wastage/ArchiveTab.jsx`
  - `src/components/wastage/WastageTab.jsx`
  - `src/components/wastage/StoreUseTab.jsx`

- Vite production build: PASS

## Guardrail Confirmation

No changes were made to:

- Approval stock movement logic
- Reversal stock movement logic
- Amendment approval logic
- Scanner intake logic
- Reports calculations
- Waste Engine adapter logic
- Audit logging backend functions
- Markdown module
