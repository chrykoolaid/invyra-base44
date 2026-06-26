import { P23_INV, P23_INV_FIXTURES } from '../src/p23-event/p23Fixtures.js';
import { buildP23InventoryEvent, getP23InventoryEventResults } from '../src/p23-event/p23Event.js';
import { getP23InventoryStatus } from '../src/p23-event/p23Status.js';

const errors = [];
function assert(condition, message) { if (!condition) errors.push(message); }

assert(P23_INV === '23A/23C', 'phase marker must remain 23A/23C');
assert(Object.isFrozen(P23_INV_FIXTURES), 'fixtures must be frozen');
assert(P23_INV_FIXTURES.length === 6, 'expected six fixtures');

const results = getP23InventoryEventResults();
assert(Object.isFrozen(results), 'results must be frozen');

for (const result of results) {
  const { event } = result;
  assert(result.passed === true, `fixture must pass: ${result.fixture_id}`);
  assert(Object.isFrozen(result), `result must be frozen: ${result.fixture_id}`);
  assert(Object.isFrozen(event), `event must be frozen: ${result.fixture_id}`);
  assert(event.event_candidate_only === true, `candidate only must stay true: ${result.fixture_id}`);
  assert(event.inventory_system_of_record === true, `Inventory must stay record owner: ${result.fixture_id}`);
  assert(event.stock_mutation_allowed === false, `stock mutation must not be allowed: ${result.fixture_id}`);
  assert(event.workflow_write_allowed === false, `workflow write must not be allowed: ${result.fixture_id}`);
  assert(event.event_sent === false, `event send must not occur: ${result.fixture_id}`);
  assert(event.ack_emitted === false, `ack must not emit: ${result.fixture_id}`);
  assert(event.retry_executed === false, `retry must not execute: ${result.fixture_id}`);
  assert(event.replay_executed === false, `replay must not execute: ${result.fixture_id}`);
  assert(event.duplicate_written === false, `duplicate write must not occur: ${result.fixture_id}`);
  assert(event.audit_written === false, `audit write must not occur: ${result.fixture_id}`);
  assert(event.completed === false, `completion must not occur: ${result.fixture_id}`);
  assert(event.persisted === false, `persistence must not occur: ${result.fixture_id}`);
  assert(event.write_attempted === false, `write must not occur: ${result.fixture_id}`);
  assert(event.mutation_attempted === false, `mutation must not occur: ${result.fixture_id}`);

  if (['LIVE', 'PRODUCTION'].includes(event.environment)) {
    assert(event.event_candidate === false, `LIVE/PRODUCTION must be blocked: ${result.fixture_id}`);
    assert(event.status === 'BLOCKED', `LIVE/PRODUCTION status must be BLOCKED: ${result.fixture_id}`);
  }

  if (['TRAINING', 'TEST'].includes(event.environment) && event.fields_present && event.read_only) {
    assert(event.event_candidate === true, `TEST/TRAINING with valid fields may be candidate: ${result.fixture_id}`);
    assert(event.status === 'EVENT_TEST_CANDIDATE_ONLY', `TEST/TRAINING status must be EVENT_TEST_CANDIDATE_ONLY: ${result.fixture_id}`);
    assert(event.transmission_candidate === true, `transmission candidate must be true: ${result.fixture_id}`);
    assert(event.ack_candidate === true, `ack candidate must be true: ${result.fixture_id}`);
    assert(event.retry_candidate === true, `retry candidate must be true: ${result.fixture_id}`);
    assert(event.duplicate_check_candidate === true, `duplicate candidate must be true: ${result.fixture_id}`);
    assert(event.audit_check_candidate === true, `audit candidate must be true: ${result.fixture_id}`);
  }
}

const liveDirect = buildP23InventoryEvent({ environment: 'LIVE' });
assert(liveDirect.event_candidate === false, 'direct LIVE must be blocked');
assert(liveDirect.stock_mutation_allowed === false, 'direct LIVE must not allow stock mutation');
assert(liveDirect.write_attempted === false, 'direct LIVE must not write');
assert(liveDirect.mutation_attempted === false, 'direct LIVE must not mutate');

const trainingDirect = buildP23InventoryEvent({
  event_test_id: 'direct-training-event',
  environment: 'TRAINING',
  link_id: 'link',
  device_id: 'device',
  event_id: 'event',
  event_type: 'READ_ONLY_VISIBILITY_CHECK',
  source_system: 'INVENTORY',
  source_store_id: 'store',
  target_system: 'SCANOPS',
  visibility_mode: 'READ_ONLY',
  audit_scope: 'STATIC_AUDIT_CANDIDATE',
});
assert(trainingDirect.event_candidate === true, 'direct TRAINING may be candidate only');
assert(trainingDirect.read_only === true, 'direct TRAINING must be read-only');
assert(trainingDirect.transmission_candidate === true, 'direct TRAINING may shape transmission candidate');
assert(trainingDirect.ack_candidate === true, 'direct TRAINING may shape ack candidate');
assert(trainingDirect.event_sent === false, 'direct TRAINING must not send event');
assert(trainingDirect.ack_emitted === false, 'direct TRAINING must not emit ack');
assert(trainingDirect.retry_executed === false, 'direct TRAINING must not retry');
assert(trainingDirect.replay_executed === false, 'direct TRAINING must not replay');
assert(trainingDirect.persisted === false, 'direct TRAINING must not persist');
assert(trainingDirect.write_attempted === false, 'direct TRAINING must not write');
assert(trainingDirect.mutation_attempted === false, 'direct TRAINING must not mutate');

const writableDirect = buildP23InventoryEvent({ ...trainingDirect.descriptor, visibility_mode: 'WRITE' });
assert(writableDirect.event_candidate === false, 'non-read-only mode must block candidate');
assert(writableDirect.read_only === false, 'non-read-only mode must be detected');

const missingDirect = buildP23InventoryEvent({ environment: 'TRAINING' });
assert(missingDirect.event_candidate === false, 'missing fields must block candidate');
assert(missingDirect.fields_present === false, 'missing fields must be detected');

const status = getP23InventoryStatus();
assert(status.passed === true, 'status must pass');
assert(status.fixture_count === 6, 'status fixture count must match');

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('P23 Inventory event candidate remains LIVE/PRODUCTION-blocked, TEST/TRAINING candidate-only, read-only, no stock mutation, no workflow write, no event send, no ack, no retry, no replay, no duplicate write, no audit write, not persisted, and non-mutating.');
