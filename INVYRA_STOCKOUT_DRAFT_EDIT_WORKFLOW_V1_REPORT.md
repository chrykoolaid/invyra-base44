# INVYRA STOCK-OUT DRAFT EDIT WORKFLOW v1 — IMPLEMENTATION REPORT

## Status

Implemented.

## Scope

This fix adds a proper DRAFT correction workflow for Stock-Out Exceptions so incorrect draft quantities can be corrected before submission without using Amendment, Reversal, or stock movement logic.

## Locked Rule

- DRAFT = Edit Draft / Submit / Delete Draft
- SUBMITTED = Approve / Reject
- POSTED = Amendment / Reverse
- REVERSED = View only
- REJECTED = View only

Amendments remain reserved for approved/posted stock-out records.

## Files Changed

- `src/components/wastage/RecordStockOutModal.jsx`
- `src/components/wastage/WastageTab.jsx`
- `src/components/wastage/StoreUseTab.jsx`
- `src/components/wastage/DeleteDraftConfirmModal.jsx`
- `src/lib/rolePermissions.js`

## Implemented Behaviour

### Edit Draft

DRAFT records now show an `Edit Draft` action when the role/user is allowed to edit that draft.

The edit modal:

- Opens with the existing draft values prefilled.
- Locks the item in edit mode.
- Allows correction of quantity, reason, site/branch, location, department, cost centre, and notes.
- Shows a Draft Change Preview when values change.
- Shows the safety note that no stock movement posts until approval.
- Saves the draft only.
- Does not create StockMovement.

### Delete Draft

DRAFT records now show a `Delete Draft` action when the role/user is allowed to delete that draft.

The delete confirmation:

- Shows item, SKU, quantity, and reason.
- Warns that no stock movement has been posted.
- Deletes the draft record only.
- Does not create StockMovement.

### AuditLog

Draft edit creates:

- `action_type: STOCK_OUT_DRAFT_UPDATED`
- Changed old/new values
- Source module: `StockOut`
- Notes confirming no StockMovement was created

Draft delete creates:

- `action_type: STOCK_OUT_DRAFT_DELETED`
- Deleted draft snapshot
- Source module: `StockOut`
- Notes confirming no StockMovement was created

### Role Rules

Added helper rules:

- `canEditStockOutDraft(role, user, record)`
- `canDeleteStockOutDraft(role, user, record)`

Staff can only edit/delete drafts they created. Supervisor, Manager, Admin, and Owner can edit/delete DRAFT records.

## Validation

- Targeted ESLint: PASS
- Vite production build: PASS

## Guardrails Preserved

- No approval logic changed
- No reversal logic changed
- No amendment logic changed
- No reports calculation logic changed
- No scanner intake logic changed
- No Waste Engine adapter logic changed
- No Markdown logic changed
- No StockMovement is created by draft edit/delete
