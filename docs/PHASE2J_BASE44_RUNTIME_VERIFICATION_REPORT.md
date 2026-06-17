# Phase 2J — Base44 Runtime Verification Report

Status: substantial runtime verified — safe unavailable mode, lower Item Details sections, and Movements navigation passing

## Objective

Phase 2J verifies the actual Base44/runtime behaviour of the Forecast intelligence panel inside Inventory Item Details.

This report records observed runtime evidence from Base44 Builder preview.

## Current Technical Baseline

Latest locked technical phase before runtime verification:

```text
Phase 2I — Runtime Smoke-Test Feedback and UI Polish Hardening
Status: CI-passing after validation fix
Latest passing validation commit: 2096eb27035600174be9e9274f6effec597bb587
```

Forecast UI validation is green after the snapshot endpoint guard fix.

## Runtime Verification Scope

Verified path:

```text
Inventory -> View item -> Item Details -> Forecast intelligence panel
```

Additional verified navigation:

```text
Item Details -> Open Full Movements -> Inventory Movements filtered by item SKU
```

## Evidence Received

Runtime evidence source:

```text
Base44 Builder preview screenshots supplied by project owner.
```

Observed item:

```text
Fabric Softener 20L
SKU: CHM-LIVE-002
```

Observed mode:

```text
Safe unavailable mode
```

Observed reason:

```text
VITE_INVYRA_FORECASTING_API_BASE_URL is not configured.
```

## Environment Modes to Verify

### Mode A — Safe unavailable mode

Use this when the forecasting API URL is blank:

```text
VITE_INVYRA_FORECASTING_API_BASE_URL=
```

Observed result:

- Inventory Item Details opened successfully.
- Forecast intelligence panel appeared.
- Panel showed unavailable state.
- Panel displayed: `Forecast unavailable. Item Details and stock history remain usable.`
- Panel displayed configuration guidance for `VITE_INVYRA_FORECASTING_API_BASE_URL`.
- Advisory guardrail text appeared.
- No stock adjustment action appeared in the forecast panel.
- No purchase order action appeared in the forecast panel.
- Existing KPI cards remained visible.
- Existing lower Item Details sections remained visible after scroll.
- Open Full Movements navigation worked.
- Inventory Movements opened with the item filter applied for `CHM-LIVE-002`.
- No page crash was visible.

Status:

```text
PASS
```

### Mode B — Forecasting API configured mode

Use this when the forecasting API is running:

```text
VITE_INVYRA_FORECASTING_API_BASE_URL=http://127.0.0.1:8000
```

Expected result:

- Forecast intelligence panel calls the forecasting API.
- Panel shows `available`, `low_confidence`, or safe `unavailable`.
- Low-confidence forecasts remain visible.
- Warnings appear when returned.
- Snapshot evidence link appears only when a snapshot ID exists.
- Broken or missing snapshot evidence does not break Item Details.

Status:

```text
PENDING — API URL not configured in supplied runtime evidence.
```

### Mode C — Forecasting API stopped mode

Start with Mode B, then stop the forecasting API and refresh the panel.

Expected result:

- Forecast panel fails closed to unavailable.
- Item Details remains usable.
- Stock Movement Summary remains usable.
- Open Full Movements still works.
- No blocking runtime error appears.

Status:

```text
PENDING — depends on Mode B runtime setup.
```

## Required Existing Sections

Confirmed present after forecast panel insertion:

- Item Summary
- Usage & Demand
- Reorder Intelligence
- Recommendation box
- Stock Movement Summary
- Open Full Movements button
- Safety lock footer

These sections were confirmed through lower-scroll screenshots.

## Required Forecast Panel Guardrails

Observed in the screenshots:

- advisory-only text visible
- ledger remains source of truth text visible
- no stock adjustment action visible
- no purchase order action visible
- unavailable fallback visible
- no duplicated Stock History table visible in Item Details
- no duplicated Reorder Review table visible in Item Details
- no raw movement rows displayed in the forecast panel
- no raw model internals displayed in the forecast panel

