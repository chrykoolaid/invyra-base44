import { buildTransportFoundation } from '../src/inventory-bridge/transportFoundation/index.js';

const training = buildTransportFoundation('TRAINING');
const test = buildTransportFoundation('TEST');
const live = buildTransportFoundation('LIVE');
const production = buildTransportFoundation('PRODUCTION');
const unknown = buildTransportFoundation('UNKNOWN');

const checks = [
  Object.isFrozen(training),
  Object.isFrozen(training.abstraction_shape),
  Object.isFrozen(training.lifecycle_shape),
  Object.isFrozen(training.lifecycle_shape.allowed_states),
  Object.isFrozen(training.feature_flags),
  Object.isFrozen(training.disabled_operations),
  training.transport_foundation_ready === true,
  test.transport_foundation_ready === true,
  live.transport_foundation_ready === false,
  production.transport_foundation_ready === false,
  unknown.transport_foundation_ready === false,
  training.transport_state === 'READY_DISABLED',
  live.transport_state === 'BLOCKED',
  training.inventory_system_of_record === true,
  training.scanops_operational_layer_only === true,
  training.client_network_portable_bridge === true,
  training.desktop_first === true,
  training.local_first === true,
  training.offline_capable === true,
  training.foundation_only === true,
  training.hard_disabled === true,
  training.execution_disabled === true,
  training.abstraction_shape.created === false,
  training.abstraction_shape.connected === false,
  training.abstraction_shape.persisted === false,
  training.lifecycle_shape.executable_state_present === false,
  training.lifecycle_shape.send_state_present === false,
  training.lifecycle_shape.receive_state_present === false,
  training.feature_flags.transport_enabled === false,
  training.feature_flags.connection_lifecycle_enabled === false,
  training.feature_flags.session_establishment_enabled === false,
  training.feature_flags.outbound_enabled === false,
  training.feature_flags.inbound_enabled === false,
  training.feature_flags.listener_enabled === false,
  training.feature_flags.polling_enabled === false,
  training.disabled_operations.create_adapter === false,
  training.disabled_operations.start_transport === false,
  training.disabled_operations.establish_session === false,
  training.disabled_operations.open_listener === false,
  training.disabled_operations.start_polling === false,
  training.disabled_operations.send_event === false,
  training.disabled_operations.receive_event === false,
  training.disabled_operations.persist_connection_state === false,
  training.disabled_operations.process_business_payload === false,
  training.adapter_created === false,
  training.transport_started === false,
  training.session_established === false,
  training.listener_active === false,
  training.polling_active === false,
  training.outbound_attempted === false,
  training.inbound_attempted === false,
  training.connection_state_persisted === false,
  training.business_payload_processed === false,
  training.network_call_attempted === false,
  training.inventory_write_allowed === false,
  training.scanops_write_allowed === false,
  training.runtime_activation_allowed === false,
  training.persisted === false,
  training.write_attempted === false,
  training.mutation_attempted === false,
];

if (!checks.every(Boolean)) {
  throw new Error('P31-C validation failed');
}

console.log('P31-C Transport foundation passed.');
