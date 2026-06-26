import {
  INVENTORY_BRIDGE_TRAINING_HANDSHAKE_FIXTURES,
  INVENTORY_BRIDGE_TRAINING_HANDSHAKE_PHASE,
} from './trainingHandshakeFixtures.js';
import { getInventoryBridgeTrainingHandshakeReadinessResults } from './trainingHandshakeReadiness.js';

function diagnosticCheck(name, passed) {
  return Object.freeze({ name, passed: passed === true });
}

export function getInventoryBridgeTrainingHandshakeDiagnostics(fixtures = INVENTORY_BRIDGE_TRAINING_HANDSHAKE_FIXTURES) {
  const results = getInventoryBridgeTrainingHandshakeReadinessResults(fixtures);
  const liveResults = results.filter((result) => ['LIVE', 'PRODUCTION'].includes(result.readiness.environment));
  const trainingResults = results.filter((result) => ['TRAINING', 'TEST'].includes(result.readiness.environment));
  const checks = Object.freeze([
    diagnosticCheck('phase_marker', INVENTORY_BRIDGE_TRAINING_HANDSHAKE_PHASE === '7A/7C'),
    diagnosticCheck('fixtures_present', fixtures.length > 0),
    diagnosticCheck('all_results_passed', results.every((result) => result.passed)),
    diagnosticCheck('live_blocked', liveResults.every((result) => result.readiness.can_prepare_handshake === false && result.readiness.live_blocked === true)),
    diagnosticCheck('test_training_preparation_only', trainingResults.every((result) => result.readiness.can_prepare_handshake === true && result.readiness.non_production_only === true)),
    diagnosticCheck('no_connection', results.every((result) => result.readiness.can_connect === false && result.readiness.connection_attempted === false)),
    diagnosticCheck('no_network_check', results.every((result) => result.readiness.network_check_attempted === false)),
    diagnosticCheck('no_sync', results.every((result) => result.readiness.can_sync === false && result.readiness.sync_attempted === false)),
    diagnosticCheck('no_ingestion', results.every((result) => result.readiness.can_ingest === false && result.readiness.ingestion_attempted === false)),
    diagnosticCheck('no_outbox_processing', results.every((result) => result.readiness.can_process_outbox === false && result.readiness.outbox_processing_attempted === false)),
    diagnosticCheck('no_replay', results.every((result) => result.readiness.can_replay === false && result.readiness.replay_attempted === false)),
    diagnosticCheck('no_receipt', results.every((result) => result.readiness.can_emit_receipt === false && result.readiness.receipt_emitted === false)),
    diagnosticCheck('no_acknowledgement', results.every((result) => result.readiness.can_emit_acknowledgement === false && result.readiness.acknowledgement_emitted === false)),
    diagnosticCheck('no_write', results.every((result) => result.readiness.can_write === false && result.readiness.write_attempted === false)),
    diagnosticCheck('no_mutation', results.every((result) => result.readiness.can_mutate === false && result.readiness.mutation_attempted === false)),
  ]);

  return Object.freeze({
    component: 'inventory_bridge_test_training_handshake_read_only_diagnostics',
    phase: INVENTORY_BRIDGE_TRAINING_HANDSHAKE_PHASE,
    passed: checks.every((check) => check.passed),
    fixture_count: fixtures.length,
    live_blocked_count: liveResults.length,
    test_training_preparation_count: trainingResults.length,
    results,
    checks,
  });
}
