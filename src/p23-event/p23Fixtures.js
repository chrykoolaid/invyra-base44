export const P23_INV = '23A/23C';

export const P23_INV_STATUS = Object.freeze({
  CANDIDATE: 'EVENT_TEST_CANDIDATE_ONLY',
  BLOCKED: 'BLOCKED',
});

export const P23_INV_FIELDS = Object.freeze([
  'event_test_id',
  'environment',
  'link_id',
  'device_id',
  'event_id',
  'event_type',
  'source_system',
  'source_store_id',
  'target_system',
  'visibility_mode',
  'audit_scope',
]);

const BASE = Object.freeze({
  event_test_id: 'inventory-p23-event-test',
  link_id: 'inventory-p22-link',
  device_id: 'device-placeholder',
  event_id: 'event-placeholder',
  event_type: 'READ_ONLY_VISIBILITY_CHECK',
  source_system: 'INVENTORY',
  source_store_id: 'store-placeholder',
  target_system: 'SCANOPS',
  visibility_mode: 'READ_ONLY',
  audit_scope: 'STATIC_AUDIT_CANDIDATE',
});

function freezeFixture(fixture) {
  return Object.freeze({ ...fixture, descriptor: Object.freeze({ ...fixture.descriptor }), expected: Object.freeze({ ...fixture.expected }) });
}

export const P23_INV_FIXTURES = Object.freeze([
  freezeFixture({ fixture_id: 'live_blocked', descriptor: { ...BASE, event_test_id: 'inventory-p23-live', environment: 'LIVE' }, expected: { environment: 'LIVE', status: P23_INV_STATUS.BLOCKED, event_candidate: false, fields_present: true } }),
  freezeFixture({ fixture_id: 'production_blocked', descriptor: { ...BASE, event_test_id: 'inventory-p23-production', environment: 'PRODUCTION' }, expected: { environment: 'PRODUCTION', status: P23_INV_STATUS.BLOCKED, event_candidate: false, fields_present: true } }),
  freezeFixture({ fixture_id: 'training_candidate', descriptor: { ...BASE, event_test_id: 'inventory-p23-training', environment: 'TRAINING' }, expected: { environment: 'TRAINING', status: P23_INV_STATUS.CANDIDATE, event_candidate: true, fields_present: true } }),
  freezeFixture({ fixture_id: 'test_candidate', descriptor: { ...BASE, event_test_id: 'inventory-p23-test', environment: 'TEST' }, expected: { environment: 'TEST', status: P23_INV_STATUS.CANDIDATE, event_candidate: true, fields_present: true } }),
  freezeFixture({ fixture_id: 'missing_field_blocked', descriptor: { ...BASE, event_test_id: 'inventory-p23-missing', environment: 'TRAINING', event_id: '' }, expected: { environment: 'TRAINING', status: P23_INV_STATUS.BLOCKED, event_candidate: false, fields_present: false } }),
  freezeFixture({ fixture_id: 'unknown_blocked', descriptor: { ...BASE, event_test_id: 'inventory-p23-unknown', environment: 'UNKNOWN' }, expected: { environment: 'UNKNOWN', status: P23_INV_STATUS.BLOCKED, event_candidate: false, fields_present: true } }),
]);
