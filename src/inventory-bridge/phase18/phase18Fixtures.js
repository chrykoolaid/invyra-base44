export const INVENTORY_PHASE18 = '18A/18C';
export const INVENTORY_PHASE18_COMPONENT = 'inventory_phase18_acceptance_candidate';

export const INVENTORY_PHASE18_STATUS = Object.freeze({
  CANDIDATE: 'ACCEPTANCE_CANDIDATE_ONLY',
  BLOCKED: 'BLOCKED',
});

export const INVENTORY_PHASE18_REQUIRED_FIELDS = Object.freeze([
  'acceptance_id',
  'environment',
  'recovery_id',
  'response_id',
  'review_id',
  'event_id',
  'event_key',
  'source_system',
  'source_store_id',
  'target_system',
  'acceptance_gate',
  'acceptance_profile',
]);

const BASE = Object.freeze({
  acceptance_id: 'inventory-phase18-acceptance',
  recovery_id: 'inventory-phase17-recovery',
  response_id: 'inventory-phase16-response',
  review_id: 'inventory-phase15-review',
  event_id: 'scanops-phase14-event',
  event_key: 'event-key-placeholder',
  source_system: 'INVENTORY',
  source_store_id: 'store-placeholder',
  target_system: 'SCANOPS',
  acceptance_gate: 'REQUIRED',
  acceptance_profile: 'STRICT_STATIC_ACCEPTANCE',
});

function freezeFixture(fixture) {
  return Object.freeze({ ...fixture, descriptor: Object.freeze({ ...fixture.descriptor }), expected: Object.freeze({ ...fixture.expected }) });
}

export const INVENTORY_PHASE18_FIXTURES = Object.freeze([
  freezeFixture({ fixture_id: 'live_blocked', descriptor: { ...BASE, acceptance_id: 'inventory-phase18-live', environment: 'LIVE' }, expected: { environment: 'LIVE', status: INVENTORY_PHASE18_STATUS.BLOCKED, acceptance_candidate: false, fields_present: true, live_blocked: true } }),
  freezeFixture({ fixture_id: 'production_blocked', descriptor: { ...BASE, acceptance_id: 'inventory-phase18-production', environment: 'PRODUCTION' }, expected: { environment: 'PRODUCTION', status: INVENTORY_PHASE18_STATUS.BLOCKED, acceptance_candidate: false, fields_present: true, live_blocked: true } }),
  freezeFixture({ fixture_id: 'training_candidate', descriptor: { ...BASE, acceptance_id: 'inventory-phase18-training', environment: 'TRAINING' }, expected: { environment: 'TRAINING', status: INVENTORY_PHASE18_STATUS.CANDIDATE, acceptance_candidate: true, fields_present: true, live_blocked: false } }),
  freezeFixture({ fixture_id: 'test_candidate', descriptor: { ...BASE, acceptance_id: 'inventory-phase18-test', environment: 'TEST' }, expected: { environment: 'TEST', status: INVENTORY_PHASE18_STATUS.CANDIDATE, acceptance_candidate: true, fields_present: true, live_blocked: false } }),
  freezeFixture({ fixture_id: 'missing_field_blocked', descriptor: { ...BASE, acceptance_id: 'inventory-phase18-missing', environment: 'TRAINING', acceptance_profile: '' }, expected: { environment: 'TRAINING', status: INVENTORY_PHASE18_STATUS.BLOCKED, acceptance_candidate: false, fields_present: false, live_blocked: false } }),
  freezeFixture({ fixture_id: 'unknown_blocked', descriptor: { ...BASE, acceptance_id: 'inventory-phase18-unknown', environment: 'UNKNOWN' }, expected: { environment: 'UNKNOWN', status: INVENTORY_PHASE18_STATUS.BLOCKED, acceptance_candidate: false, fields_present: true, live_blocked: false } }),
]);
