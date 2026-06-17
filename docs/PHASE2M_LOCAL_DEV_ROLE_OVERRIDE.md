# Phase 2M — Local Dev Admin Role Override for API Browser Verification

Status: implementation support added; local browser evidence pending

## Objective

Allow the local Vite browser app to access protected Inventory routes as a higher role while testing the API-connected Forecast intelligence panel.

This is only for local development runtime verification. It must not weaken hosted Base44 or production permissions.

## Governance Lock

Forecasting remains:

```text
advisory only
read-only from Inventory
no stock mutation
no automatic purchase order creation
no automatic purchase order approval
Inventory ledger remains source of truth
forecast unavailable state must not break Item Details
LIVE / TRAINING / TEST separation must be preserved
```

Production permissions remain unchanged.

## Dev-Only Override

Set this Vite environment variable when running the local Inventory/Base44 app:

```powershell
$env:VITE_INVYRA_LOCAL_DEV_ROLE_OVERRIDE="Admin"
```

Supported values:

```text
Staff
Supervisor
Manager
Admin
```

The value is normalized to the app RBAC roles:

```text
staff
supervisor
manager
admin
```

## Safety Rule

The override only applies when Vite reports local dev mode:

```text
import.meta.env.DEV === true
```

In production builds, hosted Base44, and non-dev runtime, the override resolves to `null` and the authenticated user role remains the source for RBAC.

## Files Added

```text
src/lib/devRoleOverride.js
scripts/validate-phase2m-dev-role-override.mjs
docs/PHASE2M_LOCAL_DEV_ROLE_OVERRIDE.md
```

## Files Updated

```text
src/components/RoleGuard.jsx
src/components/Layout.jsx
package.json
```

## What Changed

`RoleGuard` now resolves an effective role using:

```text
resolveEffectiveRole(user?.role)
```

`Layout` uses the same resolver so local dev navigation visibility matches the local dev route guard.

The core permission matrix remains unchanged. `/Inventory` still requires `supervisor` or higher.

## Validation Command

Run:

```bash
npm run validate:phase2m-dev-role-override
```

Expected result:

```text
Phase 2M dev role override validation passed.
```

The validator checks that:

```text
VITE_INVYRA_LOCAL_DEV_ROLE_OVERRIDE exists only through the dev resolver
role override requires env.DEV !== true guard
RoleGuard uses resolveEffectiveRole
Layout uses resolveEffectiveRole
/Inventory remains supervisor
/Suppliers remains manager
/InventoryAdmin remains admin
staff is not granted Inventory or InventoryAdmin production access
```

## Expected Local Test Flow

Forecasting repo terminal:

```powershell
cd C:\Users\Atilla\OneDrive\Documents\invyra-forecasting\invyra-forecasting
$env:INVYRA_FORECASTING_ALLOWED_ORIGINS="https://app.base44.com,http://localhost:5173,http://127.0.0.1:5173"
python -m uvicorn invyra_forecasting.api.app:app --reload
```

Inventory/Base44 repo terminal:

```powershell
cd C:\Users\Atilla\OneDrive\Documents\invyra-base44\invyra-base44
$env:VITE_INVYRA_FORECASTING_API_BASE_URL="http://127.0.0.1:8000"
$env:VITE_INVYRA_LOCAL_DEV_ROLE_OVERRIDE="Admin"
npm run dev
```

Browser:

```text
http://localhost:5173/Inventory
```

Then verify:

```text
Inventory → View item → Item Details → Forecast intelligence
```

Expected browser result:

```text
Forecast intelligence panel shows available or low_confidence
snapshot evidence link appears if snapshot_id exists
Item Details still loads
Item Summary remains visible
Usage & Demand remains visible
Reorder Intelligence remains visible
Stock Movement Summary remains visible
no stock mutation action
no PO creation or approval action
```

## Exit Criteria

Phase 2M can be marked complete when:

```text
local dev Inventory access is possible using VITE_INVYRA_LOCAL_DEV_ROLE_OVERRIDE
production permissions remain unchanged
local browser Forecast intelligence panel reaches the API
available or low_confidence state is shown
snapshot evidence link behaves safely
validation passes
browser evidence is captured
```

If local dev Inventory access works but the browser forecast call fails, open:

```text
Phase 2N — Browser API connectivity fixes
```
