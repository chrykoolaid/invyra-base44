/**
 * stockOutMappers.js
 * Bidirectional field mapping between the Base44/UI data model
 * and the Invyra Waste Engine API contract.
 *
 * UI  → Engine  : mapDraftToEngine, mapFiltersToEngineParams
 * Engine → UI   : mapEngineRecordToUI, mapEngineSummaryToUI, mapEngineBreakdownToUI
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_ENGINE_TO_UI = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'POSTED',
  POSTED: 'POSTED',
  REVERSED: 'REVERSED',
  REJECTED: 'REJECTED',
  AMENDED: 'AMENDED',
};

const STATUS_UI_TO_ENGINE = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  POSTED: 'APPROVED',
  APPROVED: 'APPROVED',
  REVERSED: 'REVERSED',
  REJECTED: 'REJECTED',
  AMENDED: 'APPROVED',
};

const SOURCE_ENGINE_TO_UI = {
  ADMIN: 'MANUAL',
  SCANNER: 'SCANNER',
  POS: 'POS',
  IMPORT: 'IMPORT',
};

const SOURCE_UI_TO_ENGINE = {
  MANUAL: 'ADMIN',
  ADMIN: 'ADMIN',
  SCANNER: 'SCANNER',
  POS: 'POS',
  IMPORT: 'IMPORT',
};

/** Map OWNER role → ADMIN until the engine adds OWNER support. */
function normaliseRoleForEngine(role) {
  const r = (role || '').toString().trim().toUpperCase();
  return r === 'OWNER' ? 'ADMIN' : r || undefined;
}

/** Convert engine status to Base44 UI status. */
function normaliseStatusForUI(status) {
  const s = (status || '').toString().trim().toUpperCase();
  return STATUS_ENGINE_TO_UI[s] || s;
}

/** Convert UI status to Waste Engine status. */
function normaliseStatusForEngine(status) {
  const s = (status || '').toString().trim().toUpperCase();
  return STATUS_UI_TO_ENGINE[s] || s;
}

/** Convert engine source to Base44 UI source. */
function normaliseSourceForUI(source) {
  const s = (source || '').toString().trim().toUpperCase();
  return SOURCE_ENGINE_TO_UI[s] || s || 'MANUAL';
}

