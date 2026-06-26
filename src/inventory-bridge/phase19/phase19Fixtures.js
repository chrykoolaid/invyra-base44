export const INVENTORY_PHASE19 = '19A/19C';
export const INVENTORY_PHASE19_COMPONENT = 'inventory_phase19_readiness_gate_candidate';

export const INVENTORY_PHASE19_STATUS = Object.freeze({
  CANDIDATE: 'READINESS_GATE_CANDIDATE_ONLY',
  BLOCKED: 'BLOCKED',
});

export const INVENTORY_PHASE19_REQUIRED_FIELDS = Object.freeze([
  'gate_id',
  'environment',
  'acceptance_id',
  'recovery_id',
  'response_id',
  'review_id',
  'event_id',
  'source_system',
  'source_store_id',
  'target_system',
  'readiness_gate',
  'readiness_profile',
]);

const BASE = Object.freeze({
  gate_id: 'inventory-phase19-readiness',
  acceptance_id: 'inventory-phase18-acceptance',
  recovery_id: 'inventory-phase17-recovery',
  response_id: 'inventory-phase16-response',
  review_id: 'inventory-phase15-review',
  event_id: 'scanops-phase14-event',
  source_system: 'INVENTORY',
  source_store_id: 'store-placeholder',
  target_system: 'SCANOPS',
  readiness_gate: 'REQUIRED',
  readiness_profile: 'STRICT_STATIC_READINESS',
});

function freezeFixture(fixture) {
  return Object.freeze({ ...fixture, descriptor: Object.freeze({ ...fixture.descriptor }), expected: Object.freeze({ ...fixture.expected }) });
}

export const INVENTORY_PHASE19_FIXTURES = Object.freeze([
  freezeFixture({ fixture_id: 'live_blocked', descriptor: { ...BASE, gate_id: 'inventory-phase19-live', environment: 'LIVE' }, expected: { environment: 'LIVE', status: INVENTORY_PHASE19_STATUS.BLOCKED, readiness_candidate: false, fields_present: true, live_blocked: true } }),
  freezeFixture({ fixture_id: 'production_blocked', descriptor: { ...BASE, gate_id: 'inventory-phase19-production', environment: 'PRODUCTION' }, expected: { environment: 'PRODUCTION', status: INVENTORY_PHASE19_STATUS.BLOCKED, readiness_candidate: false, fields_present: true, live_blocked: true } }),
  freezeFixture({ fixture_id: 'training_candidate', descriptor: { ...BASE, gate_id: 'inventory-phase19-training', environment: 'TRAINING' }, expected: { environment: 'TRAINING', status: INVENTORY_PHASE19_STATUS.CANDIDATE, readiness_candidate: true, fields_present: true, live_blocked: false } }),
  freezeFixture({ fixture_id: 'test_candidate', descriptor: { ...BASE, gate_id: 'inventory-phase19-test', environment: 'TEST' }, expected: { environment: 'TEST', status: INVENTORY_PHASE19_STATUS.CANDIDATE, readiness_candidate: true, fields_present: true, live_blocked: false } }),
  freezeFixture({ fixture_id: 'missing_field_blocked', descriptor: { ...BASE, gate_id: 'inventory-phase19-missing', environment: 'TRAINING', readiness_profile: '' }, expected: { environment: 'TRAINING', status: INVENTORY_PHASE19_STATUS.BLOCKED, readiness_candidate: false, fields_present: false, live_blocked: false } }),
  freezeFixture({ fixture_id: 'unknown_blocked', descriptor: { ...BASE, gate_id: 'inventory-phase19-unknown', environment: 'UNKNOWN' }, expected: { environment: 'UNKNOWN', status: INVENTORY_PHASE19_STATUS.BLOCKED, readiness_candidate: false, fields_present: true, live_blocked: false } }),
]);
