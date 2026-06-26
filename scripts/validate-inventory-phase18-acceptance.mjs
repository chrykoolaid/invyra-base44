import { INVENTORY_PHASE18, INVENTORY_PHASE18_FIXTURES } from '../src/inventory-bridge/phase18/phase18Fixtures.js';
import { buildInventoryPhase18Acceptance, getInventoryPhase18AcceptanceResults } from '../src/inventory-bridge/phase18/phase18Acceptance.js';
import { getInventoryPhase18Summary } from '../src/inventory-bridge/phase18/phase18Summary.js';

const errors = [];
function assert(condition, message) { if (!condition) errors.push(message); }

assert(INVENTORY_PHASE18 === '18A/18C', 'phase marker must remain 18A/18C');
assert(Object.isFrozen(INVENTORY_PHASE18_FIXTURES), 'fixtures must be frozen');
assert(INVENTORY_PHASE18_FIXTURES.length === 6, 'expected six fixtures');

const results = getInventoryPhase18AcceptanceResults();
assert(Object.isFrozen(results), 'results must be frozen');

for (const result of results) {
  const { acceptance } = result;
  assert(result.passed === true, `fixture must pass: ${result.fixture_id}`);
  assert(Object.isFrozen(result), `result must be frozen: ${result.fixture_id}`);
  assert(Object.isFrozen(acceptance), `acceptance must be frozen: ${result.fixture_id}`);
  assert(acceptance.acceptance_candidate_only === true, `candidate only must stay true: ${result.fixture_id}`);
  assert(acceptance.inventory_system_of_record === true, `Inventory must stay system of record: ${result.fixture_id}`);
  assert(acceptance.accepted === false, `acceptance must not occur: ${result.fixture_id}`);
  assert(acceptance.activated === false, `activation must not occur: ${result.fixture_id}`);
  assert(acceptance.sync_executed === false, `sync must not execute: ${result.fixture_id}`);
  assert(acceptance.dispatched === false, `dispatch must not occur: ${result.fixture_id}`);
  assert(acceptance.completed === false, `completion must not occur: ${result.fixture_id}`);
  assert(acceptance.persisted === false, `persistence must not occur: ${result.fixture_id}`);
  assert(acceptance.receipt_emitted === false, `receipt must not emit: ${result.fixture_id}`);
  assert(acceptance.acknowledgement_emitted === false, `acknowledgement must not emit: ${result.fixture_id}`);
  assert(acceptance.write_attempted === false, `write must not occur: ${result.fixture_id}`);
  assert(acceptance.mutation_attempted === false, `mutation must not occur: ${result.fixture_id}`);

  if (['LIVE', 'PRODUCTION'].includes(acceptance.environment)) {
    assert(acceptance.acceptance_candidate === false, `LIVE/PRODUCTION must be blocked: ${result.fixture_id}`);
    assert(acceptance.status === 'BLOCKED', `LIVE/PRODUCTION status must be BLOCKED: ${result.fixture_id}`);
  }

  if (['TRAINING', 'TEST'].includes(acceptance.environment) && acceptance.fields_present) {
    assert(acceptance.acceptance_candidate === true, `TEST/TRAINING with fields may be candidate: ${result.fixture_id}`);
    assert(acceptance.status === 'ACCEPTANCE_CANDIDATE_ONLY', `TEST/TRAINING status must be ACCEPTANCE_CANDIDATE_ONLY: ${result.fixture_id}`);
  }
}

const liveDirect = buildInventoryPhase18Acceptance({ environment: 'LIVE' });
assert(liveDirect.acceptance_candidate === false, 'direct LIVE must be blocked');
assert(liveDirect.accepted === false, 'direct LIVE must not accept');
assert(liveDirect.activated === false, 'direct LIVE must not activate');
assert(liveDirect.write_attempted === false, 'direct LIVE must not write');
assert(liveDirect.mutation_attempted === false, 'direct LIVE must not mutate');

const trainingDirect = buildInventoryPhase18Acceptance({
  acceptance_id: 'direct-training-acceptance',
  environment: 'TRAINING',
  recovery_id: 'recovery',
  response_id: 'response',
  review_id: 'review',
  event_id: 'event',
  event_key: 'key',
  source_system: 'INVENTORY',
  source_store_id: 'store',
  target_system: 'SCANOPS',
  acceptance_gate: 'REQUIRED',
  acceptance_profile: 'STRICT_STATIC_ACCEPTANCE',
});
assert(trainingDirect.acceptance_candidate === true, 'direct TRAINING may be candidate only');
assert(trainingDirect.accepted === false, 'direct TRAINING must not accept');
assert(trainingDirect.activated === false, 'direct TRAINING must not activate');
assert(trainingDirect.sync_executed === false, 'direct TRAINING must not execute sync');
assert(trainingDirect.dispatched === false, 'direct TRAINING must not dispatch');
assert(trainingDirect.persisted === false, 'direct TRAINING must not persist');
assert(trainingDirect.write_attempted === false, 'direct TRAINING must not write');
assert(trainingDirect.mutation_attempted === false, 'direct TRAINING must not mutate');

const missingDirect = buildInventoryPhase18Acceptance({ environment: 'TRAINING' });
assert(missingDirect.acceptance_candidate === false, 'missing fields must block candidate');
assert(missingDirect.fields_present === false, 'missing fields must be detected');

const summary = getInventoryPhase18Summary();
assert(summary.passed === true, 'summary must pass');
assert(summary.fixture_count === 6, 'summary fixture count must match');

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Inventory Phase 18 acceptance candidate remains LIVE/PRODUCTION-blocked, TEST/TRAINING candidate-only, not accepted, not activated, no sync execution, no dispatch, not persisted, non-receipting, non-acknowledging, non-writable, and non-mutating.');
