import { P20_INV, P20_INV_FIXTURES } from '../src/p20-bridge-plan/p20Fixtures.js';
import { buildP20InventoryPlan, getP20InventoryPlanResults } from '../src/p20-bridge-plan/p20Plan.js';
import { getP20InventoryStatus } from '../src/p20-bridge-plan/p20Status.js';

const errors = [];
function assert(condition, message) { if (!condition) errors.push(message); }

assert(P20_INV === '20A/20C', 'phase marker must remain 20A/20C');
assert(Object.isFrozen(P20_INV_FIXTURES), 'fixtures must be frozen');
assert(P20_INV_FIXTURES.length === 6, 'expected six fixtures');

const results = getP20InventoryPlanResults();
assert(Object.isFrozen(results), 'results must be frozen');

for (const result of results) {
  const { plan } = result;
  assert(result.passed === true, `fixture must pass: ${result.fixture_id}`);
  assert(Object.isFrozen(result), `result must be frozen: ${result.fixture_id}`);
  assert(Object.isFrozen(plan), `plan must be frozen: ${result.fixture_id}`);
  assert(plan.plan_candidate_only === true, `candidate only must stay true: ${result.fixture_id}`);
  assert(plan.inventory_system_of_record === true, `Inventory must stay record owner: ${result.fixture_id}`);
  assert(plan.live_enabled === false, `LIVE must not enable: ${result.fixture_id}`);
  assert(plan.approval_granted === false, `approval must not be granted: ${result.fixture_id}`);
  assert(plan.run_allowed === false, `run must not be allowed: ${result.fixture_id}`);
  assert(plan.run_attempted === false, `run must not be attempted: ${result.fixture_id}`);
  assert(plan.completed === false, `completion must not occur: ${result.fixture_id}`);
  assert(plan.persisted === false, `persistence must not occur: ${result.fixture_id}`);
  assert(plan.receipt_emitted === false, `receipt must not emit: ${result.fixture_id}`);
  assert(plan.acknowledgement_emitted === false, `acknowledgement must not emit: ${result.fixture_id}`);
  assert(plan.write_attempted === false, `write must not occur: ${result.fixture_id}`);
  assert(plan.mutation_attempted === false, `mutation must not occur: ${result.fixture_id}`);

  if (['LIVE', 'PRODUCTION'].includes(plan.environment)) {
    assert(plan.plan_candidate === false, `LIVE/PRODUCTION must be blocked: ${result.fixture_id}`);
    assert(plan.status === 'BLOCKED', `LIVE/PRODUCTION status must be BLOCKED: ${result.fixture_id}`);
  }

  if (['TRAINING', 'TEST'].includes(plan.environment) && plan.fields_present) {
    assert(plan.plan_candidate === true, `TEST/TRAINING with fields may be candidate: ${result.fixture_id}`);
    assert(plan.status === 'PLAN_CANDIDATE_ONLY', `TEST/TRAINING status must be PLAN_CANDIDATE_ONLY: ${result.fixture_id}`);
  }
}

const liveDirect = buildP20InventoryPlan({ environment: 'LIVE' });
assert(liveDirect.plan_candidate === false, 'direct LIVE must be blocked');
assert(liveDirect.live_enabled === false, 'direct LIVE must not enable');
assert(liveDirect.approval_granted === false, 'direct LIVE must not approve');
assert(liveDirect.run_allowed === false, 'direct LIVE must not allow run');
assert(liveDirect.write_attempted === false, 'direct LIVE must not write');
assert(liveDirect.mutation_attempted === false, 'direct LIVE must not mutate');

const trainingDirect = buildP20InventoryPlan({
  plan_id: 'direct-training-plan',
  environment: 'TRAINING',
  gate_id: 'gate',
  source_system: 'INVENTORY',
  source_store_id: 'store',
  target_system: 'SCANOPS',
  plan_gate: 'REQUIRED',
  plan_profile: 'STATIC_PLAN',
});
assert(trainingDirect.plan_candidate === true, 'direct TRAINING may be candidate only');
assert(trainingDirect.live_enabled === false, 'direct TRAINING must not enable LIVE');
assert(trainingDirect.approval_granted === false, 'direct TRAINING must not approve');
assert(trainingDirect.run_allowed === false, 'direct TRAINING must not allow run');
assert(trainingDirect.run_attempted === false, 'direct TRAINING must not run');
assert(trainingDirect.persisted === false, 'direct TRAINING must not persist');
assert(trainingDirect.write_attempted === false, 'direct TRAINING must not write');
assert(trainingDirect.mutation_attempted === false, 'direct TRAINING must not mutate');

const missingDirect = buildP20InventoryPlan({ environment: 'TRAINING' });
assert(missingDirect.plan_candidate === false, 'missing fields must block candidate');
assert(missingDirect.fields_present === false, 'missing fields must be detected');

const status = getP20InventoryStatus();
assert(status.passed === true, 'status must pass');
assert(status.fixture_count === 6, 'status fixture count must match');

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('P20 Inventory plan candidate remains LIVE/PRODUCTION-blocked, TEST/TRAINING candidate-only, LIVE not enabled, approval not granted, no run, not persisted, non-receipting, non-acknowledging, non-writable, and non-mutating.');
