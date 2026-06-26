import { INVENTORY_PHASE12, INVENTORY_PHASE12_FIXTURES } from '../src/inventory-bridge/phase12/phase12Fixtures.js';
import { buildInventoryPhase12Runner, getInventoryPhase12RunnerResults } from '../src/inventory-bridge/phase12/phase12Runner.js';
import { getInventoryPhase12Status } from '../src/inventory-bridge/phase12/phase12Status.js';

const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

assert(INVENTORY_PHASE12 === '12A/12C', 'phase marker must remain 12A/12C');
assert(Object.isFrozen(INVENTORY_PHASE12_FIXTURES), 'fixtures must be frozen');
assert(INVENTORY_PHASE12_FIXTURES.length === 6, 'expected six fixtures');

const results = getInventoryPhase12RunnerResults();
assert(Object.isFrozen(results), 'results must be frozen');

for (const result of results) {
  const { runner } = result;
  assert(result.passed === true, `fixture must pass: ${result.fixture_id}`);
  assert(Object.isFrozen(result), `result must be frozen: ${result.fixture_id}`);
  assert(Object.isFrozen(runner), `runner must be frozen: ${result.fixture_id}`);
  assert(runner.runner_candidate_only === true, `candidate only must stay true: ${result.fixture_id}`);
  assert(runner.inventory_system_of_record === true, `Inventory must stay system of record: ${result.fixture_id}`);
  assert(runner.executed === false, `execution must not occur: ${result.fixture_id}`);
  assert(runner.completed === false, `completion must not occur: ${result.fixture_id}`);
  assert(runner.persisted === false, `persistence must not occur: ${result.fixture_id}`);
  assert(runner.receipt_emitted === false, `receipt must not emit: ${result.fixture_id}`);
  assert(runner.acknowledgement_emitted === false, `acknowledgement must not emit: ${result.fixture_id}`);
  assert(runner.write_attempted === false, `write must not occur: ${result.fixture_id}`);
  assert(runner.mutation_attempted === false, `mutation must not occur: ${result.fixture_id}`);

  if (['LIVE', 'PRODUCTION'].includes(runner.environment)) {
    assert(runner.runner_candidate === false, `LIVE/PRODUCTION must be blocked: ${result.fixture_id}`);
    assert(runner.status === 'BLOCKED', `LIVE/PRODUCTION status must be BLOCKED: ${result.fixture_id}`);
  }

  if (['TRAINING', 'TEST'].includes(runner.environment) && runner.fields_present) {
    assert(runner.runner_candidate === true, `TEST/TRAINING with fields may be candidate: ${result.fixture_id}`);
    assert(runner.status === 'RUNNER_CANDIDATE_ONLY', `TEST/TRAINING status must be RUNNER_CANDIDATE_ONLY: ${result.fixture_id}`);
  }
}

const liveDirect = buildInventoryPhase12Runner({ environment: 'LIVE' });
assert(liveDirect.runner_candidate === false, 'direct LIVE must be blocked');
assert(liveDirect.write_attempted === false, 'direct LIVE must not write');
assert(liveDirect.mutation_attempted === false, 'direct LIVE must not mutate');

const trainingDirect = buildInventoryPhase12Runner({
  runner_id: 'direct-training-runner',
  environment: 'TRAINING',
  handoff_id: 'handoff',
  handoff_key: 'key',
  review_id: 'review',
  evidence_id: 'evidence',
  source_system: 'SCANOPS',
  source_device_id: 'device',
  source_store_id: 'store',
  target_system: 'INVENTORY',
  runner_gate: 'REQUIRED',
  runner_profile: 'STRICT_STATIC_RUNNER',
});
assert(trainingDirect.runner_candidate === true, 'direct TRAINING may be candidate only');
assert(trainingDirect.executed === false, 'direct TRAINING must not execute');
assert(trainingDirect.completed === false, 'direct TRAINING must not complete');
assert(trainingDirect.persisted === false, 'direct TRAINING must not persist');
assert(trainingDirect.write_attempted === false, 'direct TRAINING must not write');
assert(trainingDirect.mutation_attempted === false, 'direct TRAINING must not mutate');

const missingDirect = buildInventoryPhase12Runner({ environment: 'TRAINING' });
assert(missingDirect.runner_candidate === false, 'missing fields must block candidate');
assert(missingDirect.fields_present === false, 'missing fields must be detected');

const status = getInventoryPhase12Status();
assert(status.passed === true, 'status must pass');
assert(status.fixture_count === 6, 'status fixture count must match');

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Inventory Phase 12 runner candidate remains LIVE/PRODUCTION-blocked, TEST/TRAINING candidate-only, not executed, not completed, not persisted, non-receipting, non-acknowledging, non-writable, and non-mutating.');
