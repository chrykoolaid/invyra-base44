import { INVENTORY_PHASE11, INVENTORY_PHASE11_FIXTURES } from '../src/inventory-bridge/phase11/phase11Fixtures.js';
import { buildInventoryPhase11Handoff, getInventoryPhase11HandoffResults } from '../src/inventory-bridge/phase11/phase11Handoff.js';
import { getInventoryPhase11Status } from '../src/inventory-bridge/phase11/phase11Status.js';

const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

assert(INVENTORY_PHASE11 === '11A/11C', 'phase marker must remain 11A/11C');
assert(Object.isFrozen(INVENTORY_PHASE11_FIXTURES), 'fixtures must be frozen');
assert(INVENTORY_PHASE11_FIXTURES.length === 6, 'expected six fixtures');

const results = getInventoryPhase11HandoffResults();
assert(Object.isFrozen(results), 'results must be frozen');

for (const result of results) {
  const { handoff } = result;
  assert(result.passed === true, `fixture must pass: ${result.fixture_id}`);
  assert(Object.isFrozen(result), `result must be frozen: ${result.fixture_id}`);
  assert(Object.isFrozen(handoff), `handoff must be frozen: ${result.fixture_id}`);
  assert(handoff.review_only === true, `review only must stay true: ${result.fixture_id}`);
  assert(handoff.handoff_candidate_only === true, `handoff candidate only must stay true: ${result.fixture_id}`);
  assert(handoff.inventory_system_of_record === true, `Inventory must stay system of record: ${result.fixture_id}`);
  assert(handoff.approved === false, `approval must not occur: ${result.fixture_id}`);
  assert(handoff.completed === false, `completion must not occur: ${result.fixture_id}`);
  assert(handoff.persisted === false, `persistence must not occur: ${result.fixture_id}`);
  assert(handoff.receipt_emitted === false, `receipt must not emit: ${result.fixture_id}`);
  assert(handoff.acknowledgement_emitted === false, `acknowledgement must not emit: ${result.fixture_id}`);
  assert(handoff.write_attempted === false, `write must not occur: ${result.fixture_id}`);
  assert(handoff.mutation_attempted === false, `mutation must not occur: ${result.fixture_id}`);

  if (['LIVE', 'PRODUCTION'].includes(handoff.environment)) {
    assert(handoff.handoff_candidate === false, `LIVE/PRODUCTION must be blocked: ${result.fixture_id}`);
    assert(handoff.status === 'BLOCKED', `LIVE/PRODUCTION status must be BLOCKED: ${result.fixture_id}`);
  }

  if (['TRAINING', 'TEST'].includes(handoff.environment) && handoff.fields_present) {
    assert(handoff.handoff_candidate === true, `TEST/TRAINING with fields may be handoff candidate only: ${result.fixture_id}`);
    assert(handoff.status === 'HANDOFF_CANDIDATE_ONLY', `TEST/TRAINING status must be HANDOFF_CANDIDATE_ONLY: ${result.fixture_id}`);
  }
}

const liveDirect = buildInventoryPhase11Handoff({ environment: 'LIVE' });
assert(liveDirect.handoff_candidate === false, 'direct LIVE must be blocked');
assert(liveDirect.write_attempted === false, 'direct LIVE must not write');
assert(liveDirect.mutation_attempted === false, 'direct LIVE must not mutate');

const trainingDirect = buildInventoryPhase11Handoff({
  handoff_id: 'direct-training-handoff',
  review_id: 'direct-training-review',
  environment: 'TRAINING',
  evidence_id: 'evidence',
  evidence_key: 'key',
  source_system: 'SCANOPS',
  source_device_id: 'device',
  source_store_id: 'store',
  target_system: 'INVENTORY',
  review_gate: 'REQUIRED',
  review_profile: 'STRICT_STATIC_REVIEW',
  handoff_gate: 'REQUIRED',
  handoff_profile: 'STRICT_STATIC_HANDOFF',
});
assert(trainingDirect.handoff_candidate === true, 'direct TRAINING may be handoff candidate only');
assert(trainingDirect.completed === false, 'direct TRAINING must not complete');
assert(trainingDirect.persisted === false, 'direct TRAINING must not persist');
assert(trainingDirect.write_attempted === false, 'direct TRAINING must not write');
assert(trainingDirect.mutation_attempted === false, 'direct TRAINING must not mutate');

const missingDirect = buildInventoryPhase11Handoff({ environment: 'TRAINING' });
assert(missingDirect.handoff_candidate === false, 'missing fields must block handoff candidate');
assert(missingDirect.fields_present === false, 'missing fields must be detected');

const status = getInventoryPhase11Status();
assert(status.passed === true, 'status must pass');
assert(status.fixture_count === 6, 'status fixture count must match');

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Inventory Phase 11 handoff remains LIVE/PRODUCTION-blocked, TEST/TRAINING handoff-candidate-only, not completed, not persisted, non-receipting, non-acknowledging, non-writable, and non-mutating.');
