# Invyra Inventory — Sidebar Priority Cleanup Report

## Status

Completed in this build package.

## Files changed

- `src/components/Layout.jsx`
- `src/App.jsx`
- `src/pages/InventorySettings.jsx`
- `src/lib/permissions.js`
- `src/pages/Dashboard.jsx`
- `src/components/exceptions/InventoryExceptionsTab.jsx`
- `src/pages/InventoryRoadmap.jsx`
- `docs/future-modules/workforce-suite.md`

Removed unused standalone placeholder page files:

- `src/pages/Payroll.jsx`
- `src/pages/TimeTracking.jsx`
- `src/pages/ExportsIntegrations.jsx`

## Sidebar changes

The sidebar has been reordered into the approved operational priority:

1. Pinned
2. Core Inventory
3. Purchasing
4. Intelligence
5. Admin
6. Training

Training is kept as a separate collapsed role-based group because the build already has role-specific training routes.

## Removed from active sidebar

- Exports & Integrations
- Payroll & Rostering
- Time Tracking
- Inventory Admin
- Advanced Reports

## Merged / redirected

- `/ExportsIntegrations` redirects to `/InventorySettings?tab=data-exchange`.
- `/InventoryAdmin` redirects to `/InventorySettings`.
- `/Payroll` and `/TimeTracking` redirect to `/InventoryRoadmap` and are preserved only as deferred future Workforce Suite documentation.

## Inventory Settings update

Added a new `Data Exchange` tab inside Inventory Settings.

The tab is roadmap-only and does not activate live imports, live exports, webhooks, connector setup, API token storage, or third-party sync.

## Branding cleanup

The sidebar subtitle now reads:

`Inventory Operations`

instead of client/demo-specific wording.

## Guardrails preserved

- No stock ledger logic changed.
- No StockMovement creation logic changed.
- No POS sale behavior changed.
- No Item Master mutation added.
- No bridge, sync, transport, import, export, payroll, rostering, or time-tracking runtime activated.
- No new sidebar modules added.
