import { getInventoryBridgeRuntimeStatus } from './bridgeRuntimeStatusReporter.js';

export const INVENTORY_BRIDGE_DIAGNOSTIC_SCOPE = 'inventory_bridge_phase_4c_runtime_diagnostics';

function diagnosticCheck(name, passed, detail) {
  return Object.freeze({ name, passed: passed === true, detail });
}

export function getInventoryBridgeRuntimeDiagnostics(options = {}) {
  const runtimeStatus = getInventoryBridgeRuntimeStatus({
    configuration: options.configuration,
    requested_action: options.requested_action || 'diagnostics',
  });

  const checks = Object.freeze([
    diagnosticCheck('runtime_disabled', runtimeStatus.enabled === false, 'Runtime enabled flag must remain false.'),
    diagnosticCheck('runtime_not_ready', runtimeStatus.ready === false, 'Runtime ready flag must remain false.'),
    diagnosticCheck('runtime_non_operational', runtimeStatus.operational === false, 'Runtime operational flag must remain false.'),
    diagnosticCheck('network_unavailable', runtimeStatus.capabilities.network === false, 'No network capability is exposed.'),
    diagnosticCheck('writes_unavailable', runtimeStatus.capabilities.writes === false, 'No write capability is exposed.'),
    diagnosticCheck('sync_unavailable', runtimeStatus.capabilities.sync === false, 'No sync capability is exposed.'),
    diagnosticCheck('ingestion_unavailable', runtimeStatus.capabilities.ingestion === false, 'No ingestion capability is exposed.'),
    diagnosticCheck('replay_unavailable', runtimeStatus.capabilities.replay === false, 'No replay capability is exposed.'),
    diagnosticCheck('mutation_unavailable', runtimeStatus.capabilities.mutation === false, 'No mutation capability is exposed.'),
    diagnosticCheck('configuration_read_only', runtimeStatus.configuration_snapshot?.writable === false, 'Runtime configuration adapter is read-only.'),
  ]);

  return Object.freeze({
    scope: INVENTORY_BRIDGE_DIAGNOSTIC_SCOPE,
    passed: checks.every((check) => check.passed),
    runtime_status: runtimeStatus,
    checks,
  });
}
