import { INVENTORY_PHASE10, INVENTORY_PHASE10_FIXTURES } from '../src/inventory-bridge/phase10/phase10Fixtures.js';
import { buildInventoryPhase10Review, getInventoryPhase10ReviewResults } from '../src/inventory-bridge/phase10/phase10Review.js';
import { getInventoryPhase10Status } from '../src/inventory-bridge/phase10/phase10Status.js';

const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

assert(INVENTORY_PHASE10 === '10A/10C', 'phase marker must remain 10A/10C');
assert(Object.isFrozen(INVENTORY_PHASE10_FIXTURES), 'fixtures must be frozen');
assert(INVENTORY_PHASE10_FIXTURES.length === 4, 'expected four fixtures');

const results = getInventoryPhase10ReviewResults();
assert(Object.isFrozen(results), 'results must be frozen');

for (const result of results) {
  const { review } = result;
  assert(result.passed === true, `fixture must pass: ${result.fixture_id}`);
  assert(Object.isFrozen(result), `result must be frozen: ${result.fixture_id}`);
  assert(Object.isFrozen(review), `review must be frozen: ${result.fixture_id}`);
  assert(review.review_only === true, `review only must stay true: ${result.fixture_id}`);
  assert(review.inventory_system_of_record === true, `Inventory must stay system of record: ${result.fixture_id}`);
  assert(review.approved === false, `approval must not occur: ${result.fixture_id}`);
  assert(review.completed === false, `completion must not occur: ${result.fixture_id}`);
  assert(review.persisted === false, `persistence must not occur: ${result.fixture_id}`);
  assert(review.receipt_emitted === false, `receipt must not emit: ${result.fixture_id}`);
  assert(review.acknowledgement_emitted === false, `acknowledgement must not emit: ${result.fixture_id}`);
  assert(review.write_attempted === false, `write must not occur: ${result.fixture_id}`);
  assert(review.mutation_attempted === false, `mutation must not occur: ${result.fixture_id}`);

  if (['LIVE', 'PRODUCTION'].includes(review.environment)) {
    assert(review.ready === false, `LIVE/PRODUCTION must be blocked: ${result.fixture_id}`);
    assert(review.status === 'BLOCKED', `LIVE/PRODUCTION status must be BLOCKED: ${result.fixture_id}`);
  }

  if (['TRAINING', 'TEST'].includes(review.environment) && review.fields_present) {
    assert(review.ready === true, `TEST/TRAINING with fields may be ready: ${result.fixture_id}`);
    assert(review.status === 'REVIEW_READY', `TEST/TRAINING status must be REVIEW_READY: ${result.fixture_id}`);
  }
}

const liveDirect = buildInventoryPhase10Review({ environment: 'LIVE' });
assert(liveDirect.ready === false, 'direct LIVE must be blocked');
assert(liveDirect.write_attempted === false, 'direct LIVE must not write');
assert(liveDirect.mutation_attempted === false, 'direct LIVE must not mutate');

const trainingDirect = buildInventoryPhase10Review({
  review_id: 'direct-training',
  environment: 'TRAINING',
  evidence_id: 'evidence',
  evidence_key: 'key',
  source_system: 'SCANOPS',
  source_device_id: 'device',
  source_store_id: 'store',
  target_system: 'INVENTORY',
  review_gate: 'REQUIRED',
  review_profile: 'STRICT_STATIC_REVIEW',
});
assert(trainingDirect.ready === true, 'direct TRAINING may be review-ready');
assert(trainingDirect.completed === false, 'direct TRAINING must not complete');
assert(trainingDirect.persisted === false, 'direct TRAINING must not persist');
assert(trainingDirect.write_attempted === false, 'direct TRAINING must not write');
assert(trainingDirect.mutation_attempted === false, 'direct TRAINING must not mutate');

const missingDirect = buildInventoryPhase10Review({ environment: 'TRAINING' });
assert(missingDirect.ready === false, 'missing fields must block readiness');
assert(missingDirect.fields_present === false, 'missing fields must be detected');

const status = getInventoryPhase10Status();
assert(status.passed === true, 'status must pass');
assert(status.fixture_count === 4, 'status fixture count must match');

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Inventory Phase 10 review check remains LIVE-blocked, TEST/TRAINING review-only, not completed, not persisted, non-receipting, non-acknowledging, non-writable, and non-mutating.');
