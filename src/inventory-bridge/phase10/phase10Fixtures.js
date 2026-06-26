export const INVENTORY_PHASE10 = '10A/10C';
export const INVENTORY_PHASE10_COMPONENT = 'inventory_phase10_review_check';

export const INVENTORY_PHASE10_STATUS = Object.freeze({
  READY: 'REVIEW_READY',
  BLOCKED: 'BLOCKED',
});

export const INVENTORY_PHASE10_REQUIRED_FIELDS = Object.freeze([
  'review_id',
  'environment',
  'evidence_id',
  'evidence_key',
  'source_system',
  'source_device_id',
  'source_store_id',
  'target_system',
  'review_gate',
  'review_profile',
]);

const BASE = Object.freeze({
  review_id: 'inventory-phase10-review',
  evidence_id: 'evidence-placeholder',
  evidence_key: 'evidence-key-placeholder',
  source_system: 'SCANOPS',
  source_device_id: 'scanops-device-placeholder',
  source_store_id: 'store-placeholder',
  target_system: 'INVENTORY',
  review_gate: 'REQUIRED',
  review_profile: 'STRICT_STATIC_REVIEW',
});

function freezeFixture(fixture) {
  return Object.freeze({
    ...fixture,
    descriptor: Object.freeze({ ...fixture.descriptor }),
    expected: Object.freeze({ ...fixture.expected }),
  });
}

export const INVENTORY_PHASE10_FIXTURES = Object.freeze([
  freezeFixture({
    fixture_id: 'live_blocked',
    descriptor: { ...BASE, review_id: 'inventory-phase10-live', environment: 'LIVE' },
    expected: { environment: 'LIVE', status: INVENTORY_PHASE10_STATUS.BLOCKED, ready: false, fields_present: true, live_blocked: true },
  }),
  freezeFixture({
    fixture_id: 'training_ready',
    descriptor: { ...BASE, review_id: 'inventory-phase10-training', environment: 'TRAINING' },
    expected: { environment: 'TRAINING', status: INVENTORY_PHASE10_STATUS.READY, ready: true, fields_present: true, live_blocked: false },
  }),
  freezeFixture({
    fixture_id: 'test_ready',
    descriptor: { ...BASE, review_id: 'inventory-phase10-test', environment: 'TEST' },
    expected: { environment: 'TEST', status: INVENTORY_PHASE10_STATUS.READY, ready: true, fields_present: true, live_blocked: false },
  }),
  freezeFixture({
    fixture_id: 'missing_field_blocked',
    descriptor: { ...BASE, review_id: 'inventory-phase10-missing', environment: 'TRAINING', evidence_key: '' },
    expected: { environment: 'TRAINING', status: INVENTORY_PHASE10_STATUS.BLOCKED, ready: false, fields_present: false, live_blocked: false },
  }),
]);
