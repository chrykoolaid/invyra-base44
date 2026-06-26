import { P26_INV, P26_INV_FIXTURES } from '../src/p26-final/p26Fixtures.js';
import { buildP26InventoryFlow, getP26InventoryFlowResults } from '../src/p26-final/p26Flow.js';
import { getP26InventoryCheck } from '../src/p26-final/p26Check.js';

const errors = [];
function assert(condition, message) { if (!condition) errors.push(message); }

assert(P26_INV === '26A/26C', 'phase marker must remain 26A/26C');
assert(Object.isFrozen(P26_INV_FIXTURES), 'fixtures must be frozen');
assert(P26_INV_FIXTURES.length === 6, 'expected six fixtures');

const results = getP26InventoryFlowResults();
assert(Object.isFrozen(results), 'results must be frozen');

for (const result of results) {
  const { flow } = result;
  assert(result.passed === true, `fixture must pass: ${result.fixture_id}`);
  assert(Object.isFrozen(result), `result must be frozen: ${result.fixture_id}`);
  assert(Object.isFrozen(flow), `flow must be frozen: ${result.fixture_id}`);
  assert(flow.final_candidate_only === true, `candidate only must stay true: ${result.fixture_id}`);
  assert(flow.inventory_system_of_record === true, `Inventory must stay record owner: ${result.fixture_id}`);
  assert(flow.stock_mutation_allowed === false, `stock mutation must not be allowed: ${result.fixture_id}`);
  assert(flow.workflow_write_allowed === false, `workflow write must not be allowed: ${result.fixture_id}`);
  assert(flow.purchase_order_write_allowed === false, `PO write must not be allowed: ${result.fixture_id}`);
  assert(flow.forecast_write_allowed === false, `forecast write must not be allowed: ${result.fixture_id}`);
  assert(flow.rfid_write_allowed === false, `RFID write must not be allowed: ${result.fixture_id}`);
  assert(flow.reorder_generated === false, `reorder must not generate: ${result.fixture_id}`);
  assert(flow.forecast_posted === false, `forecast must not post: ${result.fixture_id}`);
  assert(flow.rfid_activated === false, `RFID must not activate: ${result.fixture_id}`);
  assert(flow.completed === false, `completion must not occur: ${result.fixture_id}`);
  assert(flow.persisted === false, `persistence must not occur: ${result.fixture_id}`);
  assert(flow.write_attempted === false, `write must not occur: ${result.fixture_id}`);
  assert(flow.mutation_attempted === false, `mutation must not occur: ${result.fixture_id}`);

  if (['LIVE', 'PRODUCTION'].includes(flow.environment)) {
    assert(flow.final_candidate === false, `LIVE/PRODUCTION must be blocked: ${result.fixture_id}`);
    assert(flow.status === 'BLOCKED', `LIVE/PRODUCTION status must be BLOCKED: ${result.fixture_id}`);
  }

  if (['TRAINING', 'TEST'].includes(flow.environment) && flow.fields_present && flow.read_only && flow.order_ok && flow.hybrid_future) {
    assert(flow.final_candidate === true, `TEST/TRAINING with valid fields may be candidate: ${result.fixture_id}`);
    assert(flow.status === 'FINAL_VIEW_CANDIDATE_ONLY', `TEST/TRAINING status must be FINAL_VIEW_CANDIDATE_ONLY: ${result.fixture_id}`);
    assert(flow.reorder_review_candidate === true, `reorder candidate must be true: ${result.fixture_id}`);
    assert(flow.forecast_feed_candidate === true, `forecast candidate must be true: ${result.fixture_id}`);
    assert(flow.rfid_compatibility_candidate === true, `RFID candidate must be true: ${result.fixture_id}`);
  }
}

const liveDirect = buildP26InventoryFlow({ environment: 'LIVE' });
assert(liveDirect.final_candidate === false, 'direct LIVE must be blocked');
assert(liveDirect.stock_mutation_allowed === false, 'direct LIVE must not allow stock mutation');
assert(liveDirect.write_attempted === false, 'direct LIVE must not write');
assert(liveDirect.mutation_attempted === false, 'direct LIVE must not mutate');

const trainingDirect = buildP26InventoryFlow({
  flow_id: 'direct-training-flow',
  environment: 'TRAINING',
  previous_flow_id: 'previous-flow',
  source_system: 'INVENTORY',
  source_store_id: 'store',
  target_system: 'SCANOPS',
  visibility_mode: 'READ_ONLY',
  step_order: 'REORDER_REVIEW|FORECAST_FEED_READ_ONLY|RFID_COMPATIBILITY_FUTURE',
  compatibility_mode: 'HYBRID_FUTURE_MODEL',
});
assert(trainingDirect.final_candidate === true, 'direct TRAINING may be candidate only');
assert(trainingDirect.read_only === true, 'direct TRAINING must be read-only');
assert(trainingDirect.order_ok === true, 'direct TRAINING must keep order');
assert(trainingDirect.hybrid_future === true, 'direct TRAINING must keep hybrid future mode');
assert(trainingDirect.reorder_generated === false, 'direct TRAINING must not generate reorder');
assert(trainingDirect.forecast_posted === false, 'direct TRAINING must not post forecast');
assert(trainingDirect.rfid_activated === false, 'direct TRAINING must not activate RFID');
assert(trainingDirect.persisted === false, 'direct TRAINING must not persist');
assert(trainingDirect.write_attempted === false, 'direct TRAINING must not write');
assert(trainingDirect.mutation_attempted === false, 'direct TRAINING must not mutate');

const wrongOrder = buildP26InventoryFlow({ ...trainingDirect.descriptor, step_order: 'RFID_COMPATIBILITY_FUTURE|REORDER_REVIEW|FORECAST_FEED_READ_ONLY' });
assert(wrongOrder.final_candidate === false, 'wrong order must block candidate');
assert(wrongOrder.order_ok === false, 'wrong order must be detected');

const writeMode = buildP26InventoryFlow({ ...trainingDirect.descriptor, visibility_mode: 'WRITE' });
assert(writeMode.final_candidate === false, 'non-read-only mode must block candidate');
assert(writeMode.read_only === false, 'non-read-only mode must be detected');

const wrongCompatibility = buildP26InventoryFlow({ ...trainingDirect.descriptor, compatibility_mode: 'ACTIVE_RFID' });
assert(wrongCompatibility.final_candidate === false, 'active RFID mode must block candidate');
assert(wrongCompatibility.hybrid_future === false, 'active RFID mode must be detected');

const missingDirect = buildP26InventoryFlow({ environment: 'TRAINING' });
assert(missingDirect.final_candidate === false, 'missing fields must block candidate');
assert(missingDirect.fields_present === false, 'missing fields must be detected');

const status = getP26InventoryCheck();
assert(status.passed === true, 'status must pass');
assert(status.fixture_count === 6, 'status fixture count must match');

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('P26 Inventory final candidate remains LIVE/PRODUCTION-blocked, TEST/TRAINING candidate-only, read-only, ordered, hybrid-future-only, no reorder generation, no forecast post, no RFID activation, no PO/forecast/RFID writes, not persisted, non-writable, and non-mutating.');
