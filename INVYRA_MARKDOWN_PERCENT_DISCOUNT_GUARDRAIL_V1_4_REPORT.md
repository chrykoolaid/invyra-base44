# INVYRA MARKDOWN PERCENT DISCOUNT + GUARDRAIL WORKFLOW v1.4

## Status
Implemented and build-verified.

## Scope
Align the Markdown manual fallback / ScanOps sync workflow with the Coles-style floor process:

- Markdown label price is driven by a selected markdown percentage.
- Standard markdown labels are printable immediately within guardrails.
- Supervisor/Manager handling is required only for exception cases, not every markdown.
- High quantity line threshold defaults to 20 units.
- Custom label price is treated as a manager override / exception.

## Files Changed

- `src/components/markdown/CreateMarkdownBatchModal.jsx`
- `src/pages/Markdown.jsx`
- `base44/functions/createMarkdownBatch/entry.ts`

## UI Changes

### Manual Markdown Request modal
Replaced free-form “Proposed markdown price” as the primary field with a markdown discount selector:

- 25% off
- 50% off
- 75% off
- Custom / manager override

For standard percentage markdowns, the system now calculates the label price from the original shelf price.

Example:

- Original shelf price: ₱160.00
- Discount: 50% off
- Calculated label price: ₱80.00

Custom price remains available, but is clearly treated as a manager override exception.

### Governance wording
Updated the workflow language so it no longer says approval controls Round 1 before printing for all markdowns.

New rule:

- Standard markdowns within guardrails can print immediately.
- Exception cases require Supervisor/Manager handling.
- Stock is still not deducted at request or label-print stage.
- Final stock movement remains controlled by POS sale, recovery, or confirmed disposition.

### Exception guardrail display
The modal now shows a warning when:

- Counted markdown quantity is above 20 units.
- Custom/manager override price is selected.

## Backend Changes

### `createMarkdownBatch`
Updated to support:

- `markdown_discount_percent`
- `calculated_markdown_price`
- `price_entry_mode`
- `manual_price_override`
- `high_qty_threshold`
- `threshold_exceeded`
- `exception_requires_manager`

### Approval / activation behaviour
Changed from universal approval gating to exception-based gating:

- Standard markdown: creates Active batch and Round 1 immediately.
- Exception markdown by non-privileged user: creates Pending Approval batch.
- Exception markdown by Supervisor/Manager/Admin: can create Active batch and Round 1.

Default high-quantity threshold:

```text
20 units
```

## ScanOps Display Alignment
The Markdown Control Board now recognises additional ScanOps sync payload fields:

- `markdown_discount_percent`
- `calculated_markdown_price`
- `initial_markdown_price`
- `price_entry_mode`
- `manual_price_override`
- `threshold_exceeded`
- `exception_requires_manager`

ScanOps rows can show a “Manager handling” chip when exception flags are present.

## Guardrails Preserved

- No stock movement occurs at markdown request or label creation.
- No Wastage merge.
- Markdown remains separate from Wastage / Stock-Out Exceptions.
- POS validation remains the controlled sale path.
- Disposition/recovery remains the controlled non-sale stock path.

## Verification

Command run:

```bash
npm run build
```

Result:

```text
BUILD_EXIT:0
```
