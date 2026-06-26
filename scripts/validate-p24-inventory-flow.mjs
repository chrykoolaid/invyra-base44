import { P24_INV, P24_INV_FIXTURES } from '../src/p24-flow/p24Fixtures.js';
import { buildP24InventoryFlow, getP24InventoryFlowResults } from '../src/p24-flow/p24Flow.js';
import { getP24InventoryCheck } from '../src/p24-flow/p24Check.js';

const errors = [];
function assert(condition, message) { if (!condition) errors.push(message); }

assert(P24_INV === '24A/24C', 'phase marker must remain 24A/24C');
assert(Object.isFrozen(P24_INV_FIXTURES), 'fixtures must be frozen');
assert(P24_INV_FIXTURES.length === 6, 'expected six fixtures');

const results = getP24InventoryFlowResults();
assert(Object.isFrozen(results), 'results must be frozen');

for (const result of results) {
  const { flow } = result;
  assert(result.passed === true, `fixture must pass: ${result.fixture_id}`);
  assert(Object.isFrozen(result), `result must be frozen: ${result.fixture_id}`);
  assert(Object.isFrozen(flow), `flow must be frozen: ${result.fixture_id}`);
  assert(flow.flow_candidate_only === true, `candidate only must stay true: ${result.fixture_id}`);
  assert(flow.inventory_system_of_record === true, `Inventory must stay record owner: ${result.fixture_id}`);
  assert(flow.stock_mutation_allowed === false, `stock mutation must not be allowed: ${result.fixture_id}`);
  assert(flow.workflow_write_allowed === false, `workflow write must not be allowed: ${result.fixture_id}`);
  assert(flow.notification_sent === false, `notification must not send: ${result.fixture_id}`);
  assert(flow.gap_scan_run === false, `gap scan must not run: ${result.fixture_id}`);
  assert(flow.intake_posted === false, `intake must not post: ${result.fixture_id}`);
  assert(flow.item_updated === false, `item must not update: ${result.fixture_id}`);
  assert(flow.completed === false, `completion must not occur: ${result.fixture_id}`);
  assert(flow.persisted === false, `persistence must not occur: ${result.fixture_id}`);
  assert(flow.write_attempted === false, `write must not occur: ${result.fixture_id}`);
  assert(flow.mutation_attempted === false, `mutation must not occur: ${result.fixture_id}`);

  if (['LIVE', 'PRODUCTION'].includes(flow.environment)) {
    assert(flow.flow_candidate === false, `LIVE/PRODUCTION must be blocked: ${result.fixture_id}`);
    assert(flow.status === 'BLOCKED', `LIVE/PRODUCTION status must be BLOCKED: ${result.fixture_id}`);
  }

  if (['TRAINING', 'TEST'].includes(flow.environment) && flow.fields_present && flow.read_only && flow.order_ok) {
    assert(flow.flow_candidate === true, `TEST/TRAINING with valid fields may be candidate: ${result.fixture_id}`);
    assert(flow.status === 'FLOW_VIEW_CANDIDATE_ONLY', `TEST/TRAINING status must be FLOW_VIEW_CANDIDATE_ONLY: ${result.fixture_id}`);
    assert(flow.dashboard_notice_candidate === true, `dashboard candidate must be true: ${result.fixture_id}`);
    assert(flow.gap_scan_candidate === true, `gap scan candidate must be true: ${result.fixture_id}`);
    assert(flow.scanner_intake_candidate === true, `scanner intake candidate must be true: ${result.fixture_id}`);
    assert(flow.item_details_candidate === true, `item details candidate must be true: ${result.fixture_id}`);
  }
}

const liveDirect = buildP24InventoryFlow({ environment: 'LIVE' });
assert(liveDirect.flow_candidate === false, 'direct LIVE must be blocked');
assert(liveDirect.stock_mutation_allowed === false, 'direct LIVE must not allow stock mutation');
assert(liveDirect.write_attempted === false, 'direct LIVE must not write');
assert(liveDirect.mutation_attempted === false, 'direct LIVE must not mutate');

const trainingDirect = buildP24InventoryFlow({
  flow_id: 'direct-training-flow',
  environment: 'TRAINING',
  event_test_id: 'event-test',
  source_system: 'INVENTORY',
  source_store_id: 'store',
  target_system: 'SCANOPS',
  visibility_mode: 'READ_ONLY',
  step_order: 'DASHBOARD_NOTIFICATIONS|GAP_SCAN|SCANNER_INTAKE|ITEM_DETAILS',
});
assert(trainingDirect.flow_candidate === true, 'direct TRAINING may be candidate only');
assert(trainingDirect.read_only === true, 'direct TRAINING must be read-only');
assert(trainingDirect.order_ok === true, 'direct TRAINING must keep order');
assert(trainingDirect.notification_sent === false, 'direct TRAINING must not send notification');
assert(trainingDirect.gap_scan_run === false, 'direct TRAINING must not run scan');
assert(trainingDirect.intake_posted === false, 'direct TRAINING must not post intake');
assert(trainingDirect.item_updated === false, 'direct TRAINING must not update item');
assert(trainingDirect.persisted === false, 'direct TRAINING must not persist');
assert(trainingDirect.write_attempted === false, 'direct TRAINING must not write');
assert(trainingDirect.mutation_attempted === false, 'direct TRAINING must not mutate');

const wrongOrder = buildP24InventoryFlow({ ...trainingDirect.descriptor, step_order: 'GAP_SCAN|DASHBOARD_NOTIFICATIONS|SCANNER_INTAKE|ITEM_DETAILS' });
assert(wrongOrder.flow_candidate === false, 'wrong order must block candidate');
assert(wrongOrder.order_ok === false, 'wrong order must be detected');

const writableDirect = buildP24InventoryFlow({ ...trainingDirect.descriptor, visibility_mode: 'WRITE' });
assert(writableDirect.flow_candidate === false, 'non-read-only mode must block candidate');
assert(writableDirect.read_only === false, 'non-read-only mode must be detected');

const missingDirect = buildP24InventoryFlow({ environment: 'TRAINING' });
assert(missingDirect.flow_candidate === false, 'missing fields must block candidate');
assert(missingDirect.fields_present === false, 'missing fields must be detected');

const status = getP24InventoryCheck();
assert(status.passed === true, 'status must pass');
assert(status.fixture_count === 6, 'status fixture count must match');

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('P24 Inventory flow candidate remains LIVE/PRODUCTION-blocked, TEST/TRAINING candidate-only, read-only, ordered, no notification send, no scan run, no intake post, no item update, not persisted, non-writable, and non-mutating.');
