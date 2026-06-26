export const INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_PHASE = '9A/9C';
export const INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_COMPONENT = 'inventory_bridge_test_training_handshake_evidence';

export const INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_STATUSES = Object.freeze({
  EVIDENCE_READY: 'EVIDENCE_READY',
  BLOCKED: 'BLOCKED',
  READ_ONLY: 'READ_ONLY',
});

export const INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_BLOCKERS = Object.freeze({
  LIVE_BLOCKED: 'live_environment_blocked',
  PRODUCTION_BLOCKED: 'production_environment_blocked',
  UNKNOWN_ENVIRONMENT: 'unknown_environment_blocked',
  REQUIRED_FIELDS_MISSING: 'required_fields_missing',
  PEER_ACCEPTANCE_BLOCKED: 'peer_acceptance_blocked_in_phase_9',
  COMPLETE_BLOCKED: 'completion_blocked_in_phase_9',
  PERSIST_BLOCKED: 'persist_blocked_in_phase_9',
  WRITE_BLOCKED: 'write_blocked_in_phase_9',
  MUTATION_BLOCKED: 'mutation_blocked_in_phase_9',
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
    evidence_descriptor: freezeObject(fixture.evidence_descriptor),
    expected: Object.freeze({
      ...fixture.expected,
      blocked_reasons: freezeArray(fixture.expected.blocked_reasons),
    }),
  });
}

const BASE_EVIDENCE_DESCRIPTOR = Object.freeze({
  evidence_id: 'inventory-handshake-evidence-v1',
  phase: INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_PHASE,
  source_system: 'SCANOPS',
  source_device_id: 'scanops-device-placeholder',
  source_store_id: 'store-placeholder',
  target_system: 'INVENTORY',
  training_gate: 'REQUIRED',
  evidence_profile: 'STRICT_STATIC_EVIDENCE',
  candidate_id: 'candidate-placeholder',
  candidate_key: 'candidate-key-placeholder',
});

const REQUIRED_EVIDENCE_ONLY_EXPECTATION = Object.freeze({
  evidence_only: true,
  inventory_system_of_record: true,
  can_accept_peer: false,
  can_complete_handshake: false,
  can_persist: false,
  can_write: false,
  can_mutate: false,
  peer_accepted: false,
  handshake_completed: false,
  persisted: false,
  receipt_emitted: false,
  acknowledgement_emitted: false,
  write_attempted: false,
  mutation_attempted: false,
});

export const INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_REQUIRED_FIELDS = Object.freeze([
  'evidence_id',
  'environment',
  'source_system',
  'source_device_id',
  'source_store_id',
  'target_system',
  'training_gate',
  'evidence_profile',
  'candidate_id',
  'candidate_key',
]);

export const INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_FIXTURES = Object.freeze([
  freezeFixture({
    fixture_id: 'live_evidence_blocked',
    description: 'LIVE Inventory evidence remains blocked.',
    evidence_descriptor: {
      ...BASE_EVIDENCE_DESCRIPTOR,
      evidence_id: 'inventory-live-evidence-blocked-v1',
      environment: 'LIVE',
    },
    expected: {
      ...REQUIRED_EVIDENCE_ONLY_EXPECTATION,
      environment: 'LIVE',
      evidence_status: INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_STATUSES.BLOCKED,
      live_blocked: true,
      can_build_evidence: false,
      required_fields_present: true,
      blocked_reasons: [
        INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_BLOCKERS.LIVE_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_BLOCKERS.PEER_ACCEPTANCE_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_BLOCKERS.COMPLETE_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_BLOCKERS.PERSIST_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_BLOCKERS.WRITE_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_BLOCKERS.MUTATION_BLOCKED,
      ],
    },
  }),
  freezeFixture({
    fixture_id: 'training_evidence_ready',
    description: 'TRAINING Inventory evidence may be built as evidence only.',
    evidence_descriptor: {
      ...BASE_EVIDENCE_DESCRIPTOR,
      evidence_id: 'inventory-training-evidence-v1',
      environment: 'TRAINING',
    },
    expected: {
      ...REQUIRED_EVIDENCE_ONLY_EXPECTATION,
      environment: 'TRAINING',
      evidence_status: INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_STATUSES.EVIDENCE_READY,
      live_blocked: false,
      can_build_evidence: true,
      required_fields_present: true,
      blocked_reasons: [
        INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_BLOCKERS.PEER_ACCEPTANCE_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_BLOCKERS.COMPLETE_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_BLOCKERS.PERSIST_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_BLOCKERS.WRITE_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_BLOCKERS.MUTATION_BLOCKED,
      ],
    },
  }),
  freezeFixture({
    fixture_id: 'test_evidence_ready',
    description: 'TEST Inventory evidence may be built as evidence only.',
    evidence_descriptor: {
      ...BASE_EVIDENCE_DESCRIPTOR,
      evidence_id: 'inventory-test-evidence-v1',
      environment: 'TEST',
    },
    expected: {
      ...REQUIRED_EVIDENCE_ONLY_EXPECTATION,
      environment: 'TEST',
      evidence_status: INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_STATUSES.EVIDENCE_READY,
      live_blocked: false,
      can_build_evidence: true,
      required_fields_present: true,
      blocked_reasons: [
        INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_BLOCKERS.PEER_ACCEPTANCE_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_BLOCKERS.COMPLETE_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_BLOCKERS.PERSIST_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_BLOCKERS.WRITE_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_BLOCKERS.MUTATION_BLOCKED,
      ],
    },
  }),
  freezeFixture({
    fixture_id: 'production_evidence_blocked',
    description: 'PRODUCTION Inventory evidence remains blocked.',
    evidence_descriptor: {
      ...BASE_EVIDENCE_DESCRIPTOR,
      evidence_id: 'inventory-production-evidence-blocked-v1',
      environment: 'PRODUCTION',
    },
    expected: {
      ...REQUIRED_EVIDENCE_ONLY_EXPECTATION,
      environment: 'PRODUCTION',
      evidence_status: INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_STATUSES.BLOCKED,
      live_blocked: true,
      can_build_evidence: false,
      required_fields_present: true,
      blocked_reasons: [
        INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_BLOCKERS.PRODUCTION_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_BLOCKERS.PEER_ACCEPTANCE_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_BLOCKERS.COMPLETE_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_BLOCKERS.PERSIST_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_BLOCKERS.WRITE_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_BLOCKERS.MUTATION_BLOCKED,
      ],
    },
  }),
  freezeFixture({
    fixture_id: 'missing_required_field_blocked',
    description: 'Missing candidate key blocks Inventory evidence.',
    evidence_descriptor: {
      ...BASE_EVIDENCE_DESCRIPTOR,
      evidence_id: 'inventory-missing-field-evidence-blocked-v1',
      environment: 'TRAINING',
      candidate_key: '',
    },
    expected: {
      ...REQUIRED_EVIDENCE_ONLY_EXPECTATION,
      environment: 'TRAINING',
      evidence_status: INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_STATUSES.BLOCKED,
      live_blocked: false,
      can_build_evidence: false,
      required_fields_present: false,
      blocked_reasons: [
        INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_BLOCKERS.REQUIRED_FIELDS_MISSING,
        INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_BLOCKERS.PEER_ACCEPTANCE_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_BLOCKERS.COMPLETE_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_BLOCKERS.PERSIST_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_BLOCKERS.WRITE_BLOCKED,
        INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_BLOCKERS.MUTATION_BLOCKED,
      ],
    },
  }),
]);
