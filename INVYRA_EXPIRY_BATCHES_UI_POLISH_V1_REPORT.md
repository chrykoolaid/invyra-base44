# INVYRA EXPIRY & BATCHES — UI POLISH V1 REPORT

## Status

PASS — small UI polish implemented with tracking-only guardrails preserved.

## Files Updated

- `src/pages/ExpiryTracking.jsx`
- `src/components/expiry/ExpiryOverviewTab.jsx`
- `src/components/expiry/BarcodeLookupTab.jsx`
- `src/components/expiry/BatchRegisterTab.jsx`
- `src/components/expiry/NearExpiryTab.jsx`

## What Changed

### Header

- Kept the `TRACKING ONLY` badge.
- Updated the subtitle to clarify that expiry/batch tracking surfaces stock for Markdown or Wastage review only.
- Added a visibility-only info strip explaining that Markdown and Wastage remain separate workflows.

### Overview

- Reworked summary cards into the requested expiry windows:
  - Expired
  - Due Today
  - ≤7 Days
  - ≤14 Days
  - ≤30 Days
  - Healthy
- Added a stronger empty state when no expiry batches exist.
- Added a compact Needs Attention table with:
  - Item
  - Batch
  - Location
  - Expiry
  - Days Left
  - Suggested Next Step
- Suggested next steps remain label-only and advisory:
  - Review for Markdown
  - Review for Wastage
  - Monitor

### Barcode Lookup

- Improved empty-state guidance.
- Added helper examples for SKU, barcode, batch number, and lot number.
- Expanded lookup to include lot number and SKU-based batch search.
- Added result card groups for batch/lot lookups:
  - Item Identity
  - Batch / Lot Details
  - Expiry Status
  - Linked Location
  - Recommended Review Path
- Recommended Review Path remains advisory only.

### Batch & Lot Register

- Added a “What gets tracked” helper panel.
- Improved empty state language.
- Kept `+ Add Batch`.
- No bulk import added.

### Near-Expiry Alerts

- Preserved Ready for Markdown, Ready for Wastage, and Priority FEFO cards.
- Clarified that Open Markdown and Open Wastage links are navigation-only and do not auto-create records.
- Strengthened empty-state language.

## Guardrail Confirmation

No changes were made to add:

- StockMovement writes
- Item price changes
- MarkdownBatch auto-creation
- Wastage / StockOut auto-creation
- Purchase orders
- Forecasting
- New sidebar modules
- Item Master price/cost/stock mutation

## Verification

```text
npm run lint  PASS
npm run build PASS
```

Build note:

```text
[base44] Proxy not enabled (VITE_BASE44_APP_BASE_URL not set)
```

This was informational and the build exited successfully.

Dependency note:

```text
npm audit reported 21 dependency findings after npm ci.
```

No dependency changes were made as part of this UI polish scope.
