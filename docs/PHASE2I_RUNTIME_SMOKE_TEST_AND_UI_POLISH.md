# Phase 2I — Runtime Smoke-Test Feedback and UI Polish Hardening

Status: implemented validation hardening

## Objective

Phase 2I adds runtime smoke-test hardening for the Forecast intelligence panel inside Inventory Item Details.

This phase does not change the panel behaviour. It adds automatic guard validation, restores package dependency drift, and defines the manual Base44 smoke-test checklist.

## Added Files

```text
.github/workflows/forecast-ui-validation.yml
docs/PHASE2I_RUNTIME_SMOKE_TEST_AND_UI_POLISH.md
```

## Updated File

```text
package.json
```

The dependency drift on `@radix-ui/react-toggle-group` was restored to the existing project baseline:

```text
^1.1.2
```

The Phase 2H validation command remains available:

```bash
npm run validate:forecast-ui
```

## New GitHub Actions Workflow

```text
Forecast UI Validation
```

The workflow runs on:

- push to `main`
- pull requests targeting `main`

Workflow steps:

```text
checkout
setup Node 20
npm install
npm run validate:forecast-ui
```

This is intentionally lightweight. It validates the forecast UI guardrails without requiring a live Base44 backend or a running forecasting API.

## Manual Runtime Smoke-Test Checklist

### A. Safe unavailable mode

Run with `VITE_INVYRA_FORECASTING_API_BASE_URL` blank.

Expected result:

- Inventory loads.
- Item Details opens from the Inventory row `View` button.
- Forecast intelligence panel appears.
- Panel shows unavailable state.
- Item Summary remains visible.
- Usage & Demand remains visible.
- Reorder Intelligence remains visible.
- Stock Movement Summary remains visible.
- Open Full Movements still works.
- No stock update button exists in the forecast panel.
- No purchase order creation button exists in the forecast panel.
- No purchase order approval button exists in the forecast panel.

### B. Forecasting API configured mode

Run the forecasting API separately, then set:

```text
VITE_INVYRA_FORECASTING_API_BASE_URL=http://127.0.0.1:8000
```

Expected result:

- Forecast panel calls `POST /inventory/item-details/forecast`.
- Forecast panel shows either `available`, `low_confidence`, or `unavailable`.
- Low-confidence forecasts remain visible.
- Warnings appear under the panel when returned.
- Snapshot evidence link appears only when a snapshot ID exists.
- Broken or missing snapshot evidence does not break Item Details.

### C. Forecasting API stopped mode

Stop the forecasting API while Base44 is running.

Expected result:

- Forecast panel returns to unavailable state after refresh.
- Item Details remains usable.
- Stock History / Movements access remains usable.
- No error blocks the page.

## UI Polish Guardrails

The panel should remain compact and should not clutter the daily staff view.

Keep:

- compact panel layout
- status chip
- advisory-only text
- no raw movement rows
- no model internals
- no duplicated Stock History section
- no duplicated Reorder Review section

Do not add:

- forecasting tables with raw movement rows
- model debug values
- automatic purchase order buttons
- stock adjustment controls
- duplicate movement ledger views
- dashboard alert duplication

## Current Known Limitation

The Inventory repo does not yet prove a full browser runtime through CI because a real Base44 backend/environment is required.

The added CI guard validates static integration safety. Full runtime confirmation still requires opening the app locally or in the Base44 Builder.

## Phase 2I Exit Status

Phase 2I establishes automated forecast UI guard validation and a manual runtime smoke-test path.

Next recommended phase:

```text
Phase 2J — Base44 runtime verification report
```

Phase 2J should be completed after the screen is opened in Base44 or local dev and actual runtime behaviour is reported back.
