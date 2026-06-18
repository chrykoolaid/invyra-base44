# Invyra Stock-Out Reports UI Simplification Fix

## Lock Status

Decision locked: the Stock-Out Exceptions Reports tab should not show all report breakdown values as KPI cards.

The Reports tab now uses:

- 5 executive KPI cards only
- 1 compact Breakdown by Type table
- Existing Stock-Out Analysis section below the breakdown table
- Existing CSV export behavior preserved

## Files Changed

- `src/components/wastage/ReportsTab.jsx`

## UI Changes Applied

### Removed extra KPI card rows

The following values are no longer rendered as separate KPI cards:

- Wastage Gross
- Wastage Reversed
- Wastage Net
- Store Use Gross
- Store Use Reversed
- Store Use Net
- Wastage Pending
- Wastage Rejected
- Store Use Pending
- Store Use Rejected

### Kept top executive KPI row

The top row now shows only:

1. Gross Value
2. Reversed Value
3. Net Value
4. Pending Value
5. Rejected Value

### Label clarification

Changed:

- `Pending Approval` → `Pending Value`

Updated helper text:

- Gross Value: Original posted value, including records later reversed
- Reversed Value: Value restored through reversal actions
- Net Value: Gross minus reversed
- Pending Value: Draft and submitted records not yet posted
- Rejected Value: Rejected records, excluded from net

### Added Breakdown by Type table

New table rows:

- Wastage
- Store Use
- Combined

Table columns:

- Type
- Gross
- Reversed
- Net
- Pending
- Rejected
- Units

Each money column includes the related unit count as secondary text.

## Guardrails Preserved

No backend logic was changed.

Preserved:

- Gross / reversed / net calculations
- Pending / rejected calculations
- CSV export columns
- CSV export AuditLog creation
- Filters
- Group-by behavior
- Role permissions
- Scanner intake logic
- Amendment logic
- Reversal logic
- StockOutRecord schema
- StockOutAlert schema
- AuditLog behavior

## Validation

Commands run:

```bash
npx eslint src/components/wastage/ReportsTab.jsx --quiet
npm run build
```

Result:

```text
ReportsTab.jsx lint: PASS
Vite production build: PASS
```

Note: full-project lint still has pre-existing unrelated unused-import errors in Markdown, POS, and other Wastage components. This fix did not introduce those errors.