/** Convert UI source to Waste Engine source. */
function normaliseSourceForEngine(source) {
  const s = (source || 'MANUAL').toString().trim().toUpperCase();
  return SOURCE_UI_TO_ENGINE[s] || 'ADMIN';
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toIntOrNull(value) {
  if (value === undefined || value === null || value === '' || value === 'ALL') return null;
  const n = Number(value);
  return Number.isInteger(n) ? n : null;
}

/** Derive stock_out_class from engine event_type when not explicit. */
function deriveClass(record = {}) {
  if (record.stock_out_class) return record.stock_out_class;
  const t = (record.event_type || '').toString().toLowerCase();
  return t === 'store_use' ? 'STORE_USE' : 'WASTAGE';
}

function pickRecord(data) {
  return data?.event || data?.record || data?.item || data || {};
}

// ---------------------------------------------------------------------------
// UI → Engine
// ---------------------------------------------------------------------------

/**
 * Map a UI StockOutRecord draft payload to the Waste Engine create/update body.
 */
export function mapDraftToEngine(uiRecord = {}) {
  const qty = toNumber(uiRecord.quantity ?? uiRecord.qty, undefined);
  const unitCost = uiRecord.estimated_unit_cost ?? uiRecord.cost_per_unit ?? uiRecord.unit_cost;
  const totalValue = uiRecord.estimated_total_value ?? uiRecord.estimated_value ?? uiRecord.total_value;

  const locationId = toIntOrNull(uiRecord.site_id ?? uiRecord.location_id);

  const payload = {
    sku: uiRecord.sku,
    stock_out_class: uiRecord.stock_out_class,
    qty,
    reason_code: uiRecord.reason_category || uiRecord.reason_code || uiRecord.reason,
    reason_notes: uiRecord.reason_notes || uiRecord.notes || '',
    location_id: locationId,
    occurred_at: uiRecord.occurred_at || uiRecord.created_date || undefined,
    department: uiRecord.department || null,
    cost_center: uiRecord.cost_center || uiRecord.cost_centre || null,
    source: normaliseSourceForEngine(uiRecord.source),
    recorded_by_user_id: uiRecord.created_by_user_id || uiRecord.recorded_by_user_id || undefined,
    recorded_by_username: uiRecord.created_by_email || uiRecord.created_by || uiRecord.recorded_by_username || null,
    actor_user_id: uiRecord.actor_user_id || undefined,
    actor_username: uiRecord.actor_username || uiRecord.created_by_email || uiRecord.created_by || undefined,
    actor_role: normaliseRoleForEngine(uiRecord.actor_role),
    estimated_unit_cost: unitCost !== undefined && unitCost !== null && unitCost !== '' ? toNumber(unitCost) : undefined,
    estimated_total_value: totalValue !== undefined && totalValue !== null && totalValue !== '' ? toNumber(totalValue) : undefined,
  };

  // The engine does not accept item_name/item_id/location labels on create.
  // Remove empty values so PATCH requests do not accidentally overwrite fields.
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
}

/**
 * Map active UI filter state to Waste Engine query parameters.
 * Skips 'ALL' / empty values automatically.
 */
export function mapFiltersToEngineParams(filters = {}) {
  const params = {};

  if (filters.filterType && filters.filterType !== 'ALL') {
    params.stock_out_class = filters.filterType;
  }
  if (filters.stock_out_class && filters.stock_out_class !== 'ALL') {
    params.stock_out_class = filters.stock_out_class;
  }

  const status = filters.filterStatus || filters.status;
  if (status && status !== 'ALL') {
    params.status = normaliseStatusForEngine(status);
  }

  const source = filters.filterSource || filters.source;
  if (source && source !== 'ALL') {
    params.source = normaliseSourceForEngine(source);
  }

  const locationId = toIntOrNull(filters.filterLocationId ?? filters.location_id ?? filters.site_id);
  if (locationId !== null) {
    params.location_id = locationId;
  } else if (filters.filterLocation && filters.filterLocation !== 'ALL') {
    // Only send numeric location filters to the engine. The current UI usually
    // stores location names, which remain local UI filters after record loading.
    const fallbackLocationId = toIntOrNull(filters.filterLocation);
    if (fallbackLocationId !== null) params.location_id = fallbackLocationId;
  }

  if (filters.filterDepartment && filters.filterDepartment !== 'ALL') {
    params.department = filters.filterDepartment;
  }
  if (filters.department && filters.department !== 'ALL') {
    params.department = filters.department;
  }

  const costCenter = filters.filterCostCentre || filters.filterCostCenter || filters.cost_center || filters.cost_centre;
  if (costCenter && costCenter !== 'ALL') {
    params.cost_center = costCenter;
  }

  const user = filters.filterUser || filters.username || filters.user || filters.recorded_by;
  if (user && user !== 'ALL') {
    params.username = user;
  }

  if (filters.reason_code && filters.reason_code !== 'ALL') params.reason_code = filters.reason_code;
  if (filters.sku && filters.sku !== 'ALL') params.sku = filters.sku;
  if (filters.groupBy && filters.groupBy !== 'ALL') params.group_by = filters.groupBy;
  if (filters.limit) params.limit = filters.limit;

  // Date window helpers
  if (filters.window && filters.window !== 'ALL') {
    const now = Date.now();
    if (filters.window === '7D') {
      params.date_from = new Date(now - 7 * 86_400_000).toISOString().split('T')[0];
    } else if (filters.window === '30D') {
      params.date_from = new Date(now - 30 * 86_400_000).toISOString().split('T')[0];
    }
  }

  // Explicit date range takes precedence over window.
  if (filters.dateFrom) params.date_from = filters.dateFrom;
  if (filters.dateTo) params.date_to = filters.dateTo;

  return params;
}

// ---------------------------------------------------------------------------
// Engine → UI
// ---------------------------------------------------------------------------

/**
 * Map a single Waste Engine stock-out event record to a Base44-compatible
 * StockOutRecord-style object so the UI components need no changes.
 */
export function mapEngineRecordToUI(enginePayload = {}) {
  const engineRecord = pickRecord(enginePayload);
  const qty = toNumber(engineRecord.qty ?? engineRecord.quantity, 0);
  const value = toNumber(
    engineRecord.estimated_total_value ??
      engineRecord.estimated_value ??
      engineRecord.total_value,
    0,
  );
  const costPerUnit = toNumber(engineRecord.estimated_unit_cost, qty > 0 ? value / qty : 0);
  const id = engineRecord.stock_out_event_id || engineRecord.wastage_event_id || engineRecord.id;

  return {
    // Identity
    id,
    record_id: id,
    stock_out_event_id: id,

    // Item
    sku: engineRecord.sku || '',
    item_id: engineRecord.item_id || '',
    item_name: engineRecord.item_name || engineRecord.item || '',

    // Classification
    stock_out_class: deriveClass(engineRecord),
    quantity: qty,
    reason_category: engineRecord.reason_label || engineRecord.reason_code || engineRecord.reason_category || '',
    reason_code: engineRecord.reason_code || '',
    reason_notes: engineRecord.reason_notes || '',

    // Location
    location: engineRecord.location_name || engineRecord.location || engineRecord.location_label || '',
    site_id: engineRecord.location_id || engineRecord.site_id || '',
    location_id: engineRecord.location_id || engineRecord.site_id || '',
    department: engineRecord.department || '',
    cost_centre: engineRecord.cost_center || engineRecord.cost_centre || '',
    cost_center: engineRecord.cost_center || engineRecord.cost_centre || '',

    // Financials
    estimated_value: value,
    estimated_total_value: value,
    cost_per_unit: costPerUnit,
    estimated_unit_cost: costPerUnit,

    // Workflow
    source: normaliseSourceForUI(engineRecord.source),
    engine_source: engineRecord.source || '',
    status: normaliseStatusForUI(engineRecord.status),
    engine_status: engineRecord.status || '',

    // Actors
    submitted_by: engineRecord.submitted_by_username || engineRecord.submitted_by || engineRecord.recorded_by_username || '',
    approved_by: engineRecord.approved_by_username || engineRecord.approved_by || '',
    posted_by: engineRecord.approved_by_username || engineRecord.posted_by || '',
    reversed_by: engineRecord.reversed_by_username || engineRecord.reversed_by || '',
    rejected_by: engineRecord.rejected_by_username || engineRecord.rejected_by || '',
    created_by: engineRecord.recorded_by_username || engineRecord.created_by || '',
    created_by_email: engineRecord.recorded_by_username || engineRecord.created_by_email || '',

    // Timestamps
    created_date: engineRecord.recorded_at || engineRecord.created_date || engineRecord.created_at || engineRecord.occurred_at || '',
    occurred_at: engineRecord.occurred_at || '',
    submitted_at: engineRecord.submitted_at || '',
    approved_at: engineRecord.approved_at || '',
    posted_at: engineRecord.approved_at || engineRecord.posted_at || '',
    rejected_at: engineRecord.rejected_at || '',
    reversed_at: engineRecord.reversed_at || '',

    // Reversal / rejection / amendments
    reversal_reason: engineRecord.reversal_reason || '',
    reversal_movement_id: engineRecord.reversal_movement_id || '',
    rejection_reason: engineRecord.rejection_reason || '',
    pending_amendments: engineRecord.pending_amendments || 0,
    approved_amendments: engineRecord.approved_amendments || 0,

    // Links
    linked_movement_id: engineRecord.linked_movement_id || '',
    movement_count: engineRecord.movement_count || 0,

    // Metadata
    environment: engineRecord.environment || 'LIVE',
    _source: 'engine',
  };
}

/**
 * Map a Waste Engine finance summary response to a UI-friendly summary shape.
 * This is exposed for future use. ReportsTab v1 deliberately calculates
 * displayed KPI cards locally from mapped records so filters stay accurate.
 */
export function mapEngineSummaryToUI(engineSummary = {}) {
  const w = engineSummary.wastage || engineSummary.WASTAGE || {};
  const s = engineSummary.store_use || engineSummary.STORE_USE || {};

  const grossValue = toNumber(engineSummary.gross_estimated_value ?? engineSummary.gross_value, 0);
  const reversedValue = toNumber(engineSummary.reversed_estimated_value ?? engineSummary.reversed_value, 0);
  const grossQty = toNumber(engineSummary.gross_qty, 0);
  const reversedQty = toNumber(engineSummary.reversed_qty, 0);

  return {
    total: toNumber(engineSummary.gross_event_count ?? engineSummary.total_records, 0),
    totalQty: grossQty,
    grossValue,
    grossQty,
    reversedValue,
    reversedQty,
    netValue: toNumber(engineSummary.net_estimated_value ?? engineSummary.net_value, grossValue - reversedValue),
    netQty: toNumber(engineSummary.net_qty, grossQty - reversedQty),
    pendingValue: toNumber(engineSummary.pending_value, 0),
    pendingQty: toNumber(engineSummary.pending_qty, 0),
    rejectedValue: toNumber(engineSummary.rejected_value, 0),
    rejectedQty: toNumber(engineSummary.rejected_qty, 0),

    wastageGrossValue: toNumber(w.gross_estimated_value ?? w.gross_value, 0),
    wastageGrossQty: toNumber(w.gross_qty, 0),
    wastageReversedValue: toNumber(w.reversed_estimated_value ?? w.reversed_value, 0),
    wastageReversedQty: toNumber(w.reversed_qty, 0),
    wastageNetValue: toNumber(w.net_estimated_value ?? w.net_value, 0),
    wastageNetQty: toNumber(w.net_qty, 0),
    wastagePendingValue: toNumber(w.pending_value, 0),
    wastagePendingQty: toNumber(w.pending_qty, 0),
    wastageRejectedValue: toNumber(w.rejected_value, 0),
    wastageRejectedQty: toNumber(w.rejected_qty, 0),

    storeUseGrossValue: toNumber(s.gross_estimated_value ?? s.gross_value, 0),
    storeUseGrossQty: toNumber(s.gross_qty, 0),
    storeUseReversedValue: toNumber(s.reversed_estimated_value ?? s.reversed_value, 0),
    storeUseReversedQty: toNumber(s.reversed_qty, 0),
    storeUseNetValue: toNumber(s.net_estimated_value ?? s.net_value, 0),
    storeUseNetQty: toNumber(s.net_qty, 0),
    storeUsePendingValue: toNumber(s.pending_value, 0),
    storeUsePendingQty: toNumber(s.pending_qty, 0),
    storeUseRejectedValue: toNumber(s.rejected_value, 0),
    storeUseRejectedQty: toNumber(s.rejected_qty, 0),

    _source: 'engine',
  };
}

/**
 * Map engine /reports/finance/breakdown rows to a flat UI-friendly row array.
 */
export function mapEngineBreakdownToUI(engineBreakdown = {}) {
  const rows = Array.isArray(engineBreakdown)
    ? engineBreakdown
    : engineBreakdown.rows || engineBreakdown.items || engineBreakdown.breakdown || [];

  return rows.map(row => ({
    key: row.group_key || row.key || row.stock_out_class || 'Unknown',
    groupBy: row.group_by || '',
    count: toNumber(row.gross_event_count ?? row.record_count ?? row.count, 0),
    qty: toNumber(row.gross_qty ?? row.qty ?? row.quantity, 0),
    grossValue: toNumber(row.gross_estimated_value ?? row.gross_value, 0),
    reversedValue: toNumber(row.reversed_estimated_value ?? row.reversed_value, 0),
    netValue: toNumber(row.net_estimated_value ?? row.net_value, 0),
    pendingValue: toNumber(row.pending_value, 0),
    rejectedValue: toNumber(row.rejected_value, 0),
    estimatedValue: toNumber(row.net_estimated_value ?? row.net_value ?? row.gross_estimated_value ?? row.gross_value, 0),
  }));
}
