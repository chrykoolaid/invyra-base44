import { P21_INV, P21_INV_FIXTURES } from '../src/p21-control/p21Fixtures.js';
import { buildP21InventoryControl, getP21InventoryControlResults } from '../src/p21-control/p21Control.js';
import { getP21InventoryStatus } from '../src/p21-control/p21Status.js';

const errors = [];
function assert(condition, message) { if (!condition) errors.push(message); }

assert(P21_INV === '21A/21C', 'phase marker must remain 21A/21C');
assert(Object.isFrozen(P21_INV_FIXTURES), 'fixtures must be frozen');
assert(P21_INV_FIXTURES.length === 6, 'expected six fixtures');

const results = getP21InventoryControlResults();
assert(Object.isFrozen(results), 'results must be frozen');

for (const result of results) {
  const { control } = result;
  assert(result.passed === true, `fixture must pass: ${result.fixture_id}`);
  assert(Object.isFrozen(result), `result must be frozen: ${result.fixture_id}`);
  assert(Object.isFrozen(control), `control must be frozen: ${result.fixture_id}`);
  assert(control.control_candidate_only === true, `candidate only must stay true: ${result.fixture_id}`);
  assert(control.inventory_system_of_record === true, `Inventory must stay record owner: ${result.fixture_id}`);
  assert(control.approval_granted === false, `approval must not be granted: ${result.fixture_id}`);
  assert(control.run_allowed === false, `run must not be allowed: ${result.fixture_id}`);
  assert(control.run_attempted === false, `run must not be attempted: ${result.fixture_id}`);
  assert(control.completed === false, `completion must not occur: ${result.fixture_id}`);
  assert(control.persisted === false, `persistence must not occur: ${result.fixture_id}`);
  assert(control.receipt_emitted === false, `receipt must not emit: ${result.fixture_id}`);
  assert(control.acknowledgement_emitted === false, `acknowledgement must not emit: ${result.fixture_id}`);
  assert(control.write_attempted === false, `write must not occur: ${result.fixture_id}`);
  assert(control.mutation_attempted === false, `mutation must not occur: ${result.fixture_id}`);

  if (['LIVE', 'PRODUCTION'].includes(control.environment)) {
    assert(control.control_candidate === false, `LIVE/PRODUCTION must be blocked: ${result.fixture_id}`);
    assert(control.status === 'BLOCKED', `LIVE/PRODUCTION status must be BLOCKED: ${result.fixture_id}`);
  }

  if (['TRAINING', 'TEST'].includes(control.environment) && control.fields_present && control.role_allowed) {
    assert(control.control_candidate === true, `TEST/TRAINING with valid fields may be candidate: ${result.fixture_id}`);
    assert(control.status === 'CONTROL_GATE_CANDIDATE_ONLY', `TEST/TRAINING status must be CONTROL_GATE_CANDIDATE_ONLY: ${result.fixture_id}`);
  }
}

const liveDirect = buildP21InventoryControl({ environment: 'LIVE' });
assert(liveDirect.control_candidate === false, 'direct LIVE must be blocked');
assert(liveDirect.approval_granted === false, 'direct LIVE must not approve');
assert(liveDirect.run_allowed === false, 'direct LIVE must not allow run');
assert(liveDirect.write_attempted === false, 'direct LIVE must not write');
assert(liveDirect.mutation_attempted === false, 'direct LIVE must not mutate');

const trainingDirect = buildP21InventoryControl({
  control_id: 'direct-training-control',
  environment: 'TRAINING',
  plan_id: 'plan',
  gate_id: 'gate',
  approver_role: 'OWNER',
  approver_id: 'owner-placeholder',
  review_state: 'DESIGN_ONLY',
  source_system: 'INVENTORY',
  source_store_id: 'store',
  target_system: 'SCANOPS',
});
assert(trainingDirect.control_candidate === true, 'direct TRAINING may be candidate only');
assert(trainingDirect.approval_granted === false, 'direct TRAINING must not approve');
assert(trainingDirect.run_allowed === false, 'direct TRAINING must not allow run');
assert(trainingDirect.run_attempted === false, 'direct TRAINING must not run');
assert(trainingDirect.persisted === false, 'direct TRAINING must not persist');
assert(trainingDirect.write_attempted === false, 'direct TRAINING must not write');
assert(trainingDirect.mutation_attempted === false, 'direct TRAINING must not mutate');

const invalidRole = buildP21InventoryControl({ ...trainingDirect.descriptor, approver_role: 'STAFF' });
assert(invalidRole.control_candidate === false, 'invalid role must block candidate');
assert(invalidRole.role_allowed === false, 'invalid role must be detected');

const missingDirect = buildP21InventoryControl({ environment: 'TRAINING' });
assert(missingDirect.control_candidate === false, 'missing fields must block candidate');
assert(missingDirect.fields_present === false, 'missing fields must be detected');

const status = getP21InventoryStatus();
assert(status.passed === true, 'status must pass');
assert(status.fixture_count === 6, 'status fixture count must match');

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('P21 Inventory control gate remains LIVE/PRODUCTION-blocked, TEST/TRAINING candidate-only, role-limited, approval not granted, no run, not persisted, non-receipting, non-acknowledging, non-writable, and non-mutating.');
