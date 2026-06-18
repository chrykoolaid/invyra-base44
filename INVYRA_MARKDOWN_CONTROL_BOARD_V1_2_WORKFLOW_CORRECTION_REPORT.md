# Invyra Markdown Control Board v1.2 — Workflow Correction Report

## Status
Implemented / build verified.

## Purpose
Corrected the Markdown Control Board after UI review identified that KPI cards were acting like navigation triggers, workflow actions were placed too high in the page, and the New Markdown Batch modal did not reflect the expected store-floor markdown workflow.

## Files Updated

- `src/pages/Markdown.jsx`
- `src/components/markdown/CreateMarkdownBatchModal.jsx`
- `src/components/markdown/ApproveBatchModal.jsx`
- `base44/functions/createMarkdownBatch/entry.ts`

## Changes

### 1. KPI cards made read-only
The Markdown landing KPI cards are now display-only summary cards. They no longer act as navigation links or workflow triggers.

Read-only KPIs:
- Active Batches
- Pending Approval
- In Review
- Ready for Disposition
- Labels Printed Today

### 2. Workflow actions moved under KPI cards
The previous top action button cluster was removed from the header area.

A new Workflow Tabs row now sits below the KPI cards:
- Start Markdown Request
- Active Batches
- Review Queue
- Monitor Sheet
- Reports

This keeps the page structure clearer:

1. Page title
2. Read-only KPI status
3. Workflow navigation/actions
4. Operational work panels

### 3. New Markdown Batch modal replaced with a store-floor request workflow
The previous modal was too simple because it only asked for item and quantity.

It has been replaced with a guided markdown request workflow:

1. Identify item
   - Scanner/search input
   - SKU / barcode / item name support
   - Item cards instead of a basic dropdown

2. Count floor quantity
   - Counted markdown quantity
   - Guard against quantity exceeding available stock

3. Price/date label proposal
   - Original shelf price
   - Proposed markdown price
   - Expiry / sell-by date
   - Calculated discount percentage

4. Request context
   - Capture method chips
   - Markdown reason chips
   - Operator notes

The submit action now reads:

`Submit Markdown Request`

instead of:

`Create Batch`

### 4. Approval modal prefill support
Supervisor/Manager approval now reads request metadata from the batch settings snapshot and pre-fills available proposed price/date details.

Captured metadata displayed in approval:
- Markdown reason
- Capture method
- Operator request evidence

### 5. Backend createMarkdownBatch alignment
`createMarkdownBatch` now accepts request evidence and proposed Round 1 label information:

- capture method
- markdown reason
- original price
- markdown price
- expiry / sell-by date
- label quantity
- operator notes
- scanner/session reference
- request source

This metadata is stored in:

- `MarkdownBatch.settings_snapshot.request_metadata`
- `MarkdownEventLog.payload.meta.request_metadata`
- `AuditLog` notes/source record context

For privileged users where the batch is immediately Active and price/date are supplied, Round 1 is created immediately so the batch is ready for controlled label printing.

For staff users requiring approval, the metadata is staged for supervisor/manager review before activation.

## Guardrails Preserved

- KPI cards do not mutate or navigate.
- Markdown remains separate from Wastage.
- Item Master remains read-only.
- Stock is not deducted when a markdown request is created.
- Stock movement remains governed by POS sale, recovery, or confirmed disposition.
- Existing Markdown routes are preserved.

## Verification

Command run:

```bash
npm run build
```

Result:

```text
BUILD_EXIT:0
```

Build completed successfully.
