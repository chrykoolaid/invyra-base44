export const INVENTORY_PHASE16 = '16A/16C';
export const INVENTORY_PHASE16_COMPONENT = 'inventory_phase16_response_candidate';

export const INVENTORY_PHASE16_STATUS = Object.freeze({
  CANDIDATE: 'RESPONSE_CANDIDATE_ONLY',
  BLOCKED: 'BLOCKED',
});

export const INVENTORY_PHASE16_REQUIRED_FIELDS = Object.freeze([
  'response_id',
  'environment',
  'review_id',
  'event_id',
  'event_key',
  'source_system',
  'source_device_id',
  'source_store_id',
  'target_system',
  'response_gate',
  'response_profile',
]);

const BASE = Object.freeze({
  response_id: 'inventory-phase16-response',
  review_id: 'inventory-phase15-review',
  event_id: 'scanops-phase14-event',
  event_key: 'event-key-placeholder',
  source_system: 'INVENTORY',
  source_device_id: 'inventory-desktop-placeholder',
  source_store_id: 'store-placeholder',
  target_system: 'SCANOPS',
  response_gate: 'REQUIRED',
  response_profile: 'STRICT_STATIC_RESPONSE',
});

function freezeFixture(fixture) {
  return Object.freeze({ ...fixture, descriptor: Object.freeze({ ...fixture.descriptor }), expected: Object.freeze({ ...fixture.expected }) });
}

export const INVENTORY_PHASE16_FIXTURES = Object.freeze([
  freezeFixture({ fixture_id: 'live_blocked', descriptor: { ...BASE, response_id: 'inventory-phase16-live', environment: 'LIVE' }, expected: { environment: 'LIVE', status: INVENTORY_PHASE16_STATUS.BLOCKED, response_candidate: false, fields_present: true, live_blocked: true } }),
  freezeFixture({ fixture_id: 'production_blocked', descriptor: { ...BASE, response_id: 'inventory-phase16-production', environment: 'PRODUCTION' }, expected: { environment: 'PRODUCTION', status: INVENTORY_PHASE16_STATUS.BLOCKED, response_candidate: false, fields_present: true, live_blocked: true } }),
  freezeFixture({ fixture_id: 'training_candidate', descriptor: { ...BASE, response_id: 'inventory-phase16-training', environment: 'TRAINING' }, expected: { environment: 'TRAINING', status: INVENTORY_PHASE16_STATUS.CANDIDATE, response_candidate: true, fields_present: true, live_blocked: false } }),
  freezeFixture({ fixture_id: 'test_candidate', descriptor: { ...BASE, response_id: 'inventory-phase16-test', environment: 'TEST' }, expected: { environment: 'TEST', status: INVENTORY_PHASE16_STATUS.CANDIDATE, response_candidate: true, fields_present: true, live_blocked: false } }),
  freezeFixture({ fixture_id: 'missing_field_blocked', descriptor: { ...BASE, response_id: 'inventory-phase16-missing', environment: 'TRAINING', event_key: '' }, expected: { environment: 'TRAINING', status: INVENTORY_PHASE16_STATUS.BLOCKED, response_candidate: false, fields_present: false, live_blocked: false } }),
  freezeFixture({ fixture_id: 'unknown_blocked', descriptor: { ...BASE, response_id: 'inventory-phase16-unknown', environment: 'UNKNOWN' }, expected: { environment: 'UNKNOWN', status: INVENTORY_PHASE16_STATUS.BLOCKED, response_candidate: false, fields_present: true, live_blocked: false } }),
]);
