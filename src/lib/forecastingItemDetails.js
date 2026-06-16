import { ENV_LIVE } from '@/lib/envFilter';

const FORECASTING_API_BASE_URL = (import.meta.env?.VITE_INVYRA_FORECASTING_API_BASE_URL || '').replace(/\/$/, '');

const FIELD_ORDER = [
  'forecast_demand_next_30_days',
  'average_daily_demand',
  'days_of_cover',
  'stockout_risk',
  'overstock_risk',
  'suggested_reorder_quantity',
  'confidence_rating',
  'short_explanation',
];

const FIELD_LABELS = {
  forecast_demand_next_30_days: 'Forecast demand next 30 days',
  average_daily_demand: 'Average daily demand',
  days_of_cover: 'Days of cover',
  stockout_risk: 'Stockout risk',
  overstock_risk: 'Overstock risk',
  suggested_reorder_quantity: 'Suggested reorder quantity',
  confidence_rating: 'Confidence',
  short_explanation: 'Explanation',
};

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeMovementType(row) {
  const rawType = String(row?.movement_type || row?.type || row?.source || '').toUpperCase().replace(/[\s-]+/g, '_');
  if (rawType === 'RECEIVE' || rawType === 'RECEIVING') return 'RECEIPT';
  if (rawType === 'WASTE') return 'WASTAGE';
  if (rawType === 'SALE') return 'POS_SALE';
  if (rawType === 'STOCKTAKE') return 'STOCKTAKE_VARIANCE';
  if (rawType === 'ADJUST' || rawType === 'REVERSAL') {
    return row?.direction === 'IN' ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT';
  }
  return rawType || 'ADJUSTMENT_OUT';
}

function movementQuantity(row) {
  const qty = row?.qty ?? row?.quantity ?? row?.movement_qty ?? row?.delta_quantity ?? 0;
  return Math.abs(safeNumber(qty, 0));
}

function movementDate(row) {
  return row?.created_date || row?.updated_date || row?.movement_date || todayIsoDate();
}

function locationIdForItem(item) {
  return item?.site_id || item?.location_id || 'PRIMARY';
}

function locationNameForItem(item) {
  return item?.site_name || item?.location_name || 'Primary Location';
}

export function isForecastingApiConfigured() {
  return Boolean(FORECASTING_API_BASE_URL);
}

export function forecastingApiBaseUrl() {
  return FORECASTING_API_BASE_URL;
}

export function buildItemDetailsForecastRequest({ item, movements = [], environment = ENV_LIVE }) {
  const locationId = locationIdForItem(item);
  const reorderQty = safeNumber(item?.reorder_qty, 1) || 1;
  return {
    actor: 'inventory_item_details_ui',
    environment,
    persist_snapshot: true,
    forecast_horizon_days: 30,
    demand_lookback_days: 30,
    target_cover_days: 14,
    safety_stock_days: 3,
    anchor_date: todayIsoDate(),
    item: {
      id: item?.id || item?.sku || 'UNKNOWN_ITEM',
      sku: item?.sku || item?.id || 'UNKNOWN_SKU',
      item_name: item?.name || 'Unnamed item',
      department: item?.category || item?.department || 'Inventory',
      uom: item?.unit || 'unit',
      moq: reorderQty,
    },
    location: {
      branch_id: locationId,
      branch_name: locationNameForItem(item),
      type: item?.site_id ? 'BRANCH' : 'STORE',
    },
    stock_position: {
      item_id: item?.id || item?.sku || 'UNKNOWN_ITEM',
      branch_id: locationId,
      stock_on_hand: safeNumber(item?.stock, 0),
      reserved_stock: safeNumber(item?.reserved_stock, 0),
      environment,
    },
    movements: movements.slice(0, 180).map((row, index) => ({
      ledger_id: row?.id || row?.movement_id || `ITEM-DETAILS-MOV-${index + 1}`,
      item_id: row?.item_id || item?.id || item?.sku || 'UNKNOWN_ITEM',
      branch_id: row?.site_id || row?.location_id || locationId,
      created_at: movementDate(row),
      source: normalizeMovementType(row),
      quantity: movementQuantity(row),
      environment: row?.environment || environment,
    })),
    supplier_profile: {
      primary_supplier_id: item?.preferred_supplier || item?.supplier_id || 'UNKNOWN_SUPPLIER',
      item_id: item?.id || item?.sku || 'UNKNOWN_ITEM',
      supplier_lead_time_days: safeNumber(item?.lead_time_days, 0),
      lead_time_variability: safeNumber(item?.lead_time_variability_days, 0),
      case_pack: reorderQty,
    },
  };
}

export function unavailableForecastPanel({ item, reason, environment = ENV_LIVE }) {
  return {
    panel: 'inventory_item_details_forecast',
    status: 'unavailable',
    environment,
    item_id: item?.id || item?.sku || null,
    location_id: locationIdForItem(item),
    generated_at_utc: null,
    snapshot_id: null,
    snapshot_persisted: false,
    display_fields: null,
    message: 'Forecast unavailable. Item Details and stock history remain usable.',
    reason,
    warnings: ['Forecast intelligence could not be generated for this item.'],
    recommended_action: 'Use existing Item Details and Stock History, then retry forecasting after source data is corrected.',
    advisory: {
      advisory_only: true,
      inventory_ledger_source_of_truth: true,
      mutates_stock: false,
      creates_purchase_order: false,
      approves_purchase_order: false,
    },
    fallback: {
      item_details_usable: true,
      stock_history_usable: true,
      manual_review_available: true,
    },
  };
}

