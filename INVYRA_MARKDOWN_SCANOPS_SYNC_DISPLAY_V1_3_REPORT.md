# INVYRA MARKDOWN — SCANOPS SYNC DISPLAY v1.3

## Status
Implemented / build verified.

## Scope
Corrected the Markdown Control Board so the main work panel reflects ScanOps-origin markdown request data instead of only showing already-created MarkdownBatch records.

## Files Changed
- `src/pages/Markdown.jsx`
- `src/components/markdown/CreateMarkdownBatchModal.jsx`

## Changes

### 1. ScanOps Sync Queue Loaded on Control Board
`src/pages/Markdown.jsx` now loads:
- `MarkdownBatch`
- `MarkdownReviewQueue`
- `MarkdownRound`
- `MarkdownPrintEvent`
- `MarkdownSyncQueue`

The control board safely handles missing/unavailable `MarkdownSyncQueue` support without breaking the page.

### 2. KPI Cards Updated
The read-only KPI cards now include:
- Scanner Requests
- Pending Approval
- Active Batches
- In Review
- Labels Printed Today

This makes the desktop Markdown board reflect the ScanOps intake posture first.

### 3. Main Work Panel Updated
The previous `Active Markdown Work` panel is now:

`Scanner Intake & Active Markdown Work`

It displays:
- synced ScanOps markdown requests from `MarkdownSyncQueue`
- pending/active/review markdown batches

If ScanOps data exists, it appears first in a dedicated `ScanOps markdown sync` section.

### 4. ScanOps Request Row Added
The control board now renders scanner-captured request evidence including:
- request/local event id
- item name snapshot
- SKU/barcode
- counted markdown quantity
- on-hand snapshot
- original shelf price
- proposed markdown price
- calculated/supplied discount
- expiry/sell-by date
- device id
- capture method
- reason
- sync status
- approval status

The parser is tolerant of different payload shapes, including direct payloads and nested `request`, `data`, or `markdown_request` payloads.

### 5. Workflow Tab Correction
Workflow buttons now reflect the locked architecture:
- Scanner Intake
- Manual Request
- Active Batches
- Review Queue
- Monitor Sheet
- Reports

`Manual Request` is now clearly treated as fallback/admin entry only.

### 6. Manual Modal Copy Updated
The manual batch/request modal now labels itself as:

`Manual Markdown Request`

with copy explaining that normal markdown captures come from ScanOps sync.

## Guardrails Preserved
- No Wastage/Markdown merge.
- No stock movement changes.
- No POS markdown validation changes.
- No automatic label printing from scanner capture.
- No scanner request submission stock deduction.
- Desktop remains the control/approval surface.

## Verification
Command run:

```bash
npm run build
```

Result:

```text
BUILD_EXIT:0
```
