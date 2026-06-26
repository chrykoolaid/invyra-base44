import { INVENTORY_PHASE15, INVENTORY_PHASE15_FIXTURES } from '../src/inventory-bridge/phase15/phase15Fixtures.js';
import { buildInventoryPhase15Review, getInventoryPhase15ReviewResults } from '../src/inventory-bridge/phase15/phase15Review.js';
import { getInventoryPhase15Summary } from '../src/inventory-bridge/phase15/phase15Summary.js';

const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

assert(INVENTORY_PHASE15 === '15A/15C', 'phase marker must remain 15A/15C');
assert(Object.isFrozen(INVENTORY_PHASE15_FIXTURES), 'fixtures must be frozen');
assert(INVENTORY_PHASE15_FIXTURES.length === 6, 'expected six fixtures');

const results = getInventoryPhase15ReviewResults();
assert(Object.isFrozen(results), 'results must be frozen');

for (const result of results) {
  const { review } = result;
  assert(result.passed === true, `fixture must pass: ${result.fixture_id}`);
  assert(Object.isFrozen(result), `result must be frozen: ${result.fixture_id}`);
  assert(Object.isFrozen(review), `review must be frozen: ${result.fixture_id}`);
  assert(review.inbound_review_candidate_only === true, `candidate only must stay true: ${result.fixture_id}`);
  assert(review.inventory_system_of_record === true, `Inventory must stay system of record: ${result.fixture_id}`);
  assert(review.accepted === false, `acceptance must not occur: ${result.fixture_id}`);
  assert(review.applied === false, `application must not occur: ${result.fixture_id}`);
  assert(review.completed === false, `completion must not occur: ${result.fixture_id}`);
  assert(review.persisted === false, `persistence must not occur: ${result.fixture_id}`);
  assert(review.receipt_emitted === false, `receipt must not emit: ${result.fixture_id}`);
  assert(review.acknowledgement_emitted === false, `acknowledgement must not emit: ${result.fixture_id}`);
  assert(review.write_attempted === false, `write must not occur: ${result.fixture_id}`);
  assert(review.mutation_attempted === false, `mutation must not occur: ${result.fixture_id}`);

  if (['LIVE', 'PRODUCTION'].includes(review.environment)) {
    assert(review.review_candidate === false, `LIVE/PRODUCTION must be blocked: ${result.fixture_id}`);
    assert(review.status === 'BLOCKED', `LIVE/PRODUCTION status must be BLOCKED: ${result.fixture_id}`);
  }

  if (['TRAINING', 'TEST'].includes(review.environment) && review.fields_present) {
    assert(review.review_candidate === true, `TEST/TRAINING with fields may be candidate: ${result.fixture_id}`);
    assert(review.status === 'INBOUND_REVIEW_CANDIDATE_ONLY', `TEST/TRAINING status must be INBOUND_REVIEW_CANDIDATE_ONLY: ${result.fixture_id}`);
  }
}

const liveDirect = buildInventoryPhase15Review({ environment: 'LIVE' });
assert(liveDirect.review_candidate === false, 'direct LIVE must be blocked');
assert(liveDirect.write_attempted === false, 'direct LIVE must not write');
assert(liveDirect.mutation_attempted === false, 'direct LIVE must not mutate');

const trainingDirect = buildInventoryPhase15Review({
  review_id: 'direct-training-review',
  environment: 'TRAINING',
  event_id: 'event',
  event_key: 'key',
  source_system: 'SCANOPS',
  source_device_id: 'device',
  source_store_id: 'store',
  target_system: 'INVENTORY',
  event_type: 'STOCK_OBSERVATION_CANDIDATE',
  review_gate: 'REQUIRED',
  review_profile: 'STRICT_STATIC_INBOUND_REVIEW',
});
assert(trainingDirect.review_candidate === true, 'direct TRAINING may be candidate only');
assert(trainingDirect.accepted === false, 'direct TRAINING must not accept');
assert(trainingDirect.applied === false, 'direct TRAINING must not apply');
assert(trainingDirect.completed === false, 'direct TRAINING must not complete');
assert(trainingDirect.persisted === false, 'direct TRAINING must not persist');
assert(trainingDirect.write_attempted === false, 'direct TRAINING must not write');
assert(trainingDirect.mutation_attempted === false, 'direct TRAINING must not mutate');

const missingDirect = buildInventoryPhase15Review({ environment: 'TRAINING' });
assert(missingDirect.review_candidate === false, 'missing fields must block candidate');
assert(missingDirect.fields_present === false, 'missing fields must be detected');

const summary = getInventoryPhase15Summary();
assert(summary.passed === true, 'summary must pass');
assert(summary.fixture_count === 6, 'summary fixture count must match');

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Inventory Phase 15 inbound review candidate remains LIVE/PRODUCTION-blocked, TEST/TRAINING candidate-only, not accepted, not applied, not persisted, non-receipting, non-acknowledging, non-writable, and non-mutating.');
