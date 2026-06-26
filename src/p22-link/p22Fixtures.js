export const P22_INV = '22A/22C';

export const P22_INV_STATUS = Object.freeze({
  CANDIDATE: 'LINK_TEST_CANDIDATE_ONLY',
  BLOCKED: 'BLOCKED',
});

export const P22_INV_FIELDS = Object.freeze([
  'link_id',
  'environment',
  'control_id',
  'pairing_id',
  'device_id',
  'source_system',
  'source_store_id',
  'target_system',
  'visibility_mode',
  'test_scope',
]);

const BASE = Object.freeze({
  link_id: 'inventory-p22-link',
  control_id: 'inventory-p21-control',
  pairing_id: 'pairing-placeholder',
  device_id: 'device-placeholder',
  source_system: 'INVENTORY',
  source_store_id: 'store-placeholder',
  target_system: 'SCANOPS',
  visibility_mode: 'READ_ONLY',
  test_scope: 'PAIRING_LINK_CANDIDATE',
});

function freezeFixture(fixture) {
  return Object.freeze({ ...fixture, descriptor: Object.freeze({ ...fixture.descriptor }), expected: Object.freeze({ ...fixture.expected }) });
}

export const P22_INV_FIXTURES = Object.freeze([
  freezeFixture({ fixture_id: 'live_blocked', descriptor: { ...BASE, link_id: 'inventory-p22-live', environment: 'LIVE' }, expected: { environment: 'LIVE', status: P22_INV_STATUS.BLOCKED, link_candidate: false, fields_present: true } }),
  freezeFixture({ fixture_id: 'production_blocked', descriptor: { ...BASE, link_id: 'inventory-p22-production', environment: 'PRODUCTION' }, expected: { environment: 'PRODUCTION', status: P22_INV_STATUS.BLOCKED, link_candidate: false, fields_present: true } }),
  freezeFixture({ fixture_id: 'training_candidate', descriptor: { ...BASE, link_id: 'inventory-p22-training', environment: 'TRAINING' }, expected: { environment: 'TRAINING', status: P22_INV_STATUS.CANDIDATE, link_candidate: true, fields_present: true } }),
  freezeFixture({ fixture_id: 'test_candidate', descriptor: { ...BASE, link_id: 'inventory-p22-test', environment: 'TEST' }, expected: { environment: 'TEST', status: P22_INV_STATUS.CANDIDATE, link_candidate: true, fields_present: true } }),
  freezeFixture({ fixture_id: 'missing_field_blocked', descriptor: { ...BASE, link_id: 'inventory-p22-missing', environment: 'TRAINING', device_id: '' }, expected: { environment: 'TRAINING', status: P22_INV_STATUS.BLOCKED, link_candidate: false, fields_present: false } }),
  freezeFixture({ fixture_id: 'unknown_blocked', descriptor: { ...BASE, link_id: 'inventory-p22-unknown', environment: 'UNKNOWN' }, expected: { environment: 'UNKNOWN', status: P22_INV_STATUS.BLOCKED, link_candidate: false, fields_present: true } }),
]);
