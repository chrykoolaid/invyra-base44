import { INVENTORY_PHASE20, INVENTORY_PHASE20_FIXTURES } from '../src/inventory-bridge/phase20/phase20Fixtures.js';
import { buildInventoryPhase20Plan, getInventoryPhase20PlanResults } from '../src/inventory-bridge/phase20/phase20Plan.js';
import { getInventoryPhase20Status } from '../src/inventory-bridge/phase20/phase20Status.js';

const errors = [];
function assert(condition, message) { if (!condition) errors.push(message); }

assert(INVENTORY_PHASE20 === '20A/20C', 'phase marker must remain 20A/20C');
assert(Object.isFrozen(INVENTORY_PHASE20_FIXTURES), 'fixtures must be frozen');
assert(INVENTORY_PHASE20_FIXTURES.length === 6, 'expected six fixtures');

const results = getInventoryPhase20PlanResults();
assert(Object.isFrozen(results), 'results must be frozen');

for (const result of results) {
  const { plan } = result;
  assert(result.passed === true, `fixture must pass: ${result.fixture_id}`);
  assert(Object.isFrozen(result), `result must be frozen: ${result.fixture_id}`);
  assert(Object.isFrozen(plan), `plan must be frozen: ${result.fixture_id}`);
  assert(plan.plan_candidate_only === true, `candidate only must stay true: ${result.fixture_id}`);
  assert(plan.inventory_system_of_record === true, `Inventory must stay system of record: ${result.fixture_id}`);
  assert(plan.live_enabled === false, `LIVE must not enable: ${result.fixture_id}`);
  assert(plan.activation_allowed === false, `activation must not be allowed: ${result.fixture_id}`);
  assert(plan.activation_attempted === false, `activation must not be attempted: ${result.fixture_id}`);
  assert(plan.approval_granted === false, `approval must not be granted: ${result.fixture_id}`);
  assert(plan.sync_executed === false, `sync must not execute: ${result.fixture_id}`);
  assert(plan.dispatched === false, `dispatch must not occur: ${result.fixture_id}`);
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

const liveDirect = buildInventoryPhase20Plan({ environment: 'LIVE' });
assert(liveDirect.plan_candidate === false, 'direct LIVE must be blocked');
assert(liveDirect.live_enabled === false, 'direct LIVE must not enable');
assert(liveDirect.activation_allowed === false, 'direct LIVE must not allow activation');
assert(liveDirect.approval_granted === false, 'direct LIVE must not grant approval');
assert(liveDirect.write_attempted === false, 'direct LIVE must not write');
assert(liveDirect.mutation_attempted === false, 'direct LIVE must not mutate');

const trainingDirect = buildInventoryPhase20Plan({
  plan_id: 'direct-training-plan',
  environment: 'TRAINING',
  gate_id: 'gate',
  acceptance_id: 'acceptance',
  recovery_id: 'recovery',
  response_id: 'response',
  source_system: 'INVENTORY',
  source_store_id: 'store',
  target_system: 'SCANOPS',
  plan_gate: 'REQUIRED',
  plan_profile: 'STRICT_STATIC_PLAN',
  approval_state: 'PLANNING_ONLY',
});
assert(trainingDirect.plan_candidate === true, 'direct TRAINING may be candidate only');
assert(trainingDirect.live_enabled === false, 'direct TRAINING must not enable LIVE');
assert(trainingDirect.activation_allowed === false, 'direct TRAINING must not allow activation');
assert(trainingDirect.activation_attempted === false, 'direct TRAINING must not attempt activation');
assert(trainingDirect.approval_granted === false, 'direct TRAINING must not grant approval');
assert(trainingDirect.sync_executed === false, 'direct TRAINING must not execute sync');
assert(trainingDirect.dispatched === false, 'direct TRAINING must not dispatch');
assert(trainingDirect.persisted === false, 'direct TRAINING must not persist');
assert(trainingDirect.write_attempted === false, 'direct TRAINING must not write');
assert(trainingDirect.mutation_attempted === false, 'direct TRAINING must not mutate');

const missingDirect = buildInventoryPhase20Plan({ environment: 'TRAINING' });
assert(missingDirect.plan_candidate === false, 'missing fields must block candidate');
assert(missingDirect.fields_present === false, 'missing fields must be detected');

const status = getInventoryPhase20Status();
assert(status.passed === true, 'status must pass');
assert(status.fixture_count === 6, 'status fixture count must match');

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Inventory Phase 20 plan candidate remains LIVE/PRODUCTION-blocked, TEST/TRAINING candidate-only, LIVE not enabled, activation not allowed, approval not granted, no sync execution, no dispatch, not persisted, non-receipting, non-acknowledging, non-writable, and non-mutating.');
