import {
  INVENTORY_BRIDGE_TRAINING_HANDSHAKE_BLOCKERS,
  INVENTORY_BRIDGE_TRAINING_HANDSHAKE_COMPONENT,
  INVENTORY_BRIDGE_TRAINING_HANDSHAKE_FIXTURES,
  INVENTORY_BRIDGE_TRAINING_HANDSHAKE_PHASE,
  INVENTORY_BRIDGE_TRAINING_HANDSHAKE_STATUSES,
} from './trainingHandshakeFixtures.js';

const TRAINING_ENVIRONMENTS = Object.freeze(['TRAINING', 'TEST']);
const LIVE_ENVIRONMENTS = Object.freeze(['LIVE', 'PRODUCTION']);

function normalizeEnvironment(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : 'UNKNOWN';
}

function freezeArray(values) {
  return Object.freeze([...(values || [])]);
}

function uniqueReasons(reasons) {
  return freezeArray([...new Set(reasons.filter(Boolean))]);
}

function check(name, passed) {
  return Object.freeze({ name, passed: passed === true });
}

function environmentBlockers(environment) {
  if (environment === 'LIVE') return [INVENTORY_BRIDGE_TRAINING_HANDSHAKE_BLOCKERS.LIVE_BLOCKED];
  if (environment === 'PRODUCTION') return [INVENTORY_BRIDGE_TRAINING_HANDSHAKE_BLOCKERS.PRODUCTION_BLOCKED];
  if (!TRAINING_ENVIRONMENTS.includes(environment)) return [INVENTORY_BRIDGE_TRAINING_HANDSHAKE_BLOCKERS.UNKNOWN_ENVIRONMENT];
  return [];
}

export function buildInventoryBridgeTrainingHandshakeReadiness(input = {}) {
  const descriptor = Object.freeze({ ...(input.handshake_descriptor || input.handshakeDescriptor || input) });
  const environment = normalizeEnvironment(descriptor.environment);
  const preparationAllowed = TRAINING_ENVIRONMENTS.includes(environment);
  const liveBlocked = LIVE_ENVIRONMENTS.includes(environment);

  const blockedReasons = uniqueReasons([
    ...environmentBlockers(environment),
    INVENTORY_BRIDGE_TRAINING_HANDSHAKE_BLOCKERS.PRODUCTION_TRANSPORT_BLOCKED,
    INVENTORY_BRIDGE_TRAINING_HANDSHAKE_BLOCKERS.CONNECTION_BLOCKED,
    INVENTORY_BRIDGE_TRAINING_HANDSHAKE_BLOCKERS.SYNC_BLOCKED,
    INVENTORY_BRIDGE_TRAINING_HANDSHAKE_BLOCKERS.INGESTION_BLOCKED,
    INVENTORY_BRIDGE_TRAINING_HANDSHAKE_BLOCKERS.RECEIPT_BLOCKED,
    INVENTORY_BRIDGE_TRAINING_HANDSHAKE_BLOCKERS.ACKNOWLEDGEMENT_BLOCKED,
    INVENTORY_BRIDGE_TRAINING_HANDSHAKE_BLOCKERS.WRITE_BLOCKED,
    INVENTORY_BRIDGE_TRAINING_HANDSHAKE_BLOCKERS.MUTATION_BLOCKED,
  ]);

  return Object.freeze({
    component: INVENTORY_BRIDGE_TRAINING_HANDSHAKE_COMPONENT,
    phase: INVENTORY_BRIDGE_TRAINING_HANDSHAKE_PHASE,
    handshake_id: descriptor.handshake_id || 'inventory-handshake-preparation-unidentified',
    handshake_mode: descriptor.handshake_mode || 'TEST_TRAINING_PREPARATION_ONLY',
    environment,
    source_system: descriptor.source_system || 'SCANOPS',
    target_system: descriptor.target_system || 'INVENTORY',
    source_device_id: descriptor.source_device_id || null,
    source_store_id: descriptor.source_store_id || null,
    requested_capability: descriptor.requested_capability || 'HANDSHAKE_READINESS_ONLY',
    handshake_preparation_status: preparationAllowed
      ? INVENTORY_BRIDGE_TRAINING_HANDSHAKE_STATUSES.PREPARATION_ALLOWED
      : INVENTORY_BRIDGE_TRAINING_HANDSHAKE_STATUSES.BLOCKED,
    diagnostics_status: INVENTORY_BRIDGE_TRAINING_HANDSHAKE_STATUSES.READ_ONLY,
    non_production_only: true,
    live_blocked: liveBlocked,
    can_prepare_handshake: preparationAllowed,
    can_connect: false,
    can_sync: false,
    can_ingest: false,
    can_process_outbox: false,
    can_replay: false,
    can_emit_receipt: false,
    can_emit_acknowledgement: false,
    can_write: false,
    can_mutate: false,
    connection_attempted: false,
    network_check_attempted: false,
    sync_attempted: false,
    ingestion_attempted: false,
    outbox_processing_attempted: false,
    replay_attempted: false,
    receipt_emitted: false,
    acknowledgement_emitted: false,
    write_attempted: false,
    mutation_attempted: false,
    blocked_reasons: blockedReasons,
    handshake_descriptor: descriptor,
  });
}

export function projectInventoryBridgeTrainingHandshakeReadinessResult(fixture) {
  const readiness = buildInventoryBridgeTrainingHandshakeReadiness({
    handshake_descriptor: fixture.handshake_descriptor,
  });

  const checks = Object.freeze([
    check('environment', readiness.environment === fixture.expected.environment),
    check('status', readiness.handshake_preparation_status === fixture.expected.handshake_preparation_status),
    check('live_blocked', readiness.live_blocked === fixture.expected.live_blocked),
    check('can_prepare_handshake', readiness.can_prepare_handshake === fixture.expected.can_prepare_handshake),
    check('non_production_only', readiness.non_production_only === true),
    check('blocked_reasons', fixture.expected.blocked_reasons.every((reason) => readiness.blocked_reasons.includes(reason))),
    check('no_connection', readiness.can_connect === false && readiness.connection_attempted === false),
    check('no_network_check', readiness.network_check_attempted === false),
    check('no_sync', readiness.can_sync === false && readiness.sync_attempted === false),
    check('no_ingestion', readiness.can_ingest === false && readiness.ingestion_attempted === false),
    check('no_outbox_processing', readiness.can_process_outbox === false && readiness.outbox_processing_attempted === false),
    check('no_replay', readiness.can_replay === false && readiness.replay_attempted === false),
    check('no_receipt', readiness.can_emit_receipt === false && readiness.receipt_emitted === false),
    check('no_acknowledgement', readiness.can_emit_acknowledgement === false && readiness.acknowledgement_emitted === false),
    check('no_write', readiness.can_write === false && readiness.write_attempted === false),
    check('no_mutation', readiness.can_mutate === false && readiness.mutation_attempted === false),
  ]);

  return Object.freeze({
    fixture_id: fixture.fixture_id,
    description: fixture.description,
    expected: fixture.expected,
    readiness,
    passed: checks.every((item) => item.passed),
    checks,
  });
}

export function getInventoryBridgeTrainingHandshakeReadinessResults(fixtures = INVENTORY_BRIDGE_TRAINING_HANDSHAKE_FIXTURES) {
  return Object.freeze(fixtures.map(projectInventoryBridgeTrainingHandshakeReadinessResult));
}
