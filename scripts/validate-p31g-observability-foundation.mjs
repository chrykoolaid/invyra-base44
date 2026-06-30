import { buildObservabilityFoundation } from '../src/inventory-bridge/observabilityFoundation/index.js';

const training = buildObservabilityFoundation('TRAINING');
const test = buildObservabilityFoundation('TEST');
const live = buildObservabilityFoundation('LIVE');
const production = buildObservabilityFoundation('PRODUCTION');
const unknown = buildObservabilityFoundation('UNKNOWN');

const checks = [
  Object.isFrozen(training),
  Object.isFrozen(training.health_summary_shape),
  Object.isFrozen(training.metrics_snapshot_shape),
  Object.isFrozen(training.diagnostic_note_shape),
  Object.isFrozen(training.log_reference_shape),
  Object.isFrozen(training.feature_flags),
  Object.isFrozen(training.disabled_operations),
  training.observability_foundation_ready === true,
  test.observability_foundation_ready === true,
  live.observability_foundation_ready === false,
  production.observability_foundation_ready === false,
  unknown.observability_foundation_ready === false,
  training.visibility_state === 'READY_DISABLED',
  live.visibility_state === 'BLOCKED',
  training.inventory_system_of_record === true,
  training.scanops_operational_layer_only === true,
  training.client_network_portable_bridge === true,
  training.desktop_first === true,
  training.local_first === true,
  training.offline_capable === true,
  training.foundation_only === true,
  training.hard_disabled === true,
  training.execution_disabled === true,
  training.health_summary_shape.created === false,
  training.health_summary_shape.collected === false,
  training.health_summary_shape.persisted === false,
  training.metrics_snapshot_shape.created === false,
  training.metrics_snapshot_shape.collected === false,
  training.metrics_snapshot_shape.persisted === false,
  training.diagnostic_note_shape.created === false,
  training.diagnostic_note_shape.collected === false,
  training.diagnostic_note_shape.persisted === false,
  training.log_reference_shape.created === false,
  training.log_reference_shape.written === false,
  training.log_reference_shape.persisted === false,
  training.feature_flags.health_summary_enabled === false,
  training.feature_flags.metrics_snapshot_enabled === false,
  training.feature_flags.diagnostic_notes_enabled === false,
  training.feature_flags.log_capture_enabled === false,
  training.feature_flags.operator_visibility_enabled === false,
  training.disabled_operations.collect_health === false,
  training.disabled_operations.collect_metrics === false,
  training.disabled_operations.collect_diagnostics === false,
  training.disabled_operations.write_log === false,
  training.disabled_operations.refresh_operator_view === false,
  training.disabled_operations.persist_observability_state === false,
  training.disabled_operations.call_transport === false,
  training.disabled_operations.write_inventory === false,
  training.disabled_operations.write_scanops === false,
  training.health_collection_attempted === false,
  training.metrics_collection_attempted === false,
  training.diagnostics_collection_attempted === false,
  training.log_write_attempted === false,
  training.operator_view_refreshed === false,
  training.observability_state_persisted === false,
  training.transport_called === false,
  training.network_call_attempted === false,
  training.inventory_write_allowed === false,
  training.scanops_write_allowed === false,
  training.stock_mutation_allowed === false,
  training.workflow_mutation_allowed === false,
  training.runtime_activation_allowed === false,
  training.persisted === false,
  training.write_attempted === false,
  training.mutation_attempted === false,
];

if (!checks.every(Boolean)) {
  throw new Error('P31-G validation failed');
}

console.log('P31-G Observability foundation passed.');
