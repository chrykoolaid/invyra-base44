# Phase 2G — Inventory Item Details Forecast UI Wiring

Status: implemented guarded frontend wiring

## Objective

Phase 2G wires the forecasting intelligence panel into the real Inventory Item Details workspace.

This phase uses the forecasting engine contract from `chrykoolaid/invyra-forecasting` and keeps the Inventory UI read-only and advisory-first.

## Files Added

```text
src/lib/forecastingItemDetails.js
src/components/ItemDetailsForecastPanel.jsx
```

## File Updated

```text
src/components/ItemDetailsWorkspace.jsx
```

## Placement

The forecast panel is inserted inside Item Details after the existing KPI cards and movement-load warning area, before the existing Item Summary / Usage & Demand / Reorder Intelligence sections.

This keeps the panel visible without replacing the existing Item Details layout.

## Runtime Configuration

To enable real forecast calls, set:

```text
VITE_INVYRA_FORECASTING_API_BASE_URL=<forecasting-engine-api-base-url>
```

Example local development value:

```text
VITE_INVYRA_FORECASTING_API_BASE_URL=http://127.0.0.1:8000
```

If this value is not configured, the panel fails closed to the safe unavailable state:

```text
Forecast unavailable. Item Details and Stock History remain usable.
```

## Endpoint Used

```http
POST /inventory/item-details/forecast
```

Snapshot evidence link, when available:

```http
GET /inventory/item-details/forecast/snapshots/{snapshot_id}
```

## Data Mapping

Inventory UI maps the selected item and already-loaded movement rows into the forecasting engine request shape.

Mapped source sections:

- item master fields
- primary location/site fallback
- live stock-on-hand
- reserved stock if present
- movement ledger rows already loaded by Item Details
- supplier/MOQ fallback from item fields

Movement type mapping is client-side normalized before the API call:

- `RECEIVE` -> `RECEIPT`
- `WASTE` -> `WASTAGE`
- `SALE` -> `POS_SALE`
- `STOCKTAKE` -> `STOCKTAKE_VARIANCE`
- `ADJUST` / `REVERSAL` -> `ADJUSTMENT_IN` or `ADJUSTMENT_OUT` based on direction
- transfer types are preserved

## Guardrails Preserved

The UI panel does not:

- mutate stock
- create purchase orders
- approve purchase orders
- auto-reorder
- replace Stock History
- replace Movement Ledger
- replace Reorder Review
- show raw movement rows
- show raw model internals
- block Item Details when forecasting is unavailable

## Existing Workflows Preserved

Existing Item Details sections remain intact:

- Item Summary
- Usage & Demand
- Reorder Intelligence
- Stock Movement Summary
- Open Full Movements link
- Safety lock footer

## Fallback Behaviour

Forecasting failure or missing API config only affects the forecast panel.

Item Details and Stock History remain usable.

## Phase 2G Exit Status

Phase 2G completes guarded frontend wiring for the forecast panel in the Inventory repo.

Next recommended phase:

```text
Phase 2H — Runtime validation and Base44 environment configuration
```

Phase 2H should verify local build/runtime behaviour and configure the forecasting API base URL in the target environment.