## Movements Navigation Evidence

The `Open Full Movements` button was clicked from Item Details.

Observed result:

- Inventory Movements opened successfully.
- The Movements sidebar item became active.
- The page displayed `Inventory Movements`.
- A banner showed the ledger was filtered from Item Details for `CHM-LIVE-002`.
- The filter field contained `CHM-LIVE-002`.
- Total Movements showed `3`.
- Total In Qty showed `9`.
- Total Out Qty showed `3`.
- The ledger rows shown were for Fabric Softener 20L / `CHM-LIVE-002`.

Status:

```text
PASS
```

## Screenshot Evidence Checklist

| Evidence | Status | Notes |
|---|---|---|
| Inventory page with item row visible | Partial | Item list row itself not shown, but Inventory context and Item Details screen are clearly visible. |
| Item Details opened from the `View` button | Pass | Item Details screen is open for Fabric Softener 20L. |
| Forecast intelligence panel visible | Pass | Forecast unavailable panel visible. |
| Existing Item Summary / Usage & Demand / Reorder Intelligence sections still visible | Pass | Confirmed by lower-scroll screenshots. |
| Stock Movement Summary and Open Full Movements button still visible | Pass | Confirmed by lower-scroll screenshots. |
| Open Full Movements navigation | Pass | Confirmed by Movements page screenshot filtered to `CHM-LIVE-002`. |
| Safe unavailable state if forecasting API URL is blank | Pass | Unavailable state and env configuration guidance visible. |
| Available or low-confidence state if forecasting API is configured | Pending | Requires configured forecasting API. |

## Pass / Fail Table

| Check | Status | Notes |
|---|---|---|
| Inventory page loads | Pass | Base44 preview loaded. |
| Item Details opens from View | Pass | Item Details is open for Fabric Softener 20L. |
| Forecast intelligence panel appears | Pass | Panel visible in screenshot. |
| Safe unavailable mode works | Pass | Correct unavailable state appears when API URL is not configured. |
| Existing Item Summary remains visible | Pass | Confirmed by lower-scroll screenshot. |
| Usage & Demand remains visible | Pass | Confirmed by lower-scroll screenshot. |
| Reorder Intelligence remains visible | Pass | Confirmed by lower-scroll screenshot. |
| Stock Movement Summary remains visible | Pass | Confirmed by lower-scroll screenshot. |
| Open Full Movements still works | Pass | Movements page opened with item filter applied for `CHM-LIVE-002`. |
| No stock mutation action appears | Pass | Forecast panel shows no stock adjustment action. |
| No PO creation/approval action appears | Pass | Forecast panel shows no purchase order action. |
| No duplicated Stock History appears | Pass | No duplicate Stock History section visible across shown Item Details sections. |
| No duplicated Reorder Review appears | Pass | No duplicate Reorder Review section visible across shown Item Details sections. |
| Low-confidence forecast remains visible when returned | Pending | Requires configured forecasting API response. |
| Snapshot evidence link behaves safely | Pending | Requires configured forecasting API response with snapshot ID or missing snapshot check. |

## Runtime Result

Current result:

```text
SUBSTANTIAL PASS — Base44 Item Details UI wiring is runtime-verified in safe unavailable mode, including lower section preservation and Movements navigation. Remaining checks are limited to API-configured behaviour.
```

## Completion Rule

Phase 2J may be fully marked complete when the remaining API-configured pass/fail items are updated from actual runtime evidence.

If issues are found, do not mark Phase 2J complete. Open Phase 2K as:

```text
Phase 2K — Runtime issue fixes and UI polish corrections
```

If all checks pass, lock Phase 2J as:

```text
Phase 2J — Base44 Runtime Verification Report
Status: COMPLETE / RUNTIME-PASSING
```

## Next Recommended Action

Configure the forecasting API URL when ready and verify the API-configured state.
