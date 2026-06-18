# Invyra Markdown Reports — Take-Off Sheet & Holiday Planning v1.7

## Status
Implemented and build-verified.

## Scope
This pass upgrades Markdown Reports from a static all-time analytics page into a date-filtered operational reporting surface with printable take-off support and holiday / closed-store planning.

## Files Updated
- `src/pages/MarkdownReports.jsx`
- `base44/entities/MarkdownBatch.jsonc`
- `base44/functions/createMarkdownBatch/entry.ts`
- `INVYRA_MARKDOWN_REPORTS_TAKEOFF_HOLIDAY_PLANNING_V1_7_REPORT.md`

## Key Changes

### 1. Date-filtered reporting
Markdown Reports now supports:
- Today
- Last 7 Days
- This Week
- This Month
- Custom Range

Reports can be grouped by:
- Daily
- Weekly
- Monthly

### 2. Overall markdown data
The report now includes broader markdown performance data rather than only batch charts:
- Markdown Requests
- Exception Requests
- Approved Overlays
- Active Batches
- Units Sold
- Remaining Units
- Auto-Closed overlays
- Value Impact

### 3. ScanOps and overlay-aware reporting
The page now reads from:
- `MarkdownBatch`
- `MarkdownRound`
- `MarkdownDisposition`
- `MarkdownEventLog`
- `MarkdownSyncQueue`

This allows ScanOps intake activity, exception requests, overlay records, events, and disposition outcomes to contribute to the selected reporting period.

### 4. Printable Markdown Take-Off Sheet
A dedicated take-off preview and print output has been added for staff shelf checks.

The printable sheet includes:
- Item
- SKU
- Expiry / sell-by date
- Markdown % and overlay price
- Quantity marked
- Sold quantity
- Remaining quantity
- Required action
- Staff initials column

### 5. Holiday / closed-store planning
The Take-Off Sheet planner now supports:
- Take-off / shelf-check date
- Closed-store date
- Next trading day
- Closure reason
- Include closure-window items toggle

This supports scenarios such as Christmas Day or planned store closures where unsold markdown stock must be identified and removed when the store reopens or before the closure period starts.

### 6. Entity metadata added
`MarkdownBatch` now supports these operational planning fields:
- `planned_takeoff_date`
- `store_closed_date`
- `next_trading_day`
- `holiday_flag`
- `closure_reason`
- `takeoff_status`

### 7. Batch creation alignment
`createMarkdownBatch` now accepts and stores holiday / take-off metadata in both:
- `MarkdownBatch`
- `settings_snapshot.request_metadata`

The Item Master price remains untouched.

## Guardrails Preserved
- No Item Master price mutation
- Markdown overlays remain scoped
- POS fallback model remains intact
- No Wastage merge
- ScanOps remains the normal capture source
- Reports are read-only except print/export actions

## Build Verification
Command run:

```bash
npm run build
```

Result:

```text
BUILD_EXIT:0
```