export async function requestItemDetailsForecast({ item, movements = [], environment = ENV_LIVE }) {
  if (!isForecastingApiConfigured()) {
    return unavailableForecastPanel({
      item,
      environment,
      reason: 'Forecasting API is not configured. Set VITE_INVYRA_FORECASTING_API_BASE_URL to enable live forecast calls.',
    });
  }

  try {
    const response = await fetch(`${FORECASTING_API_BASE_URL}/inventory/item-details/forecast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildItemDetailsForecastRequest({ item, movements, environment })),
    });

    if (!response.ok) {
      return unavailableForecastPanel({
        item,
        environment,
        reason: `Forecasting API returned HTTP ${response.status}`,
      });
    }

    return await response.json();
  } catch (error) {
    return unavailableForecastPanel({
      item,
      environment,
      reason: error?.message || 'Forecasting API request failed.',
    });
  }
}

function chipForRisk(value) {
  const label = value || 'Unknown';
  const tone = label === 'High' ? 'danger' : label === 'Medium' ? 'warning' : label === 'Low' ? 'success' : 'neutral';
  return { label, tone };
}

function chipForConfidence(value) {
  const label = value || 'Unknown';
  const tone = label === 'High' ? 'success' : label === 'Medium' || label === 'Low' ? 'warning' : 'neutral';
  return { label, tone };
}

export function buildItemDetailsForecastViewModel(panel) {
  const status = panel?.status || 'unavailable';
  if (status === 'unavailable') {
    return {
      component: 'InventoryItemDetailsForecastPanel',
      status: 'unavailable',
      title: 'Forecast unavailable',
      subtitle: panel?.message || 'Forecast unavailable. Item Details and stock history remain usable.',
      status_chip: { label: 'Unavailable', tone: 'neutral' },
      fields: [],
      warnings: panel?.warnings || ['Forecast intelligence could not be generated for this item.'],
      snapshot: { available: false, snapshot_id: null, label: 'No forecast evidence available', generated_at_utc: null },
      actions: {
        refresh_forecast_visible: true,
        view_snapshot_visible: false,
        manual_review_visible: true,
        create_purchase_order_visible: false,
        approve_purchase_order_visible: false,
        stock_adjustment_visible: false,
      },
      fallback: panel?.fallback || { item_details_usable: true, stock_history_usable: true, manual_review_available: true },
      guardrails: panel?.advisory || {
        advisory_only: true,
        inventory_ledger_source_of_truth: true,
        mutates_stock: false,
        creates_purchase_order: false,
        approves_purchase_order: false,
      },
      rendering_rules: {
        show_raw_model_internals: false,
        show_raw_movement_rows: false,
        duplicate_stock_history: false,
        duplicate_reorder_review: false,
        block_item_details_on_forecast_failure: false,
      },
    };
  }

  const display = panel?.display_fields || {};
  const warnings = [...(panel?.warnings || [])];
  if (status === 'low_confidence' && !warnings.some(warning => warning.includes('Verify movement history'))) {
    warnings.push('Low confidence forecast. Verify movement history, stock accuracy, and supplier lead time before acting.');
  }

  return {
    component: 'InventoryItemDetailsForecastPanel',
    status,
    title: 'Forecast intelligence',
    subtitle: 'Forecasting is advisory. Inventory ledger remains the source of truth.',
    status_chip: status === 'low_confidence'
      ? { label: 'Low confidence', tone: 'warning' }
      : chipForConfidence(display.confidence_rating),
    fields: FIELD_ORDER
      .filter(key => Object.prototype.hasOwnProperty.call(display, key))
      .map(key => ({
        key,
        label: FIELD_LABELS[key],
        value: display[key],
        chip: key === 'stockout_risk' || key === 'overstock_risk'
          ? chipForRisk(display[key])
          : key === 'confidence_rating'
            ? chipForConfidence(display[key])
            : null,
      })),
    warnings,
    snapshot: {
      available: Boolean(panel?.snapshot_id),
      snapshot_id: panel?.snapshot_id || null,
      label: panel?.snapshot_id ? 'View forecast evidence' : 'No forecast evidence available',
      generated_at_utc: panel?.generated_at_utc || null,
    },
    actions: {
      refresh_forecast_visible: true,
      view_snapshot_visible: Boolean(panel?.snapshot_id),
      manual_review_visible: true,
      create_purchase_order_visible: false,
      approve_purchase_order_visible: false,
      stock_adjustment_visible: false,
    },
    fallback: panel?.fallback || { item_details_usable: true, stock_history_usable: true, manual_review_available: true },
    guardrails: panel?.advisory || {
      advisory_only: true,
      inventory_ledger_source_of_truth: true,
      mutates_stock: false,
      creates_purchase_order: false,
      approves_purchase_order: false,
    },
    rendering_rules: {
      show_raw_model_internals: false,
      show_raw_movement_rows: false,
      duplicate_stock_history: false,
      duplicate_reorder_review: false,
      block_item_details_on_forecast_failure: false,
    },
  };
}
