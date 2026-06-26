export const INVENTORY_PHASE14 = '14A/14C';
export const INVENTORY_PHASE14_COMPONENT = 'inventory_phase14_outbound_event_candidate';

export const INVENTORY_PHASE14_STATUS = Object.freeze({
  CANDIDATE: 'OUTBOUND_EVENT_CANDIDATE_ONLY',
  BLOCKED: 'BLOCKED',
});

export const INVENTORY_PHASE14_REQUIRED_FIELDS = Object.freeze([
  'event_id',
  'environment',
  'handshake_id',
  'handshake_key',
  'runner_id',
  'source_system',
  'source_device_id',
  'source_store_id',
  'target_system',
  'event_type',
  'event_gate',
  'event_profile',
]);

const BASE = Object.freeze({
  event_id: 'inventory-phase14-event',
  handshake_id: 'inventory-phase13-handshake',
  handshake_key: 'handshake-key-placeholder',
  runner_id: 'inventory-phase12-runner',
  source_system: 'SCANOPS',
  source_device_id: 'scanops-device-placeholder',
  source_store_id: 'store-placeholder',
  target_system: 'INVENTORY',
  event_type: 'STOCK_OBSERVATION_CANDIDATE',
  event_gate: 'REQUIRED',
  event_profile: 'STRICT_STATIC_OUTBOUND_EVENT',
});

function freezeFixture(fixture) {
  return Object.freeze({
    ...fixture,
    descriptor: Object.freeze({ ...fixture.descriptor }),
    expected: Object.freeze({ ...fixture.expected }),
  });
}

export const INVENTORY_PHASE14_FIXTURES = Object.freeze([
  freezeFixture({
    fixture_id: 'live_blocked',
    descriptor: { ...BASE, event_id: 'inventory-phase14-live', environment: 'LIVE' },
    expected: { environment: 'LIVE', status: INVENTORY_PHASE14_STATUS.BLOCKED, event_candidate: false, fields_present: true, live_blocked: true },
  }),
  freezeFixture({
    fixture_id: 'production_blocked',
    descriptor: { ...BASE, event_id: 'inventory-phase14-production', environment: 'PRODUCTION' },
    expected: { environment: 'PRODUCTION', status: INVENTORY_PHASE14_STATUS.BLOCKED, event_candidate: false, fields_present: true, live_blocked: true },
  }),
  freezeFixture({
    fixture_id: 'training_candidate',
    descriptor: { ...BASE, event_id: 'inventory-phase14-training', environment: 'TRAINING' },
    expected: { environment: 'TRAINING', status: INVENTORY_PHASE14_STATUS.CANDIDATE, event_candidate: true, fields_present: true, live_blocked: false },
  }),
  freezeFixture({
    fixture_id: 'test_candidate',
    descriptor: { ...BASE, event_id: 'inventory-phase14-test', environment: 'TEST' },
    expected: { environment: 'TEST', status: INVENTORY_PHASE14_STATUS.CANDIDATE, event_candidate: true, fields_present: true, live_blocked: false },
  }),
  freezeFixture({
    fixture_id: 'missing_field_blocked',
    descriptor: { ...BASE, event_id: 'inventory-phase14-missing', environment: 'TRAINING', event_type: '' },
    expected: { environment: 'TRAINING', status: INVENTORY_PHASE14_STATUS.BLOCKED, event_candidate: false, fields_present: false, live_blocked: false },
  }),
  freezeFixture({
    fixture_id: 'unknown_blocked',
    descriptor: { ...BASE, event_id: 'inventory-phase14-unknown', environment: 'UNKNOWN' },
    expected: { environment: 'UNKNOWN', status: INVENTORY_PHASE14_STATUS.BLOCKED, event_candidate: false, fields_present: true, live_blocked: false },
  }),
]);
