import {
  INVENTORY_BRIDGE_LOCAL_TRANSPORT_FIXTURES,
  INVENTORY_BRIDGE_LOCAL_TRANSPORT_PHASE,
} from './localTransportFixtures.js';
import { getInventoryBridgeLocalTransportPreflightResults } from './localTransportPreflight.js';

function diagnosticCheck(name, passed) {
  return Object.freeze({ name, passed: passed === true });
}

export function getInventoryBridgeLocalTransportDiagnostics(fixtures = INVENTORY_BRIDGE_LOCAL_TRANSPORT_FIXTURES) {
  const results = getInventoryBridgeLocalTransportPreflightResults(fixtures);
  const checks = Object.freeze([
    diagnosticCheck('phase_marker', INVENTORY_BRIDGE_LOCAL_TRANSPORT_PHASE === '6A/6C'),
    diagnosticCheck('fixtures_present', fixtures.length > 0),
    diagnosticCheck('all_results_passed', results.every((result) => result.passed)),
    diagnosticCheck('bridge_disabled', results.every((result) => result.preflight.bridge_enabled === false)),
    diagnosticCheck('activation_blocked', results.every((result) => result.preflight.can_activate === false)),
    diagnosticCheck('transport_non_operational', results.every((result) => result.preflight.transport_status === 'NON_OPERATIONAL')),
    diagnosticCheck('preflight_blocked', results.every((result) => result.preflight.preflight_status === 'BLOCKED')),
    diagnosticCheck('no_transport_attempt', results.every((result) => result.preflight.transport_attempted === false)),
    diagnosticCheck('no_network_check', results.every((result) => result.preflight.network_check_attempted === false)),
    diagnosticCheck('no_port_binding', results.every((result) => result.preflight.port_bound === false)),
    diagnosticCheck('no_inbound_channel', results.every((result) => result.preflight.inbound_channel_started === false)),
    diagnosticCheck('no_outbound_channel', results.every((result) => result.preflight.outbound_channel_started === false)),
    diagnosticCheck('no_sync', results.every((result) => result.preflight.sync_attempted === false)),
    diagnosticCheck('no_ingestion', results.every((result) => result.preflight.ingestion_attempted === false)),
    diagnosticCheck('no_outbox_processing', results.every((result) => result.preflight.outbox_processing_attempted === false)),
    diagnosticCheck('no_replay', results.every((result) => result.preflight.replay_attempted === false)),
    diagnosticCheck('no_receipt', results.every((result) => result.preflight.receipt_emitted === false)),
    diagnosticCheck('no_acknowledgement', results.every((result) => result.preflight.acknowledgement_emitted === false)),
    diagnosticCheck('no_write', results.every((result) => result.preflight.write_attempted === false)),
    diagnosticCheck('no_mutation', results.every((result) => result.preflight.mutation_attempted === false)),
  ]);

  return Object.freeze({
    component: 'inventory_bridge_local_transport_read_only_diagnostics',
    phase: INVENTORY_BRIDGE_LOCAL_TRANSPORT_PHASE,
    passed: checks.every((check) => check.passed),
    fixture_count: fixtures.length,
    results,
    checks,
  });
}
