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

/** Map OWNER role → admin until the engine adds OWNER support. */
function normaliseRoleForEngine(role) {
  const r = (role || '').toLowerCase().trim();
  return r === 'owner' ? 'admin' : r;
}

/** Convert engine status string (lowercase) to Base44 UI status (UPPERCASE). */
function normaliseStatus(engineStatus) {
  return (engineStatus || '').toUpperCase();
}

/** Derive stock_out_class from engine event_type when not explicit. */
function deriveClass(record) {
  if (record.stock_out_class) return record.stock_out_class;
  const t = (record.event_type || '').toLowerCase();
  return t === 'store_use' ? 'STORE_USE' : 'WASTAGE';
}

// ---------------------------------------------------------------------------
// UI → Engine
// ---------------------------------------------------------------------------

/**
 * Map a UI StockOutRecord draft payload to the Waste Engine create body.
 */
export function mapDraftToEngine(uiRecord) {
  return {
    sku: uiRecord.sku,
    item_id: uiRecord.item_id,
    item_name: uiRecord.item_name,
    stock_out_class: uiRecord.stock_out_class,
    qty: uiRecord.quantity,
    reason_code: uiRecord.reason_category,
    reason_notes: uiRecord.reason_notes || '',
    location_id: uiRecord.site_id || null,
    location: uiRecord.location || null,
    department: uiRecord.department || null,
    cost_centre: uiRecord.cost_centre || null,
    source: uiRecord.source || 'MANUAL',
    recorded_by_username: uiRecord.created_by_email || uiRecord.created_by || null,
    actor_role: normaliseRoleForEngine(uiRecord.actor_role),
  };
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
  if (filters.filterStatus && filters.filterStatus !== 'ALL') {
    params.status = filters.filterStatus.toLowerCase();
  }
  if (filters.filterLocation && filters.filterLocation !== 'ALL') {
    params.location = filters.filterLocation;
  }
  if (filters.filterDepartment && filters.filterDepartment !== 'ALL') {
    params.department = filters.filterDepartment;
  }
  if (filters.filterSource && filters.filterSource !== 'ALL') {
    params.source = filters.filterSource;
  }
  if (filters.filterCostCentre && filters.filterCostCentre !== 'ALL') {
    params.cost_centre = filters.filterCostCentre;
  }
  if (filters.filterUser && filters.filterUser !== 'ALL') {
    params.recorded_by = filters.filterUser;
  }

  // Date window helpers
  if (filters.window && filters.window !== 'ALL') {
    const now = Date.now();
    if (filters.window === '7D') {
      params.date_from = new Date(now - 7 * 86_400_000).toISOString().split('T')[0];
    } else if (filters.window === '30D') {
      params.date_from = new Date(now - 30 * 86_400_000).toISOString().split('T')[0];
    }
  }

  // Explicit date range (takes precedence over window)
  if (filters.dateFrom) params.date_from = filters.dateFrom;
  if (filters.dateTo)   params.date_to   = filters.dateTo;

  return params;
}

// ---------------------------------------------------------------------------
// Engine → UI
// ---------------------------------------------------------------------------

/**
 * Map a single Waste Engine stock-out event record to a Base44-compatible
 * StockOutRecord-style object so the UI components need no changes.
 */
