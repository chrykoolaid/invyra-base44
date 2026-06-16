# Phase 2H — Runtime Validation and Base44 Environment Configuration

Status: implemented validation support

## Objective

Phase 2H adds runtime validation and environment configuration guidance for the Phase 2G Item Details forecast UI wiring.

This phase does not change the user-facing forecast panel behaviour. It adds a validation command, an environment example, and documentation so the integration can be checked before Base44 publishing or local runtime testing.

## Added Files

```text
scripts/validate-phase2h-forecast-ui.mjs
.env.local.example
docs/PHASE2H_RUNTIME_VALIDATION_AND_ENV_CONFIG.md
```

## Updated File

```text
package.json
```

New script:

```bash
npm run validate:forecast-ui
```

## Local Validation Sequence

From the `invyra-base44` repo root:

```bash
npm install
npm run validate:forecast-ui
npm run build
npm run dev
```

The validation script checks that the forecast UI wiring still contains the required endpoint, fallback, advisory, and no-mutation guardrails.

## Environment Configuration

Create `.env.local` from `.env.local.example`.

Required Base44 values:

```text
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_backend_url
```

Forecasting value:

```text
VITE_INVYRA_FORECASTING_API_BASE_URL=http://127.0.0.1:8000
```

Use the local value only when the forecasting engine API is running locally.

If `VITE_INVYRA_FORECASTING_API_BASE_URL` is blank, the Item Details forecast panel remains in safe unavailable mode:

```text
Forecast unavailable. Item Details and Stock History remain usable.
```

## Forecasting Engine Local API Startup

In the separate `invyra-forecasting` repo:

```bash
pip install -e ".[api,dev]"
uvicorn invyra_forecasting.api.app:app --reload
```

Then use this in `invyra-base44/.env.local`:

```text
VITE_INVYRA_FORECASTING_API_BASE_URL=http://127.0.0.1:8000
```

## Manual Runtime Smoke Test

1. Start the forecasting engine API.
2. Start the Base44 app with `npm run dev`.
3. Open Inventory.
4. Click `View` on an item row.
5. Confirm the Item Details screen still loads.
6. Confirm the Forecast intelligence panel appears.
7. Confirm Item Summary, Usage & Demand, Reorder Intelligence, and Stock Movement Summary still appear.
8. Confirm the Movements link still opens the full movements page.
9. Confirm there are no stock adjustment, purchase order creation, or purchase order approval buttons in the forecast panel.
10. Stop the forecasting engine API or blank the environment URL and confirm the panel fails closed without breaking Item Details.

## Guardrails Validated

The validation command checks for:

- required forecasting API environment key
- required Item Details forecast endpoint
- required snapshot evidence endpoint
- unavailable fallback text
- advisory-only flag
- no stock mutation flag
- no purchase order creation flag
- no purchase order approval flag
- no raw model internals
- no raw movement rows
- no Stock History duplication
- no Reorder Review duplication
- no InventoryItem write calls in the forecast client/panel
- no StockMovement create calls in the forecast client/panel
- no PurchaseOrder create/update calls in the forecast client/panel
- Item Details forecast panel inserted into Item Details workspace
- existing Item Details safety lock preserved

## Base44 Publish Note

The repo README states that changes pushed to the GitHub repo are reflected in the Base44 Builder and that local development uses `npm install` and `npm run dev`.

After validating locally, open Base44 and publish from the builder when ready.

## Phase 2H Exit Status

Phase 2H establishes validation and environment setup for the forecast UI integration.

Next recommended phase:

```text
Phase 2I — Runtime smoke-test feedback and UI polish hardening
```

Phase 2I should respond to actual Base44 runtime behaviour after the environment is configured and the screen is opened in the builder or local dev server.
