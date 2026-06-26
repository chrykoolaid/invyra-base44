import { INVENTORY_BRIDGE_DRY_RUN_HANDOFF_FIXTURES, INVENTORY_BRIDGE_DRY_RUN_HANDOFF_PHASE } from './dryRunHandoffFixtures.js';
import { getInventoryBridgeDryRunHandoffResults } from './dryRunHandoffProjection.js';

function diagnosticCheck(name, passed) {
  return Object.freeze({ name, passed: passed === true });
}

export function getInventoryBridgeDryRunHandoffDiagnostics(fixtures = INVENTORY_BRIDGE_DRY_RUN_HANDOFF_FIXTURES) {
  const results = getInventoryBridgeDryRunHandoffResults(fixtures);
  const checks = Object.freeze([
    diagnosticCheck('phase_marker', INVENTORY_BRIDGE_DRY_RUN_HANDOFF_PHASE === '5D'),
    diagnosticCheck('fixtures_present', fixtures.length > 0),
    diagnosticCheck('all_results_passed', results.every((result) => result.passed)),
    diagnosticCheck('runtime_disabled', results.every((result) => result.dry_run.runtime_enabled === false && result.dry_run.runtime_ready === false && result.dry_run.runtime_operational === false)),
    diagnosticCheck('no_transport', results.every((result) => result.dry_run.transport_attempted === false)),
    diagnosticCheck('no_ingestion', results.every((result) => result.dry_run.ingestion_attempted === false)),
    diagnosticCheck('no_outbox_processing', results.every((result) => result.dry_run.outbox_processing_attempted === false)),
    diagnosticCheck('no_replay', results.every((result) => result.dry_run.replay_attempted === false)),
    diagnosticCheck('no_inventory_call', results.every((result) => result.dry_run.inventory_call_attempted === false)),
    diagnosticCheck('no_ledger_write', results.every((result) => result.dry_run.ledger_write_attempted === false)),
    diagnosticCheck('no_receipt', results.every((result) => result.dry_run.receipt_emitted === false)),
    diagnosticCheck('no_acknowledgement', results.every((result) => result.dry_run.acknowledgement_emitted === false)),
    diagnosticCheck('no_mutation', results.every((result) => result.dry_run.mutation_attempted === false && result.dry_run.mutating === false)),
    diagnosticCheck('not_ingestible', results.every((result) => result.dry_run.ingestible === false)),
    diagnosticCheck('not_persistable', results.every((result) => result.dry_run.persistable === false)),
    diagnosticCheck('not_writable', results.every((result) => result.dry_run.writable === false)),
    diagnosticCheck('not_replayable', results.every((result) => result.dry_run.replayable === false)),
  ]);

  return Object.freeze({
    component: 'inventory_bridge_dry_run_handoff_diagnostics',
    phase: INVENTORY_BRIDGE_DRY_RUN_HANDOFF_PHASE,
    passed: checks.every((check) => check.passed),
    fixture_count: fixtures.length,
    results,
    checks,
  });
}
