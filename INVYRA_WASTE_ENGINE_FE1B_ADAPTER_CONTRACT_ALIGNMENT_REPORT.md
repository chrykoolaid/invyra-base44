# INVYRA WASTE ENGINE FRONT-END ADAPTER — FE-1B CONTRACT ALIGNMENT FIX

## Status

PASS — Adapter contract alignment fixes applied.

This fix keeps Base44 mode as the default safe mode and aligns the new frontend Waste Engine adapter with the current Waste Engine API response and payload contracts.

## Files Changed

- `src/services/wasteEngine/stockOutMappers.js`
- `src/services/wasteEngine/stockOutAdapter.js`
- `src/services/wasteEngine/stockOutRepository.js`
- `src/components/wastage/ReportsTab.jsx`
- `.env.local.example`

## Fixes Applied

### 1. Safe Engine List Response Unwrapping

Added robust list response handling for engine responses shaped as:

- `{ events: [...] }`
- `{ alerts: [...] }`
- `{ sessions: [...] }`
- `{ amendments: [...] }`
- `{ movements: [...] }`
- `{ items: [...] }`
- `{ records: [...] }`
- raw arrays

This prevents `data.map is not a function` failures in engine and hybrid modes.

### 2. Status Contract Alignment

Mapped engine statuses into the existing UI model:

- Engine `APPROVED` → UI `POSTED`
- Engine `REVERSED` → UI `REVERSED`
- Engine `REJECTED` → UI `REJECTED`
- Engine `DRAFT` → UI `DRAFT`
- Engine `SUBMITTED` → UI `SUBMITTED`

Mapped UI filters back into engine status format:

- UI `POSTED` → Engine `APPROVED`

### 3. Value and Cost Mapping

Corrected financial fields:

- Engine `estimated_total_value` → UI `estimated_value`
- Engine `estimated_unit_cost` → UI `cost_per_unit`
- Engine `qty` → UI `quantity`

### 4. Cost Centre Mapping

Corrected spelling mismatch:

- UI `cost_centre` → Engine `cost_center`
- Engine `cost_center` → UI `cost_centre`

### 5. Location Mapping

Corrected location fields:

- Engine `location_id` → UI `site_id`
- Engine `location_name` → UI `location`
- UI numeric `site_id` / `location_id` → Engine `location_id`

Non-numeric UI location labels are kept as local UI filters and are not sent to the engine as unsupported query params.

### 6. Source Mapping

Corrected source mismatch:

- UI `MANUAL` → Engine `ADMIN`
- Engine `ADMIN` → UI `MANUAL`

### 7. ReportsTab Safety Fix

Removed displayed KPI dependency on `engineSummary`.

Reports now use this safer v1 approach:

- Load records through `stockOutRepository.loadAllRecordsForReports()`.
- Map engine records into Base44/UI-compatible shape.
- Calculate displayed KPI cards locally from filtered records.

This preserves:

- Gross / reversed / net accuracy
- Pending / rejected visibility
- Search/filter accuracy
- Simplified Reports UI layout

### 8. Amendment / Alert Payload Safety

Improved future adapter payload safety for:

- Amendment request body fields
- OWNER → ADMIN role mapping
- Alert acknowledge payload (`note`)
- Alert resolve payload (`resolution_note`)

Scanner action migration remains intentionally deferred.

### 9. Environment Example Updated

Added:

```env
VITE_WASTE_ENGINE_MODE=base44
VITE_WASTE_ENGINE_BASE_URL=http://localhost:8000
```

## Validation

- Targeted ESLint on changed files: PASS
- Vite production build: PASS
- Mapper smoke test: PASS

Full-project lint still fails due pre-existing unrelated unused imports in Markdown/POS/Wastage files. These are not caused by FE-1B.

## Lock Decision

Adapter Layer Scaffold v1 can now be treated as structurally accepted with FE-1B contract alignment applied.

Still not a full lock for complete engine-powered Wastage UI because write-action runtime testing against a running Waste Engine is still required, and Scanner Intake full integration remains deferred until scanner review action endpoints are finalized.
