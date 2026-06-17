# Phase 2N — Local Base44 Entity Loading Stabilization

Status: implementation support added; local browser evidence pending

## Objective

Prevent the local Vite Inventory screen from hanging indefinitely when Base44 entity calls do not return in local development.

This phase is local-dev stabilization only. It must not weaken hosted Base44, production RBAC, inventory governance, stock mutation rules, or purchase-order guardrails.

## Trigger

Phase 2M proved that the local browser forecast panel can reach the forecasting API through the dev verification route.

Remaining local issue:

```text
/Inventory stayed on Loading inventory...
```

Cause:

```text
base44.entities.InventoryItem.filter(...) did not return locally when the Base44 proxy/entity connection was unavailable.
```

## Safety Rule

The fallback only activates when:

```text
import.meta.env.DEV === true
VITE_INVYRA_LOCAL_DEV_ROLE_OVERRIDE is set
```

Hosted Base44 and production runtime continue to use normal Base44 entity calls.

## Files Updated

```text
src/pages/Inventory.jsx
src/components/ItemDetailsWorkspace.jsx
package.json
```

## Files Added

```text
src/lib/localDevInventoryFallback.js
scripts/validate-phase2n-local-entity-fallback.mjs
docs/PHASE2N_LOCAL_ENTITY_LOADING_STABILIZATION.md
```

## What Changed

Inventory list loading now wraps the local Base44 entity call with a dev-only timeout:

```text
InventoryItem.filter -> withLocalDevTimeout(...)
```

If the call times out in local dev fallback mode, the Inventory table loads a local verification item instead of remaining stuck.

Item Details movement loading now wraps the ledger entity call with a dev-only timeout:

```text
StockMovement.filter -> withLocalDevTimeout(...)
```

If the call times out in local dev fallback mode, Item Details uses local movement rows so the same forecast panel can render through the standard Item Details path.

## Validation Command

Run:

```bash
npm run validate:phase2n-local-entity-fallback
```

Expected result:

```text
Phase 2N local entity fallback validation passed.
```

## Expected Browser Test

Start the forecasting API with local Vite origin allowed.

Start Inventory/Base44 with:

```powershell
$env:VITE_INVYRA_FORECASTING_API_BASE_URL="http://127.0.0.1:8000"
$env:VITE_INVYRA_LOCAL_DEV_ROLE_OVERRIDE="Admin"
npm run dev
```

Open:

```text
http://localhost:<vite-port>/Inventory
```

Expected:

```text
Inventory no longer hangs forever on Loading inventory...
A local dev fallback notice appears if Base44 entity loading is unavailable
A CHM-LIVE-002 verification row appears
View opens Item Details
Forecast intelligence renders available or low_confidence if API/CORS is configured
No stock adjustment action appears
No purchase order creation or approval action appears
```

## Exit Criteria

Phase 2N is complete when local browser evidence confirms:

```text
/Inventory exits loading state
fallback notice appears only in local dev fallback mode
View opens Item Details for fallback row
Item Details forecast panel reaches the API
safety guardrails remain visible
production permissions remain unchanged
```
