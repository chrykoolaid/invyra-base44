# INVYRA MARKDOWN SCOPED OVERLAY AUTOCLOSE v1.5

## Scope
Aligned Markdown exception handling with real-world ScanOps / supermarket operations.

## Locked Operational Decision
Normal handheld markdowns should remain fast and should not require manager approval before labels/pricing become usable.

High-quantity or exception markdowns should not globally change the item price. They should create a temporary, controlled markdown overlay that is limited to the affected SKU, expiry/sell-by date, and counted quantity.

## Implemented

### 1. Quantity/date-scoped markdown overlay
- Added overlay metadata to MarkdownBatch and MarkdownRound.
- Overlay is scoped to the affected expiry/date quantity group.
- Item Master price is explicitly marked as unchanged.

### 2. Manager approval activates overlay only
- Updated approval wording from batch/label activation to temporary price overlay approval.
- Approval creates Round 1 as the POS-valid overlay/session.
- Desktop approval does not imply desktop label printing.

### 3. Auto-close / auto-fallback guardrail
- `validateMarkdownPOSSale` now auto-closes expired or sold-out overlays before validation.
- `postMarkdownSale` now closes the overlay when remaining markdown quantity reaches zero.
- Closed overlays stop validating, allowing POS to fall back to the normal current price.

### 4. UI wording correction
- Manual request modal is now positioned as Manual Markdown Exception Entry.
- Pricing language now says overlay price, not permanent item price.
- Batches show Item Master Price as unchanged.
- High-quantity/manager overlays suppress normal desktop print/reprint actions and show overlay-active status instead.

## Files Updated
- `src/components/markdown/CreateMarkdownBatchModal.jsx`
- `src/components/markdown/ApproveBatchModal.jsx`
- `src/components/markdown/MarkdownBatchCard.jsx`
- `src/pages/Markdown.jsx`
- `src/pages/MarkdownBatches.jsx`
- `base44/entities/MarkdownBatch.jsonc`
- `base44/entities/MarkdownRound.jsonc`
- `base44/functions/createMarkdownBatch/entry.ts`
- `base44/functions/approveMarkdownBatch/entry.ts`
- `base44/functions/validateMarkdownPOSSale/entry.ts`
- `base44/functions/postMarkdownSale/entry.ts`

## Build Verification
`npm run build` completed successfully with exit code 0.

## Guardrail Preserved
- No Item Master price mutation.
- No Wastage merge.
- No stock deduction at request/approval stage.
- Stock movement remains driven by POS sale, recovery, or confirmed disposition.
