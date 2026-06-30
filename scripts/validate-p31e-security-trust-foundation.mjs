import { buildSecurityTrustFoundation } from '../src/inventory-bridge/securityTrustFoundation/index.js';

const training = buildSecurityTrustFoundation('TRAINING');
const test = buildSecurityTrustFoundation('TEST');
const live = buildSecurityTrustFoundation('LIVE');
const production = buildSecurityTrustFoundation('PRODUCTION');
const unknown = buildSecurityTrustFoundation('UNKNOWN');

const checks = [
  Object.isFrozen(training),
  Object.isFrozen(training.device_check_shape),
  Object.isFrozen(training.session_check_shape),
  Object.isFrozen(training.integrity_check_shape),
  Object.isFrozen(training.replay_guard_shape),
  Object.isFrozen(training.feature_flags),
  Object.isFrozen(training.disabled_operations),
  training.security_trust_foundation_ready === true,
  test.security_trust_foundation_ready === true,
  live.security_trust_foundation_ready === false,
  production.security_trust_foundation_ready === false,
  unknown.security_trust_foundation_ready === false,
  training.check_state === 'READY_DISABLED',
  live.check_state === 'BLOCKED',
  training.inventory_system_of_record === true,
  training.scanops_operational_layer_only === true,
  training.client_network_portable_bridge === true,
  training.desktop_first === true,
  training.local_first === true,
  training.offline_capable === true,
  training.foundation_only === true,
  training.hard_disabled === true,
  training.execution_disabled === true,
  training.device_check_shape.created === false,
  training.device_check_shape.checked === false,
  training.device_check_shape.persisted === false,
  training.session_check_shape.created === false,
  training.session_check_shape.checked === false,
  training.session_check_shape.persisted === false,
  training.integrity_check_shape.created === false,
  training.integrity_check_shape.checked === false,
  training.integrity_check_shape.persisted === false,
  training.replay_guard_shape.created === false,
  training.replay_guard_shape.checked === false,
  training.replay_guard_shape.persisted === false,
  training.feature_flags.device_check_enabled === false,
  training.feature_flags.session_check_enabled === false,
  training.feature_flags.integrity_check_enabled === false,
  training.feature_flags.replay_guard_enabled === false,
  training.feature_flags.approval_enabled === false,
  training.disabled_operations.check_device === false,
  training.disabled_operations.check_session === false,
  training.disabled_operations.check_integrity === false,
  training.disabled_operations.check_replay === false,
  training.disabled_operations.approve_device === false,
  training.disabled_operations.start_session === false,
  training.disabled_operations.persist_check_state === false,
  training.disabled_operations.call_transport === false,
  training.disabled_operations.write_inventory === false,
  training.disabled_operations.write_scanops === false,
  training.device_check_attempted === false,
  training.session_check_attempted === false,
  training.integrity_check_attempted === false,
  training.replay_check_attempted === false,
  training.device_approved === false,
  training.session_started === false,
  training.check_state_persisted === false,
  training.transport_called === false,
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
  throw new Error('P31-E validation failed');
}

console.log('P31-E Security trust foundation passed.');