export function mapEngineRecordToUI(engineRecord) {
  const qty = engineRecord.qty ?? engineRecord.quantity ?? 0;
  const value = engineRecord.estimated_value ?? engineRecord.total_value ?? 0;
  const costPerUnit = qty > 0 ? value / qty : 0;

  return {
    // Identity
    id: engineRecord.stock_out_event_id || engineRecord.id,
    record_id: engineRecord.stock_out_event_id || engineRecord.id,

    // Item
    sku: engineRecord.sku || '',
    item_id: engineRecord.item_id || '',
    item_name: engineRecord.item_name || '',

    // Classification
    stock_out_class: deriveClass(engineRecord),
    quantity: qty,
    reason_category: engineRecord.reason_code || engineRecord.reason_category || '',
    reason_notes: engineRecord.reason_notes || '',

    // Location
    location: engineRecord.location || engineRecord.location_id || '',
    site_id: engineRecord.location_id || engineRecord.site_id || '',
    department: engineRecord.department || '',
    cost_centre: engineRecord.cost_centre || '',

    // Financials
    estimated_value: value,
    cost_per_unit: costPerUnit,

    // Workflow
    source: engineRecord.source || 'MANUAL',
    status: normaliseStatus(engineRecord.status),

    // Actors
    submitted_by: engineRecord.submitted_by || engineRecord.recorded_by_username || '',
    approved_by: engineRecord.approved_by || '',
    posted_by: engineRecord.posted_by || '',
    reversed_by: engineRecord.reversed_by || '',
    created_by: engineRecord.recorded_by_username || engineRecord.created_by || '',
    created_by_email: engineRecord.recorded_by_username || engineRecord.created_by_email || '',

    // Timestamps
    created_date: engineRecord.recorded_at || engineRecord.created_date || engineRecord.created_at || '',
    submitted_at: engineRecord.submitted_at || '',
    approved_at: engineRecord.approved_at || '',
    posted_at: engineRecord.posted_at || '',
    reversed_at: engineRecord.reversed_at || '',

    // Links
    linked_movement_id: engineRecord.linked_movement_id || '',

    // Metadata
    environment: engineRecord.environment || 'LIVE',
    _source: 'engine',
  };
}

/**
 * Map a Waste Engine finance summary response to the shape expected by
 * ReportsTab's summary useMemo and breakdownRows array.
 */
export function mapEngineSummaryToUI(engineSummary) {
  const w = engineSummary.wastage || {};
  const s = engineSummary.store_use || {};

  return {
    total: engineSummary.total_records ?? 0,
    totalQty: engineSummary.total_qty ?? 0,

    grossValue: engineSummary.gross_value ?? 0,
    grossQty: engineSummary.gross_qty ?? 0,
    reversedValue: engineSummary.reversed_value ?? 0,
    reversedQty: engineSummary.reversed_qty ?? 0,
    netValue: engineSummary.net_value ?? 0,
    netQty: engineSummary.net_qty ?? 0,
    pendingValue: engineSummary.pending_value ?? 0,
    pendingQty: engineSummary.pending_qty ?? 0,
    rejectedValue: engineSummary.rejected_value ?? 0,
    rejectedQty: engineSummary.rejected_qty ?? 0,

    wastageGrossValue: w.gross_value ?? 0,
    wastageGrossQty: w.gross_qty ?? 0,
    wastageReversedValue: w.reversed_value ?? 0,
    wastageReversedQty: w.reversed_qty ?? 0,
    wastageNetValue: w.net_value ?? 0,
    wastageNetQty: w.net_qty ?? 0,
    wastagePendingValue: w.pending_value ?? 0,
    wastagePendingQty: w.pending_qty ?? 0,
    wastageRejectedValue: w.rejected_value ?? 0,
    wastageRejectedQty: w.rejected_qty ?? 0,

    storeUseGrossValue: s.gross_value ?? 0,
    storeUseGrossQty: s.gross_qty ?? 0,
    storeUseReversedValue: s.reversed_value ?? 0,
    storeUseReversedQty: s.reversed_qty ?? 0,
    storeUseNetValue: s.net_value ?? 0,
    storeUseNetQty: s.net_qty ?? 0,
    storeUsePendingValue: s.pending_value ?? 0,
    storeUsePendingQty: s.pending_qty ?? 0,
    storeUseRejectedValue: s.rejected_value ?? 0,
    storeUseRejectedQty: s.rejected_qty ?? 0,

    _source: 'engine',
  };
}

/**
 * Map engine /reports/finance/breakdown rows to the same shape as
 * ReportsTab's local breakdown grouping (key → items[]).
 * Returns a flat array; the component can re-group if needed.
 */
export function mapEngineBreakdownToUI(engineBreakdown) {
  const rows = engineBreakdown.rows || engineBreakdown.items || engineBreakdown || [];
  return rows.map(row => ({
    key: row.group_key || row.key || 'Unknown',
    groupBy: row.group_by || '',
    count: row.record_count ?? row.count ?? 0,
    qty: row.qty ?? row.quantity ?? 0,
    grossValue: row.gross_value ?? 0,
    reversedValue: row.reversed_value ?? 0,
    netValue: row.net_value ?? 0,
    pendingValue: row.pending_value ?? 0,
    rejectedValue: row.rejected_value ?? 0,
    estimatedValue: row.net_value ?? row.gross_value ?? 0,
  }));
}