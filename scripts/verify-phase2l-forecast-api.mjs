const baseUrl = (process.env.VITE_INVYRA_FORECASTING_API_BASE_URL || '').replace(/\/$/, '');

function fail(message) {
  console.error(`Phase 2L verification failed: ${message}`);
  process.exit(1);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

if (!baseUrl) {
  fail('VITE_INVYRA_FORECASTING_API_BASE_URL is not set.');
}

const payload = {
  actor: 'phase2l_runtime_verification',
  environment: 'TRAINING',
  persist_snapshot: true,
  forecast_horizon_days: 30,
  demand_lookback_days: 30,
  target_cover_days: 14,
  safety_stock_days: 3,
  anchor_date: '2026-06-16',
  item: {
    id: 'ITEM-PHASE2L-001',
    sku: 'PHASE2L-SKU-001',
    item_name: 'Phase 2L Verification Item',
    department: 'Inventory',
    uom: 'unit',
    moq: 6,
  },
  location: {
    branch_id: 'BRANCH-PHASE2L',
    branch_name: 'Phase 2L Verification Branch',
    type: 'BRANCH',
  },
  stock_position: {
    item_id: 'ITEM-PHASE2L-001',
    branch_id: 'BRANCH-PHASE2L',
    stock_on_hand: 18,
    reserved_stock: 2,
    environment: 'TRAINING',
  },
  movements: [
    {
      ledger_id: 'PHASE2L-MOV-001',
      item_id: 'ITEM-PHASE2L-001',
      branch_id: 'BRANCH-PHASE2L',
      created_at: '2026-06-14T09:30:00+08:00',
      source: 'POS_SALE',
      quantity: 3,
      environment: 'TRAINING',
    },
    {
      ledger_id: 'PHASE2L-MOV-002',
      item_id: 'ITEM-PHASE2L-001',
      branch_id: 'BRANCH-PHASE2L',
      created_at: '2026-06-15T11:00:00+08:00',
      source: 'RECEIPT',
      quantity: 12,
      environment: 'TRAINING',
    },
  ],
  supplier_profile: {
    primary_supplier_id: 'SUP-PHASE2L',
    item_id: 'ITEM-PHASE2L-001',
    supplier_lead_time_days: 5,
    lead_time_variability: 1,
    case_pack: 6,
  },
};

const allowedStatuses = new Set(['available', 'low_confidence', 'unavailable']);

console.log(`Phase 2L verifying forecasting API: ${baseUrl}`);

const healthResponse = await fetch(`${baseUrl}/health`);
assert(healthResponse.ok, `/health returned HTTP ${healthResponse.status}`);
const health = await healthResponse.json();
assert(health.status === 'ok', '/health did not return status ok');
assert(health.mode === 'advisory', '/health did not return advisory mode');

const panelResponse = await fetch(`${baseUrl}/inventory/item-details/forecast`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
assert(panelResponse.ok, `/inventory/item-details/forecast returned HTTP ${panelResponse.status}`);
const panel = await panelResponse.json();

assert(panel.panel === 'inventory_item_details_forecast', 'panel name mismatch');
assert(allowedStatuses.has(panel.status), `unexpected panel status ${panel.status}`);
assert(panel.environment === 'TRAINING', 'environment mismatch');
assert(panel.item_id === 'ITEM-PHASE2L-001', 'item_id mismatch');
assert(panel.location_id === 'BRANCH-PHASE2L', 'location_id mismatch');
assert(panel.advisory?.advisory_only === true, 'advisory_only flag missing');
assert(panel.advisory?.inventory_ledger_source_of_truth === true, 'ledger source-of-truth flag missing');
assert(panel.advisory?.mutates_stock === false, 'mutates_stock must be false');
assert(panel.advisory?.creates_purchase_order === false, 'creates_purchase_order must be false');
assert(panel.advisory?.approves_purchase_order === false, 'approves_purchase_order must be false');
assert(panel.fallback?.item_details_usable === true, 'item_details_usable fallback missing');
assert(panel.fallback?.stock_history_usable === true, 'stock_history_usable fallback missing');

if (panel.status === 'unavailable') {
  assert(panel.display_fields === null, 'unavailable state should not return display_fields');
} else {
  assert(panel.display_fields, 'available/low_confidence state requires display_fields');
  assert('forecast_demand_next_30_days' in panel.display_fields, 'forecast demand display field missing');
  assert('confidence_rating' in panel.display_fields, 'confidence display field missing');
  assert(panel.snapshot_id, 'available/low_confidence state should include snapshot_id');
}

if (panel.snapshot_id) {
  const snapshotResponse = await fetch(`${baseUrl}/inventory/item-details/forecast/snapshots/${encodeURIComponent(panel.snapshot_id)}`);
  assert(snapshotResponse.ok, `snapshot endpoint returned HTTP ${snapshotResponse.status}`);
  const snapshot = await snapshotResponse.json();
  assert(['available', 'unavailable'].includes(snapshot.status), 'snapshot evidence returned unexpected status');
}

console.log(`Phase 2L verification passed with panel status: ${panel.status}`);
