export const INVENTORY_PHASE20 = '20A/20C';
export const INVENTORY_PHASE20_COMPONENT = 'inventory_phase20_plan_candidate';

export const INVENTORY_PHASE20_STATUS = Object.freeze({
  CANDIDATE: 'PLAN_CANDIDATE_ONLY',
  BLOCKED: 'BLOCKED',
});

export const INVENTORY_PHASE20_REQUIRED_FIELDS = Object.freeze([
  'plan_id',
  'environment',
  'gate_id',
  'acceptance_id',
  'recovery_id',
  'response_id',
  'source_system',
  'source_store_id',
  'target_system',
  'plan_gate',
  'plan_profile',
  'approval_state',
]);

const BASE = Object.freeze({
  plan_id: 'inventory-phase20-plan',
  gate_id: 'inventory-phase19-readiness',
  acceptance_id: 'inventory-phase18-acceptance',
  recovery_id: 'inventory-phase17-recovery',
  response_id: 'inventory-phase16-response',
  source_system: 'INVENTORY',
  source_store_id: 'store-placeholder',
  target_system: 'SCANOPS',
  plan_gate: 'REQUIRED',
  plan_profile: 'STRICT_STATIC_PLAN',
  approval_state: 'PLANNING_ONLY',
});

function freezeFixture(fixture) {
  return Object.freeze({ ...fixture, descriptor: Object.freeze({ ...fixture.descriptor }), expected: Object.freeze({ ...fixture.expected }) });
}

export const INVENTORY_PHASE20_FIXTURES = Object.freeze([
  freezeFixture({ fixture_id: 'live_blocked', descriptor: { ...BASE, plan_id: 'inventory-phase20-live', environment: 'LIVE' }, expected: { environment: 'LIVE', status: INVENTORY_PHASE20_STATUS.BLOCKED, plan_candidate: false, fields_present: true, live_blocked: true } }),
  freezeFixture({ fixture_id: 'production_blocked', descriptor: { ...BASE, plan_id: 'inventory-phase20-production', environment: 'PRODUCTION' }, expected: { environment: 'PRODUCTION', status: INVENTORY_PHASE20_STATUS.BLOCKED, plan_candidate: false, fields_present: true, live_blocked: true } }),
  freezeFixture({ fixture_id: 'training_candidate', descriptor: { ...BASE, plan_id: 'inventory-phase20-training', environment: 'TRAINING' }, expected: { environment: 'TRAINING', status: INVENTORY_PHASE20_STATUS.CANDIDATE, plan_candidate: true, fields_present: true, live_blocked: false } }),
  freezeFixture({ fixture_id: 'test_candidate', descriptor: { ...BASE, plan_id: 'inventory-phase20-test', environment: 'TEST' }, expected: { environment: 'TEST', status: INVENTORY_PHASE20_STATUS.CANDIDATE, plan_candidate: true, fields_present: true, live_blocked: false } }),
  freezeFixture({ fixture_id: 'missing_field_blocked', descriptor: { ...BASE, plan_id: 'inventory-phase20-missing', environment: 'TRAINING', approval_state: '' }, expected: { environment: 'TRAINING', status: INVENTORY_PHASE20_STATUS.BLOCKED, plan_candidate: false, fields_present: false, live_blocked: false } }),
  freezeFixture({ fixture_id: 'unknown_blocked', descriptor: { ...BASE, plan_id: 'inventory-phase20-unknown', environment: 'UNKNOWN' }, expected: { environment: 'UNKNOWN', status: INVENTORY_PHASE20_STATUS.BLOCKED, plan_candidate: false, fields_present: true, live_blocked: false } }),
]);
