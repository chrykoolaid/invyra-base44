import { INVENTORY_PHASE14, INVENTORY_PHASE14_FIXTURES } from '../src/inventory-bridge/phase14/phase14Fixtures.js';
import { buildInventoryPhase14Event, getInventoryPhase14EventResults } from '../src/inventory-bridge/phase14/phase14Event.js';
import { getInventoryPhase14Summary } from '../src/inventory-bridge/phase14/phase14Summary.js';

const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

assert(INVENTORY_PHASE14 === '14A/14C', 'phase marker must remain 14A/14C');
assert(Object.isFrozen(INVENTORY_PHASE14_FIXTURES), 'fixtures must be frozen');
assert(INVENTORY_PHASE14_FIXTURES.length === 6, 'expected six fixtures');

const results = getInventoryPhase14EventResults();
assert(Object.isFrozen(results), 'results must be frozen');

for (const result of results) {
  const { event } = result;
  assert(result.passed === true, `fixture must pass: ${result.fixture_id}`);
  assert(Object.isFrozen(result), `result must be frozen: ${result.fixture_id}`);
  assert(Object.isFrozen(event), `event must be frozen: ${result.fixture_id}`);
  assert(event.event_candidate_only === true, `candidate only must stay true: ${result.fixture_id}`);
  assert(event.inventory_system_of_record === true, `Inventory must stay system of record: ${result.fixture_id}`);
  assert(event.output_attempted === false, `output must not occur: ${result.fixture_id}`);
  assert(event.processed === false, `processing must not occur: ${result.fixture_id}`);
  assert(event.completed === false, `completion must not occur: ${result.fixture_id}`);
  assert(event.persisted === false, `persistence must not occur: ${result.fixture_id}`);
  assert(event.receipt_emitted === false, `receipt must not emit: ${result.fixture_id}`);
  assert(event.acknowledgement_emitted === false, `acknowledgement must not emit: ${result.fixture_id}`);
  assert(event.write_attempted === false, `write must not occur: ${result.fixture_id}`);
  assert(event.mutation_attempted === false, `mutation must not occur: ${result.fixture_id}`);

  if (['LIVE', 'PRODUCTION'].includes(event.environment)) {
    assert(event.event_candidate === false, `LIVE/PRODUCTION must be blocked: ${result.fixture_id}`);
    assert(event.status === 'BLOCKED', `LIVE/PRODUCTION status must be BLOCKED: ${result.fixture_id}`);
  }

  if (['TRAINING', 'TEST'].includes(event.environment) && event.fields_present) {
    assert(event.event_candidate === true, `TEST/TRAINING with fields may be candidate: ${result.fixture_id}`);
    assert(event.status === 'OUTBOUND_EVENT_CANDIDATE_ONLY', `TEST/TRAINING status must be OUTBOUND_EVENT_CANDIDATE_ONLY: ${result.fixture_id}`);
  }
}

const liveDirect = buildInventoryPhase14Event({ environment: 'LIVE' });
assert(liveDirect.event_candidate === false, 'direct LIVE must be blocked');
assert(liveDirect.write_attempted === false, 'direct LIVE must not write');
assert(liveDirect.mutation_attempted === false, 'direct LIVE must not mutate');

const trainingDirect = buildInventoryPhase14Event({
  event_id: 'direct-training-event',
  environment: 'TRAINING',
  handshake_id: 'handshake',
  handshake_key: 'key',
  runner_id: 'runner',
  source_system: 'SCANOPS',
  source_device_id: 'device',
  source_store_id: 'store',
  target_system: 'INVENTORY',
  event_type: 'STOCK_OBSERVATION_CANDIDATE',
  event_gate: 'REQUIRED',
  event_profile: 'STRICT_STATIC_OUTBOUND_EVENT',
});
assert(trainingDirect.event_candidate === true, 'direct TRAINING may be candidate only');
assert(trainingDirect.output_attempted === false, 'direct TRAINING must not output');
assert(trainingDirect.processed === false, 'direct TRAINING must not process');
assert(trainingDirect.completed === false, 'direct TRAINING must not complete');
assert(trainingDirect.persisted === false, 'direct TRAINING must not persist');
assert(trainingDirect.write_attempted === false, 'direct TRAINING must not write');
assert(trainingDirect.mutation_attempted === false, 'direct TRAINING must not mutate');

const missingDirect = buildInventoryPhase14Event({ environment: 'TRAINING' });
assert(missingDirect.event_candidate === false, 'missing fields must block candidate');
assert(missingDirect.fields_present === false, 'missing fields must be detected');

const summary = getInventoryPhase14Summary();
assert(summary.passed === true, 'summary must pass');
assert(summary.fixture_count === 6, 'summary fixture count must match');

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Inventory Phase 14 event candidate remains LIVE/PRODUCTION-blocked, TEST/TRAINING candidate-only, no output, not processed, not persisted, non-receipting, non-acknowledging, non-writable, and non-mutating.');
