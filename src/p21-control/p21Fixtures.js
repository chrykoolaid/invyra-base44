export const P21_INV = '21A/21C';

export const P21_INV_STATUS = Object.freeze({
  CANDIDATE: 'CONTROL_GATE_CANDIDATE_ONLY',
  BLOCKED: 'BLOCKED',
});

export const P21_INV_ROLES = Object.freeze(['OWNER', 'ADMIN', 'BRIDGE_ADMIN']);

export const P21_INV_FIELDS = Object.freeze([
  'control_id',
  'environment',
  'plan_id',
  'gate_id',
  'approver_role',
  'approver_id',
  'review_state',
  'source_system',
  'source_store_id',
  'target_system',
]);

const BASE = Object.freeze({
  control_id: 'inventory-p21-control',
  plan_id: 'inventory-p20-plan',
  gate_id: 'inventory-p19-gate',
  approver_role: 'OWNER',
  approver_id: 'future-approver-placeholder',
  review_state: 'DESIGN_ONLY',
  source_system: 'INVENTORY',
  source_store_id: 'store-placeholder',
  target_system: 'SCANOPS',
});

function freezeFixture(fixture) {
  return Object.freeze({ ...fixture, descriptor: Object.freeze({ ...fixture.descriptor }), expected: Object.freeze({ ...fixture.expected }) });
}

export const P21_INV_FIXTURES = Object.freeze([
  freezeFixture({ fixture_id: 'live_blocked', descriptor: { ...BASE, control_id: 'inventory-p21-live', environment: 'LIVE' }, expected: { environment: 'LIVE', status: P21_INV_STATUS.BLOCKED, control_candidate: false, fields_present: true, role_allowed: true } }),
  freezeFixture({ fixture_id: 'production_blocked', descriptor: { ...BASE, control_id: 'inventory-p21-production', environment: 'PRODUCTION' }, expected: { environment: 'PRODUCTION', status: P21_INV_STATUS.BLOCKED, control_candidate: false, fields_present: true, role_allowed: true } }),
  freezeFixture({ fixture_id: 'training_candidate', descriptor: { ...BASE, control_id: 'inventory-p21-training', environment: 'TRAINING' }, expected: { environment: 'TRAINING', status: P21_INV_STATUS.CANDIDATE, control_candidate: true, fields_present: true, role_allowed: true } }),
  freezeFixture({ fixture_id: 'test_candidate', descriptor: { ...BASE, control_id: 'inventory-p21-test', environment: 'TEST' }, expected: { environment: 'TEST', status: P21_INV_STATUS.CANDIDATE, control_candidate: true, fields_present: true, role_allowed: true } }),
  freezeFixture({ fixture_id: 'missing_field_blocked', descriptor: { ...BASE, control_id: 'inventory-p21-missing', environment: 'TRAINING', approver_id: '' }, expected: { environment: 'TRAINING', status: P21_INV_STATUS.BLOCKED, control_candidate: false, fields_present: false, role_allowed: true } }),
  freezeFixture({ fixture_id: 'unknown_blocked', descriptor: { ...BASE, control_id: 'inventory-p21-unknown', environment: 'UNKNOWN' }, expected: { environment: 'UNKNOWN', status: P21_INV_STATUS.BLOCKED, control_candidate: false, fields_present: true, role_allowed: true } }),
]);
