export const P20_INV = '20A/20C';

export const P20_INV_STATUS = Object.freeze({
  CANDIDATE: 'PLAN_CANDIDATE_ONLY',
  BLOCKED: 'BLOCKED',
});

export const P20_INV_FIELDS = Object.freeze([
  'plan_id',
  'environment',
  'gate_id',
  'source_system',
  'source_store_id',
  'target_system',
  'plan_gate',
  'plan_profile',
]);

const BASE = Object.freeze({
  plan_id: 'inventory-p20-plan',
  gate_id: 'inventory-p19-gate',
  source_system: 'INVENTORY',
  source_store_id: 'store-placeholder',
  target_system: 'SCANOPS',
  plan_gate: 'REQUIRED',
  plan_profile: 'STATIC_PLAN',
});

function freezeFixture(fixture) {
  return Object.freeze({ ...fixture, descriptor: Object.freeze({ ...fixture.descriptor }), expected: Object.freeze({ ...fixture.expected }) });
}

export const P20_INV_FIXTURES = Object.freeze([
  freezeFixture({ fixture_id: 'live_blocked', descriptor: { ...BASE, plan_id: 'inventory-p20-live', environment: 'LIVE' }, expected: { environment: 'LIVE', status: P20_INV_STATUS.BLOCKED, plan_candidate: false, fields_present: true } }),
  freezeFixture({ fixture_id: 'production_blocked', descriptor: { ...BASE, plan_id: 'inventory-p20-production', environment: 'PRODUCTION' }, expected: { environment: 'PRODUCTION', status: P20_INV_STATUS.BLOCKED, plan_candidate: false, fields_present: true } }),
  freezeFixture({ fixture_id: 'training_candidate', descriptor: { ...BASE, plan_id: 'inventory-p20-training', environment: 'TRAINING' }, expected: { environment: 'TRAINING', status: P20_INV_STATUS.CANDIDATE, plan_candidate: true, fields_present: true } }),
  freezeFixture({ fixture_id: 'test_candidate', descriptor: { ...BASE, plan_id: 'inventory-p20-test', environment: 'TEST' }, expected: { environment: 'TEST', status: P20_INV_STATUS.CANDIDATE, plan_candidate: true, fields_present: true } }),
  freezeFixture({ fixture_id: 'missing_field_blocked', descriptor: { ...BASE, plan_id: 'inventory-p20-missing', environment: 'TRAINING', plan_profile: '' }, expected: { environment: 'TRAINING', status: P20_INV_STATUS.BLOCKED, plan_candidate: false, fields_present: false } }),
  freezeFixture({ fixture_id: 'unknown_blocked', descriptor: { ...BASE, plan_id: 'inventory-p20-unknown', environment: 'UNKNOWN' }, expected: { environment: 'UNKNOWN', status: P20_INV_STATUS.BLOCKED, plan_candidate: false, fields_present: true } }),
]);
