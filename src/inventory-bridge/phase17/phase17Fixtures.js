export const INVENTORY_PHASE17 = '17A/17C';
export const INVENTORY_PHASE17_COMPONENT = 'inventory_phase17_recovery_candidate';

export const INVENTORY_PHASE17_STATUS = Object.freeze({
  CANDIDATE: 'RECOVERY_CANDIDATE_ONLY',
  BLOCKED: 'BLOCKED',
});

export const INVENTORY_PHASE17_REQUIRED_FIELDS = Object.freeze([
  'recovery_id',
  'environment',
  'response_id',
  'review_id',
  'event_id',
  'event_key',
  'source_system',
  'source_store_id',
  'target_system',
  'failure_code',
  'recovery_gate',
  'recovery_profile',
]);

const BASE = Object.freeze({
  recovery_id: 'inventory-phase17-recovery',
  response_id: 'inventory-phase16-response',
  review_id: 'inventory-phase15-review',
  event_id: 'scanops-phase14-event',
  event_key: 'event-key-placeholder',
  source_system: 'INVENTORY',
  source_store_id: 'store-placeholder',
  target_system: 'SCANOPS',
  failure_code: 'STATIC_TEST_FAILURE',
  recovery_gate: 'REQUIRED',
  recovery_profile: 'STRICT_STATIC_RECOVERY',
});

function freezeFixture(fixture) {
  return Object.freeze({ ...fixture, descriptor: Object.freeze({ ...fixture.descriptor }), expected: Object.freeze({ ...fixture.expected }) });
}

export const INVENTORY_PHASE17_FIXTURES = Object.freeze([
  freezeFixture({ fixture_id: 'live_blocked', descriptor: { ...BASE, recovery_id: 'inventory-phase17-live', environment: 'LIVE' }, expected: { environment: 'LIVE', status: INVENTORY_PHASE17_STATUS.BLOCKED, recovery_candidate: false, fields_present: true, live_blocked: true } }),
  freezeFixture({ fixture_id: 'production_blocked', descriptor: { ...BASE, recovery_id: 'inventory-phase17-production', environment: 'PRODUCTION' }, expected: { environment: 'PRODUCTION', status: INVENTORY_PHASE17_STATUS.BLOCKED, recovery_candidate: false, fields_present: true, live_blocked: true } }),
  freezeFixture({ fixture_id: 'training_candidate', descriptor: { ...BASE, recovery_id: 'inventory-phase17-training', environment: 'TRAINING' }, expected: { environment: 'TRAINING', status: INVENTORY_PHASE17_STATUS.CANDIDATE, recovery_candidate: true, fields_present: true, live_blocked: false } }),
  freezeFixture({ fixture_id: 'test_candidate', descriptor: { ...BASE, recovery_id: 'inventory-phase17-test', environment: 'TEST' }, expected: { environment: 'TEST', status: INVENTORY_PHASE17_STATUS.CANDIDATE, recovery_candidate: true, fields_present: true, live_blocked: false } }),
  freezeFixture({ fixture_id: 'missing_field_blocked', descriptor: { ...BASE, recovery_id: 'inventory-phase17-missing', environment: 'TRAINING', failure_code: '' }, expected: { environment: 'TRAINING', status: INVENTORY_PHASE17_STATUS.BLOCKED, recovery_candidate: false, fields_present: false, live_blocked: false } }),
  freezeFixture({ fixture_id: 'unknown_blocked', descriptor: { ...BASE, recovery_id: 'inventory-phase17-unknown', environment: 'UNKNOWN' }, expected: { environment: 'UNKNOWN', status: INVENTORY_PHASE17_STATUS.BLOCKED, recovery_candidate: false, fields_present: true, live_blocked: false } }),
]);
