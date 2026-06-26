export const INVENTORY_PHASE15 = '15A/15C';
export const INVENTORY_PHASE15_COMPONENT = 'inventory_phase15_inbound_review_candidate';

export const INVENTORY_PHASE15_STATUS = Object.freeze({
  CANDIDATE: 'INBOUND_REVIEW_CANDIDATE_ONLY',
  BLOCKED: 'BLOCKED',
});

export const INVENTORY_PHASE15_REQUIRED_FIELDS = Object.freeze([
  'review_id',
  'environment',
  'event_id',
  'event_key',
  'source_system',
  'source_device_id',
  'source_store_id',
  'target_system',
  'event_type',
  'review_gate',
  'review_profile',
]);

const BASE = Object.freeze({
  review_id: 'inventory-phase15-review',
  event_id: 'scanops-phase14-event',
  event_key: 'event-key-placeholder',
  source_system: 'SCANOPS',
  source_device_id: 'scanops-device-placeholder',
  source_store_id: 'store-placeholder',
  target_system: 'INVENTORY',
  event_type: 'STOCK_OBSERVATION_CANDIDATE',
  review_gate: 'REQUIRED',
  review_profile: 'STRICT_STATIC_INBOUND_REVIEW',
});

function freezeFixture(fixture) {
  return Object.freeze({ ...fixture, descriptor: Object.freeze({ ...fixture.descriptor }), expected: Object.freeze({ ...fixture.expected }) });
}

export const INVENTORY_PHASE15_FIXTURES = Object.freeze([
  freezeFixture({ fixture_id: 'live_blocked', descriptor: { ...BASE, review_id: 'inventory-phase15-live', environment: 'LIVE' }, expected: { environment: 'LIVE', status: INVENTORY_PHASE15_STATUS.BLOCKED, review_candidate: false, fields_present: true, live_blocked: true } }),
  freezeFixture({ fixture_id: 'production_blocked', descriptor: { ...BASE, review_id: 'inventory-phase15-production', environment: 'PRODUCTION' }, expected: { environment: 'PRODUCTION', status: INVENTORY_PHASE15_STATUS.BLOCKED, review_candidate: false, fields_present: true, live_blocked: true } }),
  freezeFixture({ fixture_id: 'training_candidate', descriptor: { ...BASE, review_id: 'inventory-phase15-training', environment: 'TRAINING' }, expected: { environment: 'TRAINING', status: INVENTORY_PHASE15_STATUS.CANDIDATE, review_candidate: true, fields_present: true, live_blocked: false } }),
  freezeFixture({ fixture_id: 'test_candidate', descriptor: { ...BASE, review_id: 'inventory-phase15-test', environment: 'TEST' }, expected: { environment: 'TEST', status: INVENTORY_PHASE15_STATUS.CANDIDATE, review_candidate: true, fields_present: true, live_blocked: false } }),
  freezeFixture({ fixture_id: 'missing_field_blocked', descriptor: { ...BASE, review_id: 'inventory-phase15-missing', environment: 'TRAINING', event_key: '' }, expected: { environment: 'TRAINING', status: INVENTORY_PHASE15_STATUS.BLOCKED, review_candidate: false, fields_present: false, live_blocked: false } }),
  freezeFixture({ fixture_id: 'unknown_blocked', descriptor: { ...BASE, review_id: 'inventory-phase15-unknown', environment: 'UNKNOWN' }, expected: { environment: 'UNKNOWN', status: INVENTORY_PHASE15_STATUS.BLOCKED, review_candidate: false, fields_present: true, live_blocked: false } }),
]);
