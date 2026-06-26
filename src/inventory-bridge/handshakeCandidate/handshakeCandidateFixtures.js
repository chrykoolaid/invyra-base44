export const INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_PHASE = '8A/8C';
export const INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_COMPONENT = 'inventory_bridge_test_training_handshake_candidate';

export const INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_STATUSES = Object.freeze({
  CANDIDATE_READY: 'CANDIDATE_READY',
  BLOCKED: 'BLOCKED',
  READ_ONLY: 'READ_ONLY',
});

export const INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_BLOCKERS = Object.freeze({
  LIVE_BLOCKED: 'live_environment_blocked',
  PRODUCTION_BLOCKED: 'production_environment_blocked',
  UNKNOWN_ENVIRONMENT: 'unknown_environment_blocked',
  FINALIZE_BLOCKED: 'finalize_blocked_in_phase_8',
  EXCHANGE_BLOCKED: 'exchange_blocked_in_phase_8',
  PERSIST_BLOCKED: 'persist_blocked_in_phase_8',
  WRITE_BLOCKED: 'write_blocked_in_phase_8',
  MUTATION_BLOCKED: 'mutation_blocked_in_phase_8',
});

function freezeArray(values) {
  return Object.freeze([...(values || [])]);
}

function freezeObject(value) {
  return Object.freeze({ ...(value || {}) });
}

function freezeFixture(fixture) {
  return Object.freeze({
    ...fixture,
    candidate_descriptor: freezeObject(fixture.candidate_descriptor),
    expected: Object.freeze({
      ...fixture.expected,
      blocked_reasons: freezeArray(fixture.expected.blocked_reasons),
    }),
  });
}

const BASE_CANDIDATE_DESCRIPTOR = Object.freeze({
  candidate_id: 'inventory-handshake-candidate-v1',
  phase: INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_PHASE,
  source_system: 'SCANOPS',
  source_device_id: 'scanops-device-placeholder',
  source_store_id: 'store-placeholder',
  target_system: 'INVENTORY',
  requested_capability: 'HANDSHAKE_CANDIDATE_EVIDENCE_ONLY',
  training_gate: 'REQUIRED',
  evidence_profile: 'STATIC_CANDIDATE_ONLY',
});

const REQUIRED_EVIDENCE_ONLY_EXPECTATION = Object.freeze({
  evidence_only: true,
  inventory_system_of_record: true,
  can_finalize: false,
  can_exchange: false,
  can_persist: false,
  can_write: false,
  can_mutate: false,
  finalized: false,
  exchanged: false,
  persisted: false,
  receipt_emitted: false,
  acknowledgement_emitted: false,
  write_attempted: false,
  mutation_attempted: false,
});

export const INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_FIXTURES = Object.freeze([
  freezeFixture({
    fixture_id: 'live_candidate_blocked',
    description: 'LIVE Inventory candidate remains blocked.',
    candidate_descriptor: {
      ...BASE_CANDIDATE_DESCRIPTOR,
      candidate_id: 'inventory-live-candidate-blocked-v1',
      environment: 'LIVE',
    },
    expected: {
      ...REQUIRED_EVIDENCE_ONLY_EXPECTATION,
      environment: 'LIVE',
      candidate_status: INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_STATUSES.BLOCKED,
      live_blocked: true,
      can_generate_candidate: false,
      blocked_reasons: [
        INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_BLOCKERS.LIVE_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_BLOCKERS.FINALIZE_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_BLOCKERS.EXCHANGE_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_BLOCKERS.PERSIST_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_BLOCKERS.WRITE_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_BLOCKERS.MUTATION_BLOCKED,
      ],
    },
  }),
  freezeFixture({
    fixture_id: 'training_candidate_ready',
    description: 'TRAINING Inventory candidate may be generated as evidence only.',
    candidate_descriptor: {
      ...BASE_CANDIDATE_DESCRIPTOR,
      candidate_id: 'inventory-training-candidate-v1',
      environment: 'TRAINING',
    },
    expected: {
      ...REQUIRED_EVIDENCE_ONLY_EXPECTATION,
      environment: 'TRAINING',
      candidate_status: INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_STATUSES.CANDIDATE_READY,
      live_blocked: false,
      can_generate_candidate: true,
      blocked_reasons: [
        INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_BLOCKERS.FINALIZE_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_BLOCKERS.EXCHANGE_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_BLOCKERS.PERSIST_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_BLOCKERS.WRITE_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_BLOCKERS.MUTATION_BLOCKED,
      ],
    },
  }),
  freezeFixture({
    fixture_id: 'test_candidate_ready',
    description: 'TEST Inventory candidate may be generated as evidence only.',
    candidate_descriptor: {
      ...BASE_CANDIDATE_DESCRIPTOR,
      candidate_id: 'inventory-test-candidate-v1',
      environment: 'TEST',
    },
    expected: {
      ...REQUIRED_EVIDENCE_ONLY_EXPECTATION,
      environment: 'TEST',
      candidate_status: INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_STATUSES.CANDIDATE_READY,
      live_blocked: false,
      can_generate_candidate: true,
      blocked_reasons: [
        INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_BLOCKERS.FINALIZE_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_BLOCKERS.EXCHANGE_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_BLOCKERS.PERSIST_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_BLOCKERS.WRITE_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_BLOCKERS.MUTATION_BLOCKED,
      ],
    },
  }),
  freezeFixture({
    fixture_id: 'production_candidate_blocked',
    description: 'PRODUCTION Inventory candidate remains blocked.',
    candidate_descriptor: {
      ...BASE_CANDIDATE_DESCRIPTOR,
      candidate_id: 'inventory-production-candidate-blocked-v1',
      environment: 'PRODUCTION',
    },
    expected: {
      ...REQUIRED_EVIDENCE_ONLY_EXPECTATION,
      environment: 'PRODUCTION',
      candidate_status: INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_STATUSES.BLOCKED,
      live_blocked: true,
      can_generate_candidate: false,
      blocked_reasons: [
        INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_BLOCKERS.PRODUCTION_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_BLOCKERS.FINALIZE_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_BLOCKERS.EXCHANGE_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_BLOCKERS.PERSIST_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_BLOCKERS.WRITE_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_BLOCKERS.MUTATION_BLOCKED,
      ],
    },
  }),
  freezeFixture({
    fixture_id: 'unknown_candidate_blocked',
    description: 'UNKNOWN Inventory candidate remains blocked.',
    candidate_descriptor: {
      ...BASE_CANDIDATE_DESCRIPTOR,
      candidate_id: 'inventory-unknown-candidate-blocked-v1',
      environment: 'UNKNOWN',
    },
    expected: {
      ...REQUIRED_EVIDENCE_ONLY_EXPECTATION,
      environment: 'UNKNOWN',
      candidate_status: INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_STATUSES.BLOCKED,
      live_blocked: false,
      can_generate_candidate: false,
      blocked_reasons: [
        INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_BLOCKERS.UNKNOWN_ENVIRONMENT,
        INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_BLOCKERS.FINALIZE_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_BLOCKERS.EXCHANGE_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_BLOCKERS.PERSIST_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_BLOCKERS.WRITE_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_BLOCKERS.MUTATION_BLOCKED,
      ],
    },
  }),
]);
