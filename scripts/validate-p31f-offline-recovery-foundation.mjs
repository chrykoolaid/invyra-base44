import { buildOfflineRecoveryFoundation } from '../src/inventory-bridge/offlineRecoveryFoundation/index.js';

const training = buildOfflineRecoveryFoundation('TRAINING');
const test = buildOfflineRecoveryFoundation('TEST');
const live = buildOfflineRecoveryFoundation('LIVE');
const production = buildOfflineRecoveryFoundation('PRODUCTION');
const unknown = buildOfflineRecoveryFoundation('UNKNOWN');

const checks = [
  Object.isFrozen(training),
  Object.isFrozen(training.offline_state_shape),
  Object.isFrozen(training.retry_policy_shape),
  Object.isFrozen(training.recovery_state_shape),
  Object.isFrozen(training.reconnect_reference_shape),
  Object.isFrozen(training.feature_flags),
  Object.isFrozen(training.disabled_operations),
  training.offline_recovery_foundation_ready === true,
  test.offline_recovery_foundation_ready === true,
  live.offline_recovery_foundation_ready === false,
  production.offline_recovery_foundation_ready === false,
  unknown.offline_recovery_foundation_ready === false,
  training.recovery_state === 'READY_DISABLED',
  live.recovery_state === 'BLOCKED',
  training.inventory_system_of_record === true,
  training.scanops_operational_layer_only === true,
  training.client_network_portable_bridge === true,
  training.desktop_first === true,
  training.local_first === true,
  training.offline_capable === true,
  training.foundation_only === true,
  training.hard_disabled === true,
  training.execution_disabled === true,
  training.offline_state_shape.created === false,
  training.offline_state_shape.active === false,
  training.offline_state_shape.persisted === false,
  training.retry_policy_shape.created === false,
  training.retry_policy_shape.scheduled === false,
  training.retry_policy_shape.persisted === false,
  training.recovery_state_shape.created === false,
  training.recovery_state_shape.executed === false,
  training.recovery_state_shape.persisted === false,
  training.reconnect_reference_shape.created === false,
  training.reconnect_reference_shape.attempted === false,
  training.reconnect_reference_shape.persisted === false,
  training.feature_flags.offline_state_enabled === false,
  training.feature_flags.local_queue_enabled === false,
  training.feature_flags.retry_policy_enabled === false,
  training.feature_flags.recovery_enabled === false,
  training.feature_flags.reconnect_enabled === false,
  training.feature_flags.queue_replay_enabled === false,
  training.disabled_operations.create_offline_state === false,
  training.disabled_operations.persist_offline_state === false,
  training.disabled_operations.create_retry_policy === false,
  training.disabled_operations.schedule_retry === false,
  training.disabled_operations.execute_recovery === false,
  training.disabled_operations.attempt_reconnect === false,
  training.disabled_operations.replay_queue === false,
  training.disabled_operations.call_transport === false,
  training.disabled_operations.write_inventory === false,
  training.disabled_operations.write_scanops === false,
  training.offline_state_created === false,
  training.offline_state_persisted === false,
  training.retry_policy_created === false,
  training.retry_scheduled === false,
  training.recovery_executed === false,
  training.reconnect_attempted === false,
  training.queue_replay_attempted === false,
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
  throw new Error('P31-F validation failed');
}

console.log('P31-F Offline recovery foundation passed.');
