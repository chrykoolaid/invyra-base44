# Invyra Markdown ScanOps Exception Review v1.6

## Scope
Corrected the Markdown desktop exception workflow so desktop review behaves as a receiving/control surface for ScanOps handheld markdown exceptions, rather than asking users to re-enter scanned data.

## Real-World Operations Alignment
Normal markdown capture remains ScanOps-first. For high-quantity or exception cases, the handheld scanner captures the item, quantity, expiry/sell-by date, price snapshot, proposed discount, device/session, operator, reason, and notes. The desktop app receives this evidence and allows a manager/supervisor to approve a temporary scoped overlay or reject/mark the request manually handled.

## Changes Implemented

### 1. Added ScanOps Exception Review Modal
New file:

- `src/components/markdown/ScannerExceptionReviewModal.jsx`

The modal displays ScanOps evidence as read-only fields:

- Item name
- SKU / barcode
- Captured quantity
- On-hand snapshot
- Expiry / sell-by date
- Original shelf price snapshot
- Requested discount
- Requested overlay price
- Operator
- Device / session
- Captured time
- Exception reason

### 2. Removed Re-entry from Synced Review Workflow
For synced ScanOps exceptions, desktop users no longer re-select the item, re-enter quantity, or re-enter expiry date. Those fields are treated as scanner evidence.

The existing manual fallback modal remains available only for admin/manual exception entry when scanner data is not available.

### 3. Manager/Supervisor Actions
The ScanOps review modal supports:

- Approve Overlay
- Adjust approved discount percentage
- Reject
- Mark Manually Handled
- Add manager note

Approval creates a temporary SKU + expiry/date + quantity-scoped markdown overlay. It does not mutate Item Master price.

### 4. Control Board Integration
Updated:

- `src/pages/Markdown.jsx`

ScanOps markdown sync rows now include a `Review` action. Opening a row launches the read-only ScanOps Exception Review modal.

### 5. Overlay Safety
The modal reinforces that approval creates a scoped overlay only:

- Item Master price remains unchanged
- Overlay is limited to affected SKU, expiry/date, and quantity
- POS falls back to normal price when sold out, expired, or manually closed

## Build Verification

Command:

```bash
npm run build
```

Result:

```text
BUILD_EXIT:0
```

## Files Changed

- `src/pages/Markdown.jsx`
- `src/components/markdown/ScannerExceptionReviewModal.jsx`
- `INVYRA_MARKDOWN_SCANOPS_EXCEPTION_REVIEW_V1_6_REPORT.md`
