# INVYRA STOCK-OUT MODAL SEARCHABLE ITEM PICKER FIX

## Status

PASS — focused UI/UX update applied.

## Scope

Updated the Record Stock-Out modal item selection experience in:

```text
src/components/wastage/RecordStockOutModal.jsx
```

## Changes Applied

- Added a searchable item picker above the item list.
- Search now filters live by:
  - item name
  - SKU
  - barcode / item_barcode / UPC when available
  - category / category_name when available
- Added search results count.
- Added clear-search action.
- Added no-results empty state.
- Made item cards compact and easier to scan.
- Added clear selected-item state with highlighted card and selected badge.
- Preserved Change Item flow.
- Added quantity validation to prevent zero, negative, invalid, or above-stock quantities when stock is available.
- Kept existing create-draft backend function and payload structure unchanged.

## Guardrails Preserved

No changes were made to:

- Stock-out approval logic
- Stock movement posting logic
- Reversal logic
- Amendment logic
- Reports logic
- Waste Engine adapter logic
- Scanner intake logic
- Alerts logic
- AuditLog logic
- Markdowns

## Validation

- Targeted ESLint: PASS
- Vite production build: PASS

## Lock Status

Record Stock-Out Modal — Searchable Item Picker v1: ACCEPTED
