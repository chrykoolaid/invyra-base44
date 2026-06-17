# Phase 2L — API-Configured Base44 Runtime Verification

Status: verification support implemented; runtime evidence pending

## Objective

Phase 2L verifies the Inventory/Base44 Item Details forecast panel when the forecasting API URL is configured.

This phase does not change the live UI behaviour. It adds a local verification script and a clear pass/fail process for the API-configured runtime check.

## Added Script

```text
scripts/verify-phase2l-forecast-api.mjs
```

## Added Command

```text
npm run verify:forecast-api
```

## Required Environment Variable

Set this before running the verification command:

```text
VITE_INVYRA_FORECASTING_API_BASE_URL=<forecasting-api-url>
```

Local example:

```text
VITE_INVYRA_FORECASTING_API_BASE_URL=http://127.0.0.1:8000
```

## What The Script Verifies

The script checks:

- `/health` returns `status: ok`
- `/health` returns `mode: advisory`
- `POST /inventory/item-details/forecast` responds successfully
- response panel is `inventory_item_details_forecast`
- response status is one of `available`, `low_confidence`, or `unavailable`
- environment remains `TRAINING` for the verification payload
- item and location IDs match the request
- advisory-only flag is true
- inventory ledger source-of-truth flag is true
- stock mutation flag is false
- purchase order creation flag is false
- purchase order approval flag is false
- Item Details fallback is true
- Stock History fallback is true
- available/low-confidence states include display fields and snapshot ID
- unavailable state does not expose display fields
- snapshot evidence endpoint is safe when a snapshot ID exists

## Forecasting API Startup Reminder

In the forecasting repo, start the API with allowed origins configured for Base44/local browser use.

Required forecasting API variable:

```text
INVYRA_FORECASTING_ALLOWED_ORIGINS=https://app.base44.com,http://localhost:5173,http://127.0.0.1:5173
```

Then start the API:

```text
uvicorn invyra_forecasting.api.app:app --reload
```

## Base44 Runtime Test

After the script passes, configure the same API URL in Base44:

```text
VITE_INVYRA_FORECASTING_API_BASE_URL=<forecasting-api-url>
```

Then open:

```text
Inventory -> View item -> Item Details -> Forecast intelligence
```

Expected result:

- Forecast panel shows `available`, `low_confidence`, or safe `unavailable`.
- Low-confidence forecasts remain visible.
- Snapshot evidence link appears only when a snapshot ID exists.
- Item Details remains usable.
- Stock History / Movements remain separate.
- No stock mutation action appears.
- No purchase order creation or approval action appears.

## Phase 2L Completion Rule

Phase 2L can be marked runtime-passing only after actual API-configured evidence is supplied.

If the script passes but Base44 runtime fails, open:

```text
Phase 2M — API-configured runtime issue fixes
```

If both script and Base44 runtime pass, Phase 2L can be locked as:

```text
Phase 2L — API-configured Base44 runtime verification
Status: COMPLETE / RUNTIME-PASSING
```
