import { buildConnectionSetupFoundation } from '../src/inventory-bridge/connectionSetupFoundation/index.js';

const training = buildConnectionSetupFoundation('TRAINING');
const test = buildConnectionSetupFoundation('TEST');
const live = buildConnectionSetupFoundation('LIVE');
const production = buildConnectionSetupFoundation('PRODUCTION');
const unknown = buildConnectionSetupFoundation('UNKNOWN');

const checks = [
  Object.isFrozen(training),
  Object.isFrozen(training.setup_order),
  Object.isFrozen(training.local_lookup_reference_shape),
  Object.isFrozen(training.qr_reference_shape),
  Object.isFrozen(training.manual_host_reference_shape),
  Object.isFrozen(training.identity_reference_shape),
  Object.isFrozen(training.feature_flags),
  Object.isFrozen(training.disabled_operations),
  training.connection_setup_foundation_ready === true,
  test.connection_setup_foundation_ready === true,
  live.connection_setup_foundation_ready === false,
  production.connection_setup_foundation_ready === false,
  unknown.connection_setup_foundation_ready === false,
  training.inventory_system_of_record === true,
  training.scanops_operational_layer_only === true,
  training.client_network_portable_bridge === true,
  training.desktop_first === true,
  training.local_first === true,
  training.offline_capable === true,
  training.foundation_only === true,
  training.hard_disabled === true,
  training.execution_disabled === true,
  training.setup_order.length === 4,
  training.local_lookup_reference_shape.generated === false,
  training.local_lookup_reference_shape.used === false,
  training.local_lookup_reference_shape.persisted === false,
  training.qr_reference_shape.generated === false,
  training.qr_reference_shape.accepted === false,
  training.qr_reference_shape.persisted === false,
  training.manual_host_reference_shape.checked === false,
  training.manual_host_reference_shape.saved === false,
  training.manual_host_reference_shape.persisted === false,
  training.identity_reference_shape.checked === false,
  training.identity_reference_shape.persisted === false,
  training.feature_flags.local_lookup_enabled === false,
  training.feature_flags.qr_reference_enabled === false,
  training.feature_flags.manual_host_enabled === false,
  training.feature_flags.admin_setup_enabled === false,
  training.feature_flags.identity_check_enabled === false,
  training.disabled_operations.start_local_lookup === false,
  training.disabled_operations.create_qr_reference === false,
  training.disabled_operations.accept_qr_reference === false,
  training.disabled_operations.check_manual_host === false,
  training.disabled_operations.save_manual_host === false,
  training.disabled_operations.check_identity === false,
  training.disabled_operations.open_listener === false,
  training.disabled_operations.start_transport === false,
  training.disabled_operations.persist_setup_state === false,
  training.local_lookup_started === false,
  training.qr_reference_created === false,
  training.qr_reference_accepted === false,
  training.manual_host_checked === false,
  training.manual_host_saved === false,
  training.identity_checked === false,
  training.listener_active === false,
  training.transport_active === false,
  training.network_call_attempted === false,
  training.setup_state_persisted === false,
  training.inventory_write_allowed === false,
  training.scanops_write_allowed === false,
  training.runtime_activation_allowed === false,
  training.persisted === false,
  training.write_attempted === false,
  training.mutation_attempted === false,
];

if (!checks.every(Boolean)) {
  throw new Error('P31-B validation failed');
}

console.log('P31-B Connection setup foundation passed.');
